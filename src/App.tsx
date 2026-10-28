import React, { useState, useEffect } from 'react';
import {
  CurrencyCode,
  CURRENCIES,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  RecentChangeItem,
  STANDARD_SHEET_FORMATS,
} from './types/graphic';
import { calculateImpositionOptions } from './utils/imposition';
import { calculateFlexoQuote, calculateOffsetQuote } from './utils/quoteCalculator';
import {
  INITIAL_FLEXO_PARAMS,
  INITIAL_OFFSET_PARAMS,
  JOB_PRESETS,
} from './utils/presets';
import { detectFlexoChanges, detectOffsetChanges } from './utils/changeTracker';
import { Header } from './components/Header';
import { OffsetCalculator } from './components/OffsetCalculator';
import { FlexoCalculator } from './components/FlexoCalculator';
import { QuotationSummary } from './components/QuotationSummary';
import { ClientOrderTab } from './components/ClientOrderTab';
import { MachinesPlatesTab } from './components/MachinesPlatesTab';
import { SavedProject, SavedQuotesModal } from './components/SavedQuotesModal';
import { SavedWorkOrdersModal } from './components/SavedWorkOrdersModal';
import { CorrelativeConfigModal } from './components/CorrelativeConfigModal';
import { QuickPresetsModal } from './components/QuickPresetsModal';
import { WorkshopTools } from './components/WorkshopTools';
import { WorkOrderTab } from './components/WorkOrderTab';
import { AuthWelcomeScreen } from './components/AuthWelcomeScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { SubscriptionExpiredScreen } from './components/SubscriptionExpiredScreen';
import { AuthSession, UserAccount, UserRole } from './types/user';
import { getSession, clearSession, syncWithCloudDatabase, createDirectSession } from './utils/authService';
import { logOutFromFirebase, ensureFirebaseAuth, saveQuoteToFirestore } from './utils/firebase';
import { syncWindingDefinitionsWithCloud } from './utils/windingConfigService';
import { syncCorrelativeWithCloud, getNextQuoteNumber } from './utils/correlativeService';
import {
  checkUserSubscription,
  getAdminContactConfig,
  getWhatsAppContactUrl,
} from './utils/subscriptionUtils';
import {
  SlidersHorizontal,
  FileText,
  Wrench,
  Clock,
  Sparkles,
  Layers,
  Disc,
  User,
  Printer,
  Factory,
} from 'lucide-react';

export default function App() {
  // Siempre que se abre la app, iniciar en la pantalla de inicio para colocar usuario y PIN
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Sincronizar usuarios y sentidos de bobinado desde la nube para asegurar disponibilidad en todos los computadores
  useEffect(() => {
    // Al abrir la app, limpiar la sesión guardada para garantizar que siempre se solicite usuario y PIN
    clearSession();
    ensureFirebaseAuth().catch(() => {});
    syncWithCloudDatabase().catch(() => {});
    syncWindingDefinitionsWithCloud().catch(() => {});
    syncCorrelativeWithCloud().catch(() => {});
  }, []);

  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('aravo_app_name') || 'ARAVO';
  });
  const [appSubtitle, setAppSubtitle] = useState(() => {
    return localStorage.getItem('aravo_app_sub') || 'Aravo = Tiempo / Hora en Guaraní • Presupuestos de Flexografía (Bobina)';
  });

  const handleUpdateAppName = (name: string) => {
    setAppName(name);
    localStorage.setItem('aravo_app_name', name);
  };

  const handleUpdateAppSubtitle = (sub: string) => {
    setAppSubtitle(sub);
    localStorage.setItem('aravo_app_sub', sub);
  };

  const [technology, setTechnology] = useState<PrintTechnology>('flexo');
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [activeMainTab, setActiveMainTab] = useState<
    'client_order' | 'machines_plates' | 'calculator' | 'quotation' | 'work_order' | 'tools'
  >('calculator');

  // Parameters
  const [offsetParams, setOffsetParams] = useState<OffsetJobParams>({ ...INITIAL_OFFSET_PARAMS });
  const [flexoParams, setFlexoParams] = useState<FlexoJobParams>({ ...INITIAL_FLEXO_PARAMS });

  // Recent Changes Audit Log (Last 5 modified parameters)
  const [recentChanges, setRecentChanges] = useState<RecentChangeItem[]>([
    {
      id: 'chg_init_1',
      timestamp: '17:15:20',
      parameter: 'Tirada en Bobina',
      category: 'commercial',
      previousValue: '1.000 m²',
      newValue: '1.500 m²',
    },
    {
      id: 'chg_init_2',
      timestamp: '17:18:45',
      parameter: 'Ancho de Bobina',
      category: 'dimensions',
      previousValue: '250 mm',
      newValue: '330 mm',
    },
    {
      id: 'chg_init_3',
      timestamp: '17:22:10',
      parameter: 'Sustrato de Impresión',
      category: 'materials',
      previousValue: 'Papel 80g',
      newValue: 'BOPP Blanco 50µ',
    },
  ]);

  const handleOffsetParamsChange = (newParams: OffsetJobParams) => {
    const change = detectOffsetChanges(offsetParams, newParams);
    if (change) {
      setRecentChanges((prev) => [
        change,
        ...prev.filter((c) => c.parameter !== change.parameter),
      ].slice(0, 5));
    }
    setOffsetParams(newParams);
  };

  const handleFlexoParamsChange = (newParams: FlexoJobParams) => {
    const change = detectFlexoChanges(flexoParams, newParams);
    if (change) {
      setRecentChanges((prev) => [
        change,
        ...prev.filter((c) => c.parameter !== change.parameter),
      ].slice(0, 5));
    }
    setFlexoParams(newParams);
  };

  const handleClearRecentChanges = () => {
    setRecentChanges([]);
  };

  // Modals & Active Edit tracking
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isSavedWorkOrdersOpen, setIsSavedWorkOrdersOpen] = useState(false);
  const [isCorrelativeModalOpen, setIsCorrelativeModalOpen] = useState(false);
  const [currentlyLoadedQuoteId, setCurrentlyLoadedQuoteId] = useState<string | null>(null);
  const [currentlyLoadedQuoteName, setCurrentlyLoadedQuoteName] = useState<string | null>(null);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('flexo_labels_roll');

  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;

  // Active Quote Calculation
  const offsetArrangements = calculateImpositionOptions({
    sheetWidth: offsetParams.sheetWidthMm,
    sheetHeight: offsetParams.sheetHeightMm,
    pieceWidth: offsetParams.pieceWidthMm,
    pieceHeight: offsetParams.pieceHeightMm,
    bleed: offsetParams.bleedMm,
    gutter: offsetParams.gutterMm,
    gripperMargin: offsetParams.gripperMarginMm,
    nonGripperMargin: offsetParams.nonGripperMarginMm,
    customPosesCount: offsetParams.customPosesCount,
    customPosesX: offsetParams.customPosesX,
    customPosesY: offsetParams.customPosesY,
    isCustomPosesActive: offsetParams.isCustomPosesActive,
  });

  const activeOffsetArrangement =
    offsetParams.selectedOrientation && offsetArrangements[offsetParams.selectedOrientation]
      ? offsetArrangements[offsetParams.selectedOrientation]
      : offsetArrangements.optimal;

  const offsetQuote = calculateOffsetQuote(offsetParams, activeOffsetArrangement);
  const flexoQuote = calculateFlexoQuote(flexoParams);

  const activeBreakdown = technology === 'offset' ? offsetQuote.breakdown : flexoQuote.breakdown;

  // Preset Handler supporting all 30 templates and manual blank mode
  const handleSelectPreset = (presetId: string, manualTech?: PrintTechnology) => {
    const preset = JOB_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    const targetTech: PrintTechnology =
      preset.id === 'manual_blank' && manualTech ? manualTech : preset.tech;
    setTechnology(targetTech);

    // Record change in audit log
    setRecentChanges((prev) => [
      {
        id: `chg_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        parameter: 'Plantilla de Producción',
        category: 'commercial' as const,
        previousValue: 'Anterior',
        newValue: preset.name,
      },
      ...prev.filter((c) => c.parameter !== 'Plantilla de Producción'),
    ].slice(0, 5));

    if (targetTech === 'offset') {
      const config = preset.offsetConfig;
      if (config) {
        setOffsetParams((prev) => {
          let updatedFinishings = INITIAL_OFFSET_PARAMS.finishings;
          if (config.enabledFinishings) {
            updatedFinishings = INITIAL_OFFSET_PARAMS.finishings.map((f) => ({
              ...f,
              enabled: config.enabledFinishings!.includes(f.id),
            }));
          }

          const targetSheetW = config.sheetWidthMm || INITIAL_OFFSET_PARAMS.sheetWidthMm;
          const targetSheetH = config.sheetHeightMm || INITIAL_OFFSET_PARAMS.sheetHeightMm;
          const targetGsm = config.grammageGsm || INITIAL_OFFSET_PARAMS.grammageGsm;
          const targetCostKg = config.paperCostPerKg || INITIAL_OFFSET_PARAMS.paperCostPerKg;
          const targetCostPerSheet =
            config.paperCostPerSheet ??
            Number((((targetSheetW * targetSheetH / 1_000_000) * targetGsm / 1000) * targetCostKg).toFixed(4));

          return {
            ...INITIAL_OFFSET_PARAMS,
            ...config,
            paperCostPerSheet: targetCostPerSheet,
            finishings: updatedFinishings,
            jobName: config.jobName || preset.name || prev.jobName,
            productDescription:
              preset.id === 'manual_blank'
                ? ''
                : config.productDescription || `${preset.name}: ${preset.description}`,
            clientName: prev.clientName || INITIAL_OFFSET_PARAMS.clientName,
            clientPhone: prev.clientPhone || INITIAL_OFFSET_PARAMS.clientPhone,
            clientEmail: prev.clientEmail || INITIAL_OFFSET_PARAMS.clientEmail,
            clientContactPerson: prev.clientContactPerson || INITIAL_OFFSET_PARAMS.clientContactPerson,
            clientTaxId: prev.clientTaxId || INITIAL_OFFSET_PARAMS.clientTaxId,
            clientAddress: prev.clientAddress || INITIAL_OFFSET_PARAMS.clientAddress,
          };
        });
      }
    } else if (targetTech === 'flexo') {
      const config = preset.flexoConfig;
      if (config) {
        setFlexoParams((prev) => ({
          ...INITIAL_FLEXO_PARAMS,
          ...config,
          jobName: config.jobName || preset.name || prev.jobName,
          productDescription:
            preset.id === 'manual_blank'
              ? ''
              : config.productDescription || `${preset.name}: ${preset.description}`,
          clientName: prev.clientName || INITIAL_FLEXO_PARAMS.clientName,
          clientPhone: prev.clientPhone || INITIAL_FLEXO_PARAMS.clientPhone,
          clientEmail: prev.clientEmail || INITIAL_FLEXO_PARAMS.clientEmail,
          clientContactPerson: prev.clientContactPerson || INITIAL_FLEXO_PARAMS.clientContactPerson,
          clientTaxId: prev.clientTaxId || INITIAL_FLEXO_PARAMS.clientTaxId,
          clientAddress: prev.clientAddress || INITIAL_FLEXO_PARAMS.clientAddress,
        }));
      }
    }
  };

  // Reset handler
  const handleReset = () => {
    if (confirm('¿Deseas restablecer todos los parámetros a los valores por defecto?')) {
      setOffsetParams({ ...INITIAL_OFFSET_PARAMS });
      setFlexoParams({ ...INITIAL_FLEXO_PARAMS });
    }
  };

  // Saved Project Loader (Presupuestos Guardados)
  const handleLoadProject = (project: SavedProject) => {
    setTechnology(project.technology);
    setCurrentlyLoadedQuoteId(project.id);
    setCurrentlyLoadedQuoteName(project.name);
    if (project.technology === 'offset' && project.offsetParams) {
      setOffsetParams({
        ...project.offsetParams,
        quoteNumber: project.quoteNumber || project.offsetParams.quoteNumber,
      });
    } else if (project.technology === 'flexo' && project.flexoParams) {
      setFlexoParams({
        ...project.flexoParams,
        quoteNumber: project.quoteNumber || project.flexoParams.quoteNumber,
      });
    }
    setActiveMainTab('quotation');
  };

  // Update existing loaded quote with current parameters and calculated price
  const handleUpdateExistingQuote = async () => {
    if (!currentlyLoadedQuoteId) return;
    try {
      const STORAGE_KEY = 'aravo_saved_projects_v1';
      let projects: SavedProject[] = [];
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) projects = JSON.parse(stored);

      const existing = projects.find((p) => p.id === currentlyLoadedQuoteId);
      if (!existing) return;

      const jobName = technology === 'offset' ? offsetParams.jobName : flexoParams.jobName;
      const clientName = technology === 'offset' ? offsetParams.clientName : flexoParams.clientName;
      const currentQuoteNum =
        (technology === 'offset' ? offsetParams.quoteNumber : flexoParams.quoteNumber) ||
        getNextQuoteNumber();

      const updatedProject: SavedProject = {
        ...existing,
        updatedAt: new Date().toLocaleString(),
        name: existing.name || jobName || 'Presupuesto Aravo',
        client: clientName || existing.client,
        quoteNumber: currentQuoteNum,
        technology,
        offsetParams: technology === 'offset' ? { ...offsetParams, quoteNumber: currentQuoteNum } : undefined,
        flexoParams: technology === 'flexo' ? { ...flexoParams, quoteNumber: currentQuoteNum } : undefined,
        finalPrice: activeBreakdown.finalTotalPrice,
        userId: authSession?.user?.id || existing.userId,
      };

      const updatedList = projects.map((p) => (p.id === currentlyLoadedQuoteId ? updatedProject : p));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

      if (authSession?.user?.id) {
        await saveQuoteToFirestore(authSession.user.id, updatedProject);
      }
      alert(`¡Presupuesto "${updatedProject.name}" actualizado y guardado correctamente!`);
    } catch (err) {
      console.error('Error actualizando presupuesto:', err);
    }
  };

  // Si no hay sesión activa en localStorage, mostrar pantalla de bienvenida y login
  if (!authSession) {
    return (
      <AuthWelcomeScreen
        appName={appName}
        appSubtitle={appSubtitle}
        onLoginSuccess={(newSession) => setAuthSession(newSession)}
      />
    );
  }

  // Verificación de Suscripción Mensual
  const subscriptionCheck = checkUserSubscription(authSession.user);

  // Temporizador / Bloqueo por Suscripción Vencida:
  // Si la suscripción está vencida (pasó la fecha límite de pago), bloquear el acceso a las funciones de cálculo
  if (subscriptionCheck.isExpired) {
    return (
      <SubscriptionExpiredScreen
        user={authSession.user}
        onLogout={async () => {
          try {
            await logOutFromFirebase();
          } catch (e) {
            console.error('Error logging out from Firebase:', e);
          }
          clearSession();
          setAuthSession(null);
        }}
        onRefreshUserStatus={() => {
          const fresh = getSession();
          if (fresh) {
            setAuthSession({ ...fresh });
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <Header
        appName={appName}
        onUpdateAppName={handleUpdateAppName}
        appSubtitle={appSubtitle}
        onUpdateAppSubtitle={handleUpdateAppSubtitle}
        technology={technology}
        currencyCode={currencyCode}
        onSelectCurrency={setCurrencyCode}
        onSelectPreset={handleSelectPreset}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenSavedModal={() => setIsSavedOpen(true)}
        onOpenSavedWorkOrders={() => setIsSavedWorkOrdersOpen(true)}
        onOpenCorrelatives={() => setIsCorrelativeModalOpen(true)}
        onReset={handleReset}
        currentUser={authSession.user}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onLogout={async () => {
          try {
            await logOutFromFirebase();
          } catch (e) {
            console.error('Error logging out from Firebase:', e);
          }
          clearSession();
          setAuthSession(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Banner de Advertencia si la suscripción está por vencer en menos de 5 días */}
        {subscriptionCheck.isWarning && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 animate-fadeIn shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse text-amber-400" />
              </div>
              <div>
                <strong className="font-bold text-amber-300 block text-sm">
                  Aviso: Su suscripción mensual vence en {subscriptionCheck.daysRemaining} día(s)
                </strong>
                <span className="text-amber-200/90 text-xs">
                  Fecha límite: {subscriptionCheck.formattedDate}. Renueve con el administrador para evitar el bloqueo del calculador.
                </span>
              </div>
            </div>
            <a
              href={getWhatsAppContactUrl(getAdminContactConfig(), authSession.user)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <span>Renovar por WhatsApp</span>
            </a>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Tab: Cliente & Pedido */}
            <button
              type="button"
              onClick={() => setActiveMainTab('client_order')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'client_order'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Cliente & Pedido</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                {`${flexoParams.targetQuantity.toLocaleString()} ${flexoParams.quoteUnit === 'units' ? 'etiq.' : flexoParams.quoteUnit}`}
              </span>
            </button>

            {/* Tab: Prensas Flexo & Desgaste */}
            <button
              type="button"
              onClick={() => setActiveMainTab('machines_plates')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'machines_plates'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Prensas Flexo & Desgaste</span>
              <span className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-mono">
                Banda 350mm • Nilpeter • ETIRAMA
              </span>
            </button>

            {/* Tab: Cálculo Técnico */}
            <button
              type="button"
              onClick={() => setActiveMainTab('calculator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'calculator'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Cálculo Técnico Flexo</span>
            </button>

            {/* Tab: Presupuesto & Cotización */}
            <button
              type="button"
              onClick={() => setActiveMainTab('quotation')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'quotation'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Presupuesto</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {currency.symbol}{activeBreakdown.finalTotalPrice.toLocaleString()}
              </span>
            </button>

            {/* Tab: Orden de Trabajo (OT) */}
            <button
              type="button"
              onClick={() => setActiveMainTab('work_order')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'work_order'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Factory className="w-4 h-4 text-emerald-400" />
              <span>Orden de Trabajo (OT)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                Planta
              </span>
            </button>

            {/* Tab: Herramientas de Taller */}
            <button
              type="button"
              onClick={() => setActiveMainTab('tools')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeMainTab === 'tools'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-purple-400" />
              <span>Herramientas</span>
            </button>
          </div>

          {/* Quick Aravo Time badge */}
          <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 self-start md:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Aravo Total:</span>
            <span className="font-mono font-bold text-amber-300">
              {activeBreakdown.totalTimeHours} h
            </span>
            <span className="text-slate-500 text-[11px]">(Bobina)</span>
          </div>
        </div>

        {/* Tab 1: Cliente & Pedido */}
        {activeMainTab === 'client_order' && (
          <ClientOrderTab
            technology={technology}
            offsetParams={offsetParams}
            flexoParams={flexoParams}
            onChangeOffset={handleOffsetParamsChange}
            onChangeFlexo={handleFlexoParamsChange}
            currency={currency}
            breakdown={activeBreakdown}
          />
        )}

        {/* Tab 2: Máquinas Flexo & Calibración (350mm) */}
        {activeMainTab === 'machines_plates' && (
          <MachinesPlatesTab
            offsetParams={offsetParams}
            onChangeOffset={handleOffsetParamsChange}
            flexoParams={flexoParams}
            onChangeFlexo={handleFlexoParamsChange}
            currency={currency}
          />
        )}

        {/* Tab 3: Active Flexo Calculator */}
        {activeMainTab === 'calculator' && (
          <div>
            <FlexoCalculator
              params={flexoParams}
              onChangeParams={handleFlexoParamsChange}
              currency={currency}
            />
          </div>
        )}

        {/* Tab 2: Quotation Summary & Printable Bill of Materials */}
        {activeMainTab === 'quotation' && (
          <QuotationSummary
            appName={appName}
            appSubtitle={appSubtitle}
            technology={technology}
            offsetParams={offsetParams}
            flexoParams={flexoParams}
            breakdown={activeBreakdown}
            currency={currency}
            recentChanges={recentChanges}
            onClearRecentChanges={handleClearRecentChanges}
            onApplyQuantity={(newQty) => {
              if (technology === 'offset') {
                handleOffsetParamsChange({ ...offsetParams, quantityUnits: newQty });
              } else {
                handleFlexoParamsChange({ ...flexoParams, targetQuantity: newQty });
              }
            }}
            onNavigateToWorkOrder={() => setActiveMainTab('work_order')}
            onChangeParams={(params) => {
              if (technology === 'offset') {
                handleOffsetParamsChange(params);
              } else {
                handleFlexoParamsChange(params);
              }
            }}
            currentlyLoadedProjectId={currentlyLoadedQuoteId}
            currentlyLoadedProjectName={currentlyLoadedQuoteName}
            onUpdateExistingProject={handleUpdateExistingQuote}
            onOpenSaveModal={() => setIsSavedOpen(true)}
            onOpenCorrelativesModal={() => setIsCorrelativeModalOpen(true)}
          />
        )}

        {/* Tab 5: Orden de Trabajo (OT) Oficial de Planta */}
        {activeMainTab === 'work_order' && (
          <WorkOrderTab
            technology={technology}
            offsetParams={offsetParams}
            flexoParams={flexoParams}
            activeArrangement={activeOffsetArrangement}
            breakdown={activeBreakdown}
            currency={currency}
            appName={appName}
            appSubtitle={appSubtitle}
            onNavigateToCalculator={() => setActiveMainTab('calculator')}
          />
        )}

        {/* Tab 6: Rapid Workshop Tools */}
        {activeMainTab === 'tools' && (
          <WorkshopTools
            currency={currency}
            technology={technology}
            offsetParams={offsetParams}
            flexoParams={flexoParams}
            onChangeOffset={handleOffsetParamsChange}
            onChangeFlexo={handleFlexoParamsChange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          <strong>{appName}</strong> • Sistema Integral de Cálculo de Bobinas, Metraje Lineal, Anilox, Pistas y Presupuestos para Flexografía (Bobina).
        </p>
      </footer>

      <SavedQuotesModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        currentTech={technology}
        currentOffsetParams={offsetParams}
        currentFlexoParams={flexoParams}
        currentBreakdown={activeBreakdown}
        onLoadProject={handleLoadProject}
        currency={currency}
        currentUserId={authSession?.user?.id}
        currentlyLoadedProjectId={currentlyLoadedQuoteId}
        onClearLoadedProject={() => {
          setCurrentlyLoadedQuoteId(null);
          setCurrentlyLoadedQuoteName(null);
        }}
        onOpenCorrelatives={() => setIsCorrelativeModalOpen(true)}
      />

      {/* Modal de Órdenes de Trabajo Guardadas */}
      <SavedWorkOrdersModal
        isOpen={isSavedWorkOrdersOpen}
        onClose={() => setIsSavedWorkOrdersOpen(false)}
        onLoadWorkOrder={(order) => {
          setActiveMainTab('work_order');
        }}
      />

      {/* Modal de Configuración de Correlatividad (OT y Presupuestos) */}
      <CorrelativeConfigModal
        isOpen={isCorrelativeModalOpen}
        onClose={() => setIsCorrelativeModalOpen(false)}
      />

      {/* Modal de Gestión de Usuarios (Altas y Bajas) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={authSession.user}
        onUsersChanged={() => {
          const fresh = getSession();
          if (fresh) {
            setAuthSession(fresh);
          } else {
            setAuthSession(null);
          }
        }}
      />

      {/* Modal de Plantillas Rápidas */}
      <QuickPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        currentPresetId={activePresetId}
        currentTech={technology}
      />
    </div>
  );
}

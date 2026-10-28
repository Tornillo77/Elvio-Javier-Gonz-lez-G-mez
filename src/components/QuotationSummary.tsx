import React, { useState } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
  RecentChangeItem,
} from '../types/graphic';
import { exportBudgetToPDF } from '../utils/pdfExport';
import { CostAnalysisChart } from './CostAnalysisChart';
import { VolumeCostComparisonChart } from './VolumeCostComparisonChart';
import {
  Printer,
  Download,
  Share2,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  Building,
  Calendar,
  Check,
  History,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Sliders,
  Palette,
  Package,
  Factory,
  Hash,
  Edit2,
  Save,
  FolderOpen,
} from 'lucide-react';
import { getNextQuoteNumber } from '../utils/correlativeService';

interface QuotationSummaryProps {
  appName: string;
  appSubtitle: string;
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  breakdown: QuoteBreakdown;
  currency: CurrencyConfig;
  recentChanges?: RecentChangeItem[];
  onClearRecentChanges?: () => void;
  onApplyQuantity?: (newQuantity: number) => void;
  onNavigateToWorkOrder?: () => void;
  onChangeParams?: (params: any) => void;
  currentlyLoadedProjectId?: string | null;
  currentlyLoadedProjectName?: string | null;
  onUpdateExistingProject?: () => void;
  onOpenSaveModal?: () => void;
  onOpenCorrelativesModal?: () => void;
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({
  appName,
  appSubtitle,
  technology,
  offsetParams,
  flexoParams,
  breakdown,
  currency,
  recentChanges = [],
  onClearRecentChanges,
  onApplyQuantity,
  onNavigateToWorkOrder,
  onChangeParams,
  currentlyLoadedProjectId,
  currentlyLoadedProjectName,
  onUpdateExistingProject,
  onOpenSaveModal,
  onOpenCorrelativesModal,
}) => {
  const [quoteVersion, setQuoteVersion] = useState<'detailed' | 'client'>('detailed');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportSuccess, setIsExportSuccess] = useState(false);
  const [isChangesExpanded, setIsChangesExpanded] = useState(true);
  const [isEditingQuoteNumber, setIsEditingQuoteNumber] = useState(false);
  const [tempQuoteNumber, setTempQuoteNumber] = useState('');

  const isOffset = technology === 'offset';
  const activeParams = isOffset ? offsetParams : flexoParams;
  const activeQuoteNumber = activeParams.quoteNumber || getNextQuoteNumber();

  const handleSaveQuoteNumber = () => {
    if (tempQuoteNumber.trim() && onChangeParams) {
      if (isOffset) {
        onChangeParams({ ...offsetParams, quoteNumber: tempQuoteNumber.trim() });
      } else {
        onChangeParams({ ...flexoParams, quoteNumber: tempQuoteNumber.trim() });
      }
    }
    setIsEditingQuoteNumber(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      exportBudgetToPDF({
        appName,
        appSubtitle,
        technology,
        offsetParams,
        flexoParams,
        breakdown,
        currency,
        isDetailed: quoteVersion === 'detailed',
        recentChanges,
        customQuoteNumber: activeQuoteNumber,
      });
      setIsExportSuccess(true);
      setTimeout(() => setIsExportSuccess(false), 2500);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getCategoryBadge = (category: RecentChangeItem['category']) => {
    switch (category) {
      case 'commercial':
        return {
          label: 'Comercial',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: DollarSign,
        };
      case 'dimensions':
        return {
          label: 'Dimensiones',
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          icon: Layers,
        };
      case 'materials':
        return {
          label: 'Materiales',
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Package,
        };
      case 'machine':
        return {
          label: 'Máquina / Aravo',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Clock,
        };
      case 'inks':
        return {
          label: 'Tintas',
          className: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          icon: Palette,
        };
      default:
        return {
          label: 'General',
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: Sliders,
        };
    }
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Action Header & Mode Toggle */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Presupuesto y Hoja de Costos {appName}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Desglose industrial con márgenes, matrices, consumo de insumos y precios unitarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Detailed vs Client Version toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setQuoteVersion('detailed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                quoteVersion === 'detailed'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ficha Taller (Detallada)
            </button>
            <button
              type="button"
              onClick={() => setQuoteVersion('client')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                quoteVersion === 'client'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cotización Cliente
            </button>
          </div>

          {/* Export to PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Descargar documento PDF oficial con membrete y cálculos"
          >
            {isExportSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar Reporte PDF'}</span>
              </>
            )}
          </button>

          {/* Configurar Correlativo Presupuesto */}
          {onOpenCorrelativesModal && (
            <button
              type="button"
              onClick={onOpenCorrelativesModal}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Configurar numeración correlativa inicial para presupuestos"
            >
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Correlativo</span>
            </button>
          )}

          {/* Quick Save / Update actions */}
          {currentlyLoadedProjectId && onUpdateExistingProject && (
            <button
              type="button"
              onClick={onUpdateExistingProject}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Actualizar y guardar cambios en este presupuesto existente"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          )}

          {onOpenSaveModal && (
            <button
              type="button"
              onClick={onOpenSaveModal}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Abrir ventana de presupuestos guardados"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{currentlyLoadedProjectId ? 'Guardar como...' : 'Guardar'}</span>
            </button>
          )}

          {/* Transfer to Work Order (OT) Button */}
          {onNavigateToWorkOrder && (
            <button
              type="button"
              onClick={onNavigateToWorkOrder}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              title="Transferir automáticamente los datos calculados a la Orden de Trabajo (OT) de planta"
            >
              <Factory className="w-4 h-4 text-slate-950" />
              <span>Transferir a Orden de Trabajo (OT)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          )}

          {/* Browser Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95"
            title="Vista de impresión del navegador"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Banner if modifying an existing loaded quote */}
      {currentlyLoadedProjectId && (
        <div className="no-print bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Modificando presupuesto guardado: <strong>{currentlyLoadedProjectName || 'Cotización'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onUpdateExistingProject && (
              <button
                type="button"
                onClick={onUpdateExistingProject}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all"
              >
                <Save className="w-3 h-3" />
                <span>Sobrescribir / Actualizar</span>
              </button>
            )}
            {onOpenSaveModal && (
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Guardar como Nuevo
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Printable Budget Sheet Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 print:border-slate-300 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md font-mono">
                {appName.charAt(0) || 'A'}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-100 print:text-black font-mono">
                  {appName}
                </h1>
                <span className="text-[11px] text-amber-400 print:text-amber-700 font-bold tracking-wider uppercase block">
                  {appSubtitle}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 print:text-slate-600 mt-2 space-y-0.5">
              <p>Tecnología:{' '}
                <strong className="text-slate-200 print:text-black uppercase">
                  {isOffset ? 'Offset a Pliego' : 'Flexografía a Bobina'}
                </strong>
              </p>
              <p>Fecha de emisión: {currentDate}</p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-950/60 print:bg-slate-100 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Presupuesto Oficial N°
              </span>
              {onOpenCorrelativesModal && (
                <button
                  type="button"
                  onClick={onOpenCorrelativesModal}
                  className="no-print text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                  title="Configurar correlativo inicial"
                >
                  <Hash className="w-3 h-3" />
                  <span>Serie</span>
                </button>
              )}
            </div>

            {isEditingQuoteNumber ? (
              <div className="flex items-center justify-end gap-1.5 mt-1 no-print">
                <input
                  type="text"
                  value={tempQuoteNumber}
                  onChange={(e) => setTempQuoteNumber(e.target.value)}
                  className="bg-slate-900 border border-amber-500 rounded px-2 py-0.5 text-xs text-amber-300 font-mono font-bold outline-none max-w-[130px]"
                  placeholder="ej. PRES-01001"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveQuoteNumber}
                  className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingQuoteNumber(false)}
                  className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-start sm:justify-end gap-1.5 group cursor-pointer"
                onClick={() => {
                  setTempQuoteNumber(activeQuoteNumber);
                  setIsEditingQuoteNumber(true);
                }}
                title="Haz clic para modificar el número de presupuesto manualmente"
              >
                <span className="text-lg font-mono font-bold text-amber-400 print:text-amber-800">
                  {activeQuoteNumber}
                </span>
                <Edit2 className="no-print w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            )}
            <div className="text-xs text-slate-200 print:text-slate-800 mt-1.5 font-bold">
              {activeParams.clientName}
            </div>
            {activeParams.clientContactPerson && (
              <div className="text-[11px] text-slate-400 print:text-slate-600">
                Contacto: <strong>{activeParams.clientContactPerson}</strong>
              </div>
            )}
            {(activeParams.clientPhone || activeParams.clientEmail) && (
              <div className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                {activeParams.clientPhone && <span>Tel: {activeParams.clientPhone} </span>}
                {activeParams.clientEmail && <span>• {activeParams.clientEmail}</span>}
              </div>
            )}
            {activeParams.clientTaxId && (
              <div className="text-[10px] text-slate-500 print:text-slate-500 font-mono">
                RUC/ID: {activeParams.clientTaxId}
              </div>
            )}
            <div className="text-xs text-amber-400 print:text-black font-semibold mt-1">
              Trabajo: <strong>{activeParams.jobName}</strong>
            </div>
            {activeParams.productDescription && (
              <div className="text-[11px] text-slate-300 print:text-slate-800 mt-1.5 max-w-sm sm:ml-auto bg-slate-900/60 print:bg-slate-100 p-2 rounded-lg border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">
                  Descripción del Producto:
                </span>
                <span className="text-slate-200 print:text-slate-900 font-medium">{activeParams.productDescription}</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Specs Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-950/70 print:bg-slate-50 p-4 rounded-xl border border-slate-800/80 print:border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Cantidad Solicitada
            </span>
            <span className="text-base font-bold font-mono text-slate-100 print:text-black">
              {breakdown.netProductionUnits.toLocaleString()} u
            </span>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Máquina & Plancha CTP
            </span>
            <span className="text-xs font-semibold text-slate-200 print:text-black block truncate" title={activeParams.machineModelName}>
              {activeParams.machineModelName || (isOffset ? 'Heidelberg SM 74' : 'Prensa Flexo')}
            </span>
            <span className="text-[10px] text-amber-400 print:text-amber-800 block font-mono font-bold">
              {isOffset
                ? `Plancha: ${offsetParams.plateWidthMm || 745}×${offsetParams.plateHeightMm || 605} mm`
                : 'Clichés Flexo'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Sustrato / Papel
            </span>
            <span className="text-sm font-semibold text-slate-200 print:text-black">
              {isOffset ? offsetParams.paperType : flexoParams.substrateType}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {isOffset ? `${offsetParams.grammageGsm} g/m²` : `${flexoParams.substrateGsm} g/m²`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Formato / Paso
            </span>
            <span className="text-sm font-semibold text-slate-200 print:text-black font-mono">
              {isOffset
                ? `${offsetParams.pieceWidthMm} × ${offsetParams.pieceHeightMm} mm`
                : `${flexoParams.labelWidthMm} × ${flexoParams.labelHeightMm} mm`}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {isOffset
                ? `Pliego: ${offsetParams.sheetWidthMm}×${offsetParams.sheetHeightMm}`
                : `Bobina: ${flexoParams.rollWidthMm}mm (${flexoParams.lanesAcross} pistas)`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Tintas & Pantones®
            </span>
            <span className="text-sm font-bold font-mono text-slate-100 print:text-black block">
              {isOffset
                ? `${offsetParams.inkColorsFront.length + (offsetParams.isTwoSided ? offsetParams.inkColorsBack.length : 0)} colores`
                : `${flexoParams.inkColors.length} colores`}
            </span>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {(isOffset ? offsetParams.inkColorsFront : flexoParams.inkColors).map((c, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-slate-600 print:border-black shrink-0"
                  style={{ backgroundColor: c.colorHex }}
                  title={`${c.name} (${c.coveragePercent}%)`}
                />
              ))}
              {(() => {
                const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                  Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                const pmsCount = isOffset
                  ? [...offsetParams.inkColorsFront, ...(offsetParams.isTwoSided ? offsetParams.inkColorsBack : [])].filter(isPms).length
                  : flexoParams.inkColors.filter(isPms).length;
                if (pmsCount === 0) return null;
                return (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 print:text-amber-800 font-mono font-bold">
                    {pmsCount} PMS
                  </span>
                );
              })()}
            </div>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[11px]">
              Tiempo Aravo de Máquina
            </span>
            <span className="text-base font-bold font-mono text-amber-400 print:text-amber-800 flex items-center gap-1">
              <Clock className="w-4 h-4 no-print" />
              {breakdown.totalTimeHours} h
            </span>
            <span className="text-[10px] text-slate-400 block">
              (Prep: {breakdown.setupTimeHours}h | Tiro: {breakdown.runTimeHours}h)
            </span>
          </div>
        </div>

        {/* Fila destacada de Colores Directos Pantone en Ficha Técnica */}
        {(() => {
          const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
            Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
          const allPantones = isOffset
            ? [
                ...offsetParams.inkColorsFront.filter(isPms).map((c) => ({ ...c, side: 'Frente' })),
                ...(offsetParams.isTwoSided
                  ? offsetParams.inkColorsBack.filter(isPms).map((c) => ({ ...c, side: 'Dorso' }))
                  : []),
              ]
            : flexoParams.inkColors.filter(isPms).map((c) => ({ ...c, side: 'Tiro' }));

          if (allPantones.length === 0) return null;

          return (
            <div className="bg-amber-500/10 print:bg-amber-50 border border-amber-500/30 print:border-amber-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-400 print:text-amber-900 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Colores Directos Pantone® en Cálculo Técnico:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {allPantones.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 print:bg-white border border-amber-500/40 print:border-amber-300 text-xs font-mono text-slate-100 print:text-black font-semibold shadow-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 print:border-black/20 shrink-0"
                        style={{ backgroundColor: p.colorHex }}
                      />
                      <span className="text-amber-300 print:text-amber-800 font-bold">{p.name || p.pantoneCode}</span>
                      <span className="text-slate-400 print:text-slate-600 text-[10px]">({p.coveragePercent}%)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 print:bg-slate-100 text-slate-300 print:text-slate-700">
                        [{p.side}]
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-amber-300 print:text-amber-800 font-bold font-mono">
                +{allPantones.length} {allPantones.length === 1 ? 'cuerpo directo / plancha sumado' : 'cuerpos directos / planchas sumados'}
              </span>
            </div>
          );
        })()}

        {/* Recent Changes Log - Transparency in Quoting Process */}
        <div className="no-print bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    Registro de Cambios Recientes
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {recentChanges.slice(0, 5).length} / 5 parámetros
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Trazabilidad y auditoría de los últimos 5 parámetros modificados en la cotización actual.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {recentChanges.length > 0 && onClearRecentChanges && (
                <button
                  type="button"
                  onClick={onClearRecentChanges}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
                  title="Reiniciar registro de cambios"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
              >
                {isChangesExpanded ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {isChangesExpanded && (
            <div className="space-y-2 mt-1">
              {recentChanges.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs italic bg-slate-900/40 rounded-xl border border-slate-800/40">
                  No se han registrado modificaciones recientes. Modifica cualquier parámetro en el calculador para ver aquí su trazabilidad.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChanges.slice(0, 5).map((change, index) => {
                    const badge = getCategoryBadge(change.category);
                    const IconComponent = badge.icon;

                    return (
                      <div
                        key={change.id || index}
                        className="bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono text-slate-500 w-4 text-right">
                            #{index + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0 ${badge.className}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="font-semibold text-xs text-slate-200">
                            {change.parameter}
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-6 sm:pl-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 line-through font-mono text-[11px]">
                              {change.previousValue}
                            </span>
                            <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
                              {change.newValue}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {change.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cost Breakdown Table (Industrial / Detailed View) */}
        {quoteVersion === 'detailed' && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
              Desglose de Costos de Producción
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600">
                    <th className="py-2 font-semibold">Rubro / Concepto</th>
                    <th className="py-2 font-semibold text-center">Detalle Técnico</th>
                    <th className="py-2 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-mono">
                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      1. Materia Prima / Sustrato ({isOffset ? 'Papel' : 'Bobina'})
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      {isOffset
                        ? `${breakdown.totalSheetsOrMeters.toLocaleString()} pliegos a ${currency.symbol}${(offsetParams.paperCostPerSheet ?? (offsetParams.paperCostPerKg * ((offsetParams.sheetWidthMm * offsetParams.sheetHeightMm / 1_000_000) * offsetParams.grammageGsm / 1000))).toFixed(3)}/pliego (${breakdown.substrateTotalWeightKg} kg)`
                        : `${breakdown.totalSheetsOrMeters.toLocaleString()} ml (${breakdown.substrateTotalWeightKg} kg)`}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100 print:text-black">
                      {currency.symbol}{breakdown.substrateCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      2. Consumo de Tinta por m²
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      {breakdown.totalInkKg} kg tinta ({isOffset ? `${offsetParams.inkGramsPerM2} g/m²` : `${flexoParams.inkGramsPerM2} g/m²`})
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100 print:text-black">
                      {currency.symbol}{breakdown.inkCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      3. Matrices ({isOffset ? 'Planchas CTP' : 'Fotopolímeros Clichés'})
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      {isOffset ? (
                        (() => {
                          const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                            Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                          const frontPms = offsetParams.inkColorsFront.filter(isPms).length;
                          const backPms = offsetParams.isTwoSided ? offsetParams.inkColorsBack.filter(isPms).length : 0;
                          const totalPms = frontPms + backPms;
                          const totalCmyk =
                            (offsetParams.inkColorsFront.length - frontPms) +
                            (offsetParams.isTwoSided ? (offsetParams.inkColorsBack.length - backPms) : 0);
                          const totalPlates = totalCmyk + totalPms;

                          return (
                            <span>
                              <strong>{totalPlates}</strong> planchas CTP ({totalCmyk} CMYK{totalPms > 0 ? ` + ${totalPms} Pantone directo` : ''})
                            </span>
                          );
                        })()
                      ) : (
                        `${flexoParams.inkColors.length} clichés digitales`
                      )}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100 print:text-black">
                      {currency.symbol}{breakdown.platesCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      4. Tiempos de Maquinado (Aravo)
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      {breakdown.totalTimeHours} horas máquina ({isOffset ? `${offsetParams.machineSpeedSheetsPerHour} pl/h` : `${flexoParams.machineSpeedMetersPerMinute} m/min`})
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100 print:text-black">
                      {currency.symbol}{breakdown.machineTimeCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      5. Acabados y Terminación Post-Prensa
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      {(() => {
                        const activeList = (isOffset ? offsetParams.finishings : flexoParams.finishings).filter((f) => f.enabled);
                        if (activeList.length === 0) return 'Sin procesos de acabado activos';
                        return (
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-md mx-auto">
                            {activeList.map((f) => (
                              <span
                                key={f.id}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 print:bg-slate-200 print:text-black text-[10px] font-mono font-medium"
                              >
                                {f.name}
                                {f.id === 'proc_creasing' && f.parameters?.creasingCitoMatrixCode && (
                                  <span className="text-amber-400 font-bold ml-1 print:text-black">
                                    [{f.parameters.creasingCitoMatrixCode}]
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100 print:text-black">
                      {currency.symbol}{breakdown.finishingsCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  {breakdown.washupInkingCost !== undefined && breakdown.washupInkingCost > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                        6. Lavado de Baterías y Entintado Especial Pantone®
                      </td>
                      <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                        <span>
                          {breakdown.spotColorsCount} {breakdown.spotColorsCount === 1 ? 'estación / cuerpo' : 'estaciones / cuerpos'} directos preparados
                        </span>
                        {(() => {
                          const pantones = (isOffset
                            ? [...offsetParams.inkColorsFront, ...(offsetParams.isTwoSided ? offsetParams.inkColorsBack : [])]
                            : flexoParams.inkColors
                          ).filter((c) => c.isPantone || c.isSpot || (c.name && /pantone|pms/i.test(c.name)));
                          if (pantones.length === 0) return null;
                          return (
                            <span className="block text-[11px] text-amber-400 print:text-amber-800 font-mono font-semibold mt-0.5">
                              (Tintas: {pantones.map((p) => p.name || p.pantoneCode).join(', ')})
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-amber-400 print:text-amber-800">
                        {currency.symbol}{breakdown.washupInkingCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-950/40 print:bg-slate-100 font-bold">
                    <td className="py-2.5 font-sans text-slate-300 print:text-black">
                      Costo Total de Producción (Costo Fabril)
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans text-[11px]">
                      Merma total estimada: {breakdown.wasteTotalPercent}%
                    </td>
                    <td className="py-2.5 text-right text-sky-400 print:text-sky-800">
                      {currency.symbol}{breakdown.totalProductionCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      Margen Comercial / Utilidad ({breakdown.profitPercent ?? activeParams.profitMarginPercent}%)
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      Rentabilidad de la imprenta
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400 print:text-emerald-700">
                      +{currency.symbol}{breakdown.profitAmount.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>

                  {breakdown.commissionAmount !== undefined && breakdown.commissionAmount > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                        Comisión Comercial ({breakdown.commissionPercent ?? activeParams.commissionPercent ?? 0}%)
                      </td>
                      <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                        Comisión de venta / Asesor comercial
                      </td>
                      <td className="py-2.5 text-right font-bold text-amber-400 print:text-amber-700">
                        +{currency.symbol}{breakdown.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-2.5 font-sans font-medium text-slate-200 print:text-black">
                      Impuesto al Valor Agregado / IVA ({activeParams.taxPercent}%)
                    </td>
                    <td className="py-2.5 text-center text-slate-400 print:text-slate-600 font-sans">
                      Tributario fiscal
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-300 print:text-black">
                      +{currency.symbol}{breakdown.taxAmount.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grand Total & Unit Pricing Highlight Box */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 print:border-amber-400 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase font-bold text-amber-400 print:text-amber-800 tracking-wider">
              Precio Total Cotizado (con IVA)
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-slate-100 print:text-black mt-1">
              {currency.symbol}{breakdown.finalTotalPrice.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Condición: Contado / Crédito 30 días • Validez de oferta: 15 días corridos.
            </p>
          </div>

          {/* Unit Pricing Grid */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Precio Unitario
              </span>
              <span className="text-base font-mono font-bold text-amber-300 print:text-amber-700">
                {currency.symbol}{breakdown.pricePerUnit.toFixed(Math.max(2, currency.decimals))}
              </span>
            </div>

            <div className="bg-slate-950 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Precio por Millar
              </span>
              <span className="text-base font-mono font-bold text-slate-200 print:text-black">
                {currency.symbol}{breakdown.pricePerThousand.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
              </span>
            </div>

            {!isOffset && breakdown.pricePerM2 && (
              <div className="bg-slate-950 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Precio por m²
                </span>
                <span className="text-base font-mono font-bold text-sky-400 print:text-sky-700">
                  {currency.symbol}{breakdown.pricePerM2.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                </span>
              </div>
            )}

            {!isOffset && breakdown.pricePerKg && (
              <div className="bg-slate-950 print:bg-white p-3 rounded-xl border border-slate-800 print:border-slate-300 text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Precio por kg
                </span>
                <span className="text-base font-mono font-bold text-emerald-400 print:text-emerald-700">
                  {currency.symbol}{breakdown.pricePerKg.toLocaleString(undefined, { minimumFractionDigits: currency.decimals })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Printable Footer Signatures */}
        <div className="pt-6 border-t border-slate-800/80 print:border-slate-300 grid grid-cols-2 gap-8 text-xs text-center text-slate-400 print:text-slate-700">
          <div className="pt-8 border-t border-slate-700/60 print:border-slate-400">
            <p className="font-semibold text-slate-200 print:text-black">Departamento de Estimaciones & Precios</p>
            <p className="text-[11px] text-slate-500">Sistema {appName} / Motor de Estimación Gráfica</p>
          </div>
          <div className="pt-8 border-t border-slate-700/60 print:border-slate-400">
            <p className="font-semibold text-slate-200 print:text-black">Aceptación y Firma del Cliente</p>
            <p className="text-[11px] text-slate-500">Firma, Aclaración y Sello</p>
          </div>
        </div>
      </div>

      {/* Comparative Charts Section (Recharts) */}
      <div className="no-print flex flex-col gap-6">
        {/* Gráfico comparativo de costo unitario según volumen de tirada */}
        <VolumeCostComparisonChart
          technology={technology}
          offsetParams={offsetParams}
          flexoParams={flexoParams}
          currentBreakdown={breakdown}
          currency={currency}
          onApplyQuantity={onApplyQuantity}
        />

        {/* Estructura de costos y porcentajes de producción */}
        <CostAnalysisChart breakdown={breakdown} currency={currency} />
      </div>
    </div>
  );
};

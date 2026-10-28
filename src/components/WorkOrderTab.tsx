import React, { useState } from 'react';
import {
  CurrencyConfig,
  CutArrangement,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
} from '../types/graphic';
import { FlexoWindingDirection, WorkOrderData, WorkOrderStatus, WorkOrderPriority } from '../types/workOrder';
import { generateWorkOrderData } from '../utils/workOrderGenerator';
import {
  WINDING_DIRECTIONS,
  WindingDirectionSvg,
  WindingDirectionFullChart,
  WindingDirectionInfo,
  useWindingDefinitions,
} from './WindingDirectionIcon';
import { WindingDirectionCustomizerModal } from './WindingDirectionCustomizerModal';
import { FlexoCylinderLanesVisualizer } from './FlexoCylinderLanesVisualizer';
import {
  Printer,
  Download,
  RotateCcw,
  RefreshCw,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Scissors,
  Disc,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  Factory,
  Package,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  Camera,
  Save,
  FolderOpen,
  Edit,
  Edit2,
} from 'lucide-react';
import { auth, saveWorkOrderToFirestore } from '../utils/firebase';
import { SavedWorkOrdersModal } from './SavedWorkOrdersModal';
import { CorrelativeConfigModal } from './CorrelativeConfigModal';
import { getNextOtNumber } from '../utils/correlativeService';

interface WorkOrderTabProps {
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  activeArrangement?: CutArrangement;
  breakdown: QuoteBreakdown;
  currency: CurrencyConfig;
  appName?: string;
  appSubtitle?: string;
  onNavigateToCalculator?: () => void;
}

export const WorkOrderTab: React.FC<WorkOrderTabProps> = ({
  technology,
  offsetParams,
  flexoParams,
  activeArrangement,
  breakdown,
  currency,
  appName = 'ARAVO',
  appSubtitle = 'Sistema de Producción & Presupuestos para Artes Gráficas',
  onNavigateToCalculator,
}) => {
  // Initialize WorkOrder state with generated data from current Aravo quote
  const [workOrder, setWorkOrder] = useState<WorkOrderData>(() =>
    generateWorkOrderData({
      technology,
      offsetParams,
      flexoParams,
      arrangement: activeArrangement,
      breakdown,
    })
  );

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTabSubView, setActiveTabSubView] = useState<'preview' | 'edit'>('preview');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // States for Saved Work Orders & Correlatives
  const [isSavedOrdersModalOpen, setIsSavedOrdersModalOpen] = useState(false);
  const [isCorrelativeModalOpen, setIsCorrelativeModalOpen] = useState(false);
  const [loadedSavedOrderNumber, setLoadedSavedOrderNumber] = useState<string | null>(null);
  const [isOrderSavedNotice, setIsOrderSavedNotice] = useState(false);
  const [orderNoticeMsg, setOrderNoticeMsg] = useState('¡Orden de Trabajo guardada!');
  const [isEditingOtNumber, setIsEditingOtNumber] = useState(false);
  const [tempOtNumber, setTempOtNumber] = useState('');

  const STORAGE_OT_KEY = 'aravo_saved_work_orders_v1';

  const handleSaveWorkOrder = async () => {
    try {
      let localList: WorkOrderData[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_OT_KEY);
        if (stored) localList = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      const index = localList.findIndex((o) => o.orderNumber === workOrder.orderNumber);
      let updatedList: WorkOrderData[];
      if (index >= 0) {
        updatedList = localList.map((o) => (o.orderNumber === workOrder.orderNumber ? workOrder : o));
      } else {
        updatedList = [workOrder, ...localList];
      }

      localStorage.setItem(STORAGE_OT_KEY, JSON.stringify(updatedList));
      setLoadedSavedOrderNumber(workOrder.orderNumber);

      // Save to Firebase Firestore
      await saveWorkOrderToFirestore(auth.currentUser?.uid, workOrder);

      setOrderNoticeMsg(`¡Orden de Trabajo ${workOrder.orderNumber} guardada exitosamente en el sistema!`);
      setIsOrderSavedNotice(true);
      setTimeout(() => setIsOrderSavedNotice(false), 3000);
    } catch (err) {
      console.error('Error guardando OT:', err);
    }
  };

  const handleLoadSavedWorkOrder = (loadedOrder: WorkOrderData) => {
    setWorkOrder(loadedOrder);
    setLoadedSavedOrderNumber(loadedOrder.orderNumber);
    setActiveTabSubView('preview');
    setOrderNoticeMsg(`¡OT ${loadedOrder.orderNumber} (${loadedOrder.clientName}) cargada para edición!`);
    setIsOrderSavedNotice(true);
    setTimeout(() => setIsOrderSavedNotice(false), 3000);
  };

  const handleSaveManualOtNumber = () => {
    if (tempOtNumber.trim()) {
      setWorkOrder((prev) => ({ ...prev, orderNumber: tempOtNumber.trim() }));
    }
    setIsEditingOtNumber(false);
  };

  // Sync / Refresh data directly from Aravo current calculated values
  const handleSyncWithAravo = () => {
    const refreshed = generateWorkOrderData({
      technology,
      offsetParams,
      flexoParams,
      arrangement: activeArrangement,
      breakdown,
      customOrderNumber: workOrder.orderNumber,
    });
    setWorkOrder((prev) => ({
      ...refreshed,
      // Preserve custom edited organizational fields if already set
      branchDestination: prev.branchDestination || refreshed.branchDestination,
      associatedOrderNumber: prev.associatedOrderNumber || refreshed.associatedOrderNumber,
      purchaseOrderNumber: prev.purchaseOrderNumber || refreshed.purchaseOrderNumber,
      accountExecutive: prev.accountExecutive || refreshed.accountExecutive,
      deliveryDate: prev.deliveryDate || refreshed.deliveryDate,
      status: prev.status || refreshed.status,
      priority: prev.priority || refreshed.priority,
      packagingInstructions: prev.packagingInstructions || refreshed.packagingInstructions,
      operatorNotes: prev.operatorNotes || refreshed.operatorNotes,
      windingDirectionManual: prev.windingDirectionManual || refreshed.windingDirectionManual,
      windingDirectionNumber: prev.windingDirectionNumber || refreshed.windingDirectionNumber,
      flexoSlitting: refreshed.flexoSlitting
        ? {
            ...refreshed.flexoSlitting,
            windingDirection: prev.flexoSlitting?.windingDirection || refreshed.flexoSlitting.windingDirection,
            windingDirectionManual:
              prev.flexoSlitting?.windingDirectionManual ||
              prev.windingDirectionManual ||
              refreshed.flexoSlitting.windingDirectionManual,
          }
        : undefined,
    }));
    setSyncFeedback('¡Datos técnicos y cálculos de Aravo sincronizados exitosamente!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const [showWindingFullPoster, setShowWindingFullPoster] = useState<boolean>(false);
  const [isWindingCustomizerOpen, setIsWindingCustomizerOpen] = useState<boolean>(false);
  const windingDefs = useWindingDefinitions();

  const activeWindingDir = (workOrder.windingDirectionNumber || workOrder.flexoSlitting?.windingDirection || 1) as FlexoWindingDirection;

  const handleSelectWinding = (dir: WindingDirectionInfo) => {
    setWorkOrder((prev) => ({
      ...prev,
      windingDirectionNumber: dir.id,
      windingDirectionLabel: dir.title,
      windingDirectionManual: dir.title,
      flexoSlitting: {
        ...(prev.flexoSlitting || {
          masterRollWidthMm: prev.webWidthMm || 350,
          slittedRollWidthMm: 100,
          lanesCount: 1,
          sideTrimLeftMm: 5,
          sideTrimRightMm: 5,
          totalUsedWidthMm: prev.webWidthMm || 350,
          coreDiameterInches: 3,
          labelsPerRoll: 1000,
          totalRolls: 1,
          outerDiameterMm: 150,
        }),
        windingDirection: dir.id,
        windingDirectionManual: dir.title,
      },
    }));
  };

  const handleManualWindingChange = (val: string) => {
    setWorkOrder((prev) => ({
      ...prev,
      windingDirectionManual: val,
      flexoSlitting: prev.flexoSlitting
        ? { ...prev.flexoSlitting, windingDirectionManual: val }
        : undefined,
    }));
  };

  const isFlexo = workOrder.technology === 'flexo';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions (Hidden when printing) */}
      <div className="no-print bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <span>Orden de Trabajo (OT)</span>
                {isEditingOtNumber ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempOtNumber}
                      onChange={(e) => setTempOtNumber(e.target.value)}
                      placeholder="ej. OT-05000"
                      className="bg-slate-950 border border-amber-400 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-mono font-bold outline-none max-w-[130px]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualOtNumber}
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingOtNumber(false)}
                      className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setTempOtNumber(workOrder.orderNumber);
                      setIsEditingOtNumber(true);
                    }}
                    className="group cursor-pointer flex items-center gap-1.5 font-mono text-sm px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400"
                    title="Haz clic para modificar el N° de OT manualmente"
                  >
                    <span>{workOrder.orderNumber}</span>
                    <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                  </div>
                )}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isFlexo
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isFlexo ? 'Línea Flexo' : 'Taller Offset'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plantilla técnica oficial para planta gráfica • Replicación exacta de parámetros de producción, esquemas de imposición y refilado.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Configurar Correlativo OT */}
          <button
            type="button"
            onClick={() => setIsCorrelativeModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700 shadow-sm"
            title="Configurar numeración correlativa inicial para órdenes de trabajo"
          >
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Correlativo OT</span>
          </button>

          {/* Guardar / Actualizar OT */}
          <button
            type="button"
            onClick={handleSaveWorkOrder}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            title="Guardar o actualizar los cambios de esta Orden de Trabajo en el sistema y en la nube"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loadedSavedOrderNumber ? 'Actualizar OT' : 'Guardar OT'}</span>
          </button>

          {/* Ver OTs Guardadas */}
          <button
            type="button"
            onClick={() => setIsSavedOrdersModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700 shadow-sm"
            title="Ver listado de órdenes de trabajo guardadas, cargar y modificar"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>OTs Guardadas</span>
          </button>

          <button
            type="button"
            onClick={handleSyncWithAravo}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700 shadow-sm"
            title="Recalcular y actualizar con los parámetros actuales del presupuesto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Sincronizar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSubView(activeTabSubView === 'preview' ? 'edit' : 'preview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border shadow-sm ${
              activeTabSubView === 'edit'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{activeTabSubView === 'edit' ? 'Ver OT Impresión' : 'Editar Datos OT'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir OT</span>
          </button>
        </div>
      </div>

      {/* Notice Message when saving/loading OT */}
      {isOrderSavedNotice && (
        <div className="no-print bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{orderNoticeMsg}</span>
        </div>
      )}

      {/* Banner if currently modifying an existing saved OT */}
      {loadedSavedOrderNumber && (
        <div className="no-print bg-emerald-950/20 border border-emerald-500/30 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Editando Orden de Trabajo guardada: <strong>{workOrder.orderNumber}</strong> ({workOrder.clientName})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveWorkOrder}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all"
            >
              <Save className="w-3 h-3" />
              <span>Guardar Cambios</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const nextOt = getNextOtNumber();
                setWorkOrder((prev) => ({ ...prev, orderNumber: nextOt }));
                setLoadedSavedOrderNumber(null);
                setOrderNoticeMsg(`Nueva OT generada: ${nextOt}`);
                setIsOrderSavedNotice(true);
                setTimeout(() => setIsOrderSavedNotice(false), 2500);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Duplicar como Nueva OT
            </button>
          </div>
        </div>
      )}

      {syncFeedback && (
        <div className="no-print bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* SUB-VIEW 1: FORMULARIO DE EDICIÓN DE DATOS OPERACIONALES */}
      {activeTabSubView === 'edit' && (
        <div className="no-print bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Edición de Parámetros de la Orden de Trabajo</span>
            </h3>
            <span className="text-xs text-slate-400">
              Modifique los campos de destino, cliente, fechas y notas de taller
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                N° de Orden de Trabajo (OT)
              </label>
              <input
                type="text"
                value={workOrder.orderNumber}
                onChange={(e) => setWorkOrder({ ...workOrder, orderNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sucursal / Destino
              </label>
              <input
                type="text"
                value={workOrder.branchDestination}
                onChange={(e) => setWorkOrder({ ...workOrder, branchDestination: e.target.value })}
                placeholder="ej. Sucursal Etiquetas"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                N° de OT Asociada / Anterior
              </label>
              <input
                type="text"
                value={workOrder.associatedOrderNumber}
                onChange={(e) => setWorkOrder({ ...workOrder, associatedOrderNumber: e.target.value })}
                placeholder="ej. OT-2025-0512 (Repetición)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Estado de la OT
              </label>
              <select
                value={workOrder.status}
                onChange={(e) => setWorkOrder({ ...workOrder, status: e.target.value as WorkOrderStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              >
                <option value="pending">Pendiente de Aprobación</option>
                <option value="approved">Aprobada para Producción</option>
                <option value="in_press">En Prensa / Tirada</option>
                <option value="post_press">En Post-Prensa / Terminación</option>
                <option value="quality_control">Control de Calidad</option>
                <option value="completed">Terminada / Lista</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cliente
              </label>
              <input
                type="text"
                value={workOrder.clientName}
                onChange={(e) => setWorkOrder({ ...workOrder, clientName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Presupuesto N°
              </label>
              <input
                type="text"
                value={workOrder.quoteNumber}
                onChange={(e) => setWorkOrder({ ...workOrder, quoteNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Orden de Compra (OC N°)
              </label>
              <input
                type="text"
                value={workOrder.purchaseOrderNumber}
                onChange={(e) => setWorkOrder({ ...workOrder, purchaseOrderNumber: e.target.value })}
                placeholder="ej. OC-88921-A"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Ejecutivo de Cuenta
              </label>
              <input
                type="text"
                value={workOrder.accountExecutive}
                onChange={(e) => setWorkOrder({ ...workOrder, accountExecutive: e.target.value })}
                placeholder="Nombre del ejecutivo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Contacto Comercial
              </label>
              <input
                type="text"
                value={workOrder.commercialContact}
                onChange={(e) => setWorkOrder({ ...workOrder, commercialContact: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={workOrder.clientPhone}
                onChange={(e) => setWorkOrder({ ...workOrder, clientPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Correo Electrónico (Mail)
              </label>
              <input
                type="email"
                value={workOrder.clientEmail}
                onChange={(e) => setWorkOrder({ ...workOrder, clientEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Fecha Estimada Entrega
              </label>
              <input
                type="text"
                value={workOrder.deliveryDate}
                onChange={(e) => setWorkOrder({ ...workOrder, deliveryDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Descripción Detallada del Producto & Especificaciones
              </label>
              <textarea
                rows={3}
                value={workOrder.productDescription}
                onChange={(e) => setWorkOrder({ ...workOrder, productDescription: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Instrucciones de Empaque y Despacho
              </label>
              <textarea
                rows={3}
                value={workOrder.packagingInstructions}
                onChange={(e) => setWorkOrder({ ...workOrder, packagingInstructions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Notas Técnicas para Maquinista / Operador de Taller
            </label>
            <input
              type="text"
              value={workOrder.operatorNotes}
              onChange={(e) => setWorkOrder({ ...workOrder, operatorNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Sentido de Bobinado en Modo Edición (si es flexo) */}
          {isFlexo && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sentido de Bobinado (Indicar Manualmente para la OT)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Haga clic en uno de los 8 sentidos estándar o escriba una indicación manual libre
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsWindingCustomizerOpen(true)}
                    className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="Definir nombres y fotos de los 8 sentidos de bobinado"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Definir Sentidos / Subir Fotos</span>
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Sentido: #{activeWindingDir}
                  </span>
                </div>
              </div>

              {/* Grid de 8 Sentidos + Indicación Manual */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                {windingDefs.map((dir) => {
                  const isSelected =
                    activeWindingDir === dir.id &&
                    !workOrder.windingDirectionManual?.startsWith('Indicación Manual:');
                  return (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => handleSelectWinding(dir as any)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[105px] text-left relative group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-400/40 shadow-md'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                      title={dir.title}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                          {dir.id}.
                        </span>
                        <span
                          className={`text-[7px] font-bold px-1 rounded uppercase ${
                            dir.category === 'Bobinado exterior'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {dir.category === 'Bobinado exterior' ? 'Ext' : 'Int'}
                        </span>
                      </div>

                      <div className="w-full h-11 bg-slate-950 rounded border border-slate-800 p-0.5 flex items-center justify-center my-0.5 overflow-hidden">
                        <WindingDirectionSvg
                          direction={dir.id}
                          className="w-full h-full"
                          customColor={dir.color}
                          customImageUrl={dir.imageUrl}
                          allowQuickUpload={true}
                          onOpenCustomizer={() => setIsWindingCustomizerOpen(true)}
                        />
                      </div>

                      <div className="w-full mt-1">
                        <span className="text-[9px] font-bold text-slate-200 block truncate leading-tight">
                          {dir.exitName}
                        </span>
                        <span className="text-[8px] text-slate-500 block truncate">
                          {dir.category === 'Bobinado exterior' ? 'Exterior' : 'Interior'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* 9na Opción: Indicación Manual */}
                <button
                  type="button"
                  onClick={() => {
                    const currentManual = workOrder.windingDirectionManual || '';
                    const manualVal = currentManual.startsWith('Indicación Manual:')
                      ? currentManual
                      : `Indicación Manual: Sentido especial a requerimiento del cliente`;
                    handleManualWindingChange(manualVal);
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[105px] text-left ${
                    workOrder.windingDirectionManual?.startsWith('Indicación Manual:')
                      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                  title="Indicación Manual Personalizada"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-mono font-black text-amber-400">✎</span>
                    <span className="text-[7px] font-bold px-1 rounded uppercase bg-amber-500/20 text-amber-300">
                      Manual
                    </span>
                  </div>

                  <div className="w-full h-11 bg-slate-950 rounded border border-slate-800 p-1 flex flex-col items-center justify-center text-center my-0.5">
                    <span className="text-[10px] font-black text-amber-300 font-mono">1 al 8</span>
                    <span className="text-[8px] text-slate-400">Personalizado</span>
                  </div>

                  <div className="w-full mt-1">
                    <span className="text-[9px] font-bold text-amber-300 block truncate leading-tight">
                      Indicación Manual
                    </span>
                    <span className="text-[8px] text-slate-400 block truncate">Texto Libre</span>
                  </div>
                </button>
              </div>

              {/* Input manual */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Texto Manual de Sentido de Bobinado para la OT:
                </label>
                <input
                  type="text"
                  value={workOrder.windingDirectionManual || ''}
                  onChange={(e) => handleManualWindingChange(e.target.value)}
                  placeholder="ej. Indicación Manual: Sentido especial según máquina etiquetadora del cliente"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTabSubView('preview')}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Guardar y Ver Orden de Trabajo Imprimible
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PLANTILLA TÉCNICA OFICIAL IMPRIMIBLE DE LA ORDEN DE TRABAJO (OT) */}
      <div className="work-order-sheet bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0">
        
        {/* ENCABEZADO Y DATOS GENERALES */}
        <div className="p-6 sm:p-8 border-b-2 border-slate-900 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                  {appName}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono uppercase">
                  PLANTA GRÁFICA
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{appSubtitle}</p>
              <p className="text-[11px] text-slate-500">
                Sistema Integral de Producción Técnica e Imposición
              </p>
            </div>

            {/* Bloque Número de OT y Estado */}
            <div className="text-right sm:text-right bg-white p-3 rounded-xl border-2 border-slate-900 shadow-sm min-w-[220px]">
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  ORDEN DE TRABAJO
                </span>
                <button
                  type="button"
                  onClick={() => setIsCorrelativeModalOpen(true)}
                  className="no-print text-[10px] font-mono text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
                  title="Configurar correlativo inicial de OT"
                >
                  <Hash className="w-3 h-3" />
                  <span>Serie</span>
                </button>
              </div>

              {isEditingOtNumber ? (
                <div className="flex items-center justify-end gap-1 mt-1 no-print">
                  <input
                    type="text"
                    value={tempOtNumber}
                    onChange={(e) => setTempOtNumber(e.target.value)}
                    className="bg-white border-2 border-amber-500 rounded px-2 py-0.5 text-base font-black font-mono text-slate-950 outline-none max-w-[140px]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualOtNumber}
                    className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingOtNumber(false)}
                    className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTempOtNumber(workOrder.orderNumber);
                    setIsEditingOtNumber(true);
                  }}
                  className="group cursor-pointer flex items-center justify-end gap-1.5"
                  title="Haz clic para modificar el N° de OT manualmente"
                >
                  <span className="text-2xl font-black font-mono text-slate-950 block">
                    {workOrder.orderNumber}
                  </span>
                  <Edit2 className="no-print w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
              )}

              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  {workOrder.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                  {isFlexo ? 'FLEXOGRAFÍA' : 'OFFSET'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque Encabezado: Sucursal, Destino, Fechas, OT Anterior */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Sucursal / Destino:</span>
              <strong className="text-slate-950 font-bold block truncate">{workOrder.branchDestination}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">N° OT Asociada / Anterior:</span>
              <strong className="text-slate-950 font-bold block truncate font-mono">
                {workOrder.associatedOrderNumber || 'Nueva Orden (Sin anterior)'}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Fecha de Emisión:</span>
              <strong className="text-slate-950 font-bold block font-mono">{workOrder.createdAt}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Fecha Estimada Entrega:</span>
              <strong className="text-amber-800 font-black block font-mono">{workOrder.deliveryDate}</strong>
            </div>
          </div>
        </div>

        {/* 2. DATOS DEL CLIENTE Y FACTURACIÓN */}
        <div className="p-6 sm:p-8 border-b border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
              1
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Datos del Cliente y Facturación
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cliente:</span>
              <span className="font-bold text-slate-950 text-sm block">{workOrder.clientName}</span>
              {workOrder.clientTaxId && (
                <span className="text-[11px] text-slate-600 block">RUC/ID: {workOrder.clientTaxId}</span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Presupuesto N°:</span>
              <span className="font-bold font-mono text-slate-950 block">{workOrder.quoteNumber}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Orden de Compra (OC):</span>
              <span className="font-bold font-mono text-amber-900 block">{workOrder.purchaseOrderNumber}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Contacto Comercial:</span>
              <span className="font-medium text-slate-900 block">{workOrder.commercialContact}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Teléfono / Mail:</span>
              <span className="font-medium text-slate-900 block text-[11px] truncate">{workOrder.clientPhone}</span>
              <span className="font-medium text-slate-600 block text-[10px] truncate">{workOrder.clientEmail}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Ejecutivo de Cuenta:</span>
              <span className="font-medium text-slate-900 block">{workOrder.accountExecutive}</span>
            </div>
          </div>
        </div>

        {/* 3 & 4. DETALLE DEL PRODUCTO, ESPECIFICACIONES & FORMATO */}
        <div className="p-6 sm:p-8 border-b border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
              2
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Detalle del Producto, Especificaciones y Formato
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Producto y cantidad */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Producto</span>
                  <h4 className="text-base font-black text-slate-950">{workOrder.productName}</h4>
                </div>
                <div className="text-left sm:text-right bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Cantidad Solicitada</span>
                  <span className="text-lg font-black font-mono text-slate-950">
                    {workOrder.requestedQuantity.toLocaleString()} {workOrder.quantityUnit}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Descripción Detallada y Requerimientos:</span>
                <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white p-2.5 rounded border border-slate-200 mt-1">
                  {workOrder.productDescription}
                </p>

                {/* Sentido de Bobinado Requerido para la OT */}
                {isFlexo && (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-300 p-2.5 rounded-lg mt-2">
                    <div className="flex items-center gap-2">
                      <Disc className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-900 uppercase block">
                          Sentido de Bobinado Requerido:
                        </span>
                        <strong className="text-xs font-mono font-black text-slate-950">
                          {workOrder.windingDirectionManual || `Sentido ${activeWindingDir}`}
                        </strong>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 font-mono">
                      Sentido #{activeWindingDir} ({activeWindingDir <= 4 ? 'Bobinado Exterior' : 'Bobinado Interior'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Generalidades y Formato */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Generalidades y Formato</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Tipo de Presupuesto:</span>
                  <strong className="text-slate-950 text-right truncate max-w-[140px]">{workOrder.budgetType}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Tamaño Abierto (cm):</span>
                  <strong className="font-mono text-slate-950">{workOrder.openSizeCm}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Tamaño Cerrado (cm):</span>
                  <strong className="font-mono text-slate-950">{workOrder.closedSizeCm}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Medida de Pieza (mm):</span>
                  <strong className="font-mono text-amber-900 font-bold">{workOrder.pieceDimensionsMm}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. PARÁMETROS TÉCNICOS DE PRODUCCIÓN Y MÁQUINA */}
        <div className="p-6 sm:p-8 border-b border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
              3
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Parámetros Técnicos de Producción y Máquina Asignada
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Máquina Asignada:</span>
              <strong className="text-slate-950 font-bold block text-sm mt-0.5">{workOrder.assignedMachine}</strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Configurada según catálogo Aravo</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Colores / Cuerpos:</span>
              <strong className="text-slate-950 font-bold block text-sm mt-0.5">{workOrder.colorsSpec}</strong>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {workOrder.colorsList.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                {isFlexo ? 'Ancho de Bobina (mm):' : 'Ancho Pliego / Pinza:'}
              </span>
              <strong className="text-amber-900 font-black font-mono text-base block mt-0.5">
                {workOrder.webWidthMm} mm
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {isFlexo ? 'Ancho nominal del sustrato' : 'Sentido de entrada en máquina'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Forma de Impresión / Cilindro:
              </span>
              <strong className="text-slate-950 font-bold block text-xs mt-0.5 leading-snug">
                {workOrder.printingForm}
              </strong>
            </div>
          </div>
        </div>

        {/* 6. CÁLCULOS AUTOMÁTICOS GENERADOS POR ARAVO */}
        <div className="p-6 sm:p-8 border-b border-slate-300 bg-amber-500/5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-amber-600 text-slate-950 flex items-center justify-center text-[11px] font-black">
                4
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                Cálculos Automáticos de Consumo y Producción (Aravo)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
              Aravo Algoritmo Exacto
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Unidades Base</span>
              <span className="text-lg font-black font-mono text-slate-950 block mt-0.5">
                {workOrder.baseUnits.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Unidades netas solicitadas</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metros² Base</span>
              <span className="text-lg font-black font-mono text-slate-950 block mt-0.5">
                {workOrder.baseSquareMeters.toLocaleString()} m²
              </span>
              <span className="text-[10px] text-slate-500">Área neta impresa</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metros² Totales</span>
              <span className="text-lg font-black font-mono text-amber-900 block mt-0.5">
                {workOrder.totalSquareMeters.toLocaleString()} m²
              </span>
              <span className="text-[10px] text-slate-500">Incluye mermas y maculaturas</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metros Lineales Base</span>
              <span className="text-lg font-black font-mono text-slate-950 block mt-0.5">
                {workOrder.baseLinearMeters.toLocaleString()} ml
              </span>
              <span className="text-[10px] text-slate-500">Desarrollo neto de tirada</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metros Lineales Excedentes</span>
              <span className="text-lg font-black font-mono text-rose-600 block mt-0.5">
                +{workOrder.wasteLinearMeters.toLocaleString()} ml
              </span>
              <span className="text-[10px] text-rose-500">Merma de puesta a punto y tiro</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metros Lineales Totales</span>
              <span className="text-lg font-black font-mono text-slate-950 block mt-0.5">
                {workOrder.totalLinearMeters.toLocaleString()} ml
              </span>
              <span className="text-[10px] text-slate-500">Consumo real a programar</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Kilos de Papel / Film</span>
              <span className="text-lg font-black font-mono text-emerald-800 block mt-0.5">
                {workOrder.paperFilmKg.toLocaleString()} kg
              </span>
              <span className="text-[10px] text-slate-500">Peso total de sustrato bruto</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Kilos de Tintas</span>
              <span className="text-lg font-black font-mono text-indigo-900 block mt-0.5">
                {workOrder.inkKg.toLocaleString()} kg
              </span>
              <span className="text-[10px] text-slate-500">Consumo total estimado</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Tiempo Estimado Impresión (Aravo)
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-lg font-black font-mono text-slate-950">
                  {workOrder.totalTimeHours} h
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  ({workOrder.setupTimeHours}h preparación + {workOrder.runTimeHours}h tiro)
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Tiempo de máquina en taller</span>
            </div>
          </div>
        </div>

        {/* 5. ESQUEMA TÉCNICO SEGÚN TECNOLOGÍA: FLEXO (Esquema de Cilindro y Pistas) vs OFFSET (Controles de Imposición) */}
        {isFlexo ? (
          /* ESQUEMA DE CILINDRO Y PISTAS FLEXO */
          <div className="p-6 sm:p-8 border-b border-slate-300 bg-sky-50/20">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center text-[11px] font-bold">
                  5
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Esquema de Cilindro y Pistas Flexo
                </h3>
              </div>
              <div className="text-[10px] font-bold text-slate-600 flex items-center gap-3">
                <span>Pistas al Eje: <strong className="font-mono text-slate-950">{workOrder.lanesAcross} bocas</strong></span>
                <span>Desarrollo Cilindro: <strong className="font-mono text-sky-800">{workOrder.flexoCylinderScheme?.cylinderRepeatMm || workOrder.imposition.sheetOrRollHeightMm} mm</strong></span>
                <span>Poses por Rev: <strong className="font-mono text-slate-950">{workOrder.lanesAcross * workOrder.repeatsAlong} u</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              <div className="lg:col-span-2">
                <FlexoCylinderLanesVisualizer
                  rollWidthMm={workOrder.webWidthMm}
                  cylinderRepeatMm={workOrder.flexoCylinderScheme?.cylinderRepeatMm || workOrder.imposition.sheetOrRollHeightMm}
                  gearTeethZ={workOrder.flexoCylinderScheme?.gearTeethZ}
                  lanesAcross={workOrder.lanesAcross}
                  repeatsAlong={workOrder.repeatsAlong}
                  labelWidthMm={workOrder.imposition.pieceWidthMm}
                  labelHeightMm={workOrder.imposition.pieceHeightMm}
                  gapAcrossMm={workOrder.centralLaneMm}
                  gapAlongMm={workOrder.advanceLaneMm}
                  sideLaneMm={workOrder.sideLaneMm}
                  polymerCm2={workOrder.polymerCm2}
                />
              </div>

              {/* Parámetros detallados de cilindro y pistas flexo */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Parámetros Técnicos de Cilindro y Pistas
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Desarrollo Cilindro:</span>
                    <strong className="font-mono text-slate-950">
                      {workOrder.flexoCylinderScheme?.cylinderRepeatMm || workOrder.imposition.sheetOrRollHeightMm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Engranaje Z (Dientes):</span>
                    <strong className="font-mono text-sky-800">
                      Z={workOrder.flexoCylinderScheme?.gearTeethZ || Math.round((workOrder.flexoCylinderScheme?.cylinderRepeatMm || 266.7) / 3.175)} (paso 1/8")
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Ancho Bobina / Banda:</span>
                    <strong className="font-mono text-slate-950">{workOrder.webWidthMm} mm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Formas al Eje (Pistas):</span>
                    <strong className="font-mono text-slate-950">{workOrder.lanesAcross} bocas</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Formas al Avance:</span>
                    <strong className="font-mono text-slate-950">{workOrder.repeatsAlong} repeticiones</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Calle Central (Transversal):</span>
                    <strong className="font-mono text-slate-950">{workOrder.centralLaneMm} mm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Calle al Avance (Paso):</span>
                    <strong className="font-mono text-slate-950">{workOrder.advanceLaneMm} mm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Calle Lateral (Orillos):</span>
                    <strong className="font-mono text-amber-800">{workOrder.sideLaneMm} mm c/u</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Superficie Polímeros:</span>
                    <strong className="font-mono text-emerald-800 font-bold">{workOrder.polymerCm2} cm² Cyrel</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CONTROLES DE ESQUEMA DE IMPOSICIÓN (OFFSET) */
          <div className="p-6 sm:p-8 border-b border-slate-300">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
                  5
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Controles de Esquema de Imposición
                </h3>
              </div>
              <div className="text-[10px] font-bold text-slate-600 flex items-center gap-3">
                <span>Poses Totales: <strong className="font-mono text-slate-950">{workOrder.imposition.posesTotal} u</strong></span>
                <span>Aprovechamiento: <strong className="font-mono text-emerald-700">{workOrder.imposition.utilizationPercent}%</strong></span>
                <span>Merma: <strong className="font-mono text-slate-700">{workOrder.imposition.wastePercent}%</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              {/* Gráfico vectorial SVG de Imposición Insertado a la OT */}
              <div className="lg:col-span-2 bg-slate-100 p-4 rounded-xl border border-slate-300 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
                <div className="w-full max-w-md aspect-[4/3] bg-white rounded-lg border-2 border-slate-800 shadow-md relative p-2 flex flex-col justify-between">
                  
                  {/* Visualización de Pinza de Máquina */}
                  <div className="w-full bg-amber-200/90 border border-dashed border-amber-500 py-1 px-2 text-[9px] font-bold text-amber-950 flex items-center justify-between">
                    <span>PINZA DE MÁQUINA: {workOrder.imposition.gripperMarginMm} mm</span>
                    <span className="font-mono text-[8px] uppercase">Borde de agarre</span>
                  </div>

                  {/* Grilla visual de poses */}
                  <div className="flex-1 my-2 border border-slate-300 p-1 bg-slate-50 flex items-center justify-center">
                    <div
                      className="w-full h-full grid gap-1.5 p-1 items-center justify-center"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(8, Math.max(1, workOrder.imposition.posesX))}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${Math.min(8, Math.max(1, workOrder.imposition.posesY))}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: Math.min(32, workOrder.imposition.posesTotal) }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-full h-full min-h-[22px] bg-sky-100 border border-sky-400 rounded flex items-center justify-center text-[9px] font-bold text-sky-900 font-mono shadow-xs"
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cotas inferiores */}
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 border-t border-slate-300 pt-1">
                    <span>Ancho: {workOrder.imposition.sheetOrRollWidthMm} mm</span>
                    <span>Calle: {workOrder.imposition.gutterMm} mm</span>
                    <span>Sangría: {workOrder.imposition.bleedMm} mm</span>
                    <span>Alto: {workOrder.imposition.sheetOrRollHeightMm} mm</span>
                  </div>
                </div>

                <div className="mt-2 text-center text-[10px] text-slate-500 font-medium">
                  Esquema de corte a registro de marcas • Orientación {workOrder.imposition.orientation} • Disposición {workOrder.imposition.posesX} al ancho × {workOrder.imposition.posesY} al avance
                </div>
              </div>

              {/* Parámetros detallados de imposición */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cotas y Tolerancias de Imposición</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Medida de Pliego:</span>
                    <strong className="font-mono text-slate-950">
                      {workOrder.imposition.sheetOrRollWidthMm} × {workOrder.imposition.sheetOrRollHeightMm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Medida de Pieza:</span>
                    <strong className="font-mono text-slate-950">
                      {workOrder.imposition.pieceWidthMm} × {workOrder.imposition.pieceHeightMm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Poses al Ancho (Eje X):</span>
                    <strong className="font-mono text-slate-950">{workOrder.imposition.posesX} poses</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Poses al Avance (Eje Y):</span>
                    <strong className="font-mono text-slate-950">{workOrder.imposition.posesY} poses</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Pinza de Máquina:</span>
                    <strong className="font-mono text-amber-800">{workOrder.imposition.gripperMarginMm} mm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Contrapinza y Laterales:</span>
                    <strong className="font-mono text-slate-950">{workOrder.imposition.nonGripperMarginMm} mm</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Calle / Medianil:</span>
                    <strong className="font-mono text-slate-950">{workOrder.imposition.gutterMm} mm</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8 & 10. PARÁMETROS DE REFILADO, BOBINADO Y POLÍMEROS (FLEXO) */}
        {isFlexo && (
          <div className="p-6 sm:p-8 border-b border-slate-300 bg-sky-50/40">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center text-[11px] font-bold">
                  6
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Parámetros de Refilado, Bobinado y Fotopolímeros (Flexografía)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-sky-900 bg-sky-200/60 px-2 py-0.5 rounded border border-sky-300">
                Esquema de Corte de Bobina
              </span>
            </div>

            {/* Parámetros Flexo específicos: Cm² Polímero, Calles, etc. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs mb-4">
              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cm² Polímero</span>
                <span className="text-base font-black font-mono text-sky-950 block mt-0.5">
                  {workOrder.polymerCm2.toLocaleString()} cm²
                </span>
                <span className="text-[9px] text-slate-500">Área total clichés Cyrel</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Calle Central</span>
                <span className="text-base font-black font-mono text-slate-950 block mt-0.5">
                  {workOrder.centralLaneMm} mm
                </span>
                <span className="text-[9px] text-slate-500">Separación transversal pistas</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Calle al Avance</span>
                <span className="text-base font-black font-mono text-slate-950 block mt-0.5">
                  {workOrder.advanceLaneMm} mm
                </span>
                <span className="text-[9px] text-slate-500">Separación longitudinal paso</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Calle Lateral (Orillo)</span>
                <span className="text-base font-black font-mono text-amber-900 block mt-0.5">
                  {workOrder.sideLaneMm} mm
                </span>
                <span className="text-[9px] text-slate-500">Desperdicio por lado</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Formas al Eje</span>
                <span className="text-base font-black font-mono text-slate-950 block mt-0.5">
                  {workOrder.lanesAcross} bocas
                </span>
                <span className="text-[9px] text-slate-500">Pistas de impresión</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Formas al Avance</span>
                <span className="text-base font-black font-mono text-slate-950 block mt-0.5">
                  {workOrder.repeatsAlong} poses
                </span>
                <span className="text-[9px] text-slate-500">Por repetición de cilindro</span>
              </div>
            </div>

            {/* Selector e Ilustración de Sentido de Bobinado Estándar (1 al 8) */}
            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-xs font-black uppercase text-slate-900">
                    Esquema de Sentido de Bobinado Gráfico (Norma Técnica FINAT / FFTA)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Seleccione el sentido de salida requerido para la etiquetadora automática del cliente
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsWindingCustomizerOpen(true)}
                    className="no-print text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg border border-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="Definir nombres y fotos de los 8 sentidos de bobinado"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-800" />
                    <span>Definir Sentidos / Subir Fotos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWindingFullPoster(!showWindingFullPoster)}
                    className="no-print text-[11px] font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
                  >
                    {showWindingFullPoster ? 'Ver selector compacto' : 'Ver plantilla técnica completa'}
                  </button>
                  <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-300 font-mono text-xs font-bold">
                    SENTIDO ACTIVO: #{activeWindingDir}
                  </div>
                </div>
              </div>

              {/* Lámina Gráfica Técnica Completa según el adjunto oficial */}
              {showWindingFullPoster ? (
                <div className="space-y-3 animate-fadeIn">
                  <WindingDirectionFullChart
                    selectedDirection={activeWindingDir}
                    onSelectDirection={(dir) => handleSelectWinding(dir)}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowWindingFullPoster(false)}
                      className="no-print text-xs font-bold text-slate-600 hover:text-slate-900 underline py-1"
                    >
                      ← Volver a vista de botones individuales
                    </button>
                  </div>
                </div>
              ) : (
                /* Grid interactivo de los 8 Sentidos de Bobinado + Indicación Manual */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {windingDefs.map((dir) => {
                    const isSelected =
                      activeWindingDir === dir.id &&
                      !workOrder.windingDirectionManual?.startsWith('Indicación Manual:');
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => handleSelectWinding(dir as any)}
                        className={`p-2 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[120px] relative group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400/40'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white'
                        }`}
                        title={dir.title}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-xs font-black text-slate-900">{dir.id}.</span>
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              dir.category === 'Bobinado exterior'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {dir.category === 'Bobinado exterior' ? 'Ext' : 'Int'}
                          </span>
                        </div>

                        {/* Imagen o indicador limpio sin dibujos conflictivos */}
                        <div className="my-1 w-full h-12 bg-white rounded border border-slate-200 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
                          <WindingDirectionSvg
                            direction={dir.id}
                            className="w-full h-full"
                            customColor={dir.color}
                            customImageUrl={dir.imageUrl}
                            allowQuickUpload={true}
                            onOpenCustomizer={() => setIsWindingCustomizerOpen(true)}
                          />
                        </div>

                        <div className="w-full">
                          <span className="text-[10px] font-bold text-slate-900 block truncate leading-tight">
                            {dir.exitName}
                          </span>
                          <span className="text-[9px] text-slate-500 block truncate">
                            {dir.category === 'Bobinado exterior' ? 'Exterior' : 'Interior'}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* 9na Opción: Indicación Manual */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentManual = workOrder.windingDirectionManual || '';
                      const manualVal = currentManual.startsWith('Indicación Manual:')
                        ? currentManual
                        : `Indicación Manual: Sentido especial a requerimiento del cliente`;
                      handleManualWindingChange(manualVal);
                    }}
                    className={`p-2 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[120px] ${
                      workOrder.windingDirectionManual?.startsWith('Indicación Manual:')
                        ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white'
                    }`}
                    title="Indicación Manual Personalizada"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-black text-amber-700">✎</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        Manual
                      </span>
                    </div>

                    <div className="my-1 w-full h-12 bg-white rounded border border-slate-200 p-1 flex flex-col items-center justify-center text-center shadow-xs">
                      <span className="text-[10px] font-black text-amber-800 font-mono">1 al 8</span>
                      <span className="text-[8px] text-slate-500">Personalizado</span>
                    </div>

                    <div className="w-full">
                      <span className="text-[10px] font-bold text-amber-800 block truncate leading-tight">
                        Indicación Manual
                      </span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        Texto Libre
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* Indicación Manual del Sentido de Bobinado para la OT */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Sentido de Bobinado Manual / Especificación Técnica para la OT:
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Puede personalizar el texto o seleccionar arriba uno de los 8 sentidos
                  </span>
                </div>
                <input
                  type="text"
                  value={workOrder.windingDirectionManual || ''}
                  onChange={(e) => handleManualWindingChange(e.target.value)}
                  placeholder="ej. Indicación Manual: Sentido especial según máquina etiquetadora del cliente"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Ficha destacada del Sentido Seleccionado para Operador */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-20 bg-white rounded-lg border-2 border-amber-400 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <WindingDirectionSvg
                    direction={activeWindingDir}
                    className="w-full h-full"
                    customColor={windingDefs.find((d) => d.id === activeWindingDir)?.color}
                    customImageUrl={windingDefs.find((d) => d.id === activeWindingDir)?.imageUrl}
                    allowQuickUpload={true}
                    onOpenCustomizer={() => setIsWindingCustomizerOpen(true)}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">
                    Sentido de Bobinado Asignado para la OT:
                  </span>
                  <strong className="text-sm font-black text-slate-950 font-mono block">
                    {workOrder.windingDirectionManual || `Sentido ${activeWindingDir}`}
                  </strong>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    {WINDING_DIRECTIONS.find((d) => d.id === activeWindingDir)?.shortDescription}
                  </span>
                </div>
              </div>

              {/* Resumen de especificaciones de rollos resultantes */}
              {workOrder.flexoSlitting && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Diámetro de Buje:</span>
                    <strong className="text-slate-950 font-bold block font-mono">
                      {workOrder.flexoSlitting.coreDiameterInches}" ({workOrder.flexoSlitting.coreDiameterInches * 25.4} mm)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Etiquetas por Rollo:</span>
                    <strong className="text-slate-950 font-bold block font-mono">
                      {workOrder.flexoSlitting.labelsPerRoll.toLocaleString()} etiq.
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad Total de Rollos:</span>
                    <strong className="text-amber-900 font-black block font-mono">
                      {workOrder.flexoSlitting.totalRolls.toLocaleString()} rollos
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Diámetro Exterior Máx:</span>
                    <strong className="text-slate-950 font-bold block font-mono">
                      ≈ {workOrder.flexoSlitting.outerDiameterMm} mm
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. PARÁMETROS DE CORTE DE PAPEL PARA SISTEMA OFFSET */}
        {!isFlexo && workOrder.offsetCutting && (
          <div className="p-6 sm:p-8 border-b border-slate-300 bg-emerald-50/40">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                  6
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Parámetros de Corte de Papel y Guillotina (Sistema Offset)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded border border-emerald-300">
                Guillotina & Refilado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Pliego de Compra vs Pliego de Máquina
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Formato Papel Stock:</span>
                    <strong className="font-mono text-slate-950">
                      {workOrder.offsetCutting.rawSheetWidthMm} × {workOrder.offsetCutting.rawSheetHeightMm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Pliego de Entrada a Prensa:</span>
                    <strong className="font-mono text-emerald-800">
                      {workOrder.offsetCutting.pressSheetWidthMm} × {workOrder.offsetCutting.pressSheetHeightMm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Hojas de máquina por pliego:</span>
                    <strong className="font-mono text-slate-950">
                      {workOrder.offsetCutting.cutsFromRawSheet} corte(s)
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Dirección de Fibra / Hilo:</span>
                    <strong className="text-slate-950 uppercase">Al largo (Long Grain)</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 md:col-span-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Secuencia de Cortes en Guillotina Programable
                </span>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">Corte a Escuadra Base y Refilado:</strong>
                      <span className="text-slate-600 text-[11px] block">{workOrder.offsetCutting.step1GuillotineCut}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">Subdivisión y Refilado Final de Piezas:</strong>
                      <span className="text-slate-600 text-[11px] block">{workOrder.offsetCutting.step2GuillotineCut}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. INSTRUCCIONES DE POST-PRENSA, EMPAQUE Y FIRMAS DE AUTORIZACIÓN */}
        <div className="p-6 sm:p-8 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Instrucciones de Acabados / Post-Prensa:
              </span>
              <ul className="space-y-1">
                {workOrder.finishingInstructions.map((inst, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-800">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Instrucciones de Empaque y Despacho:
              </span>
              <p className="text-slate-800 leading-relaxed">{workOrder.packagingInstructions}</p>
              {workOrder.operatorNotes && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Nota del Maquinista:</span>
                  <p className="text-slate-700 italic text-[11px]">{workOrder.operatorNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* FIRMAS DE CONTROL Y LIBERACIÓN DE PRODUCCIÓN */}
          <div className="border-t-2 border-slate-300 pt-6">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-4 text-center">
              AUTORIZACIÓN Y CONTROL DE CALIDAD DE PLANTA GRÁFICA
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">Emitido por / Ventas</span>
                <span className="text-[9px] text-slate-500">{workOrder.accountExecutive}</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">Jefe de Producción</span>
                <span className="text-[9px] text-slate-500">Aprobación Técnica</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">Operador Maquinista</span>
                <span className="text-[9px] text-slate-500">Puesta a Punto & Tiro</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="text-[10px] font-bold text-slate-800 block">Control de Calidad</span>
                <span className="text-[9px] text-slate-500">Liberación Final</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal para Definir los 8 Sentidos y Subir Imágenes */}
      <WindingDirectionCustomizerModal
        isOpen={isWindingCustomizerOpen}
        onClose={() => setIsWindingCustomizerOpen(false)}
      />

      {/* Modal de Órdenes de Trabajo Guardadas */}
      <SavedWorkOrdersModal
        isOpen={isSavedOrdersModalOpen}
        onClose={() => setIsSavedOrdersModalOpen(false)}
        onLoadWorkOrder={handleLoadSavedWorkOrder}
        activeWorkOrderNumber={workOrder.orderNumber}
      />

      {/* Modal de Configuración de Correlatividad */}
      <CorrelativeConfigModal
        isOpen={isCorrelativeModalOpen}
        onClose={() => setIsCorrelativeModalOpen(false)}
        onConfigSaved={(newCfg) => {
          // If current order number starts with the old prefix or is default, we can prompt or keep
        }}
      />
    </div>
  );
};

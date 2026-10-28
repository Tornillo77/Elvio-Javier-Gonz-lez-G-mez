import React, { useState, useEffect } from 'react';
import { WorkOrderData, WorkOrderStatus } from '../types/workOrder';
import {
  auth,
  fetchUserWorkOrdersFromFirestore,
  deleteWorkOrderFromFirestore,
  saveWorkOrderToFirestore,
} from '../utils/firebase';
import {
  X,
  Factory,
  Search,
  Filter,
  Trash2,
  Printer,
  Edit3,
  Calendar,
  User,
  Package,
  Layers,
  Disc,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Loader2,
  Download,
  Upload,
  ArrowRight,
} from 'lucide-react';

interface SavedWorkOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadWorkOrder: (order: WorkOrderData) => void;
  activeWorkOrderNumber?: string;
}

const STORAGE_KEY = 'aravo_saved_work_orders_v1';

export const SavedWorkOrdersModal: React.FC<SavedWorkOrdersModalProps> = ({
  isOpen,
  onClose,
  onLoadWorkOrder,
  activeWorkOrderNumber,
}) => {
  const [orders, setOrders] = useState<WorkOrderData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const activeUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!isOpen) return;

    let localList: WorkOrderData[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading saved work orders:', e);
    }
    setOrders(localList);

    // Sync from Firestore
    setIsCloudSyncing(true);
    fetchUserWorkOrdersFromFirestore(activeUid)
      .then((cloudOrders) => {
        if (cloudOrders && cloudOrders.length > 0) {
          const map = new Map<string, WorkOrderData>();
          localList.forEach((o) => map.set(o.orderNumber, o));
          cloudOrders.forEach((o) => map.set(o.orderNumber, o as WorkOrderData));
          const merged = Array.from(map.values());
          setOrders(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch cloud work orders:', err);
      })
      .finally(() => {
        setIsCloudSyncing(false);
      });
  }, [isOpen, activeUid]);

  if (!isOpen) return null;

  const handleDelete = async (orderNumber: string) => {
    if (!confirm(`¿Eliminar la Orden de Trabajo ${orderNumber} de la lista?`)) return;
    const updated = orders.filter((o) => o.orderNumber !== orderNumber);
    setOrders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await deleteWorkOrderFromFirestore(activeUid, orderNumber);
    } catch (err) {
      console.warn('Error deleting work order from cloud:', err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `aravo_ordenes_trabajo_${Date.now()}.json`);
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setOrders(imported);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        }
      } catch (err) {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'approved':
        return { label: 'Aprobada', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'in_press':
        return { label: 'En Prensa', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
      case 'post_press':
        return { label: 'En Terminación', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'quality_control':
        return { label: 'Control Calidad', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' };
      case 'completed':
        return { label: 'Terminada', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
      case 'cancelled':
        return { label: 'Cancelada', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      default:
        return { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.quoteNumber && o.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                  Registro de Órdenes de Trabajo (OT)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  {isCloudSyncing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Sincronizando Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      <span>Cloud & Local Sync</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consulte, edite y modifique las órdenes de trabajo guardadas en taller
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° de OT, cliente, producto o presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="in_press">En Prensa</option>
              <option value="post_press">En Terminación</option>
              <option value="quality_control">Control Calidad</option>
              <option value="completed">Terminada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <Factory className="w-10 h-10 text-slate-700 mx-auto mb-2 opacity-50" />
              {orders.length === 0
                ? 'No hay Órdenes de Trabajo guardadas en el sistema. Utilice el botón "Guardar OT" en la pestaña de Orden de Trabajo para archivar órdenes.'
                : 'No se encontraron órdenes que coincidan con la búsqueda.'}
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const isCurrentlyActive = activeWorkOrderNumber === ord.orderNumber;
              const isFlexo = ord.technology === 'flexo';

              return (
                <div
                  key={ord.orderNumber}
                  className={`bg-slate-950/80 border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700 ${
                    isCurrentlyActive ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-amber-300">
                        {ord.orderNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isFlexo ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {isFlexo ? 'Flexo' : 'Offset'}
                      </span>
                      {isCurrentlyActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OT en Edición Activa
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-100 truncate">
                      {ord.productName}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                      <span>Cliente: <strong className="text-slate-300">{ord.clientName}</strong></span>
                      {ord.quoteNumber && <span>Presupuesto: <strong className="font-mono text-slate-300">{ord.quoteNumber}</strong></span>}
                      <span>Cantidad: <strong className="text-emerald-300 font-mono">{ord.requestedQuantity.toLocaleString()} {ord.quantityUnit}</strong></span>
                      <span>Fecha: <strong className="text-slate-300">{ord.createdAt}</strong></span>
                      {ord.deliveryDate && <span>Entrega: <strong className="text-amber-300">{ord.deliveryDate}</strong></span>}
                    </div>

                    {ord.operatorNotes && (
                      <div className="text-[10px] text-slate-400 italic line-clamp-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        Nota: {ord.operatorNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadWorkOrder(ord);
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Cargar y Modificar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(ord.orderNumber)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition-colors"
                      title="Eliminar OT"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={orders.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  InkColorItem,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
} from '../types/graphic';
import { PaperSearchTool } from './PaperSearchTool';
import { PantonePickerModal } from './PantonePickerModal';
import { PantoneColor } from '../utils/pantoneCatalog';
import { POST_PRESS_PROCESSES_CATALOG } from '../utils/postPressProcesses';
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  Hash,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  Palette,
  ShieldCheck,
  Plus,
  Trash2,
  Printer,
  Box,
  Check,
  AlertCircle,
  ArrowRight,
  ListPlus,
  RotateCcw,
  FileEdit,
  Eye,
  Sliders,
  Tag,
  Disc,
} from 'lucide-react';

export type ClientSubTab = 'client_data' | 'product_manual' | 'colors_substrates';

export interface ManualProductItem {
  id: string;
  name: string;
  quantityUnits: number;
  dimensions: string;
  finishingDetails: string;
}

interface ClientOrderTabProps {
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  onChangeOffset: (params: OffsetJobParams) => void;
  onChangeFlexo: (params: FlexoJobParams) => void;
  currency: CurrencyConfig;
  breakdown: QuoteBreakdown;
}

export const ClientOrderTab: React.FC<ClientOrderTabProps> = ({
  technology,
  offsetParams,
  flexoParams,
  onChangeOffset,
  onChangeFlexo,
  currency,
  breakdown,
}) => {
  const isOffset = technology === 'offset';

  // Sub-tab selection state
  const [activeSubTab, setActiveSubTab] = useState<ClientSubTab>('client_data');

  // Current values
  const clientName = isOffset ? offsetParams.clientName : flexoParams.clientName;
  const productDescription = isOffset
    ? offsetParams.productDescription || ''
    : flexoParams.productDescription || '';
  const clientPhone = isOffset ? offsetParams.clientPhone || '' : flexoParams.clientPhone || '';
  const clientEmail = isOffset ? offsetParams.clientEmail || '' : flexoParams.clientEmail || '';
  const clientContactPerson = isOffset
    ? offsetParams.clientContactPerson || ''
    : flexoParams.clientContactPerson || '';
  const clientTaxId = isOffset ? offsetParams.clientTaxId || '' : flexoParams.clientTaxId || '';
  const clientAddress = isOffset ? offsetParams.clientAddress || '' : flexoParams.clientAddress || '';

  const jobName = isOffset ? offsetParams.jobName : flexoParams.jobName;
  const quantity = isOffset ? offsetParams.quantityUnits : flexoParams.targetQuantity;

  // Multi-product items state for detailed manual breakdowns
  const [multiItems, setMultiItems] = useState<ManualProductItem[]>([
    {
      id: 'item_1',
      name: jobName.toLowerCase().includes('folleto') ? 'Estuches Biogramon de 12gr' : jobName,
      quantityUnits: quantity,
      dimensions: isOffset
        ? `${offsetParams.pieceWidthMm}×${offsetParams.pieceHeightMm} mm`
        : `${flexoParams.labelWidthMm}×${flexoParams.labelHeightMm} mm`,
      finishingDetails: 'Impreso 4/0 + Plastificado + Barniz UV sectorizado + Troquel y hendido',
    },
  ]);

  const updateClientField = (field: string, val: string) => {
    if (isOffset) {
      onChangeOffset({ ...offsetParams, [field]: val });
    } else {
      onChangeFlexo({ ...flexoParams, [field]: val });
    }
  };

  const updateQuantity = (val: number) => {
    const safeVal = Math.max(1, isNaN(val) ? 1 : val);
    if (isOffset) {
      onChangeOffset({ ...offsetParams, quantityUnits: safeVal });
    } else {
      onChangeFlexo({ ...flexoParams, targetQuantity: safeVal });
    }
  };

  const getFlexoUnitLabel = (unit: string) => {
    switch (unit) {
      case 'units':
        return 'Unidad o Etiquetas';
      case 'm2':
        return 'Metros² (m²)';
      case 'linear_meter':
        return 'Metros Lin. (ml)';
      case 'kg':
        return 'Kilogramos (kg)';
      default:
        return unit;
    }
  };

  const getFlexoUnitShort = (unit: string) => {
    switch (unit) {
      case 'units':
        return 'etiquetas';
      case 'm2':
        return 'm²';
      case 'linear_meter':
        return 'ml';
      case 'kg':
        return 'kg';
      default:
        return unit;
    }
  };

  // Quick quantity increment buttons adapting to technology and unit
  const quickQuantities = isOffset
    ? [1000, 2500, 5000, 10000, 25000, 50000]
    : flexoParams.quoteUnit === 'units'
    ? [2500, 5000, 10000, 25000, 50000, 100000]
    : flexoParams.quoteUnit === 'kg'
    ? [50, 100, 250, 500, 1000, 2500]
    : [500, 1000, 2500, 5000, 10000, 20000];

  const [isPantoneModalOpen, setIsPantoneModalOpen] = useState(false);

  const currentInks: InkColorItem[] = isOffset ? offsetParams.inkColorsFront : flexoParams.inkColors;
  const currentInksCount = currentInks.length;

  const handleSelectPantone = (pantone: PantoneColor) => {
    if (currentInksCount >= 8) return;
    const newColor: InkColorItem = {
      id: `pantone_${Date.now()}`,
      name: pantone.code,
      coveragePercent: pantone.recommendedCoveragePercent,
      colorHex: pantone.hex,
      isSpot: true,
      isPantone: true,
      pantoneCode: pantone.code,
    };

    if (isOffset) {
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: [...offsetParams.inkColorsFront, newColor],
      });
    } else {
      onChangeFlexo({
        ...flexoParams,
        inkColors: [...flexoParams.inkColors, newColor],
      });
    }
  };

  const handleRemoveColor = (id: string) => {
    if (isOffset) {
      if (offsetParams.inkColorsFront.length <= 1) return;
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: offsetParams.inkColorsFront.filter((c) => c.id !== id),
      });
    } else {
      if (flexoParams.inkColors.length <= 1) return;
      onChangeFlexo({
        ...flexoParams,
        inkColors: flexoParams.inkColors.filter((c) => c.id !== id),
      });
    }
  };

  // Quick text template apply
  const applyQuickTemplate = (name: string, desc: string) => {
    if (isOffset) {
      onChangeOffset({
        ...offsetParams,
        jobName: name,
        productDescription: desc,
      });
    } else {
      onChangeFlexo({
        ...flexoParams,
        jobName: name,
        productDescription: desc,
      });
    }
  };

  // Multi-item handlers
  const handleAddMultiItem = () => {
    const newItem: ManualProductItem = {
      id: `item_${Date.now()}`,
      name: `Producto / Ítem ${multiItems.length + 1}`,
      quantityUnits: 5000,
      dimensions: '180×260 mm',
      finishingDetails: '4/0 colores + Troquelado + Hendido',
    };
    setMultiItems([...multiItems, newItem]);
  };

  const handleUpdateMultiItem = (id: string, field: keyof ManualProductItem, val: any) => {
    setMultiItems(
      multiItems.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveMultiItem = (id: string) => {
    if (multiItems.length <= 1) return;
    setMultiItems(multiItems.filter((item) => item.id !== id));
  };

  const handleCompileMultiItemsToDescription = () => {
    const compiled = multiItems
      .map(
        (it, idx) =>
          `• Ítem ${idx + 1}: ${it.name} (${it.quantityUnits.toLocaleString()} u, ${it.dimensions || 'estándar'}) - ${it.finishingDetails}`
      )
      .join('\n');

    const mainTitle = multiItems[0]?.name || jobName;

    if (isOffset) {
      onChangeOffset({
        ...offsetParams,
        jobName: mainTitle,
        productDescription: compiled,
      });
    } else {
      onChangeFlexo({
        ...flexoParams,
        jobName: mainTitle,
        productDescription: compiled,
      });
    }
  };

  // Discrepancy detector: if jobName has "folleto" but user has "estuche" in description
  const hasDiscrepancy =
    (jobName.toLowerCase().includes('folleto') ||
      jobName.toLowerCase().includes('tríptico') ||
      jobName.toLowerCase().includes('triptico')) &&
    (productDescription.toLowerCase().includes('estuche') ||
      productDescription.toLowerCase().includes('caja') ||
      productDescription.toLowerCase().includes('biogramon'));

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Datos del Cliente & Pedido de Producción
            </h2>
            <p className="text-xs text-slate-400">
              Gestión comercial del cliente, descripción técnica manual de productos y volumen del pedido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
          <span className="text-slate-400">Tirada Total:</span>
          <span className="font-mono font-bold text-amber-400">
            {quantity.toLocaleString()} {isOffset ? 'unidades' : getFlexoUnitShort(flexoParams.quoteUnit)}
          </span>
        </div>
      </div>

      {/* Discrepancy Alert Helper */}
      {hasDiscrepancy && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block">
                Aviso de Sincronización: El título del Producto dice &quot;{jobName}&quot;
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                En tu descripción ingresaste estuches/cajas pero el título aún conserva &quot;Folleto tríptico&quot;.
                Haz clic en sincronizar para actualizar el título a Estuches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              updateClientField(
                'jobName',
                productDescription.includes('Biogramon')
                  ? 'Estuches Biogramon de 12gr'
                  : 'Estuches en Cartulina Plegadiza'
              )
            }
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Sincronizar a &quot;Estuches&quot;</span>
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab('client_data')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'client_data'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Datos del Cliente & Pedido</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('product_manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'product_manual'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>2. Descripción Manual de Productos</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
              activeSubTab === 'product_manual'
                ? 'bg-slate-950 text-amber-400 border-amber-600'
                : 'bg-sky-950 text-sky-400 border-sky-800/60'
            }`}
          >
            Carga Manual / Ítems
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('colors_substrates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'colors_substrates'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>3. Colores Pantone® & Sustratos</span>
          <span className="text-[10px] text-slate-400 font-mono">({currentInksCount}/8C)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DATOS DEL CLIENTE & PEDIDO                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'client_data' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client & Contact Info (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-400" />
                <span>Información Comercial del Cliente</span>
              </h3>
              <span className="text-[11px] text-slate-500">Se incluirá en el presupuesto oficial</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Cliente / Razón Social */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-400" />
                  <span>Razón Social / Nombre del Cliente *</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => updateClientField('clientName', e.target.value)}
                  placeholder="Ej. Distribuidora Gráfica Andina S.A."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Nombre / Título del Producto Principal */}
              <div className="sm:col-span-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nombre / Tipo de Producto *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('product_manual')}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Abrir en Pestaña Manual</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => updateClientField('jobName', e.target.value)}
                  placeholder="Ej. Estuches Biogramon de 12gr (o Cajas / Folletos)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 font-bold text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Este texto es el título que figura en la cabecera del programa y en el presupuesto oficial.
                </span>
              </div>

              {/* Descripcion del Producto */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descripción del Producto</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Ej: Estuches, gramaje, tintas y acabados
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => updateClientField('productDescription', e.target.value)}
                  placeholder="Ej: Estuches Biogramon de 12gr, impreso a 4/0 colores + Plastificado+Barniz UV sectorizado"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-y text-xs"
                />
              </div>

              {/* Persona de Contacto */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Persona de Contacto</span>
                </label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={(e) => updateClientField('clientContactPerson', e.target.value)}
                  placeholder="Ej. Lic. Carlos Benítez"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* RUC / Identificación Fiscal */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RUC / CUIT / CIF / NIF</span>
                </label>
                <input
                  type="text"
                  value={clientTaxId}
                  onChange={(e) => updateClientField('clientTaxId', e.target.value)}
                  placeholder="Ej. 80012345-6"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teléfono de Contacto</span>
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => updateClientField('clientPhone', e.target.value)}
                  placeholder="Ej. +595 981 123 456"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => updateClientField('clientEmail', e.target.value)}
                  placeholder="Ej. compras@cliente.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Dirección / Despacho */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dirección de Despacho / Entrega</span>
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => updateClientField('clientAddress', e.target.value)}
                  placeholder="Ej. Av. Mariscal López 1250 esq. San Martín, Asunción"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Quantity & Scaled Volume (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Main Quantity Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Carga de Cantidad de Pedido</span>
                </h3>
                <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">
                  {isOffset ? 'Unidades Finales' : getFlexoUnitLabel(flexoParams.quoteUnit)}
                </span>
              </div>

              {/* Input with Big Numbers */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-xs text-slate-400">Cantidad Total Requerida:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    step={isOffset ? 500 : flexoParams.quoteUnit === 'units' ? 1000 : 100}
                    value={quantity}
                    onChange={(e) => updateQuantity(Number(e.target.value))}
                    className="w-full bg-transparent font-mono text-3xl font-black text-amber-300 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400 uppercase shrink-0 font-mono">
                    {isOffset ? 'u' : getFlexoUnitShort(flexoParams.quoteUnit)}
                  </span>
                </div>
              </div>

              {/* Quick Increment Buttons */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Tiradas habituales rápidas:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {quickQuantities.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => updateQuantity(q)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        quantity === q
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {q.toLocaleString()}{' '}
                      {isOffset
                        ? 'u'
                        : flexoParams.quoteUnit === 'units'
                        ? 'etiq.'
                        : flexoParams.quoteUnit === 'linear_meter'
                        ? 'ml'
                        : flexoParams.quoteUnit}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Flexo, allow changing quote unit */}
              {!isOffset && (
                <div className="pt-3 border-t border-slate-800 text-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unidad de Medida del Pedido:</span>
                    </label>
                    <span className="text-amber-400 font-mono font-bold text-[11px]">
                      {getFlexoUnitLabel(flexoParams.quoteUnit)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        id: 'units',
                        label: 'Unidad o Etiquetas',
                        short: 'u / etiq.',
                        hint: 'Tirada en piezas/etiquetas',
                      },
                      {
                        id: 'm2',
                        label: 'Metros Cuadrados',
                        short: 'm²',
                        hint: 'Superficie de bobina',
                      },
                      {
                        id: 'linear_meter',
                        label: 'Metros Lineales',
                        short: 'ml',
                        hint: 'Longitud de bobina',
                      },
                      {
                        id: 'kg',
                        label: 'Kilogramos',
                        short: 'kg',
                        hint: 'Peso total sustrato',
                      },
                    ].map((unit) => {
                      const isActive = flexoParams.quoteUnit === unit.id;
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => {
                            let newQty = flexoParams.targetQuantity;
                            if (unit.id === 'units' && newQty < 1000) {
                              newQty = 10000;
                            } else if (unit.id === 'kg' && newQty > 5000) {
                              newQty = 250;
                            } else if (unit.id === 'm2' && newQty > 10000) {
                              newQty = 1500;
                            }
                            onChangeFlexo({
                              ...flexoParams,
                              quoteUnit: unit.id as any,
                              targetQuantity: newQty,
                            });
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold ring-2 ring-amber-400/30'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight">{unit.label}</div>
                          <div
                            className={`text-[10px] font-mono mt-0.5 ${
                              isActive ? 'text-slate-950 font-bold' : 'text-amber-400'
                            }`}
                          >
                            ({unit.short})
                          </div>
                          <div
                            className={`text-[9px] mt-0.5 truncate ${
                              isActive ? 'text-slate-900 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {unit.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Order Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Resumen Instantáneo del Pedido</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">
                    {isOffset
                      ? 'Precio Unitario:'
                      : flexoParams.quoteUnit === 'units'
                      ? 'Precio por Etiqueta:'
                      : flexoParams.quoteUnit === 'm2'
                      ? 'Precio por m²:'
                      : flexoParams.quoteUnit === 'linear_meter'
                      ? 'Precio por Metro Lineal:'
                      : 'Precio por Kg:'}
                  </span>
                  <span className="text-base font-mono font-bold text-amber-400">
                    {currency.symbol}
                    {isOffset || flexoParams.quoteUnit === 'units'
                      ? breakdown.pricePerUnit.toFixed(Math.max(3, currency.decimals))
                      : flexoParams.quoteUnit === 'm2'
                      ? (breakdown.pricePerM2 || 0).toFixed(currency.decimals)
                      : flexoParams.quoteUnit === 'linear_meter'
                      ? (breakdown.pricePerLinearMeter || 0).toFixed(currency.decimals)
                      : (breakdown.pricePerKg || 0).toFixed(currency.decimals)}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Precio por Millar:</span>
                  <span className="text-base font-mono font-bold text-slate-100">
                    {currency.symbol}
                    {breakdown.pricePerThousand.toLocaleString(undefined, {
                      minimumFractionDigits: currency.decimals,
                    })}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Tiempo Máquina Aravo:</span>
                  <span className="text-base font-mono font-bold text-sky-400">
                    {breakdown.totalTimeHours} h
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Total con IVA:</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {currency.symbol}
                    {breakdown.finalTotalPrice.toLocaleString(undefined, {
                      minimumFractionDigits: currency.decimals,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DESCRIPCIÓN MANUAL DE PRODUCTOS (PESTAÑA SOLICITADA)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'product_manual' && (
        <div className="flex flex-col gap-6">
          {/* Top Panel: Carga Manual Principal */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-amber-400" />
                  <span>Carga Manual de la Descripción del Producto</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escribe o edita libremente el nombre oficial del producto y su ficha técnica. Se actualizará en todo el presupuesto y reportes PDF.
                </p>
              </div>

              {/* Botón de Limpiar a Blanco */}
              <button
                type="button"
                onClick={() => applyQuickTemplate('', '')}
                className="text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 flex items-center gap-1.5 self-start sm:self-auto transition-all"
                title="Vaciar para empezar 100% de cero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Vaciar / Empezar en Blanco</span>
              </button>
            </div>

            {/* Quick 1-Click Templates */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                ⚡ Plantillas rápidas de carga en 1 clic (para no tener que tipear todo):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyQuickTemplate(
                      'Etiquetas Autoadhesivas Frutas & Alimentos',
                      'Etiquetas autoadhesivas en bobina BOPP blanco brillante 50µ, impresas a 4 colores UV + Barniz de sobreimpresión + Troquel rotativo'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400 text-xs font-semibold text-slate-200 hover:text-amber-300 transition-all flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Etiquetas BOPP Alimentos</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickTemplate(
                      'Etiquetas Vinos & Licores con Hot Stamping Oro',
                      'Etiquetas autoadhesivas en papel enológico verjurado con Hot Stamping oro en línea + Barniz relieve + Troquel magnético'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-sky-500/20 border border-slate-800 hover:border-sky-400 text-xs font-semibold text-slate-200 hover:text-sky-300 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Etiquetas Vinos (Hot Stamping)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickTemplate(
                      'Mangas Termoencogibles Shrink Sleeves',
                      'Mangas termocontraíbles PETG 45 micras impresas a 6 colores UV en bobina continua con formado tubular y costura solvente'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-400 text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mangas Termoencogibles (Sleeves)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickTemplate(
                      'Etiquetas Térmico Directo para Logística',
                      'Etiquetas autoadhesivas térmico directo protegido 100x150 mm en rollos continuos de 500 unidades para balanzas y códigos de barra'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-purple-500/20 border border-slate-800 hover:border-purple-400 text-xs font-semibold text-slate-200 hover:text-purple-300 transition-all flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Etiquetas Térmico Directo</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickTemplate(
                      'Films Bilaminados Flow-Pack para Snacks',
                      'Films bilaminados BOPP metalizado 40 micras impresos a 6 colores flexo en bobina continua para envasado automático horizontal'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flow-Pack / Snacks en Bobina</span>
                </button>
              </div>
            </div>

            {/* Inputs Principales: Nombre y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Nombre / Título del Producto */}
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <label className="text-slate-200 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nombre / Título Oficial del Producto *</span>
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-mono">Nombre Principal</span>
                </label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => updateClientField('jobName', e.target.value)}
                  placeholder="Ej: Estuches Biogramon de 12gr"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <p className="text-[11px] text-slate-500">
                  Es el título principal que reemplaza &quot;Folleto tríptico&quot; en todas las cabeceras, resúmenes y documentos.
                </p>
              </div>

              {/* Descripción Técnica Detallada */}
              <div className="md:col-span-7 flex flex-col gap-1.5">
                <label className="text-slate-200 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Descripción Técnica Completa del Producto</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Detalle / Procesos</span>
                </label>
                <textarea
                  rows={3}
                  value={productDescription}
                  onChange={(e) => updateClientField('productDescription', e.target.value)}
                  placeholder="Ej: Estuches Biogramon de 12gr, impreso a 4/0 colores + Plastificado+Barniz UV sectorizado"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-y leading-relaxed font-sans"
                />
                <p className="text-[11px] text-slate-500">
                  Describe sustratos, gramajes, tintas front/back, plastificados, barnices, troqueles y empaque.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Desglose Manual de Múltiples Productos / Ítems */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-emerald-400" />
                  <span>Desglose de Múltiples Productos / Ítems del Pedido (Opcional)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Si este presupuesto abarca varios ítems o medidas del cliente (ej. Estuche 12gr, Estuche 25gr e Inserto), agrégalos y compílalos a la descripción oficial.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleAddMultiItem}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Agregar Otro Producto</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompileMultiItemsToDescription}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Compilar a Descripción Oficial</span>
                </button>
              </div>
            </div>

            {/* Lista de Ítems */}
            <div className="flex flex-col gap-3">
              {multiItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 md:w-16 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold font-mono flex items-center justify-center text-[11px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Ítem</span>
                  </div>

                  {/* Nombre del ítem */}
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 block mb-1">Nombre del Producto / Modelo:</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateMultiItem(item.id, 'name', e.target.value)}
                      placeholder="Ej. Estuches Biogramon 12gr"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="w-28 shrink-0">
                    <label className="text-[10px] text-slate-500 block mb-1">Cantidad (u):</label>
                    <input
                      type="number"
                      value={item.quantityUnits}
                      onChange={(e) =>
                        handleUpdateMultiItem(item.id, 'quantityUnits', Number(e.target.value))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Medidas */}
                  <div className="w-32 shrink-0">
                    <label className="text-[10px] text-slate-500 block mb-1">Medidas (mm):</label>
                    <input
                      type="text"
                      value={item.dimensions}
                      onChange={(e) => handleUpdateMultiItem(item.id, 'dimensions', e.target.value)}
                      placeholder="180×260 mm"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Detalles / Acabados */}
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 block mb-1">Especificación técnica:</label>
                    <input
                      type="text"
                      value={item.finishingDetails}
                      onChange={(e) =>
                        handleUpdateMultiItem(item.id, 'finishingDetails', e.target.value)
                      }
                      placeholder="4/0 colores + Plastificado + Troquel"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Eliminar */}
                  {multiItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMultiItem(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors self-end md:self-center"
                      title="Eliminar este ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa: Cómo se reflejará en la Cotización Oficial y PDF</span>
              </span>
              <span className="text-[11px] text-slate-400">Presupuesto en Tiempo Real</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Cliente:</span>
                <span className="text-sm font-bold text-slate-200 mt-0.5 block">{clientName}</span>
                <span className="text-[11px] text-slate-400">{clientContactPerson || 'Sin contacto asignado'}</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-amber-500 uppercase font-bold block">Producto Oficial:</span>
                <span className="text-sm font-black text-amber-300 mt-0.5 block">{jobName}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {quantity.toLocaleString()} {isOffset ? 'unidades' : getFlexoUnitShort(flexoParams.quoteUnit)}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Cotización:</span>
                <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block">
                  {currency.symbol}
                  {breakdown.finalTotalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: currency.decimals,
                  })}
                </span>
                <span className="text-[11px] text-slate-400">
                  {breakdown.totalTimeHours} h de máquina Aravo
                </span>
              </div>
            </div>

            {productDescription && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Descripción Técnica Completa:
                </span>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans font-medium">
                  {productDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: COLORES PANTONE® & SUSTRATOS                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'colors_substrates' && (
        <div className="flex flex-col gap-6">
          {/* Sección: Configuración de Colores y Catálogo Pantone® Directo (Prensas de 8 Cuerpos) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">
                      Colores del Pedido & Catálogo Pantone® Directo
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        currentInksCount > 4
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {currentInksCount} de 8 cuerpos
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Añade colores directos (Ej: <strong className="text-amber-300">Pantone 100 C</strong>) cuando el cliente requiera más de 4 colores. Nuestras prensas Offset (Heidelberg 8C) y Flexo (Nilpeter / ETIRAMA 350mm) cuentan con 8 estaciones de impresión.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPantoneModalOpen(true)}
                disabled={currentInksCount >= 8}
                className="text-xs px-3.5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 self-start sm:self-auto shrink-0"
              >
                <Palette className="w-4 h-4" />
                <span>+ Añadir Pantone® (Ej: 100 C)</span>
              </button>
            </div>

            {/* 8-color Advantage Banner when colors > 4 */}
            {currentInksCount > 4 ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 block">
                    ✓ Producción en Línea sin Doble Pasada ({currentInksCount} Colores Solicitados)
                  </span>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    El trabajo requiere <strong>{currentInksCount} colores</strong>. Gracias a que nuestra planta dispone de prensas de <strong>8 cuerpos</strong>{' '}
                    ({isOffset ? 'Heidelberg Speedmaster 8 Colores' : 'Nilpeter FA-350 / ETIRAMA 350mm de 8 Estaciones UV'}), este pedido se imprime íntegramente en una sola pasada con calce perfecto y sin recargo de desmontaje ni segundas pasadas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Prensa asignada: <strong className="text-slate-200">{isOffset ? 'Offset Heidelberg SM 74 / XL 106 (8C)' : 'Flexo Nilpeter 350mm / ETIRAMA 350mm (8C UV)'}</strong>
                  </span>
                </span>
                <span className="text-[11px] text-amber-400/90 font-mono">
                  Quedan {8 - currentInksCount} estaciones libres
                </span>
              </div>
            )}

            {/* Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
              {currentInks.map((col, idx) => (
                <div
                  key={col.id}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Cuerpo {idx + 1}
                    </span>
                    {col.isPantone && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        PMS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: col.colorHex }}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate" title={col.name}>
                      {col.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="font-mono">{col.coveragePercent}% cob</span>
                    {currentInks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(col.id)}
                        className="text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Eliminar color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Herramienta de Búsqueda y Filtro de Tipos de Papel */}
          <PaperSearchTool
            technology={technology}
            offsetParams={offsetParams}
            flexoParams={flexoParams}
            onChangeOffset={onChangeOffset}
            onChangeFlexo={onChangeFlexo}
            currency={currency}
          />
        </div>
      )}

      {/* Modal Catálogo Pantone (PMS) */}
      <PantonePickerModal
        isOpen={isPantoneModalOpen}
        onClose={() => setIsPantoneModalOpen(false)}
        onSelectPantone={handleSelectPantone}
        currentColorsCount={currentInksCount}
        maxColors={8}
        technologyLabel={
          isOffset
            ? 'Offset Heidelberg (8 Cuerpos)'
            : 'Flexografía Nilpeter / ETIRAMA (350 mm - 8 Cuerpos)'
        }
      />
    </div>
  );
};

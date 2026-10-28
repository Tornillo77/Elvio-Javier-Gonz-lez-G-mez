import React, { useState } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  FlexoQuoteUnit,
  InkColorItem,
} from '../types/graphic';
import { calculateFlexoQuote } from '../utils/quoteCalculator';
import { PantonePickerModal } from './PantonePickerModal';
import { PantoneColor } from '../utils/pantoneCatalog';
import { getFlexoMachineCalibrations } from '../utils/machinePresets';
import { RollSlittingVisualizer } from './RollSlittingVisualizer';
import { PostPressFinishingManager } from './PostPressFinishingManager';
import { PostPressParameterizer } from './PostPressParameterizer';
import {
  WINDING_DIRECTIONS,
  WindingDirectionSvg,
  WindingDirectionFullChart,
  useWindingDefinitions,
} from './WindingDirectionIcon';
import { WindingDirectionCustomizerModal } from './WindingDirectionCustomizerModal';
import { CommercialMarginCommissionPanel } from './CommercialMarginCommissionPanel';
import {
  Camera,
  Clock,
  Disc,
  Layers,
  Palette,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Sliders,
  Scissors,
  Sparkles,
  Printer,
  ShieldCheck,
  Crosshair,
  Eye,
  ArrowRight,
  Maximize2,
  Check,
  Calculator,
  AlertCircle,
  Divide,
  Gauge,
  TrendingDown,
} from 'lucide-react';

interface FlexoCalculatorProps {
  params: FlexoJobParams;
  onChangeParams: (params: FlexoJobParams) => void;
  currency: CurrencyConfig;
}

export const FlexoCalculator: React.FC<FlexoCalculatorProps> = ({
  params,
  onChangeParams,
  currency,
}) => {
  const [isPantoneModalOpen, setIsPantoneModalOpen] = useState(false);
  const [activeFlexoTab, setActiveFlexoTab] = useState<'schematic' | 'slitting'>('schematic');
  const [centerInZ, setCenterInZ] = useState<boolean>(true);
  const [visualMode, setVisualMode] = useState<'single_z' | 'continuous'>('single_z');
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [showFullWindingChart, setShowFullWindingChart] = useState<boolean>(false);
  const [isWindingCustomizerOpen, setIsWindingCustomizerOpen] = useState<boolean>(false);
  const windingDefs = useWindingDefinitions();

  const quoteResult = calculateFlexoQuote(params);
  const { metrics, breakdown, inkResult } = quoteResult;

  // Cylinder development, measurements and centering calculations
  const effectiveCylinderMm =
    params.gearTeethZ && params.gearTeethZ > 0
      ? params.gearTeethZ * 3.175
      : (params.cylinderRepeatMm > 0 ? params.cylinderRepeatMm : 304.8);

  const labelW = params.labelWidthMm || 80;
  const labelH = params.labelHeightMm || 100;
  const gapX = params.gapAcrossMm !== undefined ? params.gapAcrossMm : 3;
  const gapY = params.gapAlongMm !== undefined ? params.gapAlongMm : 12.4;
  const lanes = Math.max(1, metrics.labelsAcross || 1);
  const repeatsZ = Math.max(1, metrics.labelsAlongRepeat || 1);

  // Regla Técnica de Encuentro y Troquel Rotativo (Flexografía):
  // Al final del clisé o troquel lleva siempre la MITAD de la separación.
  // Ej: 2 formas de 140mm = 280mm. Con Z 96 (304.8mm), sobra 24.8mm repartidos
  // entre la cantidad de formas: 24.8 / 2 = 12.4mm.
  // En el medio va 12.4mm, en el extremo inferior (garganta) va 6.2mm y en el
  // extremo superior va 6.2mm. Al troquelar continuo: 6.2 + 6.2 = 12.4mm.
  const shapesAlongZ = repeatsZ;
  const shapesTotalHeightMm = shapesAlongZ * labelH;
  const cylinderRemainderMm = Math.max(0, Number((effectiveCylinderMm - shapesTotalHeightMm).toFixed(2)));
  const calculatedIdealGapAlongMm = shapesAlongZ > 0 ? Number((cylinderRemainderMm / shapesAlongZ).toFixed(2)) : 0;
  const idealHalfGapMm = Number((calculatedIdealGapAlongMm / 2).toFixed(2));

  // Posicionamiento real en el cilindro:
  // Extremo superior = mitad de separación (garganta superior)
  const halfGapAlongY = Number((gapY / 2).toFixed(2));
  const marginZTopMm = halfGapAlongY;
  const internalOccupiedHeightMm = shapesAlongZ * labelH + (shapesAlongZ - 1) * gapY;
  const marginZBottomMm = Math.max(
    0,
    Number((effectiveCylinderMm - (marginZTopMm + internalOccupiedHeightMm)).toFixed(2))
  );
  // Al troquelar continuo entre el final de una vuelta y el inicio de la siguiente:
  const continuousSeamGapMm = Number((marginZBottomMm + marginZTopMm).toFixed(2));
  const isEquallyDistributed = Math.abs(continuousSeamGapMm - gapY) < 0.2;

  // Para compatibilidad
  const marginZMm = marginZTopMm;

  const totalOccupiedWidthMm = lanes * labelW + (lanes - 1) * gapX;
  const totalOccupiedHeightMm = marginZTopMm + internalOccupiedHeightMm + marginZBottomMm;

  const centerOfZMm = effectiveCylinderMm / 2;
  const marginLateralMm = Math.max(0, (params.rollWidthMm - totalOccupiedWidthMm) / 2);
  const centerOfRollMm = params.rollWidthMm / 2;
  const primaryInkColor = params.inkColors[0]?.colorHex || '#f59e0b';

  const updateParam = <K extends keyof FlexoJobParams>(key: K, value: FlexoJobParams[K]) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const handleApplySlitCutWidth = (slitWidthMm: number) => {
    updateParam('rollWidthMm', slitWidthMm);
    setSyncToast(`✓ Ancho de banda flexo actualizado a ${slitWidthMm} mm`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleUnitChange = (unit: FlexoQuoteUnit) => {
    updateParam('quoteUnit', unit);
  };

  // Color management (up to 8 colors/stations for Nilpeter & ETIRAMA 350mm)
  const addColor = () => {
    if (params.inkColors.length >= 8) return;
    const newColor: InkColorItem = {
      id: `flexo_col_${Date.now()}`,
      name: `Tinta Directa ${params.inkColors.length + 1}`,
      coveragePercent: 20,
      colorHex: '#8b5cf6',
      isSpot: true,
    };
    updateParam('inkColors', [...params.inkColors, newColor]);
  };

  const handleSelectPantone = (pantone: PantoneColor) => {
    if (params.inkColors.length >= 8) return;
    const newColor: InkColorItem = {
      id: `pantone_${Date.now()}`,
      name: pantone.code,
      coveragePercent: pantone.recommendedCoveragePercent,
      colorHex: pantone.hex,
      isSpot: true,
      isPantone: true,
      pantoneCode: pantone.code,
    };
    updateParam('inkColors', [...params.inkColors, newColor]);
  };

  const removeColor = (id: string) => {
    updateParam('inkColors', params.inkColors.filter((c) => c.id !== id));
  };

  const updateColor = (id: string, field: keyof InkColorItem, value: any) => {
    const updated = params.inkColors.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    updateParam('inkColors', updated);
  };

  // Preset machine loader for Nilpeter 350mm & ETIRAMA 350mm & Custom Machines
  const handleSelectFlexoMachine = (calib: import('../types/graphic').FlexoMachineCalibration) => {
    const safeRoll = Math.min(
      calib.maxRollWidthMm,
      Math.max(calib.minRollWidthMm, params.rollWidthMm || calib.maxRollWidthMm)
    );
    const wearPercent =
      calib.wearReductionPercent ??
      Math.max(
        0,
        Math.round(
          ((calib.nominalSpeedMetersPerMinute - calib.speedMetersPerMinute) /
            Math.max(1, calib.nominalSpeedMetersPerMinute)) *
            100
        )
      );

    onChangeParams({
      ...params,
      machineModelId: calib.id,
      machineModelName: calib.name,
      rollWidthMm: safeRoll,
      machineMaxRollWidthMm: calib.maxRollWidthMm,
      machineMinRollWidthMm: calib.minRollWidthMm,
      machineNominalSpeedMetersPerMinute: calib.nominalSpeedMetersPerMinute,
      machineWearReductionPercent: wearPercent,
      plateWidthMm: calib.maxRollWidthMm,
      plateHeightMm: params.cylinderRepeatMm || 500,
      machineSpeedMetersPerMinute: calib.speedMetersPerMinute,
      runWastePercent: calib.standardWastePercent,
      setupWasteMeters: calib.setupWasteMeters,
    });
  };

  const handleSelectFlexoPreset = (presetKey: 'nilpeter' | 'etirama_fit' | 'etirama_evo') => {
    const allCalibs = getFlexoMachineCalibrations();
    const idMap: Record<string, string> = {
      nilpeter: 'nilpeter_fa350_8c',
      etirama_fit: 'etirama_fit350_8c',
      etirama_evo: 'etirama_evo350_8c',
    };
    const target = allCalibs.find((c) => c.id === idMap[presetKey]);
    if (target) {
      handleSelectFlexoMachine(target);
    }
  };

  const toggleFinishing = (id: string) => {
    const updated = params.finishings.map((f) =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    updateParam('finishings', updated);
  };

  const updateFinishingCost = (id: string, unitCost: number) => {
    const updated = params.finishings.map((f) =>
      f.id === id ? { ...f, unitCost } : f
    );
    updateParam('finishings', updated);
  };

  // Cylinder gear teeth Z handler
  const handleTeethChange = (teeth: number) => {
    const repeat = Number((teeth * 3.175).toFixed(1)); // 1/8" standard CP
    const shapes = Math.max(1, Math.floor((repeat + 0.05) / Math.max(1, params.labelHeightMm)));
    const occupied = shapes * params.labelHeightMm;
    const remainder = Math.max(0, repeat - occupied);
    const newIdealGap = shapes > 0 ? Number((remainder / shapes).toFixed(2)) : params.gapAlongMm;

    onChangeParams({
      ...params,
      gearTeethZ: teeth,
      cylinderRepeatMm: repeat,
      gapAlongMm: newIdealGap,
    });
    setSyncToast(`✓ Cilindro Z=${teeth} (${repeat} mm) - Separación calculada: ${newIdealGap} mm`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleApplyIdealCylinderGap = (idealGap: number) => {
    updateParam('gapAlongMm', idealGap);
    setSyncToast(
      `✓ Separación de troquel aplicada: ${idealGap} mm (Garganta sup: ${(idealGap / 2).toFixed(1)}mm • inf: ${(idealGap / 2).toFixed(1)}mm)`
    );
    setTimeout(() => setSyncToast(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Technology summary */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/40 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Flexografía a Bobina
            </span>
            <span className="text-slate-400 text-xs font-medium">
              Alimentación en continuo • Cotización en m², metro lineal o kg
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            {params.jobName || 'Trabajo Flexográfico en Bobina'}
          </h2>
          <p className="text-xs text-slate-400">
            Cliente: <span className="text-slate-200 font-medium">{params.clientName}</span> • Sustrato:{' '}
            <span className="text-amber-400 font-semibold">{params.substrateType}</span>
          </p>
          {params.productDescription && (
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
              <span className="text-slate-400 font-semibold">Producto:</span> <span className="italic">{params.productDescription}</span>
            </p>
          )}
        </div>

        {/* Quick KPI pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Metros Lineales</span>
            <span className="text-sm font-mono font-bold text-amber-400">
              {metrics.grossLinearMeters.toLocaleString()} ml
            </span>
            <span className="text-[10px] text-slate-500 block">({metrics.grossM2} m²)</span>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Peso Bobina</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {metrics.grossWeightKg} kg
            </span>
            <span className="text-[10px] text-slate-500 block">{params.substrateGsm} g/m²</span>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aravo (Tiempo)</span>
            <span className="text-sm font-mono font-bold text-sky-400">
              {breakdown.totalTimeHours} h
            </span>
            <span className="text-[10px] text-slate-500 block">Prep: {breakdown.setupTimeHours}h • Tiro: {breakdown.runTimeHours}h</span>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Precio ({params.quoteUnit === 'units' ? 'por etiqueta' : params.quoteUnit})
            </span>
            <span className="text-sm font-mono font-bold text-amber-300">
              {params.quoteUnit === 'm2' && `${currency.symbol}${breakdown.pricePerM2}/m²`}
              {params.quoteUnit === 'linear_meter' && `${currency.symbol}${breakdown.pricePerLinearMeter}/ml`}
              {params.quoteUnit === 'kg' && `${currency.symbol}${breakdown.pricePerKg}/kg`}
              {params.quoteUnit === 'units' && `${currency.symbol}${breakdown.pricePerUnit}/etiq.`}
            </span>
            <span className="text-[10px] text-slate-500 block">Total: {currency.symbol}{breakdown.finalTotalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Selector Principal de Vista: Esquema Cilindro Z vs Esquema de Corte de Bobina (Planilla) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFlexoTab('schematic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeFlexoTab === 'schematic'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>🎯 Cálculo y Esquema Cilindro Z (Centrado en Z)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeFlexoTab === 'schematic'
                  ? 'bg-slate-950/30 text-slate-950'
                  : 'bg-slate-800 text-amber-400'
              }`}
            >
              Z={params.gearTeethZ || 96} ({params.cylinderRepeatMm} mm)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFlexoTab('slitting')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeFlexoTab === 'slitting'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black ring-2 ring-teal-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>✂️ Esquema de Corte según Bobina (Planilla Slitter)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeFlexoTab === 'slitting'
                  ? 'bg-slate-950/30 text-slate-950'
                  : 'bg-teal-500/20 text-teal-300'
              }`}
            >
              10 Cortes • Jumbos
            </span>
          </button>
        </div>

        {syncToast && (
          <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/50 text-teal-300 text-xs font-mono font-bold flex items-center gap-2 shadow-md">
            <Check className="w-4 h-4 text-teal-400" />
            <span>{syncToast}</span>
          </div>
        )}
      </div>

      {/* Conditionally render Slitting Visualizer Full-Width */}
      {activeFlexoTab === 'slitting' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-teal-400">Modo Esquema de Corte Activo:</span>
              <span>
                Calculando división de bobina madre a bobina hija para máquina flexo (actualmente {params.rollWidthMm} mm).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveFlexoTab('schematic')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all text-xs"
            >
              <span>← Volver a Parámetros y Cilindro Z</span>
            </button>
          </div>

          <RollSlittingVisualizer
            initialMasterRollWidthMm={1000}
            initialCutWidthMm={params.rollWidthMm}
            initialMasterRollLengthM={Math.round(metrics.grossLinearMeters || 1500)}
            orderMl={Math.round(metrics.grossLinearMeters || 5000)}
            currency={currency}
            onApplyCutWidth={handleApplySlitCutWidth}
          />
        </div>
      ) : (
      /* Main Grid: Left Config Form + Right Visualizer & Tech Summary */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Unidad de Cotización y Dimensiones de Bobina */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    1. Unidad de Cotización y Geometría de Bobina
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cotización versátil en metros cuadrados (m²), metros lineales (ml), kilos (kg) o unidades.
                  </p>
                </div>
              </div>
            </div>

            {/* 1.0 Selección Rápida de Prensa Flexográfica (350 mm - 8 Colores) */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Prensa Flexo Activa (Banda 350 mm • 8 Colores UV):</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  8 Estaciones en Línea
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {getFlexoMachineCalibrations().map((calib) => {
                  const isSelected = params.machineModelId === calib.id;
                  const wearPercent =
                    calib.wearReductionPercent !== undefined
                      ? calib.wearReductionPercent
                      : Math.max(
                          0,
                          Math.round(
                            ((calib.nominalSpeedMetersPerMinute - calib.speedMetersPerMinute) /
                              Math.max(1, calib.nominalSpeedMetersPerMinute)) *
                              100
                          )
                        );

                  return (
                    <button
                      key={calib.id}
                      type="button"
                      onClick={() => handleSelectFlexoMachine(calib)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono truncate">{calib.name}</span>
                        {calib.isCustom && (
                          <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        1&2. Banda: {calib.maxRollWidthMm}mm (Mín: {calib.minRollWidthMm}mm)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        3&4. Merma: {calib.standardWastePercent}% • Arranque: {calib.setupWasteMeters}ml
                      </div>
                      <div className="text-[10px] font-mono mt-0.5 flex items-center justify-between">
                        <span className="text-amber-400 font-bold">
                          5. {calib.speedMetersPerMinute} m/min
                        </span>
                        {wearPercent > 0 && (
                          <span className="text-[9px] text-rose-400 font-bold">
                            -{wearPercent}% desgaste
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Controles Editables de la Prensa Flexo Activa: Merma y Velocidad */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">
                      Prensa Activa: <strong className="text-slate-100">{params.machineModelName || 'Nilpeter FA-350'}</strong>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                      1. Máx: {params.machineMaxRollWidthMm || 350}mm | 2. Mín: {params.machineMinRollWidthMm || 120}mm
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Costo: {currency.symbol}{params.machineHourlyRate}/h • Puesta en marcha: {params.machineSetupMinutes} min
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  {/* Merma de Tirada (%) Editable */}
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 block mb-1 flex items-center justify-between">
                      <span>3. Merma de Tirada (%):</span>
                      <span className="text-slate-500 font-normal">Editable</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        max="25"
                        step="0.1"
                        value={params.runWastePercent}
                        onChange={(e) => updateParam('runWastePercent', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-purple-500/50 rounded-lg px-2.5 py-1 text-xs text-purple-200 font-mono font-bold focus:border-purple-400 outline-none pr-7"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-purple-400 font-mono">%</span>
                    </div>
                  </div>

                  {/* Merma de Arranque (ml) Editable */}
                  <div>
                    <label className="text-[10px] font-bold text-sky-300 block mb-1 flex items-center justify-between">
                      <span>4. Merma Arranque (ml):</span>
                      <span className="text-slate-500 font-normal">Editable</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={params.setupWasteMeters}
                        onChange={(e) => updateParam('setupWasteMeters', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-sky-500/50 rounded-lg px-2.5 py-1 text-xs text-sky-200 font-mono font-bold focus:border-sky-400 outline-none pr-7"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-sky-400 font-mono">ml</span>
                    </div>
                  </div>

                  {/* Velocidad en m/min Editable */}
                  <div>
                    <label className="text-[10px] font-bold text-amber-300 block mb-1 flex items-center justify-between">
                      <span>5. Velocidad (m/min):</span>
                      <span className="text-amber-400/80 font-normal">Por desgaste</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={params.machineSpeedMetersPerMinute}
                        onChange={(e) => updateParam('machineSpeedMetersPerMinute', Number(e.target.value))}
                        className="w-full bg-slate-950 border-2 border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-amber-200 font-mono font-black focus:border-amber-400 outline-none pr-12"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-amber-400 font-mono">m/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Unit Selector (m2, ml, kg, units) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Unidad Comercial de Cotización para Flexografía:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleUnitChange('m2')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    params.quoteUnit === 'm2'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono">Por m²</div>
                  <div className="text-[10px] text-slate-400">Metros Cuadrados</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitChange('linear_meter')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    params.quoteUnit === 'linear_meter'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono">Por Metro Lineal</div>
                  <div className="text-[10px] text-slate-400">Longitud Bobina</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitChange('kg')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    params.quoteUnit === 'kg'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono">Por Kilogramo</div>
                  <div className="text-[10px] text-slate-400">Peso Material</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitChange('units')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    params.quoteUnit === 'units'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">Por Unidad o Etiquetas</div>
                  <div className="text-[10px] text-slate-400">Etiquetas / Envases</div>
                </button>
              </div>
            </div>

            {/* Target Quantity Input */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block">
                  Cantidad a Producir ({params.quoteUnit === 'units' ? 'Unidad o Etiquetas' : params.quoteUnit}):
                </label>
                <span className="text-[11px] text-slate-400">
                  {params.quoteUnit === 'm2' && 'Superficie neta solicitada en m²'}
                  {params.quoteUnit === 'linear_meter' && 'Longitud neta de la bobina en metros'}
                  {params.quoteUnit === 'kg' && 'Peso neto del material en kilogramos'}
                  {params.quoteUnit === 'units' && 'Tirada total en unidad o etiquetas finales'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={params.targetQuantity}
                  onChange={(e) => updateParam('targetQuantity', Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-400 font-black text-right outline-none focus:border-amber-400"
                />
                <span className="text-xs font-bold font-mono text-slate-300">
                  {params.quoteUnit === 'units' ? 'etiq. / u' : params.quoteUnit}
                </span>
              </div>
            </div>

            {/* Web Width & Lanes (Ancho de bobina y pistas) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/70">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Ancho Bobina (mm)
                </label>
                <input
                  type="number"
                  value={params.rollWidthMm}
                  onChange={(e) => updateParam('rollWidthMm', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-500 outline-none font-bold"
                  title="Ancho del paso de máquina flexo (ej: 250, 330, 450, 600 mm)"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Pistas Transversales
                </label>
                <input
                  type="number"
                  value={params.lanesAcross}
                  onChange={(e) => updateParam('lanesAcross', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none font-bold"
                  title="Número de etiquetas o bocas montadas en el ancho del rollo"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Ancho Etiqueta (mm)
                </label>
                <input
                  type="number"
                  value={params.labelWidthMm}
                  onChange={(e) => updateParam('labelWidthMm', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Alto / Desarrollo (mm)
                </label>
                <input
                  type="number"
                  value={params.labelHeightMm}
                  onChange={(e) => updateParam('labelHeightMm', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Cylinder Development & Gaps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Dientes Z (Engranaje)
                </label>
                <input
                  type="number"
                  value={params.gearTeethZ || 96}
                  onChange={(e) => handleTeethChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-sky-400 font-mono font-bold focus:border-amber-500 outline-none"
                  title="Paso 1/8 pulgada (3.175 mm) por diente Z"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Desarrollo Cilindro (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.cylinderRepeatMm}
                  onChange={(e) => updateParam('cylinderRepeatMm', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Sep. Transversal (mm)
                </label>
                <input
                  type="number"
                  value={params.gapAcrossMm}
                  onChange={(e) => updateParam('gapAcrossMm', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Sep. Longitudinal (mm)
                  </label>
                  {isEquallyDistributed ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      ✓ Equitativa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyIdealCylinderGap(calculatedIdealGapAlongMm)}
                      className="text-[9px] font-mono text-amber-400 hover:underline hover:text-amber-300 font-bold"
                      title="Ajustar a separación equitativa de cilindro"
                    >
                      Ajustar a {calculatedIdealGapAlongMm}mm
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={params.gapAlongMm}
                  onChange={(e) => updateParam('gapAlongMm', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 outline-none"
                />
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span title="Mitad de separación en extremo superior e inferior (garganta)">
                    Garganta: {marginZTopMm.toFixed(1)}mm
                  </span>
                  <span title="Separación al troquelar continuo entre vueltas">
                    Troquel: {continuousSeamGapMm.toFixed(1)}mm
                  </span>
                </div>
              </div>
            </div>

            {/* Panel Técnico Especial: Distribución de Separación en Cilindro Z & Garganta de Troquel */}
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Divide className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Distribución Técnica de Separación en Cilindro Z & Troquel</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        Regla de Garganta Flexo
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Al final del clisé o troquel lleva siempre la mitad de la separación (garganta/encuentro sup e inf) para que al troquelar continuo todas las separaciones sean iguales.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyIdealCylinderGap(calculatedIdealGapAlongMm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-sm ${
                    isEquallyDistributed
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20 active:scale-95'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {isEquallyDistributed
                      ? `Separación Equilibrada (${gapY.toFixed(1)} mm)`
                      : `Aplicar Separación Equitativa (${calculatedIdealGapAlongMm} mm)`}
                  </span>
                </button>
              </div>

              {/* Métricas Técnicas de la Distribución del Cilindro */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Cilindro Z</span>
                  <span className="text-amber-400 font-bold">
                    Z={params.gearTeethZ || 96} ({effectiveCylinderMm.toFixed(1)} mm)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Formas al Paso (N)</span>
                  <span className="text-slate-200 font-bold">
                    {shapesAlongZ} formas ({shapesTotalHeightMm.toFixed(1)} mm)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Sobra Cilindro (Δ)</span>
                  <span className="text-amber-300 font-bold">
                    {cylinderRemainderMm.toFixed(1)} mm
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <span className="text-[10px] text-amber-300 block font-sans font-bold">Sep. en el Medio</span>
                  <span className="text-amber-400 font-black text-xs">
                    {calculatedIdealGapAlongMm.toFixed(1)} mm
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-sky-500/30 bg-sky-500/5">
                  <span className="text-[10px] text-sky-300 block font-sans font-bold">Garganta Sup / Inf</span>
                  <span className="text-sky-400 font-black text-xs">
                    {idealHalfGapMm.toFixed(1)} mm (½ sep)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-[10px] text-emerald-300 block font-sans font-bold">Troquel Continuo</span>
                  <span className="text-emerald-400 font-black text-xs">
                    {(idealHalfGapMm * 2).toFixed(1)} mm ({idealHalfGapMm} + {idealHalfGapMm})
                  </span>
                </div>
              </div>

              {/* Barra de Verificación de Uniformidad */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEquallyDistributed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {isEquallyDistributed ? (
                      <span className="text-emerald-300 font-medium">
                        ✓ Troquelado Continuo Óptimo: las separaciones internas ({gapY.toFixed(1)}mm) y el encuentro en costura ({continuousSeamGapMm.toFixed(1)}mm) son exactamente iguales.
                      </span>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        Aviso: Separación actual ({gapY.toFixed(1)}mm) difiere de la calculada ({calculatedIdealGapAlongMm}mm). La costura tiene {continuousSeamGapMm.toFixed(1)}mm. Haz clic en "Aplicar" para unificar.
                      </span>
                    )}
                  </span>
                </div>

                <span className="font-mono text-slate-500">
                  Fórmula: ({effectiveCylinderMm.toFixed(1)}mm − {shapesTotalHeightMm.toFixed(1)}mm) ÷ {shapesAlongZ} = {calculatedIdealGapAlongMm.toFixed(1)}mm
                </span>
              </div>
            </div>

            {/* Substrate & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Tipo de Sustrato / Film / Rollo
                </label>
                <input
                  type="text"
                  value={params.substrateType}
                  onChange={(e) => updateParam('substrateType', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                  placeholder="BOPP, PE, PET, Autoadhesivo..."
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Gramaje Equivalente (g/m²)
                </label>
                <input
                  type="number"
                  value={params.substrateGsm}
                  onChange={(e) => updateParam('substrateGsm', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Costo Sustrato ({currency.symbol}/kg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.substrateCostPerKg}
                  onChange={(e) => updateParam('substrateCostPerKg', Number(e.target.value))}
                  className="w-full min-w-[130px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                  placeholder={currency.code === 'PYG' ? '18000' : '2.80'}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consumo de Tinta Flexo (2.0 g/m²) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    2. Consumo de Tinta Flexográfica por Metro Cuadrado (m²)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fórmula Técnica: Cobertura % × Base g/m² ({params.inkGramsPerM2} g/m² Flexo) × m² impresos.
                  </p>
                </div>
              </div>

              {/* Base rate adjuster */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400">Base Flexo:</span>
                <input
                  type="number"
                  step="0.1"
                  value={params.inkGramsPerM2}
                  onChange={(e) => updateParam('inkGramsPerM2', Number(e.target.value))}
                  className="w-14 bg-slate-900 border border-slate-700 text-center rounded px-1 py-0.5 text-xs text-emerald-400 font-mono font-bold outline-none"
                />
                <span className="text-[11px] text-slate-400">g/m²</span>
              </div>
            </div>

            {/* Ink Cost */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs gap-2">
              <span className="text-slate-300 font-medium whitespace-nowrap">
                Precio Medio Tintas UV / Solvente ({currency.symbol}/kg):
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">{currency.symbol}</span>
                <input
                  type="number"
                  step="any"
                  value={params.inkCostPerKg}
                  onChange={(e) => updateParam('inkCostPerKg', Number(e.target.value))}
                  className="w-full sm:w-40 min-w-[130px] bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 font-mono text-xs sm:text-sm font-bold outline-none text-right focus:border-amber-400"
                  placeholder={currency.code === 'PYG' ? '140000' : '22.00'}
                />
              </div>
            </div>

            {/* Inks list */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Estaciones de Impresión Flexo (Nilpeter / ETIRAMA 350mm)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                    params.inkColors.length > 4
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {params.inkColors.length} de 8 cuerpos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPantoneModalOpen(true)}
                    disabled={params.inkColors.length >= 8}
                    className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm disabled:opacity-40"
                    title="Añadir color directo Pantone oficial (Ej: Pantone 100 C)"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    + Color Pantone® (Ej: 100 C)
                  </button>

                  <button
                    type="button"
                    onClick={addColor}
                    disabled={params.inkColors.length >= 8}
                    className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tinta / Barniz UV
                  </button>
                </div>
              </div>

              {/* Notice when colors > 4 */}
              {params.inkColors.length > 4 && (
                <div className="mb-3 bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 flex items-start gap-2.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-amber-300">Capacidad de 8 Cuerpos en Línea:</strong>{' '}
                    El pedido contiene <strong>{params.inkColors.length} colores</strong> (CMYK + colores directos Pantone® especiales). Gracias a las 8 estaciones de nuestras prensas{' '}
                    <strong className="text-white">Nilpeter FA-350 / ETIRAMA 350mm</strong>, toda la tirada se produce en{' '}
                    <span className="text-amber-300 font-semibold underline decoration-amber-500/60">una sola pasada continua</span> sin necesidad de segundas pasadas ni tiempos muertos de desmontaje.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {params.inkColors.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center gap-2.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-slate-700 shrink-0 shadow-sm"
                      style={{ backgroundColor: col.colorHex }}
                    />
                    <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColor(col.id, 'name', e.target.value)}
                        className="bg-transparent text-slate-200 font-medium text-xs outline-none w-full"
                      />
                      {col.isPantone && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 shrink-0">
                          PMS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-400">Cobertura:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={col.coveragePercent}
                        onChange={(e) =>
                          updateColor(col.id, 'coveragePercent', Number(e.target.value))
                        }
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-slate-100 font-bold outline-none"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeColor(col.id)}
                      disabled={params.inkColors.length <= 1}
                      className="text-slate-500 hover:text-rose-400 p-1 disabled:opacity-30 transition-colors"
                      title="Eliminar color"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Ink Live Result */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-400 font-bold block">
                  Consumo Estimado Tinta Flexo:
                </span>
                <span className="text-slate-400 text-[11px]">
                  Superficie total procesada:{' '}
                  <span className="text-slate-200 font-mono font-medium">
                    {inkResult.totalAreaM2} m²
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Kilos Totales</span>
                  <span className="text-base font-mono font-bold text-emerald-300">
                    {inkResult.totalKg} kg
                  </span>
                </div>
                <div className="text-right border-l border-emerald-800/50 pl-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Costo Tintas</span>
                  <span className="text-base font-mono font-bold text-slate-100">
                    {currency.symbol}{inkResult.totalCost.toFixed(currency.decimals)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Fotopolímeros (Clichés) y Aravo (Tiempos de Máquina) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    3. Fotopolímeros (Clichés) y Tiempos de Máquina (Aravo)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aravo = Tiempo/Hora en Guaraní. Montaje en camisas/cilindros y tiro a velocidad.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Clichés Digitales
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold">
                  {quoteResult.clichesCount} clichés
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">1 por estación</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Costo Cliché ({currency.symbol})
                </label>
                <input
                  type="number"
                  value={params.clicheCostPerPiece}
                  onChange={(e) => updateParam('clicheCostPerPiece', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Puesta en Marcha (min)
                </label>
                <input
                  type="number"
                  value={params.machineSetupMinutes}
                  onChange={(e) => updateParam('machineSetupMinutes', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none"
                  title="Montaje de camisas, registro fotocélula y ajuste de viscosidad"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center justify-between">
                  <span>5. Velocidad (m/min) *</span>
                  <span className="text-[9px] text-amber-400/80 font-normal">Ajuste manual desgaste</span>
                </label>
                <input
                  type="number"
                  value={params.machineSpeedMetersPerMinute}
                  onChange={(e) => updateParam('machineSpeedMetersPerMinute', Number(e.target.value))}
                  className="w-full bg-slate-950 border-2 border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-400 outline-none font-black"
                  title="Velocidad real de producción cargada manualmente por desgaste mecánico"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="text-[11px] font-bold text-sky-300 block mb-1">
                  4. Merma Metros Lineales (ml)
                </label>
                <input
                  type="number"
                  value={params.setupWasteMeters}
                  onChange={(e) => updateParam('setupWasteMeters', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-sky-500/40 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono font-bold focus:border-sky-400 outline-none"
                  title="Metros de bobina consumidos en puesta a punto y calce de registro"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">
                  3. Merma Estándar (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.runWastePercent}
                  onChange={(e) => updateParam('runWastePercent', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono font-bold focus:border-purple-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Costo Hora ({currency.symbol}/h)
                </label>
                <input
                  type="number"
                  value={params.machineHourlyRate}
                  onChange={(e) => updateParam('machineHourlyRate', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                />
              </div>
            </div>

            {/* Panel Informativo de los 5 Parámetros & Desgaste al Paso del Tiempo */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 flex flex-col gap-2 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] border-b border-slate-850 pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resumen de los 5 Parámetros Flexo:</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  Prensa: <strong className="text-amber-300">{params.machineModelName || 'Nilpeter FA-350'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-sans text-[9px]">1. Ancho Máx Bobina:</span>
                  <span className="font-bold text-emerald-300">{params.machineMaxRollWidthMm || 350} mm</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-sans text-[9px]">2. Ancho Mín Bobina:</span>
                  <span className="font-bold text-emerald-300">{params.machineMinRollWidthMm || 120} mm</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-sans text-[9px]">3. Merma Estándar:</span>
                  <span className="font-bold text-purple-300">{params.runWastePercent}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-sans text-[9px]">4. Merma Metros:</span>
                  <span className="font-bold text-sky-300">{params.setupWasteMeters} ml</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-sans text-[9px]">5. Velocidad Actual:</span>
                  <span className="font-bold text-amber-300">{params.machineSpeedMetersPerMinute} m/min</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400 pt-1">
                <span>
                  ⚙️ <strong>Ajuste de desgaste:</strong> Las máquinas por su desgaste al paso del tiempo van reduciendo su velocidad; cárgala manualmente en el campo 5.
                </span>
                {(params.machineWearReductionPercent ?? 0) > 0 && (
                  <span className="font-mono text-rose-400 font-bold shrink-0">
                    -{params.machineWearReductionPercent}% reducción por desgaste
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Rebobinado y Post-Prensa */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-2">
              4. Rebobinado Final y Acabados Rotativos
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Etiquetas por Rollo Hijo
                </label>
                <input
                  type="number"
                  value={params.labelsPerRoll}
                  onChange={(e) => updateParam('labelsPerRoll', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Mandril / Core Interior
                </label>
                <select
                  value={params.coreDiameterInches}
                  onChange={(e) => updateParam('coreDiameterInches', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none"
                >
                  <option value={1}>1 pulgada (25.4 mm)</option>
                  <option value={1.5}>1.5 pulgadas (38.1 mm)</option>
                  <option value={3}>3 pulgadas (76.2 mm) - Estándar</option>
                </select>
              </div>
            </div>

            {/* Sentido de Bobinado (1 a 8 Estándar con Indicación Manual para OT) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sentido de Bobinado (1 al 8 e Indicación Manual)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Posición de salida de la etiqueta para colocación automática • Se transfiere automáticamente a la OT
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsWindingCustomizerOpen(true)}
                    className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="Subir imágenes personalizadas y definir los 8 sentidos de bobinado"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Definir Sentidos / Subir Fotos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFullWindingChart(!showFullWindingChart)}
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                  >
                    {showFullWindingChart ? 'Ocultar plantilla técnica' : 'Ver plantilla técnica completa'}
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Sentido Activo: #{params.windingDirection || 1}
                  </span>
                </div>
              </div>

              {/* Lámina Completa Desplegable (Imagen Técnica Norma FINAT/FFTA) */}
              {showFullWindingChart && (
                <div className="animate-fadeIn">
                  <WindingDirectionFullChart
                    selectedDirection={params.windingDirection || 1}
                    manualText={params.windingDirectionManual || ''}
                    onSelectDirection={(dir) => {
                      onChangeParams({
                        ...params,
                        windingDirection: dir.id,
                        windingDirectionManual: dir.title,
                      });
                    }}
                    onManualTextChange={(text) => {
                      onChangeParams({
                        ...params,
                        windingDirectionManual: text,
                      });
                    }}
                  />
                </div>
              )}

              {/* Grid de los 8 Sentidos Oficiales + Botón Indicación Manual */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                {windingDefs.map((dir) => {
                  const isSelected =
                    (params.windingDirection || 1) === dir.id &&
                    !params.windingDirectionManual?.startsWith('Indicación Manual:');
                  return (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => {
                        onChangeParams({
                          ...params,
                          windingDirection: dir.id as any,
                          windingDirectionManual: dir.title,
                        });
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[105px] text-left relative group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-md'
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

                      {/* Imagen personalizada o indicador esquemático limpio sin dibujos conflictivos */}
                      <div className="w-full h-11 bg-slate-950/90 rounded border border-slate-800 p-0.5 flex items-center justify-center my-0.5 shadow-inner overflow-hidden">
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

                {/* 9na Opción Especial: Indicación Manual */}
                <button
                  type="button"
                  onClick={() => {
                    const currentManual = params.windingDirectionManual || '';
                    const manualVal = currentManual.startsWith('Indicación Manual:')
                      ? currentManual
                      : `Indicación Manual: Sentido especial a requerimiento de envasadora`;
                    onChangeParams({
                      ...params,
                      windingDirectionManual: manualVal,
                    });
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[105px] text-left ${
                    params.windingDirectionManual?.startsWith('Indicación Manual:')
                      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                  title="Indicación Manual Personalizada de Bobinado"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-mono font-black text-amber-400">
                      ✎
                    </span>
                    <span className="text-[7px] font-bold px-1 rounded uppercase bg-amber-500/20 text-amber-300">
                      Manual
                    </span>
                  </div>

                  <div className="w-full h-11 bg-slate-950/90 rounded border border-slate-800 p-1 flex flex-col items-center justify-center text-center my-0.5 shadow-inner">
                    <span className="text-[10px] font-black text-amber-300 font-mono">
                      1 al 8
                    </span>
                    <span className="text-[8px] text-slate-400">
                      Personalizado
                    </span>
                  </div>

                  <div className="w-full mt-1">
                    <span className="text-[9px] font-bold text-amber-300 block truncate leading-tight">
                      Indicación Manual
                    </span>
                    <span className="text-[8px] text-slate-400 block truncate">
                      Texto Libre
                    </span>
                  </div>
                </button>
              </div>

              {/* Campo para indicación manual o personalizada */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Indicación Manual / Descripción de Bobinado para la OT:
                </label>
                <input
                  type="text"
                  value={params.windingDirectionManual || ''}
                  onChange={(e) => updateParam('windingDirectionManual', e.target.value)}
                  placeholder="ej. Indicación Manual: Sentido especial según máquina etiquetadora del cliente"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Suite Completa de 10 Procesos de Acabados y Terminación Post-Prensa */}
            <div className="mt-2">
              <PostPressFinishingManager
                finishings={params.finishings}
                onChangeFinishings={(updated) => updateParam('finishings', updated)}
                currency={currency}
                grossSheets={Math.round(metrics.grossLinearMeters || 1000)}
                quantityUnits={metrics.totalLabelsOrUnits || 5000}
                totalPaperM2={metrics.grossM2 || 500}
                technology="flexo"
              />
            </div>

            {/* Parametrización Específica de Acabados Seleccionados (Barniz UV, Laminado, etc.) */}
            <div className="mt-2">
              <PostPressParameterizer
                finishings={params.finishings}
                onChangeFinishings={(updated: any) => updateParam('finishings', updated)}
                currency={currency}
                grossSheets={Math.round(metrics.grossLinearMeters || 1000)}
                quantityUnits={metrics.totalLabelsOrUnits || 5000}
                totalPaperM2={metrics.grossM2 || 500}
                technology="flexo"
              />
            </div>

            {/* Shortcut Card to Cutting Scheme (Planilla Slitter) */}
            <div className="bg-gradient-to-r from-teal-950/40 via-teal-900/30 to-slate-900/80 border border-teal-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md mt-2">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-teal-200">
                      Esquema de Corte de Bobina (Slitter / Rebobinadora - Planilla)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                      Aprovechamiento
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Planilla de distribución de bobina madre (1000 mm) a bobinas hijas ({params.rollWidthMm} mm actual), jumbos y orillo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFlexoTab('slitting')}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <span>Abrir Esquema de Corte</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Schematic Visualizer & Production Summary (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Schematic 2D Web Visualizer Centered on Z */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
            {/* Header with View Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Esquema de Cilindro y Pistas Flexo
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Desarrollo perimetral Z centrado con cotas simétricas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFlexoTab('slitting')}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Abrir cálculo de bobina madre y corte longitudinal según planilla"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Esquema de Corte</span>
                </button>
              </div>
            </div>

            {/* Centering & View Mode Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
              {/* Centering in Z Toggle Button */}
              <button
                type="button"
                onClick={() => setCenterInZ(!centerInZ)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all border ${
                  centerInZ
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Centrar simétricamente las etiquetas en el centro exacto del desarrollo del cilindro Z"
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                    centerInZ ? 'bg-amber-400 text-slate-950 font-black' : 'border border-slate-600'
                  }`}
                >
                  {centerInZ && '✓'}
                </div>
                <span>Centrado en Centro del Z</span>
              </button>

              {/* Single Z vs Continuous Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setVisualMode('single_z')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    visualMode === 'single_z'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1 Vuelta Z
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode('continuous')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    visualMode === 'continuous'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bobina Continua
                </button>
              </div>
            </div>

            {/* SVG Visualizer of Web & Lanes with Image Centered in Center of Z */}
            {(() => {
              const svgWebW = 290;
              const svgWebH = visualMode === 'single_z' ? 260 : 310;
              const svgWebX = 72;
              const svgWebY = 26;
              const scaleX = svgWebW / Math.max(10, params.rollWidthMm);
              const turnsCount = visualMode === 'single_z' ? 1 : 2;
              const scaleY = (svgWebH / turnsCount) / Math.max(10, effectiveCylinderMm);

              const centerZSvgY = svgWebY + centerOfZMm * scaleY;
              const topMarginSvgH = marginZMm * scaleY;
              const bottomMarginSvgY = svgWebY + (marginZMm + totalOccupiedHeightMm) * scaleY;
              const bottomMarginSvgH = marginZMm * scaleY;
              const refileLeftSvgW = marginLateralMm * scaleX;
              const refileRightSvgW = marginLateralMm * scaleX;

              return (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                  <svg
                    viewBox={`0 0 460 ${visualMode === 'single_z' ? 340 : 390}`}
                    className="w-full max-h-[320px] select-none font-sans"
                  >
                    <defs>
                      <linearGradient id="webBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0b1120" />
                        <stop offset="100%" stopColor="#030712" />
                      </linearGradient>

                      <linearGradient id="labelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={primaryInkColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={primaryInkColor} stopOpacity="0.08" />
                      </linearGradient>

                      <marker
                        id="arrowMarker"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                      </marker>

                      <marker
                        id="dimensionArrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                      </marker>
                    </defs>

                    {/* Web Substrate Carrier */}
                    <rect
                      x={svgWebX}
                      y={svgWebY}
                      width={svgWebW}
                      height={svgWebH}
                      rx="4"
                      fill="url(#webBgGrad)"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />

                    {/* Feed Direction Indicator Arrow */}
                    <line
                      x1={svgWebX + svgWebW / 2}
                      y1="4"
                      x2={svgWebX + svgWebW / 2}
                      y2="18"
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                      markerEnd="url(#arrowMarker)"
                    />
                    <text
                      x={svgWebX + svgWebW / 2}
                      y="14"
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      AVANCE DE BOBINA ↓
                    </text>

                    {/* Width Dimension at Top */}
                    <text
                      x={svgWebX + svgWebW / 2}
                      y={svgWebY - 6}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      Ancho de Bobina: {params.rollWidthMm} mm
                    </text>

                    {/* Lateral Edge Trims (Refiles de Banda) */}
                    {marginLateralMm > 0 && (
                      <>
                        {/* Left Trim */}
                        <rect
                          x={svgWebX}
                          y={svgWebY}
                          width={refileLeftSvgW}
                          height={svgWebH}
                          fill="#84cc16"
                          fillOpacity="0.12"
                          stroke="#84cc16"
                          strokeDasharray="2 2"
                          strokeWidth="1"
                        />
                        <text
                          x={svgWebX + refileLeftSvgW / 2}
                          y={svgWebY + svgWebH / 2}
                          fill="#84cc16"
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(-90 ${svgWebX + refileLeftSvgW / 2} ${svgWebY + svgWebH / 2})`}
                          className="font-mono"
                        >
                          Refile {marginLateralMm.toFixed(1)}mm
                        </text>

                        {/* Right Trim */}
                        <rect
                          x={svgWebX + svgWebW - refileRightSvgW}
                          y={svgWebY}
                          width={refileRightSvgW}
                          height={svgWebH}
                          fill="#84cc16"
                          fillOpacity="0.12"
                          stroke="#84cc16"
                          strokeDasharray="2 2"
                          strokeWidth="1"
                        />
                        <text
                          x={svgWebX + svgWebW - refileRightSvgW / 2}
                          y={svgWebY + svgWebH / 2}
                          fill="#84cc16"
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(90 ${svgWebX + svgWebW - refileRightSvgW / 2} ${svgWebY + svgWebH / 2})`}
                          className="font-mono"
                        >
                          Refile {marginLateralMm.toFixed(1)}mm
                        </text>
                      </>
                    )}

                    {/* Single Cylinder Development Bounds (Z=0 and Z=effectiveCylinderMm) */}
                    {Array.from({ length: turnsCount }).map((_, turnIdx) => {
                      const turnOffsetY = svgWebY + turnIdx * (svgWebH / turnsCount);
                      const turnH = svgWebH / turnsCount;
                      const turnCenterY = turnOffsetY + centerOfZMm * scaleY;
                      const turnTopMarginY = turnOffsetY + marginZTopMm * scaleY;
                      const turnBottomMarginY = turnOffsetY + (marginZTopMm + internalOccupiedHeightMm) * scaleY;

                      return (
                        <g key={`cylinder-turn-${turnIdx}`}>
                          {/* Turn Seam Top Line */}
                          <line
                            x1={svgWebX}
                            y1={turnOffsetY}
                            x2={svgWebX + svgWebW}
                            y2={turnOffsetY}
                            stroke="#64748b"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <text
                            x={svgWebX + 4}
                            y={turnOffsetY + 10}
                            fill="#94a3b8"
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            Z=0 {turnIdx > 0 ? `(Vuelta ${turnIdx + 1})` : '(Costura Inicio Cliché)'} • Garganta Sup {marginZTopMm.toFixed(1)}mm
                          </text>

                          {/* ============================================================== */}
                          {/* CRITICAL: CENTER OF Z AXIS LINE (Eje Central de Cilindro Z)   */}
                          {/* ============================================================== */}
                          <line
                            x1={svgWebX - 25}
                            y1={turnCenterY}
                            x2={svgWebX + svgWebW + 25}
                            y2={turnCenterY}
                            stroke="#f59e0b"
                            strokeWidth="1.8"
                            strokeDasharray="6 3"
                          />
                          <circle
                            cx={svgWebX + svgWebW / 2}
                            cy={turnCenterY}
                            r="3.5"
                            fill="#f59e0b"
                            stroke="#0f172a"
                            strokeWidth="1.5"
                          />

                          {/* Center of Z Callout Badge */}
                          <rect
                            x={svgWebX + svgWebW + 4}
                            y={turnCenterY - 11}
                            width="68"
                            height="22"
                            rx="4"
                            fill="#78350f"
                            stroke="#f59e0b"
                            strokeWidth="1"
                          />
                          <text
                            x={svgWebX + svgWebW + 8}
                            y={turnCenterY - 1}
                            fill="#fbbf24"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            CENTRO DE Z
                          </text>
                          <text
                            x={svgWebX + svgWebW + 8}
                            y={turnCenterY + 8}
                            fill="#fef08a"
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            {centerOfZMm.toFixed(1)} mm
                          </text>

                          {/* Registration Mark Crosshairs on Web Carrier */}
                          <g>
                            <line x1={svgWebX + 4} y1={turnCenterY} x2={svgWebX + 16} y2={turnCenterY} stroke="#10b981" strokeWidth="1.2" />
                            <line x1={svgWebX + 10} y1={turnCenterY - 6} x2={svgWebX + 10} y2={turnCenterY + 6} stroke="#10b981" strokeWidth="1.2" />
                            <circle cx={svgWebX + 10} cy={turnCenterY} r="3" fill="none" stroke="#10b981" strokeWidth="1" />

                            <line x1={svgWebX + svgWebW - 16} y1={turnCenterY} x2={svgWebX + svgWebW - 4} y2={turnCenterY} stroke="#10b981" strokeWidth="1.2" />
                            <line x1={svgWebX + svgWebW - 10} y1={turnCenterY - 6} x2={svgWebX + svgWebW - 10} y2={turnCenterY + 6} stroke="#10b981" strokeWidth="1.2" />
                            <circle cx={svgWebX + svgWebW - 10} cy={turnCenterY} r="3" fill="none" stroke="#10b981" strokeWidth="1" />
                          </g>

                          {/* Symmetrical Z Margins Ruler Callouts (Left Side) */}
                          {marginZTopMm > 0 && (
                            <>
                              {/* Top Margin Z Bracket (Garganta Superior: mitad de separación) */}
                              <line
                                x1={svgWebX - 8}
                                y1={turnOffsetY + 1}
                                x2={svgWebX - 8}
                                y2={turnTopMarginY - 1}
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                              />
                              <line x1={svgWebX - 12} y1={turnOffsetY + 1} x2={svgWebX - 4} y2={turnOffsetY + 1} stroke="#38bdf8" strokeWidth="1" />
                              <line x1={svgWebX - 12} y1={turnTopMarginY - 1} x2={svgWebX - 4} y2={turnTopMarginY - 1} stroke="#38bdf8" strokeWidth="1" />
                              <text
                                x={svgWebX - 12}
                                y={turnOffsetY + (marginZTopMm * scaleY) / 2 + 3}
                                fill="#38bdf8"
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="end"
                                fontFamily="monospace"
                              >
                                Garg. Sup: {marginZTopMm.toFixed(1)}mm (½ sep)
                              </text>

                              {/* Bottom Margin Z Bracket (Garganta Inferior: mitad de separación) */}
                              <line
                                x1={svgWebX - 8}
                                y1={turnBottomMarginY + 1}
                                x2={svgWebX - 8}
                                y2={turnOffsetY + turnH - 1}
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                              />
                              <line x1={svgWebX - 12} y1={turnBottomMarginY + 1} x2={svgWebX - 4} y2={turnBottomMarginY + 1} stroke="#38bdf8" strokeWidth="1" />
                              <line x1={svgWebX - 12} y1={turnOffsetY + turnH - 1} x2={svgWebX - 4} y2={turnOffsetY + turnH - 1} stroke="#38bdf8" strokeWidth="1" />
                              <text
                                x={svgWebX - 12}
                                y={turnBottomMarginY + (marginZBottomMm * scaleY) / 2 + 3}
                                fill="#38bdf8"
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="end"
                                fontFamily="monospace"
                              >
                                Garg. Inf: {marginZBottomMm.toFixed(1)}mm (½ sep)
                              </text>
                            </>
                          )}

                          {/* Labels Placed Symmetrically Centered on Center of Z */}
                          {Array.from({ length: lanes }).map((_, laneIdx) => {
                            const laneX = svgWebX + (marginLateralMm + laneIdx * (labelW + gapX)) * scaleX;
                            const laneW = labelW * scaleX;

                            return (
                              <g key={`turn-${turnIdx}-lane-${laneIdx}`}>
                                {Array.from({ length: repeatsZ }).map((_, repIdx) => {
                                  const repY = turnOffsetY + (marginZTopMm + repIdx * (labelH + gapY)) * scaleY;
                                  const repH = labelH * scaleY;
                                  const labelCenterX = laneX + laneW / 2;
                                  const labelCenterY = repY + repH / 2;

                                  return (
                                    <g key={`turn-${turnIdx}-lane-${laneIdx}-rep-${repIdx}`}>
                                      {/* Dimension Arrow for Internal Gap between labels */}
                                      {laneIdx === 0 && repIdx < repeatsZ - 1 && gapY > 0 && (
                                        <g>
                                          <line
                                            x1={laneX - 6}
                                            y1={repY + repH + 1}
                                            x2={laneX - 6}
                                            y2={repY + repH + gapY * scaleY - 1}
                                            stroke="#f59e0b"
                                            strokeWidth="1.2"
                                          />
                                          <line x1={laneX - 9} y1={repY + repH + 1} x2={laneX - 3} y2={repY + repH + 1} stroke="#f59e0b" strokeWidth="1" />
                                          <line x1={laneX - 9} y1={repY + repH + gapY * scaleY - 1} x2={laneX - 3} y2={repY + repH + gapY * scaleY - 1} stroke="#f59e0b" strokeWidth="1" />
                                          <text
                                            x={laneX - 10}
                                            y={repY + repH + (gapY * scaleY) / 2 + 2.5}
                                            fill="#fbbf24"
                                            fontSize="7"
                                            fontWeight="bold"
                                            textAnchor="end"
                                            fontFamily="monospace"
                                          >
                                            Sep: {gapY.toFixed(1)}mm
                                          </text>
                                        </g>
                                      )}

                                      {/* Outer Die-cut Shape (Línea de Troquel con radio de esquina) */}
                                      <rect
                                        x={laneX}
                                        y={repY}
                                        width={laneW}
                                        height={repH}
                                        rx="3.5"
                                        fill="url(#labelGrad)"
                                        stroke="#f59e0b"
                                        strokeWidth="1.3"
                                      />

                                      {/* Top Header Ink Swatch Band */}
                                      <rect
                                        x={laneX + 2.5}
                                        y={repY + 2.5}
                                        width={laneW - 5}
                                        height="3.5"
                                        rx="1.5"
                                        fill={primaryInkColor}
                                        opacity="0.85"
                                      />

                                      {/* Center Crosshairs on Label */}
                                      <line
                                        x1={labelCenterX - 4}
                                        y1={labelCenterY}
                                        x2={labelCenterX + 4}
                                        y2={labelCenterY}
                                        stroke="#fde68a"
                                        strokeWidth="0.8"
                                        opacity="0.8"
                                      />
                                      <line
                                        x1={labelCenterX}
                                        y1={labelCenterY - 4}
                                        x2={labelCenterX}
                                        y2={labelCenterY + 4}
                                        stroke="#fde68a"
                                        strokeWidth="0.8"
                                        opacity="0.8"
                                      />

                                      {/* Label Name & Dimension Texts */}
                                      <text
                                        x={labelCenterX}
                                        y={labelCenterY - 3}
                                        dominantBaseline="middle"
                                        textAnchor="middle"
                                        fill="#fde68a"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                      >
                                        P{laneIdx + 1}.{repIdx + 1}
                                      </text>

                                      <text
                                        x={labelCenterX}
                                        y={labelCenterY + 6}
                                        dominantBaseline="middle"
                                        textAnchor="middle"
                                        fill="#cbd5e1"
                                        fontSize="7"
                                        fontFamily="monospace"
                                      >
                                        {labelW}×{labelH}
                                      </text>
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })}

                          {/* Turn Seam Bottom Line */}
                          <line
                            x1={svgWebX}
                            y1={turnOffsetY + turnH}
                            x2={svgWebX + svgWebW}
                            y2={turnOffsetY + turnH}
                            stroke="#64748b"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <text
                            x={svgWebX + 4}
                            y={turnOffsetY + turnH - 4}
                            fill="#94a3b8"
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            Z = {effectiveCylinderMm.toFixed(1)} mm ({params.gearTeethZ || 96}Z) • Garganta Inf: {marginZBottomMm.toFixed(1)}mm • Troquel Continuo: {continuousSeamGapMm.toFixed(1)}mm
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Centering Verification Badge */}
                  <div className="w-full mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>
                        Imagen centrada en el eje Z: {centerOfZMm.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <span>
                        Garganta Sup/Inf: <strong className="text-sky-300">{marginZTopMm.toFixed(1)} / {marginZBottomMm.toFixed(1)} mm</strong>
                      </span>
                      <span>
                        Sep. Medio: <strong className="text-amber-300">{gapY.toFixed(1)} mm</strong>
                      </span>
                      <span>
                        Troquel Continuo: <strong className="text-emerald-300">{continuousSeamGapMm.toFixed(1)} mm</strong>
                      </span>
                      <span>
                        Refile: <strong className="text-lime-300">{marginLateralMm.toFixed(1)} mm</strong>
                      </span>
                      <span>
                        Desarrollo Z: <strong className="text-slate-200">{effectiveCylinderMm.toFixed(1)} mm</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cylinder & Roll Metrics KPIs (4 Cards) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Garganta Sup/Inf</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {marginZTopMm.toFixed(1)} mm (½ sep)
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Troquel continuo: {continuousSeamGapMm.toFixed(1)} mm
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Aprovechamiento Z</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {((totalOccupiedHeightMm / effectiveCylinderMm) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {repeatsZ} formas ({shapesTotalHeightMm.toFixed(1)} mm neto)
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Rollos Hijos Estimados</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {metrics.numberOfRolls} bobinas
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({params.labelsPerRoll} etiq/rollo)
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Diámetro Exterior</span>
                <span className="text-sm font-bold text-sky-400 font-mono">
                  Ø {metrics.estimatedRollOuterDiameterMm} mm
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Core: {params.coreDiameterInches}" (76mm)
                </span>
              </div>
            </div>
          </div>

          {/* Technical Production Sheet */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Ficha Técnica Flexografía
                </h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono">
                Orden Flexo #{Math.floor(metrics.totalLabelsOrUnits / 100)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Metros Netos Solicitados:</span>
                <span className="font-mono font-bold text-slate-200">
                  {metrics.netLinearMeters.toLocaleString()} ml ({metrics.netM2} m²)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Merma de Arranque / Registro:</span>
                <span className="font-mono text-rose-300">
                  +{metrics.setupWasteMeters.toLocaleString()} ml
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Merma en Tirada ({params.runWastePercent}%):</span>
                <span className="font-mono text-rose-300">
                  +{metrics.runWasteMeters.toLocaleString()} ml
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60 font-semibold text-slate-200">
                <span>Metros Brutos de Bobina:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {metrics.grossLinearMeters.toLocaleString()} ml ({metrics.grossM2} m²)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Peso Total del Sustrato:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {metrics.grossWeightKg} kg
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Unidades / Etiquetas:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {metrics.totalLabelsOrUnits.toLocaleString()} unidades
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Aravo (Tiempo de Máquina):</span>
                <span className="font-mono text-amber-300 font-bold">
                  {breakdown.totalTimeHours} horas ({Math.round(breakdown.totalTimeHours * 60)} min)
                </span>
              </div>
            </div>

            {/* Panel de Margen Comercial / Utilidad y Comisión para llenado manual y porcentual */}
            <CommercialMarginCommissionPanel
              profitMarginPercent={params.profitMarginPercent}
              profitMarginAmount={params.profitMarginAmount}
              profitMarginMode={params.profitMarginMode}
              commissionPercent={params.commissionPercent}
              commissionAmount={params.commissionAmount}
              commissionMode={params.commissionMode}
              taxPercent={params.taxPercent}
              totalProductionCost={breakdown.totalProductionCost}
              breakdown={breakdown}
              currency={currency}
              onChange={(updates) => {
                onChangeParams({
                  ...params,
                  ...updates,
                });
              }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Modal Catálogo Pantone (PMS) */}
      <PantonePickerModal
        isOpen={isPantoneModalOpen}
        onClose={() => setIsPantoneModalOpen(false)}
        onSelectPantone={handleSelectPantone}
        currentColorsCount={params.inkColors.length}
        maxColors={8}
        technologyLabel="Flexografía Nilpeter / ETIRAMA 350mm"
      />

      {/* Modal Personalización de Sentidos de Bobinado (1 al 8) */}
      <WindingDirectionCustomizerModal
        isOpen={isWindingCustomizerOpen}
        onClose={() => setIsWindingCustomizerOpen(false)}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  CurrencyConfig,
  FinishingProcess,
  InkColorItem,
  OffsetJobParams,
  STANDARD_SHEET_FORMATS,
  PrintingMachinePreset,
  DieAndCreasingConfig,
  formatCurrency,
} from '../types/graphic';
import { calculateImpositionOptions } from '../utils/imposition';
import { calculateOffsetQuote } from '../utils/quoteCalculator';
import { ImpositionVisualizer } from './ImpositionVisualizer';
import { SheetCanvasVisualizer } from './SheetCanvasVisualizer';
import { PantonePickerModal } from './PantonePickerModal';
import { PantoneColor, PANTONE_CATALOG } from '../utils/pantoneCatalog';
import { PostPressFinishingManager } from './PostPressFinishingManager';
import { PostPressParameterizer } from './PostPressParameterizer';
import { CommercialMarginCommissionPanel } from './CommercialMarginCommissionPanel';
import {
  OFFSET_MACHINE_PRESETS,
  getCustomOffsetMachines,
  saveCustomOffsetMachine,
  deleteCustomOffsetMachine,
} from '../utils/machinePresets';
import {
  Clock,
  Layers,
  Palette,
  FileSpreadsheet,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Printer,
  Zap,
  AlertTriangle,
  Maximize2,
  Scissors,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  RotateCcw,
  Calculator,
} from 'lucide-react';

interface OffsetCalculatorProps {
  params: OffsetJobParams;
  onChangeParams: (params: OffsetJobParams) => void;
  currency: CurrencyConfig;
}

export const OffsetCalculator: React.FC<OffsetCalculatorProps> = ({
  params,
  onChangeParams,
  currency,
}) => {
  const [selectedOrientation, setSelectedOrientation] = useState<'horizontal' | 'vertical' | 'mixed'>('mixed');
  const [gripperPosition, setGripperPosition] = useState<'bottom' | 'top'>('bottom');
  const [visualizerMode, setVisualizerMode] = useState<'canvas' | 'vector'>('canvas');

  // Machine Presets & Custom Machines
  const [customMachines, setCustomMachines] = useState<PrintingMachinePreset[]>(() =>
    getCustomOffsetMachines()
  );
  const [isCustomMachinePanelOpen, setIsCustomMachinePanelOpen] = useState(false);
  const [customFormError, setCustomFormError] = useState('');

  const [customMachineForm, setCustomMachineForm] = useState({
    name: '',
    plateWidthMm: params.plateWidthMm || 745,
    plateHeightMm: params.plateHeightMm || 605,
    maxSheetWidthMm: params.machineMaxSheetWidthMm || 740,
    maxSheetHeightMm: params.machineMaxSheetHeightMm || 530,
    gripperMarginMm: params.gripperMarginMm || 10,
    standardSpeedPerHour: params.machineSpeedSheetsPerHour || 12000,
    standardHourlyRate: params.machineHourlyRate || 95,
    standardSetupMinutes: params.machineSetupMinutes || 30,
  });

  const handleSelectMachinePreset = (machine: PrintingMachinePreset) => {
    onChangeParams({
      ...params,
      machineModelId: machine.id,
      machineModelName: machine.name,
      plateWidthMm: machine.plateWidthMm,
      plateHeightMm: machine.plateHeightMm,
      machineMaxSheetWidthMm: machine.maxSheetWidthMm,
      machineMaxSheetHeightMm: machine.maxSheetHeightMm,
      gripperMarginMm: machine.gripperMarginMm || params.gripperMarginMm,
      machineSpeedSheetsPerHour: machine.standardSpeedPerHour || params.machineSpeedSheetsPerHour,
      machineHourlyRate: machine.standardHourlyRate || params.machineHourlyRate,
      machineSetupMinutes: machine.standardSetupMinutes || params.machineSetupMinutes,
    });
  };

  const handleSaveAndApplyCustomMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMachineForm.name.trim()) {
      setCustomFormError('Ingresa un nombre para la prensa personalizada');
      return;
    }
    setCustomFormError('');

    const newMachine: PrintingMachinePreset = {
      id: `custom_mach_${Date.now()}`,
      name: customMachineForm.name.trim(),
      series: 'OTRA',
      colors: 4,
      plateWidthMm: Number(customMachineForm.plateWidthMm) || 745,
      plateHeightMm: Number(customMachineForm.plateHeightMm) || 605,
      maxSheetWidthMm: Number(customMachineForm.maxSheetWidthMm) || 740,
      maxSheetHeightMm: Number(customMachineForm.maxSheetHeightMm) || 530,
      minSheetWidthMm: 280,
      minSheetHeightMm: 210,
      gripperMarginMm: Number(customMachineForm.gripperMarginMm) || 10,
      standardSpeedPerHour: Number(customMachineForm.standardSpeedPerHour) || 12000,
      standardHourlyRate: Number(customMachineForm.standardHourlyRate) || 95,
      standardSetupMinutes: Number(customMachineForm.standardSetupMinutes) || 30,
      description: 'Prensa offset personalizada configurada por el usuario.',
    };

    const updated = saveCustomOffsetMachine(newMachine);
    setCustomMachines(updated);
    handleSelectMachinePreset(newMachine);
    setIsCustomMachinePanelOpen(false);
  };

  const handleDeleteCustomMachine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomOffsetMachine(id);
    setCustomMachines(updated);
  };

  const handleApplyDieConfig = (dieConfig: DieAndCreasingConfig) => {
    // Automatically enable and synchronize die-cutting and creasing finishing processes
    const updatedFinishings = params.finishings.map((f) => {
      if (f.id === 'proc_die_cutting') {
        return {
          ...f,
          enabled: true,
          parameters: {
            ...f.parameters,
            dieCuttingComplexity: 'medium' as const,
            dieCuttingLinearMetersRules: dieConfig.linearMetersCuttingPerSheet,
            dieCuttingNicksCount: dieConfig.nicksCountPerPiece,
          },
        };
      }
      if (f.id === 'proc_creasing') {
        return {
          ...f,
          enabled: true,
          parameters: {
            ...f.parameters,
            creasingSubstrateThicknessMm: dieConfig.caliperMm,
            creasingSubstrateMicrons: dieConfig.caliperMicrons,
            creasingCitoMatrixCode: dieConfig.citoMatrixCode,
            creasingRuleThicknessPt: dieConfig.creasingRuleThicknessPt,
            creasingMatrixType: dieConfig.creasingSystem,
            creasingChannelsCount: dieConfig.linearMetersCreasingPerSheet,
          },
        };
      }
      return f;
    });

    onChangeParams({
      ...params,
      dieAndCreasingConfig: dieConfig,
      finishings: updatedFinishings,
    });
  };

  const machineMaxW = params.machineMaxSheetWidthMm || 740;
  const machineMaxH = params.machineMaxSheetHeightMm || 530;
  const isSheetTooBig = params.sheetWidthMm > machineMaxW || params.sheetHeightMm > machineMaxH;

  const handleAdjustSheetToMachine = () => {
    onChangeParams({
      ...params,
      sheetWidthMm: machineMaxW,
      sheetHeightMm: machineMaxH,
      sheetFormatId: 'custom',
    });
  };

  // Compute layout arrangements
  const arrangements = calculateImpositionOptions({
    sheetWidth: params.sheetWidthMm,
    sheetHeight: params.sheetHeightMm,
    pieceWidth: params.pieceWidthMm,
    pieceHeight: params.pieceHeightMm,
    bleed: params.bleedMm,
    gutter: params.gutterMm,
    gripperMargin: params.gripperMarginMm,
    nonGripperMargin: params.nonGripperMarginMm,
    gripperPosition,
    customPosesCount: params.customPosesCount,
    customPosesX: params.customPosesX,
    customPosesY: params.customPosesY,
    isCustomPosesActive: params.isCustomPosesActive,
  });

  const activeArrangement = arrangements[selectedOrientation] || arrangements.optimal;
  const quoteResult = calculateOffsetQuote(params, activeArrangement);

  // Substrate Cost Calculations (COSTO POR PLIEGO)
  const sheetAreaM2 = (params.sheetWidthMm * params.sheetHeightMm) / 1_000_000;
  const singleSheetWeightKg = (sheetAreaM2 * params.grammageGsm) / 1000;
  const currentCostPerSheet =
    params.paperCostPerSheet !== undefined && params.paperCostPerSheet > 0
      ? params.paperCostPerSheet
      : Number((singleSheetWeightKg * params.paperCostPerKg).toFixed(4));

  const [showPaperCostHelper, setShowPaperCostHelper] = useState(false);
  const [helperKgInput, setHelperKgInput] = useState<string>('');
  const [helperReamInput, setHelperReamInput] = useState<string>('');

  const handleUpdatePaperCostPerSheet = (newCostPerSheet: number) => {
    const safeCost = Math.max(0.0001, isNaN(newCostPerSheet) ? 0.0001 : newCostPerSheet);
    const equivKg = singleSheetWeightKg > 0 ? Number((safeCost / singleSheetWeightKg).toFixed(4)) : 1.85;
    onChangeParams({
      ...params,
      paperCostPerSheet: safeCost,
      paperCostPerKg: equivKg,
    });
  };

  const handleApplyHelperFromKg = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    const computedSheetCost = Number((val * singleSheetWeightKg).toFixed(4));
    handleUpdatePaperCostPerSheet(computedSheetCost);
  };

  const handleApplyHelperFromReam = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    const computedSheetCost = Number((val / 500).toFixed(4));
    handleUpdatePaperCostPerSheet(computedSheetCost);
  };

  const updateParam = <K extends keyof OffsetJobParams>(key: K, value: OffsetJobParams[K]) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const handleSheetPresetChange = (presetId: string) => {
    const preset = STANDARD_SHEET_FORMATS.find((p) => p.id === presetId);
    if (preset) {
      const newAreaM2 = (preset.widthMm * preset.heightMm) / 1_000_000;
      const newWeightKg = (newAreaM2 * params.grammageGsm) / 1000;
      const updatedCostPerSheet =
        params.paperCostPerSheet !== undefined && params.paperCostPerSheet > 0
          ? params.paperCostPerSheet
          : Number((newWeightKg * params.paperCostPerKg).toFixed(4));
      const updatedCostPerKg =
        newWeightKg > 0 ? Number((updatedCostPerSheet / newWeightKg).toFixed(4)) : params.paperCostPerKg;

      onChangeParams({
        ...params,
        sheetFormatId: presetId,
        sheetWidthMm: preset.widthMm,
        sheetHeightMm: preset.heightMm,
        paperCostPerSheet: updatedCostPerSheet,
        paperCostPerKg: updatedCostPerKg,
      });
    }
  };

  const [isPantoneModalOpen, setIsPantoneModalOpen] = useState(false);
  const [isPantoneTargetFront, setIsPantoneTargetFront] = useState(true);

  // Selector y campo especial de Código Pantone Adicional
  const [pantoneInputCode, setPantoneInputCode] = useState('');
  const [pantoneInputCoverage, setPantoneInputCoverage] = useState(15);
  const [pantoneTargetSide, setPantoneTargetSide] = useState<'front' | 'back' | 'both'>('front');
  const [selectedCatalogPreset, setSelectedCatalogPreset] = useState('');
  const [pantoneFeedback, setPantoneFeedback] = useState<string | null>(null);

  const matchedPantone = useMemo(() => {
    if (!pantoneInputCode.trim()) return null;
    const clean = pantoneInputCode.trim().toLowerCase();
    return (
      PANTONE_CATALOG.find(
        (p) =>
          p.code.toLowerCase() === clean ||
          p.name.toLowerCase().includes(clean) ||
          p.code.toLowerCase().replace('pantone ', '').trim() === clean
      ) || null
    );
  }, [pantoneInputCode]);

  const handleSelectDropdownPreset = (code: string) => {
    setSelectedCatalogPreset(code);
    if (!code) return;
    const found = PANTONE_CATALOG.find((p) => p.code === code);
    if (found) {
      setPantoneInputCode(found.code);
      setPantoneInputCoverage(found.recommendedCoveragePercent);
    }
  };

  const handleQuickAddPantonePreset = (pmsCode: string, coveragePct = 15) => {
    const found = PANTONE_CATALOG.find((p) => p.code.toLowerCase() === pmsCode.toLowerCase()) || {
      code: pmsCode,
      hex: '#e11d48',
      recommendedCoveragePercent: coveragePct,
      name: pmsCode,
    };
    setPantoneInputCode(found.code);
    setSelectedCatalogPreset(found.code);
    setPantoneInputCoverage(found.recommendedCoveragePercent || coveragePct);
  };

  const handleAddCustomOrCatalogPantone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = pantoneInputCode.trim();
    if (!code) return;

    const matched = matchedPantone;
    const finalHex = matched ? matched.hex : '#e11d48';
    const finalName = code.toUpperCase().startsWith('PANTONE') ? code : `Pantone ${code}`;
    const coverage = Number(pantoneInputCoverage) || (matched ? matched.recommendedCoveragePercent : 15);

    const makeItem = (suffix: string): InkColorItem => ({
      id: `pantone_${Date.now()}_${suffix}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      coveragePercent: coverage,
      colorHex: finalHex,
      isSpot: true,
      isPantone: true,
      pantoneCode: finalName,
    });

    if (pantoneTargetSide === 'both') {
      if (params.inkColorsFront.length >= 8 || params.inkColorsBack.length >= 8) {
        alert('Máximo de 8 cuerpos entintadores por cara alcanzado en la máquina.');
        return;
      }
      updateParam('inkColorsFront', [...params.inkColorsFront, makeItem('front')]);
      updateParam('inkColorsBack', [...params.inkColorsBack, makeItem('back')]);
      setPantoneFeedback(`✓ ${finalName} sumado a Frente y Dorso (Planchas CTP y presupuesto actualizados)`);
    } else if (pantoneTargetSide === 'front') {
      if (params.inkColorsFront.length >= 8) {
        alert('Máximo de 8 cuerpos entintadores por cara alcanzado en la máquina.');
        return;
      }
      updateParam('inkColorsFront', [...params.inkColorsFront, makeItem('front')]);
      setPantoneFeedback(`✓ ${finalName} sumado a Cara Frente (Planchas CTP y presupuesto actualizados)`);
    } else {
      if (params.inkColorsBack.length >= 8) {
        alert('Máximo de 8 cuerpos entintadores por cara alcanzado en la máquina.');
        return;
      }
      updateParam('inkColorsBack', [...params.inkColorsBack, makeItem('back')]);
      setPantoneFeedback(`✓ ${finalName} sumado a Cara Dorso (Planchas CTP y presupuesto actualizados)`);
    }

    setTimeout(() => setPantoneFeedback(null), 4000);
    setPantoneInputCode('');
    setSelectedCatalogPreset('');
    setPantoneInputCoverage(15);
  };

  // Color management (up to 8 colors)
  const addColor = (isFront: boolean) => {
    const list = isFront ? params.inkColorsFront : params.inkColorsBack;
    if (list.length >= 8) return;

    const newColor: InkColorItem = {
      id: `spot_${Date.now()}`,
      name: `Tinta Especial ${list.length + 1}`,
      coveragePercent: 15,
      colorHex: '#f97316',
      isSpot: true,
    };
    if (isFront) {
      updateParam('inkColorsFront', [...params.inkColorsFront, newColor]);
    } else {
      updateParam('inkColorsBack', [...params.inkColorsBack, newColor]);
    }
  };

  const handleSelectPantone = (pantone: PantoneColor) => {
    const list = isPantoneTargetFront ? params.inkColorsFront : params.inkColorsBack;
    if (list.length >= 8) return;

    const newColor: InkColorItem = {
      id: `pantone_${Date.now()}`,
      name: pantone.code,
      coveragePercent: pantone.recommendedCoveragePercent,
      colorHex: pantone.hex,
      isSpot: true,
      isPantone: true,
      pantoneCode: pantone.code,
    };

    if (isPantoneTargetFront) {
      updateParam('inkColorsFront', [...params.inkColorsFront, newColor]);
    } else {
      updateParam('inkColorsBack', [...params.inkColorsBack, newColor]);
    }
  };

  const removeColor = (id: string, isFront: boolean) => {
    if (isFront) {
      updateParam('inkColorsFront', params.inkColorsFront.filter((c) => c.id !== id));
    } else {
      updateParam('inkColorsBack', params.inkColorsBack.filter((c) => c.id !== id));
    }
  };

  const updateColor = (id: string, field: keyof InkColorItem, value: any, isFront: boolean) => {
    const list = isFront ? params.inkColorsFront : params.inkColorsBack;
    const updated = list.map((c) => {
      if (c.id !== id) return c;
      if (field === 'name') {
        const strVal = String(value);
        const lower = strVal.trim().toLowerCase();
        // Check if name is or contains Pantone/PMS or matches catalog
        const found = PANTONE_CATALOG.find(
          (p) =>
            p.code.toLowerCase() === lower ||
            p.code.toLowerCase().replace('pantone ', '').trim() === lower ||
            p.name.toLowerCase().includes(lower)
        );
        const isPantoneDetected = Boolean(found || /pantone|pms/i.test(lower));
        return {
          ...c,
          name: strVal,
          isPantone: isPantoneDetected ? true : c.isPantone,
          isSpot: isPantoneDetected ? true : c.isSpot,
          pantoneCode: found ? found.code : (isPantoneDetected ? strVal : c.pantoneCode),
          colorHex: found ? found.hex : c.colorHex,
        };
      }
      return { ...c, [field]: value };
    });
    if (isFront) {
      updateParam('inkColorsFront', updated);
    } else {
      updateParam('inkColorsBack', updated);
    }
  };

  const handleToggleColorPantone = (id: string, isFront: boolean) => {
    const list = isFront ? params.inkColorsFront : params.inkColorsBack;
    const item = list.find((c) => c.id === id);
    if (!item) return;

    if (item.isPantone) {
      // Toggle off to normal CMYK
      const updated = list.map((c) =>
        c.id === id ? { ...c, isPantone: false, isSpot: false, pantoneCode: undefined } : c
      );
      if (isFront) {
        updateParam('inkColorsFront', updated);
      } else {
        updateParam('inkColorsBack', updated);
      }
    } else {
      // Designate as Pantone
      const lower = item.name.trim().toLowerCase();
      const found =
        PANTONE_CATALOG.find(
          (p) =>
            p.code.toLowerCase() === lower ||
            p.code.toLowerCase().replace('pantone ', '').trim() === lower ||
            p.name.toLowerCase().includes(lower)
        ) || PANTONE_CATALOG[2] || { code: 'Pantone 186 C', hex: '#c8102e' };

      const finalName = item.name.toLowerCase().includes('pantone')
        ? item.name
        : (item.name.toLowerCase().includes('tinta') ? found.code : `Pantone ${item.name}`);

      const updated = list.map((c) =>
        c.id === id
          ? {
              ...c,
              name: finalName,
              isSpot: true,
              isPantone: true,
              pantoneCode: found.code || finalName,
              colorHex: found.hex || '#c8102e',
            }
          : c
      );
      if (isFront) {
        updateParam('inkColorsFront', updated);
      } else {
        updateParam('inkColorsBack', updated);
      }
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Technology summary */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-900 border border-sky-800/40 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Offset a Pliego
            </span>
            <span className="text-slate-400 text-xs font-medium">
              Alimentación por hojas sueltas • Cotización por Unidad
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            {params.jobName || 'Trabajo de Impresión Offset'}
          </h2>
          <p className="text-xs text-slate-400">
            Cliente: <span className="text-slate-200 font-medium">{params.clientName}</span> • Tirada solicitada:{' '}
            <span className="text-amber-400 font-bold font-mono">
              {params.quantityUnits.toLocaleString()} unidades
            </span>
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
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pliegos Brutos</span>
            <span className="text-sm font-mono font-bold text-sky-400">
              {quoteResult.grossSheets.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">({quoteResult.reamsRequired} resmas)</span>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Peso Papel</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {quoteResult.paperWeightKg} kg
            </span>
            <span className="text-[10px] text-slate-500 block">{params.grammageGsm} g/m²</span>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aravo (Tiempo)</span>
            <span className="text-sm font-mono font-bold text-amber-400">
              {quoteResult.breakdown.totalTimeHours} h
            </span>
            <span className="text-[10px] text-slate-500 block">Prep: {quoteResult.breakdown.setupTimeHours}h • Tiro: {quoteResult.breakdown.runTimeHours}h</span>
          </div>

          <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[130px]">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Precio Unitario</span>
            <span className="text-sm sm:text-base font-mono font-bold text-amber-300">
              {formatCurrency(quoteResult.breakdown.pricePerUnit, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Millar: {formatCurrency(quoteResult.breakdown.pricePerThousand, currency)}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-0.5">
              Total: {formatCurrency(quoteResult.breakdown.finalTotalPrice, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Config Form + Right Imposition Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Plancha CTP, Papel y Aprovechamiento de Corte */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    1. Plancha CTP (Ajuste de Prensa), Papel y Aprovechamiento de Corte
                  </h3>
                  <p className="text-xs text-slate-400">
                    El <strong className="text-orange-400">Ajuste de Prensa</strong> define el tamaño de plancha CTP de la máquina (Línea Naranja). El <strong className="text-emerald-400">Pliego de Papel</strong> define el sustrato (Línea Verde).
                  </p>
                </div>
              </div>
            </div>

            {/* 1.1 Ajuste de Prensa: Tamaño de Plancha CTP de Máquina */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/30 flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-slate-100">
                    1.1 Ajuste de Prensa: Tamaño de Plancha CTP de Máquina
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 font-mono font-semibold border border-orange-500/30">
                    Línea Naranja: {params.plateWidthMm || 745} × {params.plateHeightMm || 605} mm
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Matriz metálica CTP del cilindro portaplanchas
                </span>
              </div>

              {/* Selector Rápido de Plantillas de Máquinas & Botón Personalizado */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Plantilla Rápida de Máquinas (Lista Estándar & Personalizadas):</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMachinePanelOpen(!isCustomMachinePanelOpen);
                      setCustomFormError('');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all border self-start sm:self-auto ${
                      isCustomMachinePanelOpen
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-400'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isCustomMachinePanelOpen ? 'Cerrar Panel Personalizado' : '+ Configurar Prensa Personalizada'}</span>
                  </button>
                </div>

                {/* Plantillas Rápidas de Máquinas Offset & Personalizadas */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                    <span>Selección Directa de Plantillas:</span>
                    <span className="text-[10px] text-orange-400 font-mono">
                      Plancha CTP activa: {params.plateWidthMm || 745}×{params.plateHeightMm || 605} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                    {[
                      { id: 'sm74_4c', label: 'SM 74', sub: 'CTP: 745×605', series: 'Medio Pliego' },
                      { id: 'xl106_6c', label: 'XL 106', sub: 'CTP: 1055×811', series: 'Pliego Entero' },
                      { id: 'cd102_5c', label: 'CD 102', sub: 'CTP: 1030×790', series: 'Packaging' },
                      { id: 'sm102_4c', label: 'SM 102', sub: 'CTP: 1030×790', series: 'Pliego Entero' },
                      { id: 'sm52_4c', label: 'SM 52', sub: 'CTP: 525×459', series: '37×52 cm' },
                      { id: 'xl75_5c', label: 'XL 75', sub: 'CTP: 745×605', series: 'High Speed' },
                      { id: 'gto52_1c', label: 'GTO 52', sub: 'CTP: 510×400', series: 'Comercial' },
                      { id: 'gto46', label: 'GTO 46', sub: 'CTP: 445×380', series: 'Papelería' },
                      { id: 'mo_1c', label: 'MO 65', sub: 'CTP: 650×550', series: 'Editorial' },
                    ].map((quick) => {
                      const item = OFFSET_MACHINE_PRESETS.find((m) => m.id === quick.id);
                      if (!item) return null;
                      const isActive = params.machineModelId === item.id;
                      return (
                        <button
                          key={quick.id}
                          type="button"
                          onClick={() => handleSelectMachinePreset(item)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            isActive
                              ? 'bg-orange-500 text-slate-950 border-orange-400 font-extrabold shadow-md ring-2 ring-orange-400/40'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:text-white'
                          }`}
                          title={`${item.name} (${item.plateWidthMm}×${item.plateHeightMm} mm)`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-mono">{quick.label}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-sans ${
                                isActive ? 'bg-slate-950 text-orange-400 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {quick.series}
                            </span>
                          </div>
                          <div
                            className={`text-[10px] font-mono mt-0.5 truncate ${
                              isActive ? 'text-slate-950 font-semibold' : 'text-orange-400/90'
                            }`}
                          >
                            {quick.sub}
                          </div>
                        </button>
                      );
                    })}

                    {/* Botón para Configurar Prensa Personalizada dentro de las tarjetas */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomMachinePanelOpen(true);
                        setCustomFormError('');
                      }}
                      className="p-2 rounded-xl text-left border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 hover:border-amber-400 transition-all flex flex-col justify-center"
                      title="Crear máquina personalizada"
                    >
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Personalizada</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">A medida</div>
                    </button>
                  </div>
                </div>

                {/* Dropdown Selector con Categorías Completas */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <select
                      value={params.machineModelId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === 'open_custom_modal') {
                          setIsCustomMachinePanelOpen(true);
                          return;
                        }
                        const found = [...customMachines, ...OFFSET_MACHINE_PRESETS].find((m) => m.id === val);
                        if (found) handleSelectMachinePreset(found);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Ver todas las prensas por serie o personalizadas --</option>

                      {/* Grupo: Máquinas Personalizadas Guardadas */}
                      {customMachines.length > 0 && (
                        <optgroup label="★ Mis Prensas Personalizadas">
                          {customMachines.map((m) => (
                            <option key={m.id} value={m.id}>
                              ★ {m.name} (CTP: {m.plateWidthMm}×{m.plateHeightMm} mm • Pliego máx: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Grupo: Heidelberg Speedmaster SM */}
                      <optgroup label="Heidelberg Speedmaster SM Series (Medio pliego & Entero)">
                        {OFFSET_MACHINE_PRESETS.filter((m) => m.series === 'SM').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — CTP: {m.plateWidthMm}×{m.plateHeightMm} mm (Pliego: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                          </option>
                        ))}
                      </optgroup>

                      {/* Grupo: Heidelberg Peak Performance XL */}
                      <optgroup label="Heidelberg Peak Performance XL Series (Alta Productividad 18.000 pl/h)">
                        {OFFSET_MACHINE_PRESETS.filter((m) => m.series === 'XL').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — CTP: {m.plateWidthMm}×{m.plateHeightMm} mm (Pliego: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                          </option>
                        ))}
                      </optgroup>

                      {/* Grupo: Heidelberg Speedmaster CD Packaging */}
                      <optgroup label="Heidelberg Speedmaster CD Packaging (Estuches y Microcorrugado)">
                        {OFFSET_MACHINE_PRESETS.filter((m) => m.series === 'CD').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — CTP: {m.plateWidthMm}×{m.plateHeightMm} mm (Pliego: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                          </option>
                        ))}
                      </optgroup>

                      {/* Grupo: Heidelberg GTO Series */}
                      <optgroup label="Heidelberg GTO Series (Formatos Comerciales 46 / 52)">
                        {OFFSET_MACHINE_PRESETS.filter((m) => m.series === 'GTO' || m.series === 'GTOZ').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — CTP: {m.plateWidthMm}×{m.plateHeightMm} mm (Pliego: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                          </option>
                        ))}
                      </optgroup>

                      {/* Grupo: Heidelberg MO Series */}
                      <optgroup label="Heidelberg MO Series (Formato 65×48 cm)">
                        {OFFSET_MACHINE_PRESETS.filter((m) => m.series === 'MO').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — CTP: {m.plateWidthMm}×{m.plateHeightMm} mm (Pliego: {m.maxSheetWidthMm}×{m.maxSheetHeightMm} mm)
                          </option>
                        ))}
                      </optgroup>

                      <option value="open_custom_modal">+ Crear nueva máquina personalizada...</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Prensas Personalizadas con botón de eliminar */}
                {customMachines.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Tus Prensas:</span>
                    {customMachines.map((m) => {
                      const isSelected = params.machineModelId === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectMachinePreset(m)}
                            className="font-semibold hover:underline"
                          >
                            ★ {m.name} ({m.plateWidthMm}×{m.plateHeightMm})
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomMachine(m.id, e)}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                            title="Eliminar de mis prensas"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Panel Desplegable: Configuración de Prensa Personalizada */}
              {isCustomMachinePanelOpen && (
                <form
                  onSubmit={handleSaveAndApplyCustomMachine}
                  className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg animate-fadeIn text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-slate-100">
                        Configurar Prensa Offset Personalizada / A Medida
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomMachinePanelOpen(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {customFormError && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                      {customFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Nombre */}
                    <div className="sm:col-span-2">
                      <label className="text-slate-300 font-semibold block mb-1">
                        Nombre de la Prensa / Máquina *:
                      </label>
                      <input
                        type="text"
                        value={customMachineForm.name}
                        onChange={(e) =>
                          setCustomMachineForm({ ...customMachineForm, name: e.target.value })
                        }
                        placeholder="Ej. Komori Lithrone 28 / Roland 700 / KBA 105"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    {/* Ancho Plancha CTP */}
                    <div>
                      <label className="text-orange-400 font-bold block mb-1">
                        🟠 Ancho Plancha CTP (mm) *:
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="2200"
                        value={customMachineForm.plateWidthMm}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            plateWidthMm: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-orange-500/40 rounded-lg px-2.5 py-1.5 font-mono text-orange-300 font-bold focus:outline-none focus:border-orange-400"
                        required
                      />
                    </div>

                    {/* Alto Plancha CTP */}
                    <div>
                      <label className="text-orange-400 font-bold block mb-1">
                        🟠 Alto Plancha CTP (mm) *:
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="2200"
                        value={customMachineForm.plateHeightMm}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            plateHeightMm: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-orange-500/40 rounded-lg px-2.5 py-1.5 font-mono text-orange-300 font-bold focus:outline-none focus:border-orange-400"
                        required
                      />
                    </div>

                    {/* Capacidad Máx Pliego Ancho */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Pliego Máx. Ancho (mm):
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="2200"
                        value={customMachineForm.maxSheetWidthMm}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            maxSheetWidthMm: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Capacidad Máx Pliego Alto */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Pliego Máx. Alto (mm):
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="2200"
                        value={customMachineForm.maxSheetHeightMm}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            maxSheetHeightMm: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Pinza */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Pinza Máquina (mm):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={customMachineForm.gripperMarginMm}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            gripperMarginMm: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Velocidad */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Velocidad (pliegos/h):
                      </label>
                      <input
                        type="number"
                        min="1000"
                        max="25000"
                        step="500"
                        value={customMachineForm.standardSpeedPerHour}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            standardSpeedPerHour: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Costo Hora */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Costo Hora ($/h):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={customMachineForm.standardHourlyRate}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            standardHourlyRate: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Setup min */}
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        Puesta a Punto (min):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={customMachineForm.standardSetupMinutes}
                        onChange={(e) =>
                          setCustomMachineForm({
                            ...customMachineForm,
                            standardSetupMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCustomMachinePanelOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar en Mis Prensas & Aplicar al Trabajo</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Machine Max Sheet Compatibility & Auto-Adjust Banner */}
              <div
                className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isSheetTooBig
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSheetTooBig ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-slate-300 text-[11px]">
                    Máquina activa: <strong className="text-slate-100">{params.machineModelName || 'Heidelberg SM 74'}</strong> • Plancha CTP:{' '}
                    <strong className="text-orange-400 font-mono">{params.plateWidthMm || 745}×{params.plateHeightMm || 605} mm</strong> • Pliego máx:{' '}
                    <strong className="text-amber-400 font-mono">{machineMaxW} × {machineMaxH} mm</strong>
                    {isSheetTooBig && (
                      <span className="text-rose-400 font-bold ml-1.5">
                        (⚠️ Pliego actual {params.sheetWidthMm}×{params.sheetHeightMm} mm supera el límite)
                      </span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAdjustSheetToMachine}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 self-start sm:self-auto"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Adaptar Pliego a Máx. de Máquina ({machineMaxW}×{machineMaxH})</span>
                </button>
              </div>

              {/* Controles Numéricos Directos de Plancha CTP & Pinzas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Ancho Plancha CTP (mm)
                  </label>
                  <input
                    type="number"
                    value={params.plateWidthMm || 745}
                    onChange={(e) => updateParam('plateWidthMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                    placeholder="745"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Alto Plancha CTP (mm)
                  </label>
                  <input
                    type="number"
                    value={params.plateHeightMm || 605}
                    onChange={(e) => updateParam('plateHeightMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                    placeholder="605"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Pinza Máquina (mm)
                  </label>
                  <input
                    type="number"
                    value={params.gripperMarginMm}
                    onChange={(e) => updateParam('gripperMarginMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-400 outline-none"
                    title="Margen de agarre para pinzas de máquina offset"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Márgenes Lat. (mm)
                  </label>
                  <input
                    type="number"
                    value={params.nonGripperMarginMm}
                    onChange={(e) => updateParam('nonGripperMarginMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 1.2 Dimensiones de la Pieza Final (Producto a Imprimir) */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-sky-400" />
                <span>Dimensiones de la Pieza Final & Demasías de Corte</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Ancho Pieza (mm)
                  </label>
                  <input
                    type="number"
                    value={params.pieceWidthMm}
                    onChange={(e) => updateParam('pieceWidthMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:border-sky-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Alto Pieza (mm)
                  </label>
                  <input
                    type="number"
                    value={params.pieceHeightMm}
                    onChange={(e) => updateParam('pieceHeightMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:border-sky-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Calles / Medianil (mm)
                  </label>
                  <input
                    type="number"
                    value={params.gutterMm}
                    onChange={(e) => updateParam('gutterMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 outline-none"
                    title="Separación entre piezas para corte limpio en guillotina"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Demasía / Sangría (mm)
                  </label>
                  <input
                    type="number"
                    value={params.bleedMm}
                    onChange={(e) => updateParam('bleedMm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 1.3 Sustrato: Tipo de Papel y Tamaño de Pliego de Papel (Ej: 960x660mm) */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1.3 Sustrato: Tipo de Papel & Tamaño de Pliego de Papel</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                    Línea Verde: {params.sheetWidthMm} × {params.sheetHeightMm} mm
                  </span>
                </div>
              </div>

              {/* Tipo de Papel, Gramaje y Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Tipo de Papel / Soporte *
                  </label>
                  <input
                    type="text"
                    value={params.paperType}
                    onChange={(e) => updateParam('paperType', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:border-emerald-400 outline-none"
                    placeholder="Ej. Couché 150g, Obra, Cartulina..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Gramaje (g/m²)
                  </label>
                  <input
                    type="number"
                    value={params.grammageGsm}
                    onChange={(e) => updateParam('grammageGsm', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-400 outline-none"
                  />
                </div>

                {/* COSTO POR PLIEGO (Reemplazo directo de costo por kg solicitado por el usuario) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>COSTO POR PLIEGO ({currency.symbol}) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPaperCostHelper(!showPaperCostHelper)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-200 hover:underline flex items-center gap-0.5"
                      title="Convertir desde $/kg o Resma"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>{showPaperCostHelper ? 'Cerrar' : 'Calcular'}</span>
                    </button>
                  </div>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentCostPerSheet}
                    onChange={(e) => handleUpdatePaperCostPerSheet(Number(e.target.value))}
                    className="w-full min-w-[150px] bg-slate-900 border-2 border-emerald-500/60 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-emerald-300 font-mono font-black focus:ring-1 focus:ring-emerald-400 outline-none shadow-inner"
                    placeholder={currency.code === 'PYG' ? '1450' : '0.18'}
                  />

                  {/* Detalle informativo inmediato debajo de Costo por Pliego */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span title="Equivalencia en $/kg según el gramaje y tamaño del pliego">
                      ≈ {formatCurrency(
                        singleSheetWeightKg > 0 ? currentCostPerSheet / singleSheetWeightKg : 1.85,
                        currency
                      )}/kg
                    </span>
                    <span title="Costo por resma completa de 500 pliegos">
                      Resma: <strong className="text-emerald-400">{formatCurrency(currentCostPerSheet * 500, currency)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Asistente Rápido de Conversión: Costo por kg o por Resma a Costo por Pliego */}
              {showPaperCostHelper && (
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 flex flex-col gap-2.5 shadow-md animate-fadeIn text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Calculadora Rápida: Convertir a COSTO POR PLIEGO</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPaperCostHelper(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Desde $/kg */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Si tienes el precio por Kg ({currency.symbol}/kg):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          placeholder={currency.code === 'PYG' ? '15000' : '1.85'}
                          value={helperKgInput}
                          onChange={(e) => setHelperKgInput(e.target.value)}
                          className="w-full min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(helperKgInput);
                            if (!isNaN(val) && val > 0) {
                              handleApplyHelperFromKg(val);
                              setHelperKgInput('');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Pliego {params.sheetWidthMm}×{params.sheetHeightMm} mm a {params.grammageGsm}g pesa {(singleSheetWeightKg * 1000).toFixed(1)}g
                      </span>
                    </div>

                    {/* Desde $/Resma */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Si tienes el precio por Resma 500 pliegos ({currency.symbol}):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          placeholder={currency.code === 'PYG' ? '725000' : '90.00'}
                          value={helperReamInput}
                          onChange={(e) => setHelperReamInput(e.target.value)}
                          className="w-full min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(helperReamInput);
                            if (!isNaN(val) && val > 0) {
                              handleApplyHelperFromReam(val);
                              setHelperReamInput('');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Cálculo automático: Precio Resma ÷ 500 pliegos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* DEBAJO DE TIPO DE PAPEL: Tamaño de Pliego de Papel (Ej: 960x660 mm) */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tamaño de Pliego de Papel (Ej: 960 × 660 mm):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Formato comercial de compra del papel en distribuidora (Línea Verde)
                  </span>
                </div>

                {/* Botones de Formatos Comerciales de Pliego de Papel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {STANDARD_SHEET_FORMATS.map((fmt) => {
                    const isFmtSelected =
                      params.sheetFormatId === fmt.id ||
                      (params.sheetWidthMm === fmt.widthMm && params.sheetHeightMm === fmt.heightMm);

                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleSheetPresetChange(fmt.id)}
                        className={`py-1.5 px-2.5 rounded-lg border text-left transition-all ${
                          isFmtSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm font-bold ring-1 ring-amber-400/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-mono leading-tight">{fmt.name}</div>
                        {fmt.description && (
                          <div className="text-[9px] text-slate-500 truncate mt-0.5">
                            {fmt.description}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Inputs de Ancho y Alto de Pliego de Papel */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Ancho Pliego de Papel (mm)
                    </label>
                    <input
                      type="number"
                      value={params.sheetWidthMm}
                      onChange={(e) => updateParam('sheetWidthMm', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                      placeholder="Ej: 960"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Alto Pliego de Papel (mm)
                    </label>
                    <input
                      type="number"
                      value={params.sheetHeightMm}
                      onChange={(e) => updateParam('sheetHeightMm', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                      placeholder="Ej: 660"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Consumo de Tinta por m² (1.2 g/m² Offset) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    2. Consumo de Tinta por Metro Cuadrado (m²)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fórmula Técnica: Cobertura % × Base g/m² ({params.inkGramsPerM2} g/m² Offset) × m² impresos.
                  </p>
                </div>
              </div>

              {/* Base rate adjuster */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400">Base Offset:</span>
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

            {/* Two sided toggle & Ink Cost */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={params.isTwoSided}
                  onChange={(e) => updateParam('isTwoSided', e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <span>Impresión Dos Caras (Tira y Retira 4/4)</span>
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs">
                <span className="text-slate-400 font-medium whitespace-nowrap">Precio Tinta ({currency.symbol}/kg):</span>
                <input
                  type="number"
                  step="any"
                  value={params.inkCostPerKg}
                  onChange={(e) => updateParam('inkCostPerKg', Number(e.target.value))}
                  className="w-full sm:w-44 min-w-[140px] bg-slate-900 border border-slate-700 focus:border-amber-400 text-amber-300 rounded-xl px-3 py-1.5 font-mono text-xs sm:text-sm font-bold outline-none text-right transition-colors"
                  placeholder={currency.code === 'PYG' ? '120000' : '14.50'}
                />
              </div>
            </div>

            {/* Selector y Campo Especial de Código Pantone Adicional */}
            <div className="bg-slate-950/90 border-2 border-amber-500/50 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>Especificar Color Directo Pantone® Adicional</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        PMS Adicional
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Selecciona del catálogo, usa los accesos rápidos o escribe el código (ej: 186 C, Reflex Blue, 871 C Oro). Se suma a las planchas CTP, consumo y presupuesto.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPantoneTargetFront(pantoneTargetSide !== 'back');
                    setIsPantoneModalOpen(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Catálogo Visual Completo</span>
                </button>
              </div>

              {/* Botones de Acceso Rápido a Pantones Populares en Imprenta */}
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Frecuentes:</span>
                {[
                  { code: 'Pantone 186 C', name: 'Rojo 186 C', hex: '#c8102e', cob: 20 },
                  { code: 'Pantone Reflex Blue', name: 'Reflex Blue', hex: '#0a1172', cob: 25 },
                  { code: 'Pantone Warm Red', name: 'Warm Red', hex: '#f9423a', cob: 18 },
                  { code: 'Pantone 871 C', name: 'Oro 871 C', hex: '#84754e', cob: 30 },
                  { code: 'Pantone 877 C', name: 'Plata 877 C', hex: '#8a8d8f', cob: 30 },
                  { code: 'Pantone 347 C', name: 'Verde 347 C', hex: '#009a44', cob: 20 },
                  { code: 'Pantone Black 6 C', name: 'Negro Fondo', hex: '#101820', cob: 35 },
                ].map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleQuickAddPantonePreset(preset.code, preset.cob)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-[11px] font-mono text-slate-200 transition-all active:scale-95 shadow-sm"
                    title={`Cargar ${preset.code} (${preset.cob}% cob)`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: preset.hex }} />
                    <span className="font-semibold">{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* 1. Selector rápido de catálogo */}
                <div className="md:col-span-4">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    1. Catálogo Rápido Pantone:
                  </label>
                  <select
                    value={selectedCatalogPreset}
                    onChange={(e) => handleSelectDropdownPreset(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium focus:border-amber-400 outline-none"
                  >
                    <option value="">-- Elige un Pantone oficial o escribe al lado --</option>
                    <optgroup label="Amarillos & Naranjas">
                      {PANTONE_CATALOG.filter((p) => p.category === 'yellow' || p.category === 'orange').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Rojos & Rosas">
                      {PANTONE_CATALOG.filter((p) => p.category === 'red' || p.category === 'pink').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Azules & Violetas">
                      {PANTONE_CATALOG.filter((p) => p.category === 'blue' || p.category === 'purple' || p.category === 'cyan').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Verdes">
                      {PANTONE_CATALOG.filter((p) => p.category === 'green').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Metálicos (Oro / Plata / Cobre)">
                      {PANTONE_CATALOG.filter((p) => p.category === 'metallic').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Neutros & Fondeo">
                      {PANTONE_CATALOG.filter((p) => p.category === 'neutral').map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name.replace(/^Pantone [0-9a-zA-Z\s]+ \((.+)\)$/, '$1')}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Campo de texto especial para código Pantone libre con sugerencias datalist */}
                <div className="md:col-span-4">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>2. O Código Pantone Manual:</span>
                    {matchedPantone ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: matchedPantone.hex }} />
                        <span>Oficial Detectado</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Datalist activo</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      list="pantone-suggestions"
                      type="text"
                      value={pantoneInputCode}
                      onChange={(e) => {
                        setPantoneInputCode(e.target.value);
                        const found = PANTONE_CATALOG.find((p) => p.code.toLowerCase() === e.target.value.trim().toLowerCase());
                        if (found) {
                          setPantoneInputCoverage(found.recommendedCoveragePercent);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomOrCatalogPantone();
                        }
                      }}
                      placeholder="Ej: Pantone 186 C, 871 C Oro..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold outline-none transition-colors"
                    />
                    <div
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 shadow-sm"
                      style={{ backgroundColor: matchedPantone ? matchedPantone.hex : (pantoneInputCode ? '#e11d48' : '#64748b') }}
                    />
                  </div>

                  <datalist id="pantone-suggestions">
                    {PANTONE_CATALOG.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </datalist>
                </div>

                {/* 3. Cara de impresión y Cobertura */}
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    {params.isTwoSided && (
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Cara:</label>
                        <select
                          value={pantoneTargetSide}
                          onChange={(e) => setPantoneTargetSide(e.target.value as 'front' | 'back' | 'both')}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                        >
                          <option value="front">Frente</option>
                          <option value="back">Dorso</option>
                          <option value="both">Ambas</option>
                        </select>
                      </div>
                    )}
                    <div className={params.isTwoSided ? 'w-20' : 'w-full'}>
                      <label className="text-[10px] text-slate-400 block mb-1">Cob. %:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pantoneInputCoverage}
                        onChange={(e) => setPantoneInputCoverage(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-center text-amber-300 font-mono font-bold rounded-xl px-2 py-2 text-xs outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Botón de agregar */}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddCustomOrCatalogPantone}
                    disabled={!pantoneInputCode.trim()}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Sumar Pantone</span>
                  </button>
                </div>
              </div>

              {/* Feedback dinámico al agregar Pantone */}
              {pantoneFeedback && (
                <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-medium text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pantoneFeedback}</span>
                </div>
              )}
            </div>

            {/* Colors list (Front) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Colores Cara Frente
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-semibold border border-slate-700">
                    {params.inkColorsFront.length} de 8 cuerpos
                  </span>
                  {params.inkColorsFront.some((c) => c.isPantone || (c.name && /pantone|pms/i.test(c.name))) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      {params.inkColorsFront.filter((c) => c.isPantone || (c.name && /pantone|pms/i.test(c.name))).length} Pantone®
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPantoneTargetFront(true);
                      setIsPantoneModalOpen(true);
                    }}
                    disabled={params.inkColorsFront.length >= 8}
                    className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm disabled:opacity-40"
                    title="Añadir color directo Pantone oficial (Ej: Pantone 100 C)"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    + Color Pantone®
                  </button>

                  <button
                    type="button"
                    onClick={() => addColor(true)}
                    disabled={params.inkColorsFront.length >= 8}
                    className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tinta / Barniz
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {params.inkColorsFront.map((col) => {
                  const isPmsCol = Boolean(col.isPantone || (col.name && /pantone|pms/i.test(col.name)));
                  return (
                    <div
                      key={col.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs transition-colors ${
                        isPmsCol
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-slate-600 shrink-0 shadow-sm"
                        style={{ backgroundColor: col.colorHex }}
                      />
                      <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                        <input
                          type="text"
                          value={col.name}
                          onChange={(e) => updateColor(col.id, 'name', e.target.value, true)}
                          placeholder="Nombre o Código Pantone..."
                          className="bg-transparent text-slate-100 font-semibold text-xs outline-none w-full placeholder:text-slate-600"
                        />
                      </div>

                      {/* Botón para Designar o Alternar como Pantone Oficial */}
                      <button
                        type="button"
                        onClick={() => handleToggleColorPantone(col.id, true)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border flex items-center gap-1 shrink-0 transition-colors ${
                          isPmsCol
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/30'
                        }`}
                        title={isPmsCol ? 'Tinta directa Pantone®. Clic para desmarcar a CMYK regular' : 'Designar esta tinta como Pantone® directo oficial'}
                      >
                        <Palette className="w-2.5 h-2.5 text-amber-400" />
                        <span>{isPmsCol ? 'PMS Pantone®' : 'Designar Pantone'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-400">Cobertura:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={col.coveragePercent}
                          onChange={(e) =>
                            updateColor(col.id, 'coveragePercent', Number(e.target.value), true)
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-center font-mono text-amber-300 font-bold outline-none"
                        />
                        <span className="text-slate-400 font-mono">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeColor(col.id, true)}
                        disabled={params.inkColorsFront.length <= 1}
                        className="text-slate-500 hover:text-rose-400 p-1 disabled:opacity-30 transition-colors"
                        title="Eliminar color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colors list (Back / Dorso) if isTwoSided */}
            {params.isTwoSided && (
              <div className="pt-3 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Colores Cara Dorso / Retira
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-semibold border border-slate-700">
                      {params.inkColorsBack.length} de 8 cuerpos
                    </span>
                    {params.inkColorsBack.some((c) => c.isPantone || (c.name && /pantone|pms/i.test(c.name))) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        {params.inkColorsBack.filter((c) => c.isPantone || (c.name && /pantone|pms/i.test(c.name))).length} Pantone®
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPantoneTargetFront(false);
                        setIsPantoneModalOpen(true);
                      }}
                      disabled={params.inkColorsBack.length >= 8}
                      className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm disabled:opacity-40"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      + Color Pantone® Dorso
                    </button>

                    <button
                      type="button"
                      onClick={() => addColor(false)}
                      disabled={params.inkColorsBack.length >= 8}
                      className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tinta Dorso
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {params.inkColorsBack.map((col) => {
                    const isPmsCol = Boolean(col.isPantone || (col.name && /pantone|pms/i.test(col.name)));
                    return (
                      <div
                        key={col.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs transition-colors ${
                          isPmsCol
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                            : 'bg-slate-950/70 border-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-slate-600 shrink-0 shadow-sm"
                          style={{ backgroundColor: col.colorHex }}
                        />
                        <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => updateColor(col.id, 'name', e.target.value, false)}
                            placeholder="Nombre o Código Pantone..."
                            className="bg-transparent text-slate-100 font-semibold text-xs outline-none w-full placeholder:text-slate-600"
                          />
                        </div>

                        {/* Botón para Designar o Alternar como Pantone Oficial */}
                        <button
                          type="button"
                          onClick={() => handleToggleColorPantone(col.id, false)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border flex items-center gap-1 shrink-0 transition-colors ${
                            isPmsCol
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/30'
                          }`}
                          title={isPmsCol ? 'Tinta directa Pantone®. Clic para desmarcar a CMYK regular' : 'Designar esta tinta como Pantone® directo oficial'}
                        >
                          <Palette className="w-2.5 h-2.5 text-amber-400" />
                          <span>{isPmsCol ? 'PMS Pantone®' : 'Designar Pantone'}</span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-slate-400">Cobertura:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={col.coveragePercent}
                            onChange={(e) =>
                              updateColor(col.id, 'coveragePercent', Number(e.target.value), false)
                            }
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-center font-mono text-amber-300 font-bold outline-none"
                          />
                          <span className="text-slate-400 font-mono">%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeColor(col.id, false)}
                          disabled={params.inkColorsBack.length <= 1}
                          className="text-slate-500 hover:text-rose-400 p-1 disabled:opacity-30 transition-colors"
                          title="Eliminar color"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ink Consumption Live Result Pill */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-400 font-bold block">
                  Consumo Estimado de Tinta Offset:
                </span>
                <span className="text-slate-400 text-[11px]">
                  Superficie total impresa:{' '}
                  <span className="text-slate-200 font-mono font-medium">
                    {quoteResult.inkResult.totalAreaM2} m²
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Kilos Totales</span>
                  <span className="text-base font-mono font-bold text-emerald-300">
                    {quoteResult.inkResult.totalKg} kg
                  </span>
                </div>
                <div className="text-right border-l border-emerald-800/50 pl-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Costo Tintas</span>
                  <span className="text-base font-mono font-bold text-slate-100">
                    {formatCurrency(quoteResult.inkResult.totalCost, currency)}
                  </span>
                </div>
              </div>

              {/* Detalle de Pantones en consumo de tinta */}
              {(() => {
                const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                  Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                const allPms = [
                  ...params.inkColorsFront.filter(isPms),
                  ...(params.isTwoSided ? params.inkColorsBack.filter(isPms) : []),
                ];
                if (allPms.length === 0) return null;
                return (
                  <div className="w-full pt-2 border-t border-emerald-800/40 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span className="text-amber-300 font-medium flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Incluye {allPms.length} {allPms.length === 1 ? 'color directo Pantone®' : 'colores directos Pantone®'}:</span>
                      <strong className="text-slate-100 font-mono">{allPms.map((p) => p.name).join(', ')}</strong>
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      +{allPms.length} {allPms.length === 1 ? 'plancha / cuerpo sumado' : 'planchas / cuerpos sumados'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Section 3: Matrices (CTP) y Tiempos de Máquina (Aravo) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    3. Matrices CTP y Tiempos de Máquina (Aravo)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aravo = Tiempo/Hora en Guaraní. Cálculo de horas de preparación y tirada.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Planchas CTP
                </label>
                {(() => {
                  const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                    Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                  const pmsCount =
                    params.inkColorsFront.filter(isPms).length +
                    (params.isTwoSided ? params.inkColorsBack.filter(isPms).length : 0);
                  const cmykCount =
                    params.inkColorsFront.filter((c) => !isPms(c)).length +
                    (params.isTwoSided ? params.inkColorsBack.filter((c) => !isPms(c)).length : 0);
                  return (
                    <>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-400 font-mono font-bold flex items-center justify-between">
                        <span>{quoteResult.platesCount} planchas</span>
                        {pmsCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                            +{pmsCount} Pantone
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {cmykCount} CMYK{pmsCount > 0 ? ` + ${pmsCount} Pantone` : ''} (1 por cuerpo)
                      </span>
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Costo Plancha ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.ctpPlateCost}
                  onChange={(e) => updateParam('ctpPlateCost', Number(e.target.value))}
                  className="w-full min-w-[150px] sm:min-w-[160px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                  placeholder={currency.code === 'PYG' ? '45000' : '12.00'}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Puesta a Punto (min)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.machineSetupMinutes}
                  onChange={(e) => updateParam('machineSetupMinutes', Number(e.target.value))}
                  className="w-full min-w-[120px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none"
                  title="Tiempo de carga de planchas, entintado y registro en minutos"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Velocidad (pliegos/h)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.machineSpeedSheetsPerHour}
                  onChange={(e) => updateParam('machineSpeedSheetsPerHour', Number(e.target.value))}
                  className="w-full min-w-[120px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Maculatura / Ajuste (pliegos)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.setupWasteSheetsPerColor}
                  onChange={(e) => updateParam('setupWasteSheetsPerColor', Number(e.target.value))}
                  className="w-full min-w-[120px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none"
                  title="Pliegos de papel de desperdicio por cada color montado"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Merma Tirada (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.runWastePercent}
                  onChange={(e) => updateParam('runWastePercent', Number(e.target.value))}
                  className="w-full min-w-[120px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Costo Hora Máquina ({currency.symbol}/h)
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.machineHourlyRate}
                  onChange={(e) => updateParam('machineHourlyRate', Number(e.target.value))}
                  className="w-full min-w-[150px] sm:min-w-[160px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:border-amber-500 outline-none font-bold"
                  placeholder={currency.code === 'PYG' ? '250000' : '48.00'}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-amber-300 block mb-1">
                  Lavado Tintero Pantone ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.specialWashupCostPerColor ?? (currency.code === 'PYG' ? 150000 : 20)}
                  onChange={(e) => updateParam('specialWashupCostPerColor', Number(e.target.value))}
                  className="w-full min-w-[150px] sm:min-w-[160px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-300 font-mono focus:border-amber-500 outline-none font-bold"
                  placeholder={currency.code === 'PYG' ? '150000' : '20.00'}
                  title="Costo de preparación, lavado y entintado de cuerpo para cada color directo Pantone"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Por cuerpo especial</span>
              </div>
            </div>
          </div>

          {/* Section 4: Procesos de Acabados / Post-Prensa (10 Procesos Industriales) */}
          <PostPressFinishingManager
            finishings={params.finishings}
            onChangeFinishings={(updated) => updateParam('finishings', updated)}
            currency={currency}
            grossSheets={quoteResult.grossSheets}
            quantityUnits={params.quantityUnits}
            totalPaperM2={(quoteResult.grossSheets * params.sheetWidthMm * params.sheetHeightMm) / 1_000_000}
            technology="offset"
          />

          {/* Section 5: Parametrización Específica de Acabados Seleccionados (Barniz UV, Laminado, etc.) */}
          <PostPressParameterizer
            finishings={params.finishings}
            onChangeFinishings={(updated) => updateParam('finishings', updated)}
            currency={currency}
            grossSheets={quoteResult.grossSheets}
            quantityUnits={params.quantityUnits}
            totalPaperM2={(quoteResult.grossSheets * params.sheetWidthMm * params.sheetHeightMm) / 1_000_000}
            sheetWidthMm={params.sheetWidthMm}
            sheetHeightMm={params.sheetHeightMm}
            technology="offset"
            paperType={params.paperType}
            grammageGsm={params.grammageGsm}
            onChangePaperType={(type, grammage) => {
              onChangeParams({
                ...params,
                paperType: type,
                grammageGsm: grammage,
              });
            }}
            activePosesCount={activeArrangement.posesTotal}
            pieceWidthMm={params.pieceWidthMm}
            pieceHeightMm={params.pieceHeightMm}
            dieAndCreasingConfig={params.dieAndCreasingConfig}
            onApplyDieConfig={handleApplyDieConfig}
          />
        </div>

        {/* Right Column: Visualizer & Real-time Quote Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Visualizer Mode Toggle */}
          <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 font-mono px-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Modo de Visualización:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setVisualizerMode('canvas')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  visualizerMode === 'canvas'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Canvas 2D (Pinza & Corte)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisualizerMode('vector')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  visualizerMode === 'vector'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Vectorial SVG</span>
              </button>
            </div>
          </div>

          {/* Visualización de Pliego Component */}
          {visualizerMode === 'canvas' ? (
            <SheetCanvasVisualizer
              arrangements={arrangements}
              currentOrientation={selectedOrientation}
              onSelectOrientation={(ori) => setSelectedOrientation(ori)}
              gripperMarginMm={params.gripperMarginMm}
              nonGripperMarginMm={params.nonGripperMarginMm}
              onChangeNonGripperMargin={(margin) => updateParam('nonGripperMarginMm', margin)}
              customPosesCount={params.customPosesCount}
              customPosesX={params.customPosesX}
              customPosesY={params.customPosesY}
              isCustomPosesActive={params.isCustomPosesActive}
              onChangePoses={({ total, countX, countY, isCustom }) => {
                onChangeParams({
                  ...params,
                  customPosesCount: total,
                  customPosesX: countX,
                  customPosesY: countY,
                  isCustomPosesActive: isCustom,
                });
              }}
              onResetAutoPoses={() => {
                onChangeParams({
                  ...params,
                  customPosesCount: undefined,
                  customPosesX: undefined,
                  customPosesY: undefined,
                  isCustomPosesActive: false,
                });
              }}
              gutterMm={params.gutterMm}
              bleedMm={params.bleedMm}
              gripperPosition={gripperPosition}
              onToggleGripperPosition={(pos) => setGripperPosition(pos)}
              plateWidthMm={params.plateWidthMm || 745}
              plateHeightMm={params.plateHeightMm || 605}
              machineName={params.machineModelName || 'Heidelberg SM 74'}
            />
          ) : (
            <ImpositionVisualizer
              arrangements={arrangements}
              currentOrientation={selectedOrientation}
              onSelectOrientation={(ori) => setSelectedOrientation(ori)}
              gripperMarginMm={params.gripperMarginMm}
              nonGripperMarginMm={params.nonGripperMarginMm}
              onChangeNonGripperMargin={(margin) => updateParam('nonGripperMarginMm', margin)}
              customPosesCount={params.customPosesCount}
              customPosesX={params.customPosesX}
              customPosesY={params.customPosesY}
              isCustomPosesActive={params.isCustomPosesActive}
              onChangePoses={({ total, countX, countY, isCustom }) => {
                onChangeParams({
                  ...params,
                  customPosesCount: total,
                  customPosesX: countX,
                  customPosesY: countY,
                  isCustomPosesActive: isCustom,
                });
              }}
              onResetAutoPoses={() => {
                onChangeParams({
                  ...params,
                  customPosesCount: undefined,
                  customPosesX: undefined,
                  customPosesY: undefined,
                  isCustomPosesActive: false,
                });
              }}
              gutterMm={params.gutterMm}
              bleedMm={params.bleedMm}
              gripperPosition={gripperPosition}
              onToggleGripperPosition={(pos) => setGripperPosition(pos)}
              plateWidthMm={params.plateWidthMm || 745}
              plateHeightMm={params.plateHeightMm || 605}
              machineName={params.machineModelName || 'Heidelberg SM 74'}
            />
          )}

          {/* Quick Prepress Technical Sheet */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Ficha Técnica de Producción Offset
                </h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-mono">
                Orden #{Math.floor(params.quantityUnits / 10)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Esquema / Poses por Pliego:</span>
                <span className="font-mono font-bold text-sky-400">
                  {activeArrangement.posesTotal} poses ({activeArrangement.posesHorizontal}×{activeArrangement.posesVertical}) {params.isCustomPosesActive ? '• Manual' : '• Auto'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Márgenes Laterales / Pinza:</span>
                <span className="font-mono text-cyan-300">
                  {params.nonGripperMarginMm} mm lat. • {params.gripperMarginMm} mm pinza
                </span>
              </div>

              {/* Troquel y Contrahendido CITO si está configurado */}
              {params.dieAndCreasingConfig && (
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60 bg-amber-500/5 px-2 rounded-lg -mx-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>Troquel & Contrahendido:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full border border-white/20"
                      style={{ backgroundColor: params.dieAndCreasingConfig.citoColorHex }}
                    />
                    <span>
                      CITO {params.dieAndCreasingConfig.citoMatrixCode} ({params.dieAndCreasingConfig.caliperMm} mm)
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pliegos Netos de Tirada:</span>
                <span className="font-mono font-bold text-slate-200">
                  {quoteResult.netSheets.toLocaleString()} pliegos
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Maculatura de Ajuste (Entrada):</span>
                <span className="font-mono text-rose-300">
                  +{quoteResult.setupWasteSheets.toLocaleString()} pliegos
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Merma de Tirada ({params.runWastePercent}%):</span>
                <span className="font-mono text-rose-300">
                  +{quoteResult.runWasteSheets.toLocaleString()} pliegos
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60 font-semibold text-slate-200">
                <span>Total Pliegos Brutos a Comprar:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {quoteResult.grossSheets.toLocaleString()} pliegos ({quoteResult.reamsRequired} resmas)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Peso Total del Papel:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {quoteResult.paperWeightKg} kg
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Tintas / Cuerpos:</span>
                <span className="font-mono text-slate-100 font-bold">
                  {quoteResult.platesCount} cuerpos ({params.inkColorsFront.length} frente{params.isTwoSided ? ` + ${params.inkColorsBack.length} dorso` : ''})
                </span>
              </div>

              {/* Colores Pantone en Ficha Técnica */}
              {(() => {
                const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                  Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                const allPantones = [
                  ...params.inkColorsFront.filter(isPms).map((c) => ({ ...c, side: 'Frente' })),
                  ...(params.isTwoSided ? params.inkColorsBack.filter(isPms).map((c) => ({ ...c, side: 'Dorso' })) : []),
                ];
                if (allPantones.length === 0) return null;
                return (
                  <div className="py-2 border-b border-slate-800/60 bg-amber-500/10 px-2.5 rounded-xl -mx-1 my-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-amber-400" />
                        <span>Colores Directos Pantone® ({allPantones.length}):</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300 font-bold">
                        +{allPantones.length} {allPantones.length === 1 ? 'plancha' : 'planchas'} CTP
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allPantones.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-500/30 text-[11px] font-mono text-slate-100 shadow-sm"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: p.colorHex }}
                          />
                          <span className="text-amber-300 font-bold">{p.name || p.pantoneCode}</span>
                          <span className="text-slate-400 text-[10px]">({p.coveragePercent}%)</span>
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-medium">
                            [{p.side}]
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Planchas CTP Requeridas:</span>
                {(() => {
                  const isPms = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
                    Boolean(c.isSpot || c.isPantone || (c.name && /pantone|pms/i.test(c.name)));
                  const pmsCount =
                    params.inkColorsFront.filter(isPms).length +
                    (params.isTwoSided ? params.inkColorsBack.filter(isPms).length : 0);
                  const cmykCount =
                    params.inkColorsFront.filter((c) => !isPms(c)).length +
                    (params.isTwoSided ? params.inkColorsBack.filter((c) => !isPms(c)).length : 0);
                  return (
                    <span className="font-mono text-amber-400 font-bold">
                      {quoteResult.platesCount} matrices ({cmykCount} CMYK{pmsCount > 0 ? ` + ${pmsCount} Pantone directo` : ''})
                    </span>
                  );
                })()}
              </div>

              {quoteResult.breakdown.washupInkingCost !== undefined && quoteResult.breakdown.washupInkingCost > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60 text-amber-300">
                  <span className="text-slate-400">Lavado de Baterías Pantone:</span>
                  <span className="font-mono font-bold">
                    +{formatCurrency(quoteResult.breakdown.washupInkingCost, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Aravo (Tiempo de Máquina):</span>
                <span className="font-mono text-amber-300 font-bold">
                  {quoteResult.breakdown.totalTimeHours} horas ({Math.round(quoteResult.breakdown.totalTimeHours * 60)} min)
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
              totalProductionCost={quoteResult.breakdown.totalProductionCost}
              breakdown={quoteResult.breakdown}
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
    </div>
  );
};

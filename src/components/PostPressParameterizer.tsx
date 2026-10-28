import React, { useState, useMemo } from 'react';
import { CurrencyConfig, FinishingProcess, FinishingProcessParameters, DieAndCreasingConfig } from '../types/graphic';
import { DieAndCreasingSidePanel } from './DieAndCreasingSidePanel';
import {
  POST_PRESS_PROCESSES_CATALOG,
  PostPressProcessDefinition,
  getCitoMatrixRecommendation,
  CITO_ABACO_URL,
  CITO_STANDARD_MATRIX_TABLE,
  CitoMatrixRecommendation,
} from '../utils/postPressProcesses';
import {
  Sliders,
  Sun,
  Layers,
  Scissors,
  FoldHorizontal,
  Box,
  Sparkles,
  Maximize2,
  SquareCode,
  ShieldCheck,
  PackageCheck,
  Zap,
  Gauge,
  Check,
  RefreshCw,
  Info,
  ArrowRight,
  Save,
  Clock,
  Thermometer,
  Wrench,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface PostPressParameterizerProps {
  finishings: FinishingProcess[];
  onChangeFinishings: (finishings: FinishingProcess[]) => void;
  currency: CurrencyConfig;
  grossSheets?: number;
  quantityUnits?: number;
  totalPaperM2?: number;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  technology?: 'offset' | 'flexo';
  paperType?: string;
  grammageGsm?: number;
  onChangePaperType?: (type: string, grammage: number) => void;
  activePosesCount?: number;
  pieceWidthMm?: number;
  pieceHeightMm?: number;
  dieAndCreasingConfig?: DieAndCreasingConfig;
  onApplyDieConfig?: (config: DieAndCreasingConfig) => void;
}

export const PostPressParameterizer: React.FC<PostPressParameterizerProps> = ({
  finishings,
  onChangeFinishings,
  currency,
  grossSheets = 1000,
  quantityUnits = 5000,
  totalPaperM2 = 700,
  sheetWidthMm = 1000,
  sheetHeightMm = 700,
  technology = 'offset',
  paperType,
  grammageGsm,
  onChangePaperType,
  activePosesCount,
  pieceWidthMm,
  pieceHeightMm,
  dieAndCreasingConfig,
  onApplyDieConfig,
}) => {
  // State for Die and Creasing side panel
  const [isDiePanelOpen, setIsDiePanelOpen] = useState<boolean>(false);

  // Determine which processes are active
  const activeProcesses = useMemo(() => {
    return POST_PRESS_PROCESSES_CATALOG.filter((catalogDef) => {
      const match = finishings.find((f) => f.id === catalogDef.id);
      return match ? match.enabled : catalogDef.enabled;
    });
  }, [finishings]);

  // Selected process tab to parameterize (defaults to UV Varnish or Lamination or first active)
  const [selectedProcessId, setSelectedProcessId] = useState<string>(() => {
    // Prefer UV coating or lamination if active, otherwise first active
    const uvActive = finishings.find((f) => f.id === 'proc_uv_varnishing' && f.enabled);
    if (uvActive) return 'proc_uv_varnishing';
    const lamActive = finishings.find((f) => f.id === 'proc_lamination' && f.enabled);
    if (lamActive) return 'proc_lamination';
    const firstActive = finishings.find((f) => f.enabled);
    return firstActive ? firstActive.id : 'proc_uv_varnishing';
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Handle applying Die and Creasing configuration
  const handleApplyDieConfigFromPanel = (config: DieAndCreasingConfig) => {
    if (onApplyDieConfig) {
      onApplyDieConfig(config);
    } else {
      const updated = finishings.map((f) => {
        if (f.id === 'proc_die_cutting') {
          return {
            ...f,
            enabled: true,
            setupCost: config.dieCostEstimate ? Number(config.dieCostEstimate.toFixed(2)) : f.setupCost,
            parameters: {
              ...f.parameters,
              dieCuttingLinearMetersRules: config.linearMetersCuttingPerSheet,
              dieCuttingNicksCount: config.nicksCountPerPiece,
            },
          };
        }
        if (f.id === 'proc_creasing') {
          return {
            ...f,
            enabled: true,
            parameters: {
              ...f.parameters,
              creasingSubstrateThicknessMm: config.caliperMm,
              creasingSubstrateMicrons: config.caliperMicrons,
              creasingMatrixType: config.creasingSystem,
              creasingCitoMatrixCode: config.citoMatrixCode,
              creasingRuleThicknessPt: config.creasingRuleThicknessPt,
            },
          };
        }
        return f;
      });
      onChangeFinishings(updated);
    }

    setNotificationMsg(
      `¡Troqueles & Contrahendidos CITO (${config.citoMatrixCode}) sincronizados con los parámetros de acabado!`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Get current active process or fallback
  const currentProcessDef =
    POST_PRESS_PROCESSES_CATALOG.find((p) => p.id === selectedProcessId) ||
    POST_PRESS_PROCESSES_CATALOG[0];

  const currentFinishingState =
    finishings.find((f) => f.id === selectedProcessId) || {
      ...currentProcessDef,
      enabled: false,
    };

  const isCurrentActive = currentFinishingState.enabled;

  // Single sheet area in m2
  const oneSheetM2 = (sheetWidthMm * sheetHeightMm) / 1_000_000;

  // Helper to update specific parameters of a process
  const updateProcessParams = (
    procId: string,
    paramKey: keyof FinishingProcessParameters,
    value: any
  ) => {
    const updated = finishings.map((f) => {
      if (f.id === procId) {
        return {
          ...f,
          parameters: {
            ...f.parameters,
            [paramKey]: value,
          },
        };
      }
      return f;
    });
    onChangeFinishings(updated);
  };

  // Helper to update unitCost or setupCost directly
  const applyCalculatedCost = (
    procId: string,
    newUnitCost?: number,
    newSetupCost?: number,
    costType?: 'per_sheet' | 'per_unit' | 'per_m2' | 'fixed',
    appliedLabel?: string
  ) => {
    const updated = finishings.map((f) => {
      if (f.id === procId) {
        return {
          ...f,
          enabled: true,
          ...(newUnitCost !== undefined ? { unitCost: Number(newUnitCost.toFixed(4)) } : {}),
          ...(newSetupCost !== undefined ? { setupCost: Number(newSetupCost.toFixed(2)) } : {}),
          ...(costType ? { costType } : {}),
        };
      }
      return f;
    });
    onChangeFinishings(updated);
    setNotificationMsg(
      appliedLabel || `¡Parámetros técnicos aplicados al costo de ${currentProcessDef.name}!`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Activate a process directly from this panel
  const handleToggleActivate = (procId: string) => {
    const exists = finishings.find((f) => f.id === procId);
    let updated: FinishingProcess[];
    if (exists) {
      updated = finishings.map((f) =>
        f.id === procId ? { ...f, enabled: !f.enabled } : f
      );
    } else {
      const def = POST_PRESS_PROCESSES_CATALOG.find((p) => p.id === procId);
      if (def) {
        updated = [...finishings, { ...def, enabled: true }];
      } else {
        return;
      }
    }
    onChangeFinishings(updated);
  };

  // Current process parameters with smart fallbacks
  const params: FinishingProcessParameters = currentFinishingState.parameters || {};

  // Render icons
  const renderIcon = (name: string, isActive: boolean) => {
    const cls = `w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`;
    switch (name) {
      case 'Scissors': return <Scissors className={cls} />;
      case 'FoldHorizontal': return <FoldHorizontal className={cls} />;
      case 'Box': return <Box className={cls} />;
      case 'Sparkles': return <Sparkles className={cls} />;
      case 'Layers': return <Layers className={cls} />;
      case 'Sun': return <Sun className={cls} />;
      case 'Maximize2': return <Maximize2 className={cls} />;
      case 'SquareCode': return <SquareCode className={cls} />;
      case 'ShieldCheck': return <ShieldCheck className={cls} />;
      case 'PackageCheck': return <PackageCheck className={cls} />;
      default: return <Wrench className={cls} />;
    }
  };

  // ----------------------------------------------------
  // SPECIFIC PROCESS CALCULATIONS
  // ----------------------------------------------------

  // 1. Barnizado UV Calculations
  const uvCoverage = params.uvCoveragePercent ?? 30; // 30% coverage
  const uvBaseGrams = params.uvBaseGramsPerM2 ?? 5.0; // 5.0 g/m2 for anilox/offset
  const uvKgPrice = params.uvVarnishKgPrice ?? 15.0; // $15/kg
  const uvType = params.uvVarnishType ?? 'gloss';
  const effectiveUvGramsM2 = (uvBaseGrams * uvCoverage) / 100;
  const totalUvKg = (totalPaperM2 * effectiveUvGramsM2) / 1000;
  const uvCostPerM2 = (effectiveUvGramsM2 / 1000) * uvKgPrice;
  const uvCostPerSheet = uvCostPerM2 * oneSheetM2;
  const uvTotalVarnishCost = totalUvKg * uvKgPrice;

  // 2. Laminado Calculations
  const lamFilmType = params.laminationFilmType ?? 'bopp_matte';
  const lamMicrons = params.laminationMicrons ?? (lamFilmType === 'soft_touch' ? 30 : lamFilmType === 'bopp_matte' ? 24 : 20);
  const lamBaseSpeed = params.laminationBaseSpeedSheetsPerHour ?? 4500; // at 20 microns
  // Thermal dwell time physics formula: Speed drops as thickness rises
  const lamSpeedFactor = Math.max(0.45, Math.min(1.15, 1 - (lamMicrons - 20) * 0.045));
  const lamAdjustedSpeed = Math.round(lamBaseSpeed * lamSpeedFactor);
  const lamCalenderTemp = Math.round(95 + (lamMicrons - 18) * 1.4);
  const lamFilmCostM2 =
    params.laminationFilmCostPerM2 ??
    (lamFilmType === 'soft_touch'
      ? 0.16
      : lamFilmType === 'anti_scratch'
      ? 0.14
      : lamFilmType === 'pet_metal'
      ? 0.11
      : lamFilmType === 'bopp_matte'
      ? 0.075
      : 0.055);
  const lamTotalFilmCost = totalPaperM2 * lamFilmCostM2;
  const lamCostPerSheet = lamFilmCostM2 * oneSheetM2;
  const lamEstimatedRunHours = (grossSheets / Math.max(100, lamAdjustedSpeed)).toFixed(2);

  // 3. Troquelado Calculations
  const dieComplexity = params.dieCuttingComplexity ?? 'medium';
  const dieLinearMeters = params.dieCuttingLinearMetersRules ?? 14;
  const dieCostPerMeter = params.dieCuttingRuleCostPerMeter ?? 3.5;
  const dieSpeed =
    dieComplexity === 'simple' ? 6200 : dieComplexity === 'medium' ? 4800 : 3400;
  const dieEstimatedClicheSetup = Math.round(dieLinearMeters * dieCostPerMeter + 25);
  const dieHours = (grossSheets / dieSpeed).toFixed(2);
  const dieCostPerSheet = (0.035 * (dieComplexity === 'simple' ? 0.85 : dieComplexity === 'complex' ? 1.4 : 1.0));

  // 4. Marcado y Hendido Calculations (mm / micras & Ábaco CITO)
  const creasingThicknessMm =
    params.creasingSubstrateThicknessMm !== undefined
      ? params.creasingSubstrateThicknessMm
      : params.creasingSubstrateMicrons !== undefined
      ? params.creasingSubstrateMicrons / 1000
      : params.creasingSubstrateCaliberPt !== undefined
      ? Number((params.creasingSubstrateCaliberPt * 0.0254).toFixed(2))
      : 0.40; // Default 0.40 mm = 400 µm
  const creasingSubstrateMicrons = Math.round(creasingThicknessMm * 1000);
  const recommendedCreaseWidthMm = Number(
    ((1.5 * creasingThicknessMm) + 0.71).toFixed(2)
  );
  const recommendedCreaseDepthMm = Number(creasingThicknessMm.toFixed(2));
  const citoRec = useMemo(
    () => getCitoMatrixRecommendation(creasingThicknessMm),
    [creasingThicknessMm]
  );

  // 5. Pegado y Formado Calculations
  const boxType = params.foldingGluingBoxType ?? 'crash_lock_bottom';
  const gluerSpeed =
    boxType === 'straight_line' ? 32000 : boxType === 'crash_lock_bottom' ? 18000 : 12000;
  const glueGramsPer1000 = params.foldingGluingGlueGramsPer1000 ?? (boxType === 'crash_lock_bottom' ? 4.2 : 1.8);
  const glueKgPrice = params.foldingGluingGlueKgPrice ?? 6.5;
  const totalGlueKg = ((quantityUnits / 1000) * glueGramsPer1000) / 1000;
  const totalGlueCost = totalGlueKg * glueKgPrice;
  const gluerHours = (quantityUnits / gluerSpeed).toFixed(2);

  // 6. Hot Stamping / Foil Calculations
  const foilAreaCm2 = params.foilStampedAreaCm2 ?? 16;
  const foilCostM2 = params.foilCostPerM2 ?? 0.85;
  const foilWastePct = params.foilWasteMarginPercent ?? 15;
  const foilTotalM2 = Number(
    (((quantityUnits * (foilAreaCm2 / 10000)) * (1 + foilWastePct / 100))).toFixed(2)
  );
  const totalFoilCost = Number((foilTotalM2 * foilCostM2).toFixed(2));
  const foilCostPerUnit = quantityUnits > 0 ? totalFoilCost / quantityUnits : 0;

  // 7. Repujado / Embossing Calculations
  const embossDepth = params.embossingDepthMicrons ?? 220;
  const embossMaterial = params.embossingDieMaterial ?? 'brass_cnc';

  // 8. Ventana Acetato Calculations
  const winWidth = params.windowWidthMm ?? 85;
  const winHeight = params.windowHeightMm ?? 65;
  const winOverlap = params.windowGlueOverlapMm ?? 6;
  const winPatchAreaM2 =
    ((winWidth + winOverlap * 2) * (winHeight + winOverlap * 2)) / 1_000_000;
  const winTotalM2 = Number((winPatchAreaM2 * quantityUnits * 1.05).toFixed(2));
  const winPetKg = Number((winTotalM2 * 0.18 * 1.35).toFixed(2)); // PET density 1.35 g/cm3 at 180 microns

  // 9. Inspección Visión Calculations
  const visionSensMm = params.visionMinDefectSizeMm ?? 0.2;
  const visionRejectionPct = params.visionEstimatedRejectionPercent ?? 0.8;

  // 10. Agrupado / Embalaje Calculations
  const bundleUnits = params.bundleUnitsPerPack ?? 50;
  const totalPacks = Math.ceil(quantityUnits / Math.max(1, bundleUnits));
  const packsPerBox = params.bundlePacksPerMasterBox ?? 20;
  const totalMasterBoxes = Math.ceil(totalPacks / Math.max(1, packsPerBox));

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Parametrización Técnica Avanzada de Acabados
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {activeProcesses.length} Activos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibración ingenieril: cobertura y consumo de barniz UV por m², velocidad de laminado por micras de film, matrices y tiempos.
            </p>
          </div>
        </div>

        {/* Actions & Global summary badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Botón principal del Panel de Troqueles & Contrahendidos CITO */}
          <button
            type="button"
            onClick={() => setIsDiePanelOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all border border-amber-400/50"
            title="Abrir panel especializado de troqueles y contrahendidos personalizados CITO"
          >
            <Scissors className="w-4 h-4 text-slate-950" />
            <span>Panel de Troqueles & Contrahendidos</span>
            {dieAndCreasingConfig ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono font-bold border border-amber-400/40">
                CITO {dieAndCreasingConfig.citoMatrixCode}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 font-mono font-bold">
                CITO Ábaco
              </span>
            )}
          </button>

          {/* Global summary badge */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Tirada base:</span>
            <span className="text-amber-400 font-bold">
              {technology === 'offset'
                ? `${grossSheets.toLocaleString()} pliegos`
                : `${Math.round(grossSheets).toLocaleString()} ml`}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{totalPaperM2.toFixed(0)} m²</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notificationMsg}</span>
          </div>
        </div>
      )}

      {/* Navigation Pills: Switch between active (or all) finishes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Selecciona el Acabado para Parametrizar:
          </span>
          <span className="text-[10px] text-slate-500">
            Haz clic para calibrar parámetros específicos
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/70 rounded-xl border border-slate-800">
          {POST_PRESS_PROCESSES_CATALOG.map((proc) => {
            const isMatchActive = finishings.some((f) => f.id === proc.id && f.enabled);
            const isSelected = selectedProcessId === proc.id;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => setSelectedProcessId(proc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : isMatchActive
                    ? 'bg-slate-900 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
                    : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 opacity-70'
                }`}
              >
                {renderIcon(proc.iconName, isSelected || isMatchActive)}
                <span>#{proc.number} {proc.name.split(' ')[0]}</span>
                {isMatchActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-slate-950' : 'bg-amber-400'
                    }`}
                  />
                )}
              </button>
            );
          })}

          {/* Acceso directo al Panel de Troqueles & Contrahendidos CITO */}
          <button
            type="button"
            onClick={() => setIsDiePanelOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 transition-all shadow-sm active:scale-95 ml-auto"
            title="Abrir Panel Especializado de Troqueles y Contrahendidos CITO"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel Troqueles & CITO</span>
          </button>
        </div>
      </div>

      {/* Main Process Parameterization Container */}
      <div className="bg-slate-950/60 rounded-2xl border border-slate-800/90 p-5 flex flex-col gap-5">
        {/* Sub-Header of current process */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400">
              {renderIcon(currentProcessDef.iconName, true)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  #{currentProcessDef.number}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-100">
                  {currentProcessDef.name}
                </h4>
                <span className="text-xs text-slate-400 font-mono hidden md:inline">
                  ({currentProcessDef.englishName})
                </span>
              </div>
              <span className="text-[11px] text-amber-400/90 font-mono mt-0.5 block">
                {currentProcessDef.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleActivate(selectedProcessId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isCurrentActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentActive ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              {isCurrentActive ? 'Acabado Activo en Cotización' : 'Inactivo (Clic para activar)'}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* CASE 6: BARNIZADO Y LACADO UV (UV Coating / Varnishing)           */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_uv_varnishing' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Parameter 1: Cobertura (%) */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      Cobertura de Barniz UV (%)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {uvCoverage}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Porcentaje de superficie del pliego/etiqueta cubierta con barniz.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={uvCoverage}
                    onChange={(e) =>
                      updateProcessParams('proc_uv_varnishing', 'uvCoveragePercent', Number(e.target.value))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                    <button
                      type="button"
                      onClick={() => updateProcessParams('proc_uv_varnishing', 'uvCoveragePercent', 15)}
                      className={`p-1 rounded border ${uvCoverage === 15 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      15% Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProcessParams('proc_uv_varnishing', 'uvCoveragePercent', 35)}
                      className={`p-1 rounded border ${uvCoverage === 35 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      35% Reserva
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProcessParams('proc_uv_varnishing', 'uvCoveragePercent', 60)}
                      className={`p-1 rounded border ${uvCoverage === 60 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      60% Medio
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProcessParams('proc_uv_varnishing', 'uvCoveragePercent', 100)}
                      className={`p-1 rounded border ${uvCoverage === 100 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      100% Pleno
                    </button>
                  </div>
                </div>
              </div>

              {/* Parameter 2: Consumo Base y Tipo */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Tipo de Barniz y Aporte Base (g/m²)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Aporte de capa según tecnología de aplicación (torre offset vs serigrafía).
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Tipo de Acabado UV</label>
                    <select
                      value={uvType}
                      onChange={(e) =>
                        updateProcessParams('proc_uv_varnishing', 'uvVarnishType', e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-200 outline-none"
                    >
                      <option value="gloss">UV Alto Brillo Especular (Offset 4.5 - 6 g/m²)</option>
                      <option value="matte">UV Mate Antirreflejo (5 - 7 g/m²)</option>
                      <option value="drip_off">Efecto Drip-Off / Texturado (6 - 8 g/m²)</option>
                      <option value="silkscreen_high_build">Serigráfico Alto Relieve / Braille (12 - 16 g/m²)</option>
                      <option value="waterbased">Barniz Acrílico Base Agua Protección (3.5 - 4.5 g/m²)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Consumo Base</label>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="25"
                          value={uvBaseGrams}
                          onChange={(e) =>
                            updateProcessParams('proc_uv_varnishing', 'uvBaseGramsPerM2', Number(e.target.value))
                          }
                          className="w-full bg-transparent font-mono text-xs text-amber-300 font-bold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">g/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Precio Barniz</label>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-slate-400 font-mono">{currency.symbol}</span>
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          value={uvKgPrice}
                          onChange={(e) =>
                            updateProcessParams('proc_uv_varnishing', 'uvVarnishKgPrice', Number(e.target.value))
                          }
                          className="w-full bg-transparent font-mono text-xs text-slate-200 font-bold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameter 3: Cálculos Técnicos en Tiempo Real */}
              <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono block">
                    ⚡ Métricas de Barniz Calculadas
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Fórmula: Cobertura {uvCoverage}% × {uvBaseGrams} g/m² = {effectiveUvGramsM2.toFixed(2)} g/m² efectivos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo / m²</span>
                    <span className="text-sm font-mono font-bold text-amber-300">
                      {currency.symbol}{uvCostPerM2.toFixed(4)}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo / Pliego</span>
                    <span className="text-sm font-mono font-bold text-slate-100">
                      {currency.symbol}{uvCostPerSheet.toFixed(4)}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Kilos Químicos</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {totalUvKg.toFixed(2)} kg
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Barniz</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {currency.symbol}{uvTotalVarnishCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyCalculatedCost(
                        'proc_uv_varnishing',
                        uvCostPerSheet,
                        25,
                        'per_sheet',
                        `¡Costo de Barniz UV fijado a ${currency.symbol}${uvCostPerSheet.toFixed(4)}/pliego!`
                      )
                    }
                    className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Aplicar por Pliego</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyCalculatedCost(
                        'proc_uv_varnishing',
                        uvCostPerM2,
                        25,
                        'per_m2',
                        `¡Costo de Barniz UV fijado a ${currency.symbol}${uvCostPerM2.toFixed(4)}/m²!`
                      )
                    }
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs border border-slate-700"
                    title="Aplicar costo como $/m²"
                  >
                    $/m²
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 5: LAMINADO O PLASTIFICADO (Lamination)                       */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_lamination' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Parameter 1: Film Type & Microns */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Tipo de Película y Espesor (Micras µm)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    El micraje determina el anclaje térmico y la resistencia al rayado.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Película Seleccionada</label>
                    <select
                      value={lamFilmType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        updateProcessParams('proc_lamination', 'lamFilmType', val);
                        if (val === 'soft_touch') updateProcessParams('proc_lamination', 'lamMicrons', 30);
                        else if (val === 'bopp_matte') updateProcessParams('proc_lamination', 'lamMicrons', 24);
                        else if (val === 'anti_scratch') updateProcessParams('proc_lamination', 'lamMicrons', 28);
                        else updateProcessParams('proc_lamination', 'lamMicrons', 20);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-200 outline-none"
                    >
                      <option value="bopp_gloss">BOPP Brillante Estándar (20 µm)</option>
                      <option value="bopp_matte">BOPP Mate Sedoso (24 µm)</option>
                      <option value="soft_touch">BOPP Soft Touch Aterciopelado (30 µm)</option>
                      <option value="anti_scratch">BOPP Antirrayas Anti-Scratch (28 µm)</option>
                      <option value="pet_metal">Poliéster PET Metalizado Oro/Plata (23 µm)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Micraje del Film:</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {lamMicrons} micras (µm)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="35"
                      step="1"
                      value={lamMicrons}
                      onChange={(e) =>
                        updateProcessParams('proc_lamination', 'lamMicrons', Number(e.target.value))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Parameter 2: Ajuste de Velocidad y Temperatura según Micras */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-1">
                    <Gauge className="w-4 h-4" />
                    <span>Ajuste Dinámico de Velocidad</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A mayor micraje, el film requiere menor velocidad lineal para que la calandra transfiera calor al adhesivo EVA sin formar burbujas.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Velocidad Base (a 20µm):</span>
                    <input
                      type="number"
                      step="200"
                      value={lamBaseSpeed}
                      onChange={(e) =>
                        updateProcessParams('proc_lamination', 'lamBaseSpeedSheetsPerHour', Number(e.target.value))
                      }
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-slate-200"
                    />
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-sky-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-sky-300 font-bold block">Velocidad Calibrada:</span>
                      <span className="text-[10px] text-slate-500">
                        Factor: {(lamSpeedFactor * 100).toFixed(0)}% del nominal
                      </span>
                    </div>
                    <span className="text-base font-mono font-bold text-sky-400">
                      {lamAdjustedSpeed.toLocaleString()} pl/h
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      Temp. Calandra:
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {lamCalenderTemp} °C
                    </span>
                  </div>
                </div>
              </div>

              {/* Parameter 3: Cálculos de Costo y Botón de Aplicación */}
              <div className="bg-gradient-to-br from-sky-950/30 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-sky-500/30 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-wider font-mono block">
                    📊 Costo y Rendimiento de Laminado
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Para {totalPaperM2.toFixed(1)} m² ({grossSheets.toLocaleString()} pliegos brutos).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo Film / m²</span>
                    <span className="text-sm font-mono font-bold text-sky-300">
                      {currency.symbol}{lamFilmCostM2.toFixed(3)}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo / Pliego</span>
                    <span className="text-sm font-mono font-bold text-slate-100">
                      {currency.symbol}{lamCostPerSheet.toFixed(3)}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Tiempo Laminado</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {lamEstimatedRunHours} h
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Film</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {currency.symbol}{lamTotalFilmCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyCalculatedCost(
                        'proc_lamination',
                        lamCostPerSheet,
                        20,
                        'per_sheet',
                        `¡Velocidad calibrada a ${lamAdjustedSpeed} pl/h y costo a ${currency.symbol}${lamCostPerSheet.toFixed(3)}/pliego!`
                      )
                    }
                    className="flex-1 py-1.5 px-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Aplicar por Pliego</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyCalculatedCost(
                        'proc_lamination',
                        lamFilmCostM2,
                        20,
                        'per_m2',
                        `¡Costo de Film fijado a ${currency.symbol}${lamFilmCostM2.toFixed(3)}/m²!`
                      )
                    }
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-xs border border-slate-700"
                    title="Aplicar costo como $/m²"
                  >
                    $/m²
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 1: TROQUELADO Y CORTE (Die-Cutting)                           */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_die_cutting' && (
          <div className="flex flex-col gap-4">
            {/* Banner destacado: Panel Especializado de Troqueles & Contrahendidos CITO */}
            <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-orange-950/40 p-4 rounded-xl border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                      Panel Especializado de Troqueles & Contrahendidos CITO
                    </h4>
                    {dieAndCreasingConfig ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                        {dieAndCreasingConfig.name} • CITO {dieAndCreasingConfig.citoMatrixCode}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        Ábaco CITO Integrado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Configuración de madera láser, altura de flejes, compensación por sustrato ({paperType || 'Cartón plegadizo'}, {grammageGsm || 300} gsm), nicks de sujeción y cálculo automático de contrahendidos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDiePanelOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shrink-0 shadow-md active:scale-95 transition-all"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Abrir Panel de Troqueles & Contrahendidos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Complejidad del Trazado Geométrico
                </label>
                <p className="text-[11px] text-slate-400">
                  A mayor cantidad de curvas y ventanas, menor velocidad y mayor costo de matriz.
                </p>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'simple', label: 'Baja (Rectilíneo / Cortes simples)', speed: '6.200 golpes/h' },
                  { id: 'medium', label: 'Media (Solapas, pestañas y curvas)', speed: '4.800 golpes/h' },
                  { id: 'complex', label: 'Alta (Microtroquel / Múltiples ventanas)', speed: '3.400 golpes/h' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateProcessParams('proc_die_cutting', 'dieCuttingComplexity', item.id)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between text-xs ${
                      dieComplexity === item.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">{item.speed}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Metraje Lineal de Flejes de Corte
                </label>
                <p className="text-[11px] text-slate-400">
                  Suma perimetral de flejes de acero en la madera láser del troquel.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Metros de Fleje (m)</label>
                  <input
                    type="number"
                    step="1"
                    min="2"
                    value={dieLinearMeters}
                    onChange={(e) =>
                      updateProcessParams('proc_die_cutting', 'dieCuttingLinearMetersRules', Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-amber-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Costo / Metro de Fleje</label>
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-slate-400 font-mono">{currency.symbol}</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={dieCostPerMeter}
                      onChange={(e) =>
                        updateProcessParams('proc_die_cutting', 'dieCuttingRuleCostPerMeter', Number(e.target.value))
                      }
                      className="w-full bg-transparent font-mono text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono block">
                  ⚙️ Matriz Láser y Tiro Estimado
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Velocidad de tiro: {dieSpeed.toLocaleString()} golpes/h. Tiempo: {dieHours} h.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Matriz Troquel</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {currency.symbol}{dieEstimatedClicheSetup}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo / Golpe</span>
                  <span className="text-sm font-mono font-bold text-slate-100">
                    {currency.symbol}{dieCostPerSheet.toFixed(3)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  applyCalculatedCost(
                    'proc_die_cutting',
                    dieCostPerSheet,
                    dieEstimatedClicheSetup,
                    'per_sheet',
                    `¡Troquelado calibrado: Matriz ${currency.symbol}${dieEstimatedClicheSetup} y golpe ${currency.symbol}${dieCostPerSheet.toFixed(3)}!`
                  )
                }
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar a Troquelado</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 2: MARCADO Y HENDIDO (Creasing) & ÁBACO CITO ONLINE           */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_creasing' && (
          <div className="flex flex-col gap-4">
            {/* Banner destacado: Panel de Troqueles & Contrahendidos CITO */}
            <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-orange-950/40 p-4 rounded-xl border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <FoldHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                      Cálculo Automático de Contrahendidos y Matrices CITO
                    </h4>
                    {dieAndCreasingConfig ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        Matriz CITO: {dieAndCreasingConfig.citoMatrixCode} ({dieAndCreasingConfig.caliperMm} mm)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        Ábaco CITO Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Vincula el sustrato seleccionado ({paperType || 'Cartón folding'}, {grammageGsm || 300} gsm) con el perfil CITO ideal (h × w), compensación y flejes de hendido.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDiePanelOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shrink-0 shadow-md active:scale-95 transition-all"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Abrir Panel de Troqueles & Contrahendidos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Col 1: Calibre del Sustrato (mm / Micras) */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Calibre del Sustrato (mm / Micras)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    El espesor del cartón determina la profundidad y el ancho del contrahendido según la norma técnica CITO.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400">Espesor del Cartón:</span>
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {creasingThicknessMm.toFixed(2)} mm ({creasingSubstrateMicrons} µm)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="1.20"
                      step="0.01"
                      value={creasingThicknessMm}
                      onChange={(e) => {
                        const mm = Number(e.target.value);
                        updateProcessParams('proc_creasing', 'creasingSubstrateThicknessMm', mm);
                        updateProcessParams('proc_creasing', 'creasingSubstrateMicrons', Math.round(mm * 1000));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Direct Number Inputs: mm and µm */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Espesor en mm</label>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.10"
                          max="2.00"
                          value={creasingThicknessMm}
                          onChange={(e) => {
                            const mm = Number(e.target.value);
                            updateProcessParams('proc_creasing', 'creasingSubstrateThicknessMm', mm);
                            updateProcessParams('proc_creasing', 'creasingSubstrateMicrons', Math.round(mm * 1000));
                          }}
                          className="w-full bg-transparent font-mono text-xs text-amber-300 font-bold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Espesor en micras</label>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="10"
                          min="100"
                          max="2000"
                          value={creasingSubstrateMicrons}
                          onChange={(e) => {
                            const um = Number(e.target.value);
                            const mm = Number((um / 1000).toFixed(2));
                            updateProcessParams('proc_creasing', 'creasingSubstrateMicrons', um);
                            updateProcessParams('proc_creasing', 'creasingSubstrateThicknessMm', mm);
                          }}
                          className="w-full bg-transparent font-mono text-xs text-slate-200 font-bold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">µm</span>
                      </div>
                    </div>
                  </div>

                  {/* Common Presets */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1">
                    {[
                      { mm: 0.30, label: '0.30 mm', note: '300 µm' },
                      { mm: 0.40, label: '0.40 mm', note: '400 µm' },
                      { mm: 0.50, label: '0.50 mm', note: '500 µm' },
                      { mm: 0.70, label: '0.70 mm', note: '700 µm' },
                    ].map((preset) => (
                      <button
                        key={preset.mm}
                        type="button"
                        onClick={() => {
                          updateProcessParams('proc_creasing', 'creasingSubstrateThicknessMm', preset.mm);
                          updateProcessParams('proc_creasing', 'creasingSubstrateMicrons', Math.round(preset.mm * 1000));
                        }}
                        className={`p-1 rounded border transition-all ${
                          Math.abs(creasingThicknessMm - preset.mm) < 0.005
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={`${preset.note}`}
                      >
                        <div>{preset.label}</div>
                        <div className="text-[9px] text-slate-500">{preset.note}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 2: Tipo de Contrahendido Recomendado (Ábaco CITO Online) */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/40 flex flex-col justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                      <span>🎯 Contrahendido CITO Recomendado</span>
                    </span>
                    <a
                      href={CITO_ABACO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-400 hover:text-amber-200 flex items-center gap-1 underline font-mono"
                      title="Ver Ábaco Online CITO para cartón compacto"
                    >
                      <span>Ábaco CITO</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Ej: Para cartón de <strong>{creasingThicknessMm.toFixed(2)} mm</strong> de espesor corresponde contrahendido de:
                  </p>
                </div>

                {/* Highlight Matrix Badge */}
                <div className="bg-slate-950/90 border border-amber-500/50 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    Profundidad (h) × Ancho (w)
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-400 flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                      style={{ backgroundColor: citoRec.colorHex }}
                      title={`Código de color CITO: ${citoRec.colorName}`}
                    />
                    <span>{citoRec.matrixCode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                      {citoRec.colorName}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">Fleje: {citoRec.ruleThicknessPt} pt ({citoRec.ruleThicknessMm} mm)</span>
                  </div>
                </div>

                {/* Technical breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Profundidad (h):</span>
                    <span className="text-slate-100 font-bold">{citoRec.depthMm.toFixed(2)} mm</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Ancho canal (w):</span>
                    <span className="text-amber-300 font-bold">{citoRec.widthMm.toFixed(1)} mm</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Serie recomendada:</span>
                  <span className="text-slate-200 font-bold">CITO PRO / CITO DYNAMIC</span>
                </div>
              </div>

              {/* Col 3: Tipo de Matriz & Regla de Cálculo */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Tipo de Matriz y Regla Técnica
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Fórmula CITO: w = (1.5 × Espesor {creasingThicknessMm.toFixed(2)}) + Fleje ({citoRec.ruleThicknessMm} mm)
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Soporte de Hendido</label>
                    <select
                      value={params.creasingMatrixType || 'cito'}
                      onChange={(e) => updateProcessParams('proc_creasing', 'creasingMatrixType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-200 outline-none"
                    >
                      <option value="cito">Contrahendido CITO con base localizadora plástica (Estándar)</option>
                      <option value="pertinax">Pertinax Fresado CNC (Alta durabilidad y registro exacto)</option>
                      <option value="plastic_channel">Canaletas Plásticas Adhesivas convencionales</option>
                    </select>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Ancho Teórico:</span>
                      <span className="text-amber-400 font-bold">{recommendedCreaseWidthMm} mm</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Canal Comercial CITO:</span>
                      <span className="text-emerald-400 font-bold">{citoRec.matrixCode}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateProcessParams('proc_creasing', 'creasingCitoMatrixCode', citoRec.matrixCode);
                    updateProcessParams('proc_creasing', 'creasingRuleThicknessPt', citoRec.ruleThicknessPt);
                    applyCalculatedCost(
                      'proc_creasing',
                      0.02,
                      15,
                      'per_sheet',
                      `¡Contrahendido CITO ${citoRec.matrixCode} (para cartón ${creasingThicknessMm.toFixed(2)} mm) calibrado y guardado!`
                    );
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Aplicar Contrahendido ({citoRec.matrixCode})</span>
                </button>
              </div>
            </div>

            {/* Quick Reference Table: CITO Ábaco Compact Carton Catalog */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    Tabla de Correspondencia Ábaco CITO (Cartón Compacto / Folding)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Haz clic en un calibre para seleccionarlo instantáneamente:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 font-mono text-[11px]">
                {CITO_STANDARD_MATRIX_TABLE.map((row) => {
                  const isCurrentMatch =
                    creasingThicknessMm >= row.minMm && creasingThicknessMm <= row.maxMm;
                  return (
                    <button
                      key={row.matrixCode}
                      type="button"
                      onClick={() => {
                        const midMm = (row.minMm + row.maxMm) / 2;
                        const targetMm = Number(row.thicknessDisplay.split(' ')[0]) || midMm;
                        updateProcessParams('proc_creasing', 'creasingSubstrateThicknessMm', targetMm);
                        updateProcessParams('proc_creasing', 'creasingSubstrateMicrons', Math.round(targetMm * 1000));
                        updateProcessParams('proc_creasing', 'creasingCitoMatrixCode', row.matrixCode);
                      }}
                      className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        isCurrentMatch
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{row.thicknessDisplay}</span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: row.colorHex }}
                          title={row.colorName}
                        />
                      </div>
                      <div className="font-bold text-slate-100 mt-1 text-xs">
                        {row.matrixCode}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5">
                        Fleje {row.rulePt} pt
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 3: PEGADO Y FORMADO (Folding-Gluing)                          */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_folding_gluing' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Estructura y Puntos de Pegado
                </label>
                <p className="text-[11px] text-slate-400">
                  El tipo de fondo y solapas determina la velocidad de alimentación de la pegadora.
                </p>
              </div>

              <select
                value={boxType}
                onChange={(e) => updateProcessParams('proc_folding_gluing', 'foldingGluingBoxType', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-200"
              >
                <option value="straight_line">Estuche Lineal Solapa Lateral (32.000 u/h)</option>
                <option value="crash_lock_bottom">Fondo Automático Crash Lock 3 Puntos (18.000 u/h)</option>
                <option value="4_corner">Caja Bandeja 4 Esquinas (12.000 u/h)</option>
              </select>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Consumo de Cola PVA / Hot-Melt
                </label>
                <p className="text-[11px] text-slate-400">
                  Gramos de adhesivo por cada 1.000 estuches armados.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">g / 1000 cajas</label>
                  <input
                    type="number"
                    step="0.5"
                    value={glueGramsPer1000}
                    onChange={(e) =>
                      updateProcessParams('proc_folding_gluing', 'foldingGluingGlueGramsPer1000', Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Precio Cola ($/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={glueKgPrice}
                    onChange={(e) =>
                      updateProcessParams('proc_folding_gluing', 'foldingGluingGlueKgPrice', Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono block">
                  📦 Rendimiento de Pegadora
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Velocidad: {gluerSpeed.toLocaleString()} u/h • Horas de corrida: {gluerHours} h
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Cola Total</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{totalGlueKg.toFixed(2)} kg</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo Adhesivo</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{currency.symbol}{totalGlueCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  applyCalculatedCost(
                    'proc_folding_gluing',
                    0.018,
                    25,
                    'per_unit',
                    '¡Velocidad y adhesivo de pegado configurados!'
                  )
                }
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar a Pegado</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 4: HOT STAMPING & FOIL                                        */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_hot_cold_foil' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Área de Estampado por Estuche (cm²)
                </label>
                <p className="text-[11px] text-slate-400">
                  Superficie del detalle metálico transferido por presión y calor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={foilAreaCm2}
                  onChange={(e) =>
                    updateProcessParams('proc_hot_cold_foil', 'foilStampedAreaCm2', Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-amber-300 font-bold"
                />
                <span className="text-xs text-slate-400 font-mono">cm²</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Tipo de Foil y Costo por m²
                </label>
                <p className="text-[11px] text-slate-400">
                  Película metalizada con desprendimiento térmico o adhesivo cold foil.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tono / Efecto</label>
                  <select
                    value={params.foilType || 'gold'}
                    onChange={(e) => updateProcessParams('proc_hot_cold_foil', 'foilType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                  >
                    <option value="gold">Oro Brillo</option>
                    <option value="silver">Plata Espejo</option>
                    <option value="holographic">Holográfico</option>
                    <option value="copper">Cobre / Rose Gold</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Costo ($/m²)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={foilCostM2}
                    onChange={(e) =>
                      updateProcessParams('proc_hot_cold_foil', 'foilCostPerM2', Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono block">
                  ✨ Consumo Total de Foil
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Superficie calculada: {foilTotalM2} m² de film metalizado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo / Estuche</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{currency.symbol}{foilCostPerUnit.toFixed(4)}</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Foil Total</span>
                  <span className="text-sm font-mono font-bold text-slate-100">{currency.symbol}{totalFoilCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  applyCalculatedCost(
                    'proc_hot_cold_foil',
                    foilCostPerUnit > 0 ? foilCostPerUnit : 0.045,
                    45,
                    'per_unit',
                    '¡Costo de Foil metalizado calibrado y aplicado!'
                  )
                }
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar a Hot Stamping</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 7: REPUJADO / EMBOSSING                                       */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_embossing_debossing' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-200 block">Profundidad del Relieve (µm)</label>
              <input
                type="range"
                min="80"
                max="400"
                step="20"
                value={embossDepth}
                onChange={(e) => updateProcessParams('proc_embossing_debossing', 'embossingDepthMicrons', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-xs font-mono font-bold text-amber-400">{embossDepth} micras (0.{embossDepth} mm)</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-200 block">Material del Cuño de Grabado</label>
              <select
                value={embossMaterial}
                onChange={(e) => updateProcessParams('proc_embossing_debossing', 'embossingDieMaterial', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-200"
              >
                <option value="magnesium">Magnesio Grabado Químico (Tiradas cortas y medias)</option>
                <option value="brass_cnc">Latón Grabado CNC 3D (Alta definición y multinivel)</option>
              </select>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-mono font-bold text-amber-300">Cuño y Matriz de Resina Epóxica</span>
              <button
                type="button"
                onClick={() => applyCalculatedCost('proc_embossing_debossing', 0.03, 40, 'per_sheet', '¡Parámetros de relieve aplicados!')}
                className="w-full py-2 rounded-lg bg-amber-500 font-bold text-xs text-slate-950"
              >
                Guardar Parámetros Relieve
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 8: VENTANAS DE ACETATO (Window Patching)                      */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_window_patching' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <label className="font-bold text-slate-200 block">Medidas de Ventana (mm)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Ancho</span>
                  <input
                    type="number"
                    value={winWidth}
                    onChange={(e) => updateProcessParams('proc_window_patching', 'windowWidthMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Alto</span>
                  <input
                    type="number"
                    value={winHeight}
                    onChange={(e) => updateProcessParams('proc_window_patching', 'windowHeightMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <label className="font-bold text-slate-200 block">Solape Perimetral y Espesor</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Solape cola</span>
                  <input
                    type="number"
                    value={winOverlap}
                    onChange={(e) => updateProcessParams('proc_window_patching', 'windowGlueOverlapMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">PET Espesor</span>
                  <span className="block pt-1 font-mono text-slate-300">180 µm</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-300">Film PET Requerido: {winPetKg} kg</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Superficie total parche: {winTotalM2} m²</span>
              </div>
              <button
                type="button"
                onClick={() => applyCalculatedCost('proc_window_patching', 0.04, 30, 'per_unit', '¡Ventanas de acetato configuradas!')}
                className="w-full py-2 rounded-lg bg-amber-500 font-bold text-xs text-slate-950"
              >
                Aplicar Ventana PET
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 9: INSPECCIÓN VISIÓN (Vision Inspection)                      */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_vision_inspection' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-200 block">Sensibilidad Óptica (mm)</label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={visionSensMm}
                onChange={(e) => updateProcessParams('proc_vision_inspection', 'visionMinDefectSizeMm', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-xs font-mono font-bold text-amber-400">Detección de defectos &gt; {visionSensMm} mm</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-200 block">Tasa de Rechazo Estimada</label>
              <span className="text-base font-mono font-bold text-purple-400">{visionRejectionPct}% merma detectada</span>
              <p className="text-[11px] text-slate-400">Verificación 100% de OCR, código de barras y desprendimientos.</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-mono font-bold text-amber-300">Cámara Lineal BST / EyeC</span>
              <button
                type="button"
                onClick={() => applyCalculatedCost('proc_vision_inspection', 0.005, 15, 'per_unit', '¡Inspección óptica configurada!')}
                className="w-full py-2 rounded-lg bg-amber-500 font-bold text-xs text-slate-950"
              >
                Guardar Inspección 100%
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* CASE 10: FAJADO Y EMBALAJE (Bundling / Shrink Wrapping)            */}
        {/* ------------------------------------------------------------------ */}
        {selectedProcessId === 'proc_bundling_packaging' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-200 block">Estuches por Paquete Fajado</label>
              <div className="grid grid-cols-3 gap-1 font-mono text-xs">
                {[25, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateProcessParams('proc_bundling_packaging', 'bundleUnitsPerPack', num)}
                    className={`p-1.5 rounded border ${bundleUnits === num ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {num} u
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
              <label className="font-bold text-slate-200 block">Cajas Máster Corrugadas</label>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total paquetes:</span>
                <span className="font-mono font-bold text-slate-200">{totalPacks} paquetes</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Cajas requeridas:</span>
                <span className="font-mono font-bold text-amber-400">{totalMasterBoxes} cajas</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-mono font-bold text-amber-300">Fajado Automático con Kraft</span>
              <button
                type="button"
                onClick={() => applyCalculatedCost('proc_bundling_packaging', 0.008, 15, 'per_unit', '¡Fajado y embalaje configurados!')}
                className="w-full py-2 rounded-lg bg-amber-500 font-bold text-xs text-slate-950"
              >
                Aplicar Embalaje Máster
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel Lateral Especializado de Troqueles y Contrahendidos CITO */}
      <DieAndCreasingSidePanel
        isOpen={isDiePanelOpen}
        onClose={() => setIsDiePanelOpen(false)}
        currentPaperType={paperType || 'Cartón Folding GC1'}
        currentGrammageGsm={grammageGsm || 300}
        onChangePaperType={onChangePaperType}
        activePosesCount={activePosesCount || 1}
        pieceWidthMm={pieceWidthMm || 150}
        pieceHeightMm={pieceHeightMm || 210}
        sheetWidthMm={sheetWidthMm}
        sheetHeightMm={sheetHeightMm}
        activeConfig={dieAndCreasingConfig}
        onApplyConfig={handleApplyDieConfigFromPanel}
        currencySymbol={currency.symbol}
      />
    </div>
  );
};

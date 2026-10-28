import React, { useState } from 'react';
import { CurrencyConfig, OffsetJobParams, FlexoJobParams } from '../types/graphic';
import {
  Calculator,
  Disc,
  Palette,
  Layers,
  ArrowRight,
  Scissors,
  FoldHorizontal,
  Box,
  Sparkles,
  Sun,
  Maximize2,
  SquareCode,
  ShieldCheck,
  PackageCheck,
  CheckCircle,
  Wrench,
  BookOpen,
  Settings,
  Sparkle,
  ExternalLink,
  Clock,
  Timer,
  Check,
  Copy,
  RotateCcw,
  TrendingUp,
  Droplets,
  Zap,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { RollSlittingVisualizer } from './RollSlittingVisualizer';
import {
  POST_PRESS_PROCESSES_CATALOG,
  POST_PRESS_CATEGORIES,
  PostPressProcessDefinition,
  getCitoMatrixRecommendation,
  CITO_ABACO_URL,
  CITO_STANDARD_MATRIX_TABLE,
} from '../utils/postPressProcesses';

interface WorkshopToolsProps {
  currency: CurrencyConfig;
  technology?: 'offset' | 'flexo';
  offsetParams?: OffsetJobParams;
  flexoParams?: FlexoJobParams;
  onChangeOffset?: (params: OffsetJobParams) => void;
  onChangeFlexo?: (params: FlexoJobParams) => void;
}

export const WorkshopTools: React.FC<WorkshopToolsProps> = ({
  currency,
  technology,
  offsetParams,
  flexoParams,
  onChangeOffset,
  onChangeFlexo,
}) => {
  // 1. Roll Diameter / Length Calculator
  const [rollWidthMm, setRollWidthMm] = useState(330);
  const [substrateThicknessMicrons, setSubstrateThicknessMicrons] = useState(50); // e.g. 50 microns
  const [coreDiameterInches, setCoreDiameterInches] = useState(3); // 3" = 76.2mm
  const [knownLinearMeters, setKnownLinearMeters] = useState(2000);
  const [knownOuterDiameterMm, setKnownOuterDiameterMm] = useState(300);

  // 2. Ink Quick Estimator
  const [inkTech, setInkTech] = useState<'offset' | 'flexo'>('flexo');
  const [customBaseRate, setCustomBaseRate] = useState(2.0);
  const [sheetOrWebAreaM2, setSheetOrWebAreaM2] = useState(1000);
  const [coverageSum, setCoverageSum] = useState(120); // e.g. 120% total ink sum
  const [inkKgPrice, setInkKgPrice] = useState(18);

  // 3. Roll Area & Weight Converter
  const [rollCalcWidthMm, setRollCalcWidthMm] = useState(330);
  const [rollCalcLinearMeters, setRollCalcLinearMeters] = useState(2500);
  const [rollCalcGsm, setRollCalcGsm] = useState(165);

  // 4. Calculador de Tiempos Muertos y Puesta a Punto de Máquina
  const [dtTech, setDtTech] = useState<'flexo' | 'offset'>('flexo');

  // Preparación de Tintas
  const [inkStationCount, setInkStationCount] = useState<number>(dtTech === 'flexo' ? 6 : 4);
  const [inkMinutesPerStation, setInkMinutesPerStation] = useState<number>(8); // min por estación
  const [inkFormulationMinutes, setInkFormulationMinutes] = useState<number>(10); // min mezcla formulación/pantones
  const [inkPrepManual, setInkPrepManual] = useState<boolean>(false);
  const [inkPrepDirectMinutes, setInkPrepDirectMinutes] = useState<number>(58);

  // Cambio de Clichés / Planchas
  const [clichesCount, setClichesCount] = useState<number>(dtTech === 'flexo' ? 6 : 4);
  const [minutesPerCliche, setMinutesPerCliche] = useState<number>(dtTech === 'flexo' ? 7 : 4); // min por cliché o plancha CTP
  const [clicheMountManual, setClicheMountManual] = useState<boolean>(false);
  const [clicheDirectMinutes, setClicheDirectMinutes] = useState<number>(42);

  // Lavado y Limpieza
  const [washupMode, setWashupMode] = useState<'preset' | 'per_station' | 'manual'>('preset');
  const [washupPreset, setWashupPreset] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [washupStationsCount, setWashupStationsCount] = useState<number>(dtTech === 'flexo' ? 6 : 4);
  const [washupMinutesPerStation, setWashupMinutesPerStation] = useState<number>(5);
  const [washupDirectMinutes, setWashupDirectMinutes] = useState<number>(25);

  // Tiempos Adicionales de Calce y Operación
  const [regMinutes, setRegMinutes] = useState<number>(12); // Ajuste fino de registro y tiro
  const [diePrepMinutes, setDiePrepMinutes] = useState<number>(8); // Calibración de troquel / accesorios

  // Tarifa Horaria de Máquina
  const initialHourlyRate = dtTech === 'flexo'
    ? (flexoParams?.machineHourlyRate || 55)
    : (offsetParams?.machineHourlyRate || 65);
  const [dtHourlyRate, setDtHourlyRate] = useState<number>(initialHourlyRate);

  // Feedback states
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // 5. Post-Press Finishing Interactive Guide
  const [selectedProcessId, setSelectedProcessId] = useState<string>('proc_die_cutting');
  const [guideCategory, setGuideCategory] = useState<string>('all');
  const [simSheets, setSimSheets] = useState<number>(3000);
  const [simUnits, setSimUnits] = useState<number>(10000);
  const [simM2, setSimM2] = useState<number>(1500);
  const [creasingSimThicknessMm, setCreasingSimThicknessMm] = useState<number>(0.40);

  // Helper icon renderer
  const renderProcIcon = (iconName: string, isCurrent: boolean) => {
    const cls = `w-4 h-4 ${isCurrent ? 'text-amber-300' : 'text-slate-400'}`;
    switch (iconName) {
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

  const currentProcess =
    POST_PRESS_PROCESSES_CATALOG.find((p) => p.id === selectedProcessId) ||
    POST_PRESS_PROCESSES_CATALOG[0];

  const citoRecommendation = getCitoMatrixRecommendation(creasingSimThicknessMm);

  // Calculations for Roll Tool:
  // OD = sqrt( (4 * L * t)/pi + ID^2 )
  const coreMm = coreDiameterInches * 25.4;
  const thicknessMm = substrateThicknessMicrons / 1000;
  const calculatedOuterDiameter = Math.round(
    Math.sqrt((4 * (knownLinearMeters * 1000) * thicknessMm) / Math.PI + coreMm * coreMm)
  );

  // Reverse: Length given OD = pi * (OD^2 - ID^2) / (4 * t)
  const calculatedLinearMeters = Math.round(
    (Math.PI * (knownOuterDiameterMm * knownOuterDiameterMm - coreMm * coreMm)) /
      (4 * thicknessMm * 1000)
  );

  // Ink Quick Calc:
  const inkKg = Number(
    ((sheetOrWebAreaM2 * customBaseRate * (coverageSum / 100) * 1.08) / 1000).toFixed(2)
  );
  const inkCost = Number((inkKg * inkKgPrice).toFixed(2));

  // Roll Area & Weight Quick Calc:
  const totalRollM2 = Number(((rollCalcWidthMm / 1000) * rollCalcLinearMeters).toFixed(1));
  const totalRollWeightKg = Number(((totalRollM2 * rollCalcGsm) / 1000).toFixed(1));

  // Cálculos del Calculador de Tiempos Muertos y Puesta a Punto
  const totalInkMin = inkPrepManual
    ? Math.max(0, inkPrepDirectMinutes)
    : Math.max(0, inkStationCount * inkMinutesPerStation + inkFormulationMinutes);

  const totalClicheMin = clicheMountManual
    ? Math.max(0, clicheDirectMinutes)
    : Math.max(0, clichesCount * minutesPerCliche);

  const totalWashupMin = washupMode === 'manual'
    ? Math.max(0, washupDirectMinutes)
    : washupMode === 'preset'
      ? (washupPreset === 'quick' ? 15 : washupPreset === 'standard' ? 25 : 45)
      : Math.max(0, washupStationsCount * washupMinutesPerStation);

  const totalOtherMin = Math.max(0, regMinutes + diePrepMinutes);

  const totalDowntimeMin = Math.max(1, totalInkMin + totalClicheMin + totalWashupMin + totalOtherMin);
  const downtimeHours = Math.floor(totalDowntimeMin / 60);
  const downtimeMins = totalDowntimeMin % 60;
  const totalHoursDecimal = Number((totalDowntimeMin / 60).toFixed(2));
  const downtimeCost = Number((totalHoursDecimal * dtHourlyRate).toFixed(2));

  // Porcentajes para barra visual de distribución
  const inkPct = Math.round((totalInkMin / totalDowntimeMin) * 100);
  const clichePct = Math.round((totalClicheMin / totalDowntimeMin) * 100);
  const washupPct = Math.round((totalWashupMin / totalDowntimeMin) * 100);
  const otherPct = Math.max(0, 100 - inkPct - clichePct - washupPct);

  const applyDowntimePreset = (
    tech: 'flexo' | 'offset',
    inks: number,
    inkMinPer: number,
    inkForm: number,
    cliches: number,
    clicheMinPer: number,
    washMode: 'preset' | 'per_station',
    washPres: 'quick' | 'standard' | 'deep',
    reg: number,
    die: number,
    rate?: number
  ) => {
    setDtTech(tech);
    setInkPrepManual(false);
    setClicheMountManual(false);
    setInkStationCount(inks);
    setInkMinutesPerStation(inkMinPer);
    setInkFormulationMinutes(inkForm);
    setClichesCount(cliches);
    setMinutesPerCliche(clicheMinPer);
    setWashupMode(washMode);
    setWashupPreset(washPres);
    setRegMinutes(reg);
    setDiePrepMinutes(die);
    if (rate !== undefined) setDtHourlyRate(rate);
  };

  const handleApplyToActiveQuote = () => {
    if (dtTech === 'flexo' && onChangeFlexo && flexoParams) {
      onChangeFlexo({
        ...flexoParams,
        machineSetupMinutes: totalDowntimeMin,
      });
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    } else if (dtTech === 'offset' && onChangeOffset && offsetParams) {
      onChangeOffset({
        ...offsetParams,
        machineSetupMinutes: totalDowntimeMin,
      });
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    }
  };

  const handleCopySummary = () => {
    const techName = dtTech === 'flexo' ? 'Flexografía (Banda Angosta / Tambor)' : 'Offset (Prensas de Pliego)';
    const text = `=== REPORTE DE TIEMPOS MUERTOS & PUESTA A PUNTO ===
Tecnología: ${techName}
--------------------------------------------------
1. Preparación de Tintas: ${totalInkMin} min (${inkPct}%)
   - Cuerpos/colores a entintar: ${inkStationCount} (${inkMinutesPerStation} min/cuerpo)
   - Formulación especial / Pantones: ${inkFormulationMinutes} min
2. Cambio y Montaje de Clichés/Planchas: ${totalClicheMin} min (${clichePct}%)
   - Cantidad de unidades: ${clichesCount} (${minutesPerCliche} min/unidad)
3. Lavado y Limpieza de Máquina: ${totalWashupMin} min (${washupPct}%)
   - Tipo: ${washupMode === 'preset' ? `Preset ${washupPreset === 'quick' ? 'Rápido (15m)' : washupPreset === 'standard' ? 'Estándar (25m)' : 'Profundo (45m)'}` : `${washupStationsCount} cuerpos (${washupMinutesPerStation} min/cuerpo)`}
4. Calibración de Registro, Tiro y Troquel: ${totalOtherMin} min (${otherPct}%)
   - Registro y tiro: ${regMinutes} min
   - Troquel / accesorios: ${diePrepMinutes} min
--------------------------------------------------
TIEMPO TOTAL DE PREPARACIÓN: ${totalDowntimeMin} min (${downtimeHours}h ${downtimeMins}min)
Tarifa Horaria Máquina: ${currency.symbol}${dtHourlyRate}/h
COSTO ESTIMADO TIEMPO MUERTO: ${currency.symbol}${downtimeCost}
==================================================`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tool 1: Calculador de Bobinas / Metraje & Diámetro */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Calculador de Bobinas Flexo
              </h3>
              <p className="text-[11px] text-slate-400">
                Relación física entre diámetro exterior y metraje lineal.
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Espesor del Sustrato (micras)
              </label>
              <input
                type="number"
                value={substrateThicknessMicrons}
                onChange={(e) => setSubstrateThicknessMicrons(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                Mandril / Core Interior
              </label>
              <select
                value={coreDiameterInches}
                onChange={(e) => setCoreDiameterInches(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 outline-none"
              >
                <option value={1}>1" (25.4 mm)</option>
                <option value={1.5}>1.5" (38.1 mm)</option>
                <option value={3}>3" (76.2 mm)</option>
              </select>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block mb-1 text-[11px]">
                Si conozco la Longitud:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={knownLinearMeters}
                  onChange={(e) => setKnownLinearMeters(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-amber-300"
                />
                <span className="text-slate-400 text-xs">ml</span>
              </div>
              <div className="mt-2 text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Diámetro Exterior Estimado</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  Ø {calculatedOuterDiameter} mm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool 2: Calculador Rápido de Tinta por m² */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Consumo Rápido de Tinta
              </h3>
              <p className="text-[11px] text-slate-400">
                Offset (1.2 g/m²) y Flexo (2.0 g/m²) según cobertura.
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setInkTech('offset');
                  setCustomBaseRate(1.2);
                }}
                className={`py-1.5 rounded-lg border font-semibold text-xs ${
                  inkTech === 'offset'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Offset (1.2 g/m²)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInkTech('flexo');
                  setCustomBaseRate(2.0);
                }}
                className={`py-1.5 rounded-lg border font-semibold text-xs ${
                  inkTech === 'flexo'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Flexo (2.0 g/m²)
              </button>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                Superficie Total a Imprimir (m²)
              </label>
              <input
                type="number"
                value={sheetOrWebAreaM2}
                onChange={(e) => setSheetOrWebAreaM2(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                Suma Cobertura de Tintas (%)
              </label>
              <input
                type="number"
                value={coverageSum}
                onChange={(e) => setCoverageSum(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 outline-none"
                placeholder="Ej. 120% (C20+M30+Y30+K40)"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Kilos de Tinta</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {inkKg} kg
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Costo Estimado</span>
                <span className="text-base font-mono font-bold text-slate-100">
                  {currency.symbol}{inkCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool 3: Calculador de Bobina: Peso, Superficie y Metraje */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Peso de Bobina & Superficie
              </h3>
              <p className="text-[11px] text-slate-400">
                Cálculo de m² totales y peso neto del rollo para transporte.
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Ancho de Bobina (mm)</label>
              <input
                type="number"
                value={rollCalcWidthMm}
                onChange={(e) => setRollCalcWidthMm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Metros Lineales (ml)</label>
                <input
                  type="number"
                  value={rollCalcLinearMeters}
                  onChange={(e) => setRollCalcLinearMeters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Gramaje (g/m²)</label>
                <input
                  type="number"
                  value={rollCalcGsm}
                  onChange={(e) => setRollCalcGsm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-100"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Superficie Total</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {totalRollM2} m²
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Peso Neto Bobina</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {totalRollWeightKg} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Tool: Calculador de Tiempos Muertos de Máquina & Puesta a Punto (Setup) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col gap-6">
        {/* Header & Tech Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-md shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 font-sans">
                  Calculador de Tiempos Muertos y Puesta a Punto de Máquina (Setup)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Alistamiento & Paradas
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Calcula con precisión industrial el tiempo total de preparación desglosando la <strong>preparación de tintas</strong>, el <strong>cambio y montaje de clichés/planchas</strong>, y el <strong>lavado y limpieza</strong> de los cuerpos impresores.
              </p>
            </div>
          </div>

          {/* Technology Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setDtTech('flexo');
                setInkStationCount(6);
                setMinutesPerCliche(7);
                setDtHourlyRate(flexoParams?.machineHourlyRate || 55);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                dtTech === 'flexo'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏷️ Flexografía (Banda / Tambor)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDtTech('offset');
                setInkStationCount(4);
                setMinutesPerCliche(4);
                setDtHourlyRate(offsetParams?.machineHourlyRate || 65);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                dtTech === 'offset'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🖨️ Offset (Pliegos / CTP)</span>
            </button>
          </div>
        </div>

        {/* Quick Factory Presets Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Presets Rápidos de Preparación de Taller:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              (1 clic para cargar parámetros típicos)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyDowntimePreset('flexo', 4, 7, 5, 4, 6, 'preset', 'quick', 8, 5, 55)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 font-mono transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>⚡ Flexo 4C Rápido (85 min)</span>
            </button>

            <button
              type="button"
              onClick={() => applyDowntimePreset('flexo', 6, 8, 10, 6, 7, 'preset', 'standard', 12, 8, 55)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 font-mono transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>🏷️ Flexo 6C + Barniz (145 min)</span>
            </button>

            <button
              type="button"
              onClick={() => applyDowntimePreset('flexo', 8, 9, 15, 8, 8, 'preset', 'deep', 15, 15, 55)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 font-mono transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>🎨 Flexo 8C UV + Lavado Profundo (226 min)</span>
            </button>

            <button
              type="button"
              onClick={() => applyDowntimePreset('offset', 4, 6, 0, 4, 4, 'preset', 'quick', 10, 0, 65)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 font-mono transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>🖨️ Offset 4C CMYK Estándar (60 min)</span>
            </button>

            <button
              type="button"
              onClick={() => applyDowntimePreset('offset', 5, 8, 12, 5, 4, 'preset', 'standard', 12, 5, 65)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-300 font-mono transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>📦 Offset 5C + Pantones & Lavado (114 min)</span>
            </button>
          </div>
        </div>

        {/* 4 Technical Setup Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Preparación de Tintas */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">1. Preparación de Tintas</h4>
                    <span className="text-[10px] text-slate-400">Entintado y Viscosidad</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {totalInkMin} min
                </span>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Modo de cálculo:</span>
                <button
                  type="button"
                  onClick={() => setInkPrepManual(!inkPrepManual)}
                  className="text-emerald-400 hover:underline font-mono text-[10px]"
                >
                  {inkPrepManual ? 'Cambiar a detallado' : 'Entrada directa'}
                </button>
              </div>

              {!inkPrepManual ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                      <span>Cuerpos a entintar:</span>
                      <span className="font-mono text-emerald-400 font-bold">{inkStationCount} colores</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={inkStationCount}
                      onChange={(e) => setInkStationCount(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Tiempo por cuerpo / tintero (min):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={inkMinutesPerStation}
                      onChange={(e) => setInkMinutesPerStation(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Batido, viscosidad y Pantones (min):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={inkFormulationMinutes}
                      onChange={(e) => setInkFormulationMinutes(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 block text-[11px]">
                    Minutos directos de preparación:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={inkPrepDirectMinutes}
                    onChange={(e) => setInkPrepDirectMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-emerald-300 font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Ingreso manual de tiempo global de entintado.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 leading-tight">
              {dtTech === 'flexo'
                ? 'Llenado de cubetas, bombas peristálticas, cámaras cerradas y viscosidad Zahn #2.'
                : 'Puesta en tinta de batería de rodillos y regulación micrométrica de tinteros.'}
            </div>
          </div>

          {/* Pillar 2: Cambio y Montaje de Clichés / Planchas */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">
                      2. Cambio de {dtTech === 'flexo' ? 'Clichés' : 'Planchas CTP'}
                    </h4>
                    <span className="text-[10px] text-slate-400">Montaje y Centrado</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {totalClicheMin} min
                </span>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Modo de cálculo:</span>
                <button
                  type="button"
                  onClick={() => setClicheMountManual(!clicheMountManual)}
                  className="text-sky-400 hover:underline font-mono text-[10px]"
                >
                  {clicheMountManual ? 'Cambiar a detallado' : 'Entrada directa'}
                </button>
              </div>

              {!clicheMountManual ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                      <span>{dtTech === 'flexo' ? 'Clichés a montar:' : 'Planchas CTP:'}</span>
                      <span className="font-mono text-sky-400 font-bold">{clichesCount} unidades</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={clichesCount}
                      onChange={(e) => setClichesCount(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Tiempo por {dtTech === 'flexo' ? 'cliché' : 'plancha'} (min):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={minutesPerCliche}
                      onChange={(e) => setMinutesPerCliche(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Cálculo base:</span>
                      <span className="font-mono text-slate-200">
                        {clichesCount} × {minutesPerCliche} min
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sky-300">
                      <span>Subtotal montaje:</span>
                      <span className="font-mono">{totalClicheMin} min</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 block text-[11px]">
                    Minutos directos de montaje:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={clicheDirectMinutes}
                    onChange={(e) => setClicheDirectMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-sky-300 font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Tiempo global de montaje en montadora o cilindros.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 leading-tight">
              {dtTech === 'flexo'
                ? 'Despegado, limpieza de camisas, cinta cushion mount y alineación con cámaras HD.'
                : 'Sujeción en mordazas de cilindro, AutoPlate o carga manual con calas.'}
            </div>
          </div>

          {/* Pillar 3: Lavado y Limpieza de Máquina */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">3. Lavado y Limpieza</h4>
                    <span className="text-[10px] text-slate-400">Anilox, Baterías & Rasquetas</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {totalWashupMin} min
                </span>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setWashupMode('preset')}
                  className={`py-1 rounded text-[10px] font-bold border transition-all ${
                    washupMode === 'preset'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setWashupMode('per_station')}
                  className={`py-1 rounded text-[10px] font-bold border transition-all ${
                    washupMode === 'per_station'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Por Estación
                </button>
                <button
                  type="button"
                  onClick={() => setWashupMode('manual')}
                  className={`py-1 rounded text-[10px] font-bold border transition-all ${
                    washupMode === 'manual'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Directo
                </button>
              </div>

              {washupMode === 'preset' && (
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setWashupPreset('quick')}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      washupPreset === 'quick'
                        ? 'bg-amber-500/15 border-amber-400/80 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-[11px] block">Rápido / Mismo Tono</span>
                      <span className="text-[10px] text-slate-500">Entre tiradas similares</span>
                    </div>
                    <span className="font-mono font-bold text-xs">15 min</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWashupPreset('standard')}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      washupPreset === 'standard'
                        ? 'bg-amber-500/15 border-amber-400/80 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-[11px] block">Estándar / Cambio Color</span>
                      <span className="text-[10px] text-slate-500">Limpieza intermedia</span>
                    </div>
                    <span className="font-mono font-bold text-xs">25 min</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWashupPreset('deep')}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      washupPreset === 'deep'
                        ? 'bg-amber-500/15 border-amber-400/80 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-[11px] block">Profundo / Fin Jornada</span>
                      <span className="text-[10px] text-slate-500">Oscuro a blanco / cambio solvente</span>
                    </div>
                    <span className="font-mono font-bold text-xs">45 min</span>
                  </button>
                </div>
              )}

              {washupMode === 'per_station' && (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Estaciones a lavar:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={washupStationsCount}
                      onChange={(e) => setWashupStationsCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Minutos por estación (min):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={washupMinutesPerStation}
                      onChange={(e) => setWashupMinutesPerStation(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none"
                    />
                  </div>
                  <div className="text-right text-[11px] font-mono text-amber-300 font-bold">
                    Total: {washupStationsCount * washupMinutesPerStation} min
                  </div>
                </div>
              )}

              {washupMode === 'manual' && (
                <div className="space-y-2 text-xs">
                  <label className="text-slate-400 block text-[11px]">
                    Minutos directos de limpieza:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={washupDirectMinutes}
                    onChange={(e) => setWashupDirectMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-amber-300 font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Tiempo global de lavado manual de la máquina.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 leading-tight">
              {dtTech === 'flexo'
                ? 'Lavado de rodillos anilox con ultrasonido o solvente, cámaras doctor blade y rasquetas.'
                : 'Lavado automático de batería de cauchos, tinteros y cilindro de contrapresión.'}
            </div>
          </div>

          {/* Pillar 4: Calce, Registro y Troquel */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">4. Registro & Ajustes</h4>
                    <span className="text-[10px] text-slate-400">Calce Fino y Troquel</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {totalOtherMin} min
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">
                    Ajuste fino de registro y tiro (min):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={regMinutes}
                    onChange={(e) => setRegMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Sincronización de cruces y fotocélulas
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">
                    Calibración de troquel / estación (min):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={diePrepMinutes}
                    onChange={(e) => setDiePrepMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Troquel magnético, cuchillas o ranurador
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 leading-tight">
              Alineación de banda continua, tensión neumática y verificación de corte de primer pliego.
            </div>
          </div>
        </div>

        {/* Global Summary & Distribution Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-5 shadow-lg">
          {/* Main Key Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Time */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Tiempo Total de Preparación
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-extrabold text-amber-400">
                    {totalDowntimeMin} min
                  </span>
                  <span className="text-sm font-mono text-slate-400">
                    ({downtimeHours}h {downtimeMins}m)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                  Equivalente a {totalHoursDecimal} horas de máquina
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Downtime Cost */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Costo de Parada de Máquina
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {currency.symbol}{downtimeCost}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-slate-400">Tarifa:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">{currency.symbol}</span>
                    <input
                      type="number"
                      value={dtHourlyRate}
                      onChange={(e) => setDtHourlyRate(Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-slate-200 text-center"
                    />
                    <span className="text-[11px] text-slate-500">/h</span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Distribution Summary */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Carga de Trabajo por Fase
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">Tintas:</span>
                  <span className="font-bold text-slate-200">{inkPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-slate-400">Clichés:</span>
                  <span className="font-bold text-slate-200">{clichePct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-400">Lavado:</span>
                  <span className="font-bold text-slate-200">{washupPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-slate-400">Ajustes:</span>
                  <span className="font-bold text-slate-200">{otherPct}%</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                4 fases operacionales cuantificadas
              </span>
            </div>
          </div>

          {/* Visual Multi-Color Time Distribution Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Distribución Gráfica del Tiempo de Puesta a Punto:</span>
              <span>100% = {totalDowntimeMin} min</span>
            </div>

            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
              <div
                style={{ width: `${inkPct}%` }}
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                title={`Tintas: ${totalInkMin} min (${inkPct}%)`}
              />
              <div
                style={{ width: `${clichePct}%` }}
                className="h-full bg-sky-500 transition-all duration-300"
                title={`Clichés: ${totalClicheMin} min (${clichePct}%)`}
              />
              <div
                style={{ width: `${washupPct}%` }}
                className="h-full bg-amber-500 transition-all duration-300"
                title={`Lavado: ${totalWashupMin} min (${washupPct}%)`}
              />
              <div
                style={{ width: `${otherPct}%` }}
                className="h-full bg-purple-500 rounded-r-full transition-all duration-300"
                title={`Ajustes: ${totalOtherMin} min (${otherPct}%)`}
              />
            </div>

            {/* Detailed Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono pt-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>1. Tintas: <strong>{totalInkMin} min</strong> ({inkPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                <span>2. Clichés/Planchas: <strong>{totalClicheMin} min</strong> ({clichePct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>3. Lavado: <strong>{totalWashupMin} min</strong> ({washupPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span>4. Registro & Troquel: <strong>{totalOtherMin} min</strong> ({otherPct}%)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Integration */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {((dtTech === 'flexo' && onChangeFlexo && flexoParams) ||
                (dtTech === 'offset' && onChangeOffset && offsetParams)) ? (
                <button
                  type="button"
                  onClick={handleApplyToActiveQuote}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>
                    ⚡ Aplicar {totalDowntimeMin} min a la Cotización ({dtTech === 'flexo' ? 'Flexo' : 'Offset'})
                  </span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copiar Reporte para Taller</span>
                  </>
                )}
              </button>
            </div>

            {/* Notifications */}
            {appliedSuccess && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  ¡Puesta a punto de {totalDowntimeMin} min transferida con éxito al presupuesto activo!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool 4: Esquema Técnico de Corte de Bobina (Planilla Rebobinadora / Slitter) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <h3 className="text-base font-bold text-slate-100 font-sans">
            Herramienta Avanzada: Esquema y Planilla de Corte de Bobina (Slitter)
          </h3>
        </div>
        <RollSlittingVisualizer
          initialMasterRollWidthMm={1000}
          initialCutWidthMm={140}
          initialMasterRollLengthM={1500}
          orderMl={5000}
          currency={currency}
        />
      </div>

      {/* Tool 5: Guía Técnica y Simulador: 4. Procesos de Acabado y Terminación Post-Prensa */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  5. Manual Técnico: 4. Procesos de Acabado y Terminación Post-Prensa
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  10 Procesos Industriales
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Parámetros de maquinaria, utillaje de troqueles, controles de calidad y simulación de costos en taller.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-3">
          {POST_PRESS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setGuideCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                guideCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 10 Process Quick Buttons / Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {POST_PRESS_PROCESSES_CATALOG.filter(
            (p) => guideCategory === 'all' || p.category === guideCategory
          ).map((proc) => {
            const isSelected = selectedProcessId === proc.id;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => setSelectedProcessId(proc.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400/80 text-amber-200 shadow-md ring-1 ring-amber-400/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    #{proc.number}
                  </span>
                  {renderProcIcon(proc.iconName, isSelected)}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight line-clamp-1">{proc.name}</h4>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5 font-mono">
                    {proc.englishName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Process Deep Dive Card */}
        {currentProcess && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 shadow-lg">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  {renderProcIcon(currentProcess.iconName, true)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Proceso #{currentProcess.number}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">
                      {currentProcess.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      ({currentProcess.englishName})
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400/90 font-mono font-medium block mt-1">
                    Distintivo: {currentProcess.badge}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-right self-start sm:self-auto">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo Referencial</span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {currency.symbol}{currentProcess.unitCost} {currentProcess.unitLabel}
                  {currentProcess.setupCost ? ` + ${currency.symbol}${currentProcess.setupCost} prep` : ''}
                </span>
              </div>
            </div>

            {/* Full Official Description */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentProcess.description}
              </p>
            </div>

            {/* Industrial Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Box 1: Maquinaria */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-[11px] uppercase tracking-wide">
                  <span>🏭 Maquinaria & Equipamiento</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {currentProcess.machinery || 'Equipos industriales automáticos de alta velocidad.'}
                </p>
              </div>

              {/* Box 2: Utillaje */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wide">
                  <span>📐 Matrices, Clisés & Utillaje</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {currentProcess.tooling || 'Utillaje calibrado para el tiraje y espesor del sustrato.'}
                </p>
              </div>

              {/* Box 3: Calidad */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-[11px] uppercase tracking-wide">
                  <span>🔍 Controles de Calidad Críticos</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {currentProcess.qualityCheck || 'Verificación dimensional y ausencia de defectos estéticos.'}
                </p>
              </div>

              {/* Box 4: Tips de Taller */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
                  <span>💡 Recomendación Técnica de Taller</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  {currentProcess.technicalTip || 'Asegurar puesta a punto limpia y control ambiental de humedad.'}
                </p>
              </div>
            </div>

            {/* Interactive CITO Contrahendidos Abaco Tool for Marcado y Hendido */}
            {currentProcess.id === 'proc_creasing' && (
              <div className="bg-slate-900/90 rounded-2xl border border-amber-500/40 p-4 space-y-3.5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 font-mono flex items-center gap-2">
                        <span>Ábaco CITO Online de Contrahendidos (Cartón Compacto / Folding)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Determinación del tipo de contrahendido según el espesor del cartón en mm / micras.
                      </p>
                    </div>
                  </div>
                  <a
                    href={CITO_ABACO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-200 flex items-center gap-1.5 underline font-mono shrink-0 self-start sm:self-auto"
                  >
                    <span>Ábaco CITO Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Thickness Controls & Presets */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Espesor del Cartón:
                      </label>
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {creasingSimThicknessMm.toFixed(2)} mm ({Math.round(creasingSimThicknessMm * 1000)} µm)
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0.15"
                      max="1.20"
                      step="0.01"
                      value={creasingSimThicknessMm}
                      onChange={(e) => setCreasingSimThicknessMm(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Espesor en mm:</span>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.15"
                            max="1.50"
                            value={creasingSimThicknessMm}
                            onChange={(e) => setCreasingSimThicknessMm(Number(e.target.value))}
                            className="w-full bg-transparent font-mono text-xs text-amber-300 font-bold outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Espesor en micras:</span>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                          <input
                            type="number"
                            step="10"
                            min="150"
                            max="1500"
                            value={Math.round(creasingSimThicknessMm * 1000)}
                            onChange={(e) => setCreasingSimThicknessMm(Number(e.target.value) / 1000)}
                            className="w-full bg-transparent font-mono text-xs text-slate-200 font-bold outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">µm</span>
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Calibres Comunes:</span>
                      <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
                        {[0.30, 0.35, 0.40, 0.50, 0.60].map((presetMm) => (
                          <button
                            key={presetMm}
                            type="button"
                            onClick={() => setCreasingSimThicknessMm(presetMm)}
                            className={`p-1 rounded text-center border transition-all ${
                              Math.abs(creasingSimThicknessMm - presetMm) < 0.005
                                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {presetMm.toFixed(2)} mm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recommended Contrahendido Badge & Parameters */}
                  <div className="bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 p-3.5 rounded-xl border border-amber-500/40 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Contrahendido CITO Recomendado:
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow border border-white/20"
                          style={{ backgroundColor: citoRecommendation.colorHex }}
                          title={`Color CITO: ${citoRecommendation.colorName}`}
                        />
                        <span className="text-xl font-black font-mono text-amber-400">
                          {citoRecommendation.matrixCode}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 mt-1">
                        Color CITO: <strong className="text-amber-300">{citoRecommendation.colorName}</strong> • Fleje: <strong className="text-slate-100">{citoRecommendation.ruleThicknessPt} pt ({citoRecommendation.ruleThicknessMm} mm)</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Profundidad (h):</span>
                        <span className="text-slate-100 font-bold">{citoRecommendation.depthMm.toFixed(2)} mm</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Ancho canal (w):</span>
                        <span className="text-amber-300 font-bold">{citoRecommendation.widthMm.toFixed(1)} mm</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800">
                      💡 <strong>Ejemplo técnico:</strong> Cartón de 0.40 mm de espesor → Contrahendido de <span className="text-amber-400 font-bold">0.40 × 1.3 mm</span>.
                    </div>
                  </div>
                </div>

                {/* Table of standard matrices */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1.5">
                    Tabla Rápida de Correspondencias Ábaco CITO:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 font-mono text-[10px]">
                    {CITO_STANDARD_MATRIX_TABLE.map((row) => {
                      const isMatch = creasingSimThicknessMm >= row.minMm && creasingSimThicknessMm <= row.maxMm;
                      return (
                        <button
                          key={row.matrixCode}
                          type="button"
                          onClick={() => {
                            const targetMm = Number(row.thicknessDisplay.split(' ')[0]) || ((row.minMm + row.maxMm) / 2);
                            setCreasingSimThicknessMm(targetMm);
                          }}
                          className={`p-1.5 rounded border text-left transition-all ${
                            isMatch
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/50'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px]">
                            <span>{row.thicknessDisplay}</span>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.colorHex }} />
                          </div>
                          <div className="font-bold text-slate-100 text-[11px] mt-0.5">{row.matrixCode}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Calculator for this process */}
            <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-4 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  Simulador de Costo en Vivo: {currentProcess.name}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calcula el costo del proceso para cualquier volumen de producción.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentProcess.costType === 'per_sheet' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Pliegos</label>
                    <input
                      type="number"
                      value={simSheets}
                      onChange={(e) => setSimSheets(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs text-slate-200"
                    />
                  </div>
                )}

                {currentProcess.costType === 'per_unit' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Estuches / U</label>
                    <input
                      type="number"
                      value={simUnits}
                      onChange={(e) => setSimUnits(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs text-slate-200"
                    />
                  </div>
                )}

                {currentProcess.costType === 'per_m2' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Superficie m²</label>
                    <input
                      type="number"
                      value={simM2}
                      onChange={(e) => setSimM2(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs text-slate-200"
                    />
                  </div>
                )}

                <div className="text-right pl-2 sm:border-l border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Costo Simulado</span>
                  <span className="text-base font-mono font-bold text-amber-400">
                    {currency.symbol}
                    {(() => {
                      let run = 0;
                      if (currentProcess.costType === 'per_sheet') run = currentProcess.unitCost * simSheets;
                      else if (currentProcess.costType === 'per_unit') run = currentProcess.unitCost * simUnits;
                      else if (currentProcess.costType === 'per_m2') run = currentProcess.unitCost * simM2;
                      else run = currentProcess.unitCost;
                      const setup = currentProcess.setupCost || 0;
                      return (run + setup).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

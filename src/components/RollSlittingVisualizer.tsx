import React, { useState, useMemo, useEffect } from 'react';
import { CurrencyConfig } from '../types/graphic';
import {
  Scissors,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  Info,
  Maximize2,
  TrendingDown,
  ArrowRight,
  Disc,
} from 'lucide-react';

interface RollSlittingVisualizerProps {
  initialMasterRollWidthMm?: number;
  initialCutWidthMm?: number;
  initialMasterRollLengthM?: number;
  orderMl?: number;
  currency?: CurrencyConfig;
  onApplyCutWidth?: (cutWidthMm: number) => void;
}

const CUT_PALETTE = [
  '#2563eb', // Blue (Corte 1)
  '#dc2626', // Red (Corte 2)
  '#eab308', // Amber/Yellow (Corte 3)
  '#059669', // Emerald (Corte 4)
  '#ea580c', // Orange (Corte 5)
  '#0891b2', // Cyan (Corte 6)
  '#4f46e5', // Indigo (Corte 7)
  '#db2777', // Pink (Corte 8)
  '#7c3aed', // Purple (Corte 9)
  '#0d9488', // Teal (Corte 10)
];

export const RollSlittingVisualizer: React.FC<RollSlittingVisualizerProps> = ({
  initialMasterRollWidthMm = 1000,
  initialCutWidthMm = 140,
  initialMasterRollLengthM = 1500,
  orderMl = 5661,
  currency = { code: 'USD', symbol: '$', rate: 1, decimals: 2 },
  onApplyCutWidth,
}) => {
  // Top Banner Inputs (Replicating user's spreadsheet in image)
  const [masterRollWidthMm, setMasterRollWidthMm] = useState<number>(initialMasterRollWidthMm);
  const [cutWidthMm, setCutWidthMm] = useState<number>(initialCutWidthMm);
  const [masterRollLengthM, setMasterRollLengthM] = useState<number>(initialMasterRollLengthM);
  const [masterRollQty, setMasterRollQty] = useState<number>(1);
  const [orderLinearMeters, setOrderLinearMeters] = useState<number>(orderMl);

  useEffect(() => {
    if (initialCutWidthMm && initialCutWidthMm > 0) {
      setCutWidthMm(initialCutWidthMm);
    }
  }, [initialCutWidthMm]);

  useEffect(() => {
    if (orderMl !== undefined) {
      setOrderLinearMeters(orderMl);
    }
  }, [orderMl]);

  // 10 Individual Cut inputs (like Corte 1 to Corte 10 in spreadsheet)
  const [customCuts, setCustomCuts] = useState<number[]>([
    140, 140, 140, 140, 140, 140, 140, 0, 0, 0,
  ]);
  const [isManualCutMode, setIsManualCutMode] = useState<boolean>(false);
  const [hoveredCutIndex, setHoveredCutIndex] = useState<number | null>(null);

  // Auto-distribute cuts uniformly when cutWidthMm or masterRollWidthMm changes in auto mode
  const autoCuts = useMemo(() => {
    if (cutWidthMm <= 0 || masterRollWidthMm <= 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const maxFitting = Math.min(10, Math.floor(masterRollWidthMm / cutWidthMm));
    const list = Array(10).fill(0);
    for (let i = 0; i < maxFitting; i++) {
      list[i] = cutWidthMm;
    }
    return list;
  }, [cutWidthMm, masterRollWidthMm]);

  const activeCuts = isManualCutMode ? customCuts : autoCuts;

  // Active cut strips (only > 0)
  const nonZeroCuts = activeCuts.filter((w) => w > 0);
  const cutCount = nonZeroCuts.length;

  // Total used cut width
  const totalUsedWidthMm = activeCuts.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);
  const trimRefileMm = Math.max(0, masterRollWidthMm - totalUsedWidthMm);
  const trimPercentage = masterRollWidthMm > 0 ? (trimRefileMm / masterRollWidthMm) * 100 : 0;
  const utilizationPercentage = masterRollWidthMm > 0 ? (totalUsedWidthMm / masterRollWidthMm) * 100 : 0;

  // Formulas from user's spreadsheet:
  // Corte de Bobina Uni: masterRollWidth / cutWidth (e.g. 1000 / 150 = 6.67, or cutCount in manual)
  const cutsTheoreticalUni = cutWidthMm > 0 ? Number((masterRollWidthMm / cutWidthMm).toFixed(2)) : 0;

  // ML Totales = Longitud de Bobina * cortes útiles * bobinas madre
  const totalProducedMl = masterRollLengthM * Math.max(1, cutCount) * masterRollQty;

  // JUMBO = ML OT / ML producidos por 1 jumbo (or orderLinearMeters / totalProducedMl)
  const singleJumboProducedMl = masterRollLengthM * Math.max(1, cutCount);
  const jumbosRequired =
    singleJumboProducedMl > 0 ? Number((orderLinearMeters / singleJumboProducedMl).toFixed(2)) : 0;

  // Handlers
  const handleCutChange = (index: number, val: number) => {
    setIsManualCutMode(true);
    const updated = [...customCuts];
    updated[index] = Math.max(0, Number(val) || 0);
    setCustomCuts(updated);
  };

  const handleResetToUniform = () => {
    setIsManualCutMode(false);
    setCustomCuts(autoCuts);
  };

  const handleApplyPresetSize = (width: number) => {
    setCutWidthMm(width);
    setIsManualCutMode(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-6">
      {/* Top Title & Tech Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-slate-950 font-bold shadow-md">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Cálculo y Esquema de Corte de Bobina (Slitter / Rebobinadora)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold border border-teal-500/30">
                Aprovechamiento de Bobina Madre
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Esquema técnico de corte longitudinal de bobinas madre a bobinas hijas para prensas flexográficas (Nilpeter / ETIRAMA 350mm) y etiquetas.
            </p>
          </div>
        </div>

        {/* Action button to sync width */}
        {onApplyCutWidth && (
          <button
            type="button"
            onClick={() => onApplyCutWidth(cutWidthMm)}
            className="text-xs px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 self-start sm:self-auto"
          >
            <Disc className="w-4 h-4" />
            <span>Asignar {cutWidthMm} mm a Flexo</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TOP TURQUOISE KPI CARDS (Matching exact cells from user's Google Sheet)   */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 p-4 sm:p-5 rounded-2xl shadow-xl border border-teal-500/40 text-slate-900">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
          {/* 1. Ancho de Bobina (mm) */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              Ancho de Bobina (mm)
            </label>
            <input
              type="number"
              step="10"
              value={masterRollWidthMm}
              onChange={(e) => setMasterRollWidthMm(Math.max(10, Number(e.target.value)))}
              className="w-full text-lg sm:text-xl font-black font-mono text-slate-900 outline-none mt-1"
            />
          </div>

          {/* 2. Tamaño de Corte mm */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              Tamaño de Corte mm
            </label>
            <input
              type="number"
              step="1"
              value={cutWidthMm}
              onChange={(e) => setCutWidthMm(Math.max(1, Number(e.target.value)))}
              className="w-full text-lg sm:text-xl font-black font-mono text-slate-900 outline-none mt-1"
            />
          </div>

          {/* 3. Corte de Bobina Uni. */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              Corte de Bobina Uni.
            </label>
            <div className="text-lg sm:text-xl font-black font-mono text-teal-700 mt-1">
              {cutsTheoreticalUni.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              ({cutCount} tiras útiles)
            </span>
          </div>

          {/* 4. Longitud de Bobina (m) */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              Longitud de Bobina (m)
            </label>
            <input
              type="number"
              step="100"
              value={masterRollLengthM}
              onChange={(e) => setMasterRollLengthM(Math.max(10, Number(e.target.value)))}
              className="w-full text-lg sm:text-xl font-black font-mono text-slate-900 outline-none mt-1"
            />
          </div>

          {/* 5. Bobina Madre Uni. */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              Bobina Madre Uni.
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={masterRollQty}
              onChange={(e) => setMasterRollQty(Math.max(1, Number(e.target.value)))}
              className="w-full text-lg sm:text-xl font-black font-mono text-slate-900 outline-none mt-1"
            />
          </div>

          {/* 6. ML (Metros Lineales Totales) */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              ML Totales
            </label>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {totalProducedMl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ml salida</span>
          </div>

          {/* 7. ML OT (Metros Lineales de Orden de Trabajo) */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between">
            <label className="text-[11px] font-bold text-teal-900 leading-tight">
              ML OT
            </label>
            <input
              type="number"
              step="100"
              value={orderLinearMeters}
              onChange={(e) => setOrderLinearMeters(Math.max(0, Number(e.target.value)))}
              className="w-full text-lg sm:text-xl font-black font-mono text-teal-800 outline-none mt-1"
            />
          </div>

          {/* 8. JUMBO (Proporción de bobina jumbo requerida) */}
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col justify-between border-2 border-teal-400">
            <label className="text-[11px] font-black uppercase text-teal-900 leading-tight">
              JUMBO
            </label>
            <div className="text-xl sm:text-2xl font-black font-mono text-teal-600 mt-1">
              {jumbosRequired.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-600 font-semibold font-mono">
              {jumbosRequired < 1 ? `${Math.ceil(jumbosRequired * 100)}% de 1 Jumbo` : `${Math.ceil(jumbosRequired)} Jumbos`}
            </span>
          </div>
        </div>

        {/* Quick presets for common widths */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-teal-600/50 text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-100">Presets habituales de corte:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '140 mm (Etiquetas)', w: 140 },
                { label: '150 mm (Media Bobina)', w: 150 },
                { label: '350 mm (Nilpeter / ETIRAMA)', w: 350 },
                { label: '250 mm (Banda Chica)', w: 250 },
                { label: '500 mm (Medio Pliego)', w: 500 },
              ].map((p) => (
                <button
                  key={p.w}
                  type="button"
                  onClick={() => handleApplyPresetSize(p.w)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    cutWidthMm === p.w && !isManualCutMode
                      ? 'bg-white text-teal-950 border-white shadow-md'
                      : 'bg-teal-900/60 hover:bg-teal-900 text-teal-100 border-teal-500/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManualCutMode && (
              <button
                type="button"
                onClick={handleResetToUniform}
                className="px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-950 text-teal-200 border border-teal-400/40 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Corte Uniforme</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE CHART (Replicating exact "Corte de Bobina" graphic from spreadsheet) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-300 text-slate-900 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-base sm:text-lg font-bold text-slate-700 tracking-wide font-sans">
            Corte de Bobina
          </h4>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-600">
              Ancho Madre: <strong>{masterRollWidthMm} mm</strong>
            </span>
            <span className="text-emerald-700 font-bold">
              Útil: {totalUsedWidthMm} mm ({utilizationPercentage.toFixed(1)}%)
            </span>
            <span className="text-lime-700 font-bold">
              Refile: {trimRefileMm} mm ({trimPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* The Stacked Horizontal Bar Graphic */}
        <div className="relative pt-2 pb-6 px-4">
          {/* Ticks Grid & Labels along X axis */}
          <div className="relative w-full h-8 flex justify-between text-xs text-slate-500 font-mono mb-2">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const tickVal = Math.round(masterRollWidthMm * ratio);
              return (
                <div
                  key={ratio}
                  className="flex flex-col items-center absolute -translate-x-1/2"
                  style={{ left: `${ratio * 100}%` }}
                >
                  <div className="w-px h-2 bg-slate-400 mb-1" />
                  <span>{tickVal}</span>
                </div>
              );
            })}
          </div>

          {/* The Multi-colored Stacked Bar */}
          <div className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden flex border-2 border-slate-400 shadow-inner relative">
            {activeCuts.map((cutW, idx) => {
              if (cutW <= 0) return null;
              const widthPct = (cutW / masterRollWidthMm) * 100;
              const color = CUT_PALETTE[idx % CUT_PALETTE.length];
              const isHovered = hoveredCutIndex === idx;

              return (
                <div
                  key={`cut-bar-${idx}`}
                  onMouseEnter={() => setHoveredCutIndex(idx)}
                  onMouseLeave={() => setHoveredCutIndex(null)}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                  className={`h-full flex flex-col items-center justify-center text-white transition-all relative border-r border-white/30 cursor-pointer ${
                    isHovered ? 'brightness-110 shadow-lg scale-y-105 z-10' : ''
                  }`}
                  title={`Corte ${idx + 1}: ${cutW} mm (${widthPct.toFixed(1)}%)`}
                >
                  <span className="text-[11px] font-bold font-mono tracking-tight drop-shadow-sm">
                    Corte {idx + 1}
                  </span>
                  <span className="text-xs font-black font-mono drop-shadow-sm">
                    {cutW} mm
                  </span>
                  <span className="text-[9px] opacity-80 font-mono">
                    {widthPct.toFixed(1)}%
                  </span>
                </div>
              );
            })}

            {/* Refile / Edge Trim segment at right */}
            {trimRefileMm > 0 && (
              <div
                style={{
                  width: `${trimPercentage}%`,
                  backgroundColor: '#84cc16', // Lime green matching spreadsheet
                }}
                className="h-full flex flex-col items-center justify-center text-slate-900 font-bold border-l border-white/40 transition-all hover:brightness-105 cursor-pointer relative"
                title={`Refile / Sobrante: ${trimRefileMm} mm (${trimPercentage.toFixed(1)}%)`}
              >
                <span className="text-[10px] font-black uppercase font-mono tracking-tight">
                  Refile
                </span>
                <span className="text-xs font-black font-mono">
                  {trimRefileMm} mm
                </span>
                <span className="text-[9px] font-mono text-slate-800">
                  {trimPercentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Under-bar tick marks representing 0, 250, 500, 750, 1000 */}
          <div className="w-full flex justify-between text-[11px] text-slate-600 font-mono mt-3 px-1">
            <span>0</span>
            <span>{Math.round(masterRollWidthMm * 0.25)}</span>
            <span>{Math.round(masterRollWidthMm * 0.5)}</span>
            <span>{Math.round(masterRollWidthMm * 0.75)}</span>
            <span>{masterRollWidthMm} mm</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM TABLE: CORTE 1 to CORTE 10 (Matching exact spreadsheet layout)    */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              Distribución de Anchos por Tira / Bobina Hija (10 Cortes Máximo):
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold border border-teal-500/30">
              {cutCount} cortes activos
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Puedes editar cada corte individualmente o usar el tamaño uniforme.
          </span>
        </div>

        {/* 10 Columns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, index) => {
            const cutNum = index + 1;
            const cutVal = activeCuts[index] || 0;
            const isActive = cutVal > 0;
            const color = CUT_PALETTE[index % CUT_PALETTE.length];

            return (
              <div
                key={`corte-col-${cutNum}`}
                className={`rounded-xl border transition-all overflow-hidden flex flex-col ${
                  isActive
                    ? 'border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Header (Corte 1 ... Corte 10) */}
                <div
                  className="px-2 py-1.5 text-center text-xs font-bold font-mono text-white flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: isActive ? color : '#334155' }}
                >
                  <span>Corte {cutNum}</span>
                </div>

                {/* Input Cell (White/slate background like spreadsheet) */}
                <div className="p-2 bg-slate-900 flex flex-col items-center">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={cutVal}
                    onChange={(e) => handleCutChange(index, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-slate-100 outline-none focus:border-teal-400"
                  />
                  <span className="text-[9px] text-slate-400 font-mono mt-1">
                    {cutVal > 0 ? `${((cutVal / masterRollWidthMm) * 100).toFixed(1)}%` : 'Inactivo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slitting Technical Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80 mt-2 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Ancho Útil Rebobinado:</span>
              <span className="text-sm font-bold font-mono text-teal-300 block">
                {totalUsedWidthMm} mm de {masterRollWidthMm} mm
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {cutCount} bobinas hijas producidas
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-3">
            <div className="p-2 rounded-lg bg-lime-500/10 text-lime-400 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Merma de Orillo / Refile:</span>
              <span className="text-sm font-bold font-mono text-lime-400 block">
                {trimRefileMm} mm ({trimPercentage.toFixed(1)}%)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Aprovechamiento: {utilizationPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Capacidad de Entrega:</span>
              <span className="text-sm font-bold font-mono text-sky-300 block">
                {totalProducedMl.toLocaleString()} ml disponibles
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Para OT de {orderLinearMeters.toLocaleString()} ml ({jumbosRequired.toFixed(2)} Jumbos)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CutArrangement } from '../types/graphic';
import { Maximize2, Minimize2, RotateCcw, Sparkles, Layers, Scissors, Info, Crosshair, Target, Printer } from 'lucide-react';

interface ImpositionVisualizerProps {
  arrangements: {
    horizontal: CutArrangement;
    vertical: CutArrangement;
    mixed: CutArrangement;
    optimal: CutArrangement;
  };
  currentOrientation: 'horizontal' | 'vertical' | 'mixed';
  onSelectOrientation: (orientation: 'horizontal' | 'vertical' | 'mixed') => void;
  gripperMarginMm: number;
  nonGripperMarginMm: number;
  gutterMm: number;
  bleedMm: number;
  gripperPosition?: 'bottom' | 'top';
  onToggleGripperPosition?: (pos: 'bottom' | 'top') => void;
  plateWidthMm?: number;
  plateHeightMm?: number;
  machineName?: string;
  onChangeNonGripperMargin?: (marginMm: number) => void;
  customPosesCount?: number;
  customPosesX?: number;
  customPosesY?: number;
  isCustomPosesActive?: boolean;
  onChangePoses?: (poses: { total: number; countX?: number; countY?: number; isCustom: boolean }) => void;
  onResetAutoPoses?: () => void;
}

export const ImpositionVisualizer: React.FC<ImpositionVisualizerProps> = ({
  arrangements,
  currentOrientation,
  onSelectOrientation,
  gripperMarginMm,
  nonGripperMarginMm,
  gutterMm,
  bleedMm,
  gripperPosition = 'bottom',
  onToggleGripperPosition,
  plateWidthMm = 745,
  plateHeightMm = 605,
  machineName = 'Heidelberg SM 74',
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showCenterGuide, setShowCenterGuide] = useState(true);
  const [showPlateOutline, setShowPlateOutline] = useState(true);
  const activeArrangement = arrangements[currentOrientation] || arrangements.optimal;

  const sheetW = activeArrangement.sheetWidth;
  const sheetH = activeArrangement.sheetHeight;
  const plateW = plateWidthMm && plateWidthMm > 0 ? plateWidthMm : 745;
  const plateH = plateHeightMm && plateHeightMm > 0 ? plateHeightMm : 605;

  // Maximum bounding box containing both Plancha (Plate) and Pliego (Sheet)
  const maxW = Math.max(plateW, sheetW);
  const maxH = Math.max(plateH, sheetH);

  // Center plate and sheet in visual canvas
  const plateX = Math.round((maxW - plateW) / 2);
  const plateY = Math.round((maxH - plateH) / 2);

  const sheetX = Math.round((maxW - sheetW) / 2);
  const sheetY = Math.round((maxH - sheetH) / 2);

  // ViewBox with padding for dimension annotations
  const paddingLeft = 60;
  const paddingRight = 45;
  const paddingTop = 65;
  const paddingBottom = 45;

  const vbX = -paddingLeft;
  const vbY = -paddingTop;
  const vbWidth = maxW + paddingLeft + paddingRight;
  const vbHeight = maxH + paddingTop + paddingBottom;

  const { cutPattern, posesTotal, utilPercentage, wastePercentage } = activeArrangement;
  const effectiveGutter = Math.max(gutterMm, bleedMm * 2);

  // Generate list of all poses positioned relative to sheetX and sheetY
  const posesList: { x: number; y: number; w: number; h: number; index: number; isRotated: boolean }[] = [];
  let poseIndex = 1;

  if (cutPattern.section1) {
    const s1 = cutPattern.section1;
    for (let row = 0; row < s1.countY; row++) {
      for (let col = 0; col < s1.countX; col++) {
        posesList.push({
          x: sheetX + s1.x0 + col * (s1.w + effectiveGutter),
          y: sheetY + s1.y0 + row * (s1.h + effectiveGutter),
          w: s1.w,
          h: s1.h,
          index: poseIndex++,
          isRotated: s1.w !== activeArrangement.pieceWidth,
        });
      }
    }
  }

  if (cutPattern.section2) {
    const s2 = cutPattern.section2;
    for (let row = 0; row < s2.countY; row++) {
      for (let col = 0; col < s2.countX; col++) {
        posesList.push({
          x: sheetX + s2.x0 + col * (s2.w + effectiveGutter),
          y: sheetY + s2.y0 + row * (s2.h + effectiveGutter),
          w: s2.w,
          h: s2.h,
          index: poseIndex++,
          isRotated: s2.w !== activeArrangement.pieceWidth,
        });
      }
    }
  }

  const isOptimalHorizontal = arrangements.optimal.orientation === 'horizontal';
  const isOptimalVertical = arrangements.optimal.orientation === 'vertical';
  const isOptimalMixed = arrangements.optimal.orientation === 'mixed';

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header and Layout Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Plano de Imposición y Corte 2D
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {sheetW} × {sheetH} mm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribución geométrica en guillotina para reducción de merma de pliego.
          </p>
        </div>

        {/* Orientation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => onSelectOrientation('horizontal')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentOrientation === 'horizontal'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Al Hilo (H)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
              {arrangements.horizontal.posesTotal}
            </span>
            {isOptimalHorizontal && <Sparkles className="w-3 h-3 text-amber-900" />}
          </button>

          <button
            type="button"
            onClick={() => onSelectOrientation('vertical')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentOrientation === 'vertical'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Contrahilo (V)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
              {arrangements.vertical.posesTotal}
            </span>
            {isOptimalVertical && <Sparkles className="w-3 h-3 text-amber-900" />}
          </button>

          <button
            type="button"
            onClick={() => onSelectOrientation('mixed')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentOrientation === 'mixed'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Corte Mixto (L)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
              {arrangements.mixed.posesTotal}
            </span>
            {isOptimalMixed && <Sparkles className="w-3 h-3 text-amber-900" />}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Poses por Pliego</span>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5 flex items-baseline gap-1">
            {posesTotal}
            <span className="text-xs font-normal text-slate-400">poses</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Aprovechamiento Útil</span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {utilPercentage}%
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Merma / Desperdicio</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
            {wastePercentage}%
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Pieza Final (mm)</span>
          <div className="text-sm font-semibold text-slate-200 font-mono mt-1">
            {activeArrangement.pieceWidth} × {activeArrangement.pieceHeight}
          </div>
        </div>
      </div>

      {/* Centering and Alignment Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Orange Plate Badge */}
          <span className="px-2.5 py-1 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-[0_0_8px_#f97316]" />
            <span>Línea Naranja: Plancha CTP ({plateW} × {plateH} mm)</span>
          </span>

          {/* Green Sheet Badge */}
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span>Línea Verde: Pliego de Papel ({sheetW} × {sheetH} mm)</span>
          </span>

          {/* Gripper position toggle */}
          {onToggleGripperPosition && (
            <button
              type="button"
              onClick={() => onToggleGripperPosition(gripperPosition === 'bottom' ? 'top' : 'bottom')}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Cambiar orientación de la pinza de máquina"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Pinza: {gripperPosition === 'bottom' ? 'Abajo (Pie)' : 'Arriba (Cabeza)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCenterGuide(!showCenterGuide)}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              showCenterGuide
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cruces: {showCenterGuide ? 'Activas' : 'Ocultas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlateOutline(!showPlateOutline)}
            className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              showPlateOutline
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Mostrar / ocultar silueta de plancha CTP"
          >
            <Printer className="w-3.5 h-3.5 text-orange-400" />
            <span>Plancha: {showPlateOutline ? 'Visible' : 'Oculta'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-semibold">
            ✓ Vertical: A partir de Pinza
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Margen Izq / Der: <strong className="text-slate-200">{posesList.length > 0 ? posesList[0].x - sheetX : nonGripperMarginMm} mm</strong>
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden flex items-center justify-center p-2 min-h-[360px]">
        {/* Quick Zoom Toggle */}
        <button
          type="button"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
          title={isZoomed ? 'Ajustar al contenedor' : 'Ampliar vista'}
        >
          {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className={`w-full transition-all duration-300 ${isZoomed ? 'scale-125 my-8' : 'scale-100'}`}>
          <svg
            viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
            className="w-full max-h-[400px] drop-shadow-md select-none"
            style={{ width: '100%' }}
          >
            <defs>
              {/* Pattern for waste paper */}
              <pattern id="wasteHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.18" />
              </pattern>
              {/* Gripper margin pattern */}
              <pattern id="gripperHatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* 1. PLANCHA CTP DE MÁQUINA (AJUSTE DE PRENSA) - LÍNEA NARANJA */}
            {showPlateOutline && (
              <g className="plancha-ctp-layer">
                {/* Plancha Dimensions in ORANGE */}
                <g className="font-mono text-[14px]">
                  {/* Top Width Arrow Plancha */}
                  <line x1={plateX} y1={plateY - 34} x2={plateX + plateW} y2={plateY - 34} stroke="#f97316" strokeWidth="2" />
                  <line x1={plateX} y1={plateY - 40} x2={plateX} y2={plateY - 28} stroke="#f97316" strokeWidth="2" />
                  <line x1={plateX + plateW} y1={plateY - 40} x2={plateX + plateW} y2={plateY - 28} stroke="#f97316" strokeWidth="2" />
                  <text x={plateX + plateW / 2} y={plateY - 39} textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="700">
                    Línea Naranja: Plancha CTP (Ajuste Prensa): {plateW} mm
                  </text>

                  {/* Left Height Arrow Plancha */}
                  <line x1={plateX - 35} y1={plateY} x2={plateX - 35} y2={plateY + plateH} stroke="#f97316" strokeWidth="2" />
                  <line x1={plateX - 41} y1={plateY} x2={plateX - 29} y2={plateY} stroke="#f97316" strokeWidth="2" />
                  <line x1={plateX - 41} y1={plateY + plateH} x2={plateX - 29} y2={plateY + plateH} stroke="#f97316" strokeWidth="2" />
                  <text
                    x={plateX - 42}
                    y={plateY + plateH / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 ${plateX - 42} ${plateY + plateH / 2})`}
                    fill="#f97316"
                    fontSize="13"
                    fontWeight="700"
                  >
                    Plancha CTP: {plateH} mm
                  </text>
                </g>

                {/* Plancha Rect Outline in Orange */}
                <rect
                  x={plateX}
                  y={plateY}
                  width={plateW}
                  height={plateH}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                  rx="4"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.45))' }}
                />
                <text
                  x={plateX + 10}
                  y={plateY + 16}
                  fill="#f97316"
                  fontSize="11"
                  fontWeight="bold"
                  className="font-mono"
                >
                  🟠 PLANCHA CTP / PRENSA ({plateW} × {plateH} mm)
                </text>
              </g>
            )}

            {/* 2. PLIEGO DE PAPEL (SUSTRATO) - LÍNEA VERDE */}
            <g className="pliego-papel-layer">
              {/* Pliego Dimensions in GREEN */}
              <g className="font-mono text-[14px]">
                {/* Top Width Arrow Pliego */}
                <line x1={sheetX} y1={sheetY - 12} x2={sheetX + sheetW} y2={sheetY - 12} stroke="#10b981" strokeWidth="2" />
                <line x1={sheetX} y1={sheetY - 18} x2={sheetX} y2={sheetY - 6} stroke="#10b981" strokeWidth="2" />
                <line x1={sheetX + sheetW} y1={sheetY - 18} x2={sheetX + sheetW} y2={sheetY - 6} stroke="#10b981" strokeWidth="2" />
                <text x={sheetX + sheetW / 2} y={sheetY - 16} textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="700">
                  Línea Verde: Pliego de Papel: {sheetW} mm
                </text>

                {/* Left Height Arrow Pliego */}
                <line x1={sheetX - 14} y1={sheetY} x2={sheetX - 14} y2={sheetY + sheetH} stroke="#10b981" strokeWidth="2" />
                <line x1={sheetX - 20} y1={sheetY} x2={sheetX - 8} y2={sheetY} stroke="#10b981" strokeWidth="2" />
                <line x1={sheetX - 20} y1={sheetY + sheetH} x2={sheetX - 8} y2={sheetY + sheetH} stroke="#10b981" strokeWidth="2" />
                <text
                  x={sheetX - 18}
                  y={sheetY + sheetH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 ${sheetX - 18} ${sheetY + sheetH / 2})`}
                  fill="#10b981"
                  fontSize="13"
                  fontWeight="700"
                >
                  Pliego de Papel: {sheetH} mm
                </text>
              </g>

              {/* Sheet Background & Outline in GREEN (Línea de Papel en color Verde) */}
              <rect
                x={sheetX}
                y={sheetY}
                width={sheetW}
                height={sheetH}
                fill="#041f17"
                fillOpacity="0.45"
                stroke="#10b981"
                strokeWidth="3.5"
                rx="4"
                style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.45))' }}
              />
              {/* Waste pattern filler over entire sheet */}
              <rect
                x={sheetX}
                y={sheetY}
                width={sheetW}
                height={sheetH}
                fill="url(#wasteHatch)"
              />
              <text
                x={sheetX + 10}
                y={sheetY + (gripperPosition === 'bottom' ? 20 : sheetH - 12)}
                fill="#34d399"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                🟢 PLIEGO DE PAPEL ({sheetW} × {sheetH} mm)
              </text>
            </g>

            {/* 3. Machine Gripper Margin Area (Pinza) - Positioned according to gripperPosition */}
            <rect
              x={sheetX}
              y={gripperPosition === 'bottom' ? sheetY + sheetH - gripperMarginMm : sheetY}
              width={sheetW}
              height={gripperMarginMm}
              fill="url(#gripperHatch)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text
              x={sheetX + sheetW / 2}
              y={gripperPosition === 'bottom' ? sheetY + sheetH - (gripperMarginMm / 2) + 4 : sheetY + (gripperMarginMm / 2) + 4}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="12"
              fontWeight="bold"
              className="font-mono tracking-wider"
            >
              PINZA DE MÁQUINA ({gripperMarginMm} mm)
            </text>

            {/* Non-gripper margins indicator lines (dashed) */}
            <rect
              x={sheetX + nonGripperMarginMm}
              y={gripperPosition === 'bottom' ? sheetY + nonGripperMarginMm : sheetY + gripperMarginMm}
              width={sheetW - nonGripperMarginMm * 2}
              height={sheetH - gripperMarginMm - nonGripperMarginMm}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeDasharray="6 3"
              strokeOpacity="0.4"
            />

            {/* Centering Crosshair Axes & Registration Marks */}
            {showCenterGuide && (
              <g className="center-alignment-guides pointer-events-none">
                {/* Horizontal Center Axis */}
                <line
                  x1={sheetX}
                  y1={sheetY + sheetH / 2}
                  x2={sheetX + sheetW}
                  y2={sheetY + sheetH / 2}
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="8 4"
                  strokeOpacity="0.65"
                />
                {/* Vertical Center Axis */}
                <line
                  x1={sheetX + sheetW / 2}
                  y1={sheetY}
                  x2={sheetX + sheetW / 2}
                  y2={sheetY + sheetH}
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="8 4"
                  strokeOpacity="0.65"
                />

                {/* Central Registration Target */}
                <circle
                  cx={sheetX + sheetW / 2}
                  cy={sheetY + sheetH / 2}
                  r="16"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                />
                <circle
                  cx={sheetX + sheetW / 2}
                  cy={sheetY + sheetH / 2}
                  r="5"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1"
                  strokeOpacity="0.8"
                />
                <line
                  x1={sheetX + sheetW / 2 - 24}
                  y1={sheetY + sheetH / 2}
                  x2={sheetX + sheetW / 2 + 24}
                  y2={sheetY + sheetH / 2}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />
                <line
                  x1={sheetX + sheetW / 2}
                  y1={sheetY + sheetH / 2 - 24}
                  x2={sheetX + sheetW / 2}
                  y2={sheetY + sheetH / 2 + 24}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />

                {/* Edge Registration Marks */}
                <line x1={sheetX + sheetW / 2} y1={sheetY - 10} x2={sheetX + sheetW / 2} y2={sheetY + 6} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={sheetX + sheetW / 2 - 6} y1={sheetY} x2={sheetX + sheetW / 2 + 6} y2={sheetY} stroke="#06b6d4" strokeWidth="1.5" />

                <line x1={sheetX + sheetW / 2} y1={sheetY + sheetH - 6} x2={sheetX + sheetW / 2} y2={sheetY + sheetH + 10} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={sheetX + sheetW / 2 - 6} y1={sheetY + sheetH} x2={sheetX + sheetW / 2 + 6} y2={sheetY + sheetH} stroke="#06b6d4" strokeWidth="1.5" />

                <line x1={sheetX - 10} y1={sheetY + sheetH / 2} x2={sheetX + 6} y2={sheetY + sheetH / 2} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={sheetX} y1={sheetY + sheetH / 2 - 6} x2={sheetX} y2={sheetY + sheetH / 2 + 6} stroke="#06b6d4" strokeWidth="1.5" />

                <line x1={sheetX + sheetW - 6} y1={sheetY + sheetH / 2} x2={sheetX + sheetW + 10} y2={sheetY + sheetH / 2} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={sheetX + sheetW} y1={sheetY + sheetH / 2 - 6} x2={sheetX + sheetW} y2={sheetY + sheetH / 2 + 6} stroke="#06b6d4" strokeWidth="1.5" />
              </g>
            )}

            {/* 4. Poses / Pieces Render */}
            {posesList.map((pose) => (
              <g key={`pose-${pose.index}`} className="group cursor-pointer">
                {/* Bleed outline if applicable */}
                {bleedMm > 0 && (
                  <rect
                    x={pose.x - bleedMm}
                    y={pose.y - bleedMm}
                    width={pose.w + bleedMm * 2}
                    height={pose.h + bleedMm * 2}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                    strokeOpacity="0.5"
                  />
                )}

                {/* Pose Body */}
                <rect
                  x={pose.x}
                  y={pose.y}
                  width={pose.w}
                  height={pose.h}
                  fill={pose.isRotated ? '#1e293b' : '#0284c7'}
                  fillOpacity={pose.isRotated ? '0.85' : '0.35'}
                  stroke={pose.isRotated ? '#38bdf8' : '#38bdf8'}
                  strokeWidth="1.5"
                  rx="2"
                  className="transition-colors group-hover:fill-sky-500/50"
                />

                {/* Pose Number Label */}
                <text
                  x={pose.x + pose.w / 2}
                  y={pose.y + pose.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f8fafc"
                  fontSize={Math.max(10, Math.min(18, Math.min(pose.w, pose.h) / 4))}
                  fontWeight="bold"
                  className="font-mono select-none pointer-events-none drop-shadow"
                >
                  #{pose.index}
                </text>

                {/* Mini Dimensions text if piece is large enough */}
                {pose.w > 70 && pose.h > 40 && (
                  <text
                    x={pose.x + pose.w / 2}
                    y={pose.y + pose.h / 2 + 16}
                    textAnchor="middle"
                    fill="#93c5fd"
                    fontSize="10"
                    className="font-mono select-none pointer-events-none"
                  >
                    {pose.w}×{pose.h}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Visualizer Legend & Prepress Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-orange-500 inline-block shadow-[0_0_6px_#f97316]" />
            <span className="text-orange-400 font-semibold">Línea Naranja: Plancha CTP ({plateW}×{plateH} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
            <span className="text-emerald-400 font-semibold">Línea Verde: Pliego de Papel ({sheetW}×{sheetH} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-600/40 border border-sky-400 inline-block" />
            <span>Pose útil #{posesTotal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block" />
            <span>Pinza ({gripperMarginMm} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
            <span>Merma/Refile ({wastePercentage}%)</span>
          </div>
          {bleedMm > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-dashed border-purple-400 inline-block" />
              <span>Demasía/Sangría ({bleedMm} mm)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Calles de corte: {gutterMm} mm</span>
        </div>
      </div>
    </div>
  );
};

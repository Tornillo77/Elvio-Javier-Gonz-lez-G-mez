import React from 'react';
import { Layers, Disc, ArrowRight, ArrowDown, Scissors } from 'lucide-react';

interface FlexoCylinderLanesVisualizerProps {
  rollWidthMm: number;
  cylinderRepeatMm: number;
  gearTeethZ?: number;
  lanesAcross: number;
  repeatsAlong: number;
  labelWidthMm: number;
  labelHeightMm: number;
  gapAcrossMm: number;
  gapAlongMm: number;
  sideLaneMm: number;
  polymerCm2?: number;
  className?: string;
}

export const FlexoCylinderLanesVisualizer: React.FC<FlexoCylinderLanesVisualizerProps> = ({
  rollWidthMm,
  cylinderRepeatMm,
  gearTeethZ,
  lanesAcross,
  repeatsAlong,
  labelWidthMm,
  labelHeightMm,
  gapAcrossMm,
  gapAlongMm,
  sideLaneMm,
  polymerCm2 = 0,
  className = '',
}) => {
  const safeLanes = Math.max(1, lanesAcross);
  const safeRepeats = Math.max(1, repeatsAlong);
  const effectiveZ = gearTeethZ || Math.round(cylinderRepeatMm / 3.175);
  const usedWidthMm = safeLanes * labelWidthMm + (safeLanes - 1) * gapAcrossMm;

  // SVG Coordinate calculation
  // Bounding box: web width and cylinder development
  const svgWidth = 600;
  const svgHeight = 340;
  const marginX = 50;
  const marginY = 40;
  const drawWidth = svgWidth - marginX * 2;
  const drawHeight = svgHeight - marginY * 2;

  // Scale factors
  const scaleX = drawWidth / Math.max(10, rollWidthMm);
  const scaleY = drawHeight / Math.max(10, cylinderRepeatMm);

  const leftTrimWidthPx = sideLaneMm * scaleX;
  const rightTrimWidthPx = sideLaneMm * scaleX;
  const labelWidthPx = labelWidthMm * scaleX;
  const labelHeightPx = labelHeightMm * scaleY;
  const gapAcrossPx = gapAcrossMm * scaleX;
  const gapAlongPx = gapAlongMm * scaleY;

  return (
    <div className={`bg-slate-50 border border-slate-300 rounded-xl p-4 flex flex-col items-center relative overflow-hidden ${className}`}>
      {/* Top Banner with Cylinder Metrics */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Disc className="w-3.5 h-3.5" />
          </div>
          <div>
            <strong className="text-slate-900 font-black uppercase text-xs block">
              Esquema de Cilindro y Pistas Flexo
            </strong>
            <span className="text-[10px] text-slate-500 block">
              Desarrollo de Cilindro Porta-Cliché y Distribución de Pistas en Bobina
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 font-bold">
            Desarrollo: {cylinderRepeatMm} mm (Z={effectiveZ})
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 font-bold">
            Ancho Banda: {rollWidthMm} mm
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
            {safeLanes} Pistas al Eje × {safeRepeats} al Avance
          </span>
        </div>
      </div>

      {/* SVG Canvas depicting cylinder unrolled surface with web, lanes and labels */}
      <div className="w-full max-w-xl aspect-[16/9] bg-white rounded-lg border-2 border-slate-800 shadow-md p-2 relative flex flex-col justify-between">
        
        {/* Top Header: Cylinder Repeat Reference & Arrow */}
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 border-b border-dashed border-slate-300 pb-1 mb-1">
          <span className="flex items-center gap-1 text-sky-700">
            <ArrowRight className="w-3 h-3 text-sky-600" />
            <span>Sentido de Avance de la Banda</span>
          </span>
          <span className="font-mono text-slate-800">
            Ancho Total de Bobina: {rollWidthMm} mm
          </span>
          <span className="text-amber-800 font-mono">
            Orillos Laterales: {sideLaneMm} mm c/u
          </span>
        </div>

        {/* SVG Drawing */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full flex-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo del cilindro porta-cliché metálico */}
          <rect
            x={marginX - 15}
            y={marginY}
            width={drawWidth + 30}
            height={drawHeight}
            rx={8}
            fill="#f1f5f9"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Banda / Sustrato de la Bobina que pasa por el cilindro */}
          <rect
            x={marginX}
            y={marginY}
            width={drawWidth}
            height={drawHeight}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.5"
          />

          {/* Franjas de orillos de refilado lateral (desperdicio) */}
          {leftTrimWidthPx > 0 && (
            <rect
              x={marginX}
              y={marginY}
              width={leftTrimWidthPx}
              height={drawHeight}
              fill="#fee2e2"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
          {rightTrimWidthPx > 0 && (
            <rect
              x={marginX + drawWidth - rightTrimWidthPx}
              y={marginY}
              width={rightTrimWidthPx}
              height={drawHeight}
              fill="#fee2e2"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Líneas de cuchillas de refilado longitudinal */}
          {Array.from({ length: safeLanes + 1 }).map((_, idx) => {
            const cutX = marginX + leftTrimWidthPx + idx * (labelWidthPx + gapAcrossPx);
            return (
              <line
                key={`knife_${idx}`}
                x1={cutX}
                y1={marginY - 10}
                x2={cutX}
                y2={marginY + drawHeight + 10}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Renderizado de las Pistas al Eje y Repeticiones al Avance */}
          {Array.from({ length: safeLanes }).map((_, laneIdx) => {
            const laneX = marginX + leftTrimWidthPx + laneIdx * (labelWidthPx + gapAcrossPx);

            return Array.from({ length: safeRepeats }).map((_, repIdx) => {
              const repY = marginY + 10 + repIdx * (labelHeightPx + gapAlongPx);

              return (
                <g key={`lbl_${laneIdx}_${repIdx}`}>
                  {/* Etiqueta / Fotopolímero */}
                  <rect
                    x={laneX}
                    y={repY}
                    width={Math.max(12, labelWidthPx)}
                    height={Math.max(12, labelHeightPx)}
                    rx={3}
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                  {/* Texto de identificación de pose dentro del cilindro */}
                  <text
                    x={laneX + Math.max(12, labelWidthPx) / 2}
                    y={repY + Math.max(12, labelHeightPx) / 2 + 3}
                    textAnchor="middle"
                    fill="#0369a1"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    P{laneIdx + 1}
                  </text>
                </g>
              );
            });
          })}

          {/* Etiquetas indicadoras de Pistas superiores */}
          {Array.from({ length: safeLanes }).map((_, laneIdx) => {
            const laneX = marginX + leftTrimWidthPx + laneIdx * (labelWidthPx + gapAcrossPx) + Math.max(12, labelWidthPx) / 2;
            return (
              <text
                key={`lane_lbl_${laneIdx}`}
                x={laneX}
                y={marginY - 3}
                textAnchor="middle"
                fill="#0f172a"
                fontSize="8"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                Pista {laneIdx + 1}
              </text>
            );
          })}

          {/* Cota inferior de ancho de etiqueta */}
          <line
            x1={marginX + leftTrimWidthPx}
            y1={marginY + drawHeight + 15}
            x2={marginX + leftTrimWidthPx + labelWidthPx}
            y2={marginY + drawHeight + 15}
            stroke="#475569"
            strokeWidth="1"
          />
          <text
            x={marginX + leftTrimWidthPx + labelWidthPx / 2}
            y={marginY + drawHeight + 25}
            textAnchor="middle"
            fill="#334155"
            fontSize="8"
            fontWeight="bold"
          >
            {labelWidthMm} mm
          </text>
        </svg>

        {/* Footer: Cotas y Parámetros Técnicos */}
        <div className="flex items-center justify-between text-[8px] font-bold text-slate-600 border-t border-slate-200 pt-1 mt-1">
          <span>Calle Central: {gapAcrossMm} mm</span>
          <span>Calle al Avance: {gapAlongMm} mm</span>
          <span>Ancho Útil Impresión: {usedWidthMm} mm</span>
          <span>Desarrollo: {cylinderRepeatMm} mm (1 rev)</span>
          {polymerCm2 > 0 && <span>Área Polímeros: {polymerCm2} cm²</span>}
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] text-slate-500 font-medium">
        Disposición cilíndrica de {safeLanes} pistas al eje × {safeRepeats} formas al avance ({safeLanes * safeRepeats} poses por revolución de cilindro Z={effectiveZ})
      </div>
    </div>
  );
};

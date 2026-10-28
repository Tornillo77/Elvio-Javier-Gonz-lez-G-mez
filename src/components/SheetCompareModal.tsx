import React from 'react';
import { STANDARD_SHEET_FORMATS } from '../types/graphic';
import { calculateImpositionOptions } from '../utils/imposition';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';

interface SheetCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceWidthMm: number;
  pieceHeightMm: number;
  bleedMm: number;
  gutterMm: number;
  gripperMarginMm: number;
  nonGripperMarginMm: number;
  onApplyFormat: (formatId: string, widthMm: number, heightMm: number) => void;
  currentFormatId: string;
}

export const SheetCompareModal: React.FC<SheetCompareModalProps> = ({
  isOpen,
  onClose,
  pieceWidthMm,
  pieceHeightMm,
  bleedMm,
  gutterMm,
  gripperMarginMm,
  nonGripperMarginMm,
  onApplyFormat,
  currentFormatId,
}) => {
  if (!isOpen) return null;

  // Evaluate each standard format
  const comparisons = STANDARD_SHEET_FORMATS.filter((f) => f.id !== 'custom').map((fmt) => {
    const opts = calculateImpositionOptions({
      sheetWidth: fmt.widthMm,
      sheetHeight: fmt.heightMm,
      pieceWidth: pieceWidthMm,
      pieceHeight: pieceHeightMm,
      bleed: bleedMm,
      gutter: gutterMm,
      gripperMargin: gripperMarginMm,
      nonGripperMargin: nonGripperMarginMm,
    });

    return {
      fmt,
      opts,
      optimal: opts.optimal,
    };
  });

  // Sort by best efficiency
  const sorted = [...comparisons].sort(
    (a, b) => b.optimal.utilPercentage - a.optimal.utilPercentage
  );
  const bestFormatId = sorted[0]?.fmt.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Comparador de Formatos de Pliego</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparación de rendimiento para pieza de {pieceWidthMm} × {pieceHeightMm} mm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comparisons.map(({ fmt, optimal }) => {
              const isBest = fmt.id === bestFormatId;
              const isCurrent = fmt.id === currentFormatId;

              return (
                <div
                  key={fmt.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isBest
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md'
                      : isCurrent
                      ? 'bg-sky-500/10 border-sky-500/40 text-slate-100'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 font-mono">
                          {fmt.name}
                        </span>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Mayor Rendimiento
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            Pliego Actual
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {fmt.description}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-mono font-black text-amber-400 block">
                        {optimal.posesTotal}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        poses útiles
                      </span>
                    </div>
                  </div>

                  {/* Progress bar of efficiency */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Aprovechamiento:</span>
                      <span className="font-bold text-emerald-400">
                        {optimal.utilPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full"
                        style={{ width: `${optimal.utilPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Orientación: {optimal.orientation}</span>
                      <span>Merma: {optimal.wastePercentage}%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onApplyFormat(fmt.id, fmt.widthMm, fmt.heightMm);
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                        <span>Formato Seleccionado</span>
                      </>
                    ) : (
                      <>
                        <span>Aplicar este Pliego</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

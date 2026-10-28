import React, { useState, useEffect } from 'react';
import {
  CorrelativeConfig,
  getCorrelativeConfig,
  saveCorrelativeConfig,
  formatCorrelative,
} from '../utils/correlativeService';
import {
  X,
  Hash,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  FileText,
  Factory,
  ArrowRight,
} from 'lucide-react';

interface CorrelativeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: CorrelativeConfig) => void;
}

export const CorrelativeConfigModal: React.FC<CorrelativeConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<CorrelativeConfig>(() => getCorrelativeConfig());
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getCorrelativeConfig());
      setIsSavedFeedback(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const otPreview = formatCorrelative(config.otPrefix, config.otNextNumber, config.otDigits);
  const quotePreview = formatCorrelative(config.quotePrefix, config.quoteNextNumber, config.quoteDigits);

  const handleSave = () => {
    const updated = saveCorrelativeConfig(config);
    setIsSavedFeedback(true);
    onConfigSaved?.(updated);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer los valores de numeración a los valores iniciales sugeridos?')) {
      const defaults: CorrelativeConfig = {
        otPrefix: 'OT-',
        otNextNumber: 1001,
        otDigits: 5,
        quotePrefix: 'PRES-',
        quoteNextNumber: 1001,
        quoteDigits: 5,
      };
      setConfig(defaults);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                Configurar Numeración & Correlativos
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste la serie inicial de OT y Presupuestos para coincidir con la secuencia de su imprenta
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

        {/* Informative Note */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Cada empresa gráfica tiene seteada su propia correlatividad histórica. Ingrese el número inicial desde el cual comenzarán a emitirse las nuevas OTs y presupuestos en el sistema.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Section 1: Órdenes de Trabajo (OT) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  Numeración de Órdenes de Trabajo (OT)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Próxima OT: {otPreview}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Prefijo de OT
                </label>
                <input
                  type="text"
                  value={config.otPrefix}
                  onChange={(e) => setConfig({ ...config, otPrefix: e.target.value })}
                  placeholder="ej. OT-, OT, #"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Número Inicial / Siguiente
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={config.otNextNumber}
                  onChange={(e) => setConfig({ ...config, otNextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Cifras mínimas (Padding)
                </label>
                <select
                  value={config.otDigits}
                  onChange={(e) => setConfig({ ...config, otDigits: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="3">3 cifras (ej. 001)</option>
                  <option value="4">4 cifras (ej. 0001)</option>
                  <option value="5">5 cifras (ej. 00001)</option>
                  <option value="6">6 cifras (ej. 000001)</option>
                  <option value="7">7 cifras (ej. 0000001)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Vista previa en rótulos y cabecera de taller:</span>
              <span className="font-mono font-black text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/30 text-sm">
                {otPreview}
              </span>
            </div>
          </div>

          {/* Section 2: Presupuestos / Cotizaciones */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                  Numeración de Presupuestos / Cotizaciones
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Próximo Presupuesto: {quotePreview}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Prefijo de Presupuesto
                </label>
                <input
                  type="text"
                  value={config.quotePrefix}
                  onChange={(e) => setConfig({ ...config, quotePrefix: e.target.value })}
                  placeholder="ej. PRES-, COT-, PR-"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Número Inicial / Siguiente
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={config.quoteNextNumber}
                  onChange={(e) => setConfig({ ...config, quoteNextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Cifras mínimas (Padding)
                </label>
                <select
                  value={config.quoteDigits}
                  onChange={(e) => setConfig({ ...config, quoteDigits: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
                >
                  <option value="3">3 cifras (ej. 001)</option>
                  <option value="4">4 cifras (ej. 0001)</option>
                  <option value="5">5 cifras (ej. 00001)</option>
                  <option value="6">6 cifras (ej. 000001)</option>
                  <option value="7">7 cifras (ej. 0000001)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Vista previa en cotizaciones al cliente y PDF:</span>
              <span className="font-mono font-black text-amber-400 bg-slate-950 px-3 py-1 rounded-lg border border-amber-500/30 text-sm">
                {quotePreview}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Valores sugeridos</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isSavedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSavedFeedback ? '¡Guardado con éxito!' : 'Guardar Correlatividad'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

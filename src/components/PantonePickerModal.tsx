import React, { useState, useMemo } from 'react';
import { PANTONE_CATALOG, PantoneColor } from '../utils/pantoneCatalog';
import {
  Search,
  X,
  Palette,
  Sparkles,
  Check,
  Plus,
  Info,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface PantonePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPantone: (pantone: PantoneColor) => void;
  currentColorsCount: number;
  maxColors?: number;
  technologyLabel?: string;
}

export const PantonePickerModal: React.FC<PantonePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectPantone,
  currentColorsCount,
  maxColors = 8,
  technologyLabel = 'Offset / Flexo',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'Todos' },
    { id: 'yellow', label: 'Amarillos (Ej: 100 C)' },
    { id: 'orange', label: 'Naranjas (021 C)' },
    { id: 'red', label: 'Rojos (186 C / 485 C)' },
    { id: 'blue', label: 'Azules (Reflex Blue)' },
    { id: 'green', label: 'Verdes (347 C)' },
    { id: 'purple', label: 'Púrpuras / Violetas' },
    { id: 'metallic', label: 'Metalizados (Oro / Plata)' },
    { id: 'neutral', label: 'Neutros & Blanco' },
  ];

  const filteredPantones = useMemo(() => {
    return PANTONE_CATALOG.filter((item) => {
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(term);
        const matchName = item.name.toLowerCase().includes(term);
        const matchDesc = item.description?.toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchDesc) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const isFull = currentColorsCount >= maxColors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Catálogo Oficial de Tintas Pantone® (PMS)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Hasta 8 Cuerpos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona colores directos especiales para enriquecer tu tirada más allá de la cuatricromía CMYK tradicional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400">Capacidad de máquina ({technologyLabel}):</span>
            <span className={`font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentColorsCount} de {maxColors} cuerpos ocupados
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {isFull
                ? '⚠️ Máquina al límite máximo de 8 estaciones.'
                : `Quedan ${maxColors - currentColorsCount} estaciones disponibles para colores directos o barniz.`}
            </span>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-900/60">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código Pantone o nombre (ej: 100 C, Reflex Blue, 186 C, 871 C Oro, 485 C, Plata)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pantone Swatches Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPantones.map((item) => (
            <div
              key={item.code}
              className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-950 transition-all flex flex-col justify-between gap-2.5 group shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Color Swatch Chip */}
                <div
                  className="w-10 h-10 rounded-xl border border-white/20 shrink-0 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: item.hex }}
                >
                  {item.isMetallic && (
                    <span className="text-[9px] font-bold text-white bg-black/40 px-1 py-0.2 rounded font-mono">
                      MET
                    </span>
                  )}
                </div>

                {/* Color Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-amber-300 text-xs truncate">
                      {item.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.hex}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  Cob. sugerida: {item.recommendedCoveragePercent}%
                </span>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => {
                    onSelectPantone(item);
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isFull
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 active:scale-95'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir a Máquina</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Mostrando <strong className="text-slate-200">{filteredPantones.length}</strong> colores Pantone formulados.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Cerrar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};

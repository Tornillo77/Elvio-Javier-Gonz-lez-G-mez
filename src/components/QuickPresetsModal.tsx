import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Package,
  Disc,
  FileText,
  Sliders,
  Check,
  ChevronRight,
  Layers,
  ShoppingBag,
  Box,
  Tag,
  BookOpen,
  FileSignature,
  Printer,
  Receipt,
  FileCheck2,
  FolderClosed,
  Zap,
} from 'lucide-react';
import {
  JOB_PRESETS,
  PRESET_CATEGORIES,
  JobPresetOption,
  PresetCategory,
  PresetSubCategory,
} from '../utils/presets';
import { PrintTechnology } from '../types/graphic';

interface QuickPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string, manualTech?: PrintTechnology) => void;
  currentPresetId?: string;
  currentTech: PrintTechnology;
}

export const QuickPresetsModal: React.FC<QuickPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  currentPresetId,
  currentTech,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<PresetSubCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualChosenTech, setManualChosenTech] = useState<PrintTechnology>(currentTech);

  if (!isOpen) return null;

  // Filter presets
  const filteredPresets = useMemo(() => {
    return JOB_PRESETS.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesBadge = p.badge.toLowerCase().includes(query);
        const matchesSpecs = p.specsSummary.toLowerCase().includes(query);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesBadge || matchesSpecs || matchesTags;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleApplyPreset = (preset: JobPresetOption) => {
    if (preset.id === 'manual_blank') {
      onSelectPreset(preset.id, manualChosenTech);
    } else {
      onSelectPreset(preset.id);
    }
    onClose();
  };

  // Helper for rendering category icons
  const renderCategoryIcon = (catId: PresetCategory | 'all', size = 'w-4 h-4') => {
    switch (catId) {
      case 'flexo_labels':
        return <Tag className={size} />;
      case 'flexo_packaging':
        return <Disc className={size} />;
      case 'flexo_specialties':
        return <Sparkles className={size} />;
      case 'manual':
        return <Sliders className={size} />;
      default:
        return <Sparkles className={size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Plantillas Rápidas de Flexografía (Bobina)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                  {JOB_PRESETS.length} modelos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga preconfigurada de anchos de bobina, cilindros (Z/DP), pistas, sustratos y clichés flexo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Main Category Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 space-y-3 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto flexo (ej: etiquetas, BOPP, frasco, vino, sleeve, flow-pack, cinta, void, térmico...)"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Primary Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubCategory('all');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Todas ({JOB_PRESETS.length})</span>
            </button>

            {PRESET_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubCategory('all');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                  }`}
                >
                  {renderCategoryIcon(cat.id, 'w-3.5 h-3.5')}
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No se encontraron plantillas</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No hay resultados para "{searchQuery}". Intenta buscar con otros términos como
                "etiqueta", "caja", "recibo", "folleto" o limpia el filtro.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSubCategory('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPresets.map((preset) => {
                const isSelected = currentPresetId === preset.id;
                const isManual = preset.id === 'manual_blank';

                return (
                  <div
                    key={preset.id}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-sky-950/30 border-sky-500/60 shadow-lg shadow-sky-500/10'
                        : isManual
                        ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-400/60'
                        : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            preset.tech === 'offset'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {preset.tech === 'offset' ? 'Offset Pliego' : 'Flexo Bobina'}
                        </span>

                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-medium truncate max-w-[150px]">
                          {preset.badge}
                        </span>
                      </div>

                      {/* Name & Subcategory */}
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                        {preset.name}
                      </h4>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>

                      {/* Technical Specs Summary Pill */}
                      <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="truncate">{preset.specsSummary}</span>
                      </div>

                      {/* Manual Tech Selection if manual_blank */}
                      {isManual && (
                        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-amber-500/30 space-y-1.5">
                          <label className="text-[11px] font-medium text-amber-300 block">
                            Seleccionar tecnología para carga manual:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setManualChosenTech('offset')}
                              className={`py-1 px-2 rounded text-xs font-semibold transition-colors ${
                                manualChosenTech === 'offset'
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Offset (Pliegos)
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualChosenTech('flexo')}
                              className={`py-1 px-2 rounded text-xs font-semibold transition-colors ${
                                manualChosenTech === 'flexo'
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Flexo (Bobina)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 capitalize">
                        {preset.categoryLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                            : isManual
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <span>Cargar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              Sincronización instantánea de imposición, sustratos y cotización
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

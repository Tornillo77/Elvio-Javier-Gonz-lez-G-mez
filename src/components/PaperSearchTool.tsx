import React, { useState, useMemo } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
} from '../types/graphic';
import { PAPER_CATALOG, PaperSubstrate } from '../utils/paperCatalog';
import {
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  Info,
  Check,
  Tag,
  DollarSign,
} from 'lucide-react';

interface PaperSearchToolProps {
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  onChangeOffset: (params: OffsetJobParams) => void;
  onChangeFlexo: (params: FlexoJobParams) => void;
  currency: CurrencyConfig;
}

export const PaperSearchTool: React.FC<PaperSearchToolProps> = ({
  technology,
  offsetParams,
  flexoParams,
  onChangeOffset,
  onChangeFlexo,
  currency,
}) => {
  const isOffset = technology === 'offset';
  const currentPaperName = isOffset ? offsetParams.paperType : flexoParams.substrateType;
  const currentGrammage = isOffset ? offsetParams.grammageGsm : flexoParams.substrateGsm;
  const currentCostKg = isOffset ? offsetParams.paperCostPerKg : flexoParams.substrateCostPerKg;

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedFinish, setSelectedFinish] = useState<string>('ALL');
  const [grammageRange, setGrammageRange] = useState<string>('ALL');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Types list
  const typesList = [
    { id: 'ALL', label: 'Todos los Tipos' },
    { id: 'couché', label: 'Couché / Estucado' },
    { id: 'offset', label: 'Offset / Obra / Bond' },
    { id: 'cartulina', label: 'Cartulinas / Packaging' },
    { id: 'especial', label: 'Especiales / Adhesivos' },
  ];

  // Finishes list
  const finishesList = [
    'ALL',
    'Brillante',
    'Mate',
    'Satinado',
    'Natural',
    'Encapado',
    'Texturado',
  ];

  // Grammage ranges
  const grammageRanges = [
    { id: 'ALL', label: 'Todos los Gramajes', min: 0, max: 1000 },
    { id: 'light', label: 'Liviano (55g - 90g)', min: 50, max: 90 },
    { id: 'medium', label: 'Medio (115g - 170g)', min: 110, max: 175 },
    { id: 'heavy', label: 'Pesado (180g - 250g)', min: 180, max: 255 },
    { id: 'board', label: 'Cartón / Rígido (300g - 400g)', min: 290, max: 450 },
  ];

  // Quick grammage pill targets
  const quickGrammages = [80, 90, 115, 130, 150, 170, 200, 250, 300, 350];

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return PAPER_CATALOG.filter((paper) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = paper.name.toLowerCase().includes(term);
        const matchType = paper.type.toLowerCase().includes(term);
        const matchFinish = paper.finish.toLowerCase().includes(term);
        const matchUses = paper.recommendedUses.toLowerCase().includes(term);
        const matchGsm = paper.grammageGsm.toString().includes(term);
        if (!matchName && !matchType && !matchFinish && !matchUses && !matchGsm) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'ALL' && paper.type !== selectedType) {
        return false;
      }

      // Finish filter
      if (selectedFinish !== 'ALL' && paper.finish !== selectedFinish) {
        return false;
      }

      // Grammage range filter
      if (grammageRange !== 'ALL') {
        const range = grammageRanges.find((r) => r.id === grammageRange);
        if (range && (paper.grammageGsm < range.min || paper.grammageGsm > range.max)) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, selectedType, selectedFinish, grammageRange]);

  const handleSelectPaper = (paper: PaperSubstrate) => {
    if (isOffset) {
      const sheetAreaM2 = (offsetParams.sheetWidthMm * offsetParams.sheetHeightMm) / 1_000_000;
      const sheetWeightKg = (sheetAreaM2 * paper.grammageGsm) / 1000;
      const costPerSheet = Number((sheetWeightKg * paper.costPerKg).toFixed(4));

      onChangeOffset({
        ...offsetParams,
        paperType: paper.name,
        grammageGsm: paper.grammageGsm,
        paperCostPerSheet: costPerSheet,
        paperCostPerKg: paper.costPerKg,
      });

      setAppliedNotification(
        `Papel asignado: ${paper.name} (${paper.grammageGsm} g/m² • ${currency.symbol}${costPerSheet}/pliego)`
      );
    } else {
      onChangeFlexo({
        ...flexoParams,
        substrateType: paper.name,
        substrateGsm: paper.grammageGsm,
        substrateCostPerKg: paper.costPerKg,
      });

      setAppliedNotification(
        `Sustrato asignado: ${paper.name} (${paper.grammageGsm} g/m² • ${currency.symbol}${paper.costPerKg}/kg)`
      );
    }
    setTimeout(() => setAppliedNotification(null), 3000);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedFinish('ALL');
    setGrammageRange('ALL');
  };

  const getTypeBadgeStyle = (type: PaperSubstrate['type']) => {
    switch (type) {
      case 'couché':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'offset':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'cartulina':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'especial':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Buscador & Catálogo de Papeles</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-semibold border border-slate-700">
                {PAPER_CATALOG.length} soportes
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Filtra por gramaje (g/m²), acabado y tipo (couché, offset, cartulina, especial). Al seleccionar uno, se actualiza el presupuesto.
            </p>
          </div>
        </div>

        {/* Current Active Paper Badge */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3 text-xs self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Papel Actual del Trabajo:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="text-amber-400 font-mono">{currentPaperName}</span>
              <span className="text-slate-400 font-mono">({currentGrammage}g)</span>
            </div>
          </div>
          <div className="pl-3 border-l border-slate-800 font-mono text-emerald-400 font-bold">
            {currency.symbol}{currentCostKg}/kg
          </div>
        </div>
      </div>

      {/* Applied Notification */}
      {appliedNotification && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Search Input & Reset Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, gramaje o uso (ej: couché 150, trípticos, cartulina dúplex, 300g, mate)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {(searchTerm || selectedType !== 'ALL' || selectedFinish !== 'ALL' || grammageRange !== 'ALL') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
        {/* 1. Filter by Type (Couché, Offset, Cartulina, etc.) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[11px] pr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Tipo:</span>
          </span>
          {typesList.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-xs border ${
                selectedType === t.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 2. Filter by Grammage Range */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold text-[11px] pr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>Gramaje:</span>
          </span>
          {grammageRanges.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrammageRange(g.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] border ${
                grammageRange === g.id
                  ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {g.label}
            </button>
          ))}

          {/* Quick Grammage direct chips */}
          <div className="hidden lg:flex items-center gap-1 ml-auto font-mono text-[10px]">
            <span className="text-slate-500 font-sans">Acceso rápido:</span>
            {quickGrammages.slice(0, 6).map((gsm) => (
              <button
                key={`quick-${gsm}`}
                type="button"
                onClick={() => {
                  setSearchTerm(`${gsm}g`);
                }}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400 transition-all"
              >
                {gsm}g
              </button>
            ))}
          </div>
        </div>

        {/* 3. Filter by Finish (Brillante, Mate, Satinado, etc.) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold text-[11px] pr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Acabado:</span>
          </span>
          {finishesList.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFinish(f)}
              className={`px-2.5 py-0.5 rounded-lg transition-all text-[11px] border ${
                selectedFinish === f
                  ? 'bg-purple-500 text-slate-950 font-bold border-purple-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'Todos los Acabados' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Mostrando <strong className="text-amber-400 font-mono">{filteredPapers.length}</strong> tipos de papel
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Haz clic en «Asignar Papel» para cargar su gramaje y costo automáticamente al pedido.
        </span>
      </div>

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
          <Info className="w-8 h-8 text-slate-500" />
          <p className="text-slate-300 text-xs font-semibold">
            No se encontraron papeles con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-1 text-xs text-amber-400 hover:underline"
          >
            Limpiar filtros y ver todos los papeles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
          {filteredPapers.map((paper) => {
            const isSelected =
              currentPaperName === paper.name ||
              (currentGrammage === paper.grammageGsm && currentPaperName.toLowerCase().includes(paper.type));

            return (
              <div
                key={paper.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                  isSelected
                    ? 'bg-slate-950 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase border ${getTypeBadgeStyle(
                        paper.type
                      )}`}
                    >
                      {paper.type}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold text-[11px] border border-slate-700">
                      {paper.grammageGsm} g/m²
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-medium border border-purple-500/20">
                      {paper.finish}
                    </span>
                  </div>

                  {/* Title & Uses */}
                  <h4 className="text-sm font-bold text-slate-100">{paper.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {paper.recommendedUses}
                  </p>
                </div>

                {/* Specs Box */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Espesor / Calibre:</span>
                    <span className="font-semibold text-slate-200">
                      ~{(paper.caliperMicrons / 1000).toFixed(2)} mm ({paper.caliperMicrons} µm)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Costo Referencial:</span>
                    <span className="font-bold text-emerald-400">
                      {currency.symbol}{paper.costPerKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPaper(paper)}
                  className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Papel Asignado al Pedido</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      <span>Asignar este Papel</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

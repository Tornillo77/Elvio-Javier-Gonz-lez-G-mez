import React, { useState } from 'react';
import { CurrencyConfig, FinishingProcess } from '../types/graphic';
import {
  POST_PRESS_PROCESSES_CATALOG,
  POST_PRESS_CATEGORIES,
  POST_PRESS_PRESETS,
  PostPressProcessDefinition,
  getCitoMatrixRecommendation,
  CITO_ABACO_URL,
  CITO_STANDARD_MATRIX_TABLE,
} from '../utils/postPressProcesses';
import {
  Scissors,
  Layers,
  Sparkles,
  Sun,
  Maximize2,
  SquareCode,
  ShieldCheck,
  PackageCheck,
  CheckCircle,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Settings2,
  Wrench,
  Check,
  FoldHorizontal,
  Box,
  ExternalLink,
} from 'lucide-react';

interface PostPressFinishingManagerProps {
  finishings: FinishingProcess[];
  onChangeFinishings: (finishings: FinishingProcess[]) => void;
  currency: CurrencyConfig;
  grossSheets?: number;
  quantityUnits?: number;
  totalPaperM2?: number;
  technology?: 'offset' | 'flexo';
}

export const PostPressFinishingManager: React.FC<PostPressFinishingManagerProps> = ({
  finishings,
  onChangeFinishings,
  currency,
  grossSheets = 1000,
  quantityUnits = 5000,
  totalPaperM2 = 700,
  technology = 'offset',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Merge current finishings with master catalog to ensure all 10 processes are available
  const mergedProcesses = POST_PRESS_PROCESSES_CATALOG.map((def) => {
    const existing = finishings.find(
      (f) => f.id === def.id || f.name.toLowerCase().includes(def.name.toLowerCase().slice(0, 10))
    );
    if (existing) {
      return {
        ...def,
        enabled: existing.enabled,
        costType: existing.costType,
        unitCost: existing.unitCost,
        setupCost: existing.setupCost !== undefined ? existing.setupCost : def.setupCost,
        parameters: { ...def.parameters, ...existing.parameters },
      };
    }
    return def;
  });

  const toggleProcess = (id: string) => {
    const current = mergedProcesses.find((p) => p.id === id);
    if (!current) return;
    const newEnabled = !current.enabled;

    const updated = mergedProcesses.map((p) =>
      p.id === id ? { ...p, enabled: newEnabled } : p
    );
    onChangeFinishings(updated);
  };

  const updateProcessField = (
    id: string,
    field: keyof FinishingProcess,
    value: any
  ) => {
    const updated = mergedProcesses.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChangeFinishings(updated);
  };

  const applyPreset = (presetId: string) => {
    const preset = POST_PRESS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const updated = mergedProcesses.map((p) => ({
      ...p,
      enabled: preset.enabledIds.includes(p.id),
    }));
    onChangeFinishings(updated);
  };

  const setAllStatus = (enabled: boolean) => {
    const updated = mergedProcesses.map((p) => ({ ...p, enabled }));
    onChangeFinishings(updated);
  };

  // Calculate live cost for a single process
  const calculateProcessSubtotal = (proc: PostPressProcessDefinition) => {
    if (!proc.enabled) return 0;
    let runCost = 0;
    if (proc.costType === 'per_sheet') {
      runCost = proc.unitCost * grossSheets;
    } else if (proc.costType === 'per_unit') {
      runCost = proc.unitCost * quantityUnits;
    } else if (proc.costType === 'per_m2') {
      runCost = proc.unitCost * totalPaperM2;
    } else if (proc.costType === 'fixed') {
      runCost = proc.unitCost;
    }
    const setup = proc.setupCost && proc.setupCost > 0 ? proc.setupCost : 0;
    return runCost + setup;
  };

  // Filter processes
  const filteredProcesses = mergedProcesses.filter((proc) => {
    if (selectedCategory === 'all') return true;
    return proc.category === selectedCategory;
  });

  // Global KPIs
  const activeCount = mergedProcesses.filter((p) => p.enabled).length;
  const totalFinishCost = mergedProcesses.reduce(
    (acc, p) => acc + calculateProcessSubtotal(p),
    0
  );
  const costPerUnit = quantityUnits > 0 ? totalFinishCost / quantityUnits : 0;

  // Icon mapping
  const renderIcon = (name: string, isActive: boolean) => {
    const iconClass = `w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`;
    switch (name) {
      case 'Scissors':
        return <Scissors className={iconClass} />;
      case 'FoldHorizontal':
        return <FoldHorizontal className={iconClass} />;
      case 'Box':
        return <Box className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'Layers':
        return <Layers className={iconClass} />;
      case 'Sun':
        return <Sun className={iconClass} />;
      case 'Maximize2':
        return <Maximize2 className={iconClass} />;
      case 'SquareCode':
        return <SquareCode className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'PackageCheck':
        return <PackageCheck className={iconClass} />;
      default:
        return <Wrench className={iconClass} />;
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                4. Procesos de Acabado y Terminación Post-Prensa
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                10 Procesos Industriales
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Transformación, embellecimiento, armado estructural y control de calidad para estuches y empaques.
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAllStatus(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all"
          >
            Activar Todos
          </button>
          <button
            type="button"
            onClick={() => setAllStatus(false)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-medium transition-all"
          >
            Desactivar
          </button>
        </div>
      </div>

      {/* Quick Packaging Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5 text-amber-400" />
          Configuraciones Rápidas:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {POST_PRESS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-[11px] font-medium transition-all shadow-sm"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800/80 pb-2">
        {POST_PRESS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List of 10 Post-Press Processes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProcesses.map((proc) => {
          const subtotal = calculateProcessSubtotal(proc);
          const isExpanded = expandedId === proc.id;
          const creasingThicknessMm = proc.parameters?.creasingSubstrateThicknessMm ?? 0.40;
          const creasingMicrons = proc.parameters?.creasingSubstrateMicrons ?? Math.round(creasingThicknessMm * 1000);
          const citoRec = getCitoMatrixRecommendation(creasingThicknessMm);

          return (
            <div
              key={proc.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                proc.enabled
                  ? 'bg-slate-900/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-slate-950/40 border-slate-800/70 opacity-75 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              {/* Card Top: Checkbox, Number Badge, Title, Toggle Expand */}
              <div
                onClick={() => toggleProcess(proc.id)}
                className="p-3 sm:p-3.5 cursor-pointer flex items-start justify-between gap-2.5 select-none"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                      proc.enabled
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {proc.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        #{proc.number}
                      </span>
                      <h4
                        className={`text-xs font-bold leading-snug ${
                          proc.enabled ? 'text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {proc.name}
                      </h4>
                      {proc.englishName && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({proc.englishName})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-mono font-medium block mt-0.5">
                      {proc.badge}
                    </span>
                    {proc.id === 'proc_creasing' && (
                      <span className="inline-flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono text-amber-300 font-semibold">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: citoRec.colorHex }} />
                        Contrahendido: {citoRec.matrixCode} ({creasingThicknessMm.toFixed(2)} mm)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    {renderIcon(proc.iconName, proc.enabled)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : proc.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-200"
                    title="Ver descripción técnica detallada"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Description & Technical Panel (Always visible when expanded) */}
              {isExpanded && (
                <div className="px-3.5 pb-3 pt-2 text-xs text-slate-300 bg-slate-950/80 border-t border-slate-800/80 font-sans space-y-2.5">
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {proc.description}
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-amber-400 font-bold shrink-0 font-mono">▸ Aplicación:</span>
                        <span>{proc.applicationExample}</span>
                      </div>
                      {proc.machinery && (
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-sky-400 font-bold shrink-0 font-mono">▸ Maquinaria:</span>
                          <span>{proc.machinery}</span>
                        </div>
                      )}
                      {proc.tooling && (
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-emerald-400 font-bold shrink-0 font-mono">▸ Matrices / Utillaje:</span>
                          <span>{proc.tooling}</span>
                        </div>
                      )}
                      {proc.qualityCheck && (
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-purple-400 font-bold shrink-0 font-mono">▸ Control Calidad:</span>
                          <span>{proc.qualityCheck}</span>
                        </div>
                      )}
                      {proc.technicalTip && (
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-amber-300 font-bold shrink-0 font-mono">▸ Tip de Taller:</span>
                          <span className="italic text-slate-300">{proc.technicalTip}</span>
                        </div>
                      )}
                      {proc.id === 'proc_creasing' && (
                        <div className="flex items-start gap-1.5 text-slate-200 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                          <span className="text-amber-400 font-bold shrink-0 font-mono">▸ Ábaco CITO:</span>
                          <span>
                            Contrahendido calibrado según espesor del cartón (Ej. cartón 0.40 mm → <strong>0.40 × 1.3 mm</strong>, canal w = 1.5s + fleje). Calibrable en Parametrización Técnica.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Marcado y Hendido Contrahendido Item (Ábaco CITO) */}
              {proc.id === 'proc_creasing' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="px-3.5 py-2.5 bg-slate-950/80 border-t border-slate-800/80 font-sans space-y-2 select-text"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[11px] font-bold text-amber-300 font-mono">
                        Tipo de Contrahendido según Espesor del Cartón (Ábaco CITO Online):
                      </span>
                    </div>
                    <a
                      href={CITO_ABACO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-400 hover:text-amber-200 flex items-center gap-1 underline font-mono shrink-0"
                      title="Consultar Ábaco CITO Online Oficial para cartón compacto"
                    >
                      <span>Ábaco CITO Online</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Carton Thickness Control & Active Contrahendido Result */}
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-amber-500/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                    {/* Input thickness */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-300 font-medium">Espesor Cartón:</span>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.15"
                          max="1.50"
                          value={creasingThicknessMm}
                          onChange={(e) => {
                            const mm = Number(e.target.value);
                            const um = Math.round(mm * 1000);
                            const rec = getCitoMatrixRecommendation(mm);
                            updateProcessField('proc_creasing', 'parameters', {
                              ...proc.parameters,
                              creasingSubstrateThicknessMm: mm,
                              creasingSubstrateMicrons: um,
                              creasingCitoMatrixCode: rec.matrixCode,
                              creasingRuleThicknessPt: rec.ruleThicknessPt,
                            });
                          }}
                          className="w-16 bg-transparent font-mono text-xs text-amber-300 font-bold outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">mm</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">({creasingMicrons} µm)</span>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        {[0.30, 0.40, 0.50, 0.60, 0.70].map((presetMm) => (
                          <button
                            key={presetMm}
                            type="button"
                            onClick={() => {
                              const rec = getCitoMatrixRecommendation(presetMm);
                              updateProcessField('proc_creasing', 'parameters', {
                                ...proc.parameters,
                                creasingSubstrateThicknessMm: presetMm,
                                creasingSubstrateMicrons: Math.round(presetMm * 1000),
                                creasingCitoMatrixCode: rec.matrixCode,
                                creasingRuleThicknessPt: rec.ruleThicknessPt,
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border ${
                              Math.abs(creasingThicknessMm - presetMm) < 0.005
                                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {presetMm.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Contrahendido Badge */}
                    <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-amber-500/40 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20"
                        style={{ backgroundColor: citoRec.colorHex }}
                        title={citoRec.colorName}
                      />
                      <div className="text-left font-mono">
                        <div className="text-[9px] text-slate-400 uppercase leading-none">
                          Contrahendido:
                        </div>
                        <div className="text-xs font-black text-amber-400">
                          {citoRec.matrixCode}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 pl-1 border-l border-slate-800">
                        {citoRec.ruleThicknessPt} pt
                      </span>
                    </div>
                  </div>

                  {/* Example explanation matching user requirement */}
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>
                      💡 <strong className="text-slate-200">Ejemplo:</strong> Cartón de 0.40 mm de espesor, contrahendido de <strong className="text-amber-300">0.40 × 1.3 mm</strong>.
                    </span>
                    <span className="text-slate-500 text-[9px]">{citoRec.colorName} • w = 1.5s + {citoRec.ruleThicknessMm}mm</span>
                  </div>
                </div>
              )}

              {/* Card Bottom: Cost Configuration Controls */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="p-3 bg-slate-950/50 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                {/* Cost Type Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Modalidad:</span>
                  <select
                    value={proc.costType}
                    disabled={!proc.enabled}
                    onChange={(e) =>
                      updateProcessField(proc.id, 'costType', e.target.value)
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 font-mono outline-none disabled:opacity-50"
                  >
                    <option value="per_sheet">Por Pliego</option>
                    <option value="per_unit">Por Estuche / Unid</option>
                    <option value="per_m2">Por m²</option>
                    <option value="fixed">Fijo</option>
                  </select>
                </div>

                {/* Unit Cost & Setup Cost Inputs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5" title="Costo unitario por tirada">
                    <span className="text-[10px] text-slate-400">Costo:</span>
                    <span className="text-slate-400 text-xs font-mono">{currency.symbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={!proc.enabled}
                      value={proc.unitCost}
                      onChange={(e) =>
                        updateProcessField(proc.id, 'unitCost', Number(e.target.value))
                      }
                      className="w-24 sm:w-28 min-w-[85px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-right font-mono text-amber-300 font-bold outline-none focus:border-amber-400 disabled:opacity-50"
                      placeholder={currency.code === 'PYG' ? '1500' : '0.05'}
                    />
                  </div>

                  <div className="flex items-center gap-1.5" title="Costo de matriz, cuño o preparación inicial">
                    <span className="text-[10px] text-slate-500">Prep:</span>
                    <span className="text-slate-500 text-xs font-mono">{currency.symbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={!proc.enabled}
                      value={proc.setupCost || 0}
                      onChange={(e) =>
                        updateProcessField(proc.id, 'setupCost', Number(e.target.value))
                      }
                      className="w-24 sm:w-28 min-w-[85px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-right font-mono text-slate-300 outline-none focus:border-amber-400 disabled:opacity-50"
                      placeholder={currency.code === 'PYG' ? '150000' : '25.00'}
                    />
                  </div>

                  {proc.enabled && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-semibold border border-amber-500/30">
                      ⚙️ Calibrable
                    </span>
                  )}
                </div>

                {/* Live Process Subtotal */}
                {proc.enabled && (
                  <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] font-mono text-slate-400">
                    <span>
                      {proc.costType === 'per_sheet' && `${grossSheets.toLocaleString()} pliegos`}
                      {proc.costType === 'per_unit' && `${quantityUnits.toLocaleString()} unidades`}
                      {proc.costType === 'per_m2' && `${totalPaperM2.toFixed(1)} m²`}
                      {proc.costType === 'fixed' && 'Costo único'}
                      {proc.setupCost ? ` + ${currency.symbol}${proc.setupCost} prep` : ''}
                    </span>
                    <span className="font-bold text-amber-400 text-xs">
                      {currency.symbol}{subtotal.toFixed(currency.decimals)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom KPI & Post-Press Summary Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-300 font-bold block">
              Resumen de Acabados y Post-Prensa ({activeCount} de 10 activos)
            </span>
            <span className="text-[11px] text-slate-400">
              Impacto por estuche / unidad:{' '}
              <strong className="text-amber-300 font-mono">
                +{currency.symbol}{costPerUnit.toFixed(4)}/u
              </strong>
              {' '}• <span className="text-amber-400/90 font-medium">Calibra cobertura UV, velocidad y micras en la sección siguiente</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Total Acabados Post-Prensa
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-400">
              {currency.symbol}{totalFinishCost.toLocaleString(undefined, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

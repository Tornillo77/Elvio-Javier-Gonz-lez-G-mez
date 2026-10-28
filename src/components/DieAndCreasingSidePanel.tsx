import React, { useState, useEffect, useMemo } from 'react';
import { DieAndCreasingConfig } from '../types/graphic';
import {
  PACKAGING_MATERIALS_CATALOG,
  PackagingMaterialDefinition,
  calculateMaterialCaliper,
  calculateCitoProfileForMaterial,
  calculateDieProductionMetrics,
  PRESET_DIE_CREASING_CONFIGS,
  getStoredCustomDieConfigs,
  saveCustomDieConfig,
  deleteCustomDieConfig,
} from '../utils/dieAndCreasing';
import {
  CITO_ABACO_URL,
  CITO_STANDARD_MATRIX_TABLE,
} from '../utils/postPressProcesses';
import {
  Scissors,
  FoldHorizontal,
  X,
  Check,
  Save,
  Download,
  Upload,
  RotateCcw,
  ExternalLink,
  Sliders,
  Layers,
  Wrench,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Gauge,
  Clock,
  Box,
} from 'lucide-react';

interface DieAndCreasingSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPaperType: string;
  currentGrammageGsm: number;
  onChangePaperType?: (type: string, grammage: number) => void;
  activePosesCount: number;
  pieceWidthMm: number;
  pieceHeightMm: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  activeConfig?: DieAndCreasingConfig;
  onApplyConfig: (config: DieAndCreasingConfig) => void;
  currencySymbol?: string;
}

export const DieAndCreasingSidePanel: React.FC<DieAndCreasingSidePanelProps> = ({
  isOpen,
  onClose,
  currentPaperType,
  currentGrammageGsm,
  onChangePaperType,
  activePosesCount,
  pieceWidthMm,
  pieceHeightMm,
  sheetWidthMm,
  sheetHeightMm,
  activeConfig,
  onApplyConfig,
  currencySymbol = '$',
}) => {
  // Panel expansion mode
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'material_cito' | 'die_specs' | 'library'>('material_cito');
  const [notification, setNotification] = useState<string | null>(null);

  // Configuration State
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>(() => {
    if (activeConfig?.materialKey) return activeConfig.materialKey;
    // Guess based on current paper name
    const lower = currentPaperType.toLowerCase();
    if (lower.includes('folding') || lower.includes('cartoncillo')) return 'folding_gc1';
    if (lower.includes('sbs') || lower.includes('celulosa')) return 'sbs_cartulina';
    if (lower.includes('micro') || lower.includes('corrug') || lower.includes('ondulado')) return 'micro_e';
    if (lower.includes('kraft')) return 'kraft_triplex';
    return 'folding_gc1';
  });

  const [grammageGsm, setGrammageGsm] = useState<number>(() => {
    return activeConfig?.grammageGsm || (currentGrammageGsm >= 200 ? currentGrammageGsm : 300);
  });

  const [customCaliperMm, setCustomCaliperMm] = useState<number>(() => {
    return activeConfig?.caliperMm || 0.42;
  });

  const [useCustomCaliper, setUseCustomCaliper] = useState<boolean>(() => {
    return Boolean(activeConfig && activeConfig.caliperMm);
  });

  // Troquel specs
  const [dieType, setDieType] = useState<'flatbed' | 'rotary' | 'semiautomatic'>(
    activeConfig?.dieType || 'flatbed'
  );
  const [dieWoodThicknessMm, setDieWoodThicknessMm] = useState<number>(
    activeConfig?.dieWoodThicknessMm || 18
  );
  const [cuttingRuleThicknessPt, setCuttingRuleThicknessPt] = useState<number>(
    activeConfig?.cuttingRuleThicknessPt || 2
  );
  const [creasingRuleThicknessPt, setCreasingRuleThicknessPt] = useState<number>(
    activeConfig?.creasingRuleThicknessPt || 2
  );
  const [nicksCountPerPiece, setNicksCountPerPiece] = useState<number>(
    activeConfig?.nicksCountPerPiece || 4
  );
  const [ejectionRubberType, setEjectionRubberType] = useState<'sponge_rubber' | 'vulcollan' | 'profile_rubber'>(
    activeConfig?.ejectionRubberType || 'profile_rubber'
  );
  const [creasingSystem, setCreasingSystem] = useState<'cito' | 'pertinax' | 'channel_steel'>(
    activeConfig?.creasingSystem || 'cito'
  );
  const [citoSeries, setCitoSeries] = useState<string>(
    activeConfig?.citoSeries || 'CITO PRO'
  );

  // Custom presets saved by user
  const [customConfigs, setCustomConfigs] = useState<DieAndCreasingConfig[]>([]);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Sync stored custom configs on mount
  useEffect(() => {
    if (isOpen) {
      setCustomConfigs(getStoredCustomDieConfigs());
    }
  }, [isOpen]);

  // If paper type or grammage changes from parent while panel is open and user hasn't overridden
  useEffect(() => {
    if (!activeConfig && currentGrammageGsm >= 150) {
      setGrammageGsm(currentGrammageGsm);
    }
  }, [currentGrammageGsm, activeConfig]);

  // Derived Caliper & Corrugation
  const { caliperMm, caliperMicrons, isCorrugated } = useMemo(() => {
    return calculateMaterialCaliper(
      selectedMaterialKey,
      grammageGsm,
      useCustomCaliper ? customCaliperMm : undefined
    );
  }, [selectedMaterialKey, grammageGsm, useCustomCaliper, customCaliperMm]);

  // Keep customCaliperMm in sync when automatic calculation is active
  useEffect(() => {
    if (!useCustomCaliper) {
      setCustomCaliperMm(caliperMm);
    }
  }, [caliperMm, useCustomCaliper]);

  // Automatic CITO calculations
  const citoCalculations = useMemo(() => {
    return calculateCitoProfileForMaterial(caliperMm, isCorrugated, creasingRuleThicknessPt);
  }, [caliperMm, isCorrugated, creasingRuleThicknessPt]);

  // Automatic Die Production Metrics (Meters, Tonnage, Costs)
  const productionMetrics = useMemo(() => {
    return calculateDieProductionMetrics({
      posesCount: activePosesCount,
      pieceWidthMm,
      pieceHeightMm,
      sheetWidthMm,
      sheetHeightMm,
      caliperMm,
      isCorrugated,
    });
  }, [activePosesCount, pieceWidthMm, pieceHeightMm, sheetWidthMm, sheetHeightMm, caliperMm, isCorrugated]);

  // Material Object
  const currentMaterialDef = useMemo(() => {
    return PACKAGING_MATERIALS_CATALOG.find((m) => m.key === selectedMaterialKey) || PACKAGING_MATERIALS_CATALOG[0];
  }, [selectedMaterialKey]);

  // Construct current working DieAndCreasingConfig
  const currentConfig: DieAndCreasingConfig = useMemo(() => {
    return {
      id: activeConfig?.id || `die_${Date.now()}`,
      name: activeConfig?.name || `Troquel para ${currentMaterialDef.name.split('(')[0].trim()} (${caliperMm} mm)`,
      description: `Troquel plano láser con contrahendidos CITO ${citoCalculations.citoRec.matrixCode} para ${caliperMm} mm`,
      materialKey: selectedMaterialKey,
      materialName: currentMaterialDef.name,
      caliperMm,
      caliperMicrons,
      grammageGsm,
      dieType,
      dieWoodThicknessMm,
      cuttingRuleHeightMm: citoCalculations.cuttingRuleHeightMm,
      cuttingRuleThicknessPt,
      creasingRuleHeightMm: citoCalculations.creasingRuleHeightMm,
      creasingRuleThicknessPt,
      nicksCountPerPiece,
      ejectionRubberType,
      creasingSystem,
      citoSeries,
      citoMatrixCode: citoCalculations.citoRec.matrixCode,
      citoDepthMm: citoCalculations.citoRec.depthMm,
      citoWidthMm: citoCalculations.citoRec.widthMm,
      citoColorHex: citoCalculations.citoRec.colorHex,
      citoColorName: citoCalculations.citoRec.colorName,
      linearMetersCuttingPerSheet: productionMetrics.linearMetersCuttingPerSheet,
      linearMetersCreasingPerSheet: productionMetrics.linearMetersCreasingPerSheet,
      recommendedTonnageTon: productionMetrics.recommendedTonnageTon,
      dieCostEstimate: productionMetrics.dieCostEstimate,
      pertinaxMatrixCostEstimate: productionMetrics.pertinaxMatrixCostEstimate,
      citoMetersRequired: productionMetrics.citoMetersRequired,
      estimatedMakeReadyMinutes: productionMetrics.estimatedMakeReadyMinutes,
      isCustom: true,
    };
  }, [
    activeConfig,
    currentMaterialDef,
    caliperMm,
    caliperMicrons,
    grammageGsm,
    selectedMaterialKey,
    dieType,
    dieWoodThicknessMm,
    cuttingRuleThicknessPt,
    creasingRuleThicknessPt,
    nicksCountPerPiece,
    ejectionRubberType,
    creasingSystem,
    citoSeries,
    citoCalculations,
    productionMetrics,
  ]);

  // Load a preset
  const handleLoadPreset = (preset: DieAndCreasingConfig) => {
    setSelectedMaterialKey(preset.materialKey);
    setGrammageGsm(preset.grammageGsm);
    setCustomCaliperMm(preset.caliperMm);
    setUseCustomCaliper(true);
    setDieType(preset.dieType);
    setDieWoodThicknessMm(preset.dieWoodThicknessMm);
    setCuttingRuleThicknessPt(preset.cuttingRuleThicknessPt);
    setCreasingRuleThicknessPt(preset.creasingRuleThicknessPt);
    setNicksCountPerPiece(preset.nicksCountPerPiece);
    setEjectionRubberType(preset.ejectionRubberType);
    setCreasingSystem(preset.creasingSystem);
    setCitoSeries(preset.citoSeries);

    setNotification(`¡Plantilla "${preset.name}" cargada con éxito!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Apply to job & parent calculator
  const handleApplyToJob = () => {
    onApplyConfig(currentConfig);
    // Optionally sync paper type and grammage with OffsetCalculator
    if (onChangePaperType) {
      onChangePaperType(currentMaterialDef.name, grammageGsm);
    }
    setNotification('¡Troquel y perfiles de hendido CITO aplicados a la orden y acabados!');
    setTimeout(() => {
      setNotification(null);
      onClose();
    }, 1200);
  };

  // Save current as custom preset
  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveNameInput.trim()) return;

    const newSaved: DieAndCreasingConfig = {
      ...currentConfig,
      id: `custom_die_${Date.now()}`,
      name: saveNameInput.trim(),
      isCustom: true,
    };

    const updatedList = saveCustomDieConfig(newSaved);
    setCustomConfigs(updatedList);
    setSaveNameInput('');
    setShowSaveModal(false);
    setNotification(`¡Configuración "${newSaved.name}" guardada en la biblioteca!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Delete custom preset
  const handleDeleteCustom = (id: string, name: string) => {
    if (confirm(`¿Eliminar la configuración personalizada "${name}"?`)) {
      const updated = deleteCustomDieConfig(id);
      setCustomConfigs(updated);
      setNotification('Configuración eliminada de la biblioteca');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  // Export JSON specification for die-maker
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `troquel_cito_${currentConfig.citoMatrixCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotification('Ficha técnica JSON de troquel descargada');
    setTimeout(() => setNotification(null), 3000);
  };

  // Import JSON configuration
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as DieAndCreasingConfig;
        if (parsed.materialKey && parsed.caliperMm) {
          handleLoadPreset(parsed);
          setNotification('¡Configuración de troquel importada correctamente!');
        } else {
          alert('El archivo JSON no tiene la estructura de troquel válida');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Drawer Container */}
      <div
        className={`relative z-10 bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col h-full transition-all duration-300 ease-in-out ${
          isMaximized ? 'w-full max-w-5xl' : 'w-full max-w-2xl sm:max-w-xl md:max-w-2xl'
        }`}
      >
        {/* 1. Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                  Troqueles & Contrahendidos CITO
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 shrink-0">
                  Ábaco Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Cálculo automático de hendido según espesor y fleje de corte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMaximized ? 'Restaurar ancho estándar' : 'Maximizar panel'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
              title="Cerrar panel lateral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 flex items-center justify-between font-mono animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Navigation Tabs */}
        <div className="px-4 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('material_cito')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                activeTab === 'material_cito'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Material & CITO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('die_specs')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                activeTab === 'die_specs'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Troquel & Presión</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Plantillas ({customConfigs.length + PRESET_DIE_CREASING_CONFIGS.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 border border-slate-700"
              title="Descargar especificación técnica en formato JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>
            <label
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Importar archivo JSON de troquel"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cargar JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* 3. Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* ============================================================== */}
          {/* TAB 1: MATERIAL & CALCULO CITO                                 */}
          {/* ============================================================== */}
          {activeTab === 'material_cito' && (
            <div className="space-y-5">
              {/* Material Selection Card */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                      1. Tipo de Material & Gramaje
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Sincronizado con Trabajo
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Selecciona el soporte de packaging o cartoncillo para deducir el calibre (espesor) y vincularlo al perfil de hendido.
                </p>

                {/* Substrate Selector */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Sustrato de Packaging:
                  </label>
                  <select
                    value={selectedMaterialKey}
                    onChange={(e) => {
                      setSelectedMaterialKey(e.target.value);
                      const targetMat = PACKAGING_MATERIALS_CATALOG.find((m) => m.key === e.target.value);
                      if (targetMat && targetMat.standardGrammages.length > 0) {
                        setGrammageGsm(targetMat.standardGrammages[0]);
                      }
                      setUseCustomCaliper(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:border-amber-500 outline-none"
                  >
                    {PACKAGING_MATERIALS_CATALOG.map((mat) => (
                      <option key={mat.key} value={mat.key}>
                        {mat.name} {mat.isCorrugated ? '(Microcanal)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {currentMaterialDef.description}
                  </span>
                </div>

                {/* Grammage & Caliper Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  {/* Grammage */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Gramaje (g/m²):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={100}
                        max={1000}
                        step={5}
                        value={grammageGsm}
                        onChange={(e) => {
                          setGrammageGsm(Number(e.target.value));
                          setUseCustomCaliper(false);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:border-amber-500 outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono">g/m²</span>
                    </div>

                    {/* Standard Grammage Chips */}
                    {currentMaterialDef.standardGrammages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {currentMaterialDef.standardGrammages.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setGrammageGsm(g);
                              setUseCustomCaliper(false);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              grammageGsm === g
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {g}g
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Caliper in mm & Micras */}
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-300">
                        Espesor / Calibre ($c$):
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {caliperMm.toFixed(2)} mm ({caliperMicrons} µm)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          step={0.01}
                          min={0.15}
                          max={3.00}
                          value={caliperMm}
                          onChange={(e) => {
                            setCustomCaliperMm(Number(e.target.value));
                            setUseCustomCaliper(true);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold outline-none"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">mm</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>{useCustomCaliper ? 'Manual' : 'Volumen teórico'}:</span>
                      <button
                        type="button"
                        onClick={() => setUseCustomCaliper(false)}
                        className="text-amber-400 hover:text-amber-300 underline"
                      >
                        Recalcular auto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic CITO Matrix Recommendation Card */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-xl border border-amber-500/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <FoldHorizontal className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider">
                        2. Perfil de Contrahendido CITO Recomendado
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Determinación exacta según la norma técnica del Ábaco CITO
                      </p>
                    </div>
                  </div>

                  <a
                    href={CITO_ABACO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-200 flex items-center gap-1 font-mono underline self-start sm:self-auto"
                  >
                    <span>Ábaco CITO Online</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Highlight Matrix Badge */}
                <div className="bg-slate-950/90 border border-amber-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                  <div className="flex items-center gap-3.5">
                    <span
                      className="w-7 h-7 rounded-full shrink-0 border-2 border-white/20 shadow-md"
                      style={{ backgroundColor: citoCalculations.citoRec.colorHex }}
                      title={`Color identificativo CITO: ${citoCalculations.citoRec.colorName}`}
                    />
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                        Matriz Comercial CITO [Profundidad × Ancho]
                      </span>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                        {citoCalculations.citoRec.matrixCode}
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        Color: <strong className="text-amber-300">{citoCalculations.citoRec.colorName}</strong> • Fleje de hendido: {creasingRuleThicknessPt} pt ({citoCalculations.ruleThicknessMm} mm)
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                    <span className="text-[10px] text-slate-400 font-mono block">Serie aconsejada:</span>
                    <span className="text-xs font-bold font-mono text-emerald-400 block">
                      {citoSeries}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Base plástica con adhesivo de alta adherencia
                    </span>
                  </div>
                </div>

                {/* Formula Breakdown Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Profundidad ($h$):</span>
                    <span className="text-sm font-bold text-slate-100">
                      {citoCalculations.theoreticalDepthMm} mm
                    </span>
                    <span className="text-[9px] text-slate-500 block">Igual al calibre ($c$)</span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Ancho Teórico ($w$):</span>
                    <span className="text-sm font-bold text-amber-300">
                      {citoCalculations.theoreticalWidthMm} mm
                    </span>
                    <span className="text-[9px] text-slate-500 block">$(1.5 \times c) + t$</span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Altura Fleje Hendido:</span>
                    <span className="text-sm font-bold text-sky-400">
                      {citoCalculations.creasingRuleHeightMm} mm
                    </span>
                    <span className="text-[9px] text-slate-500 block">Corte (23.80) - $h$</span>
                  </div>
                </div>

                {/* Technical Rule formula string */}
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Fórmula de cálculo:</span>
                  <span className="text-amber-300 font-bold">{citoCalculations.formulaDescription}</span>
                </div>

                {/* Soporte de Contrahendido Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Sistema de Contrahendido:
                    </label>
                    <select
                      value={creasingSystem}
                      onChange={(e) => setCreasingSystem(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none"
                    >
                      <option value="cito">Contrahendido CITO Adhesivo (Tiradas medias y altas)</option>
                      <option value="pertinax">Contraplaca de Pertinax Fresado CNC (Larga duración)</option>
                      <option value="channel_steel">Placa de hendido de acero templado fresada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Línea Comercial CITO:
                    </label>
                    <select
                      value={citoSeries}
                      onChange={(e) => setCitoSeries(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none"
                    >
                      <option value="CITO PRO">CITO PRO (Base sintética blanca, máxima precisión)</option>
                      <option value="CITO DYNAMIC">CITO DYNAMIC (Uso universal estándar en packaging)</option>
                      <option value="CITO ULTIMATE">CITO ULTIMATE (Recubrimiento especial anti-desgaste)</option>
                      <option value="CITO BASIC">CITO BASIC (Económico para tiradas cortas)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Table of CITO Correspondence */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      Tabla de Calibres Normalizados CITO
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Haz clic para fijar calibre directo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 font-mono text-[11px]">
                  {CITO_STANDARD_MATRIX_TABLE.map((row) => {
                    const isSelected = caliperMm >= row.minMm && caliperMm <= row.maxMm;
                    return (
                      <button
                        key={row.matrixCode}
                        type="button"
                        onClick={() => {
                          const mid = (row.minMm + row.maxMm) / 2;
                          const target = Number(row.thicknessDisplay.split(' ')[0]) || mid;
                          setCustomCaliperMm(target);
                          setUseCustomCaliper(true);
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">{row.thicknessDisplay}</span>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: row.colorHex }}
                            title={row.colorName}
                          />
                        </div>
                        <div className="font-bold text-slate-100 mt-1 text-xs">{row.matrixCode}</div>
                        <span className="text-[9px] text-slate-500 block truncate">{row.colorName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ESPECIFICACIONES DE TROQUEL & PRESIÓN                   */}
          {/* ============================================================== */}
          {activeTab === 'die_specs' && (
            <div className="space-y-5">
              {/* Die Wood & Blades */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    Estructura del Troquel Plano (Die-Board)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Tipo de Troquel:
                    </label>
                    <select
                      value={dieType}
                      onChange={(e) => setDieType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                    >
                      <option value="flatbed">Troquel Plano Automático (Bobst / Iberica / Heidelberg)</option>
                      <option value="semiautomatic">Troquel Plano Manual / Semiautomático (Minerva)</option>
                      <option value="rotary">Troquel Cilíndrico Rotativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Espesor Madera Base Multiplex:
                    </label>
                    <select
                      value={dieWoodThicknessMm}
                      onChange={(e) => setDieWoodThicknessMm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                    >
                      <option value={18}>18 mm (Multiplex de abedul cortado por láser CNC - Estándar)</option>
                      <option value={15}>15 mm (Madera liviana para tiradas cortas o manuales)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Calibre Cuchilla de Corte:
                    </label>
                    <select
                      value={cuttingRuleThicknessPt}
                      onChange={(e) => setCuttingRuleThicknessPt(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                    >
                      <option value={2}>2 pt (0.71 mm) - Altura estándar 23.80 mm</option>
                      <option value={3}>3 pt (1.05 mm) - Para cartón corrugado o microcanal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Calibre Fleje de Hendido:
                    </label>
                    <select
                      value={creasingRuleThicknessPt}
                      onChange={(e) => setCreasingRuleThicknessPt(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                    >
                      <option value={2}>2 pt (0.71 mm) - Altura calculada {citoCalculations.creasingRuleHeightMm} mm</option>
                      <option value={3}>3 pt (1.05 mm) - Altura calculada {citoCalculations.creasingRuleHeightMm} mm</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Puntos de Unión (Nicks) por Pose:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={nicksCountPerPiece}
                        onChange={(e) => setNicksCountPerPiece(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">puentes</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Micro-uniones para retener las poses en el pliego sin soltarse en máquina.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Gomas Expulsoras (Ejection):
                    </label>
                    <select
                      value={ejectionRubberType}
                      onChange={(e) => setEjectionRubberType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono outline-none"
                    >
                      <option value="profile_rubber">Perfilada CITO / D-Profile (Alta velocidad)</option>
                      <option value="vulcollan">Vulcollan / Poliuretano de alta densidad</option>
                      <option value="sponge_rubber">Goma esponja celular estándar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Machine Production Metrics & Cost Estimation */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                      Métricas de Taller & Estimación de Troquelado
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                    {activePosesCount} poses activas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Metros Fleje Corte:</span>
                    <span className="text-sm font-bold text-slate-100">
                      {productionMetrics.linearMetersCuttingPerSheet} m
                    </span>
                    <span className="text-[9px] text-slate-500 block">por pliego</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Metros Fleje Hendido:</span>
                    <span className="text-sm font-bold text-amber-300">
                      {productionMetrics.linearMetersCreasingPerSheet} m
                    </span>
                    <span className="text-[9px] text-slate-500 block">por pliego</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Presión Máquina (Tn):</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {productionMetrics.recommendedTonnageTon} Tn
                    </span>
                    <span className="text-[9px] text-slate-500 block">Fuerza estimada</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Arreglo Troqueladora:</span>
                    <span className="text-sm font-bold text-sky-400">
                      {productionMetrics.estimatedMakeReadyMinutes} min
                    </span>
                    <span className="text-[9px] text-slate-500 block">Puesta a punto</span>
                  </div>
                </div>

                {/* Costs breakdown */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Costo Fabricación Troquel:</span>
                    <span className="text-base font-bold text-amber-400">
                      {currencySymbol}{productionMetrics.dieCostEstimate.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Base láser + flejes templados</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Contraplaca Pertinax CNC:</span>
                    <span className="text-base font-bold text-slate-200">
                      {currencySymbol}{productionMetrics.pertinaxMatrixCostEstimate.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Fresada a registro</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Consumible CITO:</span>
                    <span className="text-base font-bold text-emerald-400">
                      {productionMetrics.citoMetersRequired} m
                    </span>
                    <span className="text-[10px] text-slate-500 block">Tiras CITO {citoCalculations.citoRec.matrixCode}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: BIBLIOTECA DE PLANTILLAS Y CONFIGURACIONES             */}
          {/* ============================================================== */}
          {activeTab === 'library' && (
            <div className="space-y-5">
              {/* Save Current as New Preset Form */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                      Guardar Configuración Actual como Personalizada
                    </h4>
                  </div>
                </div>

                <form onSubmit={handleSaveCustom} className="flex gap-2">
                  <input
                    type="text"
                    value={saveNameInput}
                    onChange={(e) => setSaveNameInput(e.target.value)}
                    placeholder="Nombre del troquel (ej: Estuche Jarabe 150ml Folding 320g)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!saveNameInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </form>
              </div>

              {/* User Saved Presets */}
              {customConfigs.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">
                      Tus Configuraciones Guardadas ({customConfigs.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {customConfigs.map((cfg) => (
                      <div
                        key={cfg.id}
                        className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-100 truncate">{cfg.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                              {cfg.citoMatrixCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {cfg.materialName} ({cfg.caliperMm} mm) • Fleje {cfg.cuttingRuleThicknessPt} pt
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleLoadPreset(cfg)}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                          >
                            Cargar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(cfg.id, cfg.name)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Eliminar de biblioteca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Factory Built-in Presets */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">
                  Plantillas Industriales Preconfiguradas (CITO Estándar)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_DIE_CREASING_CONFIGS.map((preset) => (
                    <div
                      key={preset.id}
                      className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-amber-500/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-slate-100 group-hover:text-amber-300 transition-colors">
                            {preset.name}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                            style={{ backgroundColor: preset.citoColorHex }}
                            title={preset.citoColorName}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono text-[10px]">
                        <span className="text-amber-400 font-bold">
                          CITO {preset.citoMatrixCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold transition-all"
                        >
                          Cargar Plantilla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Bottom Action Bar (Fixed Footer) */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-slate-400">Perfil activo:</span>
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: citoCalculations.citoRec.colorHex }}
              />
              <span>CITO {citoCalculations.citoRec.matrixCode}</span>
            </span>
            <span className="text-slate-500">({caliperMm} mm)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex-1 sm:flex-initial"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyToJob}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all flex-1 sm:flex-initial"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar al Trabajo & Cotización</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

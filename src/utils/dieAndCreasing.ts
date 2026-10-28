import { DieAndCreasingConfig } from '../types/graphic';
import {
  CITO_STANDARD_MATRIX_TABLE,
  CITO_ABACO_URL,
  CitoMatrixRecommendation,
  getCitoMatrixRecommendation,
} from './postPressProcesses';

export interface PackagingMaterialDefinition {
  key: string;
  name: string;
  category: 'folding' | 'micro_corrugated' | 'compact_board' | 'paper';
  description: string;
  standardGrammages: number[];
  volumeFactorCm3PerG: number; // Factor de volumen específico para calcular espesor: Caliper (mm) = Gramaje (g/m²) * Factor / 1000
  defaultCaliperMm: number; // Caliper por defecto para gramaje típico
  isCorrugated?: boolean;
}

// Catálogo de Materiales Típicos de Packaging y Artes Gráficas
export const PACKAGING_MATERIALS_CATALOG: PackagingMaterialDefinition[] = [
  {
    key: 'folding_gc1',
    name: 'Cartoncillo Folding GC1 (Doble estucado cara, estucado reverso)',
    category: 'folding',
    description: 'Cartón fibra virgen de alta rigidez para cosmética, farmacia y packaging de lujo.',
    standardGrammages: [230, 250, 280, 300, 325, 350, 380, 400],
    volumeFactorCm3PerG: 1.42, // Caliper = 300 * 1.42 / 1000 = 0.426 mm
    defaultCaliperMm: 0.42,
  },
  {
    key: 'folding_gc2',
    name: 'Cartoncillo Folding GC2 (Estucado cara, reverso madera blanqueada)',
    category: 'folding',
    description: 'Excelente volumen y rigidez específica, ideal para alimentación seca y productos de consumo.',
    standardGrammages: [230, 250, 280, 300, 330, 350, 380],
    volumeFactorCm3PerG: 1.50, // Gran volumen específico
    defaultCaliperMm: 0.45,
  },
  {
    key: 'sbs_cartulina',
    name: 'Cartulina SBS / GZ (Pura Celulosa Blanqueada)',
    category: 'folding',
    description: 'Blancura excepcional en masa y ambas caras, máxima pureza para perfumería y confitería.',
    standardGrammages: [240, 270, 300, 330, 360, 400],
    volumeFactorCm3PerG: 1.25, // Mayor densidad, menor espesor por gramo
    defaultCaliperMm: 0.38,
  },
  {
    key: 'kraft_triplex',
    name: 'Cartoncillo Triplex con Reverso Kraft / Marrón',
    category: 'folding',
    description: 'Aspecto ecológico/artesanal y alta resistencia al rasgado mecánico para empaques sostenibles.',
    standardGrammages: [250, 300, 350, 400, 450],
    volumeFactorCm3PerG: 1.38,
    defaultCaliperMm: 0.41,
  },
  {
    key: 'micro_e',
    name: 'Microcanal Onda E (Cartón Ondulado Micro-Flute 1.5 mm)',
    category: 'micro_corrugated',
    description: 'Onda fina compacta de gran resistencia al aplastamiento (ECT/FCT) para estuches y e-commerce.',
    standardGrammages: [380, 420, 460, 520],
    volumeFactorCm3PerG: 3.50, // Nominal onda
    defaultCaliperMm: 1.50,
    isCorrugated: true,
  },
  {
    key: 'micro_f',
    name: 'Microcanal Onda F / N (Nano-Corrugado 0.9 mm)',
    category: 'micro_corrugated',
    description: 'Perfil micro-ondulado ultra-delgado sustitutivo de folding pesado para bandejas y cajas premium.',
    standardGrammages: [320, 360, 400],
    volumeFactorCm3PerG: 2.50,
    defaultCaliperMm: 0.90,
    isCorrugated: true,
  },
  {
    key: 'micro_b',
    name: 'Cartón Ondulado Onda B (3.0 mm)',
    category: 'micro_corrugated',
    description: 'Onda estándar para cajas de expedición, displays de punto de venta y embalaje protector.',
    standardGrammages: [450, 500, 600],
    volumeFactorCm3PerG: 6.00,
    defaultCaliperMm: 2.80,
    isCorrugated: true,
  },
  {
    key: 'couche_heavy',
    name: 'Papel Couché / Esmaltado Pesado (Doble Cara)',
    category: 'paper',
    description: 'Para carpetas corporativas, dípticos con lomo hendido y fundas promocionales.',
    standardGrammages: [250, 300, 350],
    volumeFactorCm3PerG: 0.92,
    defaultCaliperMm: 0.28,
  },
  {
    key: 'offset_heavy',
    name: 'Papel Offset / Obra Extra (Sin Estucar)',
    category: 'paper',
    description: 'Papel absorbente de alta porosidad para carpetas institucionales y dossiers.',
    standardGrammages: [200, 240, 300],
    volumeFactorCm3PerG: 1.20,
    defaultCaliperMm: 0.29,
  },
];

/**
 * Calcula el calibre (espesor en mm y micras) a partir del material y el gramaje
 */
export function calculateMaterialCaliper(
  materialKey: string,
  grammageGsm: number,
  customCaliperMm?: number
): { caliperMm: number; caliperMicrons: number; isCorrugated: boolean } {
  if (customCaliperMm && customCaliperMm > 0) {
    return {
      caliperMm: Number(customCaliperMm.toFixed(3)),
      caliperMicrons: Math.round(customCaliperMm * 1000),
      isCorrugated: materialKey.startsWith('micro_'),
    };
  }

  const mat = PACKAGING_MATERIALS_CATALOG.find((m) => m.key === materialKey);
  if (!mat) {
    // Estimación empírica estándar: 1 g/m2 aprox 0.0013 mm
    const estMm = Number(((grammageGsm * 1.35) / 1000).toFixed(3));
    return {
      caliperMm: Math.max(0.15, estMm),
      caliperMicrons: Math.round(Math.max(0.15, estMm) * 1000),
      isCorrugated: false,
    };
  }

  if (mat.isCorrugated) {
    return {
      caliperMm: mat.defaultCaliperMm,
      caliperMicrons: Math.round(mat.defaultCaliperMm * 1000),
      isCorrugated: true,
    };
  }

  const calculatedMm = Number(((grammageGsm * mat.volumeFactorCm3PerG) / 1000).toFixed(3));
  return {
    caliperMm: Math.max(0.15, calculatedMm),
    caliperMicrons: Math.round(Math.max(0.15, calculatedMm) * 1000),
    isCorrugated: false,
  };
}

/**
 * Realiza el cálculo del perfil de hendido CITO específico para el sustrato
 */
export function calculateCitoProfileForMaterial(
  caliperMm: number,
  isCorrugated: boolean = false,
  ruleThicknessPt: number = 2 // 2 pt = 0.71 mm, 3 pt = 1.05 mm
): {
  citoRec: CitoMatrixRecommendation;
  theoreticalWidthMm: number;
  theoreticalDepthMm: number;
  creasingRuleHeightMm: number; // Altura de la pleca de hendido en el troquel
  cuttingRuleHeightMm: number; // 23.80 mm
  ruleThicknessMm: number;
  formulaDescription: string;
} {
  const cuttingRuleHeightMm = 23.80;
  const ruleThicknessMm = ruleThicknessPt === 3 ? 1.05 : 0.71;

  let theoreticalDepthMm: number;
  let theoreticalWidthMm: number;
  let formulaDescription: string;

  if (isCorrugated) {
    // Fórmula para Cartón Ondulado Microcanal (E / F):
    // Profundidad = Calibre * 0.60
    // Ancho = (2.0 * Calibre) + Espesor fleje
    theoreticalDepthMm = Number((caliperMm * 0.60).toFixed(2));
    theoreticalWidthMm = Number(((2.0 * caliperMm) + ruleThicknessMm).toFixed(2));
    formulaDescription = `Microcanal: h = 0.60 × c (${theoreticalDepthMm} mm) | w = (2.0 × c) + t (${theoreticalWidthMm} mm)`;
  } else {
    // Fórmula oficial Ábaco CITO para Cartón Compacto / Folding:
    // Profundidad h = Espesor del cartón c
    // Ancho canal w = (1.5 × Espesor del cartón c) + Espesor del fleje de hendido t
    theoreticalDepthMm = Number(caliperMm.toFixed(2));
    theoreticalWidthMm = Number(((1.5 * caliperMm) + ruleThicknessMm).toFixed(2));
    formulaDescription = `Cartón Compacto / Folding: h = c (${theoreticalDepthMm} mm) | w = (1.5 × c) + t (${theoreticalWidthMm} mm)`;
  }

  // Altura del fleje de hendido en troquel: Altura de corte (23.80) - Profundidad (h)
  const creasingRuleHeightMm = Number((cuttingRuleHeightMm - theoreticalDepthMm).toFixed(2));

  // Buscar coincidencia comercial en la tabla CITO
  const citoRec = getCitoMatrixRecommendation(caliperMm);

  return {
    citoRec,
    theoreticalWidthMm,
    theoreticalDepthMm,
    creasingRuleHeightMm,
    cuttingRuleHeightMm,
    ruleThicknessMm,
    formulaDescription,
  };
}

/**
 * Presets preconfigurados de Troqueles y Contrahendidos de Fábrica
 */
export const PRESET_DIE_CREASING_CONFIGS: DieAndCreasingConfig[] = [
  {
    id: 'preset_folding_standard_300',
    name: 'Estuche Plegable Estándar (Folding 300g / 0.42 mm)',
    description: 'Configuración óptima para estuches de farmacia, suplementos y consumo masivo con pleca 2 pt.',
    materialKey: 'folding_gc1',
    materialName: 'Cartoncillo Folding GC1',
    caliperMm: 0.42,
    caliperMicrons: 420,
    grammageGsm: 300,
    dieType: 'flatbed',
    dieWoodThicknessMm: 18,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 2,
    creasingRuleHeightMm: 23.38,
    creasingRuleThicknessPt: 2,
    nicksCountPerPiece: 4,
    ejectionRubberType: 'profile_rubber',
    creasingSystem: 'cito',
    citoSeries: 'CITO PRO',
    citoMatrixCode: '0.40 × 1.3 mm',
    citoDepthMm: 0.40,
    citoWidthMm: 1.30,
    citoColorHex: '#eab308',
    citoColorName: 'Amarillo CITO',
    linearMetersCuttingPerSheet: 6.8,
    linearMetersCreasingPerSheet: 4.2,
    recommendedTonnageTon: 140,
    dieCostEstimate: 165.0,
    pertinaxMatrixCostEstimate: 45.0,
    citoMetersRequired: 45,
    estimatedMakeReadyMinutes: 25,
    isCustom: false,
  },
  {
    id: 'preset_cosmetic_sbs_350',
    name: 'Packaging Cosmética Premium (SBS 350g / 0.45 mm)',
    description: 'Máxima exigencia de acabado sin rotura de fibra en tintas oscuras. Contrahendido CITO ULTIMATE.',
    materialKey: 'sbs_cartulina',
    materialName: 'Cartulina SBS / GZ',
    caliperMm: 0.45,
    caliperMicrons: 450,
    grammageGsm: 350,
    dieType: 'flatbed',
    dieWoodThicknessMm: 18,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 2,
    creasingRuleHeightMm: 23.35,
    creasingRuleThicknessPt: 2,
    nicksCountPerPiece: 3,
    ejectionRubberType: 'vulcollan',
    creasingSystem: 'cito',
    citoSeries: 'CITO ULTIMATE',
    citoMatrixCode: '0.45 × 1.4 mm',
    citoDepthMm: 0.45,
    citoWidthMm: 1.40,
    citoColorHex: '#ef4444',
    citoColorName: 'Rojo CITO',
    linearMetersCuttingPerSheet: 8.4,
    linearMetersCreasingPerSheet: 5.6,
    recommendedTonnageTon: 165,
    dieCostEstimate: 195.0,
    pertinaxMatrixCostEstimate: 55.0,
    citoMetersRequired: 58,
    estimatedMakeReadyMinutes: 30,
    isCustom: false,
  },
  {
    id: 'preset_crash_lock_folding_380',
    name: 'Caja Fondo Automático Crash-Lock (Folding 380g / 0.54 mm)',
    description: 'Hendidos de fondo compuesto a 45° y fleje especial de hendido de 23.25 mm para plegado enérgico.',
    materialKey: 'folding_gc2',
    materialName: 'Cartoncillo Folding GC2',
    caliperMm: 0.54,
    caliperMicrons: 540,
    grammageGsm: 380,
    dieType: 'flatbed',
    dieWoodThicknessMm: 18,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 2,
    creasingRuleHeightMm: 23.26,
    creasingRuleThicknessPt: 2,
    nicksCountPerPiece: 5,
    ejectionRubberType: 'profile_rubber',
    creasingSystem: 'cito',
    citoSeries: 'CITO DYNAMIC',
    citoMatrixCode: '0.50 × 1.5 mm',
    citoDepthMm: 0.50,
    citoWidthMm: 1.50,
    citoColorHex: '#3b82f6',
    citoColorName: 'Azul CITO',
    linearMetersCuttingPerSheet: 9.2,
    linearMetersCreasingPerSheet: 6.8,
    recommendedTonnageTon: 185,
    dieCostEstimate: 215.0,
    pertinaxMatrixCostEstimate: 60.0,
    citoMetersRequired: 72,
    estimatedMakeReadyMinutes: 35,
    isCustom: false,
  },
  {
    id: 'preset_pharma_braille_280',
    name: 'Estuche Farmacéutico con Registro Braille (Folding 280g / 0.38 mm)',
    description: 'Troquel plano de precisión con matriz de estampación de puntos Braille integrada según norma EN 15823.',
    materialKey: 'folding_gc1',
    materialName: 'Cartoncillo Folding GC1',
    caliperMm: 0.38,
    caliperMicrons: 380,
    grammageGsm: 280,
    dieType: 'flatbed',
    dieWoodThicknessMm: 18,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 2,
    creasingRuleHeightMm: 23.42,
    creasingRuleThicknessPt: 2,
    nicksCountPerPiece: 4,
    ejectionRubberType: 'profile_rubber',
    creasingSystem: 'cito',
    citoSeries: 'CITO PRO',
    citoMatrixCode: '0.35 × 1.2 mm',
    citoDepthMm: 0.35,
    citoWidthMm: 1.20,
    citoColorHex: '#a855f7',
    citoColorName: 'Violeta CITO',
    linearMetersCuttingPerSheet: 11.5,
    linearMetersCreasingPerSheet: 7.2,
    recommendedTonnageTon: 175,
    dieCostEstimate: 240.0,
    pertinaxMatrixCostEstimate: 50.0,
    citoMetersRequired: 75,
    estimatedMakeReadyMinutes: 40,
    isCustom: false,
  },
  {
    id: 'preset_micro_e_ecommerce',
    name: 'Caja Envío E-Commerce (Microcanal Onda E 1.50 mm)',
    description: 'Flejes de 3 pt (1.05 mm) y contrahendidos amplios para soportar compresión y tránsito postal.',
    materialKey: 'micro_e',
    materialName: 'Microcanal Onda E',
    caliperMm: 1.50,
    caliperMicrons: 1500,
    grammageGsm: 420,
    dieType: 'flatbed',
    dieWoodThicknessMm: 18,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 3,
    creasingRuleHeightMm: 22.90,
    creasingRuleThicknessPt: 3,
    nicksCountPerPiece: 6,
    ejectionRubberType: 'vulcollan',
    creasingSystem: 'cito',
    citoSeries: 'CITO CORRUGATED',
    citoMatrixCode: '0.80 × 2.3 mm',
    citoDepthMm: 0.80,
    citoWidthMm: 2.30,
    citoColorHex: '#1e293b',
    citoColorName: 'Negro CITO',
    linearMetersCuttingPerSheet: 5.4,
    linearMetersCreasingPerSheet: 3.8,
    recommendedTonnageTon: 190,
    dieCostEstimate: 180.0,
    pertinaxMatrixCostEstimate: 65.0,
    citoMetersRequired: 40,
    estimatedMakeReadyMinutes: 30,
    isCustom: false,
  },
  {
    id: 'preset_folder_couche_350',
    name: 'Carpeta con Solapas Dossier (Couché 350g / 0.32 mm)',
    description: 'Doble hendido en lomo de 5 mm y ranuras para inserción de tarjetas comerciales.',
    materialKey: 'couche_heavy',
    materialName: 'Papel Couché Pesado',
    caliperMm: 0.32,
    caliperMicrons: 320,
    grammageGsm: 350,
    dieType: 'flatbed',
    dieWoodThicknessMm: 15,
    cuttingRuleHeightMm: 23.80,
    cuttingRuleThicknessPt: 2,
    creasingRuleHeightMm: 23.48,
    creasingRuleThicknessPt: 2,
    nicksCountPerPiece: 3,
    ejectionRubberType: 'sponge_rubber',
    creasingSystem: 'cito',
    citoSeries: 'CITO PRO',
    citoMatrixCode: '0.30 × 1.2 mm',
    citoDepthMm: 0.30,
    citoWidthMm: 1.20,
    citoColorHex: '#f97316',
    citoColorName: 'Naranja CITO',
    linearMetersCuttingPerSheet: 4.8,
    linearMetersCreasingPerSheet: 2.5,
    recommendedTonnageTon: 110,
    dieCostEstimate: 145.0,
    pertinaxMatrixCostEstimate: 35.0,
    citoMetersRequired: 28,
    estimatedMakeReadyMinutes: 20,
    isCustom: false,
  },
];

const LOCAL_STORAGE_KEY_CUSTOM_DIES = 'aravo_custom_die_creasing_configs_v1';

/**
 * Obtiene las configuraciones personalizadas guardadas por el usuario en localStorage
 */
export function getStoredCustomDieConfigs(): DieAndCreasingConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_DIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al recuperar configuraciones de troquel:', err);
    return [];
  }
}

/**
 * Guarda una nueva configuración de troquel personalizada
 */
export function saveCustomDieConfig(config: DieAndCreasingConfig): DieAndCreasingConfig[] {
  const current = getStoredCustomDieConfigs();
  const filtered = current.filter((c) => c.id !== config.id);
  const updated = [config, ...filtered];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_DIES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error al guardar configuración de troquel:', err);
  }
  return updated;
}

/**
 * Elimina una configuración personalizada guardada
 */
export function deleteCustomDieConfig(configId: string): DieAndCreasingConfig[] {
  const current = getStoredCustomDieConfigs();
  const updated = current.filter((c) => c.id !== configId);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_DIES, JSON.stringify(updated));
  } catch (err) {
    console.error('Error al eliminar configuración de troquel:', err);
  }
  return updated;
}

/**
 * Genera métricas automáticas de troquel basadas en las poses y el formato del pliego
 */
export function calculateDieProductionMetrics({
  posesCount,
  pieceWidthMm,
  pieceHeightMm,
  sheetWidthMm,
  sheetHeightMm,
  caliperMm,
  isCorrugated,
}: {
  posesCount: number;
  pieceWidthMm: number;
  pieceHeightMm: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  caliperMm: number;
  isCorrugated?: boolean;
}): {
  linearMetersCuttingPerSheet: number;
  linearMetersCreasingPerSheet: number;
  recommendedTonnageTon: number;
  dieCostEstimate: number;
  citoMetersRequired: number;
  pertinaxMatrixCostEstimate: number;
  estimatedMakeReadyMinutes: number;
} {
  const safePoses = Math.max(1, posesCount);
  
  // Perímetro de corte aproximado por pieza (2 * (W + H)) en metros
  const piecePerimeterM = (2 * (pieceWidthMm + pieceHeightMm)) / 1000;
  // Perímetro del pliego de desperdicio exterior / guillotina
  const sheetTrimM = (2 * (sheetWidthMm + sheetHeightMm)) / 1000;
  
  // Metros lineales de corte por pliego
  const cutMeters = Number(((safePoses * piecePerimeterM * 0.85) + sheetTrimM * 0.5).toFixed(2));
  
  // Metros lineales de hendido por pliego (estimación: 4 líneas de doblez por caja)
  const creaseLinesPerPieceM = (2 * pieceWidthMm + 2 * pieceHeightMm * 0.6) / 1000;
  const creaseMeters = Number((safePoses * creaseLinesPerPieceM).toFixed(2));
  
  // Fuerza requerida de troquelado (Tonelaje de presión de la máquina Bobst/Iberica/Heidelberg):
  // Corte de cartón: 1.2 a 1.5 Tn por metro lineal
  // Hendido de cartón: 0.8 a 1.0 Tn por metro lineal
  // Factor de rigidez si es microcanal
  const rigidityFactor = isCorrugated ? 1.25 : (caliperMm > 0.45 ? 1.15 : 1.0);
  const tonnage = Math.round(
    ((cutMeters * 1.35) + (creaseMeters * 0.90)) * rigidityFactor
  );
  
  // Coste estimado de troquel:
  // Base madera láser 18mm ($45) + $12 por metro de fleje cortado y moldeado + gomas ($25)
  const dieCost = Math.round(55 + (cutMeters * 12.5) + (creaseMeters * 8.5) + (safePoses * 2.5));
  
  // Metros de CITO requeridos para arreglo del pliego
  const citoMeters = Math.round(creaseMeters * 1.2);
  
  // Coste de contraplaca de Pertinax fresado CNC
  const pertinaxCost = Math.round(30 + (safePoses * 4.5));
  
  // Tiempo de arreglo en troqueladora (make-ready)
  const makeReadyMinutes = Math.min(90, Math.max(20, Math.round(20 + safePoses * 2.5)));

  return {
    linearMetersCuttingPerSheet: cutMeters,
    linearMetersCreasingPerSheet: creaseMeters,
    recommendedTonnageTon: Math.max(50, Math.min(300, tonnage)),
    dieCostEstimate: dieCost,
    citoMetersRequired: citoMeters,
    pertinaxMatrixCostEstimate: pertinaxCost,
    estimatedMakeReadyMinutes: makeReadyMinutes,
  };
}

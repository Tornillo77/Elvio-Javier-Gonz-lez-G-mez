export type PrintTechnology = 'offset' | 'flexo';

export type CurrencyCode = 'USD' | 'PYG' | 'EUR' | 'ARS' | 'MXN' | 'BRL';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar (USD)', decimals: 2 },
  PYG: { code: 'PYG', symbol: '₲', name: 'Guaraní (PYG)', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', decimals: 2 },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Arg (ARS)', decimals: 2 },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mex (MXN)', decimals: 2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real (BRL)', decimals: 2 },
};

export function formatCurrency(
  val: number,
  currency: CurrencyConfig,
  decimalsOverride?: number
): string {
  if (isNaN(val) || val === null || val === undefined) return `${currency.symbol}0`;
  const decimals = decimalsOverride !== undefined ? decimalsOverride : currency.decimals;
  return `${currency.symbol}${val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// Sheet dimension standard presets
export interface SheetFormat {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description?: string;
}

export const STANDARD_SHEET_FORMATS: SheetFormat[] = [
  { id: '960x660', name: '960 × 660 mm (96×66)', widthMm: 960, heightMm: 660, description: 'Estándar comercial & editorial' },
  { id: '1000x700', name: '1000 × 700 mm (100×70)', widthMm: 1000, heightMm: 700, description: 'Pliego entero B1 comercial' },
  { id: '810x1160', name: '810 × 1160 mm (81×116)', widthMm: 1160, heightMm: 810, description: 'Gran formato / Packaging' },
  { id: '880x640', name: '880 × 640 mm (88×64)', widthMm: 880, heightMm: 640, description: 'Formato editorial mediano' },
  { id: '660x480', name: '660 × 480 mm (Medio 96×66)', widthMm: 660, heightMm: 480, description: 'Medio pliego corte 96×66' },
  { id: '700x500', name: '700 × 500 mm (Medio 100×70)', widthMm: 700, heightMm: 500, description: 'Medio pliego B2 comercial' },
  { id: '520x360', name: '520 × 360 mm (GTO)', widthMm: 520, heightMm: 360, description: 'Formato Heidelberg GTO' },
  { id: 'custom', name: 'Personalizado', widthMm: 960, heightMm: 660, description: 'Medida a medida de compra' },
];

export interface CutArrangement {
  orientation: 'horizontal' | 'vertical' | 'mixed';
  posesTotal: number;
  posesHorizontal: number;
  posesVertical: number;
  sheetWidth: number;
  sheetHeight: number;
  pieceWidth: number;
  pieceHeight: number;
  utilAreaMm2: number;
  sheetAreaMm2: number;
  wasteAreaMm2: number;
  utilPercentage: number;
  wastePercentage: number;
  cutPattern: {
    section1: { countX: number; countY: number; w: number; h: number; x0: number; y0: number };
    section2?: { countX: number; countY: number; w: number; h: number; x0: number; y0: number };
  };
  isCustom?: boolean;
  fitsOnSheet?: boolean;
  occupiedWidthMm?: number;
  occupiedHeightMm?: number;
  usableWidthMm?: number;
  usableHeightMm?: number;
}

export interface InkColorItem {
  id: string;
  name: string;
  coveragePercent: number; // e.g. 15% Cyan, 20% Magenta
  colorHex: string;
  isSpot?: boolean;
  isPantone?: boolean;
  pantoneCode?: string;
}

export interface InkCalculationResult {
  baseGramsPerM2: number; // e.g., 1.2 g/m2 for offset, 2.0 g/m2 for flexo
  totalAreaM2: number;
  colors: {
    name: string;
    coveragePercent: number;
    gramsRequired: number;
    kgRequired: number;
    cost: number;
    colorHex: string;
  }[];
  totalKg: number;
  totalCost: number;
}

export interface RecentChangeItem {
  id: string;
  timestamp: string; // e.g. "17:29:40"
  parameter: string; // e.g. "Cantidad solicitada"
  category: 'materials' | 'dimensions' | 'machine' | 'commercial' | 'inks';
  previousValue: string;
  newValue: string;
}

// Finishing / Post-press
export interface FinishingProcessParameters {
  // UV Varnish parameters
  uvCoveragePercent?: number; // e.g. 25% or 100%
  uvBaseGramsPerM2?: number; // e.g. 4.5 g/m2 for offset tower, 14.0 for silkscreen
  uvVarnishKgPrice?: number; // $/kg
  uvVarnishType?: 'gloss' | 'matte' | 'drip_off' | 'silkscreen_high_build' | 'waterbased';
  uvCuringPowerWatts?: number; // W/cm
  
  // Lamination parameters
  laminationFilmType?: 'bopp_gloss' | 'bopp_matte' | 'soft_touch' | 'anti_scratch' | 'pet_metal';
  laminationMicrons?: number; // e.g. 18, 20, 24, 30 microns
  laminationCalenderTempC?: number; // °C
  laminationBaseSpeedSheetsPerHour?: number; // Standard speed for 20 micron (e.g. 4500)
  laminationAdjustedSpeedSheetsPerHour?: number; // Speed adjusted by microns
  laminationFilmCostPerM2?: number; // $/m2
  
  // Die-cutting parameters
  dieCuttingComplexity?: 'simple' | 'medium' | 'complex';
  dieCuttingLinearMetersRules?: number; // Meters of cutting rule
  dieCuttingRuleCostPerMeter?: number; // $/meter
  dieCuttingSpeedPerHour?: number; // Strokes/hour
  dieCuttingNicksCount?: number;
  
  // Creasing parameters
  creasingSubstrateThicknessMm?: number; // Espesor en mm (ej: 0.40 mm)
  creasingSubstrateMicrons?: number; // Espesor en micras (ej: 400 µm)
  creasingSubstrateCaliberPt?: number;
  creasingMatrixType?: 'pertinax' | 'plastic_channel' | 'cito' | 'channel_steel';
  creasingCitoMatrixCode?: string; // e.g. "0.40 × 1.3 mm" (Ábaco CITO Online)
  creasingRuleThicknessPt?: number; // 2 pt (0.71 mm) o 3 pt (1.05 mm)
  creasingChannelsCount?: number;
  
  // Folding-gluing parameters
  foldingGluingBoxType?: 'straight_line' | 'crash_lock_bottom' | '4_corner' | '6_corner';
  foldingGluingBeltSpeedPerHour?: number;
  foldingGluingGlueGramsPer1000?: number;
  foldingGluingGlueKgPrice?: number;
  
  // Hot stamping & Cold foil parameters
  foilStampedAreaCm2?: number;
  foilType?: 'gold' | 'silver' | 'holographic' | 'copper' | 'custom';
  foilAdvanceStepMm?: number;
  foilWasteMarginPercent?: number;
  foilCostPerM2?: number;
  foilClicheAreaCm2?: number;
  
  // Embossing & Debossing parameters
  embossingDepthMicrons?: number;
  embossingLevel?: 'single_level' | 'multi_level_3d';
  embossingDieMaterial?: 'magnesium' | 'brass_cnc';
  
  // Window patching parameters
  windowWidthMm?: number;
  windowHeightMm?: number;
  windowGlueOverlapMm?: number;
  windowFilmThicknessMicrons?: number;
  windowFilmType?: 'pet' | 'pvc' | 'acetate';
  
  // Vision inspection parameters
  visionCameraType?: 'line_scan_100' | 'sampling_aql';
  visionMinDefectSizeMm?: number;
  visionEstimatedRejectionPercent?: number;
  
  // Bundling & Packaging parameters
  bundleUnitsPerPack?: number;
  bundleWrapType?: 'kraft_band' | 'shrink_film' | 'elastic';
  bundlePacksPerMasterBox?: number;
  bundleMasterBoxCost?: number;

  [key: string]: any;
}

export interface FinishingProcess {
  id: string;
  name: string;
  englishName?: string;
  category?: 'cutting_creasing' | 'gluing_forming' | 'surface_finish' | 'structural_embossing' | 'quality_packing' | string;
  description?: string;
  enabled: boolean;
  costType: 'per_sheet' | 'per_unit' | 'per_m2' | 'fixed';
  unitCost: number;
  setupCost?: number; // Costo fijo de matriz, cuño, cliché o puesta a punto
  unitLabel?: string;
  parameters?: FinishingProcessParameters;
}

export interface PrintingMachinePreset {
  id: string;
  name: string; // e.g. "Heidelberg GTO 52"
  series: 'GTO' | 'GTOZ' | 'MO' | 'SM' | 'CD' | 'XL' | 'FLEXO' | 'OTRA';
  colors: number;
  plateWidthMm: number;
  plateHeightMm: number;
  maxSheetWidthMm: number;
  maxSheetHeightMm: number;
  minSheetWidthMm: number;
  minSheetHeightMm: number;
  gripperMarginMm: number;
  standardSpeedPerHour: number;
  standardSetupMinutes: number;
  standardHourlyRate: number;
  description: string;

  // Parámetros Técnicos Específicos para Máquinas Flexográficas
  maxRollWidthMm?: number; // 1. Ancho máximo de bobina (mm)
  minRollWidthMm?: number; // 2. Ancho mínimo de bobina (mm)
  standardWastePercent?: number; // 3. Merma Estándar en %
  setupWasteMeters?: number; // 4. Merma en metros lineales (ml de arranque/setup)
  speedMetersPerMinute?: number; // 5. Velocidad en metros por minuto (m/min) - cargado manualmente por desgaste
  nominalSpeedMetersPerMinute?: number; // Velocidad nominal de catálogo
}

// Calibración manual de Máquinas Flexo por Desgaste
export interface FlexoMachineCalibration {
  id: string; // Machine ID
  name: string;
  maxRollWidthMm: number; // 1. Ancho máximo de bobina (mm)
  minRollWidthMm: number; // 2. Ancho mínimo de bobina (mm)
  standardWastePercent: number; // 3. Merma Estándar en %
  setupWasteMeters: number; // 4. Merma en metros lineales (ml)
  speedMetersPerMinute: number; // 5. Velocidad en metros por minuto (m/min)
  nominalSpeedMetersPerMinute: number; // Velocidad nominal de fábrica
  wearReductionPercent?: number; // % reducción por desgaste
  wearNotes?: string; // Notas de desgaste u observaciones mecánicas
  lastCalibratedDate?: string;
  isCustom?: boolean;
  hourlyRate?: number; // Costo por hora de máquina flexo ($/h)
}

export interface OffsetJobParams {
  quoteNumber?: string; // N° de Presupuesto / Cotización correlativo o manual
  orderNumber?: string; // N° de Orden de Trabajo asociada
  jobName: string;
  clientName: string;
  productDescription?: string; // Descripción técnica detallada del producto
  clientPhone?: string;
  clientEmail?: string;
  clientContactPerson?: string;
  clientTaxId?: string; // RUC / CIF / CUIT
  clientAddress?: string;

  quantityUnits: number; // Target final units to produce
  
  // Machine & CTP Plate
  machineModelId?: string;
  machineModelName?: string;
  plateWidthMm?: number;
  plateHeightMm?: number;
  machineMaxSheetWidthMm?: number;
  machineMaxSheetHeightMm?: number;

  // Piece dimensions
  pieceWidthMm: number;
  pieceHeightMm: number;
  bleedMm: number; // Sangría (demasía)
  gutterMm: number; // Calle / medianil entre piezas
  
  // Sheet
  sheetFormatId: string;
  sheetWidthMm: number;
  sheetHeightMm: number;
  gripperMarginMm: number; // Pinza de máquina (ej. 12mm)
  nonGripperMarginMm: number; // Contrapinza y laterales (ej. 5mm)

  // Custom Imposition Parameters
  customPosesCount?: number;
  customPosesX?: number;
  customPosesY?: number;
  isCustomPosesActive?: boolean;
  selectedOrientation?: 'horizontal' | 'vertical' | 'mixed';
  
  // Paper
  paperType: string;
  grammageGsm: number; // Gramos por m2 (ej: 150g, 300g)
  paperCostPerSheet?: number; // COSTO POR PLIEGO ($/pliego) - Costo unitario base del sustrato
  paperCostPerKg: number; // Costo por kg de papel (compatible/derivado)
  
  // Inks
  inkGramsPerM2: number; // Default 1.2 g/m2 for Offset
  inkCostPerKg: number;
  inkColorsFront: InkColorItem[];
  inkColorsBack: InkColorItem[];
  isTwoSided: boolean;
  
  // Printing Plates (CTP)
  ctpPlateCost: number; // Costo por plancha
  
  // Machine Speeds & Rates (Aravo - Tiempo)
  machineSetupMinutes: number; // Puesta a punto (preparación)
  machineSpeedSheetsPerHour: number; // Velocidad de tiro
  machineHourlyRate: number; // Costo hora máquina ($/h)
  setupWasteSheetsPerColor: number; // Pliegos de maculatura de entrada
  runWastePercent: number; // % Merma durante tirada
  
  // Finishings
  finishings: FinishingProcess[];
  specialWashupCostPerColor?: number; // Costo por lavado y entintado de tintero de color especial ($/cuerpo)
  
  // Troqueles & Contrahendidos Personalizados (CITO)
  dieAndCreasingConfig?: DieAndCreasingConfig;
  
  // Commercial
  profitMarginPercent: number; // Margen Comercial / Utilidad (%)
  profitMarginAmount?: number; // Monto manual en dinero ($) de Margen Comercial / Utilidad
  profitMarginMode?: 'percent' | 'manual_amount'; // Modo de fijación (porcentaje o monto manual)
  commissionPercent?: number; // Comisión Comercial (%)
  commissionAmount?: number; // Monto manual en dinero ($) de Comisión Comercial
  commissionMode?: 'percent' | 'manual_amount'; // Modo de fijación (porcentaje o monto manual)
  taxPercent: number; // IVA (%)
}

// Configuración de Troqueles y Contrahendidos (CITO)
export interface DieAndCreasingConfig {
  id: string;
  name: string;
  description?: string;
  
  // Sustrato y Calibre
  materialKey: string;
  materialName: string;
  caliperMm: number; // Espesor del material en mm (ej: 0.40)
  caliperMicrons: number; // Micras (ej: 400 µm)
  grammageGsm: number; // Gramaje sugerido (ej: 300 g/m²)
  
  // Troquel
  dieType: 'flatbed' | 'rotary' | 'semiautomatic';
  dieWoodThicknessMm: number; // Madera multiplex: 15 mm, 18 mm
  cuttingRuleHeightMm: number; // 23.80 mm estándar
  cuttingRuleThicknessPt: number; // 2 pt (0.71 mm) o 3 pt (1.05 mm)
  creasingRuleHeightMm: number; // 23.80 - h (ej: 23.40 mm)
  creasingRuleThicknessPt: number; // 2 pt o 3 pt
  nicksCountPerPiece: number; // Puntos de unión (puentes)
  ejectionRubberType: 'sponge_rubber' | 'vulcollan' | 'profile_rubber';
  
  // Contrahendido CITO
  creasingSystem: 'cito' | 'pertinax' | 'channel_steel';
  citoSeries: string; // "CITO PRO" | "CITO DYNAMIC" | "CITO ULTIMATE"
  citoMatrixCode: string; // ej: "0.40 × 1.3 mm"
  citoDepthMm: number; // h = espesor material
  citoWidthMm: number; // w = (1.5 * caliper) + rule
  citoColorHex: string;
  citoColorName: string;
  
  // Métricas y Producción
  linearMetersCuttingPerSheet?: number;
  linearMetersCreasingPerSheet?: number;
  recommendedTonnageTon?: number; // Toneladas de presión de troqueladora
  dieCostEstimate?: number; // Costo estimado troquel ($)
  pertinaxMatrixCostEstimate?: number; // Costo de placa de contrahendido ($)
  citoMetersRequired?: number; // Metros de matriz CITO
  estimatedMakeReadyMinutes?: number; // Tiempo de arreglo en máquina (min)
  isCustom?: boolean;
}

export type FlexoQuoteUnit = 'm2' | 'linear_meter' | 'kg' | 'units';

export interface FlexoJobParams {
  quoteNumber?: string; // N° de Presupuesto / Cotización correlativo o manual
  orderNumber?: string; // N° de Orden de Trabajo asociada
  jobName: string;
  clientName: string;
  productDescription?: string; // Descripción técnica detallada del producto
  clientPhone?: string;
  clientEmail?: string;
  clientContactPerson?: string;
  clientTaxId?: string;
  clientAddress?: string;

  quoteUnit: FlexoQuoteUnit;
  targetQuantity: number; // Amount according to quoteUnit
  
  // Machine & Clichés
  machineModelId?: string;
  machineModelName?: string;
  machineMaxRollWidthMm?: number;
  machineMinRollWidthMm?: number;
  machineNominalSpeedMetersPerMinute?: number;
  machineWearReductionPercent?: number;
  plateWidthMm?: number;
  plateHeightMm?: number;

  // Piece / Label
  labelWidthMm: number;
  labelHeightMm: number; // Along web (paso / desarrollo)
  gapAcrossMm: number; // Separación transversal
  gapAlongMm: number; // Separación longitudinal
  
  // Cylinder & Roll
  rollWidthMm: number; // Ancho total de la bobina
  lanesAcross: number; // Cantidad de pistas / bocas
  cylinderRepeatMm: number; // Desarrollo del cilindro (o Z * paso)
  gearTeethZ?: number; // Dientes Z si aplica (paso 1/8" = 3.175mm)
  
  // Substrate
  substrateType: string; // BOPP, Polietileno, PET, Autoadhesivo con liner, Papel Kraft
  substrateGsm: number; // Gramaje en g/m2 (o calculado de micras x densidad)
  substrateMicrons?: number; // Espesor en micras
  substrateCostPerKg: number; // Costo por kg de bobina
  
  // Inks
  inkGramsPerM2: number; // Default 2.0 g/m2 for Flexo
  inkCostPerKg: number;
  inkColors: InkColorItem[];
  
  // Photopolymers / Clichés
  clicheCostPerPiece: number; // Costo por fotopolímero
  
  // Machine & Times (Aravo)
  machineSetupMinutes: number; // Minutos de montaje y ajuste
  machineSpeedMetersPerMinute: number; // Metros/minuto
  machineHourlyRate: number; // Costo hora máquina
  setupWasteMeters: number; // Metros de desperdicio en arranque
  runWastePercent: number; // % Merma en tirada
  
  // Roll Finishing
  labelsPerRoll: number;
  coreDiameterInches: number; // 1", 1.5", 3"
  windingDirection?: number; // 1 to 8 (según estándar internacional FINAT/FFTA)
  windingDirectionManual?: string; // Indicación manual personalizada (ej. "Sentido 3: Salida de pie")
  windingDirectionImageUrl?: string; // Imagen personalizada o foto subida de la bobina
  
  // Finishings
  finishings: FinishingProcess[];
  specialWashupCostPerColor?: number; // Costo por lavado y entintado de estación flexo ($/estación)
  
  // Commercial
  profitMarginPercent: number; // Margen Comercial / Utilidad (%)
  profitMarginAmount?: number; // Monto manual en dinero ($) de Margen Comercial / Utilidad
  profitMarginMode?: 'percent' | 'manual_amount'; // Modo de fijación (porcentaje o monto manual)
  commissionPercent?: number; // Comisión Comercial (%)
  commissionAmount?: number; // Monto manual en dinero ($) de Comisión Comercial
  commissionMode?: 'percent' | 'manual_amount'; // Modo de fijación (porcentaje o monto manual)
  taxPercent: number; // IVA (%)
}

export interface QuoteBreakdown {
  substrateCost: number;
  inkCost: number;
  platesCost: number;
  machineTimeCost: number;
  finishingsCost: number;
  washupInkingCost?: number; // Costo adicional por lavado y entintado de cuerpos especiales
  spotColorsCount?: number;
  totalProductionCost: number;
  profitAmount: number;
  profitPercent?: number;
  commissionAmount?: number;
  commissionPercent?: number;
  subtotalWithProfit: number;
  taxAmount: number;
  finalTotalPrice: number;
  
  // Production indicators
  totalSheetsOrMeters: number;
  netProductionUnits: number;
  setupTimeHours: number;
  runTimeHours: number;
  totalTimeHours: number; // Aravo Total
  wasteTotalPercent: number;
  substrateTotalWeightKg: number;
  totalInkKg: number;
  
  // Unit prices
  pricePerUnit: number;
  pricePerThousand: number;
  pricePerM2?: number;
  pricePerLinearMeter?: number;
  pricePerKg?: number;
}

import { FinishingProcess } from '../types/graphic';

export interface PostPressProcessDefinition extends FinishingProcess {
  number: number;
  iconName: string;
  badge: string;
  applicationExample: string;
  machinery?: string;
  tooling?: string;
  qualityCheck?: string;
  technicalTip?: string;
}

export const POST_PRESS_PROCESSES_CATALOG: PostPressProcessDefinition[] = [
  {
    number: 1,
    id: 'proc_die_cutting',
    name: 'Troquelado y Corte',
    englishName: 'Die-Cutting',
    category: 'cutting_creasing',
    badge: 'Corte Geométrico',
    description:
      'Corte de la forma geométrica extendida (desarrollo o klein) del envase sobre cartulina, cartón corrugado o materiales flexibles, permitiendo además realizar las líneas de corte y troqueles parciales (medio corte).',
    applicationExample: 'Estuches farmacéuticos, cajas de alimentos, etiquetas troqueladas',
    iconName: 'Scissors',
    enabled: true,
    costType: 'per_sheet',
    unitCost: 0.045,
    setupCost: 35.0,
    unitLabel: '$/pliego',
    machinery: 'Troqueladora plana automática (Bobst SP / Novacut, Heidelberg SBG Cilíndrica) o troquel rotativo en línea Flexo.',
    tooling: 'Troquel plano de madera multilaminada cortada por láser, flejes de acero templado de 23.8 mm (2 pt / 3 pt) y gomas eyectoras.',
    qualityCheck: 'Tolerancia de registro ±0.2 mm, ausencia de pelos o rebabas, verificación de puntos de unión (nicks) para evitar desprendimiento en máquina.',
    technicalTip: 'Comprobar paralelismo de platina y nivelación micrométrica de presión para preservar el filo de los flejes.',
  },
  {
    number: 2,
    id: 'proc_creasing',
    name: 'Marcado y Hendido',
    englishName: 'Creasing',
    category: 'cutting_creasing',
    badge: 'Líneas de Doblez',
    description:
      'Creación de surcos o muescas en el cartón o papel para asegurar un plegado limpio, preciso y sin roturas en las líneas de doblez de la caja.',
    applicationExample: 'Dobleces de cajas plegables, solapas de cierre, lomos de carpetas',
    iconName: 'FoldHorizontal',
    enabled: true,
    costType: 'per_sheet',
    unitCost: 0.02,
    setupCost: 15.0,
    unitLabel: '$/pliego',
    machinery: 'Integrado en la troqueladora plana mediante flejes de hendir o en plegadora de hendido por peine.',
    tooling: 'Flejes de hendido de cabeza redondeada combinados con canaletas de contrahendido (Pertinax fresado o canaletas plásticas tipo Cito).',
    qualityCheck: 'Plegado a 90° y 180° sin agrietamiento de la fibra de celulosa ni cuarteado de la capa de tinta o barniz.',
    technicalTip: 'Respetar la fórmula del Ábaco CITO para cartón compacto: Ancho canal w = (1.5 × Espesor cartón) + Fleje hendido. Ej: para cartón de 0.40 mm de espesor corresponde contrahendido CITO de 0.40 × 1.3 mm (fleje 2 pt / 0.71 mm).',
  },
  {
    number: 3,
    id: 'proc_folding_gluing',
    name: 'Pegado y Formado de Estuches',
    englishName: 'Glutting / Folding-Gluing',
    category: 'gluing_forming',
    badge: 'Armado Automático',
    description:
      'Ensamblaje y sellado lateral de estuches plegables mediante máquinas pegadoras lineales, de fondo automático o de 4/6 esquinas con adhesivos termofusibles (hot melt) o colas vinílicas.',
    applicationExample: 'Línea de encolado lateral, fondo crash lock automático, estuches de 4/6 esquinas',
    iconName: 'Box',
    enabled: true,
    costType: 'per_unit',
    unitCost: 0.018,
    setupCost: 25.0,
    unitLabel: '$/estuche',
    machinery: 'Pegadora-plegadora lineal continua (Bobst Masterfold / Expertfold, Diana, Heidelberg Promatrix).',
    tooling: 'Inyectores de cola fría PVA de alta velocidad o pistolas hot-melt termofusibles con detectores de cordón de goma.',
    qualityCheck: 'Test de desgarro de fibra (Fiber Tear) tras 60 segundos; verificar ausencia de sangrado de cola al interior del estuche.',
    technicalTip: 'Comprobar reserva libre de barniz o laminado en la pestaña de pegue para garantizar mordiente físico químico del adhesivo.',
  },
  {
    number: 4,
    id: 'proc_hot_cold_foil',
    name: 'Aplicación de Foil en Caliente y en Frío',
    englishName: 'Hot Stamping & Cold Foil',
    category: 'surface_finish',
    badge: 'Metalizado Premium',
    description:
      'Transferencia de películas metalizadas (doradas, plateadas, holográficas o de colores) mediante presión y temperatura (hot stamping) o utilizando adhesivo flexográfico curado por UV (cold foil) para detalles de alto brillo.',
    applicationExample: 'Logotipos dorados, sellos de seguridad holográficos, packaging de perfumería',
    iconName: 'Sparkles',
    enabled: false,
    costType: 'per_sheet',
    unitCost: 0.065,
    setupCost: 45.0,
    unitLabel: '$/pliego',
    machinery: 'Estampadora en caliente con bancada calefactora (Gietz, Bobst Foilmaster) o módulo Cold Foil en línea offset/flexo.',
    tooling: 'Clisés grabados de magnesio (tiradas medias), latón/bronce (altas tiradas o relieve combinado) o plancha polímero para Cold Foil.',
    qualityCheck: 'Brillo especular uniforme, bordes nítidos sin descascarillado ni microporosidades en fondos plenos.',
    technicalTip: 'Ajustar temperatura de 110°C a 135°C según sustrato y tiempo de contacto (dwell time). Evitar exceso de ceras en la tinta base.',
  },
  {
    number: 5,
    id: 'proc_lamination',
    name: 'Laminado o Plastificado',
    englishName: 'Lamination',
    category: 'surface_finish',
    badge: 'Film BOPP Protector',
    description:
      'Recubrimiento de la superficie del impreso con una película plástica fina (propileno biorientado - BOPP mate, brillante, suave al tacto/soft touch o antirrayas) para proteger la impresión y aportar rigidez o textura.',
    applicationExample: 'BOPP mate sedoso, anti-scratch de alta resistencia, soft touch aterciopelado',
    iconName: 'Layers',
    enabled: false,
    costType: 'per_sheet',
    unitCost: 0.075,
    setupCost: 20.0,
    unitLabel: '$/pliego',
    machinery: 'Laminadora térmica automática pliego a pliego con calandra de presión calefactada (Autobond, Foliant, Komfi).',
    tooling: 'Rodillos cromados de alta presión, cuchilla de corte o deshojado automático de film.',
    qualityCheck: 'Ausencia de burbujas, arrugas o túneles de aire; adhesión óptima probada con cinta normalizada (Cross-Hatch Test).',
    technicalTip: 'El impreso debe haber curado/secado al 100% (mínimo 24 h en offset convencional) para evitar desgasificación y deslaminación.',
  },
  {
    number: 6,
    id: 'proc_uv_varnishing',
    name: 'Barnizado y Lacado UV',
    englishName: 'UV Coating / Varnishing',
    category: 'surface_finish',
    badge: 'Brillo / UVI Sectorizado',
    description:
      'Aplicación de barnices protectores o estéticos (acuosos o de curado ultravioleta) que pueden ser totales o selectivos (reserva / sectorizado) para destacar logotipos, textos o texturas con alto brillo (UVI sectorizado) o acabados mate.',
    applicationExample: 'Barniz UVI con reserva sobre imágenes clave, barniz acrílico de protección total',
    iconName: 'Sun',
    enabled: true,
    costType: 'per_sheet',
    unitCost: 0.035,
    setupCost: 20.0,
    unitLabel: '$/pliego',
    machinery: 'Cuerpo barnizador en torre offset con secador UV/IR, barnizadora serigráfica plana o cilindro Sakurai para alto espesor.',
    tooling: 'Plancha de polímero con recorte de reserva, mantilla de caucho pelable o pantalla de serigrafía (malla 120-150 hilos).',
    qualityCheck: 'Secado instantáneo sin tackiness residual, brillo >85 GU en UV brillante, resistencia a frote y al rayado.',
    technicalTip: 'Verificar compatibilidad de tensión superficial entre la tinta base y el barniz para evitar efecto de rechazo (ojo de pez).',
  },
  {
    number: 7,
    id: 'proc_embossing_debossing',
    name: 'Repujado y Grabado en Relieve',
    englishName: 'Embossing & Debossing',
    category: 'structural_embossing',
    badge: 'Relieve Táctil 3D',
    description:
      'Creación de efectos tridimensionales hacia afuera (relieve) o hacia adentro (bajo relieve) sobre el sustrato mediante cuños y contracuños, aportando una experiencia táctil distintiva.',
    applicationExample: 'Relieve en marca de estuche, bajo relieve en etiquetas de vino, cuño seco',
    iconName: 'Maximize2',
    enabled: false,
    costType: 'per_sheet',
    unitCost: 0.03,
    setupCost: 40.0,
    unitLabel: '$/pliego',
    machinery: 'Prensa tipográfica de platina (Heidelberg Minarete/Cilindro), troqueladora plana o módulo rotativo.',
    tooling: 'Cuño macho de resina epóxica / contrapartida y cuño hembra grabado en latón o magnesio en bajo/alto relieve multinivel.',
    qualityCheck: 'Definición nítida de bordes sin fracturar el estucado de la cartulina ni romper el papel en zonas profundas.',
    technicalTip: 'El contenido de humedad del papel (45-55% HR) es crítico para permitir el estiramiento de las fibras celulósicas sin rotura.',
  },
  {
    number: 8,
    id: 'proc_window_patching',
    name: 'Ventanas de Acetato o Polímero',
    englishName: 'Window Patching',
    category: 'structural_embossing',
    badge: 'Visor Transparente',
    description:
      'Colocación automatizada de parches de plástico transparente (acetato, PET o PVC) en el hueco troquelado del estuche, permitiendo ver el producto en su interior (muy común en cajas de alimentos, juguetes o cosméticos).',
    applicationExample: 'Cajas de bombones, juguetes con ventana frontal, packaging de cosmética',
    iconName: 'SquareCode',
    enabled: false,
    costType: 'per_unit',
    unitCost: 0.04,
    setupCost: 30.0,
    unitLabel: '$/estuche',
    machinery: 'Máquina ventanera automática (Kohmann, Heiber + Schröder, Vega Window Patcher).',
    tooling: 'Cilindro aplicador de film con cuchillas rotativas de corte de parche, rodillos encoladores con clichés de goma a medida.',
    qualityCheck: 'Centrado del parche sobre el vano troquelado con solape perimetral de al menos 5-8 mm, sin manchas de adhesivo en el visor.',
    technicalTip: 'Utilizar films tratados corona para asegurar adherencia tenaz de la cola y evitar películas estáticas que causen atascos.',
  },
  {
    number: 9,
    id: 'proc_vision_inspection',
    name: 'Inspección de Calidad y Control Óptimo',
    englishName: 'Vision Inspection Systems',
    category: 'quality_packing',
    badge: 'Control Óptico 100%',
    description:
      'Verificación final automatizada de códigos de barras, textos, ausencia de defectos de color y defectos estructurales en los estuches ya troquelados o planos antes del empaque definitivo.',
    applicationExample: 'Cámaras de visión artificial, lectura OCR de código de lote, eye-mark test',
    iconName: 'ShieldCheck',
    enabled: true,
    costType: 'per_unit',
    unitCost: 0.005,
    setupCost: 15.0,
    unitLabel: '$/estuche',
    machinery: 'Cámaras de inspección lineal de alta velocidad integradas en la plegadora-pegadora o rebobinadora (EyeC, BST eltromat, Esko).',
    tooling: 'Sistemas de iluminación LED estroboscópica, cámaras CCD lineales y sopladores eyectores de estuches defectuosos.',
    qualityCheck: 'Detección 100% de motas, manchas, fallos de registro >0.15 mm, legibilidad ISO/ANSI grado A de códigos de barra (EAN/QR/DataMatrix).',
    technicalTip: 'Cargar el archivo PDF aprobado del cliente como patrón golden master para comparación de píxeles automática.',
  },
  {
    number: 10,
    id: 'proc_bundling_packaging',
    name: 'Agrupado, Fajado y Embalaje',
    englishName: 'Bundling / Shrink Wrapping',
    category: 'quality_packing',
    badge: 'Fajado & Expedición',
    description:
      'Agrupación de los estuches planos o armados en paquetes mediante fajadoras, envolvedoras con film termocontraíble o enfajado manual, listos para su almacenamiento y expedición.',
    applicationExample: 'Paquetes de 50 o 100 estuches fajados, film retráctil y encajonado en corrugado máster',
    iconName: 'PackageCheck',
    enabled: true,
    costType: 'per_unit',
    unitCost: 0.008,
    setupCost: 15.0,
    unitLabel: '$/estuche',
    machinery: 'Fajadora automática de papel kraft/film plástico (Bandall, ATS-Tanner) y túnel termorretráctil con precintadora de cajas.',
    tooling: 'Bandas de papel termosellable de 30-50 mm o film retráctil de polietileno; etiquetadoras automáticas de caja máster.',
    qualityCheck: 'Conteo exacto por lote (ej. 50 u/paquete), tensión adecuada de la faja sin dañar ni marcar los bordes de los estuches.',
    technicalTip: 'Identificar cada paquete y caja máster con etiqueta de trazabilidad: N° orden, cliente, fecha, cantidad neta y operario.',
  },
];

export const POST_PRESS_CATEGORIES = [
  { id: 'all', label: 'Todos los Procesos (10)' },
  { id: 'cutting_creasing', label: '1 & 2. Troquelado & Hendido' },
  { id: 'gluing_forming', label: '3. Pegado & Armado' },
  { id: 'surface_finish', label: '4, 5 & 6. Acabados Superficiales (Foil, Laminado, UV)' },
  { id: 'structural_embossing', label: '7 & 8. Relieve & Ventanas' },
  { id: 'quality_packing', label: '9 & 10. Inspección & Embalaje' },
] as const;

export const POST_PRESS_PRESETS = [
  {
    id: 'packaging_folding_box',
    name: 'Estuche Plegable Estándar (Alimentos/Farma)',
    description: 'Troquelado + Hendido + Pegado Lineal + Inspección + Embalaje',
    enabledIds: [
      'proc_die_cutting',
      'proc_creasing',
      'proc_folding_gluing',
      'proc_vision_inspection',
      'proc_bundling_packaging',
    ],
  },
  {
    id: 'packaging_luxury_cosmetic',
    name: 'Estuche Premium Cosmética / Perfumería',
    description: 'Troquelado + Hendido + Hot Stamping + Laminado Mate + UVI + Relieve + Pegado + Inspección',
    enabledIds: [
      'proc_die_cutting',
      'proc_creasing',
      'proc_hot_cold_foil',
      'proc_lamination',
      'proc_uv_varnishing',
      'proc_embossing_debossing',
      'proc_folding_gluing',
      'proc_vision_inspection',
      'proc_bundling_packaging',
    ],
  },
  {
    id: 'packaging_window_display',
    name: 'Caja con Ventana Transparente (Juguetes/Confitería)',
    description: 'Troquelado + Hendido + Ventana Acetato + Pegado + Fajado',
    enabledIds: [
      'proc_die_cutting',
      'proc_creasing',
      'proc_window_patching',
      'proc_folding_gluing',
      'proc_vision_inspection',
      'proc_bundling_packaging',
    ],
  },
  {
    id: 'commercial_print',
    name: 'Comercial & Editorial (Corte y Barniz)',
    description: 'Corte + Barniz de Protección + Fajado',
    enabledIds: ['proc_die_cutting', 'proc_uv_varnishing', 'proc_bundling_packaging'],
  },
];

// ============================================================================
// Ábaco CITO Online para Cartón Compacto (Folding Carton / Solid Board)
// Ref: https://www.cito.de/es/ES/boxline/contrahendidos/cito-abaco_online/carton_compacto/
// ============================================================================

export interface CitoMatrixRecommendation {
  matrixCode: string; // Ej: "0.40 × 1.3 mm"
  depthMm: number; // 0.40 mm
  widthMm: number; // 1.3 mm
  ruleThicknessPt: number; // 2 pt (0.71 mm) o 3 pt (1.05 mm)
  ruleThicknessMm: number; // 0.71 mm o 1.05 mm
  cartonThicknessMm: number; // Espesor del cartón (ej: 0.40 mm)
  cartonMicrons: number; // Espesor en micras (ej: 400 µm)
  series: string; // "CITO PRO / CITO DYNAMIC / Pertinax"
  colorName: string;
  colorHex: string;
  formulaDisplay: string;
  description: string;
  officialAbacoUrl: string;
}

export const CITO_ABACO_URL =
  'https://www.cito.de/es/ES/boxline/contrahendidos/cito-abaco_online/carton_compacto/';

// Tabla de correspondencias normalizadas según el Ábaco CITO
export const CITO_STANDARD_MATRIX_TABLE: Array<{
  minMm: number;
  maxMm: number;
  thicknessDisplay: string;
  depthMm: number;
  widthMm: number;
  matrixCode: string;
  rulePt: number;
  ruleMm: number;
  colorName: string;
  colorHex: string;
}> = [
  { minMm: 0.15, maxMm: 0.24, thicknessDisplay: '0.20 mm', depthMm: 0.20, widthMm: 0.8, matrixCode: '0.20 × 0.8 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Gris CITO', colorHex: '#94a3b8' },
  { minMm: 0.25, maxMm: 0.29, thicknessDisplay: '0.25 mm', depthMm: 0.25, widthMm: 1.0, matrixCode: '0.25 × 1.0 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Marrón claro', colorHex: '#d97706' },
  { minMm: 0.30, maxMm: 0.34, thicknessDisplay: '0.30 mm', depthMm: 0.30, widthMm: 1.2, matrixCode: '0.30 × 1.2 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Naranja CITO', colorHex: '#f97316' },
  { minMm: 0.35, maxMm: 0.39, thicknessDisplay: '0.35 mm', depthMm: 0.35, widthMm: 1.2, matrixCode: '0.35 × 1.2 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Violeta CITO', colorHex: '#a855f7' },
  { minMm: 0.40, maxMm: 0.44, thicknessDisplay: '0.40 mm', depthMm: 0.40, widthMm: 1.3, matrixCode: '0.40 × 1.3 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Amarillo CITO', colorHex: '#eab308' },
  { minMm: 0.45, maxMm: 0.49, thicknessDisplay: '0.45 mm', depthMm: 0.45, widthMm: 1.4, matrixCode: '0.45 × 1.4 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Rojo CITO', colorHex: '#ef4444' },
  { minMm: 0.50, maxMm: 0.54, thicknessDisplay: '0.50 mm', depthMm: 0.50, widthMm: 1.5, matrixCode: '0.50 × 1.5 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Azul CITO', colorHex: '#3b82f6' },
  { minMm: 0.55, maxMm: 0.59, thicknessDisplay: '0.55 mm', depthMm: 0.55, widthMm: 1.6, matrixCode: '0.55 × 1.6 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Verde CITO', colorHex: '#22c55e' },
  { minMm: 0.60, maxMm: 0.64, thicknessDisplay: '0.60 mm', depthMm: 0.60, widthMm: 1.7, matrixCode: '0.60 × 1.7 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Blanco CITO', colorHex: '#f8fafc' },
  { minMm: 0.65, maxMm: 0.69, thicknessDisplay: '0.65 mm', depthMm: 0.65, widthMm: 1.8, matrixCode: '0.65 × 1.8 mm', rulePt: 2, ruleMm: 0.71, colorName: 'Gris CITO', colorHex: '#64748b' },
  { minMm: 0.70, maxMm: 0.79, thicknessDisplay: '0.70 mm', depthMm: 0.70, widthMm: 2.1, matrixCode: '0.70 × 2.1 mm', rulePt: 3, ruleMm: 1.05, colorName: 'Marrón CITO', colorHex: '#854d0e' },
  { minMm: 0.80, maxMm: 0.89, thicknessDisplay: '0.80 mm', depthMm: 0.80, widthMm: 2.3, matrixCode: '0.80 × 2.3 mm', rulePt: 3, ruleMm: 1.05, colorName: 'Negro CITO', colorHex: '#1e293b' },
  { minMm: 0.90, maxMm: 1.20, thicknessDisplay: '0.90 - 1.00 mm', depthMm: 0.90, widthMm: 2.5, matrixCode: '0.90 × 2.5 mm', rulePt: 3, ruleMm: 1.05, colorName: 'Ocre CITO', colorHex: '#ca8a04' },
];

/**
 * Calcula y determina el contrahendido comercial CITO óptimo
 * basado en el espesor del cartón en milímetros.
 * Ej: Cartón de 0.40 mm -> Contrahendido 0.40 × 1.3 mm (Fleje 2 pt / 0.71 mm)
 */
export function getCitoMatrixRecommendation(thicknessMm: number): CitoMatrixRecommendation {
  const t = Math.max(0.15, Math.min(1.50, thicknessMm));
  const match =
    CITO_STANDARD_MATRIX_TABLE.find((row) => t >= row.minMm && t <= row.maxMm) ||
    CITO_STANDARD_MATRIX_TABLE[4]; // Default 0.40 x 1.3 mm

  const formulaStr = `w = (1.5 × ${t.toFixed(2)}) + ${match.ruleMm} = ${((1.5 * t) + match.ruleMm).toFixed(2)} mm → Contrahendido ${match.matrixCode}`;

  return {
    matrixCode: match.matrixCode,
    depthMm: match.depthMm,
    widthMm: match.widthMm,
    ruleThicknessPt: match.rulePt,
    ruleThicknessMm: match.ruleMm,
    cartonThicknessMm: t,
    cartonMicrons: Math.round(t * 1000),
    series: 'CITO PRO / CITO DYNAMIC / CITO Pertinax',
    colorName: match.colorName,
    colorHex: match.colorHex,
    formulaDisplay: formulaStr,
    description: `Para cartón de ${t.toFixed(2)} mm (${Math.round(t * 1000)} µm): Contrahendido ${match.matrixCode} con fleje de hendido de ${match.rulePt} pt (${match.ruleMm} mm).`,
    officialAbacoUrl: CITO_ABACO_URL,
  };
}

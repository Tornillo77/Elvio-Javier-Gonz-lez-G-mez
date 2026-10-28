import { PrintingMachinePreset } from '../types/graphic';

export const MACHINE_PRESETS: PrintingMachinePreset[] = [
  // GTO Series
  {
    id: 'gto46',
    name: 'Heidelberg GTO 46',
    series: 'GTO',
    colors: 1,
    plateWidthMm: 445,
    plateHeightMm: 380,
    maxSheetWidthMm: 460,
    maxSheetHeightMm: 320,
    minSheetWidthMm: 180,
    minSheetHeightMm: 105,
    gripperMarginMm: 8,
    standardSpeedPerHour: 8000,
    standardSetupMinutes: 20,
    standardHourlyRate: 35,
    description: 'Offset clásico de formato pequeño para papelería comercial, tarjetas y talonarios.',
  },
  {
    id: 'gto52_1c',
    name: 'Heidelberg GTO 52 (1 Color)',
    series: 'GTO',
    colors: 1,
    plateWidthMm: 510,
    plateHeightMm: 400,
    maxSheetWidthMm: 520,
    maxSheetHeightMm: 360,
    minSheetWidthMm: 180,
    minSheetHeightMm: 105,
    gripperMarginMm: 8,
    standardSpeedPerHour: 8000,
    standardSetupMinutes: 20,
    standardHourlyRate: 40,
    description: 'Monocolor versátil de alta precisión. Formato medio pliego chico estándar.',
  },
  {
    id: 'gtoz52_2c',
    name: 'Heidelberg GTOZ 52 (2 Colores)',
    series: 'GTOZ',
    colors: 2,
    plateWidthMm: 510,
    plateHeightMm: 400,
    maxSheetWidthMm: 520,
    maxSheetHeightMm: 360,
    minSheetWidthMm: 180,
    minSheetHeightMm: 105,
    gripperMarginMm: 8,
    standardSpeedPerHour: 8000,
    standardSetupMinutes: 30,
    standardHourlyRate: 50,
    description: 'Bicolor compacto con excelente registro. Muy utilizado en formularios y folletería 2 colores.',
  },

  // MO Series
  {
    id: 'mo_1c',
    name: 'Heidelberg MO (1 Color)',
    series: 'MO',
    colors: 1,
    plateWidthMm: 650,
    plateHeightMm: 550,
    maxSheetWidthMm: 650,
    maxSheetHeightMm: 480,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 10000,
    standardSetupMinutes: 25,
    standardHourlyRate: 55,
    description: 'Robusto formato 48×65 cm para afiches, revistas y trabajos editoriales.',
  },
  {
    id: 'moz52_2c',
    name: 'Heidelberg MOZ (2 Colores)',
    series: 'MO',
    colors: 2,
    plateWidthMm: 650,
    plateHeightMm: 550,
    maxSheetWidthMm: 650,
    maxSheetHeightMm: 480,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 10000,
    standardSetupMinutes: 35,
    standardHourlyRate: 65,
    description: 'Bicolor formato 65×48 cm para impresiones rápidas de alta cobertura.',
  },
  {
    id: 'mov_4c',
    name: 'Heidelberg MOV (4 Colores)',
    series: 'MO',
    colors: 4,
    plateWidthMm: 650,
    plateHeightMm: 550,
    maxSheetWidthMm: 650,
    maxSheetHeightMm: 480,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 10000,
    standardSetupMinutes: 45,
    standardHourlyRate: 85,
    description: 'Cuatricromía tradicional formato 48×65 cm con gran estabilidad en tiradas medianas.',
  },

  // SM Series (Speedmaster)
  {
    id: 'sm52_4c',
    name: 'Heidelberg Speedmaster SM 52 (4 Colores)',
    series: 'SM',
    colors: 4,
    plateWidthMm: 525,
    plateHeightMm: 459,
    maxSheetWidthMm: 520,
    maxSheetHeightMm: 370,
    minSheetWidthMm: 145,
    minSheetHeightMm: 105,
    gripperMarginMm: 9,
    standardSpeedPerHour: 15000,
    standardSetupMinutes: 25,
    standardHourlyRate: 75,
    description: 'Alta productividad en formato 37×52 cm con cambio automático de planchas Autoplate.',
  },
  {
    id: 'sm74_4c',
    name: 'Heidelberg Speedmaster SM 74 (4 Colores)',
    series: 'SM',
    colors: 4,
    plateWidthMm: 745,
    plateHeightMm: 605,
    maxSheetWidthMm: 740,
    maxSheetHeightMm: 530,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 15000,
    standardSetupMinutes: 30,
    standardHourlyRate: 95,
    description: 'El estándar de oro en medio pliego B2 (53×74 cm) para folletos, catálogos y cajas livianas.',
  },
  {
    id: 'sm102_4c',
    name: 'Heidelberg Speedmaster SM 102 (4 Colores)',
    series: 'SM',
    colors: 4,
    plateWidthMm: 1030,
    plateHeightMm: 790,
    maxSheetWidthMm: 1020,
    maxSheetHeightMm: 720,
    minSheetWidthMm: 480,
    minSheetHeightMm: 340,
    gripperMarginMm: 10,
    standardSpeedPerHour: 13000,
    standardSetupMinutes: 40,
    standardHourlyRate: 130,
    description: 'Pliego entero B1 (72×102 cm). Capacidad industrial masiva para libros, revistas y gran escala.',
  },

  // CD Series (Customized / Packaging)
  {
    id: 'cd74_5c',
    name: 'Heidelberg Speedmaster CD 74 (5 Colores + Barniz)',
    series: 'CD',
    colors: 5,
    plateWidthMm: 745,
    plateHeightMm: 605,
    maxSheetWidthMm: 740,
    maxSheetHeightMm: 530,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 15000,
    standardSetupMinutes: 35,
    standardHourlyRate: 110,
    description: 'Diseñada para packaging farmacéutico y cosmético con torre de barniz y sustratos gruesos.',
  },
  {
    id: 'cd102_5c',
    name: 'Heidelberg Speedmaster CD 102 (5 Colores + Barniz)',
    series: 'CD',
    colors: 5,
    plateWidthMm: 1030,
    plateHeightMm: 790,
    maxSheetWidthMm: 1020,
    maxSheetHeightMm: 720,
    minSheetWidthMm: 480,
    minSheetHeightMm: 340,
    gripperMarginMm: 12,
    standardSpeedPerHour: 15000,
    standardSetupMinutes: 45,
    standardHourlyRate: 145,
    description: 'Líder mundial en estuchería y packaging de cartulina plegadiza hasta 1.0 mm de espesor.',
  },

  // XL Series (Peak Performance)
  {
    id: 'xl75_5c',
    name: 'Heidelberg Speedmaster XL 75 (5 Colores + Coater)',
    series: 'XL',
    colors: 5,
    plateWidthMm: 745,
    plateHeightMm: 605,
    maxSheetWidthMm: 750,
    maxSheetHeightMm: 530,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 18000,
    standardSetupMinutes: 20,
    standardHourlyRate: 125,
    description: 'Peak Performance en formato 53×75 cm a 18.000 pl/h con tecnología Intellistart.',
  },
  {
    id: 'xl106_6c',
    name: 'Heidelberg Speedmaster XL 106 (6 Colores + Doble Barniz)',
    series: 'XL',
    colors: 6,
    plateWidthMm: 1055,
    plateHeightMm: 811,
    maxSheetWidthMm: 1060,
    maxSheetHeightMm: 750,
    minSheetWidthMm: 480,
    minSheetHeightMm: 340,
    gripperMarginMm: 10,
    standardSpeedPerHour: 18000,
    standardSetupMinutes: 30,
    standardHourlyRate: 170,
    description: 'Máxima gama industrial para packaging de lujo y alta velocidad a 18.000 pliegos/hora.',
  },
  {
    id: 'sm74_8c',
    name: 'Heidelberg Speedmaster SM 74 (8 Colores)',
    series: 'SM',
    colors: 8,
    plateWidthMm: 745,
    plateHeightMm: 605,
    maxSheetWidthMm: 740,
    maxSheetHeightMm: 530,
    minSheetWidthMm: 280,
    minSheetHeightMm: 210,
    gripperMarginMm: 10,
    standardSpeedPerHour: 15000,
    standardSetupMinutes: 40,
    standardHourlyRate: 150,
    description: 'Prensa offset de 8 cuerpos entintadores. Configuración perfecta para CMYK + 4 colores directos Pantone.',
  },
  {
    id: 'xl106_8c',
    name: 'Heidelberg Speedmaster XL 106 (8 Colores + Coater)',
    series: 'XL',
    colors: 8,
    plateWidthMm: 1055,
    plateHeightMm: 811,
    maxSheetWidthMm: 1060,
    maxSheetHeightMm: 750,
    minSheetWidthMm: 480,
    minSheetHeightMm: 340,
    gripperMarginMm: 10,
    standardSpeedPerHour: 18000,
    standardSetupMinutes: 45,
    standardHourlyRate: 195,
    description: 'Líder en alta productividad a 18.000 pl/h. 8 torres para cuatricromía + múltiples Pantone corporativos y barniz.',
  },

  // --- MÁQUINAS FLEXOGRÁFICAS DE BANDA ANGOSTA (350 mm - 8 COLORES) ---
  {
    id: 'nilpeter_fa350_8c',
    name: 'Nilpeter FA-Line 350mm (8 Colores Flexo UV)',
    series: 'FLEXO',
    colors: 8,
    plateWidthMm: 350,
    plateHeightMm: 600, // Manga / Fotopolímero
    maxSheetWidthMm: 350, // Ancho de banda útil
    maxSheetHeightMm: 610, // Máximo desarrollo de cilindro
    minSheetWidthMm: 150,
    minSheetHeightMm: 190,
    gripperMarginMm: 3,
    standardSpeedPerHour: 12000, // Metros/hora equiv (200 m/min)
    standardSetupMinutes: 45,
    standardHourlyRate: 110,
    description: 'Prensa flexográfica Nilpeter FA-350 de última generación. 8 estaciones UV para CMYK + 4 Pantone / Blanco / Barniz. Velocidad hasta 200 m/min.',
    // 5 Parámetros Técnicos Flexo Requeridos:
    maxRollWidthMm: 350, // 1. Ancho máximo de bobina (mm)
    minRollWidthMm: 150, // 2. Ancho mínimo de bobina (mm)
    standardWastePercent: 4.0, // 3. Merma Estándar en %
    setupWasteMeters: 150, // 4. Merma en metros lineales (ml de arranque/setup)
    speedMetersPerMinute: 200, // 5. Velocidad en metros por minuto (m/min)
    nominalSpeedMetersPerMinute: 200,
  },
  {
    id: 'etirama_fit350_8c',
    name: 'ETIRAMA FIT 350mm (8 Colores Modular)',
    series: 'FLEXO',
    colors: 8,
    plateWidthMm: 350,
    plateHeightMm: 480,
    maxSheetWidthMm: 350,
    maxSheetHeightMm: 500,
    minSheetWidthMm: 120,
    minSheetHeightMm: 180,
    gripperMarginMm: 3,
    standardSpeedPerHour: 6000, // 100 m/min
    standardSetupMinutes: 40,
    standardHourlyRate: 85,
    description: 'Prensa flexo industrial ETIRAMA FIT 350 con 8 cuerpos modulares. Secado UV/IR, troquel rotativo y desmallador para etiquetas autoadhesivas.',
    // 5 Parámetros Técnicos Flexo Requeridos:
    maxRollWidthMm: 350, // 1. Ancho máximo de bobina (mm)
    minRollWidthMm: 120, // 2. Ancho mínimo de bobina (mm)
    standardWastePercent: 4.8, // 3. Merma Estándar en %
    setupWasteMeters: 120, // 4. Merma en metros lineales (ml de arranque/setup)
    speedMetersPerMinute: 100, // 5. Velocidad en metros por minuto (m/min)
    nominalSpeedMetersPerMinute: 100,
  },
  {
    id: 'etirama_evo350_8c',
    name: 'ETIRAMA EVO 350mm (8 Colores Servomotorizada)',
    series: 'FLEXO',
    colors: 8,
    plateWidthMm: 350,
    plateHeightMm: 550,
    maxSheetWidthMm: 350,
    maxSheetHeightMm: 560,
    minSheetWidthMm: 120,
    minSheetHeightMm: 180,
    gripperMarginMm: 3,
    standardSpeedPerHour: 9000, // 150 m/min
    standardSetupMinutes: 35,
    standardHourlyRate: 98,
    description: 'Prensa flexográfica ETIRAMA EVO 350 servomotorizada. 8 estaciones de impresión electrónica, pre-registro automático y hot stamping.',
    // 5 Parámetros Técnicos Flexo Requeridos:
    maxRollWidthMm: 350, // 1. Ancho máximo de bobina (mm)
    minRollWidthMm: 120, // 2. Ancho mínimo de bobina (mm)
    standardWastePercent: 4.2, // 3. Merma Estándar en %
    setupWasteMeters: 100, // 4. Merma en metros lineales (ml de arranque/setup)
    speedMetersPerMinute: 150, // 5. Velocidad en metros por minuto (m/min)
    nominalSpeedMetersPerMinute: 150,
  },
];

export const OFFSET_MACHINE_PRESETS = MACHINE_PRESETS.filter((m) => m.series !== 'FLEXO');
export const FLEXO_MACHINE_PRESETS = MACHINE_PRESETS.filter((m) => m.series === 'FLEXO');

export const CUSTOM_OFFSET_MACHINES_STORAGE_KEY = 'aravo_custom_offset_machines';
export const CUSTOM_FLEXO_MACHINES_STORAGE_KEY = 'aravo_flexo_machine_calibrations';

export const INITIAL_FLEXO_CALIBRATIONS: import('../types/graphic').FlexoMachineCalibration[] = [
  {
    id: 'nilpeter_fa350_8c',
    name: 'Nilpeter FA-Line 350mm (8 Colores Flexo UV)',
    maxRollWidthMm: 350,
    minRollWidthMm: 150,
    standardWastePercent: 4.0,
    setupWasteMeters: 150,
    speedMetersPerMinute: 200,
    nominalSpeedMetersPerMinute: 200,
    wearReductionPercent: 0,
    wearNotes: 'Velocidad de catálogo nominal. Ajustar manualmente si hay desgaste.',
    hourlyRate: 110,
  },
  {
    id: 'etirama_fit350_8c',
    name: 'ETIRAMA FIT 350mm (8 Colores Modular)',
    maxRollWidthMm: 350,
    minRollWidthMm: 120,
    standardWastePercent: 4.8,
    setupWasteMeters: 120,
    speedMetersPerMinute: 100,
    nominalSpeedMetersPerMinute: 100,
    wearReductionPercent: 0,
    wearNotes: 'Velocidad modular estándar.',
    hourlyRate: 85,
  },
  {
    id: 'etirama_evo350_8c',
    name: 'ETIRAMA EVO 350mm (8 Colores Servomotorizada)',
    maxRollWidthMm: 350,
    minRollWidthMm: 120,
    standardWastePercent: 4.2,
    setupWasteMeters: 100,
    speedMetersPerMinute: 150,
    nominalSpeedMetersPerMinute: 150,
    wearReductionPercent: 0,
    wearNotes: 'Servomotores electrónicos de alta precisión.',
    hourlyRate: 98,
  },
];

export const getFlexoMachineCalibrations = (): import('../types/graphic').FlexoMachineCalibration[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_FLEXO_MACHINES_STORAGE_KEY);
    if (!raw) return INITIAL_FLEXO_CALIBRATIONS;
    const parsed: import('../types/graphic').FlexoMachineCalibration[] = JSON.parse(raw);
    const map = new Map<string, import('../types/graphic').FlexoMachineCalibration>();
    INITIAL_FLEXO_CALIBRATIONS.forEach((c) => map.set(c.id, c));
    parsed.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  } catch (e) {
    console.error('Error loading flexo machine calibrations:', e);
    return INITIAL_FLEXO_CALIBRATIONS;
  }
};

export const saveFlexoMachineCalibration = (
  calib: import('../types/graphic').FlexoMachineCalibration
): import('../types/graphic').FlexoMachineCalibration[] => {
  try {
    const existing = getFlexoMachineCalibrations();
    const updated = existing.some((c) => c.id === calib.id)
      ? existing.map((c) => (c.id === calib.id ? calib : c))
      : [calib, ...existing];
    localStorage.setItem(CUSTOM_FLEXO_MACHINES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving flexo machine calibration:', e);
    return INITIAL_FLEXO_CALIBRATIONS;
  }
};

export const resetFlexoMachineCalibration = (id: string): import('../types/graphic').FlexoMachineCalibration[] => {
  try {
    const defaultVal = INITIAL_FLEXO_CALIBRATIONS.find((c) => c.id === id);
    if (!defaultVal) return getFlexoMachineCalibrations();
    return saveFlexoMachineCalibration(defaultVal);
  } catch (e) {
    console.error('Error resetting flexo calibration:', e);
    return INITIAL_FLEXO_CALIBRATIONS;
  }
};

export const deleteCustomFlexoMachine = (id: string): import('../types/graphic').FlexoMachineCalibration[] => {
  try {
    const existing = getFlexoMachineCalibrations();
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(CUSTOM_FLEXO_MACHINES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting custom flexo machine:', e);
    return INITIAL_FLEXO_CALIBRATIONS;
  }
};

export const getCustomOffsetMachines = (): PrintingMachinePreset[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_OFFSET_MACHINES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading custom offset machines:', e);
    return [];
  }
};

export const saveCustomOffsetMachine = (machine: PrintingMachinePreset): PrintingMachinePreset[] => {
  try {
    const existing = getCustomOffsetMachines();
    const updated = [machine, ...existing.filter((m) => m.id !== machine.id)];
    localStorage.setItem(CUSTOM_OFFSET_MACHINES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving custom offset machine:', e);
    return [];
  }
};

export const deleteCustomOffsetMachine = (id: string): PrintingMachinePreset[] => {
  try {
    const existing = getCustomOffsetMachines();
    const updated = existing.filter((m) => m.id !== id);
    localStorage.setItem(CUSTOM_OFFSET_MACHINES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting custom offset machine:', e);
    return [];
  }
};

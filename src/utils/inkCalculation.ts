import { InkCalculationResult, InkColorItem } from '../types/graphic';

export interface InkCalculationOptions {
  totalPrintedAreaM2: number; // Total m² of printed surface (front + back if two sided)
  baseGramsPerM2: number; // 1.2 g/m² for Offset, 2.0 g/m² for Flexo
  colors: InkColorItem[];
  inkCostPerKg: number;
  wasteMarginPercent?: number; // Residual in ink duct / anilox / rollers (default 8%)
}

export function calculateInkConsumption(options: InkCalculationOptions): InkCalculationResult {
  const { totalPrintedAreaM2, baseGramsPerM2, colors, inkCostPerKg, wasteMarginPercent = 8 } = options;

  const wasteMultiplier = 1 + (wasteMarginPercent / 100);

  const calculatedColors = colors.map((col) => {
    // Standard formula: Area(m²) * Base(g/m²) * (Coverage% / 100) * WasteFactor
    const coverageFraction = Math.max(0, col.coveragePercent) / 100;
    const theoreticalGrams = totalPrintedAreaM2 * baseGramsPerM2 * coverageFraction;
    const gramsRequired = theoreticalGrams * wasteMultiplier;
    const kgRequired = gramsRequired / 1000;
    const cost = kgRequired * inkCostPerKg;

    return {
      name: col.name,
      coveragePercent: col.coveragePercent,
      gramsRequired: Number(gramsRequired.toFixed(1)),
      kgRequired: Number(kgRequired.toFixed(3)),
      cost: Number(cost.toFixed(2)),
      colorHex: col.colorHex,
    };
  });

  const totalKg = calculatedColors.reduce((acc, c) => acc + c.kgRequired, 0);
  const totalCost = calculatedColors.reduce((acc, c) => acc + c.cost, 0);

  return {
    baseGramsPerM2,
    totalAreaM2: Number(totalPrintedAreaM2.toFixed(2)),
    colors: calculatedColors,
    totalKg: Number(totalKg.toFixed(3)),
    totalCost: Number(totalCost.toFixed(2)),
  };
}

export const DEFAULT_OFFSET_COLORS: InkColorItem[] = [
  { id: 'c', name: 'Cyan (C)', coveragePercent: 20, colorHex: '#00adef' },
  { id: 'm', name: 'Magenta (M)', coveragePercent: 25, colorHex: '#ec008c' },
  { id: 'y', name: 'Yellow (Y)', coveragePercent: 30, colorHex: '#fff100' },
  { id: 'k', name: 'Black (K)', coveragePercent: 35, colorHex: '#231f20' },
];

export const DEFAULT_FLEXO_COLORS: InkColorItem[] = [
  { id: 'white', name: 'Blanco Fondo', coveragePercent: 85, colorHex: '#e2e8f0', isSpot: true },
  { id: 'c', name: 'Cyan (C)', coveragePercent: 25, colorHex: '#00adef' },
  { id: 'm', name: 'Magenta (M)', coveragePercent: 30, colorHex: '#ec008c' },
  { id: 'y', name: 'Yellow (Y)', coveragePercent: 35, colorHex: '#fff100' },
  { id: 'k', name: 'Black (K)', coveragePercent: 40, colorHex: '#231f20' },
];

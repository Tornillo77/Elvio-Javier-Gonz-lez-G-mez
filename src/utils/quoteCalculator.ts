import {
  CutArrangement,
  FlexoJobParams,
  InkCalculationResult,
  OffsetJobParams,
  QuoteBreakdown,
} from '../types/graphic';
import { computeFlexoMetrics } from './flexoCalculations';
import { calculateInkConsumption } from './inkCalculation';

export function calculateOffsetQuote(
  params: OffsetJobParams,
  arrangement: CutArrangement
): {
  breakdown: QuoteBreakdown;
  inkResult: InkCalculationResult;
  netSheets: number;
  grossSheets: number;
  setupWasteSheets: number;
  runWasteSheets: number;
  paperWeightKg: number;
  reamsRequired: number;
  platesCount: number;
} {
  const posesPerSheet = Math.max(1, arrangement.posesTotal);
  const netSheets = Math.ceil(params.quantityUnits / posesPerSheet);

  // Active colors count
  const colorsFrontCount = params.inkColorsFront.length;
  const colorsBackCount = params.isTwoSided ? params.inkColorsBack.length : 0;
  const totalColors = colorsFrontCount + colorsBackCount;

  // Plates (CTP): 1 plate per color per sheet form
  const platesCount = Math.max(1, totalColors);
  const platesCost = platesCount * params.ctpPlateCost;

  // Paper waste (Maculaturas)
  // Setup waste: sheets per color
  const setupWasteSheets = params.setupWasteSheetsPerColor * totalColors;
  // Run waste
  const runWasteSheets = Math.ceil(netSheets * (params.runWastePercent / 100));
  const grossSheets = netSheets + setupWasteSheets + runWasteSheets;

  // Paper Weight in Kg
  // Area of 1 sheet in m² = (W mm * H mm) / 1,000,000
  const sheetAreaM2 = (params.sheetWidthMm * params.sheetHeightMm) / 1_000_000;
  const totalPaperM2 = grossSheets * sheetAreaM2;
  const paperWeightKg = (totalPaperM2 * params.grammageGsm) / 1000;

  // COSTO POR PLIEGO (Sustrato):
  // Si params.paperCostPerSheet está definido (> 0), el costo total es grossSheets * params.paperCostPerSheet
  // De lo contrario, se calcula a partir del peso del papel en kg * costo/kg
  const singleSheetWeightKg = (sheetAreaM2 * params.grammageGsm) / 1000;
  const effectiveCostPerSheet =
    params.paperCostPerSheet !== undefined && params.paperCostPerSheet > 0
      ? params.paperCostPerSheet
      : Number((singleSheetWeightKg * params.paperCostPerKg).toFixed(4));

  const substrateCost = effectiveCostPerSheet * grossSheets;
  const reamsRequired = Number((grossSheets / 500).toFixed(2));

  // Ink calculation
  // Total printed area = grossSheets * (pieceArea * poses) * (1 or 2 sides)
  const pieceAreaM2 = (params.pieceWidthMm * params.pieceHeightMm) / 1_000_000;
  const totalPieceAreaPerSheetM2 = pieceAreaM2 * posesPerSheet;
  const totalPrintedAreaM2 = grossSheets * totalPieceAreaPerSheetM2 * (params.isTwoSided ? 2 : 1);

  // Combine front & back colors for ink calculation (deep copy to avoid mutating source params)
  const allColors = params.inkColorsFront.map((c) => ({ ...c }));
  if (params.isTwoSided) {
    params.inkColorsBack.forEach((c) => {
      const existing = allColors.find((x) => x.name.trim().toLowerCase() === c.name.trim().toLowerCase());
      if (existing) {
        existing.coveragePercent = (existing.coveragePercent + c.coveragePercent) / 2;
      } else {
        allColors.push({ ...c, id: `${c.id}_back` });
      }
    });
  }

  const inkResult = calculateInkConsumption({
    totalPrintedAreaM2,
    baseGramsPerM2: params.inkGramsPerM2,
    colors: allColors,
    inkCostPerKg: params.inkCostPerKg,
  });
  const inkCost = inkResult.totalCost;

  // Machine Time & Aravo
  // Setup time: preparation minutes (multiplied if two sided through pass)
  const setupMinutes = params.machineSetupMinutes * (params.isTwoSided ? 1.5 : 1);
  const setupTimeHours = setupMinutes / 60;
  
  // Running time: gross sheets / speed per hour
  const totalPasses = params.isTwoSided ? grossSheets * 2 : grossSheets;
  const runTimeHours = totalPasses / Math.max(100, params.machineSpeedSheetsPerHour);
  const totalTimeHours = setupTimeHours + runTimeHours;
  const machineTimeCost = totalTimeHours * params.machineHourlyRate;

  // Finishings cost
  let finishingsCost = 0;
  params.finishings.forEach((f) => {
    if (!f.enabled) return;
    if (f.costType === 'per_sheet') {
      finishingsCost += f.unitCost * grossSheets;
    } else if (f.costType === 'per_unit') {
      finishingsCost += f.unitCost * params.quantityUnits;
    } else if (f.costType === 'per_m2') {
      finishingsCost += f.unitCost * totalPaperM2;
    } else if (f.costType === 'fixed') {
      finishingsCost += f.unitCost;
    }
    if (f.setupCost && f.setupCost > 0) {
      finishingsCost += f.setupCost;
    }
  });

  // Special Inks Washup and Inking cost (Lavado y entintado de cuerpos especiales Pantone)
  const isPantoneOrSpot = (c: { isSpot?: boolean; isPantone?: boolean; name?: string }) =>
    Boolean(c.isSpot || c.isPantone || (c.name && (/pantone|pms/i.test(c.name))));

  const spotColorsCount =
    params.inkColorsFront.filter(isPantoneOrSpot).length +
    (params.isTwoSided ? params.inkColorsBack.filter(isPantoneOrSpot).length : 0);
  const washupRate = params.specialWashupCostPerColor !== undefined ? params.specialWashupCostPerColor : 20;
  const washupInkingCost = spotColorsCount * washupRate;

  // Financial Subtotals
  const totalProductionCost =
    substrateCost + inkCost + platesCost + machineTimeCost + finishingsCost + washupInkingCost;

  // Margen Comercial / Utilidad (manual en $ o porcentaje %)
  let profitAmount = 0;
  let profitPercent = Number(params.profitMarginPercent ?? 30);
  if (params.profitMarginMode === 'manual_amount' && params.profitMarginAmount !== undefined && params.profitMarginAmount >= 0) {
    profitAmount = Number(params.profitMarginAmount);
    profitPercent = totalProductionCost > 0 ? Number(((profitAmount / totalProductionCost) * 100).toFixed(2)) : 0;
  } else {
    profitAmount = totalProductionCost * (profitPercent / 100);
  }

  // Comisión Comercial (manual en $ o porcentaje %)
  let commissionAmount = 0;
  let commissionPercent = Number(params.commissionPercent ?? 0);
  const baseForCommission = totalProductionCost + profitAmount;
  if (params.commissionMode === 'manual_amount' && params.commissionAmount !== undefined && params.commissionAmount >= 0) {
    commissionAmount = Number(params.commissionAmount);
    commissionPercent = baseForCommission > 0 ? Number(((commissionAmount / baseForCommission) * 100).toFixed(2)) : 0;
  } else if (commissionPercent > 0) {
    commissionAmount = baseForCommission * (commissionPercent / 100);
  }

  const subtotalWithProfit = totalProductionCost + profitAmount + commissionAmount;
  const taxAmount = subtotalWithProfit * (params.taxPercent / 100);
  const finalTotalPrice = subtotalWithProfit + taxAmount;

  const totalWastePercent = Number(((grossSheets - netSheets) / grossSheets * 100).toFixed(1));

  const breakdown: QuoteBreakdown = {
    substrateCost: Number(substrateCost.toFixed(2)),
    inkCost: Number(inkCost.toFixed(2)),
    platesCost: Number(platesCost.toFixed(2)),
    machineTimeCost: Number(machineTimeCost.toFixed(2)),
    finishingsCost: Number(finishingsCost.toFixed(2)),
    washupInkingCost: Number(washupInkingCost.toFixed(2)),
    spotColorsCount,
    totalProductionCost: Number(totalProductionCost.toFixed(2)),
    profitAmount: Number(profitAmount.toFixed(2)),
    profitPercent: Number(profitPercent.toFixed(2)),
    commissionAmount: Number(commissionAmount.toFixed(2)),
    commissionPercent: Number(commissionPercent.toFixed(2)),
    subtotalWithProfit: Number(subtotalWithProfit.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    finalTotalPrice: Number(finalTotalPrice.toFixed(2)),

    totalSheetsOrMeters: grossSheets,
    netProductionUnits: params.quantityUnits,
    setupTimeHours: Number(setupTimeHours.toFixed(2)),
    runTimeHours: Number(runTimeHours.toFixed(2)),
    totalTimeHours: Number(totalTimeHours.toFixed(2)),
    wasteTotalPercent: totalWastePercent,
    substrateTotalWeightKg: Number(paperWeightKg.toFixed(2)),
    totalInkKg: inkResult.totalKg,

    pricePerUnit: Number((finalTotalPrice / params.quantityUnits).toFixed(4)),
    pricePerThousand: Number(((finalTotalPrice / params.quantityUnits) * 1000).toFixed(2)),
  };

  return {
    breakdown,
    inkResult,
    netSheets,
    grossSheets,
    setupWasteSheets,
    runWasteSheets,
    paperWeightKg: Number(paperWeightKg.toFixed(2)),
    reamsRequired,
    platesCount,
  };
}

export function calculateFlexoQuote(params: FlexoJobParams): {
  breakdown: QuoteBreakdown;
  inkResult: InkCalculationResult;
  metrics: ReturnType<typeof computeFlexoMetrics>;
  clichesCount: number;
} {
  const metrics = computeFlexoMetrics(params);

  // Clichés: 1 photopolymer per active ink color
  const clichesCount = Math.max(1, params.inkColors.length);
  const platesCost = clichesCount * params.clicheCostPerPiece;

  // Substrate / Roll cost
  const substrateCost = metrics.grossWeightKg * params.substrateCostPerKg;

  // Inks calculation
  // Total printed area = gross linear meters * roll width in meters
  const totalPrintedAreaM2 = metrics.grossM2;
  const inkResult = calculateInkConsumption({
    totalPrintedAreaM2,
    baseGramsPerM2: params.inkGramsPerM2, // standard flexo 2.0 g/m²
    colors: params.inkColors,
    inkCostPerKg: params.inkCostPerKg,
  });
  const inkCost = inkResult.totalCost;

  // Machine Time & Aravo
  const machineTimeCost = metrics.totalTimeHours * params.machineHourlyRate;

  // Finishings
  let finishingsCost = 0;
  params.finishings.forEach((f) => {
    if (!f.enabled) return;
    if (f.costType === 'per_sheet' || f.costType === 'per_unit') {
      finishingsCost += f.unitCost * metrics.totalLabelsOrUnits;
    } else if (f.costType === 'per_m2') {
      finishingsCost += f.unitCost * metrics.grossM2;
    } else if (f.costType === 'fixed') {
      finishingsCost += f.unitCost;
    }
    if (f.setupCost && f.setupCost > 0) {
      finishingsCost += f.setupCost;
    }
  });

  // Special Inks Washup and Inking cost (Lavado y entintado anilox/tinteros Flexo)
  const spotColorsCount = params.inkColors.filter((c) => c.isSpot || c.isPantone).length;
  const washupRate = params.specialWashupCostPerColor !== undefined ? params.specialWashupCostPerColor : 25;
  const washupInkingCost = spotColorsCount * washupRate;

  // Financial Subtotals
  const totalProductionCost =
    substrateCost + inkCost + platesCost + machineTimeCost + finishingsCost + washupInkingCost;

  // Margen Comercial / Utilidad (manual en $ o porcentaje %)
  let profitAmount = 0;
  let profitPercent = Number(params.profitMarginPercent ?? 30);
  if (params.profitMarginMode === 'manual_amount' && params.profitMarginAmount !== undefined && params.profitMarginAmount >= 0) {
    profitAmount = Number(params.profitMarginAmount);
    profitPercent = totalProductionCost > 0 ? Number(((profitAmount / totalProductionCost) * 100).toFixed(2)) : 0;
  } else {
    profitAmount = totalProductionCost * (profitPercent / 100);
  }

  // Comisión Comercial (manual en $ o porcentaje %)
  let commissionAmount = 0;
  let commissionPercent = Number(params.commissionPercent ?? 0);
  const baseForCommission = totalProductionCost + profitAmount;
  if (params.commissionMode === 'manual_amount' && params.commissionAmount !== undefined && params.commissionAmount >= 0) {
    commissionAmount = Number(params.commissionAmount);
    commissionPercent = baseForCommission > 0 ? Number(((commissionAmount / baseForCommission) * 100).toFixed(2)) : 0;
  } else if (commissionPercent > 0) {
    commissionAmount = baseForCommission * (commissionPercent / 100);
  }

  const subtotalWithProfit = totalProductionCost + profitAmount + commissionAmount;
  const taxAmount = subtotalWithProfit * (params.taxPercent / 100);
  const finalTotalPrice = subtotalWithProfit + taxAmount;

  const unitDivisor = Math.max(1, metrics.totalLabelsOrUnits);
  const m2Divisor = Math.max(0.01, metrics.netM2);
  const linearMeterDivisor = Math.max(0.01, metrics.netLinearMeters);
  const kgDivisor = Math.max(0.01, metrics.netWeightKg);

  const breakdown: QuoteBreakdown = {
    substrateCost: Number(substrateCost.toFixed(2)),
    inkCost: Number(inkCost.toFixed(2)),
    platesCost: Number(platesCost.toFixed(2)),
    machineTimeCost: Number(machineTimeCost.toFixed(2)),
    finishingsCost: Number(finishingsCost.toFixed(2)),
    washupInkingCost: Number(washupInkingCost.toFixed(2)),
    spotColorsCount,
    totalProductionCost: Number(totalProductionCost.toFixed(2)),
    profitAmount: Number(profitAmount.toFixed(2)),
    profitPercent: Number(profitPercent.toFixed(2)),
    commissionAmount: Number(commissionAmount.toFixed(2)),
    commissionPercent: Number(commissionPercent.toFixed(2)),
    subtotalWithProfit: Number(subtotalWithProfit.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    finalTotalPrice: Number(finalTotalPrice.toFixed(2)),

    totalSheetsOrMeters: metrics.grossLinearMeters,
    netProductionUnits: metrics.totalLabelsOrUnits,
    setupTimeHours: metrics.setupTimeHours,
    runTimeHours: metrics.runTimeHours,
    totalTimeHours: metrics.totalTimeHours,
    wasteTotalPercent: metrics.totalWastePercent,
    substrateTotalWeightKg: metrics.grossWeightKg,
    totalInkKg: inkResult.totalKg,

    pricePerUnit: Number((finalTotalPrice / unitDivisor).toFixed(4)),
    pricePerThousand: Number(((finalTotalPrice / unitDivisor) * 1000).toFixed(2)),
    pricePerM2: Number((finalTotalPrice / m2Divisor).toFixed(2)),
    pricePerLinearMeter: Number((finalTotalPrice / linearMeterDivisor).toFixed(2)),
    pricePerKg: Number((finalTotalPrice / kgDivisor).toFixed(2)),
  };

  return {
    breakdown,
    inkResult,
    metrics,
    clichesCount,
  };
}

import { FlexoJobParams, FlexoQuoteUnit } from '../types/graphic';

export interface FlexoConvertedMetrics {
  targetQuantity: number;
  quoteUnit: FlexoQuoteUnit;
  netLinearMeters: number;
  grossLinearMeters: number; // Includes startup + run waste
  netM2: number;
  grossM2: number;
  netWeightKg: number;
  grossWeightKg: number;
  totalLabelsOrUnits: number;
  labelsAcross: number;
  labelsAlongRepeat: number;
  cylinderDevelopmentMm: number;
  rollWidthMm: number;
  setupWasteMeters: number;
  runWasteMeters: number;
  totalWasteMeters: number;
  totalWastePercent: number;
  setupTimeHours: number;
  runTimeHours: number;
  totalTimeHours: number; // Aravo Total
  labelsPerRoll: number;
  numberOfRolls: number;
  estimatedRollOuterDiameterMm: number;
}

export function computeFlexoMetrics(params: FlexoJobParams): FlexoConvertedMetrics {
  const {
    targetQuantity,
    quoteUnit,
    labelWidthMm,
    labelHeightMm,
    gapAcrossMm,
    gapAlongMm,
    rollWidthMm,
    lanesAcross,
    cylinderRepeatMm,
    gearTeethZ,
    substrateGsm,
    substrateMicrons,
    machineSetupMinutes,
    machineSpeedMetersPerMinute,
    setupWasteMeters,
    runWastePercent,
    labelsPerRoll,
    coreDiameterInches,
  } = params;

  // 1. Effective step sizes
  const stepAlongMm = labelHeightMm + gapAlongMm;
  const rollWidthMeters = Math.max(0.01, rollWidthMm / 1000);

  // Cylinder development (if gearTeethZ is given, 1 tooth = 3.175 mm, else cylinderRepeatMm)
  const actualCylinderRepeat = (gearTeethZ && gearTeethZ > 0)
    ? gearTeethZ * 3.175
    : (cylinderRepeatMm > 0 ? cylinderRepeatMm : stepAlongMm);

  // Number of labels along 1 cylinder revolution (with epsilon tolerance for floating-point divisions)
  const labelsAlongRepeat = Math.max(1, Math.floor((actualCylinderRepeat + 0.05) / Math.max(1, stepAlongMm)));
  const safeLanes = Math.max(1, lanesAcross);

  let netLinearMeters = 0;
  let netM2 = 0;
  let netWeightKg = 0;
  let totalLabelsOrUnits = 0;

  // Convert from quoteUnit to standard metrics
  switch (quoteUnit) {
    case 'm2': {
      netM2 = targetQuantity;
      netLinearMeters = netM2 / rollWidthMeters;
      netWeightKg = (netM2 * substrateGsm) / 1000;
      // approximate units based on label area
      const unitAreaM2 = ((labelWidthMm + gapAcrossMm) * stepAlongMm) / 1_000_000;
      totalLabelsOrUnits = Math.round(netM2 / Math.max(0.00001, unitAreaM2));
      break;
    }
    case 'linear_meter': {
      netLinearMeters = targetQuantity;
      netM2 = netLinearMeters * rollWidthMeters;
      netWeightKg = (netM2 * substrateGsm) / 1000;
      const repeats = (netLinearMeters * 1000) / Math.max(1, stepAlongMm);
      totalLabelsOrUnits = Math.round(repeats * safeLanes);
      break;
    }
    case 'kg': {
      netWeightKg = targetQuantity;
      netM2 = (netWeightKg * 1000) / Math.max(1, substrateGsm);
      netLinearMeters = netM2 / rollWidthMeters;
      const repeats = (netLinearMeters * 1000) / Math.max(1, stepAlongMm);
      totalLabelsOrUnits = Math.round(repeats * safeLanes);
      break;
    }
    case 'units':
    default: {
      totalLabelsOrUnits = targetQuantity;
      const repeatsNeeded = Math.ceil(totalLabelsOrUnits / safeLanes);
      netLinearMeters = (repeatsNeeded * stepAlongMm) / 1000;
      netM2 = netLinearMeters * rollWidthMeters;
      netWeightKg = (netM2 * substrateGsm) / 1000;
      break;
    }
  }

  // 2. Mermas (Wastes)
  // Setup waste in linear meters (ajuste, registro, entintado)
  const runWasteMeters = netLinearMeters * (runWastePercent / 100);
  const totalWasteMeters = setupWasteMeters + runWasteMeters;
  const grossLinearMeters = netLinearMeters + totalWasteMeters;
  const grossM2 = grossLinearMeters * rollWidthMeters;
  const grossWeightKg = (grossM2 * substrateGsm) / 1000;
  const totalWastePercent = netLinearMeters > 0 ? (totalWasteMeters / grossLinearMeters) * 100 : 0;

  // 3. Machine Time (Aravo)
  const safeSpeed = Math.max(1, machineSpeedMetersPerMinute);
  const setupTimeHours = machineSetupMinutes / 60;
  const runTimeHours = grossLinearMeters / safeSpeed / 60;
  const totalTimeHours = setupTimeHours + runTimeHours;

  // 4. Rolls finished
  const effectiveLabelsPerRoll = Math.max(1, labelsPerRoll);
  const numberOfRolls = Math.max(1, Math.ceil(totalLabelsOrUnits / effectiveLabelsPerRoll));

  // Roll Outer Diameter Estimation: OD = sqrt( (4 * L * t) / pi + ID^2 )
  const coreDiameterMm = (coreDiameterInches || 3) * 25.4;
  const thicknessMm = (substrateMicrons ? substrateMicrons : (substrateGsm / 1000)) / 1000; // in mm
  const metersPerRoll = netLinearMeters / (numberOfRolls / safeLanes);
  const rollAreaSection = (4 * (metersPerRoll * 1000) * thicknessMm) / Math.PI;
  const estimatedRollOuterDiameterMm = Math.round(Math.sqrt(rollAreaSection + (coreDiameterMm * coreDiameterMm)));

  return {
    targetQuantity,
    quoteUnit,
    netLinearMeters: Math.round(netLinearMeters),
    grossLinearMeters: Math.round(grossLinearMeters),
    netM2: Number(netM2.toFixed(2)),
    grossM2: Number(grossM2.toFixed(2)),
    netWeightKg: Number(netWeightKg.toFixed(2)),
    grossWeightKg: Number(grossWeightKg.toFixed(2)),
    totalLabelsOrUnits,
    labelsAcross: safeLanes,
    labelsAlongRepeat,
    cylinderDevelopmentMm: Number(actualCylinderRepeat.toFixed(1)),
    rollWidthMm,
    setupWasteMeters,
    runWasteMeters: Math.round(runWasteMeters),
    totalWasteMeters: Math.round(totalWasteMeters),
    totalWastePercent: Number(totalWastePercent.toFixed(1)),
    setupTimeHours: Number(setupTimeHours.toFixed(2)),
    runTimeHours: Number(runTimeHours.toFixed(2)),
    totalTimeHours: Number(totalTimeHours.toFixed(2)),
    labelsPerRoll: effectiveLabelsPerRoll,
    numberOfRolls,
    estimatedRollOuterDiameterMm: isNaN(estimatedRollOuterDiameterMm) ? 150 : Math.min(1000, estimatedRollOuterDiameterMm),
  };
}

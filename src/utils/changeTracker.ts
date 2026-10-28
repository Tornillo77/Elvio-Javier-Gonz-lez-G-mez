import { FlexoJobParams, OffsetJobParams, RecentChangeItem } from '../types/graphic';

export function detectOffsetChanges(
  prev: OffsetJobParams,
  curr: OffsetJobParams
): RecentChangeItem | null {
  const time = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (prev.quantityUnits !== curr.quantityUnits) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Cantidad a Producir',
      category: 'commercial',
      previousValue: `${prev.quantityUnits.toLocaleString()} u`,
      newValue: `${curr.quantityUnits.toLocaleString()} u`,
    };
  }

  if (prev.pieceWidthMm !== curr.pieceWidthMm || prev.pieceHeightMm !== curr.pieceHeightMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Dimensiones Pieza Final',
      category: 'dimensions',
      previousValue: `${prev.pieceWidthMm} × ${prev.pieceHeightMm} mm`,
      newValue: `${curr.pieceWidthMm} × ${curr.pieceHeightMm} mm`,
    };
  }

  if (prev.sheetWidthMm !== curr.sheetWidthMm || prev.sheetHeightMm !== curr.sheetHeightMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Formato de Pliego',
      category: 'dimensions',
      previousValue: `${prev.sheetWidthMm} × ${prev.sheetHeightMm} mm`,
      newValue: `${curr.sheetWidthMm} × ${curr.sheetHeightMm} mm`,
    };
  }

  if (prev.nonGripperMarginMm !== curr.nonGripperMarginMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Margen Lateral de Pliego',
      category: 'dimensions',
      previousValue: `${prev.nonGripperMarginMm} mm`,
      newValue: `${curr.nonGripperMarginMm} mm`,
    };
  }

  if (
    prev.customPosesCount !== curr.customPosesCount ||
    prev.isCustomPosesActive !== curr.isCustomPosesActive ||
    prev.customPosesX !== curr.customPosesX ||
    prev.customPosesY !== curr.customPosesY
  ) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Esquema de Imposición (Poses)',
      category: 'dimensions',
      previousValue: prev.isCustomPosesActive ? `${prev.customPosesCount || `${prev.customPosesX}×${prev.customPosesY}`} poses (manual)` : 'Automático',
      newValue: curr.isCustomPosesActive ? `${curr.customPosesCount || `${curr.customPosesX}×${curr.customPosesY}`} poses (manual)` : 'Automático óptimo',
    };
  }

  if (prev.grammageGsm !== curr.grammageGsm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Gramaje del Papel',
      category: 'materials',
      previousValue: `${prev.grammageGsm} g/m²`,
      newValue: `${curr.grammageGsm} g/m²`,
    };
  }

  if (prev.paperCostPerSheet !== curr.paperCostPerSheet) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Costo por Pliego de Papel',
      category: 'materials',
      previousValue: `$${prev.paperCostPerSheet ?? '0.18'}/pliego`,
      newValue: `$${curr.paperCostPerSheet ?? '0.18'}/pliego`,
    };
  }

  if (prev.paperCostPerKg !== curr.paperCostPerKg) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Precio del Papel (kg)',
      category: 'materials',
      previousValue: `$${prev.paperCostPerKg}/kg`,
      newValue: `$${curr.paperCostPerKg}/kg`,
    };
  }

  if (prev.profitMarginPercent !== curr.profitMarginPercent || prev.profitMarginAmount !== curr.profitMarginAmount) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Margen Comercial / Utilidad',
      category: 'commercial',
      previousValue: prev.profitMarginMode === 'manual_amount' ? `$${prev.profitMarginAmount || 0}` : `${prev.profitMarginPercent}%`,
      newValue: curr.profitMarginMode === 'manual_amount' ? `$${curr.profitMarginAmount || 0}` : `${curr.profitMarginPercent}%`,
    };
  }

  if (prev.commissionPercent !== curr.commissionPercent || prev.commissionAmount !== curr.commissionAmount) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Comisión Comercial',
      category: 'commercial',
      previousValue: prev.commissionMode === 'manual_amount' ? `$${prev.commissionAmount || 0}` : `${prev.commissionPercent || 0}%`,
      newValue: curr.commissionMode === 'manual_amount' ? `$${curr.commissionAmount || 0}` : `${curr.commissionPercent || 0}%`,
    };
  }

  if (prev.taxPercent !== curr.taxPercent) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Impuesto / IVA',
      category: 'commercial',
      previousValue: `${prev.taxPercent}%`,
      newValue: `${curr.taxPercent}%`,
    };
  }

  if (prev.machineSpeedSheetsPerHour !== curr.machineSpeedSheetsPerHour) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Velocidad de Máquina',
      category: 'machine',
      previousValue: `${prev.machineSpeedSheetsPerHour} pl/h`,
      newValue: `${curr.machineSpeedSheetsPerHour} pl/h`,
    };
  }

  if (prev.machineHourlyRate !== curr.machineHourlyRate) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Costo Hora Máquina (Aravo)',
      category: 'machine',
      previousValue: `$${prev.machineHourlyRate}/h`,
      newValue: `$${curr.machineHourlyRate}/h`,
    };
  }

  if (prev.machineSetupMinutes !== curr.machineSetupMinutes) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Tiempo Puesta a Punto',
      category: 'machine',
      previousValue: `${prev.machineSetupMinutes} min`,
      newValue: `${curr.machineSetupMinutes} min`,
    };
  }

  if (prev.inkGramsPerM2 !== curr.inkGramsPerM2) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Base Consumo Tinta Offset',
      category: 'inks',
      previousValue: `${prev.inkGramsPerM2} g/m²`,
      newValue: `${curr.inkGramsPerM2} g/m²`,
    };
  }

  if (prev.inkCostPerKg !== curr.inkCostPerKg) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Precio Tinta Offset',
      category: 'inks',
      previousValue: `$${prev.inkCostPerKg}/kg`,
      newValue: `$${curr.inkCostPerKg}/kg`,
    };
  }

  if (prev.ctpPlateCost !== curr.ctpPlateCost) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Costo por Plancha CTP',
      category: 'materials',
      previousValue: `$${prev.ctpPlateCost}`,
      newValue: `$${curr.ctpPlateCost}`,
    };
  }

  if (prev.paperType !== curr.paperType) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Tipo de Papel',
      category: 'materials',
      previousValue: prev.paperType,
      newValue: curr.paperType,
    };
  }

  if (prev.isTwoSided !== curr.isTwoSided) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Caras de Impresión',
      category: 'machine',
      previousValue: prev.isTwoSided ? '2 caras (Tira/Retira)' : '1 cara (Solo Frente)',
      newValue: curr.isTwoSided ? '2 caras (Tira/Retira)' : '1 cara (Solo Frente)',
    };
  }

  if (prev.runWastePercent !== curr.runWastePercent) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Merma de Tirada',
      category: 'machine',
      previousValue: `${prev.runWastePercent}%`,
      newValue: `${curr.runWastePercent}%`,
    };
  }

  if (prev.gripperMarginMm !== curr.gripperMarginMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Pinza de Máquina',
      category: 'dimensions',
      previousValue: `${prev.gripperMarginMm} mm`,
      newValue: `${curr.gripperMarginMm} mm`,
    };
  }

  return null;
}

export function detectFlexoChanges(
  prev: FlexoJobParams,
  curr: FlexoJobParams
): RecentChangeItem | null {
  const time = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (prev.targetQuantity !== curr.targetQuantity || prev.quoteUnit !== curr.quoteUnit) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Cantidad / Unidad Objetivo',
      category: 'commercial',
      previousValue: `${prev.targetQuantity.toLocaleString()} ${prev.quoteUnit}`,
      newValue: `${curr.targetQuantity.toLocaleString()} ${curr.quoteUnit}`,
    };
  }

  if (prev.rollWidthMm !== curr.rollWidthMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Ancho de Bobina',
      category: 'dimensions',
      previousValue: `${prev.rollWidthMm} mm`,
      newValue: `${curr.rollWidthMm} mm`,
    };
  }

  if (prev.lanesAcross !== curr.lanesAcross) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Pistas Transversales',
      category: 'dimensions',
      previousValue: `${prev.lanesAcross} pistas`,
      newValue: `${curr.lanesAcross} pistas`,
    };
  }

  if (prev.labelWidthMm !== curr.labelWidthMm || prev.labelHeightMm !== curr.labelHeightMm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Medidas Etiqueta / Repetición',
      category: 'dimensions',
      previousValue: `${prev.labelWidthMm} × ${prev.labelHeightMm} mm`,
      newValue: `${curr.labelWidthMm} × ${curr.labelHeightMm} mm`,
    };
  }

  if (prev.cylinderRepeatMm !== curr.cylinderRepeatMm || prev.gearTeethZ !== curr.gearTeethZ) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Desarrollo Cilindro (Z)',
      category: 'machine',
      previousValue: `Z=${prev.gearTeethZ || 96} (${prev.cylinderRepeatMm} mm)`,
      newValue: `Z=${curr.gearTeethZ || 96} (${curr.cylinderRepeatMm} mm)`,
    };
  }

  if (prev.substrateGsm !== curr.substrateGsm) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Gramaje del Sustrato',
      category: 'materials',
      previousValue: `${prev.substrateGsm} g/m²`,
      newValue: `${curr.substrateGsm} g/m²`,
    };
  }

  if (prev.substrateCostPerKg !== curr.substrateCostPerKg) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Precio Bobina Sustrato',
      category: 'materials',
      previousValue: `$${prev.substrateCostPerKg}/kg`,
      newValue: `$${curr.substrateCostPerKg}/kg`,
    };
  }

  if (prev.profitMarginPercent !== curr.profitMarginPercent || prev.profitMarginAmount !== curr.profitMarginAmount) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Margen Comercial / Utilidad Flexo',
      category: 'commercial',
      previousValue: prev.profitMarginMode === 'manual_amount' ? `$${prev.profitMarginAmount || 0}` : `${prev.profitMarginPercent}%`,
      newValue: curr.profitMarginMode === 'manual_amount' ? `$${curr.profitMarginAmount || 0}` : `${curr.profitMarginPercent}%`,
    };
  }

  if (prev.commissionPercent !== curr.commissionPercent || prev.commissionAmount !== curr.commissionAmount) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Comisión Comercial Flexo',
      category: 'commercial',
      previousValue: prev.commissionMode === 'manual_amount' ? `$${prev.commissionAmount || 0}` : `${prev.commissionPercent || 0}%`,
      newValue: curr.commissionMode === 'manual_amount' ? `$${curr.commissionAmount || 0}` : `${curr.commissionPercent || 0}%`,
    };
  }

  if (prev.taxPercent !== curr.taxPercent) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Impuesto / IVA',
      category: 'commercial',
      previousValue: `${prev.taxPercent}%`,
      newValue: `${curr.taxPercent}%`,
    };
  }

  if (prev.machineSpeedMetersPerMinute !== curr.machineSpeedMetersPerMinute) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Velocidad Máquina Flexo',
      category: 'machine',
      previousValue: `${prev.machineSpeedMetersPerMinute} m/min`,
      newValue: `${curr.machineSpeedMetersPerMinute} m/min`,
    };
  }

  if (prev.machineHourlyRate !== curr.machineHourlyRate) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Costo Hora Máquina (Aravo)',
      category: 'machine',
      previousValue: `$${prev.machineHourlyRate}/h`,
      newValue: `$${curr.machineHourlyRate}/h`,
    };
  }

  if (prev.inkGramsPerM2 !== curr.inkGramsPerM2) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Base Consumo Tinta Flexo',
      category: 'inks',
      previousValue: `${prev.inkGramsPerM2} g/m²`,
      newValue: `${curr.inkGramsPerM2} g/m²`,
    };
  }

  if (prev.clicheCostPerPiece !== curr.clicheCostPerPiece) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Costo por Cliché Digital',
      category: 'materials',
      previousValue: `$${prev.clicheCostPerPiece}`,
      newValue: `$${curr.clicheCostPerPiece}`,
    };
  }

  if (prev.setupWasteMeters !== curr.setupWasteMeters) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Merma de Arranque Flexo',
      category: 'machine',
      previousValue: `${prev.setupWasteMeters} ml`,
      newValue: `${curr.setupWasteMeters} ml`,
    };
  }

  if (prev.labelsPerRoll !== curr.labelsPerRoll) {
    return {
      id: `chg_${Date.now()}`,
      timestamp: time,
      parameter: 'Etiquetas por Rollo',
      category: 'commercial',
      previousValue: `${prev.labelsPerRoll} etiq`,
      newValue: `${curr.labelsPerRoll} etiq`,
    };
  }

  return null;
}

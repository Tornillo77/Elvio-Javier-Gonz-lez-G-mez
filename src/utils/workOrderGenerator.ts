import {
  CutArrangement,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
} from '../types/graphic';
import { WorkOrderData } from '../types/workOrder';
import { computeFlexoMetrics } from './flexoCalculations';
import { calculateOffsetQuote } from './quoteCalculator';
import { getNextOtNumber, getNextQuoteNumber } from './correlativeService';

interface GenerateWorkOrderOptions {
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  arrangement?: CutArrangement;
  breakdown: QuoteBreakdown;
  customOrderNumber?: string;
  customQuoteNumber?: string;
}

export function generateWorkOrderData({
  technology,
  offsetParams,
  flexoParams,
  arrangement,
  breakdown,
  customOrderNumber,
  customQuoteNumber,
}: GenerateWorkOrderOptions): WorkOrderData {
  const isOffset = technology === 'offset';
  const now = new Date();
  const createdDateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const deliveryDateObj = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deliveryDateStr = deliveryDateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Unique sequential correlative or provided number
  const orderNumber = customOrderNumber || getNextOtNumber();
  const quoteNumber = customQuoteNumber || getNextQuoteNumber();

  if (isOffset) {
    const activeArrangement = arrangement || {
      orientation: 'horizontal' as const,
      posesTotal: Math.max(1, offsetParams.customPosesCount || 1),
      posesHorizontal: offsetParams.customPosesX || 1,
      posesVertical: offsetParams.customPosesY || 1,
      sheetWidth: offsetParams.sheetWidthMm,
      sheetHeight: offsetParams.sheetHeightMm,
      pieceWidth: offsetParams.pieceWidthMm,
      pieceHeight: offsetParams.pieceHeightMm,
      utilAreaMm2: 0,
      sheetAreaMm2: offsetParams.sheetWidthMm * offsetParams.sheetHeightMm,
      wasteAreaMm2: 0,
      utilPercentage: 82.5,
      wastePercentage: 17.5,
      cutPattern: { section1: { countX: 1, countY: 1, w: 100, h: 100, x0: 0, y0: 0 } },
    };

    const offsetQuote = calculateOffsetQuote(offsetParams, activeArrangement);
    const sheetAreaM2 = (offsetParams.sheetWidthMm * offsetParams.sheetHeightMm) / 1_000_000;
    const baseM2 = Number((offsetQuote.netSheets * sheetAreaM2).toFixed(2));
    const totalM2 = Number((offsetQuote.grossSheets * sheetAreaM2).toFixed(2));
    const baseMl = Number(((offsetQuote.netSheets * offsetParams.sheetHeightMm) / 1000).toFixed(1));
    const totalMl = Number(((offsetQuote.grossSheets * offsetParams.sheetHeightMm) / 1000).toFixed(1));
    const wasteMl = Number(Math.max(0, totalMl - baseMl).toFixed(1));

    const colorsCountFront = offsetParams.inkColorsFront.length;
    const colorsCountBack = offsetParams.isTwoSided ? offsetParams.inkColorsBack.length : 0;
    const colorsSpec = `${colorsCountFront}/${colorsCountBack} ${
      offsetParams.isTwoSided ? 'Frente y Dorso' : 'Solo Frente'
    } (${offsetParams.inkColorsFront.map((c) => c.name).join(', ')})`;

    const colorsList = [
      ...offsetParams.inkColorsFront.map((c) => ({
        name: `${c.name} (Frente)`,
        hex: c.colorHex,
        coverage: c.coveragePercent,
      })),
      ...(offsetParams.isTwoSided
        ? offsetParams.inkColorsBack.map((c) => ({
            name: `${c.name} (Dorso)`,
            hex: c.colorHex,
            coverage: c.coveragePercent,
          }))
        : []),
    ];

    const enabledFinishings = offsetParams.finishings
      .filter((f) => f.enabled)
      .map((f) => f.name);

    return {
      orderNumber,
      branchDestination: 'Planta Central - Taller Offset & Packaging',
      associatedOrderNumber: 'OT-2025-4109 (Histórica)',
      createdAt: createdDateStr,
      deliveryDate: deliveryDateStr,
      status: 'in_press',
      priority: 'normal',

      clientName: offsetParams.clientName || 'Cliente Industrial / Comercial',
      quoteNumber,
      commercialContact: offsetParams.clientContactPerson || 'Contacto Comercial',
      clientPhone: offsetParams.clientPhone || '+595 21 000-000',
      clientEmail: offsetParams.clientEmail || 'contacto@empresa.com',
      purchaseOrderNumber: `OC-${Math.floor(10000 + Math.random() * 90000)}`,
      accountExecutive: 'Ejecutivo de Cuentas - Ventas Aravo',
      clientTaxId: offsetParams.clientTaxId || '80012345-6',

      productName: offsetParams.jobName || 'Folleto / Packaging Offset',
      productDescription:
        offsetParams.productDescription ||
        `Impresión en ${offsetParams.paperType} ${offsetParams.grammageGsm} g/m². Formato abierto ${offsetParams.pieceWidthMm}×${offsetParams.pieceHeightMm} mm. ${enabledFinishings.length > 0 ? `Acabados: ${enabledFinishings.join(', ')}.` : 'Sin acabados especiales.'}`,
      requestedQuantity: offsetParams.quantityUnits,
      quantityUnit: 'unidades',

      technology: 'offset',
      budgetType: 'Offset Pliego Comercial / Editorial / Packaging',
      openSizeCm: `${(offsetParams.pieceWidthMm / 10).toFixed(1)} × ${(offsetParams.pieceHeightMm / 10).toFixed(1)} cm`,
      closedSizeCm: `${(offsetParams.pieceWidthMm / 10).toFixed(1)} × ${(offsetParams.pieceHeightMm / 10).toFixed(1)} cm`,
      pieceDimensionsMm: `${offsetParams.pieceWidthMm} × ${offsetParams.pieceHeightMm} mm`,

      assignedMachine: offsetParams.machineModelName || 'Heidelberg Speedmaster SM 74-4 Colores',
      colorsSpec,
      colorsList,
      webWidthMm: offsetParams.sheetWidthMm,
      printingForm: `Planchas CTP Térmico ${offsetParams.plateWidthMm || 745} × ${offsetParams.plateHeightMm || 605} mm (${offsetQuote.platesCount} Planchas)`,

      baseUnits: offsetParams.quantityUnits,
      baseSquareMeters: baseM2,
      totalSquareMeters: totalM2,
      baseLinearMeters: baseMl,
      wasteLinearMeters: wasteMl,
      totalLinearMeters: totalMl,
      paperFilmKg: Number(offsetQuote.paperWeightKg.toFixed(2)),
      inkKg: Number(breakdown.totalInkKg.toFixed(2)),
      setupTimeHours: breakdown.setupTimeHours,
      runTimeHours: breakdown.runTimeHours,
      totalTimeHours: breakdown.totalTimeHours,

      imposition: {
        sheetOrRollWidthMm: offsetParams.sheetWidthMm,
        sheetOrRollHeightMm: offsetParams.sheetHeightMm,
        pieceWidthMm: offsetParams.pieceWidthMm,
        pieceHeightMm: offsetParams.pieceHeightMm,
        posesTotal: activeArrangement.posesTotal,
        posesX: activeArrangement.cutPattern?.section1?.countX || 1,
        posesY: activeArrangement.cutPattern?.section1?.countY || 1,
        orientation: activeArrangement.orientation,
        gripperMarginMm: offsetParams.gripperMarginMm,
        nonGripperMarginMm: offsetParams.nonGripperMarginMm,
        gutterMm: offsetParams.gutterMm,
        bleedMm: offsetParams.bleedMm,
        utilizationPercent: Number(activeArrangement.utilPercentage.toFixed(1)),
        wastePercent: Number(activeArrangement.wastePercentage.toFixed(1)),
      },

      offsetCutting: {
        rawSheetFormatName: offsetParams.sheetFormatId || '960 × 660 mm (Pliego Estándar)',
        rawSheetWidthMm: offsetParams.sheetWidthMm,
        rawSheetHeightMm: offsetParams.sheetHeightMm,
        pressSheetWidthMm: offsetParams.sheetWidthMm,
        pressSheetHeightMm: offsetParams.sheetHeightMm,
        cutsFromRawSheet: 1,
        grainDirection: 'long_grain',
        step1GuillotineCut: `Corte a escuadra base: Pinza ${offsetParams.gripperMarginMm} mm y refilado lateral ${offsetParams.nonGripperMarginMm} mm`,
        step2GuillotineCut: `Cortes de subdivisión por calle ${offsetParams.gutterMm} mm y sangría ${offsetParams.bleedMm} mm`,
        gripperMarginMm: offsetParams.gripperMarginMm,
        nonGripperMarginMm: offsetParams.nonGripperMarginMm,
        gutterMm: offsetParams.gutterMm,
        bleedMm: offsetParams.bleedMm,
      },

      polymerCm2: 0,
      centralLaneMm: 0,
      advanceLaneMm: 0,
      sideLaneMm: 0,
      lanesAcross: 0,
      repeatsAlong: 0,

      finishingInstructions:
        enabledFinishings.length > 0
          ? enabledFinishings
          : ['Corte guillotina final a registro de marcas', 'Empaque en paquetes termosellados de 250 unidades'],
      packagingInstructions:
        'Empaque en cajas corrugadas identificadas con rótulo de OT, cliente y cantidad.',
      operatorNotes:
        'Verificar registro de pinza en pliegos testigo cada 500 tiros. Controlar densidad con densitómetro.',
    };
  }

  // FLEXO
  const flexoMetrics = computeFlexoMetrics(flexoParams);
  const colorsSpec = `${flexoParams.inkColors.length} Colores (${flexoParams.inkColors.map((c) => c.name).join(', ')})`;
  const colorsList = flexoParams.inkColors.map((c) => ({
    name: c.name,
    hex: c.colorHex,
    coverage: c.coveragePercent,
  }));

  const enabledFinishings = flexoParams.finishings
    .filter((f) => f.enabled)
    .map((f) => f.name);

  // Flexo Specific calculations
  const stepAlongMm = flexoParams.labelHeightMm + flexoParams.gapAlongMm;
  const centralLaneMm = flexoParams.gapAcrossMm;
  const advanceLaneMm = flexoParams.gapAlongMm;
  const usedWidthMm =
    flexoParams.lanesAcross * flexoParams.labelWidthMm +
    Math.max(0, flexoParams.lanesAcross - 1) * centralLaneMm;
  const sideLaneMm = Number(Math.max(0, (flexoParams.rollWidthMm - usedWidthMm) / 2).toFixed(1));

  // Cm2 Polimero / Cliché: (Ancho bobina ocupada + 3cm margen) * (Desarrollo + 3cm margen) / 100 * Colores
  const polymerCm2 = Math.round(
    ((usedWidthMm + 30) * (flexoMetrics.cylinderDevelopmentMm + 30) / 100) *
      Math.max(1, flexoParams.inkColors.length)
  );

  return {
    orderNumber,
    branchDestination: 'Sucursal Etiquetas - Línea Rotativa Flexográfica',
    associatedOrderNumber: 'OT-2025-3890 (Repetición)',
    createdAt: createdDateStr,
    deliveryDate: deliveryDateStr,
    status: 'in_press',
    priority: 'normal',

    clientName: flexoParams.clientName || 'Cliente Autoadhesivos & Etiquetas',
    quoteNumber,
    commercialContact: flexoParams.clientContactPerson || 'Contacto Comercial',
    clientPhone: flexoParams.clientPhone || '+595 21 000-000',
    clientEmail: flexoParams.clientEmail || 'contacto@empresa.com',
    purchaseOrderNumber: `OC-${Math.floor(10000 + Math.random() * 90000)}`,
    accountExecutive: 'Ejecutivo de Cuentas - Ventas Aravo',
    clientTaxId: flexoParams.clientTaxId || '80054321-9',

    productName: flexoParams.jobName || 'Etiquetas Autoadhesivas en Rollo',
    productDescription:
      flexoParams.productDescription ||
      `Sustrato: ${flexoParams.substrateType} ${flexoParams.substrateGsm} g/m² (${flexoParams.substrateMicrons || 50} µm). Medida: ${flexoParams.labelWidthMm}×${flexoParams.labelHeightMm} mm. Sentido bobinado #${flexoParams.windingDirection || 1} (${flexoParams.windingDirectionManual || 'Salida cabeza'}). Buje ${flexoParams.coreDiameterInches || 3}". ${flexoParams.labelsPerRoll} etiq/rollo. ${enabledFinishings.length > 0 ? `Acabados: ${enabledFinishings.join(', ')}.` : ''}`,
    requestedQuantity: flexoMetrics.totalLabelsOrUnits,
    quantityUnit: 'etiquetas',

    technology: 'flexo',
    budgetType: 'Flexografía Banda Angosta 350mm (Autoadhesivo / Film)',
    openSizeCm: `${(flexoParams.labelWidthMm / 10).toFixed(1)} × ${(flexoParams.labelHeightMm / 10).toFixed(1)} cm`,
    closedSizeCm: `${(flexoParams.labelWidthMm / 10).toFixed(1)} × ${(flexoParams.labelHeightMm / 10).toFixed(1)} cm`,
    pieceDimensionsMm: `${flexoParams.labelWidthMm} × ${flexoParams.labelHeightMm} mm`,

    assignedMachine: flexoParams.machineModelName || 'Mark Andy 2200 350mm (6 Colores UV)',
    colorsSpec,
    colorsList,
    webWidthMm: flexoParams.rollWidthMm,
    printingForm: `Cilindro desarrollo ${flexoMetrics.cylinderDevelopmentMm} mm (${flexoParams.gearTeethZ ? `Z=${flexoParams.gearTeethZ} dientes paso 1/8"` : `${flexoMetrics.labelsAlongRepeat} repeticiones`}) • ${flexoParams.inkColors.length} Fotopolímeros Cyrel`,

    baseUnits: flexoMetrics.totalLabelsOrUnits,
    baseSquareMeters: flexoMetrics.netM2,
    totalSquareMeters: flexoMetrics.grossM2,
    baseLinearMeters: flexoMetrics.netLinearMeters,
    wasteLinearMeters: flexoMetrics.totalWasteMeters,
    totalLinearMeters: flexoMetrics.grossLinearMeters,
    paperFilmKg: flexoMetrics.grossWeightKg,
    inkKg: Number(breakdown.totalInkKg.toFixed(2)),
    setupTimeHours: breakdown.setupTimeHours,
    runTimeHours: breakdown.runTimeHours,
    totalTimeHours: breakdown.totalTimeHours,

    imposition: {
      sheetOrRollWidthMm: flexoParams.rollWidthMm,
      sheetOrRollHeightMm: flexoMetrics.cylinderDevelopmentMm,
      pieceWidthMm: flexoParams.labelWidthMm,
      pieceHeightMm: flexoParams.labelHeightMm,
      posesTotal: flexoParams.lanesAcross * flexoMetrics.labelsAlongRepeat,
      posesX: flexoParams.lanesAcross,
      posesY: flexoMetrics.labelsAlongRepeat,
      orientation: 'vertical',
      gripperMarginMm: sideLaneMm,
      nonGripperMarginMm: sideLaneMm,
      gutterMm: flexoParams.gapAcrossMm,
      bleedMm: flexoParams.gapAlongMm,
      utilizationPercent: Number(
        (((usedWidthMm * (flexoMetrics.labelsAlongRepeat * flexoParams.labelHeightMm)) /
          (flexoParams.rollWidthMm * flexoMetrics.cylinderDevelopmentMm)) *
          100).toFixed(1)
      ),
      wastePercent: Number(
        (100 -
          ((usedWidthMm * (flexoMetrics.labelsAlongRepeat * flexoParams.labelHeightMm)) /
            (flexoParams.rollWidthMm * flexoMetrics.cylinderDevelopmentMm)) *
            100).toFixed(1)
      ),
    },

    flexoCylinderScheme: {
      cylinderRepeatMm: flexoMetrics.cylinderDevelopmentMm,
      gearTeethZ: flexoParams.gearTeethZ,
      lanesAcross: flexoParams.lanesAcross,
      repeatsAlong: flexoMetrics.labelsAlongRepeat,
      rollWidthMm: flexoParams.rollWidthMm,
      labelWidthMm: flexoParams.labelWidthMm,
      labelHeightMm: flexoParams.labelHeightMm,
      gapAcrossMm: flexoParams.gapAcrossMm,
      gapAlongMm: flexoParams.gapAlongMm,
      sideLaneMm,
      usableWidthMm: usedWidthMm,
    },

    flexoSlitting: {
      masterRollWidthMm: flexoParams.rollWidthMm,
      slittedRollWidthMm: flexoParams.labelWidthMm + flexoParams.gapAcrossMm,
      lanesCount: flexoParams.lanesAcross,
      sideTrimLeftMm: sideLaneMm,
      sideTrimRightMm: sideLaneMm,
      totalUsedWidthMm: usedWidthMm,
      windingDirection: (flexoParams.windingDirection as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) || 1,
      windingDirectionManual:
        flexoParams.windingDirectionManual ||
        (flexoParams.windingDirection === 2
          ? '2. Bobinado exterior - Salida derecha'
          : flexoParams.windingDirection === 3
          ? '3. Bobinado exterior - Salida de pie'
          : flexoParams.windingDirection === 4
          ? '4. Bobinado exterior - Salida cabeza'
          : flexoParams.windingDirection === 5
          ? '5. Bobinado interior - Salida izquierda'
          : flexoParams.windingDirection === 6
          ? '6. Bobinado interior - Salida derecha'
          : flexoParams.windingDirection === 7
          ? '7. Bobinado interior - Salida de pie'
          : flexoParams.windingDirection === 8
          ? '8. Bobinado interior - Salida cabeza'
          : '1. Bobinado exterior - Salida izquierda'),
      coreDiameterInches: flexoParams.coreDiameterInches || 3,
      labelsPerRoll: flexoParams.labelsPerRoll || 1000,
      totalRolls: flexoMetrics.numberOfRolls,
      outerDiameterMm: flexoMetrics.estimatedRollOuterDiameterMm,
    },

    windingDirectionNumber: (flexoParams.windingDirection as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) || 1,
    windingDirectionLabel: `Sentido ${flexoParams.windingDirection || 1}`,
    windingDirectionManual:
      flexoParams.windingDirectionManual ||
      (flexoParams.windingDirection === 2
        ? '2. Bobinado exterior - Salida derecha'
        : flexoParams.windingDirection === 3
        ? '3. Bobinado exterior - Salida de pie'
        : flexoParams.windingDirection === 4
        ? '4. Bobinado exterior - Salida cabeza'
        : flexoParams.windingDirection === 5
        ? '5. Bobinado interior - Salida izquierda'
        : flexoParams.windingDirection === 6
        ? '6. Bobinado interior - Salida derecha'
        : flexoParams.windingDirection === 7
        ? '7. Bobinado interior - Salida de pie'
        : flexoParams.windingDirection === 8
        ? '8. Bobinado interior - Salida cabeza'
        : '1. Bobinado exterior - Salida izquierda'),

    polymerCm2,
    centralLaneMm,
    advanceLaneMm,
    sideLaneMm,
    lanesAcross: flexoParams.lanesAcross,
    repeatsAlong: flexoMetrics.labelsAlongRepeat,

    finishingInstructions:
      enabledFinishings.length > 0
        ? enabledFinishings
        : [
            'Troquelado rotativo con cilindro magnético y plancha flexible',
            'Desmallado de matriz sobrante con rebobinador de desperdicio',
            'Corte longitudinal y rebobinado a buje de 3 pulgadas',
          ],
    packagingInstructions: `Embalar en cajas de cartón con separadores plásticos. ${flexoMetrics.numberOfRolls} rollos de ${flexoParams.labelsPerRoll} etiquetas cada uno. Etiquetar cada rollo con lote y sentido de bobinado.`,
    operatorNotes:
      'Controlar tensión de desenrollado en estación de entrada y secado UV a máxima potencia. Verificar adherencia con cinta adhesiva de prueba.',
  };
}

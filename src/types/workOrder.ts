import { PrintTechnology } from './graphic';

export type WorkOrderStatus =
  | 'pending'
  | 'approved'
  | 'in_press'
  | 'post_press'
  | 'quality_control'
  | 'completed'
  | 'cancelled';

export type WorkOrderPriority = 'normal' | 'urgent' | 'scheduled';

export type FlexoWindingDirection = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WorkOrderData {
  // 1. Encabezado y Datos Generales
  orderNumber: string; // ej. OT-2026-0842
  branchDestination: string; // ej. "Sucursal Etiquetas", "Planta Principal"
  associatedOrderNumber: string; // ej. "OT-2025-0512 (Repetición)"
  createdAt: string; // Fecha emisión
  deliveryDate: string; // Fecha entrega estimada
  status: WorkOrderStatus;
  priority: WorkOrderPriority;

  // 2. Datos del Cliente y Facturación
  clientName: string;
  quoteNumber: string; // Presupuesto N°
  commercialContact: string;
  clientPhone: string;
  clientEmail: string;
  purchaseOrderNumber: string; // OC N°
  accountExecutive: string; // Ejecutivo de Cuenta
  clientTaxId: string; // RUC / CUIT

  // 3. Detalle del Producto y Especificaciones
  productName: string;
  productDescription: string;
  requestedQuantity: number;
  quantityUnit: string; // ej. "unidades", "etiquetas", "pliegos"

  // 4. Generalidades y Formato
  technology: PrintTechnology;
  budgetType: string; // ej. "Flexografía Bobina Autoadhesiva", "Offset Packaging"
  openSizeCm: string; // ej. "15.0 × 22.0 cm"
  closedSizeCm: string; // ej. "15.0 × 11.0 cm"
  pieceDimensionsMm: string; // ej. "150 × 220 mm"

  // 5. Parámetros Técnicos de Producción y Máquina
  assignedMachine: string; // ej. "Heidelberg Speedmaster SM 74", "Mark Andy 2200 350mm"
  colorsSpec: string; // ej. "4/0 CMYK Frente", "6 Colores UV"
  colorsList: { name: string; hex: string; coverage: number }[];
  webWidthMm: number; // Ancho de Bobina (mm) / Ancho pliego
  printingForm: string; // Cilindro y desarrollo / Planchas CTP

  // 6. Cálculos Automáticos (generados por Aravo)
  baseUnits: number; // Unidades Base
  baseSquareMeters: number; // Metros² Base
  totalSquareMeters: number; // Metros² Totales
  baseLinearMeters: number; // Metros Lineales Base
  wasteLinearMeters: number; // Metros Lineales Excedentes (Merma)
  totalLinearMeters: number; // Metros Lineales Totales
  paperFilmKg: number; // Kilos de Papel / Film
  inkKg: number; // Kilos de Tintas
  setupTimeHours: number; // Horas puesta a punto
  runTimeHours: number; // Horas tirada
  totalTimeHours: number; // Tiempo Aravo Total (h)

  // 7. Controles de Esquema de Imposición
  imposition: {
    sheetOrRollWidthMm: number;
    sheetOrRollHeightMm: number;
    pieceWidthMm: number;
    pieceHeightMm: number;
    posesTotal: number;
    posesX: number;
    posesY: number;
    orientation: string;
    gripperMarginMm: number;
    nonGripperMarginMm: number;
    gutterMm: number;
    bleedMm: number;
    utilizationPercent: number;
    wastePercent: number;
  };

  // Esquema de Cilindro y Pistas Flexo
  flexoCylinderScheme?: {
    cylinderRepeatMm: number; // Desarrollo en mm
    gearTeethZ?: number; // Dientes Z
    lanesAcross: number; // Pistas / Formas al eje
    repeatsAlong: number; // Formas al avance por revolución
    rollWidthMm: number; // Ancho de bobina
    labelWidthMm: number;
    labelHeightMm: number;
    gapAcrossMm: number; // Calle central
    gapAlongMm: number; // Calle al avance
    sideLaneMm: number; // Calle lateral / orillos
    usableWidthMm: number;
  };

  // 8. Parámetros de Refilado y Bobinado (Flexo)
  flexoSlitting?: {
    masterRollWidthMm: number;
    slittedRollWidthMm: number;
    lanesCount: number;
    sideTrimLeftMm: number;
    sideTrimRightMm: number;
    totalUsedWidthMm: number;
    windingDirection: FlexoWindingDirection; // 1 to 8
    windingDirectionManual?: string; // Indicación manual o descripción personalizada
    windingDirectionImageUrl?: string; // Imagen personalizada o foto de bobina
    coreDiameterInches: number; // 1", 1.5", 3"
    labelsPerRoll: number;
    totalRolls: number;
    outerDiameterMm: number;
  };

  // Sentido de bobinado para visualización y cabecera de OT
  windingDirectionNumber?: FlexoWindingDirection;
  windingDirectionLabel?: string;
  windingDirectionManual?: string;
  windingDirectionImageUrl?: string;

  // 9. Parámetros de Corte de Papel (Offset)
  offsetCutting?: {
    rawSheetFormatName: string;
    rawSheetWidthMm: number;
    rawSheetHeightMm: number;
    pressSheetWidthMm: number;
    pressSheetHeightMm: number;
    cutsFromRawSheet: number;
    grainDirection: 'long_grain' | 'short_grain';
    step1GuillotineCut: string;
    step2GuillotineCut: string;
    gripperMarginMm: number;
    nonGripperMarginMm: number;
    gutterMm: number;
    bleedMm: number;
  };

  // 10. Parámetros Flexo específicos
  polymerCm2: number; // Cm² Polímero
  centralLaneMm: number; // Calle Central
  advanceLaneMm: number; // Calle al Avance
  sideLaneMm: number; // Calle Lateral (Orillos)
  lanesAcross: number; // Formas al Eje
  repeatsAlong: number; // Formas al Avance

  // Instrucciones Adicionales & Acabados
  finishingInstructions: string[];
  packagingInstructions: string;
  operatorNotes: string;
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CurrencyConfig,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
  RecentChangeItem,
} from '../types/graphic';
import { getNextQuoteNumber } from './correlativeService';

export interface ExportPDFOptions {
  appName: string;
  appSubtitle: string;
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  breakdown: QuoteBreakdown;
  currency: CurrencyConfig;
  isDetailed?: boolean;
  recentChanges?: RecentChangeItem[];
  customQuoteNumber?: string;
}

export function exportBudgetToPDF(options: ExportPDFOptions): void {
  const {
    appName,
    appSubtitle,
    technology,
    offsetParams,
    flexoParams,
    breakdown,
    currency,
    isDetailed = true,
    recentChanges = [],
    customQuoteNumber,
  } = options;

  const isOffset = technology === 'offset';
  const activeParams = isOffset ? offsetParams : flexoParams;

  // Initialize jsPDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const accentColor: [number, number, number] = [217, 119, 6]; // Amber-600 #d97706
  const lightBgColor: [number, number, number] = [248, 250, 252]; // Slate-50 #f8fafc
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate-200 #e2e8f0
  const textColor: [number, number, number] = [51, 65, 85]; // Slate-700 #334155
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate-900

  // 1. HEADER BANNER
  // Top brand bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(...accentColor);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // App Name & Logo mark (Aravo Cyan Brand)
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.roundedRect(margin, 5, 18, 18, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(2, 6, 23); // Slate-950
  const logoLetter = (appName.trim().charAt(0) || 'A').toUpperCase();
  doc.text(logoLetter, margin + 9, 17, { align: 'center' });

  // Brand text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(appName.toUpperCase(), margin + 22, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  const cleanSubtitle = appSubtitle.length > 55 ? `${appSubtitle.slice(0, 52)}...` : appSubtitle;
  doc.text(cleanSubtitle, margin + 22, 19);

  // Quote Metadata on right
  const quoteNumber = customQuoteNumber || activeParams.quoteNumber || getNextQuoteNumber();
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11); // Amber
  doc.text(quoteNumber, pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Fecha: ${currentDate}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(
    `Tecnología: ${isOffset ? 'Offset a Pliego' : 'Flexografía a Bobina'}`,
    pageWidth - margin,
    21,
    { align: 'right' }
  );

  let currentY = 36;

  // 2. CLIENT & PROJECT INFORMATION BOX
  const hasDesc = Boolean(activeParams.productDescription);
  const clientBoxHeight = hasDesc ? 31 : 24;
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, clientBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('CLIENTE:', margin + 4, currentY + 7);
  doc.text('TRABAJO / PROYECTO:', margin + 4, currentY + 14);
  if (hasDesc) {
    doc.text('DESCRIPCIÓN:', margin + 4, currentY + 21);
    doc.text('CANTIDAD SOLICITADA:', margin + 4, currentY + 28);
  } else {
    doc.text('CANTIDAD SOLICITADA:', margin + 4, currentY + 21);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);
  const clientLine = activeParams.clientContactPerson
    ? `${activeParams.clientName || 'Cliente General'} (Attn: ${activeParams.clientContactPerson}${activeParams.clientPhone ? ` - Tel: ${activeParams.clientPhone}` : ''})`
    : activeParams.clientName || 'Cliente General';
  doc.text(clientLine.length > 55 ? `${clientLine.slice(0, 52)}...` : clientLine, margin + 46, currentY + 7);
  doc.text(activeParams.jobName || 'Trabajo Gráfico', margin + 46, currentY + 14);

  if (hasDesc) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const descText = activeParams.productDescription!;
    doc.text(descText.length > 72 ? `${descText.slice(0, 70)}...` : descText, margin + 46, currentY + 21);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...accentColor);
  const qtyFormatted = `${breakdown.netProductionUnits.toLocaleString()} ${
    isOffset
      ? 'unidades'
      : flexoParams.quoteUnit === 'units'
      ? 'etiquetas'
      : flexoParams.quoteUnit === 'm2'
      ? 'm²'
      : flexoParams.quoteUnit === 'linear_meter'
      ? 'ml'
      : 'kg'
  }`;
  doc.text(qtyFormatted, margin + 46, hasDesc ? currentY + 28 : currentY + 21);

  // Technical badge on right side of customer box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TIEMPO ARAVO:', pageWidth - margin - 45, currentY + 7);
  doc.text('SUSTRATO:', pageWidth - margin - 45, currentY + 14);
  doc.text('MERMA TOTAL:', pageWidth - margin - 45, currentY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(`${breakdown.totalTimeHours} h`, pageWidth - margin - 4, currentY + 7, { align: 'right' });
  const substrateLabel = isOffset ? `${offsetParams.paperType}` : `${flexoParams.substrateType}`;
  const shortSubstrate = substrateLabel.length > 20 ? `${substrateLabel.slice(0, 18)}...` : substrateLabel;
  doc.text(shortSubstrate, pageWidth - margin - 4, currentY + 14, { align: 'right' });
  doc.text(`${breakdown.wasteTotalPercent}%`, pageWidth - margin - 4, currentY + 21, { align: 'right' });

  currentY += hasDesc ? 35 : 28;

  // 3. TECHNICAL SPECIFICATIONS TILES
  const tileWidth = (contentWidth - 6) / 3;
  const tileHeight = 16;

  // Tile 1: Formato
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, tileWidth, tileHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FORMATO / DESARROLLO', margin + 3, currentY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...darkTextColor);
  const formatText = isOffset
    ? `${offsetParams.pieceWidthMm} × ${offsetParams.pieceHeightMm} mm (${offsetParams.sheetWidthMm}×${offsetParams.sheetHeightMm})`
    : `${flexoParams.labelWidthMm} × ${flexoParams.labelHeightMm} mm (Bobina ${flexoParams.rollWidthMm}mm)`;
  doc.text(formatText, margin + 3, currentY + 11);

  // Tile 2: Sustrato / Gramaje
  const tile2X = margin + tileWidth + 3;
  doc.roundedRect(tile2X, currentY, tileWidth, tileHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GRAMAJE & PESO TOTAL', tile2X + 3, currentY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...darkTextColor);
  const weightText = isOffset
    ? `${offsetParams.grammageGsm} g/m² • ${breakdown.substrateTotalWeightKg} kg (${breakdown.totalSheetsOrMeters.toLocaleString()} pl)`
    : `${flexoParams.substrateGsm} g/m² • ${breakdown.substrateTotalWeightKg} kg (${breakdown.totalSheetsOrMeters.toLocaleString()} ml)`;
  doc.text(weightText, tile2X + 3, currentY + 11);

  // Tile 3: Tintas y Matrices
  const tile3X = tile2X + tileWidth + 3;
  doc.roundedRect(tile3X, currentY, tileWidth, tileHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PLANCHA CTP & TINTAS', tile3X + 3, currentY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...darkTextColor);
  const inksText = isOffset
    ? `${offsetParams.plateWidthMm || 745}×${offsetParams.plateHeightMm || 605}mm • ${breakdown.totalInkKg}kg tinta`
    : `${breakdown.totalInkKg} kg tinta • Clichés Flexo`;
  doc.text(inksText, tile3X + 3, currentY + 11);

  currentY += tileHeight + 6;

  // 4. COST BREAKDOWN TABLE (autoTable)
  const formatMoney = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })}`;
  };

  const tableBody: (string | number)[][] = [];

  if (isDetailed) {
    // 1. Materia Prima
    const offsetSheetAreaM2 = (offsetParams.sheetWidthMm * offsetParams.sheetHeightMm) / 1_000_000;
    const offsetSheetWeightKg = (offsetSheetAreaM2 * offsetParams.grammageGsm) / 1000;
    const offsetSheetCost =
      offsetParams.paperCostPerSheet !== undefined && offsetParams.paperCostPerSheet > 0
        ? offsetParams.paperCostPerSheet
        : Number((offsetSheetWeightKg * offsetParams.paperCostPerKg).toFixed(4));

    tableBody.push([
      `1. Materia Prima / Sustrato (${isOffset ? 'Papel' : 'Bobina'})`,
      isOffset
        ? `${breakdown.totalSheetsOrMeters.toLocaleString()} pliegos a ${formatMoney(offsetSheetCost)}/pliego (${breakdown.substrateTotalWeightKg} kg)`
        : `${breakdown.totalSheetsOrMeters.toLocaleString()} ml (${breakdown.substrateTotalWeightKg} kg a ${formatMoney(flexoParams.substrateCostPerKg)}/kg)`,
      formatMoney(breakdown.substrateCost),
    ]);

    // 2. Tintas
    tableBody.push([
      '2. Consumo de Tinta por Metro Cuadrado (m²)',
      `${breakdown.totalInkKg} kg requeridos (${isOffset ? `${offsetParams.inkGramsPerM2} g/m² Offset` : `${flexoParams.inkGramsPerM2} g/m² Flexo`} con cobertura)`,
      formatMoney(breakdown.inkCost),
    ]);

    // 3. Matrices
    tableBody.push([
      `3. Matrices (${isOffset ? 'Planchas CTP' : 'Fotopolímeros Clichés'})`,
      isOffset
        ? `${offsetParams.inkColorsFront.length + (offsetParams.isTwoSided ? offsetParams.inkColorsBack.length : 0)} planchas térmicas CTP`
        : `${flexoParams.inkColors.length} clichés fotopolímeros digitales`,
      formatMoney(breakdown.platesCost),
    ]);

    // 4. Maquinado Aravo
    tableBody.push([
      '4. Tiempos de Maquinado (Aravo)',
      `${breakdown.totalTimeHours} h de máquina (Prep: ${breakdown.setupTimeHours}h • Tiro: ${breakdown.runTimeHours}h)`,
      formatMoney(breakdown.machineTimeCost),
    ]);

    // 5. Acabados
    const activeFinishes = activeParams.finishings
      .filter((f) => f.enabled)
      .map((f) => f.name)
      .join(', ');
    tableBody.push([
      '5. Acabados y Terminación Post-Prensa',
      activeFinishes || 'Sin procesos de acabado adicionales',
      formatMoney(breakdown.finishingsCost),
    ]);

    // Subtotal Fabril
    tableBody.push([
      'COSTO TOTAL DE PRODUCCIÓN (Costo Fabril)',
      `Merma global estimada: ${breakdown.wasteTotalPercent}%`,
      formatMoney(breakdown.totalProductionCost),
    ]);

    // Margen Utilidad
    tableBody.push([
      `Margen Comercial / Utilidad (${breakdown.profitPercent ?? activeParams.profitMarginPercent}%)`,
      'Rentabilidad industrial calculada',
      `+${formatMoney(breakdown.profitAmount)}`,
    ]);

    // Comisión Comercial
    if (breakdown.commissionAmount && breakdown.commissionAmount > 0) {
      tableBody.push([
        `Comisión Comercial (${breakdown.commissionPercent ?? activeParams.commissionPercent ?? 0}%)`,
        'Comisión comercial / Asesor de ventas',
        `+${formatMoney(breakdown.commissionAmount)}`,
      ]);
    }

    // IVA
    tableBody.push([
      `Impuesto al Valor Agregado / IVA (${activeParams.taxPercent}%)`,
      'Tributación fiscal oficial',
      `+${formatMoney(breakdown.taxAmount)}`,
    ]);
  } else {
    // Client view (cleaner items)
    tableBody.push([
      `Producción Gráfica: ${activeParams.jobName}`,
      `${qtyFormatted} en ${isOffset ? offsetParams.paperType : flexoParams.substrateType}`,
      formatMoney(breakdown.subtotalWithProfit),
    ]);
    tableBody.push([
      `Impuesto al Valor Agregado / IVA (${activeParams.taxPercent}%)`,
      'Impuesto oficial sobre el servicio',
      formatMoney(breakdown.taxAmount),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['RUBRO / CONCEPTO', 'DETALLE TÉCNICO Y RENDIMIENTO', 'SUBTOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor,
      cellPadding: 2.3,
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight the Costo Total row
      if (data.row.index === 5 && isDetailed) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Calculate position after table
  // @ts-ignore
  const finalTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : currentY + 70;

  // 5. GRAND TOTAL BOX & UNIT PRICING
  const totalBoxY = finalTableY;
  const totalBoxHeight = 28;

  // Box background
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11); // Amber-500
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, totalBoxY, contentWidth, totalBoxHeight, 2.5, 2.5, 'FD');

  // Left side: Grand total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text('PRECIO TOTAL COTIZADO (CON IVA)', margin + 5, totalBoxY + 8);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(formatMoney(breakdown.finalTotalPrice), margin + 5, totalBoxY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Validez: 15 días corridos • Condición: Contado / Facturado', margin + 5, totalBoxY + 24);

  // Right side: Unit price pills
  const unitBoxX = pageWidth - margin - 85;
  const pillW = 26;
  const pillH = 18;
  const pillY = totalBoxY + 5;

  // Unitario
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.roundedRect(unitBoxX, pillY, pillW, pillH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PRECIO UNIT.', unitBoxX + pillW / 2, pillY + 5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`${currency.symbol}${breakdown.pricePerUnit.toFixed(Math.max(2, currency.decimals))}`, unitBoxX + pillW / 2, pillY + 12, { align: 'center' });

  // Millar
  const pill2X = unitBoxX + pillW + 3;
  doc.roundedRect(pill2X, pillY, pillW, pillH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('POR MILLAR', pill2X + pillW / 2, pillY + 5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMoney(breakdown.pricePerThousand), pill2X + pillW / 2, pillY + 12, { align: 'center' });

  // Third Pill (m² or Kg if Flexo, or Total Aravo Hours if Offset)
  const pill3X = pill2X + pillW + 3;
  doc.roundedRect(pill3X, pillY, pillW, pillH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  if (!isOffset && breakdown.pricePerM2) {
    doc.text('PRECIO / M²', pill3X + pillW / 2, pillY + 5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199); // Sky-600
    doc.text(formatMoney(breakdown.pricePerM2), pill3X + pillW / 2, pillY + 12, { align: 'center' });
  } else if (!isOffset && breakdown.pricePerKg) {
    doc.text('PRECIO / KG', pill3X + pillW / 2, pillY + 5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.text(formatMoney(breakdown.pricePerKg), pill3X + pillW / 2, pillY + 12, { align: 'center' });
  } else {
    doc.text('ARAVO TIEMPO', pill3X + pillW / 2, pillY + 5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${breakdown.totalTimeHours} h`, pill3X + pillW / 2, pillY + 12, { align: 'center' });
  }

  // 6. RECENT CHANGES AUDIT NOTE (if any) & SIGNATURES
  if (recentChanges && recentChanges.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const auditSummary = recentChanges
      .slice(0, 3)
      .map((c) => `${c.parameter} (${c.previousValue} -> ${c.newValue})`)
      .join(' • ');
    const auditLine = `Historial de cambios aplicados: ${auditSummary}`;
    doc.text(
      auditLine.length > 130 ? `${auditLine.slice(0, 127)}...` : auditLine,
      margin + 2,
      totalBoxY + totalBoxHeight + 6
    );
  }

  // 7. SIGNATURES & CONDITIONS
  const signY = totalBoxY + totalBoxHeight + 14;
  const signWidth = (contentWidth - 20) / 2;

  // Left: Estimations Department
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, signY + 14, margin + 5 + signWidth, signY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Departamento de Estimaciones & Costos', margin + 5 + signWidth / 2, signY + 19, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Sistema ${appName} • Validación Técnica`, margin + 5 + signWidth / 2, signY + 23, {
    align: 'center',
  });

  // Right: Client Acceptance
  const clientSignX = margin + signWidth + 15;
  doc.line(clientSignX, signY + 14, clientSignX + signWidth, signY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Aceptación y Aprobación del Cliente', clientSignX + signWidth / 2, signY + 19, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Firma, Aclaración y Fecha de Confirmación', clientSignX + signWidth / 2, signY + 23, {
    align: 'center',
  });

  // 7. FOOTER BAR
  doc.setDrawColor(...borderColor);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento oficial generado por ${appName} • Página 1 de 1`,
    margin,
    pageHeight - 6
  );
  doc.text(
    'Cálculos técnicos según normas de taller gráfico',
    pageWidth - margin,
    pageHeight - 6,
    { align: 'right' }
  );

  // Generate clean filename
  const cleanJobName = (activeParams.jobName || 'Presupuesto')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 25);
  const fileName = `${appName.toLowerCase()}_${quoteNumber.toLowerCase()}_${cleanJobName}.pdf`;

  // Download the PDF
  doc.save(fileName);
}

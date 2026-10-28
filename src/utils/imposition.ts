import { CutArrangement } from '../types/graphic';

export interface ImpositionInput {
  sheetWidth: number; // e.g. 1000 mm
  sheetHeight: number; // e.g. 700 mm
  pieceWidth: number; // e.g. 210 mm (A4)
  pieceHeight: number; // e.g. 297 mm
  bleed: number; // e.g. 2 mm on each side -> total width = pieceWidth + 2*bleed
  gutter: number; // e.g. 3 mm between pieces
  gripperMargin: number; // e.g. 12 mm for machine gripper
  nonGripperMargin: number; // e.g. 5 mm for sides and tail
  gripperPosition?: 'bottom' | 'top'; // default 'bottom'
  customPosesCount?: number;
  customPosesX?: number;
  customPosesY?: number;
  isCustomPosesActive?: boolean;
}

export function calculateImpositionOptions(input: ImpositionInput): {
  horizontal: CutArrangement;
  vertical: CutArrangement;
  mixed: CutArrangement;
  optimal: CutArrangement;
} {
  const {
    sheetWidth,
    sheetHeight,
    pieceWidth,
    pieceHeight,
    bleed,
    gutter,
    gripperMargin,
    nonGripperMargin,
    gripperPosition = 'bottom',
    customPosesCount,
    customPosesX,
    customPosesY,
    isCustomPosesActive = false,
  } = input;

  // Available printable sheet area after margins
  // Gripper margin is typically on the long side (bottom or top of sheet fed into offset press)
  const usableWidth = Math.max(10, sheetWidth - (nonGripperMargin * 2));
  const usableHeight = Math.max(10, sheetHeight - gripperMargin - nonGripperMargin);

  // Each piece requires pieceDim + gutter. Bleed is absorbed within the gutter if gutter >= 2*bleed,
  // or effective step size = pieceDim + gutter (with gutter >= bleed*2 for clean double cut or single cut)
  const effectiveGutter = Math.max(gutter, bleed * 2);
  const stepW = pieceWidth + effectiveGutter;
  const stepH = pieceHeight + effectiveGutter;

  const sheetAreaMm2 = sheetWidth * sheetHeight;
  const pieceAreaMm2 = pieceWidth * pieceHeight;

  // 1. HORIZONTAL ARRANGEMENT (Normal Orientation)
  // Geometric automatic capacities
  const autoCountH_X = Math.max(0, Math.floor((usableWidth + effectiveGutter) / stepW));
  const autoCountH_Y = Math.max(0, Math.floor((usableHeight + effectiveGutter) / stepH));

  // Determine actual counts based on custom overrides
  let countH_X = autoCountH_X;
  let countH_Y = autoCountH_Y;

  if (isCustomPosesActive) {
    if (customPosesX !== undefined && customPosesX > 0) {
      countH_X = customPosesX;
    } else if (customPosesCount !== undefined && customPosesCount > 0) {
      countH_X = Math.max(1, Math.min(customPosesCount, autoCountH_X > 0 ? autoCountH_X : Math.ceil(Math.sqrt(customPosesCount))));
    }

    if (customPosesY !== undefined && customPosesY > 0) {
      countH_Y = customPosesY;
    } else if (customPosesCount !== undefined && customPosesCount > 0) {
      countH_Y = Math.max(1, Math.ceil(customPosesCount / Math.max(1, countH_X)));
    }
  }

  const totalH = isCustomPosesActive && customPosesCount !== undefined && customPosesCount > 0
    ? customPosesCount
    : countH_X * countH_Y;
  const utilAreaH = totalH * pieceAreaMm2;
  const utilPercentH = (utilAreaH / sheetAreaMm2) * 100;

  // Horizontal: Centered on X (centrado horizontal)
  const totalOccupiedW_H = countH_X > 0 ? (countH_X * pieceWidth + (countH_X - 1) * effectiveGutter) : 0;
  const totalOccupiedH_H = countH_Y > 0 ? (countH_Y * pieceHeight + (countH_Y - 1) * effectiveGutter) : 0;
  const fitsH = totalOccupiedW_H <= usableWidth && totalOccupiedH_H <= usableHeight;

  const x0_H = Math.max(nonGripperMargin, Math.round((sheetWidth - totalOccupiedW_H) / 2));

  // Vertical: A partir del margen de pinza
  const y0_H =
    gripperPosition === 'bottom'
      ? Math.max(nonGripperMargin, sheetHeight - gripperMargin - totalOccupiedH_H)
      : gripperMargin;

  const horizontalArrangement: CutArrangement = {
    orientation: 'horizontal',
    posesTotal: totalH,
    posesHorizontal: countH_X,
    posesVertical: countH_Y,
    sheetWidth,
    sheetHeight,
    pieceWidth,
    pieceHeight,
    utilAreaMm2: utilAreaH,
    sheetAreaMm2,
    wasteAreaMm2: Math.max(0, sheetAreaMm2 - utilAreaH),
    utilPercentage: Math.min(100, Number(utilPercentH.toFixed(2))),
    wastePercentage: Math.max(0, Number((100 - utilPercentH).toFixed(2))),
    isCustom: isCustomPosesActive,
    fitsOnSheet: fitsH,
    occupiedWidthMm: totalOccupiedW_H,
    occupiedHeightMm: totalOccupiedH_H,
    usableWidthMm: usableWidth,
    usableHeightMm: usableHeight,
    cutPattern: {
      section1: {
        countX: countH_X,
        countY: countH_Y,
        w: pieceWidth,
        h: pieceHeight,
        x0: x0_H,
        y0: y0_H,
      }
    }
  };

  // 2. VERTICAL ARRANGEMENT (Rotated 90°)
  // Piece dimensions swapped
  const stepW_rot = pieceHeight + effectiveGutter;
  const stepH_rot = pieceWidth + effectiveGutter;
  const autoCountV_X = Math.max(0, Math.floor((usableWidth + effectiveGutter) / stepW_rot));
  const autoCountV_Y = Math.max(0, Math.floor((usableHeight + effectiveGutter) / stepH_rot));

  let countV_X = autoCountV_X;
  let countV_Y = autoCountV_Y;

  if (isCustomPosesActive) {
    if (customPosesX !== undefined && customPosesX > 0) {
      countV_X = customPosesX;
    } else if (customPosesCount !== undefined && customPosesCount > 0) {
      countV_X = Math.max(1, Math.min(customPosesCount, autoCountV_X > 0 ? autoCountV_X : Math.ceil(Math.sqrt(customPosesCount))));
    }

    if (customPosesY !== undefined && customPosesY > 0) {
      countV_Y = customPosesY;
    } else if (customPosesCount !== undefined && customPosesCount > 0) {
      countV_Y = Math.max(1, Math.ceil(customPosesCount / Math.max(1, countV_X)));
    }
  }

  const totalV = isCustomPosesActive && customPosesCount !== undefined && customPosesCount > 0
    ? customPosesCount
    : countV_X * countV_Y;
  const utilAreaV = totalV * pieceAreaMm2;
  const utilPercentV = (utilAreaV / sheetAreaMm2) * 100;

  // Horizontal: Centered on X
  const totalOccupiedW_V = countV_X > 0 ? (countV_X * pieceHeight + (countV_X - 1) * effectiveGutter) : 0;
  const totalOccupiedH_V = countV_Y > 0 ? (countV_Y * pieceWidth + (countV_Y - 1) * effectiveGutter) : 0;
  const fitsV = totalOccupiedW_V <= usableWidth && totalOccupiedH_V <= usableHeight;

  const x0_V = Math.max(nonGripperMargin, Math.round((sheetWidth - totalOccupiedW_V) / 2));

  // Vertical: A partir del margen de pinza
  const y0_V =
    gripperPosition === 'bottom'
      ? Math.max(nonGripperMargin, sheetHeight - gripperMargin - totalOccupiedH_V)
      : gripperMargin;

  const verticalArrangement: CutArrangement = {
    orientation: 'vertical',
    posesTotal: totalV,
    posesHorizontal: countV_X,
    posesVertical: countV_Y,
    sheetWidth,
    sheetHeight,
    pieceWidth,
    pieceHeight,
    utilAreaMm2: utilAreaV,
    sheetAreaMm2,
    wasteAreaMm2: Math.max(0, sheetAreaMm2 - utilAreaV),
    utilPercentage: Math.min(100, Number(utilPercentV.toFixed(2))),
    wastePercentage: Math.max(0, Number((100 - utilPercentV).toFixed(2))),
    isCustom: isCustomPosesActive,
    fitsOnSheet: fitsV,
    occupiedWidthMm: totalOccupiedW_V,
    occupiedHeightMm: totalOccupiedH_V,
    usableWidthMm: usableWidth,
    usableHeightMm: usableHeight,
    cutPattern: {
      section1: {
        countX: countV_X,
        countY: countV_Y,
        w: pieceHeight, // rotated
        h: pieceWidth,
        x0: x0_V,
        y0: y0_V,
      }
    }
  };

  // 3. MIXED / COMBO ARRANGEMENT (Algoritmo Mixto / Combinado)
  // Check if splitting the sheet into 2 rectangular sections gives more pieces
  // Possibility A: Section 1 normal on top/left, Section 2 rotated on remaining right/bottom strip
  let bestMixedTotal = 0;
  let bestMixedPattern = horizontalArrangement.cutPattern;

  // Try split along X (vertical split line):
  for (let colsNormal = 0; colsNormal <= countH_X; colsNormal++) {
    const widthUsedByNormal = colsNormal > 0 ? (colsNormal * stepW - effectiveGutter) : 0;
    const remainingWidth = usableWidth - widthUsedByNormal - effectiveGutter;
    
    if (remainingWidth >= pieceHeight) {
      const colsRotated = Math.floor((remainingWidth + effectiveGutter) / stepW_rot);
      const rowsRotated = Math.floor((usableHeight + effectiveGutter) / stepH_rot);
      const totalCombined = (colsNormal * countH_Y) + (colsRotated * rowsRotated);

      if (totalCombined > bestMixedTotal) {
        bestMixedTotal = totalCombined;

        const totalUsedW = widthUsedByNormal + (colsRotated > 0 ? effectiveGutter + (colsRotated * stepW_rot - effectiveGutter) : 0);
        const maxUsedH = Math.max(
          colsNormal > 0 ? (countH_Y * stepH - effectiveGutter) : 0,
          colsRotated > 0 ? (rowsRotated * stepH_rot - effectiveGutter) : 0
        );
        const mixedX0 = Math.max(nonGripperMargin, Math.round((sheetWidth - totalUsedW) / 2));
        const mixedY0 =
          gripperPosition === 'bottom'
            ? Math.max(nonGripperMargin, sheetHeight - gripperMargin - maxUsedH)
            : gripperMargin;

        bestMixedPattern = {
          section1: {
            countX: colsNormal,
            countY: countH_Y,
            w: pieceWidth,
            h: pieceHeight,
            x0: mixedX0,
            y0: mixedY0,
          },
          section2: {
            countX: colsRotated,
            countY: rowsRotated,
            w: pieceHeight,
            h: pieceWidth,
            x0: mixedX0 + widthUsedByNormal + (colsNormal > 0 ? effectiveGutter : 0),
            y0: mixedY0,
          }
        };
      }
    }
  }

  // Try split along Y (horizontal split line):
  for (let rowsNormal = 0; rowsNormal <= countH_Y; rowsNormal++) {
    const heightUsedByNormal = rowsNormal > 0 ? (rowsNormal * stepH - effectiveGutter) : 0;
    const remainingHeight = usableHeight - heightUsedByNormal - effectiveGutter;
    
    if (remainingHeight >= pieceWidth) {
      const colsRotated = Math.floor((usableWidth + effectiveGutter) / stepW_rot);
      const rowsRotated = Math.floor((remainingHeight + effectiveGutter) / stepH_rot);
      const totalCombined = (countH_X * rowsNormal) + (colsRotated * rowsRotated);

      if (totalCombined > bestMixedTotal) {
        bestMixedTotal = totalCombined;

        const maxUsedW = Math.max(
          rowsNormal > 0 ? (countH_X * stepW - effectiveGutter) : 0,
          rowsRotated > 0 ? (colsRotated * stepW_rot - effectiveGutter) : 0
        );
        const totalUsedH = heightUsedByNormal + (rowsRotated > 0 ? effectiveGutter + (rowsRotated * stepH_rot - effectiveGutter) : 0);
        const mixedX0 = Math.max(nonGripperMargin, Math.round((sheetWidth - maxUsedW) / 2));
        const mixedY0 =
          gripperPosition === 'bottom'
            ? Math.max(nonGripperMargin, sheetHeight - gripperMargin - totalUsedH)
            : gripperMargin;

        bestMixedPattern = {
          section1: {
            countX: countH_X,
            countY: rowsNormal,
            w: pieceWidth,
            h: pieceHeight,
            x0: mixedX0,
            y0: mixedY0,
          },
          section2: {
            countX: colsRotated,
            countY: rowsRotated,
            w: pieceHeight,
            h: pieceWidth,
            x0: mixedX0,
            y0: mixedY0 + heightUsedByNormal + (rowsNormal > 0 ? effectiveGutter : 0),
          }
        };
      }
    }
  }

  const utilAreaMixed = bestMixedTotal * pieceAreaMm2;
  const utilPercentMixed = (utilAreaMixed / sheetAreaMm2) * 100;

  const mixedArrangement: CutArrangement = {
    orientation: 'mixed',
    posesTotal: isCustomPosesActive ? horizontalArrangement.posesTotal : bestMixedTotal,
    posesHorizontal: countH_X,
    posesVertical: countH_Y,
    sheetWidth,
    sheetHeight,
    pieceWidth,
    pieceHeight,
    utilAreaMm2: isCustomPosesActive ? horizontalArrangement.utilAreaMm2 : utilAreaMixed,
    sheetAreaMm2,
    wasteAreaMm2: isCustomPosesActive ? horizontalArrangement.wasteAreaMm2 : Math.max(0, sheetAreaMm2 - utilAreaMixed),
    utilPercentage: isCustomPosesActive ? horizontalArrangement.utilPercentage : Math.min(100, Number(utilPercentMixed.toFixed(2))),
    wastePercentage: isCustomPosesActive ? horizontalArrangement.wastePercentage : Math.max(0, Number((100 - utilPercentMixed).toFixed(2))),
    isCustom: isCustomPosesActive,
    fitsOnSheet: isCustomPosesActive ? horizontalArrangement.fitsOnSheet : true,
    occupiedWidthMm: isCustomPosesActive ? horizontalArrangement.occupiedWidthMm : usableWidth,
    occupiedHeightMm: isCustomPosesActive ? horizontalArrangement.occupiedHeightMm : usableHeight,
    usableWidthMm: usableWidth,
    usableHeightMm: usableHeight,
    cutPattern: isCustomPosesActive ? horizontalArrangement.cutPattern : bestMixedPattern
  };

  // Determine Optimal
  let optimal = horizontalArrangement;
  if (!isCustomPosesActive) {
    if (verticalArrangement.posesTotal > optimal.posesTotal) {
      optimal = verticalArrangement;
    }
    if (mixedArrangement.posesTotal > optimal.posesTotal) {
      optimal = mixedArrangement;
    }
  } else {
    // In custom mode, pick the orientation that fits best or horizontal
    if (!horizontalArrangement.fitsOnSheet && verticalArrangement.fitsOnSheet) {
      optimal = verticalArrangement;
    }
  }

  return {
    horizontal: horizontalArrangement,
    vertical: verticalArrangement,
    mixed: mixedArrangement,
    optimal
  };
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CutArrangement } from '../types/graphic';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Scissors,
  Check,
  Sparkles,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Printer,
  Crosshair,
  Plus,
  Minus,
  AlertTriangle,
  Grid,
} from 'lucide-react';

interface SheetCanvasVisualizerProps {
  arrangements: {
    horizontal: CutArrangement;
    vertical: CutArrangement;
    mixed: CutArrangement;
    optimal: CutArrangement;
  };
  currentOrientation: 'horizontal' | 'vertical' | 'mixed';
  onSelectOrientation: (orientation: 'horizontal' | 'vertical' | 'mixed') => void;
  gripperMarginMm: number;
  nonGripperMarginMm: number;
  gutterMm: number;
  bleedMm: number;
  gripperPosition?: 'bottom' | 'top';
  onToggleGripperPosition?: (pos: 'bottom' | 'top') => void;
  plateWidthMm?: number;
  plateHeightMm?: number;
  machineName?: string;
  className?: string;
  onChangeNonGripperMargin?: (marginMm: number) => void;
  customPosesCount?: number;
  customPosesX?: number;
  customPosesY?: number;
  isCustomPosesActive?: boolean;
  onChangePoses?: (poses: { total: number; countX?: number; countY?: number; isCustom: boolean }) => void;
  onResetAutoPoses?: () => void;
}

export const SheetCanvasVisualizer: React.FC<SheetCanvasVisualizerProps> = ({
  arrangements,
  currentOrientation,
  onSelectOrientation,
  gripperMarginMm,
  nonGripperMarginMm,
  gutterMm,
  bleedMm,
  gripperPosition = 'bottom',
  onToggleGripperPosition,
  plateWidthMm = 745,
  plateHeightMm = 605,
  machineName = 'Heidelberg SM 74',
  className = '',
  onChangeNonGripperMargin,
  customPosesCount,
  customPosesX,
  customPosesY,
  isCustomPosesActive = false,
  onChangePoses,
  onResetAutoPoses,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View & Interactive State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGripper, setShowGripper] = useState<boolean>(true);
  const [showLateralMargin, setShowLateralMargin] = useState<boolean>(true);
  const [showGutter, setShowGutter] = useState<boolean>(true);
  const [showPoseNumbers, setShowPoseNumbers] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [hoveredPoseIndex, setHoveredPoseIndex] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const activeArrangement = arrangements[currentOrientation] || arrangements.optimal;
  const sheetW = activeArrangement.sheetWidth;
  const sheetH = activeArrangement.sheetHeight;
  const effectiveGutter = Math.max(gutterMm, bleedMm * 2);

  // Calculate poses absolute coordinates on sheet in millimeters
  const poses = useMemo(() => {
    const list: Array<{
      index: number;
      x: number;
      y: number;
      w: number;
      h: number;
      isRotated: boolean;
      section: 1 | 2;
    }> = [];
    let idx = 1;

    if (activeArrangement.cutPattern.section1) {
      const s1 = activeArrangement.cutPattern.section1;
      for (let r = 0; r < s1.countY; r++) {
        for (let c = 0; c < s1.countX; c++) {
          if (list.length < activeArrangement.posesTotal) {
            list.push({
              index: idx++,
              x: s1.x0 + c * (s1.w + effectiveGutter),
              y: s1.y0 + r * (s1.h + effectiveGutter),
              w: s1.w,
              h: s1.h,
              isRotated: s1.w !== activeArrangement.pieceWidth,
              section: 1,
            });
          }
        }
      }
    }

    if (activeArrangement.cutPattern.section2) {
      const s2 = activeArrangement.cutPattern.section2;
      for (let r = 0; r < s2.countY; r++) {
        for (let c = 0; c < s2.countX; c++) {
          if (list.length < activeArrangement.posesTotal) {
            list.push({
              index: idx++,
              x: s2.x0 + c * (s2.w + effectiveGutter),
              y: s2.y0 + r * (s2.h + effectiveGutter),
              w: s2.w,
              h: s2.h,
              isRotated: s2.w !== activeArrangement.pieceWidth,
              section: 2,
            });
          }
        }
      }
    }

    return list;
  }, [activeArrangement, effectiveGutter]);

  const activeCountX = activeArrangement.cutPattern.section1?.countX ?? activeArrangement.posesHorizontal;
  const activeCountY = activeArrangement.cutPattern.section1?.countY ?? activeArrangement.posesVertical;
  const activePosesTotal = activeArrangement.posesTotal;
  const isCustomMode = Boolean(isCustomPosesActive || activeArrangement.isCustom);
  const fitsOnSheet = activeArrangement.fitsOnSheet !== false;

  // Real-time numeric control handlers
  const handleStepLateralMargin = (delta: number) => {
    if (!onChangeNonGripperMargin) return;
    const nextVal = Math.max(0, Math.min(100, nonGripperMarginMm + delta));
    onChangeNonGripperMargin(nextVal);
  };

  const handleStepCountX = (delta: number) => {
    if (!onChangePoses) return;
    const nextX = Math.max(1, activeCountX + delta);
    const nextY = Math.max(1, activeCountY);
    onChangePoses({
      total: nextX * nextY,
      countX: nextX,
      countY: nextY,
      isCustom: true,
    });
  };

  const handleStepCountY = (delta: number) => {
    if (!onChangePoses) return;
    const nextX = Math.max(1, activeCountX);
    const nextY = Math.max(1, activeCountY + delta);
    onChangePoses({
      total: nextX * nextY,
      countX: nextX,
      countY: nextY,
      isCustom: true,
    });
  };

  const handleDirectCountX = (val: number) => {
    if (!onChangePoses) return;
    const nextX = Math.max(1, isNaN(val) ? 1 : val);
    const nextY = Math.max(1, activeCountY);
    onChangePoses({
      total: nextX * nextY,
      countX: nextX,
      countY: nextY,
      isCustom: true,
    });
  };

  const handleDirectCountY = (val: number) => {
    if (!onChangePoses) return;
    const nextX = Math.max(1, activeCountX);
    const nextY = Math.max(1, isNaN(val) ? 1 : val);
    onChangePoses({
      total: nextX * nextY,
      countX: nextX,
      countY: nextY,
      isCustom: true,
    });
  };

  const handleStepTotalPoses = (delta: number) => {
    if (!onChangePoses) return;
    const nextTotal = Math.max(1, activePosesTotal + delta);
    const cols = Math.max(1, activeCountX);
    const rows = Math.ceil(nextTotal / cols);
    onChangePoses({
      total: nextTotal,
      countX: cols,
      countY: rows,
      isCustom: true,
    });
  };

  const handleDirectChangeTotalPoses = (val: number) => {
    if (!onChangePoses) return;
    const nextTotal = Math.max(1, isNaN(val) ? 1 : val);
    const cols = Math.max(1, activeCountX);
    const rows = Math.ceil(nextTotal / cols);
    onChangePoses({
      total: nextTotal,
      countX: cols,
      countY: rows,
      isCustom: true,
    });
  };

  // Main Canvas Rendering Routine
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(300, rect.width || canvas.clientWidth || 640);
    const cssHeight = Math.max(260, rect.height || canvas.clientHeight || 420);

    // Scale canvas buffer for crisp Retina rendering
    if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Clear Canvas Background (Dark modern drafting board)
    ctx.fillStyle = '#090d16'; // Slate 950 deep dark
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Grid pattern on board
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridStep = 24;
    for (let x = 0; x < cssWidth; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssHeight);
      ctx.stroke();
    }
    for (let y = 0; y < cssHeight; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();
    }

    // 2. Viewport & Coordinate Transform
    // Reserve margins around the sheet for rulers, dimension labels and gripper teeth
    const paddingLeft = 55;
    const paddingRight = 45;
    const paddingTop = 50;
    const paddingBottom = 45;

    const availW = cssWidth - (paddingLeft + paddingRight);
    const availH = cssHeight - (paddingTop + paddingBottom);

    const baseScale = Math.min(availW / sheetW, availH / sheetH);
    const scale = baseScale * zoomLevel;

    // Center sheet within available canvas area
    const sheetCanvasW = sheetW * scale;
    const sheetCanvasH = sheetH * scale;
    const originX = paddingLeft + (availW - sheetCanvasW) / 2;
    const originY = paddingTop + (availH - sheetCanvasH) / 2;

    // Helper functions for coord translation (mm to canvas px)
    const toPxX = (mm: number) => originX + mm * scale;
    const toPxY = (mm: number) => originY + mm * scale;
    const toPxW = (mm: number) => mm * scale;
    const toPxH = (mm: number) => mm * scale;

    // 3. Draw Machine Plate Outline (if larger than sheet)
    if (plateWidthMm && plateHeightMm && (plateWidthMm > sheetW || plateHeightMm > sheetH)) {
      const platePxW = plateWidthMm * scale;
      const platePxH = plateHeightMm * scale;
      const platePxX = originX - ((plateWidthMm - sheetW) / 2) * scale;
      const platePxY = originY - ((plateHeightMm - sheetH) / 2) * scale;

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Sky blue dashed
      ctx.lineWidth = 1.2;
      ctx.strokeRect(platePxX, platePxY, platePxW, platePxH);

      // Plate Label
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.fillText(
        `Plancha CTP (${plateWidthMm} × ${plateHeightMm} mm) - ${machineName}`,
        platePxX + 6,
        platePxY - 6
      );
      ctx.restore();
    }

    // 4. Draw Sheet (Pliego de Papel / Sustrato)
    ctx.save();
    // Drop shadow under sheet
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // White substrate body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX, originY, sheetCanvasW, sheetCanvasH);
    ctx.restore();

    // Sheet outer border
    ctx.strokeStyle = '#94a3b8'; // Slate 400
    ctx.lineWidth = 1.5;
    ctx.strokeRect(originX, originY, sheetCanvasW, sheetCanvasH);

    // Subtle paper grain / watermark
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.02)';
    ctx.fillRect(originX, originY, sheetCanvasW, sheetCanvasH);
    ctx.restore();

    // 5. Draw Lateral Margins & Tail / Contrapinza (CELESTE - Margen Lateral)
    if (showLateralMargin && nonGripperMarginMm > 0) {
      ctx.save();
      const ngmW = toPxW(nonGripperMarginMm);
      const ngmH = toPxH(nonGripperMarginMm);

      // Cyan / Sky translucent fill for lateral margins
      ctx.fillStyle = 'rgba(6, 182, 212, 0.20)'; // Cyan 500 translucent
      // Left lateral margin band
      ctx.fillRect(originX, originY, ngmW, sheetCanvasH);
      // Right lateral margin band
      ctx.fillRect(originX + sheetCanvasW - ngmW, originY, ngmW, sheetCanvasH);

      // Dashed boundary lines for lateral margins
      ctx.strokeStyle = '#0891b2'; // Cyan 600
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Left margin boundary line
      ctx.beginPath();
      ctx.moveTo(originX + ngmW, originY);
      ctx.lineTo(originX + ngmW, originY + sheetCanvasH);
      ctx.stroke();

      // Right margin boundary line
      ctx.beginPath();
      ctx.moveTo(originX + sheetCanvasW - ngmW, originY);
      ctx.lineTo(originX + sheetCanvasW - ngmW, originY + sheetCanvasH);
      ctx.stroke();

      // Contrapinza (Salida - opposite of gripper)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
      if (gripperPosition === 'bottom') {
        ctx.fillRect(originX, originY, sheetCanvasW, ngmH);
        ctx.beginPath();
        ctx.moveTo(originX, originY + ngmH);
        ctx.lineTo(originX + sheetCanvasW, originY + ngmH);
        ctx.stroke();
      } else {
        ctx.fillRect(originX, originY + sheetCanvasH - ngmH, sheetCanvasW, ngmH);
        ctx.beginPath();
        ctx.moveTo(originX, originY + sheetCanvasH - ngmH);
        ctx.lineTo(originX + sheetCanvasW, originY + sheetCanvasH - ngmH);
        ctx.stroke();
      }

      // Lateral margin text badges if width is sufficient
      if (ngmW >= 12 && showDimensions) {
        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#0e7490';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${nonGripperMarginMm}mm`, originX + ngmW / 2, originY + sheetCanvasH / 2);
        ctx.fillText(`${nonGripperMarginMm}mm`, originX + sheetCanvasW - ngmW / 2, originY + sheetCanvasH / 2);
        ctx.restore();
      }

      ctx.restore();
    }

    // 6. Draw Margen de Pinza (NARANJA - Gripper Margin)
    if (showGripper && gripperMarginMm > 0) {
      const gripH = toPxH(gripperMarginMm);
      const gripY = gripperPosition === 'bottom'
        ? originY + sheetCanvasH - gripH
        : originY;

      ctx.save();
      // Orange fill zone
      ctx.fillStyle = 'rgba(249, 115, 22, 0.28)'; // Warm orange translucent
      ctx.fillRect(originX, gripY, sheetCanvasW, gripH);

      // Distinctive Orange Hatching Stripes (Zanja de seguridad / mordazas)
      ctx.beginPath();
      ctx.rect(originX, gripY, sheetCanvasW, gripH);
      ctx.clip();

      ctx.strokeStyle = 'rgba(234, 88, 12, 0.55)'; // Deep orange hatch line
      ctx.lineWidth = 1.5;
      const hatchStep = Math.max(12, 16 * zoomLevel);
      for (let hx = -gripH; hx < sheetCanvasW + gripH; hx += hatchStep) {
        ctx.beginPath();
        ctx.moveTo(originX + hx, gripY);
        ctx.lineTo(originX + hx + gripH, gripY + gripH);
        ctx.stroke();
      }

      // Outer boundary border for gripper in bright orange
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = '#ea580c'; // Orange 600
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (gripperPosition === 'bottom') {
        ctx.moveTo(originX, gripY);
        ctx.lineTo(originX + sheetCanvasW, gripY);
      } else {
        ctx.moveTo(originX, gripY + gripH);
        ctx.lineTo(originX + sheetCanvasW, gripY + gripH);
      }
      ctx.stroke();

      // Pinza Machine Feeder Teeth (Marcas triangulares de entrada de pinzas)
      const teethCount = Math.max(4, Math.floor(sheetW / 120));
      ctx.fillStyle = '#ea580c';
      for (let t = 0; t <= teethCount; t++) {
        const tx = originX + (sheetCanvasW / teethCount) * t;
        const ty = gripperPosition === 'bottom' ? originY + sheetCanvasH : originY;
        const dir = gripperPosition === 'bottom' ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(tx - 6, ty);
        ctx.lineTo(tx + 6, ty);
        ctx.lineTo(tx, ty + dir * 8);
        ctx.closePath();
        ctx.fill();
      }

      // Pinza Badge & Label (Orange Pill)
      const pillW = 200;
      const pillH = 22;
      const pillX = originX + (sheetCanvasW - pillW) / 2;
      const pillY = gripperPosition === 'bottom'
        ? gripY + Math.max(2, (gripH - pillH) / 2)
        : gripY + Math.max(2, (gripH - pillH) / 2);

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `🟧 MARGEN DE PINZA: ${gripperMarginMm} mm (${gripperPosition === 'bottom' ? 'Al Pie' : 'A Cabeza'})`,
        pillX + pillW / 2,
        pillY + pillH / 2
      );
      ctx.restore();
    }

    // 7. Draw Separación de Corte / Calles de Corte (VERDE - Gutters & Trim)
    if (showGutter && effectiveGutter > 0) {
      ctx.save();
      // Draw green separation lanes between horizontal and vertical poses
      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)'; // Green transparent
      ctx.strokeStyle = '#16a34a'; // Green 600
      ctx.lineWidth = 1;

      // Group poses by section to draw vertical/horizontal alleys
      const sections = [activeArrangement.cutPattern.section1, activeArrangement.cutPattern.section2].filter(Boolean);

      sections.forEach((sec) => {
        if (!sec) return;
        const { countX, countY, w, h, x0, y0 } = sec;

        // Vertical cutting lanes (between columns)
        for (let c = 0; c < countX - 1; c++) {
          const laneX_mm = x0 + (c + 1) * w + c * effectiveGutter;
          const lanePxX = toPxX(laneX_mm);
          const lanePxW = toPxW(effectiveGutter);
          const lanePxY = toPxY(y0);
          const lanePxH = toPxH(countY * h + (countY - 1) * effectiveGutter);

          // Green gutter band
          ctx.fillRect(lanePxX, lanePxY, lanePxW, lanePxH);

          // Center cutting line (dashed green)
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(lanePxX + lanePxW / 2, lanePxY - 8);
          ctx.lineTo(lanePxX + lanePxW / 2, lanePxY + lanePxH + 8);
          ctx.stroke();
          ctx.restore();
        }

        // Horizontal cutting lanes (between rows)
        for (let r = 0; r < countY - 1; r++) {
          const laneY_mm = y0 + (r + 1) * h + r * effectiveGutter;
          const lanePxY = toPxY(laneY_mm);
          const lanePxH = toPxH(effectiveGutter);
          const lanePxX = toPxX(x0);
          const lanePxW = toPxW(countX * w + (countX - 1) * effectiveGutter);

          // Green gutter band
          ctx.fillRect(lanePxX, lanePxY, lanePxW, lanePxH);

          // Center cutting line (dashed green)
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(lanePxX - 8, lanePxY + lanePxH / 2);
          ctx.lineTo(lanePxX + lanePxW + 8, lanePxY + lanePxH / 2);
          ctx.stroke();
          ctx.restore();
        }
      });

      ctx.restore();
    }

    // 8. Draw Individual Poses (Pieces)
    poses.forEach((pose) => {
      const px = toPxX(pose.x);
      const py = toPxY(pose.y);
      const pw = toPxW(pose.w);
      const ph = toPxH(pose.h);
      const isHovered = hoveredPoseIndex === pose.index;

      ctx.save();

      // Piece Background (Subtle print cyan/blue tint)
      const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
      if (isHovered) {
        grad.addColorStop(0, '#e0f2fe'); // Sky 100
        grad.addColorStop(1, '#bae6fd'); // Sky 200
      } else {
        grad.addColorStop(0, '#f0f9ff'); // Sky 50
        grad.addColorStop(1, '#e0f2fe'); // Sky 100
      }
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // Piece Stroke Border
      ctx.strokeStyle = isHovered ? '#0284c7' : '#0369a1'; // Sky 600/700
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.strokeRect(px, py, pw, ph);

      // Bleed safety margin line inside piece if bleedMm > 0
      if (bleedMm > 0 && pw > 16 && ph > 16) {
        const bPx = toPxW(bleedMm);
        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
        ctx.strokeRect(px + bPx, py + bPx, Math.max(2, pw - bPx * 2), Math.max(2, ph - bPx * 2));
        ctx.restore();
      }

      // Crop Marks at corners of piece (Marcas de corte de guillotina)
      if (showCropMarks && pw > 20 && ph > 20) {
        ctx.save();
        ctx.strokeStyle = '#15803d'; // Green crop marks
        ctx.lineWidth = 1;
        const markLen = 5;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(px - markLen, py); ctx.lineTo(px, py);
        ctx.moveTo(px, py - markLen); ctx.lineTo(px, py);
        // Top-right
        ctx.moveTo(px + pw, py); ctx.lineTo(px + pw + markLen, py);
        ctx.moveTo(px + pw, py - markLen); ctx.lineTo(px + pw, py);
        // Bottom-left
        ctx.moveTo(px - markLen, py + ph); ctx.lineTo(px, py + ph);
        ctx.moveTo(px, py + ph); ctx.lineTo(px, py + ph + markLen);
        // Bottom-right
        ctx.moveTo(px + pw, py + ph); ctx.lineTo(px + pw + markLen, py + ph);
        ctx.moveTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph + markLen);
        ctx.stroke();
        ctx.restore();
      }

      // Pose Index Badge and Label
      if (showPoseNumbers && pw >= 24 && ph >= 24) {
        const badgeR = Math.min(10, Math.min(pw, ph) / 4);
        const badgeX = px + badgeR + 4;
        const badgeY = py + badgeR + 4;

        ctx.fillStyle = isHovered ? '#0284c7' : '#0369a1';
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `bold ${Math.max(8, badgeR * 1.1)}px monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pose.index), badgeX, badgeY);

        // Piece Dimensions in center if piece is large enough
        if (pw > 60 && ph > 40 && showDimensions) {
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${pose.w} × ${pose.h} mm`, px + pw / 2, py + ph / 2);

          if (pose.isRotated) {
            ctx.font = '8px monospace';
            ctx.fillStyle = '#64748b';
            ctx.fillText('↻ Rotada 90°', px + pw / 2, py + ph / 2 + 11);
          }
        }
      }

      ctx.restore();
    });

    // 9. Dimension Lines & Rulers around the Sheet
    if (showDimensions) {
      ctx.save();
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#94a3b8'; // Slate 400
      ctx.strokeStyle = '#64748b'; // Slate 500
      ctx.lineWidth = 1;

      // Top Dimension: Sheet Width
      const topDimY = originY - 14;
      ctx.beginPath();
      ctx.moveTo(originX, topDimY);
      ctx.lineTo(originX + sheetCanvasW, topDimY);
      ctx.moveTo(originX, topDimY - 4);
      ctx.lineTo(originX, topDimY + 4);
      ctx.moveTo(originX + sheetCanvasW, topDimY - 4);
      ctx.lineTo(originX + sheetCanvasW, topDimY + 4);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`↔ Ancho Pliego: ${sheetW} mm`, originX + sheetCanvasW / 2, topDimY - 2);

      // Left Dimension: Sheet Height
      const leftDimX = originX - 16;
      ctx.beginPath();
      ctx.moveTo(leftDimX, originY);
      ctx.lineTo(leftDimX, originY + sheetCanvasH);
      ctx.moveTo(leftDimX - 4, originY);
      ctx.lineTo(leftDimX + 4, originY);
      ctx.moveTo(leftDimX - 4, originY + sheetCanvasH);
      ctx.lineTo(leftDimX + 4, originY + sheetCanvasH);
      ctx.stroke();

      ctx.save();
      ctx.translate(leftDimX - 4, originY + sheetCanvasH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`↕ Alto Pliego: ${sheetH} mm`, 0, 0);
      ctx.restore();

      ctx.restore();
    }

    // 10. Registration Marks (Cruces de Registro en las esquinas del pliego)
    ctx.save();
    ctx.strokeStyle = '#38bdf8'; // Sky cyan
    ctx.lineWidth = 1.2;
    const drawRegCross = (cx: number, cy: number) => {
      const r = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r - 3, cy); ctx.lineTo(cx + r + 3, cy);
      ctx.moveTo(cx, cy - r - 3); ctx.lineTo(cx, cy + r + 3);
      ctx.stroke();
    };
    drawRegCross(originX - 10, originY - 10);
    drawRegCross(originX + sheetCanvasW + 10, originY - 10);
    drawRegCross(originX - 10, originY + sheetCanvasH + 10);
    drawRegCross(originX + sheetCanvasW + 10, originY + sheetCanvasH + 10);
    ctx.restore();

    // 11. Fitting Alert Banner if imposition exceeds available printable area
    if (!fitsOnSheet) {
      ctx.save();
      const warnW = Math.min(sheetCanvasW - 24, 380);
      const warnH = 24;
      const warnX = originX + (sheetCanvasW - warnW) / 2;
      const warnY = originY + 12;

      ctx.fillStyle = 'rgba(225, 29, 72, 0.95)'; // Rose 600
      ctx.beginPath();
      ctx.roundRect(warnX, warnY, warnW, warnH, 6);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `⚠️ ESQUEMA SUPERA EL PLIEGO ÚTIL (${activeArrangement.occupiedWidthMm}×${activeArrangement.occupiedHeightMm} mm)`,
        warnX + warnW / 2,
        warnY + warnH / 2
      );
      ctx.restore();
    }

    ctx.restore();
  }, [
    activeArrangement,
    sheetW,
    sheetH,
    poses,
    effectiveGutter,
    gripperMarginMm,
    nonGripperMarginMm,
    gripperPosition,
    plateWidthMm,
    plateHeightMm,
    machineName,
    zoomLevel,
    showGripper,
    showLateralMargin,
    showGutter,
    showPoseNumbers,
    showDimensions,
    showCropMarks,
    hoveredPoseIndex,
    bleedMm,
    fitsOnSheet,
  ]);

  // Redraw on state or resize
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      drawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Mouse move over canvas to detect hovered pose
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cssWidth = rect.width;
    const cssHeight = rect.height;
    const paddingLeft = 55;
    const paddingRight = 45;
    const paddingTop = 50;
    const paddingBottom = 45;

    const availW = cssWidth - (paddingLeft + paddingRight);
    const availH = cssHeight - (paddingTop + paddingBottom);
    const baseScale = Math.min(availW / sheetW, availH / sheetH);
    const scale = baseScale * zoomLevel;

    const sheetCanvasW = sheetW * scale;
    const sheetCanvasH = sheetH * scale;
    const originX = paddingLeft + (availW - sheetCanvasW) / 2;
    const originY = paddingTop + (availH - sheetCanvasH) / 2;

    // Check hit test against poses
    let foundPoseIndex: number | null = null;
    for (const pose of poses) {
      const px = originX + pose.x * scale;
      const py = originY + pose.y * scale;
      const pw = pose.w * scale;
      const ph = pose.h * scale;

      if (mouseX >= px && mouseX <= px + pw && mouseY >= py && mouseY <= py + ph) {
        foundPoseIndex = pose.index;
        break;
      }
    }

    setHoveredPoseIndex(foundPoseIndex);
    if (foundPoseIndex !== null) {
      setHoverCoords({ x: e.clientX, y: e.clientY });
    } else {
      setHoverCoords(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoseIndex(null);
    setHoverCoords(null);
  };

  // Download Canvas as PNG file for Technical Dossier
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pliego_${sheetW}x${sheetH}_${activeArrangement.posesTotal}poses.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al exportar pliego canvas:', err);
    }
  };

  // Find hovered pose info
  const hoveredPoseData = useMemo(() => {
    if (!hoveredPoseIndex) return null;
    return poses.find((p) => p.index === hoveredPoseIndex) || null;
  }, [hoveredPoseIndex, poses]);

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 shadow-2xl transition-all ${className} ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-slate-950 border-sky-500/50' : ''
      }`}
    >
      {/* 1. Header with Title & Orientation Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Visualización de Pliego
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Canvas 2D • Pinza & Calles
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Imposición geométrica interactiva sobre pliego de {sheetW} × {sheetH} mm
            </p>
          </div>
        </div>

        {/* Orientation Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['horizontal', 'vertical', 'mixed'] as const).map((ori) => {
            const arr = arrangements[ori];
            const isOptimal = arrangements.optimal.orientation === ori;
            const isSelected = currentOrientation === ori;

            return (
              <button
                key={ori}
                type="button"
                onClick={() => onSelectOrientation(ori)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>
                  {ori === 'horizontal' && 'Horizontal'}
                  {ori === 'vertical' && 'Vertical'}
                  {ori === 'mixed' && 'Mixto'}
                </span>
                <span
                  className={`text-[10px] px-1 rounded ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {arr.posesTotal} poses
                </span>
                {isOptimal && (
                  <Sparkles
                    className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Numeric Controls: Number of Poses & Lateral Margin (Tiempo Real) */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3.5 sm:p-4 flex flex-col gap-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Controles de Esquema de Imposición
            </h4>
            {isCustomMode ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 font-mono">
                Manual / Personalizado
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 font-mono">
                Automático Óptimo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onResetAutoPoses && isCustomMode && (
              <button
                type="button"
                onClick={onResetAutoPoses}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Restablecer el esquema de imposición a cálculo geométrico automático óptimo"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer a Óptimo Auto</span>
              </button>
            )}

            {fitsOnSheet ? (
              <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                <span>Ajuste Válido ({activeArrangement.occupiedWidthMm}×{activeArrangement.occupiedHeightMm} mm)</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Excede Pliego Útil ({activeArrangement.occupiedWidthMm}×{activeArrangement.occupiedHeightMm} mm)</span>
              </span>
            )}
          </div>
        </div>

        {/* Inputs Grid: Poses & Lateral Margin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* CONTROL 1: NÚMERO DE POSES */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Número de Poses (Piezas por Pliego)</span>
              </label>
              <span className="text-[11px] font-mono font-black text-sky-400 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-800">
                {activePosesTotal} poses/pliego
              </span>
            </div>

            {/* Total Poses Input & Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 w-24 shrink-0 font-medium">
                Poses Totales:
              </span>
              <div className="flex items-center flex-1 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => handleStepTotalPoses(-1)}
                  disabled={activePosesTotal <= 1}
                  className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 text-slate-200 transition-colors"
                  title="Reducir 1 pose"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={activePosesTotal}
                  onChange={(e) => handleDirectChangeTotalPoses(Number(e.target.value))}
                  className="flex-1 min-w-0 bg-transparent text-center font-mono font-bold text-sm text-sky-300 focus:outline-none py-1"
                />
                <button
                  type="button"
                  onClick={() => handleStepTotalPoses(1)}
                  className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 transition-colors"
                  title="Añadir 1 pose"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-grid Columns X & Rows Y */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              {/* Columnas X */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Columnas (X):</span>
                  <strong className="text-slate-300">{activeCountX}</strong>
                </span>
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleStepCountX(-1)}
                    disabled={activeCountX <= 1}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    title="Reducir columnas en X"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={activeCountX}
                    onChange={(e) => handleDirectCountX(Number(e.target.value))}
                    className="flex-1 min-w-0 bg-transparent text-center font-mono font-bold text-xs text-slate-100 focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepCountX(1)}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Aumentar columnas en X"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Filas Y */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Filas (Y):</span>
                  <strong className="text-slate-300">{activeCountY}</strong>
                </span>
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleStepCountY(-1)}
                    disabled={activeCountY <= 1}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    title="Reducir filas en Y"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={activeCountY}
                    onChange={(e) => handleDirectCountY(Number(e.target.value))}
                    className="flex-1 min-w-0 bg-transparent text-center font-mono font-bold text-xs text-slate-100 focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepCountY(1)}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Aumentar filas en Y"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL 2: DISTANCIA DE MARGEN LATERAL */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Distancia de Margen Lateral</span>
              </label>
              <span className="text-[11px] font-mono font-black text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800">
                {nonGripperMarginMm} mm
              </span>
            </div>

            {/* Lateral Margin Input & Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 w-24 shrink-0 font-medium">
                Margen Lat.:
              </span>
              <div className="flex items-center flex-1 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => handleStepLateralMargin(-1)}
                  disabled={nonGripperMarginMm <= 0}
                  className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 text-slate-200 transition-colors"
                  title="Reducir margen lateral en 1 mm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={nonGripperMarginMm}
                  onChange={(e) => onChangeNonGripperMargin && onChangeNonGripperMargin(Math.max(0, Number(e.target.value)))}
                  className="flex-1 min-w-0 bg-transparent text-center font-mono font-bold text-sm text-cyan-300 focus:outline-none py-1"
                />
                <button
                  type="button"
                  onClick={() => handleStepLateralMargin(1)}
                  className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 transition-colors"
                  title="Aumentar margen lateral en 1 mm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Presets for Lateral Margin */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Presets Taller:</span>
              {[3, 5, 6, 8, 10, 15].map((presetMm) => (
                <button
                  key={presetMm}
                  type="button"
                  onClick={() => onChangeNonGripperMargin && onChangeNonGripperMargin(presetMm)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    nonGripperMarginMm === presetMm
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  {presetMm} mm
                </button>
              ))}
            </div>

            {/* Dynamic available printing width readout */}
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Ancho útil disponible:</span>
              <strong className="text-slate-200">
                {sheetW - nonGripperMarginMm * 2} mm ({sheetW} - 2×{nonGripperMarginMm})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Control Bar (Toggles & Zoom) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        {/* Visual Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Gripper (Orange) Toggle */}
          <button
            type="button"
            onClick={() => setShowGripper(!showGripper)}
            className={`px-2 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-all ${
              showGripper
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Activar/desactivar visualización de pinza naranja"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Pinza ({gripperMarginMm} mm)</span>
          </button>

          {/* Lateral Margin (Cyan) Toggle */}
          <button
            type="button"
            onClick={() => setShowLateralMargin(!showLateralMargin)}
            className={`px-2 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-all ${
              showLateralMargin
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Activar/desactivar visualización de margen lateral celeste"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>M. Lateral ({nonGripperMarginMm} mm)</span>
          </button>

          {/* Gutter / Cut Separation (Green) Toggle */}
          <button
            type="button"
            onClick={() => setShowGutter(!showGutter)}
            className={`px-2 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-all ${
              showGutter
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Activar/desactivar visualización de separación de corte verde"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Calles de Corte ({effectiveGutter} mm)</span>
          </button>

          {/* Gripper position toggle */}
          {onToggleGripperPosition && (
            <button
              type="button"
              onClick={() => onToggleGripperPosition(gripperPosition === 'bottom' ? 'top' : 'bottom')}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1 transition-all"
              title="Cambiar posición de la pinza (Pie vs Cabeza)"
            >
              <Printer className="w-3 h-3 text-amber-400" />
              <span>Pinza: {gripperPosition === 'bottom' ? 'Pie' : 'Cabeza'}</span>
            </button>
          )}

          {/* Pose Numbers Toggle */}
          <button
            type="button"
            onClick={() => setShowPoseNumbers(!showPoseNumbers)}
            className={`p-1.5 rounded-lg border transition-all ${
              showPoseNumbers
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Mostrar u ocultar números de poses"
          >
            <span className="font-mono text-[10px] font-bold px-1">#N</span>
          </button>

          {/* Dimensions / Cotas Toggle */}
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 rounded-lg border transition-all ${
              showDimensions
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Mostrar cotas y medidas de pliego"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom & Export Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1.5">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ml-0.5"
              title="Restablecer zoom al 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
            title="Exportar plano de imposición como imagen PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PNG</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver pliego en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. The HTML5 Canvas Drawing Area */}
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center min-h-[340px] sm:min-h-[400px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-[360px] sm:h-[440px] block cursor-crosshair"
        />

        {/* Hovered Pose Floating Tooltip */}
        {hoveredPoseData && (
          <div className="pointer-events-none absolute bottom-3 left-3 bg-slate-900/95 border border-sky-500/50 text-slate-200 px-3 py-2 rounded-xl text-xs font-mono shadow-xl backdrop-blur space-y-0.5 z-10 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Pose #{hoveredPoseData.index}</span>
              {hoveredPoseData.isRotated && <span className="text-[10px] text-amber-400 font-normal">(Rotada 90°)</span>}
            </div>
            <div className="text-[11px] text-slate-300">
              Dimensiones: <strong className="text-white">{hoveredPoseData.w} × {hoveredPoseData.h} mm</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Posición: X = {hoveredPoseData.x} mm • Y = {hoveredPoseData.y} mm
            </div>
          </div>
        )}
      </div>

      {/* 4. Complete Technical Legend & KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-800/80 text-xs">
        {/* Item 1: Margen de Pinza (Naranja) */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-orange-500/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span>Pinza (Naranja)</span>
          </div>
          <div className="mt-1 font-mono">
            <span className="text-base font-black text-orange-400">{gripperMarginMm} mm</span>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
              {gripperPosition === 'bottom' ? 'Al Pie del pliego' : 'A la Cabeza del pliego'}
            </span>
          </div>
        </div>

        {/* Item 2: Margen Lateral (Celeste) */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span>Margen Lateral</span>
          </div>
          <div className="mt-1 font-mono">
            <span className="text-base font-black text-cyan-400">{nonGripperMarginMm} mm</span>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
              Ancho útil: {sheetW - nonGripperMarginMm * 2} mm
            </span>
          </div>
        </div>

        {/* Item 3: Separación de Corte (Verde) */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Separación Corte</span>
          </div>
          <div className="mt-1 font-mono">
            <span className="text-base font-black text-emerald-400">{effectiveGutter} mm</span>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
              Calle + {bleedMm} mm sangrado
            </span>
          </div>
        </div>

        {/* Item 4: Poses y Rendimiento */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-sky-500/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span>Poses Útiles</span>
          </div>
          <div className="mt-1 font-mono">
            <span className="text-base font-black text-sky-400">{activeArrangement.posesTotal} u/pliego</span>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
              {activeCountX} × {activeCountY} {isCustomMode ? '(manual)' : '(óptimo)'}
            </span>
          </div>
        </div>

        {/* Item 5: Aprovechamiento y Merma */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/30 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Aprovechamiento</span>
          </div>
          <div className="mt-1 font-mono">
            <span className="text-base font-black text-amber-400">{activeArrangement.utilPercentage}%</span>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
              Merma: {activeArrangement.wastePercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

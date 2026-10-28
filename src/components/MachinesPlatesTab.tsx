import React, { useState, useMemo } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  FlexoMachineCalibration,
  InkColorItem,
  OffsetJobParams,
  PrintingMachinePreset,
} from '../types/graphic';
import {
  MACHINE_PRESETS,
  FLEXO_MACHINE_PRESETS,
  getFlexoMachineCalibrations,
  saveFlexoMachineCalibration,
  resetFlexoMachineCalibration,
  deleteCustomFlexoMachine,
} from '../utils/machinePresets';
import { PANTONE_CATALOG, PantoneColor } from '../utils/pantoneCatalog';
import { PantonePickerModal } from './PantonePickerModal';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Printer,
  Layers,
  Sparkles,
  Gauge,
  Clock,
  DollarSign,
  CheckCircle2,
  Sliders,
  Settings,
  PlusCircle,
  Maximize2,
  ShieldCheck,
  TrendingDown,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Check,
  Scale,
  Palette,
  Star,
  Search,
  Trash2,
  Plus,
  Droplets,
  RotateCcw,
  Zap,
  Tag,
  Wrench,
  Activity,
} from 'lucide-react';

interface MachinesPlatesTabProps {
  offsetParams: OffsetJobParams;
  onChangeOffset: (params: OffsetJobParams) => void;
  flexoParams?: FlexoJobParams;
  onChangeFlexo?: (params: FlexoJobParams) => void;
  currency: CurrencyConfig;
}

interface SeriesWasteConfig {
  runWastePercent: number;
  setupWasteSheets: number;
  label: string;
  sublabel: string;
  description: string;
}

export const MachinesPlatesTab: React.FC<MachinesPlatesTabProps> = ({
  offsetParams,
  onChangeOffset,
  flexoParams,
  onChangeFlexo,
  currency,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
  // Auto-adjust paper sheet is FALSE by default to avoid conflict with user's paper sheet format
  const [autoAdjustSheet, setAutoAdjustSheet] = useState<boolean>(false);
  const [appliedWasteMessage, setAppliedWasteMessage] = useState<string | null>(null);

  // Gestión de Mermas Estándar por Serie de Máquina (GTO, MO, SM, CD, XL, FLEXO, etc.)
  const [seriesWasteRates, setSeriesWasteRates] = useState<Record<string, SeriesWasteConfig>>({
    SM: {
      runWastePercent: 5.0,
      setupWasteSheets: 70,
      label: 'Heidelberg Speedmaster SM',
      sublabel: 'SM 52, SM 74 (4 y 8 Colores), SM 102',
      description: 'Sistemas automáticos CPC / Prinect. Configuración de 8 colores permite cuatricromía + 4 Pantone directos en línea.',
    },
    XL: {
      runWastePercent: 3.5,
      setupWasteSheets: 90,
      label: 'Heidelberg Peak Performance XL',
      sublabel: 'XL 75, XL 106 (6 y 8 Colores + Coater)',
      description: 'Máxima gama industrial a 18.000 pl/h. 8 torres de entintado con espectrofotometría AxisControl para Pantone corporativo.',
    },
    FLEXO: {
      runWastePercent: 4.5,
      setupWasteSheets: 50,
      label: 'Flexografía Banda Angosta 350mm',
      sublabel: 'Nilpeter FA-350 / ETIRAMA FIT & EVO 350 (8 Colores UV)',
      description: 'Prensas flexográficas de 8 estaciones UV para etiquetas y packaging en bobina de 350 mm. Secado instantáneo y pre-registro.',
    },
    GTO: {
      runWastePercent: 7.5,
      setupWasteSheets: 40,
      label: 'Heidelberg GTO Series',
      sublabel: 'Prensas de formato pequeño (GTO 46, GTO 52)',
      description: 'Prensa mecánica clásica. Requiere mayor margen de merma en tirada corta por registro y entintado manual.',
    },
    GTOZ: {
      runWastePercent: 7.0,
      setupWasteSheets: 50,
      label: 'Heidelberg GTOZ Bicolor',
      sublabel: 'Bicolor compacto 52 cm',
      description: 'Registro de dos colores en línea. Maculatura moderada para registro cabeza-pie y calce de color.',
    },
    MO: {
      runWastePercent: 6.0,
      setupWasteSheets: 60,
      label: 'Heidelberg MO Series',
      sublabel: 'Formato mediano 65 cm (MO, MOZ, MOV)',
      description: 'Cilindros de doble diámetro y mayor estabilidad de entintado. Merma balanceada para medianas tiradas.',
    },
    CD: {
      runWastePercent: 4.2,
      setupWasteSheets: 80,
      label: 'Heidelberg Speedmaster CD',
      sublabel: 'CD 74, CD 102 para packaging y cartonería',
      description: 'Transporte de pliego con cámaras de aire para cartulina rígida y empaques de alto gramaje.',
    },
    OTRA: {
      runWastePercent: 6.0,
      setupWasteSheets: 50,
      label: 'Prensa Personalizada / Otra Marca',
      sublabel: 'Parámetros a medida del taller',
      description: 'Configuración personalizada para prensas multimarca o formatos especiales.',
    },
  });

  // Custom machine state
  const [customName, setCustomName] = useState('Heidelberg Personalizada');
  const [customPlateWidth, setCustomPlateWidth] = useState(offsetParams.plateWidthMm || 745);
  const [customPlateHeight, setCustomPlateHeight] = useState(offsetParams.plateHeightMm || 605);
  const [customMaxSheetWidth, setCustomMaxSheetWidth] = useState(offsetParams.machineMaxSheetWidthMm || 740);
  const [customMaxSheetHeight, setCustomMaxSheetHeight] = useState(offsetParams.machineMaxSheetHeightMm || 530);
  const [customGripper, setCustomGripper] = useState(offsetParams.gripperMarginMm || 10);
  const [customSpeed, setCustomSpeed] = useState(offsetParams.machineSpeedSheetsPerHour || 10000);
  const [customHourlyRate, setCustomHourlyRate] = useState(offsetParams.machineHourlyRate || 65);
  const [customSetupMinutes, setCustomSetupMinutes] = useState(offsetParams.machineSetupMinutes || 30);
  const [customWastePercent, setCustomWastePercent] = useState(offsetParams.runWastePercent || 5.0);
  const [isCustomSaved, setIsCustomSaved] = useState(false);

  // Top-level Technology Tab Switcher (Offset vs Flexo)
  const [activeTechTab, setActiveTechTab] = useState<'offset' | 'flexo'>('flexo');

  // Máquinas Flexo & Calibración por Desgaste
  const [flexoCalibrations, setFlexoCalibrations] = useState<FlexoMachineCalibration[]>(() =>
    getFlexoMachineCalibrations()
  );
  const [flexoCustomName, setFlexoCustomName] = useState('Mark Andy 2200 / Flexo Taller');
  const [flexoMaxRollWidth, setFlexoMaxRollWidth] = useState(flexoParams?.rollWidthMm || 350);
  const [flexoMinRollWidth, setFlexoMinRollWidth] = useState(120);
  const [flexoWastePercent, setFlexoWastePercent] = useState(flexoParams?.runWastePercent || 4.2);
  const [flexoSetupWasteMeters, setFlexoSetupWasteMeters] = useState(flexoParams?.setupWasteMeters || 100);
  const [flexoSpeedMpm, setFlexoSpeedMpm] = useState(flexoParams?.machineSpeedMetersPerMinute || 120);
  const [flexoNominalSpeedMpm, setFlexoNominalSpeedMpm] = useState(150);
  const [flexoHourlyRate, setFlexoHourlyRate] = useState(flexoParams?.machineHourlyRate || 95);
  const [flexoSetupMinutes, setFlexoSetupMinutes] = useState(flexoParams?.machineSetupMinutes || 40);
  const [flexoWearNotes, setFlexoWearNotes] = useState(
    'Desgaste mecánico normal en rodillos y tracción. Velocidad calibrada a 120 m/min.'
  );
  const [isFlexoSaved, setIsFlexoSaved] = useState(false);

  // Gestión de Tintas Especiales & Catálogo Pantone (Flexo 350mm & Offset)
  const [specialInkTarget, setSpecialInkTarget] = useState<'flexo' | 'offset'>('flexo');
  const [washupCostFlexo, setWashupCostFlexo] = useState<number>(flexoParams?.specialWashupCostPerColor ?? 25);
  const [washupCostOffset, setWashupCostOffset] = useState<number>(offsetParams?.specialWashupCostPerColor ?? 20);
  const [pantoneSearchTerm, setPantoneSearchTerm] = useState('');
  const [pantoneCategory, setPantoneCategory] = useState('ALL');
  const [isSpecialPantoneModalOpen, setIsSpecialPantoneModalOpen] = useState(false);

  // Active ink lists according to targeted press
  const currentFlexoInks: InkColorItem[] = flexoParams?.inkColors || [];
  const currentOffsetInks: InkColorItem[] = offsetParams.inkColorsFront || [];
  const activeInksList = specialInkTarget === 'flexo' ? currentFlexoInks : currentOffsetInks;
  const activeSpotInksCount = activeInksList.filter((c) => c.isSpot || c.isPantone).length;
  const currentWashupUnitCost = specialInkTarget === 'flexo' ? washupCostFlexo : washupCostOffset;
  const currentTotalWashupCost = activeSpotInksCount * currentWashupUnitCost;

  const pantoneCategories = [
    { id: 'ALL', label: 'Todos' },
    { id: 'yellow', label: 'Amarillos (100 C)' },
    { id: 'orange', label: 'Naranjas (021 C)' },
    { id: 'red', label: 'Rojos (186 C / 485 C)' },
    { id: 'blue', label: 'Azules (Reflex Blue)' },
    { id: 'green', label: 'Verdes (347 C)' },
    { id: 'purple', label: 'Púrpuras / Violetas' },
    { id: 'metallic', label: 'Metalizados (Oro / Plata)' },
    { id: 'neutral', label: 'Neutros' },
  ];

  // Filtered Pantone list for embedded search
  const filteredPantones = useMemo(() => {
    return PANTONE_CATALOG.filter((item) => {
      if (pantoneSearchTerm.trim()) {
        const term = pantoneSearchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(term);
        const matchName = item.name.toLowerCase().includes(term);
        if (!matchCode && !matchName) return false;
      }
      if (pantoneCategory !== 'ALL' && item.category !== pantoneCategory) {
        return false;
      }
      return true;
    });
  }, [pantoneSearchTerm, pantoneCategory]);

  const handleAddPantone = (pantone: PantoneColor) => {
    if (specialInkTarget === 'flexo') {
      if (!flexoParams || !onChangeFlexo) {
        setAppliedWasteMessage('Configuración flexográfica no disponible.');
        setTimeout(() => setAppliedWasteMessage(null), 3000);
        return;
      }
      if (flexoParams.inkColors.length >= 8) {
        setAppliedWasteMessage('⚠️ Límite de 8 estaciones alcanzado en la prensa Flexo (Nilpeter/ETIRAMA 350mm).');
        setTimeout(() => setAppliedWasteMessage(null), 3000);
        return;
      }
      const newColor: InkColorItem = {
        id: `pantone_flexo_${Date.now()}`,
        name: pantone.code,
        coveragePercent: pantone.recommendedCoveragePercent,
        colorHex: pantone.hex,
        isSpot: true,
        isPantone: true,
        pantoneCode: pantone.code,
      };
      onChangeFlexo({
        ...flexoParams,
        inkColors: [...flexoParams.inkColors, newColor],
        specialWashupCostPerColor: washupCostFlexo,
      });
      setAppliedWasteMessage(
        `✓ Color ${pantone.code} asignado a Flexo (Estación ${flexoParams.inkColors.length + 1}). Lavado: ${currency.symbol}${washupCostFlexo}.`
      );
    } else {
      if (offsetParams.inkColorsFront.length >= 8) {
        setAppliedWasteMessage('⚠️ Límite de 8 cuerpos alcanzado en la prensa Offset (Heidelberg Speedmaster 8C).');
        setTimeout(() => setAppliedWasteMessage(null), 3000);
        return;
      }
      const newColor: InkColorItem = {
        id: `pantone_offset_${Date.now()}`,
        name: pantone.code,
        coveragePercent: pantone.recommendedCoveragePercent,
        colorHex: pantone.hex,
        isSpot: true,
        isPantone: true,
        pantoneCode: pantone.code,
      };
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: [...offsetParams.inkColorsFront, newColor],
        specialWashupCostPerColor: washupCostOffset,
      });
      setAppliedWasteMessage(
        `✓ Color ${pantone.code} asignado a Offset (Cuerpo ${offsetParams.inkColorsFront.length + 1}). Lavado: ${currency.symbol}${washupCostOffset}.`
      );
    }
    setTimeout(() => setAppliedWasteMessage(null), 3500);
  };

  const handleRemoveSpecialInk = (id: string) => {
    if (specialInkTarget === 'flexo') {
      if (!flexoParams || !onChangeFlexo || flexoParams.inkColors.length <= 1) return;
      onChangeFlexo({
        ...flexoParams,
        inkColors: flexoParams.inkColors.filter((c) => c.id !== id),
      });
    } else {
      if (offsetParams.inkColorsFront.length <= 1) return;
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: offsetParams.inkColorsFront.filter((c) => c.id !== id),
      });
    }
  };

  const handleUpdateSpecialInkCoverage = (id: string, coverage: number) => {
    const val = Math.max(1, Math.min(100, Number(coverage) || 1));
    if (specialInkTarget === 'flexo') {
      if (!flexoParams || !onChangeFlexo) return;
      onChangeFlexo({
        ...flexoParams,
        inkColors: flexoParams.inkColors.map((c) => (c.id === id ? { ...c, coveragePercent: val } : c)),
      });
    } else {
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: offsetParams.inkColorsFront.map((c) => (c.id === id ? { ...c, coveragePercent: val } : c)),
      });
    }
  };

  const handleUpdateWashupRate = (newRate: number) => {
    const val = Math.max(0, Number(newRate) || 0);
    if (specialInkTarget === 'flexo') {
      setWashupCostFlexo(val);
      if (flexoParams && onChangeFlexo) {
        onChangeFlexo({
          ...flexoParams,
          specialWashupCostPerColor: val,
        });
      }
    } else {
      setWashupCostOffset(val);
      onChangeOffset({
        ...offsetParams,
        specialWashupCostPerColor: val,
      });
    }
    setAppliedWasteMessage(`Costo de lavado actualizado a ${currency.symbol}${val} por cuerpo.`);
    setTimeout(() => setAppliedWasteMessage(null), 3000);
  };

  const handleLoadStandard8Colors = () => {
    const std8: InkColorItem[] = [
      { id: `c1_${Date.now()}`, name: 'Cyan Proceso', coveragePercent: 25, colorHex: '#009ee3', isSpot: false },
      { id: `c2_${Date.now()}`, name: 'Magenta Proceso', coveragePercent: 20, colorHex: '#e5007d', isSpot: false },
      { id: `c3_${Date.now()}`, name: 'Yellow Proceso', coveragePercent: 20, colorHex: '#ffed00', isSpot: false },
      { id: `c4_${Date.now()}`, name: 'Black Proceso', coveragePercent: 15, colorHex: '#1a1a1a', isSpot: false },
      { id: `c5_${Date.now()}`, name: 'Pantone 100 C', coveragePercent: 20, colorHex: '#F6E500', isSpot: true, isPantone: true, pantoneCode: 'Pantone 100 C' },
      { id: `c6_${Date.now()}`, name: 'Pantone 021 C', coveragePercent: 25, colorHex: '#FE5000', isSpot: true, isPantone: true, pantoneCode: 'Pantone 021 C' },
      { id: `c7_${Date.now()}`, name: 'Pantone Reflex Blue C', coveragePercent: 30, colorHex: '#0A1172', isSpot: true, isPantone: true, pantoneCode: 'Pantone Reflex Blue C' },
      { id: `c8_${Date.now()}`, name: 'Pantone 871 C (Oro)', coveragePercent: 25, colorHex: '#86724C', isSpot: true, isPantone: true, pantoneCode: 'Pantone 871 C' },
    ];

    if (specialInkTarget === 'flexo' && flexoParams && onChangeFlexo) {
      onChangeFlexo({
        ...flexoParams,
        inkColors: std8,
        specialWashupCostPerColor: washupCostFlexo,
      });
      setAppliedWasteMessage('✓ Preset de 8 colores (CMYK + 4 Pantone directos) cargado en Nilpeter/ETIRAMA 350mm.');
    } else {
      onChangeOffset({
        ...offsetParams,
        inkColorsFront: std8,
        specialWashupCostPerColor: washupCostOffset,
      });
      setAppliedWasteMessage('✓ Preset de 8 colores (CMYK + 4 Pantone directos) cargado en Heidelberg Speedmaster 8C.');
    }
    setTimeout(() => setAppliedWasteMessage(null), 3500);
  };

  // Active machine detection
  const currentMachineId = offsetParams.machineModelId;
  const currentPlateW = offsetParams.plateWidthMm || 745;
  const currentPlateH = offsetParams.plateHeightMm || 605;
  const currentMachineName = offsetParams.machineModelName || 'Heidelberg Speedmaster SM 74';
  const currentMaxW = offsetParams.machineMaxSheetWidthMm || 740;
  const currentMaxH = offsetParams.machineMaxSheetHeightMm || 530;

  const seriesList = ['ALL', '8_COLORES', 'FLEXO', 'SM', 'XL', 'GTO', 'GTOZ', 'MO', 'CD'];

  const filteredMachines =
    selectedSeries === 'ALL'
      ? MACHINE_PRESETS
      : selectedSeries === '8_COLORES'
      ? MACHINE_PRESETS.filter((m) => m.colors === 8)
      : MACHINE_PRESETS.filter((m) => m.series === selectedSeries);

  // Detect which series matches the current machine
  const activeMachinePreset = MACHINE_PRESETS.find((m) => m.id === currentMachineId);
  const activeSeries = activeMachinePreset ? activeMachinePreset.series : 'SM';

  const handleApplyPreset = (machine: PrintingMachinePreset, forceAdjustSheet?: boolean) => {
    const shouldAdjust = forceAdjustSheet !== undefined ? forceAdjustSheet : autoAdjustSheet;
    const seriesWaste = seriesWasteRates[machine.series] || seriesWasteRates['OTRA'];

    // If it's a Flexo press (Nilpeter / ETIRAMA 350mm), also update flexoParams if available
    if (machine.series === 'FLEXO' && onChangeFlexo && flexoParams) {
      onChangeFlexo({
        ...flexoParams,
        machineModelId: machine.id,
        machineModelName: machine.name,
        rollWidthMm: machine.maxSheetWidthMm || 350,
        plateWidthMm: machine.plateWidthMm || 350,
        plateHeightMm: machine.plateHeightMm || 500,
        machineSpeedMetersPerMinute: Math.round((machine.standardSpeedPerHour || 9000) / 60),
        machineHourlyRate: machine.standardHourlyRate,
        machineSetupMinutes: machine.standardSetupMinutes,
        runWastePercent: seriesWaste?.runWastePercent || 4.5,
        setupWasteMeters: seriesWaste?.setupWasteSheets || 50,
      });
    }

    onChangeOffset({
      ...offsetParams,
      machineModelId: machine.id,
      machineModelName: machine.name,
      plateWidthMm: machine.plateWidthMm,
      plateHeightMm: machine.plateHeightMm,
      machineMaxSheetWidthMm: machine.maxSheetWidthMm,
      machineMaxSheetHeightMm: machine.maxSheetHeightMm,
      gripperMarginMm: machine.gripperMarginMm,
      machineSpeedSheetsPerHour: machine.standardSpeedPerHour,
      machineHourlyRate: machine.standardHourlyRate,
      machineSetupMinutes: machine.standardSetupMinutes,
      // Automatically apply the standard waste percentage for this machine series
      runWastePercent: seriesWaste ? seriesWaste.runWastePercent : (offsetParams.runWastePercent || 5),
      setupWasteSheetsPerColor: seriesWaste ? seriesWaste.setupWasteSheets : (offsetParams.setupWasteSheetsPerColor || 50),
      ...(shouldAdjust
        ? {
            sheetWidthMm: machine.maxSheetWidthMm,
            sheetHeightMm: machine.maxSheetHeightMm,
            sheetFormatId: 'custom',
          }
        : {}),
    });

    setAppliedWasteMessage(
      machine.series === 'FLEXO'
        ? `Prensa Flexográfica ${machine.name} configurada (Banda 350mm, 8 Estaciones UV).`
        : `Prensa ${machine.name} configurada con ${seriesWaste?.runWastePercent || 5}% de merma estándar.`
    );
    setTimeout(() => setAppliedWasteMessage(null), 3500);
  };

  const handleUpdateSeriesWaste = (
    seriesKey: string,
    field: 'runWastePercent' | 'setupWasteSheets',
    value: number
  ) => {
    const val = Math.max(0.1, Number(value));
    setSeriesWasteRates((prev) => ({
      ...prev,
      [seriesKey]: {
        ...prev[seriesKey],
        [field]: val,
      },
    }));

    // If active machine is in this series, automatically sync to offsetParams
    if (activeSeries === seriesKey) {
      onChangeOffset({
        ...offsetParams,
        [field === 'runWastePercent' ? 'runWastePercent' : 'setupWasteSheetsPerColor']: val,
      });
    }

    // If FLEXO series is updated, also sync to flexoParams
    if (seriesKey === 'FLEXO' && onChangeFlexo && flexoParams) {
      onChangeFlexo({
        ...flexoParams,
        [field === 'runWastePercent' ? 'runWastePercent' : 'setupWasteMeters']: val,
      });
    }
  };

  const handleApplyWasteToJob = (seriesKey: string) => {
    const waste = seriesWasteRates[seriesKey];
    if (waste) {
      onChangeOffset({
        ...offsetParams,
        runWastePercent: waste.runWastePercent,
        setupWasteSheetsPerColor: waste.setupWasteSheets,
      });

      if (seriesKey === 'FLEXO' && onChangeFlexo && flexoParams) {
        onChangeFlexo({
          ...flexoParams,
          runWastePercent: waste.runWastePercent,
          setupWasteMeters: waste.setupWasteSheets,
        });
      }

      setAppliedWasteMessage(`Merma de Serie ${seriesKey} (${waste.runWastePercent}%) aplicada al cálculo técnico.`);
      setTimeout(() => setAppliedWasteMessage(null), 3000);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeOffset({
      ...offsetParams,
      machineModelId: 'custom',
      machineModelName: customName,
      plateWidthMm: customPlateWidth,
      plateHeightMm: customPlateHeight,
      machineMaxSheetWidthMm: customMaxSheetWidth,
      machineMaxSheetHeightMm: customMaxSheetHeight,
      gripperMarginMm: customGripper,
      machineSpeedSheetsPerHour: customSpeed,
      machineHourlyRate: customHourlyRate,
      machineSetupMinutes: customSetupMinutes,
      runWastePercent: customWastePercent,
      ...(autoAdjustSheet
        ? {
            sheetWidthMm: customMaxSheetWidth,
            sheetHeightMm: customMaxSheetHeight,
            sheetFormatId: 'custom',
          }
        : {}),
    });
    setIsCustomSaved(true);
    setTimeout(() => setIsCustomSaved(false), 2500);
  };

  // Operaciones y Calibración de Máquinas Flexo por Desgaste
  const handleApplyFlexoCalibration = (calib: FlexoMachineCalibration) => {
    if (onChangeFlexo && flexoParams) {
      const safeRollWidth = Math.min(
        calib.maxRollWidthMm,
        Math.max(calib.minRollWidthMm, flexoParams.rollWidthMm || calib.maxRollWidthMm)
      );
      const wearPercent =
        calib.wearReductionPercent !== undefined
          ? calib.wearReductionPercent
          : Math.max(
              0,
              Math.round(
                ((calib.nominalSpeedMetersPerMinute - calib.speedMetersPerMinute) /
                  Math.max(1, calib.nominalSpeedMetersPerMinute)) *
                  100
              )
            );
      const assignedHourlyRate =
        calib.hourlyRate ||
        FLEXO_MACHINE_PRESETS.find((p) => p.id === calib.id)?.standardHourlyRate ||
        flexoParams.machineHourlyRate ||
        95;

      onChangeFlexo({
        ...flexoParams,
        machineModelId: calib.id,
        machineModelName: calib.name,
        rollWidthMm: safeRollWidth,
        machineMaxRollWidthMm: calib.maxRollWidthMm,
        machineMinRollWidthMm: calib.minRollWidthMm,
        machineNominalSpeedMetersPerMinute: calib.nominalSpeedMetersPerMinute,
        machineWearReductionPercent: wearPercent,
        runWastePercent: calib.standardWastePercent,
        setupWasteMeters: calib.setupWasteMeters,
        machineSpeedMetersPerMinute: calib.speedMetersPerMinute,
        machineHourlyRate: assignedHourlyRate,
        plateWidthMm: calib.maxRollWidthMm,
        plateHeightMm: flexoParams.cylinderRepeatMm || 500,
      });

      setAppliedWasteMessage(
        `Prensa Flexo ${calib.name} asignada: ${currency.symbol}${assignedHourlyRate}/h | ${calib.speedMetersPerMinute} m/min (${wearPercent > 0 ? `-${wearPercent}% desgaste` : 'nominal'}), Merma ${calib.standardWastePercent}%, Arranque ${calib.setupWasteMeters} ml.`
      );
      setTimeout(() => setAppliedWasteMessage(null), 3500);
    }
  };

  const handleUpdateFlexoSpeed = (id: string, newSpeed: number) => {
    const speed = Math.max(10, Math.min(500, Number(newSpeed)));
    const existing = flexoCalibrations.find((c) => c.id === id);
    if (!existing) return;

    const wearPercent = Math.max(
      0,
      Math.round(
        ((existing.nominalSpeedMetersPerMinute - speed) /
          Math.max(1, existing.nominalSpeedMetersPerMinute)) *
          100
      )
    );

    const updated: FlexoMachineCalibration = {
      ...existing,
      speedMetersPerMinute: speed,
      wearReductionPercent: wearPercent,
      lastCalibratedDate: new Date().toLocaleDateString('es-ES'),
    };

    const allUpdated = saveFlexoMachineCalibration(updated);
    setFlexoCalibrations(allUpdated);

    if (flexoParams?.machineModelId === id && onChangeFlexo) {
      onChangeFlexo({
        ...flexoParams,
        machineSpeedMetersPerMinute: speed,
        machineWearReductionPercent: wearPercent,
      });
    }
  };

  const handleResetFlexoMachine = (id: string) => {
    const reloaded = resetFlexoMachineCalibration(id);
    setFlexoCalibrations(reloaded);
    const defaultVal = reloaded.find((c) => c.id === id);
    if (defaultVal && flexoParams?.machineModelId === id && onChangeFlexo) {
      onChangeFlexo({
        ...flexoParams,
        machineSpeedMetersPerMinute: defaultVal.speedMetersPerMinute,
        machineWearReductionPercent: 0,
      });
    }
  };

  const handleDeleteFlexoMachine = (id: string) => {
    const reloaded = deleteCustomFlexoMachine(id);
    setFlexoCalibrations(reloaded);
  };

  const handleSaveCustomFlexo = (e: React.FormEvent) => {
    e.preventDefault();
    const wearPercent = Math.max(
      0,
      Math.round(
        ((flexoNominalSpeedMpm - flexoSpeedMpm) / Math.max(1, flexoNominalSpeedMpm)) * 100
      )
    );

    const newCalib: FlexoMachineCalibration = {
      id: `flexo_custom_${Date.now()}`,
      name: flexoCustomName.trim() || 'Prensa Flexo Personalizada',
      maxRollWidthMm: Number(flexoMaxRollWidth) || 350,
      minRollWidthMm: Number(flexoMinRollWidth) || 120,
      standardWastePercent: Number(flexoWastePercent) || 4.2,
      setupWasteMeters: Number(flexoSetupWasteMeters) || 100,
      speedMetersPerMinute: Number(flexoSpeedMpm) || 120,
      nominalSpeedMetersPerMinute: Number(flexoNominalSpeedMpm) || 150,
      wearReductionPercent: wearPercent,
      wearNotes: flexoWearNotes.trim(),
      lastCalibratedDate: new Date().toLocaleDateString('es-ES'),
      isCustom: true,
      hourlyRate: Number(flexoHourlyRate) || 95,
    };

    const updatedList = saveFlexoMachineCalibration(newCalib);
    setFlexoCalibrations(updatedList);
    handleApplyFlexoCalibration(newCalib);
    setIsFlexoSaved(true);
    setTimeout(() => setIsFlexoSaved(false), 2500);
  };

  // Live Technical Calculations impact of current waste parameters
  const totalColors =
    offsetParams.inkColorsFront.length +
    (offsetParams.isTwoSided ? offsetParams.inkColorsBack.length : 0);
  const approxNetSheets = Math.ceil(offsetParams.quantityUnits / 4); // Estimating standard 4 poses
  const currentRunWasteSheets = Math.ceil(approxNetSheets * (offsetParams.runWastePercent / 100));
  const currentSetupWasteSheets = (offsetParams.setupWasteSheetsPerColor || 50) * Math.max(1, totalColors);
  const totalWasteSheets = currentRunWasteSheets + currentSetupWasteSheets;

  const sheetAreaM2 = (offsetParams.sheetWidthMm * offsetParams.sheetHeightMm) / 1_000_000;
  const wastePaperKg = Number(((totalWasteSheets * sheetAreaM2 * offsetParams.grammageGsm) / 1000).toFixed(2));
  const wastePaperCost = Number((wastePaperKg * offsetParams.paperCostPerKg).toFixed(2));

  // Additional ink consumption for waste passes
  const pieceAreaM2 = (offsetParams.pieceWidthMm * offsetParams.pieceHeightMm * 4) / 1_000_000;
  const wasteInkKg = Number(((totalWasteSheets * pieceAreaM2 * (offsetParams.inkGramsPerM2 || 1.2)) / 1000).toFixed(3));
  const wasteInkCost = Number((wasteInkKg * offsetParams.inkCostPerKg).toFixed(2));

  return (
    <div className="flex flex-col gap-6">
      {/* Pestaña: Prensas Flexográficas & Calibración por Desgaste */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10 ring-1 ring-amber-400">
            <Gauge className="w-4 h-4" />
            <span>Prensas Flexográficas & Calibración por Desgaste (Bobina)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono font-bold border border-amber-500/30">
              5 Parámetros
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 pr-2">
          <span>
            Prensa Flexo Asignada:{' '}
            <strong className="text-amber-400">
              {flexoParams?.machineModelName || 'Nilpeter FA-350'}
            </strong>{' '}
            <span className="text-emerald-400 font-bold">({currency.symbol}{flexoParams?.machineHourlyRate || 95}/h)</span>{' '}
            <span className="text-slate-500 font-normal">({flexoParams?.machineSpeedMetersPerMinute || 200} m/min)</span>
          </span>
        </div>
      </div>

      {activeTechTab === 'offset' && (
        <div className="flex flex-col gap-6">
          {/* Header Banner with Active Machine Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Máquinas Offset & Ajuste de Prensa (Planchas CTP)</span>
            </h2>
            <p className="text-xs text-slate-400">
              El <strong className="text-orange-400">Ajuste de Prensa</strong> corresponde al tamaño de planchas de las máquinas (Línea Naranja). El <strong className="text-emerald-400">Pliego de Papel</strong> ({offsetParams.sheetWidthMm} × {offsetParams.sheetHeightMm} mm) se mantiene independiente.
            </p>
          </div>
        </div>

        {/* Current Active Specs Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Máquina Activa:
            </span>
            <span className="font-bold text-slate-200 truncate max-w-[180px] block">
              {currentMachineName}
            </span>
          </div>

          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-orange-400 uppercase block font-sans font-bold">
              🟠 Ajuste Prensa (Plancha):
            </span>
            <span className="font-bold text-orange-400 text-sm">
              {currentPlateW} × {currentPlateH} mm
            </span>
          </div>

          <div className="hidden sm:block pl-4 border-l border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">
              🟢 Pliego Papel Actual:
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              {offsetParams.sheetWidthMm} × {offsetParams.sheetHeightMm} mm
            </span>
          </div>

          <div className="hidden sm:block pl-4 border-l border-slate-800">
            <span className="text-[10px] text-purple-400 uppercase block font-sans font-bold">
              📉 Merma Tirada:
            </span>
            <span className="font-bold text-purple-300">
              {offsetParams.runWastePercent}%
            </span>
          </div>

          {/* Costo Hora Offset */}
          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase block font-sans font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" /> Costo Hora Offset:
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-slate-400 text-xs font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={offsetParams.machineHourlyRate || 65}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onChangeOffset({ ...offsetParams, machineHourlyRate: val });
                }}
                className="w-16 bg-slate-900 border border-amber-500/40 focus:border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold text-amber-400 text-right focus:outline-none"
                title="Costo por hora de máquina Offset activa"
              />
              <span className="text-slate-400 text-[11px]">/h</span>
            </div>
          </div>

          {/* Costo Hora Flexo */}
          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> Costo Hora Flexo:
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-slate-400 text-xs font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={flexoParams?.machineHourlyRate ?? 95}
                onChange={(e) => {
                  if (onChangeFlexo && flexoParams) {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onChangeFlexo({ ...flexoParams, machineHourlyRate: val });
                  }
                }}
                className="w-16 bg-slate-900 border border-emerald-500/40 focus:border-emerald-400 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-400 text-right focus:outline-none"
                title="Costo por hora de máquina Flexo activa"
              />
              <span className="text-slate-400 text-[11px]">/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN COSTO POR HORA DE MÁQUINA (OFFSET & FLEXO)             */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Costo por Hora de Máquina (Tarifas Offset & Flexo)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                  Tarifario Operativo en Vivo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ajusta el costo por hora operativa de la máquina seleccionada. Estas tarifas impactan directamente en el cálculo de costo de tirada, puesta a punto (setup/arranque) y el presupuesto final.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 font-sans">Offset:</span>
            <span className="font-bold text-amber-400 text-sm">
              {currency.symbol}{offsetParams.machineHourlyRate || 65}/h
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-sans">Flexo:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {currency.symbol}{flexoParams?.machineHourlyRate || 95}/h
            </span>
          </div>
        </div>

        {/* Dual Cards: Offset Press vs Flexo Press */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta Prensa Offset */}
          <div className="bg-slate-950/80 rounded-xl border border-amber-500/20 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[220px]">
                    {currentMachineName}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Prensa Offset Activa ({offsetParams.inkColorsFront?.length || 4} Colores)
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Plancha: {currentPlateW}×{currentPlateH} mm
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                  Costo Hora Máquina Offset
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Tarifa / h en orden de trabajo
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-sm">{currency.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={offsetParams.machineHourlyRate || 65}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onChangeOffset({ ...offsetParams, machineHourlyRate: val });
                  }}
                  className="w-24 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-lg px-2.5 py-1 text-base font-mono font-black text-amber-400 text-right focus:outline-none shadow-inner"
                  title="Costo por hora de máquina Offset"
                />
                <span className="text-xs text-slate-400 font-mono">/h</span>
              </div>
            </div>

            {/* Quick Adjust Buttons & Live Metrics */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-[10px] text-slate-500">Ajuste rápido:</span>
                <button
                  type="button"
                  onClick={() => onChangeOffset({ ...offsetParams, machineHourlyRate: Math.max(5, (offsetParams.machineHourlyRate || 65) - 5) })}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOffset({ ...offsetParams, machineHourlyRate: (offsetParams.machineHourlyRate || 65) + 5 })}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOffset({ ...offsetParams, machineHourlyRate: (offsetParams.machineHourlyRate || 65) + 10 })}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  +10
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 text-right">
                <span>{currency.symbol}{((offsetParams.machineHourlyRate || 65) / 60).toFixed(2)}/min</span>
                <span className="text-slate-600 mx-1">•</span>
                <span className="text-slate-300">{offsetParams.machineSpeedSheetsPerHour?.toLocaleString() || '10,000'} pl/h</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Prensa Flexo */}
          <div className="bg-slate-950/80 rounded-xl border border-emerald-500/20 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[220px]">
                    {flexoParams?.machineModelName || 'Nilpeter FA-350'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Prensa Flexográfica ({flexoParams?.inkColors?.length || 8} Estaciones)
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                Bobina: {flexoParams?.rollWidthMm || 350} mm
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                  Costo Hora Máquina Flexo
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Tarifa / h en presupuestos de bobina
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-sm">{currency.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={flexoParams?.machineHourlyRate ?? 95}
                  onChange={(e) => {
                    if (onChangeFlexo && flexoParams) {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      onChangeFlexo({ ...flexoParams, machineHourlyRate: val });
                    }
                  }}
                  className="w-24 bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-2.5 py-1 text-base font-mono font-black text-emerald-400 text-right focus:outline-none shadow-inner"
                  title="Costo por hora de máquina Flexográfica"
                />
                <span className="text-xs text-slate-400 font-mono">/h</span>
              </div>
            </div>

            {/* Quick Adjust Buttons & Live Metrics */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-[10px] text-slate-500">Ajuste rápido:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onChangeFlexo && flexoParams) {
                      onChangeFlexo({ ...flexoParams, machineHourlyRate: Math.max(5, (flexoParams.machineHourlyRate || 95) - 5) });
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onChangeFlexo && flexoParams) {
                      onChangeFlexo({ ...flexoParams, machineHourlyRate: (flexoParams.machineHourlyRate || 95) + 5 });
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onChangeFlexo && flexoParams) {
                      onChangeFlexo({ ...flexoParams, machineHourlyRate: (flexoParams.machineHourlyRate || 95) + 10 });
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  +10
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 text-right">
                <span>{currency.symbol}{(((flexoParams?.machineHourlyRate || 95)) / 60).toFixed(2)}/min</span>
                <span className="text-slate-600 mx-1">•</span>
                <span className="text-slate-300">{flexoParams?.machineSpeedMetersPerMinute || 200} m/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Message Notification */}
      {appliedWasteMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{appliedWasteMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN NUEVA: GESTIÓN DE MERMAS POR TIPO DE MÁQUINA           */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Gestión de Mermas por Tipo de Máquina</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30">
                  Ajuste Automático de Papel & Tinta
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Define el porcentaje de merma estándar para cada serie (GTO, MO, SM, CD, XL). Al aplicarlo, se recalculan de inmediato los pliegos brutos de papel y el consumo adicional de tinta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 font-sans">Merma en Trabajo Activo:</span>
            <span className="font-bold text-amber-400 text-sm">
              {offsetParams.runWastePercent}%
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-sans">Entrada:</span>
            <span className="font-bold text-sky-400">
              {offsetParams.setupWasteSheetsPerColor || 50} pl/color
            </span>
          </div>
        </div>

        {/* Live Technical Impact Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Impacto en Consumo de Papel:</span>
              <span className="text-sm font-bold font-mono text-sky-300 block mt-0.5">
                +{totalWasteSheets.toLocaleString()} pliegos de merma
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {wastePaperKg} kg papel ({currency.symbol}{wastePaperCost})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-2 md:pt-0 md:pl-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 shrink-0 mt-0.5">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Impacto en Consumo de Tinta:</span>
              <span className="text-sm font-bold font-mono text-pink-300 block mt-0.5">
                +{wasteInkKg} kg tinta en merma
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Costo adicional tinta: {currency.symbol}{wasteInkCost}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-2 md:pt-0 md:pl-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Sincronización Técnica:</span>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                El motor Aravo incluye automáticamente las hojas de merma en el tiempo de tiro de máquina y en la cotización oficial.
              </p>
            </div>
          </div>
        </div>

        {/* Series Waste Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Object.entries(seriesWasteRates).map(([seriesKey, config]) => {
            const isSeriesActive = activeSeries === seriesKey;
            const isMatchingPercent = offsetParams.runWastePercent === config.runWastePercent;

            return (
              <div
                key={seriesKey}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isSeriesActive
                    ? 'bg-slate-950 border-purple-500/60 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-xs">
                      Serie {seriesKey}
                    </span>
                    {isSeriesActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        MÁQUINA ACTIVA
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{config.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{config.sublabel}</p>
                  <p className="text-[11px] text-slate-500 mt-1 italic">{config.description}</p>
                </div>

                {/* Config Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  {/* Run Waste Percent Slider & Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 font-medium">Merma de Tirada (%):</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="25"
                          value={config.runWastePercent}
                          onChange={(e) =>
                            handleUpdateSeriesWaste(seriesKey, 'runWastePercent', Number(e.target.value))
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-300 outline-none focus:border-amber-400"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.1"
                      value={config.runWastePercent}
                      onChange={(e) =>
                        handleUpdateSeriesWaste(seriesKey, 'runWastePercent', Number(e.target.value))
                      }
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Setup Waste Sheets */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 text-[11px]">Entrada por color:</span>
                    <div className="flex items-center gap-1 font-mono text-sky-300">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="5"
                        value={config.setupWasteSheets}
                        onChange={(e) =>
                          handleUpdateSeriesWaste(seriesKey, 'setupWasteSheets', Number(e.target.value))
                        }
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-sky-300 outline-none focus:border-sky-400"
                      />
                      <span className="text-[10px] text-slate-500">pl</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => handleApplyWasteToJob(seriesKey)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isMatchingPercent
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    {isMatchingPercent ? 'Merma Asignada al Trabajo' : `Aplicar ${config.runWastePercent}% al Trabajo`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN: GESTIÓN DE TINTAS ESPECIALES & CATÁLOGO PANTONE®       */}
      {/* ============================================================== */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Gestión de Tintas Especiales & Catálogo Pantone®
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Hasta 8 Estaciones en Línea
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Asignación de colores directos (Ej: <strong className="text-amber-300">Pantone 100 C</strong>) para prensas Flexo (Nilpeter 350mm / ETIRAMA 350mm) y Offset (Heidelberg 8C). Cálculo automático del costo de lavado de tinteros, anilox y entintado.
              </p>
            </div>
          </div>

          {/* Quick preset 8C button & Modal trigger */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleLoadStandard8Colors}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Cargar rápidamente 4 de proceso CMYK + 4 Pantone directos"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Preset CMYK + 4 Pantone</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSpecialPantoneModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ver Catálogo Completo</span>
            </button>
          </div>
        </div>

        {/* Press Technology Selector Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 px-1">Configurar para:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSpecialInkTarget('flexo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  specialInkTarget === 'flexo'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Flexografía 350mm (Nilpeter / ETIRAMA)</span>
              </button>

              <button
                type="button"
                onClick={() => setSpecialInkTarget('offset')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  specialInkTarget === 'offset'
                    ? 'bg-sky-500 text-slate-950 shadow-md ring-1 ring-sky-400 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Offset a Pliego (Heidelberg Speedmaster 8C)</span>
              </button>
            </div>
          </div>

          {/* Active press tag */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {specialInkTarget === 'flexo'
                ? 'Prensa Flexo Banda 350mm (8 Estaciones UV)'
                : 'Prensa Offset Heidelberg (8 Cuerpos)'}
            </span>
          </div>
        </div>

        {/* Washup & Inking Cost Control Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          {/* Unit washup cost control */}
          <div className="flex flex-col justify-between gap-2">
            <div>
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Costo Lavado y Entintado por Estación:</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {specialInkTarget === 'flexo'
                  ? 'Limpieza profunda de cámara cerrada, raclas doctor blade y rodillo anilox cerámico.'
                  : 'Lavado automático de batería de rodillos de entintado, espátulas y tintero CTP.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-bold text-slate-300">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={currentWashupUnitCost}
                onChange={(e) => handleUpdateWashupRate(Number(e.target.value))}
                className="w-36 min-w-[120px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                placeholder={currency.code === 'PYG' ? '150000' : '20.00'}
              />
              <span className="text-slate-400 font-mono text-[11px]">/ cuerpo preparado</span>
            </div>
          </div>

          {/* Washup & Inking Subtotal */}
          <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Subtotal Lavado y Puesta a Punto:</span>
              <span className="text-lg font-bold font-mono text-amber-300 block mt-0.5">
                {currency.symbol}{currentTotalWashupCost.toFixed(currency.decimals)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeSpotInksCount} {activeSpotInksCount === 1 ? 'color especial' : 'colores especiales'} × {currency.symbol}{currentWashupUnitCost}
              </span>
            </div>
          </div>

          {/* Time & Setup info */}
          <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tiempo Adicional Estimado (Aravo):</span>
              <span className="text-lg font-bold font-mono text-sky-300 block mt-0.5">
                +{(activeSpotInksCount * 0.25).toFixed(2)} h ({activeSpotInksCount * 15} min)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Impacto computado automáticamente en el costo fabril y presupuesto final.
              </p>
            </div>
          </div>
        </div>

        {/* 8-Color Station Rack */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Estaciones de Impresión en Línea ({activeInksList.length} de 8 ocupadas)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {8 - activeInksList.length} estaciones libres para colores directos Pantone®
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => {
              const ink = activeInksList[index];
              const stationNum = index + 1;

              if (ink) {
                const isSpot = ink.isSpot || ink.isPantone;
                return (
                  <div
                    key={ink.id || stationNum}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-2.5 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          Estación #{stationNum}
                        </span>
                        {ink.isPantone && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                            PMS
                          </span>
                        )}
                      </div>

                      {activeInksList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialInk(ink.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Vaciar estación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg border border-white/20 shrink-0 shadow-md"
                        style={{ backgroundColor: ink.colorHex }}
                      />
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-100 truncate" title={ink.name}>
                          {ink.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {isSpot ? `Lavado: ${currency.symbol}${currentWashupUnitCost}` : 'Proceso Base'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">Cobertura:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={ink.coveragePercent}
                          onChange={(e) => handleUpdateSpecialInkCoverage(ink.id, Number(e.target.value))}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-xs font-bold text-slate-200 outline-none"
                        />
                        <span className="text-slate-400 text-[11px] font-mono">%</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Empty station slot
              return (
                <div
                  key={`empty_${stationNum}`}
                  className="bg-slate-950/40 p-3 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
                >
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    Estación #{stationNum}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Disponible</span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstYellow = PANTONE_CATALOG.find((p) => p.code === 'Pantone 100 C') || PANTONE_CATALOG[0];
                      handleAddPantone(firstYellow);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 mt-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Añadir Pantone</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Pantone Search & Quick Assign Tool */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Búsqueda Rápida en Catálogo Oficial Pantone®:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Selecciona cualquier tono Pantone para asignarlo inmediatamente a la prensa {specialInkTarget === 'flexo' ? 'Nilpeter / ETIRAMA 350mm' : 'Heidelberg 8C'}.
              </span>
            </div>

            {/* Direct search input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pantoneSearchTerm}
                onChange={(e) => setPantoneSearchTerm(e.target.value)}
                placeholder="Buscar código (ej: 100 C, 021, Reflex Blue, Oro)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400"
              />
              {pantoneSearchTerm && (
                <button
                  type="button"
                  onClick={() => setPantoneSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1">
            {pantoneCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPantoneCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  pantoneCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Swatches Preview List (sliced to 8 most relevant) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
            {filteredPantones.slice(0, 8).map((item) => (
              <button
                key={item.code}
                type="button"
                disabled={activeInksList.length >= 8}
                onClick={() => handleAddPantone(item)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 flex flex-col justify-between gap-1.5 text-left transition-all group disabled:opacity-40"
              >
                <div className="flex items-center justify-between gap-1">
                  <div
                    className="w-6 h-6 rounded-md border border-white/20 shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="text-[10px] text-amber-400 font-mono font-bold truncate">
                    + Asignar
                  </span>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-100 block truncate">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Cob: {item.recommendedCoveragePercent}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Series Filter Tabs (GTO, GTOZ, MO, SM, CD, XL) & Auto-Adjust Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Serie:</span>
          </span>
          {seriesList.map((series) => {
            let label = `Serie ${series}`;
            if (series === 'ALL') label = 'Todas las Prensas';
            if (series === '8_COLORES') label = '⭐ 8 Colores (Offset & Flexo)';
            if (series === 'FLEXO') label = 'Flexo 350mm (Nilpeter / ETIRAMA)';

            return (
              <button
                key={series}
                type="button"
                onClick={() => setSelectedSeries(series)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSeries === series
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Auto Adjust Sheet Switch */}
        <label className="flex items-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors self-start sm:self-auto">
          <input
            type="checkbox"
            checked={autoAdjustSheet}
            onChange={(e) => setAutoAdjustSheet(e.target.checked)}
            className="rounded text-amber-500 focus:ring-0"
          />
          <span>Adaptar pliego al formato máx. al seleccionar</span>
        </label>
      </div>

      {/* Grid of Preset Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMachines.map((machine) => {
          const isSelected =
            currentMachineId === machine.id || currentMachineName === machine.name;
          const machineSeriesWaste = seriesWasteRates[machine.series]?.runWastePercent || 5.0;

          return (
            <div
              key={machine.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                      {machine.series}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {machine.colors} {machine.colors === 1 ? 'Cuerpo' : 'Cuerpos'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{machine.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {machine.description}
                  </p>
                </div>
              </div>

              {/* Specs Box */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
                {/* Plate Size (Orange) */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-orange-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-orange-500 shadow-[0_0_6px_#f97316]" />
                    <span>Ajuste Prensa (Plancha CTP):</span>
                  </span>
                  <span className="font-mono font-bold text-orange-400 text-xs">
                    {machine.plateWidthMm} × {machine.plateHeightMm} mm
                  </span>
                </div>

                {/* Sheet Max Format (Green) */}
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                    <span>Capacidad Máx. Pliego:</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {machine.maxSheetWidthMm} × {machine.maxSheetHeightMm} mm
                  </span>
                </div>

                {/* Standard Waste Rate */}
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                    <span>Merma Estándar:</span>
                  </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {machineSeriesWaste}%
                  </span>
                </div>

                {/* Gripper Margin */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pinza (Gripper):</span>
                  </span>
                  <span className="font-mono text-slate-200">
                    {machine.gripperMarginMm} mm
                  </span>
                </div>

                {/* Speed & Rate */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-purple-400" />
                    <span>Velocidad Nominal:</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-100">
                    {machine.standardSpeedPerHour.toLocaleString()} pl/h
                  </span>
                </div>

                {/* Costo Hora Máquina */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>Costo Hora Máquina:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {currency.symbol}{machine.standardHourlyRate}/h
                  </span>
                </div>
              </div>

              {/* Action Buttons: Explicitly Separate Press Setup from Sheet Size */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(machine, false)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Prensa & Plancha Asignada</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Ajustar Prensa (Plancha CTP & Merma)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(machine, true)}
                  className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 active:scale-95"
                  title={`Adaptar el pliego de papel a ${machine.maxSheetWidthMm} × ${machine.maxSheetHeightMm} mm`}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adaptar Pliego al Límite ({machine.maxSheetWidthMm} × {machine.maxSheetHeightMm} mm)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Machine / Custom Plate Size Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5 mt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Ajuste de Prensa Personalizado (Tamaño de Plancha CTP a Medida)
              </h3>
              <p className="text-xs text-slate-400">
                Si cuentas con una prensa o CTP personalizado, define aquí las dimensiones exactas de plancha metálica y merma.
              </p>
            </div>
          </div>

          {isCustomSaved && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Parámetros aplicados al presupuesto!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleApplyCustom} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Custom Name */}
          <div className="sm:col-span-2">
            <label className="text-slate-300 font-semibold block mb-1.5">
              Nombre de la Máquina / Prensa:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej. Heidelberg SM 74-4+L Taller 1"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Pliego Max Width */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Capacidad Máx. Pliego Ancho (mm):
            </label>
            <input
              type="number"
              min="100"
              max="2000"
              value={customMaxSheetWidth}
              onChange={(e) => setCustomMaxSheetWidth(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Pliego Max Height */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Capacidad Máx. Pliego Alto (mm):
            </label>
            <input
              type="number"
              min="100"
              max="2000"
              value={customMaxSheetHeight}
              onChange={(e) => setCustomMaxSheetHeight(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Plate Width */}
          <div>
            <label className="text-orange-400 font-bold block mb-1.5 flex items-center justify-between">
              <span>🟠 Ancho Plancha CTP (mm):</span>
              <span className="text-[10px] text-slate-500">Ej. 510, 605, 745</span>
            </label>
            <input
              type="number"
              min="100"
              max="2000"
              value={customPlateWidth}
              onChange={(e) => setCustomPlateWidth(Number(e.target.value))}
              className="w-full bg-slate-950 border border-orange-500/40 rounded-xl px-3 py-2 font-mono text-orange-300 font-bold focus:outline-none focus:border-orange-400"
              required
            />
          </div>

          {/* Plate Height */}
          <div>
            <label className="text-orange-400 font-bold block mb-1.5 flex items-center justify-between">
              <span>🟠 Alto Plancha CTP (mm):</span>
              <span className="text-[10px] text-slate-500">Ej. 400, 605, 1030</span>
            </label>
            <input
              type="number"
              min="100"
              max="2000"
              value={customPlateHeight}
              onChange={(e) => setCustomPlateHeight(Number(e.target.value))}
              className="w-full bg-slate-950 border border-orange-500/40 rounded-xl px-3 py-2 font-mono text-orange-300 font-bold focus:outline-none focus:border-orange-400"
              required
            />
          </div>

          {/* Gripper */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Margen Pinza (mm):
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={customGripper}
              onChange={(e) => setCustomGripper(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Merma Tirada */}
          <div>
            <label className="text-purple-300 font-semibold block mb-1.5">
              Merma de Tirada (%):
            </label>
            <input
              type="number"
              min="0.5"
              max="25"
              step="0.1"
              value={customWastePercent}
              onChange={(e) => setCustomWastePercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 font-mono text-purple-300 font-bold focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Speed */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Velocidad Tiro (pl/h):
            </label>
            <input
              type="number"
              min="1000"
              max="30000"
              step="500"
              value={customSpeed}
              onChange={(e) => setCustomSpeed(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Costo Hora Máquina ({currency.symbol}/hora):
            </label>
            <input
              type="number"
              min="1"
              value={customHourlyRate}
              onChange={(e) => setCustomHourlyRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 lg:col-span-4 pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Guardar y Aplicar Prensa & Plancha CTP al Trabajo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ============================================================== */}
  {/* PESTAÑA: MÁQUINAS FLEXOGRÁFICAS & CALIBRACIÓN POR DESGASTE      */}
  {/* ============================================================== */}
  {activeTechTab === 'flexo' && (
    <div className="flex flex-col gap-6">
      {/* Header Banner Flexo with Active Machine Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Prensas Flexográficas & Calibración de Velocidad por Desgaste</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-0.5">
              Control técnico de prensas flexo en bobina. Por el paso del tiempo y desgaste mecánico en tracción, rodamientos, tensión de embobinado y lámparas UV, las máquinas van reduciendo su velocidad operativa respecto a la nominal de fábrica. Carga en forma manual los 5 parámetros y calibra la velocidad real para presupuestos exactos.
            </p>
          </div>
        </div>

        {/* Active Flexo Machine Status Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Prensa Flexo Asignada:
            </span>
            <span className="font-bold text-amber-400 truncate max-w-[200px] block">
              {flexoParams?.machineModelName || 'Nilpeter FA-350'}
            </span>
          </div>

          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">
              1 & 2. Ancho Bobina:
            </span>
            <span className="font-bold text-emerald-400">
              {flexoParams?.rollWidthMm || 350} mm
              <span className="text-[10px] text-slate-500 font-normal ml-1">
                (Mín: {flexoParams?.machineMinRollWidthMm || 120} / Máx: {flexoParams?.machineMaxRollWidthMm || 350})
              </span>
            </span>
          </div>

          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-purple-400 uppercase block font-sans font-bold">
              3. Merma Estándar:
            </span>
            <span className="font-bold text-purple-300">
              {flexoParams?.runWastePercent || 4.0}%
            </span>
          </div>

          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-sky-400 uppercase block font-sans font-bold">
              4. Merma Arranque:
            </span>
            <span className="font-bold text-sky-300">
              {flexoParams?.setupWasteMeters || 150} ml
            </span>
          </div>

          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase block font-sans font-bold">
              5. Velocidad Actual:
            </span>
            <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <span>{flexoParams?.machineSpeedMetersPerMinute || 200} m/min</span>
              {(flexoParams?.machineWearReductionPercent ?? 0) > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  -{flexoParams?.machineWearReductionPercent}% desgaste
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Nominal
                </span>
              )}
            </span>
          </div>

          {/* Costo Hora Flexo */}
          <div className="pl-4 border-l border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> Costo Hora Flexo:
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-slate-400 text-xs font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={flexoParams?.machineHourlyRate ?? 95}
                onChange={(e) => {
                  if (onChangeFlexo && flexoParams) {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onChangeFlexo({ ...flexoParams, machineHourlyRate: val });
                  }
                }}
                className="w-16 bg-slate-900 border border-emerald-500/40 focus:border-emerald-400 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-400 text-right focus:outline-none"
                title="Costo por hora de máquina Flexo activa"
              />
              <span className="text-slate-400 text-[11px]">/h</span>
            </div>
          </div>

          {/* Costo Hora Offset */}
          <div className="hidden sm:block pl-4 border-l border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase block font-sans font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" /> Costo Hora Offset:
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-slate-400 text-xs font-bold">{currency.symbol}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={offsetParams.machineHourlyRate || 65}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onChangeOffset({ ...offsetParams, machineHourlyRate: val });
                }}
                className="w-16 bg-slate-900 border border-amber-500/40 focus:border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold text-amber-400 text-right focus:outline-none"
                title="Costo por hora de máquina Offset activa"
              />
              <span className="text-slate-400 text-[11px]">/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Message Notification */}
      {appliedWasteMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{appliedWasteMessage}</span>
        </div>
      )}

      {/* Ribbon Explicativo de los 5 Parámetros Técnicos Fundamentales Requeridos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-black border border-emerald-500/30">
              1
            </span>
            <span>Ancho Máximo Bobina</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Ancho útil máximo que admite el paso de banda, camisas y troquel rotativo (mm).
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-black border border-emerald-500/30">
              2
            </span>
            <span>Ancho Mínimo Bobina</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Ancho inferior seguro para mantener tracción constante y guiador de orilla (mm).
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px] font-black border border-purple-500/30">
              3
            </span>
            <span>Merma Estándar (%)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Porcentaje de material previsto para descarte y empalmes en tiraje continuo.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px] font-black border border-sky-500/30">
              4
            </span>
            <span>Merma Metros Lineales</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Metros de arranque / puesta a punto para calce de color, fotocélula y viscosidad.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-black border border-amber-500/30">
              5
            </span>
            <span>Velocidad (m/min)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Velocidad real operativa. Se calibra en forma manual por desgaste al paso del tiempo.
          </p>
        </div>
      </div>

      {/* Grid de Máquinas Flexográficas Calibradas */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Catálogo de Prensas Flexográficas del Taller</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                {flexoCalibrations.length} Equipos
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Selecciona una prensa o calibra su velocidad real de acuerdo al desgaste mecánico acumulado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {flexoCalibrations.map((calib) => {
            const isSelected = flexoParams?.machineModelId === calib.id;
            const wearPercent =
              calib.wearReductionPercent !== undefined
                ? calib.wearReductionPercent
                : Math.max(
                    0,
                    Math.round(
                      ((calib.nominalSpeedMetersPerMinute - calib.speedMetersPerMinute) /
                        Math.max(1, calib.nominalSpeedMetersPerMinute)) *
                        100
                    )
                  );

            return (
              <div
                key={calib.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Header Tarjeta */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                      FLEXO {calib.maxRollWidthMm} mm
                    </span>
                    {calib.isCustom ? (
                      <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded">
                        Personalizada
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Estándar Taller
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{calib.name}</h4>
                  {calib.wearNotes && (
                    <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">
                      "{calib.wearNotes}"
                    </p>
                  )}
                </div>

                {/* Especificaciones Técnicas (Los 5 Parámetros) */}
                <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-2.5 text-xs">
                  {/* 1. Ancho Máximo */}
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>1. Ancho Máx. de Bobina:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {calib.maxRollWidthMm} mm
                    </span>
                  </div>

                  {/* 2. Ancho Mínimo */}
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400/80 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                      <span>2. Ancho Mín. de Bobina:</span>
                    </span>
                    <span className="font-mono text-emerald-300">
                      {calib.minRollWidthMm} mm
                    </span>
                  </div>

                  {/* 3. Merma Estándar en % */}
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                      <span>3. Merma Estándar:</span>
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {calib.standardWastePercent}%
                    </span>
                  </div>

                  {/* 4. Merma en Metros Lineales */}
                  <div className="flex items-center justify-between">
                    <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>4. Merma en Metros Lineales:</span>
                    </span>
                    <span className="font-mono font-bold text-sky-300">
                      {calib.setupWasteMeters} ml
                    </span>
                  </div>

                  {/* 5. Velocidad en Metros por Minuto & Desgaste */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        <span>5. Velocidad Operativa:</span>
                      </span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {calib.speedMetersPerMinute} m/min
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Nominal fábrica: {calib.nominalSpeedMetersPerMinute} m/min</span>
                      {wearPercent > 0 ? (
                        <span className="text-rose-400 font-bold">
                          🔻 -{wearPercent}% desgaste
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          🟢 100% Sin desgaste
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Costo Hora de Máquina Flexo */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Costo Hora Máquina:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {currency.symbol}{calib.hourlyRate || FLEXO_MACHINE_PRESETS.find(p => p.id === calib.id)?.standardHourlyRate || 95}/h
                    </span>
                  </div>
                </div>

                {/* Calibrador Rápido de Velocidad por Desgaste */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold">
                      Ajuste manual por desgaste mecánico:
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {calib.speedMetersPerMinute} m/min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={Math.max(20, Math.round(calib.nominalSpeedMetersPerMinute * 0.3))}
                      max={calib.nominalSpeedMetersPerMinute}
                      step="5"
                      value={calib.speedMetersPerMinute}
                      onChange={(e) => handleUpdateFlexoSpeed(calib.id, Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleUpdateFlexoSpeed(calib.id, Math.max(20, calib.speedMetersPerMinute - 10))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Reducir 10 m/min por desgaste"
                    >
                      -10 m/min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFlexoSpeed(calib.id, Math.max(20, calib.speedMetersPerMinute - 5))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Reducir 5 m/min por desgaste"
                    >
                      -5 m/min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFlexoSpeed(calib.id, Math.min(calib.nominalSpeedMetersPerMinute, calib.speedMetersPerMinute + 5))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Aumentar 5 m/min"
                    >
                      +5 m/min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetFlexoMachine(calib.id)}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/20"
                      title="Restablecer a velocidad nominal de fábrica"
                    >
                      Nominal ({calib.nominalSpeedMetersPerMinute})
                    </button>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyFlexoCalibration(calib)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Prensa Flexo Asignada</span>
                      </>
                    ) : (
                      <>
                        <Gauge className="w-4 h-4 text-amber-400" />
                        <span>Asignar Prensa al Trabajo</span>
                      </>
                    )}
                  </button>

                  {calib.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFlexoMachine(calib.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Eliminar máquina personalizada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulario de Carga Manual de Máquinas Flexo ("pestaña donde se pueda cargar en forma manual") */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Cargar Máquina Flexo en Forma Manual (Ajuste por Desgaste en el Tiempo)
              </h3>
              <p className="text-xs text-slate-400">
                Ingresa en forma manual cualquier máquina flexo de tu taller con sus 5 parámetros fundamentales y su velocidad real calibrada por desgaste.
              </p>
            </div>
          </div>

          {isFlexoSaved && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Máquina flexo guardada y asignada al trabajo!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCustomFlexo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Nombre de la Máquina */}
          <div className="sm:col-span-2">
            <label className="text-slate-300 font-semibold block mb-1.5">
              Nombre de la Máquina / Prensa Flexográfica:
            </label>
            <input
              type="text"
              value={flexoCustomName}
              onChange={(e) => setFlexoCustomName(e.target.value)}
              placeholder="Ej. Mark Andy 2200 8C / OMET iFlex 370"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* 1. Ancho Máximo de Bobina */}
          <div>
            <label className="text-emerald-400 font-bold block mb-1.5 flex items-center justify-between">
              <span>1. Ancho Máx. Bobina (mm):</span>
              <span className="text-[10px] text-slate-500">Ej. 350, 450</span>
            </label>
            <input
              type="number"
              min="100"
              max="2000"
              value={flexoMaxRollWidth}
              onChange={(e) => setFlexoMaxRollWidth(Number(e.target.value))}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          {/* 2. Ancho Mínimo de Bobina */}
          <div>
            <label className="text-emerald-400 font-bold block mb-1.5 flex items-center justify-between">
              <span>2. Ancho Mín. Bobina (mm):</span>
              <span className="text-[10px] text-slate-500">Ej. 120, 150</span>
            </label>
            <input
              type="number"
              min="50"
              max="1000"
              value={flexoMinRollWidth}
              onChange={(e) => setFlexoMinRollWidth(Number(e.target.value))}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          {/* 3. Merma Estándar en % */}
          <div>
            <label className="text-purple-300 font-bold block mb-1.5 flex items-center justify-between">
              <span>3. Merma Estándar en %:</span>
              <span className="text-[10px] text-slate-500">Ej. 4.0 - 5.5%</span>
            </label>
            <input
              type="number"
              min="0.5"
              max="25"
              step="0.1"
              value={flexoWastePercent}
              onChange={(e) => setFlexoWastePercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 font-mono text-purple-300 font-bold focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* 4. Merma en Metros Lineales */}
          <div>
            <label className="text-sky-300 font-bold block mb-1.5 flex items-center justify-between">
              <span>4. Merma Metros Lineales (ml):</span>
              <span className="text-[10px] text-slate-500">Arranque/Setup</span>
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={flexoSetupWasteMeters}
              onChange={(e) => setFlexoSetupWasteMeters(Number(e.target.value))}
              className="w-full bg-slate-950 border border-sky-500/40 rounded-xl px-3 py-2 font-mono text-sky-300 font-bold focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          {/* 5. Velocidad en Metros por Minuto (Velocidad Actual por Desgaste) */}
          <div>
            <label className="text-amber-400 font-black block mb-1.5 flex items-center justify-between">
              <span>5. Velocidad Actual (m/min):</span>
              <span className="text-[10px] text-amber-400 font-bold">Por desgaste</span>
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={flexoSpeedMpm}
              onChange={(e) => setFlexoSpeedMpm(Number(e.target.value))}
              className="w-full bg-slate-950 border-2 border-amber-500/60 rounded-xl px-3 py-2 font-mono text-amber-300 font-black focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Velocidad Nominal de Fábrica */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Velocidad Nominal Catálogo (m/min):</span>
              <span className="text-[10px] text-slate-500">De nueva</span>
            </label>
            <input
              type="number"
              min="20"
              max="500"
              value={flexoNominalSpeedMpm}
              onChange={(e) => setFlexoNominalSpeedMpm(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Costo Hora Máquina */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Costo Hora Máquina ({currency.symbol}/h):
            </label>
            <input
              type="number"
              min="1"
              value={flexoHourlyRate}
              onChange={(e) => setFlexoHourlyRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Minutos Puesta en Marcha */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Montaje & Puesta a Punto (min):
            </label>
            <input
              type="number"
              min="5"
              value={flexoSetupMinutes}
              onChange={(e) => setFlexoSetupMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Observaciones sobre Desgaste y Rodillos */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-slate-300 font-semibold block mb-1.5">
              Observaciones de Desgaste Mecánico y Reducción de Velocidad con el Tiempo:
            </label>
            <textarea
              rows={2}
              value={flexoWearNotes}
              onChange={(e) => setFlexoWearNotes(e.target.value)}
              placeholder="Detallar causa de reducción: desgaste en tracción, rodamientos, tensión de bobina, lámparas UV..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Indicador de Desgaste Calculado en Tiempo Real */}
          <div className="sm:col-span-2 lg:col-span-4 bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block font-sans">
                Comparativa de Desgaste al Paso del Tiempo:
              </span>
              <span className="text-slate-200">
                Nominal Fábrica: <strong>{flexoNominalSpeedMpm} m/min</strong> ➔ Operativa Real:{' '}
                <strong className="text-amber-400">{flexoSpeedMpm} m/min</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-sans">Pérdida por Desgaste:</span>
              <span
                className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                  flexoSpeedMpm < flexoNominalSpeedMpm
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {flexoSpeedMpm < flexoNominalSpeedMpm
                  ? `-${Math.round(
                      ((flexoNominalSpeedMpm - flexoSpeedMpm) /
                        Math.max(1, flexoNominalSpeedMpm)) *
                        100
                    )}% de velocidad`
                  : 'Sin pérdida (100% nominal)'}
              </span>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Guardar Prensa Flexo y Asignar al Presupuesto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* Modal Catálogo Pantone Especial */}
      <PantonePickerModal
        isOpen={isSpecialPantoneModalOpen}
        onClose={() => setIsSpecialPantoneModalOpen(false)}
        onSelectPantone={handleAddPantone}
        currentColorsCount={activeInksList.length}
        maxColors={8}
        technologyLabel={
          specialInkTarget === 'flexo'
            ? 'Flexografía Nilpeter / ETIRAMA 350mm'
            : 'Offset Heidelberg Speedmaster 8C'
        }
      />
    </div>
  );
};

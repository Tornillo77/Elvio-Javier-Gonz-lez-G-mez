import React, { useState, useEffect, useRef } from 'react';
import { FlexoWindingDirection } from '../types/workOrder';
import {
  WindingDefinition,
  getWindingDefinitions,
  onWindingDefinitionsChange,
  setWindingImage,
  removeWindingImage,
  compressAndConvertImageFile,
} from '../utils/windingConfigService';
import {
  Edit3,
  CheckCircle2,
  Sliders,
  Layers,
  Upload,
  Camera,
  Trash2,
  Eye,
  Settings2,
  Printer,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
} from 'lucide-react';
import { WindingDirectionCustomizerModal } from './WindingDirectionCustomizerModal';

export interface WindingDirectionInfo {
  id: FlexoWindingDirection;
  title: string;
  category: 'Bobinado exterior' | 'Bobinado interior';
  exitName: string;
  shortDescription: string;
  color: string;
  bgLight?: string;
  imageUrl?: string;
}

/**
 * Hook para mantener sincronizadas las definiciones e imágenes personalizadas
 * en todos los componentes y re-renderizar reactivamente cuando cambian.
 */
export function useWindingDefinitions(): WindingDefinition[] {
  const [defs, setDefs] = useState<WindingDefinition[]>(() => getWindingDefinitions());

  useEffect(() => {
    setDefs(getWindingDefinitions());
    return onWindingDefinitionsChange((updated) => {
      setDefs(updated);
    });
  }, []);

  return defs;
}

/**
 * Catálogo técnico de Sentidos de Bobinado (1 al 8) de referencia inicial
 */
export const WINDING_DIRECTIONS: WindingDirectionInfo[] = [
  {
    id: 1,
    title: '1. Bobinado exterior - Salida izquierda',
    category: 'Bobinado exterior',
    exitName: 'Salida izquierda',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida izquierda',
    color: '#009688',
    bgLight: 'rgba(0, 150, 136, 0.1)',
  },
  {
    id: 2,
    title: '2. Bobinado exterior - Salida derecha',
    category: 'Bobinado exterior',
    exitName: 'Salida derecha',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida derecha',
    color: '#f4511e',
    bgLight: 'rgba(244, 81, 30, 0.1)',
  },
  {
    id: 3,
    title: '3. Bobinado exterior - Salida de pie',
    category: 'Bobinado exterior',
    exitName: 'Salida de pie',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida de pie',
    color: '#d81b60',
    bgLight: 'rgba(216, 27, 96, 0.1)',
  },
  {
    id: 4,
    title: '4. Bobinado exterior - Salida cabeza',
    category: 'Bobinado exterior',
    exitName: 'Salida cabeza',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida cabeza',
    color: '#8bc34a',
    bgLight: 'rgba(139, 195, 74, 0.1)',
  },
  {
    id: 5,
    title: '5. Bobinado interior - Salida izquierda',
    category: 'Bobinado interior',
    exitName: 'Salida izquierda',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida izquierda',
    color: '#29b6f6',
    bgLight: 'rgba(41, 182, 246, 0.1)',
  },
  {
    id: 6,
    title: '6. Bobinado interior - Salida derecha',
    category: 'Bobinado interior',
    exitName: 'Salida derecha',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida derecha',
    color: '#8e24aa',
    bgLight: 'rgba(142, 36, 170, 0.1)',
  },
  {
    id: 7,
    title: '7. Bobinado interior - Salida de pie',
    category: 'Bobinado interior',
    exitName: 'Salida de pie',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida de pie',
    color: '#fbc02d',
    bgLight: 'rgba(251, 192, 45, 0.15)',
  },
  {
    id: 8,
    title: '8. Bobinado interior - Salida cabeza',
    category: 'Bobinado interior',
    exitName: 'Salida cabeza',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida cabeza',
    color: '#c62828',
    bgLight: 'rgba(198, 40, 40, 0.1)',
  },
];

interface WindingDirectionSvgProps {
  direction: FlexoWindingDirection | number;
  className?: string;
  width?: number | string;
  height?: number | string;
  customColor?: string;
  customImageUrl?: string;
  allowQuickUpload?: boolean;
  onOpenCustomizer?: () => void;
}

/**
 * Renderizador de Sentido de Bobinado:
 * - Si el usuario subió una imagen para esta posición (o se le pasa customImageUrl), muestra la imagen real.
 * - Si NO tiene imagen, muestra un indicador esquemático técnico limpio (flecha de salida + orientación + badge)
 *   SIN dibujos conflictivos de cilindros, permitiendo subir imagen propia con un solo clic.
 */
export const WindingDirectionSvg: React.FC<WindingDirectionSvgProps> = ({
  direction,
  className = 'w-full h-auto',
  customColor,
  customImageUrl,
  allowQuickUpload = false,
  onOpenCustomizer,
}) => {
  const dirNum = Math.max(1, Math.min(8, Number(direction) || 1));
  const defs = useWindingDefinitions();
  const def = defs.find((d) => d.id === dirNum) || WINDING_DIRECTIONS[dirNum - 1];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeImage = customImageUrl || def?.imageUrl;
  const isExterior = dirNum >= 1 && dirNum <= 4;
  const badgeColor = customColor || def?.color || '#009688';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndConvertImageFile(file, 600);
        setWindingImage(dirNum, compressed);
      } catch (err) {
        console.error('Error al subir imagen de bobinado:', err);
      }
      e.target.value = '';
    }
  };

  // Si tiene imagen subida por el usuario:
  if (activeImage) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden group select-none ${className}`}>
        <img
          src={activeImage}
          alt={def?.title || `Sentido ${dirNum}`}
          className="max-h-full max-w-full object-contain rounded"
        />
        {allowQuickUpload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenCustomizer) {
                onOpenCustomizer();
              } else {
                fileInputRef.current?.click();
              }
            }}
            title="Cambiar imagen de este sentido"
            className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cambiar</span>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Si NO tiene imagen propia, mostramos un indicador esquemático no conflictivo
  // con la dirección de salida y la opción clara de subir imagen
  const getExitArrow = (id: number) => {
    switch (id) {
      case 1:
      case 5:
        return <ArrowLeft className="w-4 h-4" />;
      case 2:
      case 6:
        return <ArrowRight className="w-4 h-4" />;
      case 3:
      case 7:
        return <ArrowDown className="w-4 h-4" />;
      case 4:
      case 8:
        return <ArrowUp className="w-4 h-4" />;
      default:
        return <ArrowLeft className="w-4 h-4" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (allowQuickUpload) {
          e.stopPropagation();
          if (onOpenCustomizer) {
            onOpenCustomizer();
          } else {
            fileInputRef.current?.click();
          }
        }
      }}
      className={`flex flex-col items-center justify-center text-center p-1 relative rounded border border-dashed transition-all select-none ${
        allowQuickUpload
          ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-500/10 border-slate-700/60'
          : 'border-slate-800/40'
      } ${className}`}
      title={allowQuickUpload ? `Haz clic para subir imagen propia del Sentido #${dirNum}` : def?.title}
    >
      <div className="flex items-center gap-1 text-slate-200">
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black font-mono text-white shrink-0 shadow-xs"
          style={{ backgroundColor: badgeColor }}
        >
          {dirNum}
        </span>
        <div className="text-amber-400">{getExitArrow(dirNum)}</div>
      </div>

      <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-300 leading-none">
        {isExterior ? 'Ext' : 'Int'} • {def?.exitName?.replace('Salida ', '') || ''}
      </div>

      {allowQuickUpload && (
        <span className="text-[7px] text-amber-300/90 font-medium flex items-center gap-0.5 mt-0.5">
          <Camera className="w-2.5 h-2.5" />
          <span>+ Foto</span>
        </span>
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

interface WindingDirectionFullChartProps {
  selectedDirection?: FlexoWindingDirection | number;
  manualText?: string;
  onSelectDirection?: (dir: WindingDirectionInfo) => void;
  onManualTextChange?: (text: string) => void;
  className?: string;
  compact?: boolean;
}

/**
 * Plantilla Técnica Oficial de Sentidos de Bobinado (1 al 8)
 * - Permite a cada usuario definir sus 8 posiciones y colocar las imágenes en cada casilla de la plantilla.
 * - Sin dibujos confusos ni conflictivos: cada plantilla muestra las fotos/planos exactos de la bobinadora del taller.
 */
export const WindingDirectionFullChart: React.FC<WindingDirectionFullChartProps> = ({
  selectedDirection = 1,
  manualText = '',
  onSelectDirection,
  onManualTextChange,
  className = '',
  compact = false,
}) => {
  const definitions = useWindingDefinitions();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const currentId = Math.max(1, Math.min(8, Number(selectedDirection) || 1));
  const isManualActive = Boolean(manualText && manualText.trim().toLowerCase().startsWith('indicación manual'));

  const handleFileUpload = async (id: number, file: File) => {
    try {
      const compressed = await compressAndConvertImageFile(file, 700);
      setWindingImage(id, compressed);
    } catch (err: any) {
      alert(err?.message || 'Error al procesar la imagen.');
    }
  };

  const handleRemoveImage = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Deseas quitar la imagen personalizada del Sentido #${id}?`)) {
      removeWindingImage(id);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden text-slate-900 select-none ${className}`}
    >
      {/* Banner Superior con Botón de Personalización y Definición */}
      <div className="bg-slate-950 text-white px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-wider uppercase font-serif text-amber-300">
              PLANTILLA DE SENTIDOS DE BOBINADO (1 AL 8)
            </h3>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Cada usuario define los 8 sentidos y coloca las imágenes exactas de su taller en la plantilla
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            title="Abrir panel para definir nombres y subir fotos de cada bobina"
          >
            <Settings2 className="w-4 h-4" />
            <span>Definir Sentidos / Subir Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Imprimir esta plantilla técnica para el taller"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50">
        {/* ======================================================== */}
        {/* SECCIÓN 1: BOBINADO EXTERIOR (Posiciones 1 al 4)         */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-sky-600 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-900">
                Bobinado Exterior • Posiciones 1 al 4 (Papel hacia la cara exterior)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              4 Casillas de Plantilla
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {definitions.slice(0, 4).map((item) => {
              const isSelected = !isManualActive && currentId === item.id;
              const hasImage = Boolean(item.imageUrl);

              return (
                <div
                  key={item.id}
                  onClick={() =>
                    onSelectDirection?.({
                      id: item.id as FlexoWindingDirection,
                      title: item.title,
                      category: item.category,
                      exitName: item.exitName,
                      shortDescription: item.shortDescription,
                      color: item.color,
                      imageUrl: item.imageUrl,
                    })
                  }
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative group ${
                    isSelected
                      ? 'border-slate-950 bg-white ring-4 ring-amber-400 shadow-xl scale-[1.01]'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  {/* Badge de Selección Activa */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Activo</span>
                    </div>
                  )}

                  {/* Espacio para la Imagen de la Plantilla */}
                  <div
                    className={`w-full ${
                      compact ? 'h-28' : 'h-36'
                    } rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all ${
                      hasImage
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-sky-300 bg-sky-50/50 hover:bg-sky-100/60'
                    }`}
                  >
                    {hasImage ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        {/* Overlay con acciones */}
                        <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ title: item.title, url: item.imageUrl! });
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-sky-300 hover:bg-slate-700"
                            title="Ver imagen completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRefs.current[item.id]?.click();
                            }}
                            className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                            title="Cambiar foto de esta bobina"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(item.id, e)}
                            className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                            title="Quitar foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[item.id]?.click();
                        }}
                        className="w-full h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer"
                        title="Haz clic para subir la imagen de tu bobina"
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-600/10 text-sky-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-sky-900 leading-tight">
                          Subir Foto de Bobina
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Click para colocar en plantilla)
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[item.id] = el;
                      }}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(item.id, file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Datos del Sentido */}
                  <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-start gap-2">
                    <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                      {item.id}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                          {item.exitName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {item.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 2: BOBINADO INTERIOR (Posiciones 5 al 8)         */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-purple-700 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-900">
                Bobinado Interior • Posiciones 5 al 8 (Papel hacia la cara interna)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              4 Casillas de Plantilla
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {definitions.slice(4, 8).map((item) => {
              const isSelected = !isManualActive && currentId === item.id;
              const hasImage = Boolean(item.imageUrl);

              return (
                <div
                  key={item.id}
                  onClick={() =>
                    onSelectDirection?.({
                      id: item.id as FlexoWindingDirection,
                      title: item.title,
                      category: item.category,
                      exitName: item.exitName,
                      shortDescription: item.shortDescription,
                      color: item.color,
                      imageUrl: item.imageUrl,
                    })
                  }
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative group ${
                    isSelected
                      ? 'border-slate-950 bg-white ring-4 ring-amber-400 shadow-xl scale-[1.01]'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Activo</span>
                    </div>
                  )}

                  <div
                    className={`w-full ${
                      compact ? 'h-28' : 'h-36'
                    } rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all ${
                      hasImage
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-purple-300 bg-purple-50/50 hover:bg-purple-100/60'
                    }`}
                  >
                    {hasImage ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ title: item.title, url: item.imageUrl! });
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-purple-300 hover:bg-slate-700"
                            title="Ver imagen completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRefs.current[item.id]?.click();
                            }}
                            className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                            title="Cambiar foto de esta bobina"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(item.id, e)}
                            className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                            title="Quitar foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[item.id]?.click();
                        }}
                        className="w-full h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer"
                        title="Haz clic para subir la imagen de tu bobina"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-purple-900 leading-tight">
                          Subir Foto de Bobina
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Click para colocar en plantilla)
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[item.id] = el;
                      }}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(item.id, file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-start gap-2">
                    <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                      {item.id}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                          {item.exitName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {item.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 3: INDICACIÓN MANUAL / LIBRE                     */}
        {/* ======================================================== */}
        <div className="bg-amber-50/80 rounded-2xl border-2 border-amber-300 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Indicación Manual de Sentido de Bobinado
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                const defaultText = `Indicación Manual: Sentido especial según máquina etiquetadora del cliente (Buje 3", salida a requerimiento)`;
                onManualTextChange?.(defaultText);
              }}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline self-start sm:self-auto cursor-pointer"
            >
              Cargar texto predeterminado de indicación manual
            </button>
          </div>

          <p className="text-[11px] text-amber-900 leading-relaxed">
            Permite especificar requerimientos especiales cuando la envasadora del cliente requiera un ángulo no estándar, giro especial de bobina o doble sentido.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-600">
                <Edit3 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={manualText}
                onChange={(e) => onManualTextChange?.(e.target.value)}
                placeholder="Ej: Indicación Manual: Bobinado exterior especial con salida invertida para envasadora Krones"
                className="w-full bg-white border-2 border-amber-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-mono font-bold outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal para personalizar y definir los 8 sentidos */}
      <WindingDirectionCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

      {/* Lightbox para previsualizar foto en grande */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-xl w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center">
            <h4 className="text-sm font-bold text-white mb-3">{previewImage.title}</h4>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[70vh] max-w-full mx-auto object-contain rounded-xl bg-white p-2"
            />
            <p className="text-[11px] text-slate-400 mt-3">Haz clic en cualquier parte para cerrar</p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  WindingDefinition,
  getWindingDefinitions,
  updateWindingDefinition,
  setWindingImage,
  removeWindingImage,
  resetWindingDefinitions,
  compressAndConvertImageFile,
  onWindingDefinitionsChange,
} from '../utils/windingConfigService';
import {
  X,
  Upload,
  Trash2,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Edit2,
  Layers,
  Sparkles,
  Cloud,
  Eye,
  Sliders,
} from 'lucide-react';

interface WindingDirectionCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const WindingDirectionCustomizerModal: React.FC<WindingDirectionCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [definitions, setDefinitions] = useState<WindingDefinition[]>(() => getWindingDefinitions());
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      setDefinitions(getWindingDefinitions());
    }
    return onWindingDefinitionsChange((updated) => {
      setDefinitions(updated);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFileUpload = async (id: number, file: File) => {
    try {
      setLoadingId(id);
      const compressedDataUrl = await compressAndConvertImageFile(file, 600);
      const updated = setWindingImage(id, compressedDataUrl);
      setDefinitions(updated);
      setLoadingId(null);
      showNotice(`¡Imagen actualizada con éxito para el Sentido #${id}!`);
      onSaved?.();
    } catch (err: any) {
      setLoadingId(null);
      alert(err?.message || 'Error al procesar la imagen.');
    }
  };

  const handleRemoveImage = (id: number) => {
    if (window.confirm(`¿Deseas quitar la imagen personalizada del Sentido #${id}?`)) {
      const updated = removeWindingImage(id);
      setDefinitions(updated);
      showNotice(`Imagen eliminada del Sentido #${id}.`);
      onSaved?.();
    }
  };

  const handleTextChange = (id: number, field: 'title' | 'exitName' | 'shortDescription', value: string) => {
    const updated = updateWindingDefinition(id, { [field]: value });
    setDefinitions(updated);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        '¿Deseas restablecer las 8 posiciones a los nombres predeterminados de fábrica? Las imágenes subidas también se restablecerán.'
      )
    ) {
      const reset = resetWindingDefinitions();
      setDefinitions(reset);
      showNotice('Sentidos de bobinado restablecidos a valores iniciales.');
      onSaved?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Personalizar Sentidos de Bobinado (1 al 8)</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Imágenes Propias
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sube las fotos o diagramas exactos de tu imprenta para que se muestren en la plantilla técnica y en cada Orden de Trabajo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <Cloud className="w-3.5 h-3.5" />
              <span>Sincronizado en Nube</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificación flotante de confirmación */}
        {notification && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Instrucciones Rápidas */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Haz clic en <strong>"Subir Imagen"</strong> en cualquiera de las 8 posiciones para colocar el dibujo o foto real de tu bobinadora. Las imágenes se guardan automáticamente para todas las computadoras.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Restablecer nombres e imágenes predeterminadas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer Fábrica</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN 1: BOBINADO EXTERIOR (Posiciones 1, 2, 3, 4)     */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-sky-500/30 pb-2">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-sky-400">
                Bobinado Exterior • Posiciones 1 al 4
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                (Etiquetas hacia la cara exterior del rollo)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {definitions.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all shadow-md group"
                >
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center text-xs font-black font-mono">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate flex-1 ml-2">
                      {item.exitName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      className="text-slate-500 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Editar nombre y notas técnicas"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Zona de Imagen o Dropzone */}
                  <div className="w-full h-36 bg-slate-900/90 rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-slate-700 transition-all p-2">
                    {item.imageUrl ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        {/* Overlay de acciones sobre la imagen */}
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg backdrop-blur-xs">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ title: item.title, url: item.imageUrl! })}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 shadow-md transition-transform active:scale-90"
                            title="Ver en grande"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-transform active:scale-90"
                            title="Cambiar imagen"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-transform active:scale-90"
                            title="Quitar imagen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        className="cursor-pointer text-center p-3 w-full h-full flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800/40 rounded-lg transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-sky-300">
                          {loadingId === item.id ? 'Subiendo...' : 'Subir Imagen'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PNG, JPG o SVG
                        </span>
                      </div>
                    )}

                    {/* Input file oculto */}
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

                  {/* Edición de texto expandible */}
                  {editingId === item.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Nombre de Salida:
                        </label>
                        <input
                          type="text"
                          value={item.exitName}
                          onChange={(e) => handleTextChange(item.id, 'exitName', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Descripción Técnica:
                        </label>
                        <input
                          type="text"
                          value={item.shortDescription}
                          onChange={(e) => handleTextChange(item.id, 'shortDescription', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-[11px] font-bold text-amber-400 hover:underline"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.imageUrl ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Imagen propia activa
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Sin imagen asignada</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN 2: BOBINADO INTERIOR (Posiciones 5, 6, 7, 8)     */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-purple-500/30 pb-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-400">
                Bobinado Interior • Posiciones 5 al 8
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">
                (Etiquetas hacia la cara interna del rollo)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {definitions.slice(4, 8).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-black font-mono">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate flex-1 ml-2">
                      {item.exitName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      className="text-slate-500 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Editar nombre y notas técnicas"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-full h-36 bg-slate-900/90 rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-slate-700 transition-all p-2">
                    {item.imageUrl ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg backdrop-blur-xs">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ title: item.title, url: item.imageUrl! })}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 shadow-md transition-transform active:scale-90"
                            title="Ver en grande"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-transform active:scale-90"
                            title="Cambiar imagen"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-transform active:scale-90"
                            title="Quitar imagen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        className="cursor-pointer text-center p-3 w-full h-full flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800/40 rounded-lg transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-purple-300">
                          {loadingId === item.id ? 'Subiendo...' : 'Subir Imagen'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PNG, JPG o SVG
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

                  {editingId === item.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Nombre de Salida:
                        </label>
                        <input
                          type="text"
                          value={item.exitName}
                          onChange={(e) => handleTextChange(item.id, 'exitName', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Descripción Técnica:
                        </label>
                        <input
                          type="text"
                          value={item.shortDescription}
                          onChange={(e) => handleTextChange(item.id, 'shortDescription', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-[11px] font-bold text-amber-400 hover:underline"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.imageUrl ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Imagen propia activa
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Sin imagen asignada</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal con Botón Listo */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Los cambios e imágenes se aplican al instante en el cotizador y en las Órdenes de Trabajo.</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onSaved?.();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Listo, Guardar y Aplicar</span>
          </button>
        </div>
      </div>

      {/* Modal Lightbox de Vista Previa en Grande */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center animate-fadeIn cursor-zoom-out"
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

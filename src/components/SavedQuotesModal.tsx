import React, { useState, useEffect } from 'react';
import {
  CurrencyConfig,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
} from '../types/graphic';
import {
  X,
  Trash2,
  Download,
  Upload,
  FolderOpen,
  Save,
  Check,
  Cloud,
  Loader2,
  RefreshCw,
  Copy,
  Edit2,
  Hash,
  ArrowRight,
  FileText,
} from 'lucide-react';
import {
  auth,
  saveQuoteToFirestore,
  fetchUserQuotesFromFirestore,
  deleteQuoteFromFirestore,
} from '../utils/firebase';
import { getNextQuoteNumber } from '../utils/correlativeService';

export interface SavedProject {
  id: string;
  savedAt: string;
  updatedAt?: string;
  name: string;
  client: string;
  quoteNumber?: string;
  technology: PrintTechnology;
  offsetParams?: OffsetJobParams;
  flexoParams?: FlexoJobParams;
  finalPrice: number;
  userId?: string;
}

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTech: PrintTechnology;
  currentOffsetParams: OffsetJobParams;
  currentFlexoParams: FlexoJobParams;
  currentBreakdown: QuoteBreakdown;
  onLoadProject: (project: SavedProject) => void;
  currency: CurrencyConfig;
  currentUserId?: string;
  currentlyLoadedProjectId?: string | null;
  onClearLoadedProject?: () => void;
  onOpenCorrelatives?: () => void;
}

const STORAGE_KEY = 'aravo_saved_projects_v1';

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
  currentTech,
  currentOffsetParams,
  currentFlexoParams,
  currentBreakdown,
  onLoadProject,
  currency,
  currentUserId,
  currentlyLoadedProjectId,
  onClearLoadedProject,
  onOpenCorrelatives,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('¡Guardado!');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const isCloudAuth = !!auth.currentUser;
  const activeUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!isOpen) return;

    let localList: SavedProject[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    setProjects(localList);

    // If currently loaded project, prepopulate name
    if (currentlyLoadedProjectId) {
      const matched = localList.find((p) => p.id === currentlyLoadedProjectId);
      if (matched) {
        setSaveName(matched.name);
      }
    }

    // Sync from cloud
    if (isCloudAuth && activeUid) {
      setIsCloudSyncing(true);
      fetchUserQuotesFromFirestore(activeUid)
        .then((cloudQuotes) => {
          if (cloudQuotes && cloudQuotes.length > 0) {
            const map = new Map<string, SavedProject>();
            localList.forEach((q) => map.set(q.id, q));
            cloudQuotes.forEach((q) => map.set(q.id, q));
            const merged = Array.from(map.values());
            setProjects(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
          setIsCloudEnabled(true);
        })
        .catch((err) => {
          console.warn('Could not fetch cloud quotes:', err);
        })
        .finally(() => {
          setIsCloudSyncing(false);
        });
    } else {
      setIsCloudEnabled(false);
      setIsCloudSyncing(false);
    }
  }, [isOpen, isCloudAuth, activeUid, currentlyLoadedProjectId]);

  if (!isOpen) return null;

  const currentQuoteNum =
    (currentTech === 'offset' ? currentOffsetParams.quoteNumber : currentFlexoParams.quoteNumber) ||
    getNextQuoteNumber();

  // Save new quote copy
  const handleSaveAsNew = async () => {
    const jobName = currentTech === 'offset' ? currentOffsetParams.jobName : currentFlexoParams.jobName;
    const clientName = currentTech === 'offset' ? currentOffsetParams.clientName : currentFlexoParams.clientName;
    const nowStr = new Date().toLocaleString();

    const newProject: SavedProject = {
      id: `proj_${Date.now()}`,
      savedAt: nowStr,
      updatedAt: nowStr,
      name: saveName.trim() || jobName || 'Presupuesto Aravo',
      client: clientName || 'Sin Cliente',
      quoteNumber: currentQuoteNum,
      technology: currentTech,
      offsetParams: currentTech === 'offset' ? { ...currentOffsetParams, quoteNumber: currentQuoteNum } : undefined,
      flexoParams: currentTech === 'flexo' ? { ...currentFlexoParams, quoteNumber: currentQuoteNum } : undefined,
      finalPrice: currentBreakdown.finalTotalPrice,
      userId: activeUid,
    };

    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (activeUid) {
      try {
        await saveQuoteToFirestore(activeUid, newProject);
      } catch (err) {
        console.warn('Error saving to cloud firestore:', err);
      }
    }

    setNoticeMessage('¡Guardado como nuevo presupuesto!');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  // Update existing quote
  const handleUpdateExisting = async () => {
    if (!currentlyLoadedProjectId) return;

    const jobName = currentTech === 'offset' ? currentOffsetParams.jobName : currentFlexoParams.jobName;
    const clientName = currentTech === 'offset' ? currentOffsetParams.clientName : currentFlexoParams.clientName;
    const nowStr = new Date().toLocaleString();

    const existing = projects.find((p) => p.id === currentlyLoadedProjectId);
    if (!existing) {
      handleSaveAsNew();
      return;
    }

    const updatedProject: SavedProject = {
      ...existing,
      updatedAt: nowStr,
      name: saveName.trim() || existing.name,
      client: clientName || existing.client,
      quoteNumber: currentQuoteNum,
      technology: currentTech,
      offsetParams: currentTech === 'offset' ? { ...currentOffsetParams, quoteNumber: currentQuoteNum } : undefined,
      flexoParams: currentTech === 'flexo' ? { ...currentFlexoParams, quoteNumber: currentQuoteNum } : undefined,
      finalPrice: currentBreakdown.finalTotalPrice,
      userId: activeUid || existing.userId,
    };

    const updated = projects.map((p) => (p.id === currentlyLoadedProjectId ? updatedProject : p));
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (activeUid) {
      try {
        await saveQuoteToFirestore(activeUid, updatedProject);
      } catch (err) {
        console.warn('Error updating quote in Firestore:', err);
      }
    }

    setNoticeMessage('¡Presupuesto actualizado correctamente!');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto guardado?')) return;
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (currentlyLoadedProjectId === id) {
      onClearLoadedProject?.();
    }

    if (activeUid) {
      try {
        await deleteQuoteFromFirestore(activeUid, id);
      } catch (err) {
        console.warn('Error deleting quote in cloud:', err);
      }
    }
  };

  const handleDuplicate = async (proj: SavedProject) => {
    const duplicated: SavedProject = {
      ...proj,
      id: `proj_${Date.now()}`,
      name: `${proj.name} (Copia)`,
      savedAt: new Date().toLocaleString(),
    };
    const updated = [duplicated, ...projects];
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (activeUid) {
      try {
        await saveQuoteToFirestore(activeUid, duplicated);
      } catch (err) {
        console.warn('Error duplicating in cloud:', err);
      }
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!renameValue.trim()) return;
    const updated = projects.map((p) => (p.id === id ? { ...p, name: renameValue.trim() } : p));
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const item = updated.find((p) => p.id === id);
    if (item && activeUid) {
      try {
        await saveQuoteToFirestore(activeUid, item);
      } catch (err) {
        console.warn('Error renaming in cloud:', err);
      }
    }
    setEditingProjectId(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `aravo_presupuestos_${Date.now()}.json`);
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setProjects(imported);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        }
      } catch (err) {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  const activeEditingProject = projects.find((p) => p.id === currentlyLoadedProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2 uppercase tracking-tight">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <span>Gestión de Presupuestos Guardados</span>
              </h3>
              {activeUid ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  {isCloudSyncing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Sincronizando Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      <span>Firestore Sync Activo</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Almacenamiento Local
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cargue, modifique, actualice y preserve cotizaciones históricas de clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCorrelatives && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCorrelatives();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                title="Configurar numeración correlativa inicial"
              >
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Correlativo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Currently Loaded Indicator Banner */}
        {activeEditingProject && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                Editando presupuesto: <strong>{activeEditingProject.name}</strong> ({activeEditingProject.client})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onClearLoadedProject?.()}
              className="text-[11px] underline text-amber-400 hover:text-amber-200 ml-2 shrink-0"
            >
              Liberar modo edición
            </button>
          </div>
        )}

        {/* Save & Update Actions Box */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Nombre para guardar este presupuesto..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {currentlyLoadedProjectId && (
              <button
                type="button"
                onClick={handleUpdateExisting}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Sobrescribir y guardar los cambios sobre el presupuesto actualmente abierto"
              >
                <Save className="w-4 h-4" />
                <span>Actualizar Existente</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAsNew}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Guardar como una nueva cotización independiente"
            >
              <Save className="w-4 h-4" />
              <span>{currentlyLoadedProjectId ? 'Guardar como Nuevo' : 'Guardar Presupuesto'}</span>
            </button>
          </div>
        </div>

        {/* Notice Message Feedback */}
        {isSavedNotice && (
          <div className="mx-5 my-2 p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Projects List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
          {projects.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-2 opacity-50" />
              No tienes presupuestos guardados aún. Guarda tu trabajo actual para consultarlo luego o modificarlo.
            </div>
          ) : (
            projects.map((proj) => {
              const isLoaded = currentlyLoadedProjectId === proj.id;
              const isEditingThis = editingProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`bg-slate-950/80 border p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-700 ${
                    isLoaded ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100 rounded-lg outline-none font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(proj.id)}
                            className="p-1 bg-amber-500 text-slate-950 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProjectId(null)}
                            className="p-1 bg-slate-800 text-slate-400 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjectId(proj.id);
                              setRenameValue(proj.name);
                            }}
                            className="text-slate-500 hover:text-amber-400"
                            title="Renombrar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {proj.quoteNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {proj.quoteNumber}
                        </span>
                      )}

                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          proj.technology === 'offset'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {proj.technology}
                      </span>

                      {isLoaded && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          En Edición Activa
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Cliente: <strong className="text-slate-300">{proj.client}</strong> • Guardado: {proj.savedAt}
                      {proj.updatedAt && proj.updatedAt !== proj.savedAt && (
                        <span className="text-slate-500 italic"> (Actualizado: {proj.updatedAt})</span>
                      )}
                    </div>

                    {(proj.offsetParams?.productDescription || proj.flexoParams?.productDescription) && (
                      <div className="text-[10px] text-slate-400 italic line-clamp-1">
                        {proj.offsetParams?.productDescription || proj.flexoParams?.productDescription}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <div className="text-right mr-1">
                      <span className="text-sm font-mono font-black text-amber-300">
                        {currency.symbol}{proj.finalPrice.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Cargar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(proj)}
                      className="p-1.5 text-slate-500 hover:text-sky-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Duplicar presupuesto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions: Export / Import JSON */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={projects.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            {projects.length} {projects.length === 1 ? 'presupuesto' : 'presupuestos'}
          </span>
        </div>
      </div>
    </div>
  );
};

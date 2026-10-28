import React, { useState } from 'react';
import {
  CurrencyCode,
  CURRENCIES,
  PrintTechnology,
} from '../types/graphic';
import { UserAccount, ROLE_DEFINITIONS } from '../types/user';
import { checkUserSubscription } from '../utils/subscriptionUtils';
import { JOB_PRESETS } from '../utils/presets';
import { AravoIcon } from './AravoLogo';
import {
  Clock,
  Layers,
  Disc,
  Sparkles,
  Bookmark,
  Scale,
  RefreshCw,
  Edit2,
  Check,
  X,
  Users,
  LogOut,
  User as UserIcon,
  Zap,
  ShieldCheck,
  Building2,
  Share2,
  Hash,
  Factory,
} from 'lucide-react';

interface HeaderProps {
  appName: string;
  onUpdateAppName: (name: string) => void;
  appSubtitle: string;
  onUpdateAppSubtitle: (subtitle: string) => void;
  technology: PrintTechnology;
  onSelectTechnology?: (tech: PrintTechnology) => void;
  currencyCode: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  onSelectPreset: (presetId: string) => void;
  onOpenPresetsModal?: () => void;
  onOpenSheetCompare?: () => void;
  onOpenSavedModal: () => void;
  onOpenSavedWorkOrders?: () => void;
  onOpenCorrelatives?: () => void;
  onReset: () => void;
  currentUser?: UserAccount | null;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  onUpdateAppName,
  appSubtitle,
  onUpdateAppSubtitle,
  technology,
  onSelectTechnology,
  currencyCode,
  onSelectCurrency,
  onSelectPreset,
  onOpenPresetsModal,
  onOpenSheetCompare,
  onOpenSavedModal,
  onOpenSavedWorkOrders,
  onOpenCorrelatives,
  onReset,
  currentUser,
  onOpenUserManagement,
  onLogout,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);
  const [tempSub, setTempSub] = useState(appSubtitle);
  const [shareFeedback, setShareFeedback] = useState(false);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateAppName(tempName.trim());
    }
    if (tempSub.trim()) {
      onUpdateAppSubtitle(tempSub.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand identity - Clickable to edit */}
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 p-1 rounded-xl bg-slate-900 border border-sky-500/30 shadow-lg shadow-sky-500/10 hover:border-sky-400 hover:shadow-sky-500/20 transition-all cursor-pointer group"
            onClick={() => {
              setTempName(appName);
              setTempSub(appSubtitle);
              setIsEditingName(true);
            }}
            title="Haz clic para personalizar el nombre del sistema"
          >
            <AravoIcon size={34} glow={true} />
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-sky-500/50">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Nombre de la app/empresa..."
                  className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold px-2 py-1 rounded outline-none font-sans uppercase tracking-wider"
                  autoFocus
                />
                <input
                  type="text"
                  value={tempSub}
                  onChange={(e) => setTempSub(e.target.value)}
                  placeholder="Subtítulo o descripción..."
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors"
                title="Guardar nombre"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempName(appName);
                  setTempSub(appSubtitle);
                  setIsEditingName(false);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setTempName(appName);
                setTempSub(appSubtitle);
                setIsEditingName(true);
              }}
              className="cursor-pointer group flex flex-col"
              title="Haz clic para cambiar el nombre o membrete"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-[0.14em] text-white uppercase font-sans group-hover:text-sky-300 transition-colors drop-shadow-sm">
                  {appName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Estimador Pro
                </span>
                <Edit2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                {appSubtitle}
              </p>
            </div>
          )}
        </div>

        {/* Center: Dedicated Flexo Brand Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 self-start md:self-auto shadow-sm">
          <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span>Flexografía (Bobina)</span>
          <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            Banda Angosta & Tambor
          </span>
        </div>

        {/* Right Action Tools: Presets, Currency, Saved */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visual Presets Modal Trigger */}
          {onOpenPresetsModal && (
            <button
              type="button"
              onClick={onOpenPresetsModal}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/5 group"
              title="Abrir catálogo completo de plantillas rápidas de Flexografía"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Plantillas Flexo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                {JOB_PRESETS.length}
              </span>
            </button>
          )}

          {/* Presets Categorized Quick Selector */}
          <select
            onChange={(e) => {
              if (e.target.value) onSelectPreset(e.target.value);
            }}
            defaultValue=""
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-400 max-w-[190px] sm:max-w-[220px] truncate"
            title="Seleccionar plantilla rápida de flexografía"
          >
            <option value="" disabled>
              ⚙ Menú de Plantillas Flexo...
            </option>
            <optgroup label="🏷️ Etiquetas en Rollo">
              {JOB_PRESETS.filter((p) => p.category === 'flexo_labels').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="📦 Packaging Flexible & Mangas">
              {JOB_PRESETS.filter((p) => p.category === 'flexo_packaging').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🍷 Vinos, Licores & Especialidades">
              {JOB_PRESETS.filter((p) => p.category === 'flexo_specialties').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="✍️ Carga Manual">
              {JOB_PRESETS.filter((p) => p.category === 'manual').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Saved quotes modal trigger */}
          <button
            type="button"
            onClick={onOpenSavedModal}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Presupuestos guardados"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Presupuestos</span>
          </button>

          {/* Saved Work Orders trigger */}
          {onOpenSavedWorkOrders && (
            <button
              type="button"
              onClick={onOpenSavedWorkOrders}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Registro de Órdenes de Trabajo (OT) guardadas"
            >
              <Factory className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">OTs</span>
            </button>
          )}

          {/* Configuración de Numeración y Correlativos */}
          {onOpenCorrelatives && (
            <button
              type="button"
              onClick={onOpenCorrelatives}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Configurar numeración correlativa inicial para OTs y Presupuestos"
            >
              <Hash className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">Correlativos</span>
            </button>
          )}

          {/* Currency selector */}
          <select
            value={currencyCode}
            onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
            className="bg-slate-900 border border-slate-800 text-amber-300 font-bold text-xs rounded-xl px-2 py-1.5 outline-none focus:border-amber-400 font-mono"
            title="Seleccionar divisa de cotización"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Restablecer valores predeterminados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile & Session Controls */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {/* Cloud connection badge */}
              <div
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono"
                title="Firebase Auth & Firestore conectados en tiempo real"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Sync</span>
              </div>

              {/* Subscription Status or Admin Panel Trigger */}
              {(() => {
                const subInfo = checkUserSubscription(currentUser);
                const isSystemAdmin = currentUser.role === 'admin' || currentUser.isSystemAdmin;

                if (isSystemAdmin) {
                  return onOpenUserManagement ? (
                    <button
                      type="button"
                      onClick={onOpenUserManagement}
                      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm"
                      title="Abrir Panel de Administración de Imprentas y Suscripciones"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Panel Admin</span>
                    </button>
                  ) : null;
                }

                return (
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                      subInfo.isWarning
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    }`}
                    title={subInfo.message}
                  >
                    <Clock className={`w-3.5 h-3.5 ${subInfo.isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span>{subInfo.formattedExpiresAt}</span>
                  </div>
                );
              })()}

              {/* User badge */}
              <button
                type="button"
                onClick={() => {
                  if (currentUser.role === 'admin' || currentUser.isSystemAdmin) {
                    onOpenUserManagement?.();
                  }
                }}
                className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-left group transition-all ${
                  (currentUser.role === 'admin' || currentUser.isSystemAdmin)
                    ? 'hover:bg-slate-850 hover:border-amber-500/40 cursor-pointer'
                    : 'cursor-default'
                }`}
                title={
                  currentUser.role === 'admin' || currentUser.isSystemAdmin
                    ? 'Administrador: Clic para gestionar imprentas y suscripciones'
                    : `Imprenta: ${currentUser.companyName || currentUser.fullName}`
                }
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-xs font-bold text-slate-950 font-mono shadow-sm shrink-0`}
                >
                  {currentUser.companyName ? currentUser.companyName.charAt(0).toUpperCase() : currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors max-w-[110px] truncate">
                      {currentUser.companyName || currentUser.fullName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/90 leading-tight">
                    {ROLE_DEFINITIONS[currentUser.role]?.label.split(' ')[0] || 'Imprenta'}
                  </span>
                </div>
              </button>

              {/* Botón Gestión de Usuarios - SOLO PARA ADMINISTRADOR */}
              {(currentUser.role === 'admin' || currentUser.isSystemAdmin) && onOpenUserManagement && (
                <button
                  type="button"
                  onClick={onOpenUserManagement}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Panel de Control: Altas de Clientes y Suscripciones"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Botón Cerrar Sesión */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


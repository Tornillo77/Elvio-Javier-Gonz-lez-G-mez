import React, { useState } from 'react';
import { UserAccount } from '../types/user';
import {
  checkUserSubscription,
  getAdminContactConfig,
  getWhatsAppContactUrl,
  formatDateForDisplay,
} from '../utils/subscriptionUtils';
import { AravoLogo } from './AravoLogo';
import { createDirectSession } from '../utils/authService';
import {
  AlertTriangle,
  Lock,
  Clock,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  Building2,
  Calendar,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface SubscriptionExpiredScreenProps {
  user: UserAccount;
  onLogout: () => void;
  onRefreshUserStatus: () => void;
}

export const SubscriptionExpiredScreen: React.FC<SubscriptionExpiredScreenProps> = ({
  user,
  onLogout,
  onRefreshUserStatus,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkNotice, setCheckNotice] = useState<string | null>(null);

  const subInfo = checkUserSubscription(user);
  const adminContact = getAdminContactConfig();
  const whatsappUrl = getWhatsAppContactUrl(adminContact, user);

  const handleVerify = () => {
    setIsChecking(true);
    setCheckNotice(null);

    setTimeout(() => {
      onRefreshUserStatus();
      setIsChecking(false);
      setCheckNotice('Verificación completada. Si el administrador ya extendió su fecha, el acceso se reanudará.');
      setTimeout(() => setCheckNotice(null), 4000);
    }, 800);
  };

  const mailtoUrl = `mailto:${adminContact.email}?subject=${encodeURIComponent(
    `Renovación de Suscripción Aravo - ${user.companyName || user.fullName}`
  )}&body=${encodeURIComponent(
    `Estimado Administrador,\n\nSolicito la renovación de la suscripción mensual para la imprenta "${user.companyName || user.fullName}" (Usuario: ${user.username}).\n\nPor favor indíqueme los pasos de pago y confirmación.\n\nSaludos cordiales.`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <AravoLogo size="sm" showSubtitle={false} />
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Bloqueo de Seguridad
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col items-center text-center">
        {/* Animated Warning Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-950/50">
            <Lock className="w-10 h-10 animate-pulse text-rose-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Required Notification Banner */}
        <div className="w-full bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-5 sm:p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-xs uppercase font-bold tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Acceso Temporalmente Restringido</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">
            Su suscripción mensual ha expirado. Por favor, comuníquese con el administrador para renovar su acceso
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-xl mx-auto leading-relaxed">
            Las funciones de imposición de pliegos, cálculo de flexografía/offset y exportación de presupuestos están pausadas hasta la regularización de la suscripción mensual.
          </p>
        </div>

        {/* Imprenta & Expiration Details Card */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Imprenta / Cliente</span>
              <p className="text-sm font-bold text-slate-100">{user.companyName || user.fullName}</p>
              <p className="text-xs text-slate-400">Usuario: @{user.username}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Fecha de Vencimiento</span>
              <p className="text-sm font-bold text-rose-400">
                {formatDateForDisplay(user.subscriptionExpiresAt)}
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {subInfo.formattedExpiresAt}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Direct Contact */}
        <div className="w-full flex flex-col sm:flex-row items-stretch gap-3 mb-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Renovar por WhatsApp con Administrador</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
          </a>

          <a
            href={mailtoUrl}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Enviar Correo</span>
          </a>
        </div>

        {/* Verification & Secondary Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isChecking ? 'Verificando con servidor...' : 'Comprobar si ya fue renovado'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              createDirectSession('graficaed');
              onRefreshUserStatus();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-500/40 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Entrar con Gráfica ED (Producción Activa)</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar de Usuario</span>
          </button>
        </div>

        {checkNotice && (
          <p className="mt-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg animate-fadeIn">
            {checkNotice}
          </p>
        )}

        {/* Direct Contact Details Card */}
        <div className="mt-8 pt-6 border-t border-slate-900 w-full flex flex-col items-center">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Contacto Directo del Administrador
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <span className="font-bold text-slate-100">{adminContact.name}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              {adminContact.phone}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              {adminContact.email}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 text-center border-t border-slate-900">
        <p className="text-[11px] text-slate-400 font-mono">
          ARAVO Sistema Gráfico • Control de Acceso y Licenciamiento Mensual
        </p>
      </footer>
    </div>
  );
};

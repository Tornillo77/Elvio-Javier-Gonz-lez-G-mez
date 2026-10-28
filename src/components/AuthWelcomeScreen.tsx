import React, { useState, useEffect, useRef } from 'react';
import { AuthSession, UserAccount } from '../types/user';
import {
  authenticate,
  authenticateAsync,
  getUsers,
  syncWithCloudDatabase,
} from '../utils/authService';
import { getAdminContactConfig, getWhatsAppContactUrl } from '../utils/subscriptionUtils';
import { AravoLogo, AravoIcon } from './AravoLogo';
import {
  Clock,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Delete,
  Mail,
  HelpCircle,
  X,
  Send,
  CheckCircle2,
  Phone,
} from 'lucide-react';

interface AuthWelcomeScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  appName?: string;
  appSubtitle?: string;
}

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({
  onLoginSuccess,
  appName = 'ARAVO',
  appSubtitle = 'Aravo = Tiempo / Hora en Guaraní • Presupuestos Offset & Flexo',
}) => {
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('aravo_last_username') || '';
    } catch {
      return '';
    }
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(() => {
    try {
      return localStorage.getItem('aravo_remember_username') !== 'false';
    } catch {
      return true;
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-foco inteligente: si el usuario ya está recordado, situar el cursor directamente en el PIN
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim()) {
        pinInputRef.current?.focus();
      } else {
        usernameInputRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Modal para solicitar reenvío de PIN por correo
  const [isRequestPinOpen, setIsRequestPinOpen] = useState(false);
  const [requestUserInput, setRequestUserInput] = useState('');
  const [requestStatus, setRequestStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
    targetEmail?: string;
    mailtoUrl?: string;
  }>({ type: 'idle', message: '' });

  const adminContact = getAdminContactConfig();

  // Sincronizar usuarios desde la nube al cargar para que cualquier usuario dado de alta pueda iniciar sesión
  useEffect(() => {
    syncWithCloudDatabase().catch(() => {});
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.replace(/[@\s]/g, '').trim().toLowerCase();
    const cleanPin = pin.replace(/\s+/g, '').trim();

    if (!cleanUser) {
      setErrorMessage('Por favor ingrese su usuario asignado.');
      usernameInputRef.current?.focus();
      return;
    }
    if (!cleanPin) {
      setErrorMessage('Por favor ingrese el código PIN que le fue enviado por correo.');
      pinInputRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authenticateAsync(cleanUser, cleanPin, false);
      setIsLoading(false);

      if (!result.success || !result.session) {
        setErrorMessage(
          result.error || 'Credenciales inválidas. Verifique su usuario y el PIN recibido en su correo.'
        );
        return;
      }

      if (rememberUsername) {
        localStorage.setItem('aravo_last_username', cleanUser);
        localStorage.setItem('aravo_remember_username', 'true');
      } else {
        localStorage.removeItem('aravo_last_username');
        localStorage.setItem('aravo_remember_username', 'false');
      }

      onLoginSuccess(result.session);
    } catch {
      setIsLoading(false);
      setErrorMessage('Error al conectar con la base de usuarios. Intente nuevamente.');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPin('');
    } else {
      if (pin.length < 8) {
        setPin((prev) => prev + val);
      }
    }
  };

  const handleProcessPinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = requestUserInput.replace(/[@\s]/g, '').trim().toLowerCase();
    if (!clean) {
      setRequestStatus({
        type: 'error',
        message: 'Ingrese su nombre de usuario o correo para localizar su cuenta.',
      });
      return;
    }

    const allUsers = getUsers();
    const found = allUsers.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.contactEmail && u.contactEmail.toLowerCase() === requestUserInput.trim().toLowerCase())
    );

    const subject = encodeURIComponent(`Solicitud de PIN de Acceso ARAVO - Usuario: ${found ? found.username : clean}`);
    const body = encodeURIComponent(
      `Hola ${adminContact.name},\n\nSolicito el reenvío de mi código PIN de acceso para el sistema ARAVO.\n\n` +
      `👤 Usuario: ${found ? found.username : clean}\n` +
      `🏢 Empresa/Imprenta: ${found?.companyName || found?.fullName || 'No especificada'}\n` +
      `✉️ Correo de contacto: ${found?.contactEmail || requestUserInput}\n\n` +
      `Agradezco remitirme las credenciales correspondientes a la brevedad.\n\nSaludos cordiales.`
    );
    const mailto = `mailto:${adminContact.email}?subject=${subject}&body=${body}`;

    if (found) {
      const maskedEmail = found.contactEmail
        ? found.contactEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 5))}${c}`)
        : 'su correo registrado';

      setRequestStatus({
        type: 'success',
        message: `Cuenta localizada para "${found.companyName || found.fullName}". El PIN de acceso está configurado para enviarse a: ${maskedEmail}.`,
        targetEmail: found.contactEmail,
        mailtoUrl: mailto,
      });
    } else {
      setRequestStatus({
        type: 'success',
        message: `Se ha generado la solicitud para "@${clean}". Puede remitir el mensaje directo al Administrador para que le dé de alta y envíe su PIN por correo.`,
        mailtoUrl: mailto,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background ambient decorative graphics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px), radial-gradient(rgba(14, 165, 233, 0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />
      </div>

      {/* Top Bar / Branding */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <AravoLogo
          size="sm"
          showText={true}
          showSubtitle={true}
          customText={appName}
          subtitleText="Gestión Integral de Producción Gráfica"
          variant="glow"
        />

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Portal de Acceso Protegido</span>
          <span className="sm:hidden">Seguro</span>
        </div>
      </header>

      {/* Center Hero & Login Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Aravo Welcome Banner */}
          <div className="text-center mb-6">
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-2xl shadow-sky-500/15 mb-2 group transition-transform hover:scale-105">
                <AravoIcon size={56} glow={true} />
              </div>
              <span className="text-2xl font-black tracking-[0.2em] text-white font-sans uppercase">
                {appName}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Aravo = Tiempo & Hora de Máquina</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ingreso al Sistema
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Ingrese su usuario asignado y el código PIN de seguridad recibido por correo electrónico.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative space-y-4">
            {/* Aviso informativo de PIN enviado por correo */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="leading-snug">
                El PIN de acceso es enviado a su correo electrónico al habilitarse su cuenta.
              </span>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulario Principal de Autenticación */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Campo Usuario */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Usuario del Sistema</span>
                  <span className="text-[10px] text-amber-400 font-mono">Sin @ ni espacios</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[@\s]/g, '');
                      setUsername(cleaned);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Ingrese su nombre de usuario"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono font-medium"
                  />
                </div>
              </div>

              {/* Campo Código/PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN de Acceso (Enviado por Correo)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeypad(!showKeypad)}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors font-medium"
                  >
                    {showKeypad ? 'Ocultar Teclado' : 'Teclado Táctil'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={pinInputRef}
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\s+/g, '');
                      setPin(cleaned);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Ingrese el PIN recibido en su correo"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 text-sm text-amber-300 font-mono tracking-wider placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botones de selección rápida de cuentas del sistema */}
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Cuentas rápidas de acceso:</span>
                  <span className="text-amber-400/90 font-bold">PIN requerido</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPin('1234');
                      if (errorMessage) setErrorMessage(null);
                      pinInputRef.current?.focus();
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] font-mono transition-colors"
                    title="Cargar usuario admin (PIN: 1234)"
                  >
                    admin (1234)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('graficaed');
                      setPin('1101');
                      if (errorMessage) setErrorMessage(null);
                      pinInputRef.current?.focus();
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors"
                    title="Cargar usuario graficaed (PIN: 1101)"
                  >
                    graficaed (1101)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('operador');
                      setPin('1234');
                      if (errorMessage) setErrorMessage(null);
                      pinInputRef.current?.focus();
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 text-[11px] font-mono transition-colors"
                    title="Cargar usuario operador (PIN: 1234)"
                  >
                    operador (1234)
                  </button>
                </div>
              </div>

              {/* Keypad táctil opcional */}
              {showKeypad && (
                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-mono font-bold text-base active:bg-amber-500 active:text-slate-950 transition-colors"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('clear')}
                      className="py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-rose-400 text-xs font-bold"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-mono font-bold text-base active:bg-amber-500 active:text-slate-950 transition-colors"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('backspace')}
                      className="py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-amber-400 flex items-center justify-center text-xs font-bold"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Recordar nombre de usuario */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberUsername}
                    onChange={(e) => setRememberUsername(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                  />
                  <span>Recordar usuario en este navegador</span>
                </label>
                <span className="text-[10px] text-amber-400/90 font-mono">
                  PIN requerido siempre
                </span>
              </div>

              {/* Botón principal de Acceso */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Enlace para solicitar PIN por correo */}
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setRequestUserInput(username || '');
                  setRequestStatus({ type: 'idle', message: '' });
                  setIsRequestPinOpen(true);
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>¿No recibió su PIN o necesita solicitarlo por correo?</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal para Solicitar o Reenviar PIN por Correo */}
      {isRequestPinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsRequestPinOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Solicitud de PIN por Correo</h3>
                <p className="text-[11px] text-slate-400">
                  Las credenciales se envían al correo registrado del titular.
                </p>
              </div>
            </div>

            {requestStatus.type !== 'success' ? (
              <form onSubmit={handleProcessPinRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nombre de Usuario o Correo Electrónico
                  </label>
                  <input
                    type="text"
                    required
                    value={requestUserInput}
                    onChange={(e) => setRequestUserInput(e.target.value)}
                    placeholder="ej. graficaed o contacto@imprenta.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    autoFocus
                  />
                </div>

                {requestStatus.type === 'error' && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{requestStatus.message}</span>
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestPinOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Consultar Cuenta</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{requestStatus.message}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para solicitar el envío o restablecimiento formal de su PIN, puede remitir el correo directo al Administrador:
                </p>

                {requestStatus.mailtoUrl && (
                  <a
                    href={requestStatus.mailtoUrl}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all text-center block"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar Correo al Administrador ({adminContact.email})</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsRequestPinOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Entendido, volver al inicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer corporativo */}
      <footer className="relative z-10 px-6 py-4 max-w-7xl mx-auto w-full text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-900">
        <div className="flex items-center gap-2">
          <span>{appName} &copy; {new Date().getFullYear()}</span>
          <span>•</span>
          <span>Cálculo Técnico & Presupuestario para Impresión</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acceso Protegido por PIN</span>
          </span>
          <span>Envío de Credenciales por Correo</span>
        </div>
      </footer>
    </div>
  );
};

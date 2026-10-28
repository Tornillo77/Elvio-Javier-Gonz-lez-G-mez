import { UserAccount, SubscriptionCheckResult, AdminContactConfig, SubscriptionStatus } from '../types/user';

const ADMIN_CONTACT_KEY = 'aravo_admin_contact_config';

export const DEFAULT_ADMIN_CONTACT: AdminContactConfig = {
  name: 'Elvio González (Administrador ARAVO)',
  phone: '+595 981 123456',
  email: 'elviogonzalezgomez@gmail.com',
  whatsappMessage: 'Hola, soy cliente de Aravo y necesito renovar mi suscripción mensual.',
};

/**
 * Obtener la configuración de contacto del administrador para renovaciones
 */
export function getAdminContactConfig(): AdminContactConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CONTACT_KEY);
    if (!raw) return DEFAULT_ADMIN_CONTACT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_CONTACT, ...parsed };
  } catch {
    return DEFAULT_ADMIN_CONTACT;
  }
}

/**
 * Guardar la configuración de contacto del administrador
 */
export function saveAdminContactConfig(config: AdminContactConfig): void {
  try {
    localStorage.setItem(ADMIN_CONTACT_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error al guardar contacto de admin:', err);
  }
}

/**
 * Genera el enlace directo a WhatsApp para renovaciones
 */
export function getWhatsAppContactUrl(
  adminConfig: AdminContactConfig,
  clientUser?: UserAccount | null
): string {
  const cleanPhone = adminConfig.phone.replace(/[^0-9]/g, '');
  const imprentaName = clientUser?.companyName || clientUser?.fullName || clientUser?.username || 'Mi Imprenta';
  const customMsg = encodeURIComponent(
    `Hola ${adminConfig.name}, mi suscripción a Aravo para "${imprentaName}" (Usuario: ${clientUser?.username || ''}) ha expirado y deseo coordinar la renovación del servicio mensual.`
  );
  return `https://wa.me/${cleanPhone}?text=${customMsg}`;
}

/**
 * Formatea una fecha ISO para visualización amigable en español
 */
export function formatDateForDisplay(dateStr?: string): string {
  if (!dateStr) return 'Sin fecha definida';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Verifica el estado exacto de la suscripción de un usuario/imprenta
 */
export function checkUserSubscription(user?: UserAccount | null): SubscriptionCheckResult {
  // Si no hay usuario definido
  if (!user) {
    return {
      status: 'expired',
      isExpired: true,
      daysRemaining: 0,
      formattedExpiresAt: 'Sin sesión activa',
      formattedDate: 'N/A',
      message: 'No hay usuario autenticado.',
      isWarning: false,
    };
  }

  // Administrador del Sistema: Acceso perpetuo ilimitado (NUNCA se bloquea)
  const normUsername = (user.username || '').replace(/[@\s]/g, '').toLowerCase();
  if (user.isSystemAdmin || user.role === 'admin' || normUsername === 'admin') {
    return {
      status: 'unlimited',
      isExpired: false,
      daysRemaining: 9999,
      formattedExpiresAt: 'Acceso Perpetuo (Administrador)',
      formattedDate: 'Ilimitado / Sin vencimiento',
      message: 'Cuenta con privilegios totales de administración.',
      isWarning: false,
    };
  }

  // Suspensión manual por parte del admin
  if (user.subscriptionActive === false) {
    return {
      status: 'expired',
      isExpired: true,
      daysRemaining: 0,
      formattedExpiresAt: 'Acceso Suspendido',
      formattedDate: user.subscriptionExpiresAt ? formatDateForDisplay(user.subscriptionExpiresAt) : 'Desactivado',
      message: 'Su cuenta se encuentra pausada. Por favor, comuníquese con el administrador para reactivar su acceso.',
      isWarning: false,
    };
  }

  // Si no tiene fecha configurada explícitamente pero la cuenta está activa (ej: recién dada de alta):
  // Evitar falsos bloqueos para permitir el acceso inmediato de clientes y usuarios registrados
  if (!user.subscriptionExpiresAt) {
    return {
      status: 'active',
      isExpired: false,
      daysRemaining: 30,
      formattedExpiresAt: 'Suscripción Activa (30 días)',
      formattedDate: 'Activa',
      message: 'Suscripción habilitada en el sistema para cálculo técnico y presupuestario.',
      isWarning: false,
    };
  }

  const expireTimestamp = new Date(user.subscriptionExpiresAt).getTime();
  if (isNaN(expireTimestamp)) {
    // Si la fecha configurada tiene formato no reconocido, no bloquear al usuario por error técnico
    return {
      status: 'active',
      isExpired: false,
      daysRemaining: 30,
      formattedExpiresAt: 'Suscripción Activa',
      formattedDate: 'Válida',
      message: 'Suscripción habilitada en el sistema.',
      isWarning: false,
    };
  }

  const now = Date.now();
  const diffMs = expireTimestamp - now;

  // Si ya venció la fecha de pago o suscripción
  if (diffMs <= 0) {
    const hoursExpired = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const daysExpired = Math.floor(hoursExpired / 24);
    const expiredLabel = daysExpired > 0 ? `Vencida hace ${daysExpired} día(s)` : `Vencida hoy (${hoursExpired} hs)`;

    return {
      status: 'expired',
      isExpired: true,
      daysRemaining: 0,
      formattedExpiresAt: expiredLabel,
      formattedDate: formatDateForDisplay(user.subscriptionExpiresAt),
      message: 'Su suscripción mensual ha expirado. Por favor, comuníquese con el administrador para renovar su acceso',
      isWarning: false,
    };
  }

  // Suscripción Activa
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isWarning = daysRemaining <= 5;

  return {
    status: isWarning ? 'warning' : 'active',
    isExpired: false,
    daysRemaining,
    formattedExpiresAt: `${daysRemaining} día${daysRemaining === 1 ? '' : 's'} restante${daysRemaining === 1 ? '' : 's'}`,
    formattedDate: formatDateForDisplay(user.subscriptionExpiresAt),
    message: isWarning
      ? `Su suscripción vence en ${daysRemaining} día(s). Recuerde abonar con el administrador para no perder acceso.`
      : `Suscripción activa (${daysRemaining} días restantes).`,
    isWarning,
  };
}

/**
 * Extiende la fecha de suscripción sumando N días
 */
export function extendSubscription(user: UserAccount, daysToAdd: number): UserAccount {
  const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : Date.now();
  // Si ya estaba vencida, empezamos a sumar desde hoy
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

  return {
    ...user,
    subscriptionExpiresAt: newExpiry.toISOString(),
    subscriptionActive: true,
  };
}

/**
 * Asigna una fecha de vencimiento específica
 */
export function setSubscriptionExpiry(user: UserAccount, dateIsoString: string): UserAccount {
  return {
    ...user,
    subscriptionExpiresAt: dateIsoString,
    subscriptionActive: true,
  };
}

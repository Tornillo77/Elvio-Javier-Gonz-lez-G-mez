export type UserRole = 'admin' | 'cotizador' | 'taller' | 'comercial' | 'imprenta';

export type SubscriptionStatus = 'active' | 'warning' | 'expired' | 'unlimited';

export interface UserAccount {
  id: string;
  username: string; // único, minúsculas, ej: admin, carlos, marcos, imprenta_norte
  pin: string; // Código/PIN o contraseña de seguridad
  fullName: string; // Nombre del operador o contacto responsable
  companyName?: string; // Nombre de la Imprenta / Cliente
  role: UserRole;
  roleLabel: string;
  avatarColor: string; // Clases tailwind de gradiente
  createdAt: string;
  lastLoginAt?: string;
  isSystemAdmin?: boolean; // Protege contra eliminación y acceso perpetuo sin vencimiento
  notes?: string;

  // Control de Suscripción Mensual
  subscriptionExpiresAt?: string; // Fecha y hora ISO de vencimiento (ej: 2026-11-10T23:59:59.000Z)
  subscriptionActive?: boolean; // Permite pausar/suspender manualmente por el admin (default: true)
  subscriptionPlan?: string; // Nombre del plan (ej: "Mensual Estándar", "Plan Anual", etc.)
  contactPhone?: string; // Teléfono o WhatsApp de la imprenta
  contactEmail?: string; // Correo de la imprenta
}

export interface SubscriptionCheckResult {
  status: SubscriptionStatus;
  isExpired: boolean;
  daysRemaining: number;
  formattedExpiresAt: string;
  formattedDate: string;
  message: string;
  isWarning: boolean; // Si restan 5 días o menos
}

export interface AdminContactConfig {
  name: string;
  phone: string;
  email: string;
  whatsappMessage?: string;
}

export interface AuthSession {
  user: UserAccount;
  loginTimestamp: number;
  rememberMe: boolean;
  token: string;
}

export const ROLE_DEFINITIONS: Record<
  UserRole,
  { label: string; description: string; badgeColor: string; permissions: string[] }
> = {
  admin: {
    label: 'Administrador del Sistema',
    description: 'Control total de configuración, costos base, gestión de clientes/imprentas y suscripciones.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    permissions: ['all_access', 'user_management', 'cost_config', 'quotes', 'export', 'subscription_admin'],
  },
  imprenta: {
    label: 'Cliente / Imprenta Suscrita',
    description: 'Acceso a cotizador técnico completo, imposición de pliegos, cálculo de tintas y exportación de presupuestos.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: ['calculator', 'quotes', 'export', 'workshop_tools'],
  },
  cotizador: {
    label: 'Cotizador Técnico Senior',
    description: 'Cálculo de imposiciones, optimización de pliegos, acabados y generación de presupuestos.',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    permissions: ['calculator', 'quotes', 'export', 'view_costs'],
  },
  taller: {
    label: 'Operador / Jefe de Taller',
    description: 'Consulta de parámetros técnicos de pliego, pinzas, tintas, troqueles y orden de trabajo.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: ['view_jobs', 'machine_plates', 'workshop_tools'],
  },
  comercial: {
    label: 'Ejecutivo Comercial',
    description: 'Gestión de clientes, propuestas económicas y resúmenes de cotización.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    permissions: ['quotes', 'client_order', 'export'],
  },
};

import { UserAccount, AuthSession, UserRole, ROLE_DEFINITIONS } from '../types/user';
import {
  saveUserToFirestore,
  deleteUserFromFirestore,
  fetchSystemUsersFromFirestore,
  saveSystemConfigToFirestore,
  fetchSystemConfigFromFirestore,
  fetchUserByUsernameFromFirestore,
} from './firebase';

const USERS_STORAGE_KEY = 'aravo_users_db_v2';
const SESSION_STORAGE_KEY = 'aravo_auth_session';
const OPEN_ACCESS_STORAGE_KEY = 'aravo_open_access_v1';

// Fechas dinámicas para usuarios demo (con vigencia extendida para evitar bloqueos)
const now = Date.now();
const in365Days = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
const in30Days = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Limpia y normaliza cualquier nombre de usuario:
 * - Elimina automáticamente cualquier símbolo de arroba (@) que el usuario escriba por inercia
 * - Elimina espacios en blanco (iniciales, finales e intermedios)
 * - Convierte a minúsculas para comparaciones consistentes
 */
export function sanitizeUsername(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .replace(/[@\s]/g, '')
    .trim()
    .toLowerCase();
}

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_admin_01',
    username: 'admin',
    pin: '1234',
    fullName: 'Ing. Administrador Aravo',
    companyName: 'ARAVO Software Central',
    role: 'admin',
    roleLabel: ROLE_DEFINITIONS.admin.label,
    avatarColor: 'from-amber-500 to-orange-600',
    createdAt: '2025-01-15T08:00:00.000Z',
    isSystemAdmin: true,
    subscriptionActive: true,
    subscriptionPlan: 'Administrador Perpetuo',
    notes: 'Cuenta maestra del sistema con acceso administrativo total y sin expiración.',
  },
  {
    id: 'usr_graficaed_01',
    username: 'graficaed',
    pin: '1101',
    fullName: 'Gráfica ED (Producción)',
    companyName: 'Gráfica ED S.A.',
    role: 'imprenta',
    roleLabel: ROLE_DEFINITIONS.imprenta.label,
    avatarColor: 'from-amber-500 to-orange-600',
    createdAt: new Date().toISOString(),
    subscriptionExpiresAt: in365Days,
    subscriptionActive: true,
    subscriptionPlan: 'Plan Anual Producción Pro',
    contactPhone: '+595 981 110100',
    contactEmail: 'graficaed@gmail.com',
    notes: 'Cliente gráfico principal de producción para presupuestos offset y flexográficos.',
  },
  {
    id: 'usr_operador_01',
    username: 'operador',
    pin: '1234',
    fullName: 'Operador de Planta / Taller',
    companyName: 'Taller de Impresión Gráfica',
    role: 'taller',
    roleLabel: ROLE_DEFINITIONS.taller.label,
    avatarColor: 'from-purple-500 to-pink-600',
    createdAt: new Date().toISOString(),
    subscriptionExpiresAt: in365Days,
    subscriptionActive: true,
    subscriptionPlan: 'Acceso Operativo de Planta',
    notes: 'Acceso directo para operarios de guillotina, prensa y bobinado.',
  },
  {
    id: 'usr_imprenta_01',
    username: 'imprenta_central',
    pin: '1234',
    fullName: 'Roberto Cáceres (Gerente Técnico)',
    companyName: 'Gráfica Central S.A.',
    role: 'imprenta',
    roleLabel: ROLE_DEFINITIONS.imprenta.label,
    avatarColor: 'from-emerald-500 to-teal-600',
    createdAt: new Date().toISOString(),
    subscriptionExpiresAt: in365Days,
    subscriptionActive: true,
    subscriptionPlan: 'Plan Mensual Pro',
    contactPhone: '+595 981 445566',
    contactEmail: 'contacto@graficacentral.com',
    notes: 'Imprenta comercial con suscripción activa.',
  },
  {
    id: 'usr_carlos_02',
    username: 'cotizador',
    pin: '2024',
    fullName: 'Carlos Méndez (Estimador)',
    companyName: 'Taller Gráfico Especializado',
    role: 'cotizador',
    roleLabel: ROLE_DEFINITIONS.cotizador.label,
    avatarColor: 'from-sky-500 to-blue-600',
    createdAt: '2025-02-10T09:30:00.000Z',
    subscriptionExpiresAt: in365Days,
    subscriptionActive: true,
    subscriptionPlan: 'Plan Taller',
    notes: 'Cotizador técnico responsable de presupuestos offset y flexografía.',
  },
];

const AVATAR_COLOR_PALETTES = [
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-violet-600',
  'from-cyan-500 to-blue-500',
];

/**
 * Obtener todos los usuarios registrados en localStorage.
 * Si no existen, inicializa los usuarios predeterminados.
 * Además, sincroniza para asegurar que cuentas de plantilla esenciales
 * (como admin y graficaed) estén siempre disponibles sin sobrescribir
 * los usuarios creados por el administrador.
 */
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }

    // Asegurar sincronización no destructiva:
    // Si algún usuario predeterminado clave (admin, graficaed) no está en parsed,
    // se agrega sin alterar ningún usuario creado o modificado
    const userMap = new Map<string, UserAccount>();
    for (const u of parsed) {
      const key = sanitizeUsername(u.username);
      if (key) userMap.set(key, u);
    }

    let needsSync = false;
    for (const def of DEFAULT_USERS) {
      const defKey = sanitizeUsername(def.username);
      if (!userMap.has(defKey)) {
        userMap.set(defKey, def);
        needsSync = true;
      }
    }

    const consolidated = Array.from(userMap.values());
    if (needsSync) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(consolidated));
    }
    return consolidated;
  } catch (err) {
    console.error('Error al leer usuarios de localStorage:', err);
    return DEFAULT_USERS;
  }
}

/**
 * Sincroniza y consolida la base de datos local persistente de usuarios.
 * Garantiza que la persistencia local contenga tanto los usuarios dados de alta
 * por el administrador como las cuentas del sistema, eliminando inconsistencias
 * de formato en nombres de usuario y PINs.
 */
export function syncLocalUsersDatabase(): { success: boolean; usersCount: number; users: UserAccount[] } {
  try {
    const users = getUsers();
    // Limpiar y asegurar que todos los registros tengan username y PIN normalizados
    const normalized = users.map((u) => ({
      ...u,
      username: sanitizeUsername(u.username) || u.username,
      pin: String(u.pin ?? '').replace(/\s+/g, '').trim(),
      subscriptionActive: u.subscriptionActive ?? true,
    }));

    saveUsers(normalized);
    return { success: true, usersCount: normalized.length, users: normalized };
  } catch (err) {
    console.error('Error al sincronizar base local:', err);
    return { success: false, usersCount: DEFAULT_USERS.length, users: DEFAULT_USERS };
  }
}

/**
 * Guardar la lista de usuarios en localStorage
 */
export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error al guardar usuarios en localStorage:', err);
  }
}

/**
 * Autenticar un usuario con su nombre de usuario y PIN.
 * - Limpia automáticamente cualquier símbolo de arroba (@) o espacios en blanco
 *   que el usuario escriba por inercia en el campo de usuario.
 * - Compara correctamente tanto el nombre de usuario como el PIN con la base de datos
 *   local persistente sincronizada.
 * - Evita falsos bloqueos y permite el acceso inmediato de los clientes y del administrador.
 */
export function authenticate(
  usernameInput: string,
  pinInput: string,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  // Limpieza estricta de cualquier símbolo @ y espacios en blanco
  const cleanUsername = sanitizeUsername(usernameInput);
  const cleanPin = String(pinInput ?? '').replace(/\s+/g, '').trim();

  // Si el usuario ingresó por inercia un correo electrónico (ej. graficaed@gmail.com)
  const rawInputLower = (usernameInput || '').trim().toLowerCase();
  const emailPrefix = rawInputLower.includes('@')
    ? sanitizeUsername(rawInputLower.split('@')[0])
    : '';

  if (!cleanUsername && !emailPrefix) {
    return { success: false, error: 'Por favor, ingrese el nombre de usuario asignado.' };
  }
  if (!cleanPin) {
    return { success: false, error: 'Por favor, ingrese el código o PIN de seguridad.' };
  }

  // Leer la base de datos local persistente sincronizada
  const users = getUsers();

  // Búsqueda inteligente y tolerante a formatos
  const matchedUser = users.find((u) => {
    const uClean = sanitizeUsername(u.username);
    const uRaw = (u.username || '').trim().toLowerCase();
    const uEmail = (u.contactEmail || '').trim().toLowerCase();
    const uEmailClean = sanitizeUsername(u.contactEmail);
    const uIdClean = sanitizeUsername(u.id);

    return (
      uClean === cleanUsername ||
      uRaw === cleanUsername ||
      (emailPrefix && (uClean === emailPrefix || uRaw === emailPrefix)) ||
      (uEmail && (uEmail === rawInputLower || uEmailClean === cleanUsername)) ||
      (emailPrefix && uEmailClean === emailPrefix) ||
      uIdClean === cleanUsername
    );
  });

  if (!matchedUser) {
    return {
      success: false,
      error: `El usuario "${cleanUsername || usernameInput}" no existe en el sistema. Verifique su nombre de usuario o solicite su alta en el panel de administración.`,
    };
  }

  // Comparación correcta del PIN (convirtiendo ambos a strings y sin espacios en blanco)
  const storedPin = String(matchedUser.pin ?? '').replace(/\s+/g, '').trim();
  if (storedPin !== cleanPin) {
    return {
      success: false,
      error: 'Código/PIN de seguridad incorrecto. Intente nuevamente.',
    };
  }

  // Si la cuenta es de Administrador, siempre garantizar acceso inmediato sin bloqueos
  // Para clientes con suscripción, verificar si no está suspendida manualmente
  const isSystemAdmin = matchedUser.isSystemAdmin || matchedUser.role === 'admin' || sanitizeUsername(matchedUser.username) === 'admin';

  if (!isSystemAdmin && matchedUser.subscriptionActive === false) {
    return {
      success: false,
      error: 'La suscripción de este usuario se encuentra actualmente pausada o suspendida. Comuníquese con el administrador para reactivarla.',
    };
  }

  // Actualizar lastLoginAt y garantizar subscriptionActive = true para nuevos usuarios
  const updatedUser: UserAccount = {
    ...matchedUser,
    lastLoginAt: new Date().toISOString(),
    subscriptionActive: matchedUser.subscriptionActive ?? true,
  };

  const updatedUsers = users.map((u) => (u.id === matchedUser.id ? updatedUser : u));
  saveUsers(updatedUsers);

  // Crear y guardar la sesión activa
  const session: AuthSession = {
    user: updatedUser,
    loginTimestamp: Date.now(),
    rememberMe,
    token: `aravo_tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  setSession(session);

  return { success: true, session };
}

/**
 * Autenticación asíncrona con consulta en tiempo real a la nube (Firestore)
 * para asegurar que cualquier usuario creado desde la computadora del administrador
 * pueda ingresar de inmediato en cualquier otra computadora sin demoras.
 */
export async function authenticateAsync(
  usernameInput: string,
  pinInput: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  // 1. Intentar autenticación con la base local actual
  const localResult = authenticate(usernameInput, pinInput, rememberMe);
  if (localResult.success) {
    return localResult;
  }

  // 2. Si falló a nivel local, consultar en tiempo real a Firebase Firestore
  try {
    const cloudUser = await fetchUserByUsernameFromFirestore(usernameInput);
    if (cloudUser) {
      // Integrar usuario recuperado de la nube en la base local
      const currentUsers = getUsers();
      const existingIdx = currentUsers.findIndex(
        (u) => sanitizeUsername(u.username) === sanitizeUsername(cloudUser.username)
      );
      let nextUsers: UserAccount[];
      if (existingIdx >= 0) {
        nextUsers = [...currentUsers];
        nextUsers[existingIdx] = { ...nextUsers[existingIdx], ...cloudUser };
      } else {
        nextUsers = [...currentUsers, cloudUser];
      }
      saveUsers(nextUsers);

      // Re-verificar credenciales con el usuario fresco de la nube
      return authenticate(usernameInput, pinInput, rememberMe);
    }
  } catch (err) {
    console.warn('Verificación en tiempo real con Firestore:', err);
  }

  return localResult;
}

/**
 * Dar de alta a un nuevo usuario
 */
export function createUser(data: {
  username: string;
  pin: string;
  fullName: string;
  companyName?: string;
  role: UserRole;
  subscriptionExpiresAt?: string;
  subscriptionActive?: boolean;
  subscriptionPlan?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  // Limpiar automáticamente @ y espacios en blanco del nombre de usuario
  const cleanUsername = sanitizeUsername(data.username);
  const cleanPin = String(data.pin ?? '').replace(/\s+/g, '').trim();
  const cleanName = data.fullName.trim();
  const cleanCompany = data.companyName?.trim() || cleanName;

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return {
      success: false,
      error: 'El nombre de usuario solo puede contener letras, números, puntos o guiones.',
    };
  }
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: 'La contraseña o PIN debe tener mínimo 4 caracteres.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Ingrese el nombre de la imprenta o contacto responsable.' };
  }

  const users = getUsers();
  const exists = users.some((u) => sanitizeUsername(u.username) === cleanUsername);
  if (exists) {
    return {
      success: false,
      error: `Ya existe un usuario con el identificador "${cleanUsername}". Elija otro.`,
    };
  }

  const roleDef = ROLE_DEFINITIONS[data.role] || ROLE_DEFINITIONS.imprenta;
  const avatarIndex = users.length % AVATAR_COLOR_PALETTES.length;

  // Fecha de vencimiento por defecto: 30 días si no se especifica y no es admin
  const defaultExpiry =
    data.subscriptionExpiresAt ||
    (data.role === 'admin'
      ? undefined
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    pin: cleanPin,
    fullName: cleanName,
    companyName: cleanCompany,
    role: data.role,
    roleLabel: roleDef.label,
    avatarColor: AVATAR_COLOR_PALETTES[avatarIndex],
    createdAt: new Date().toISOString(),
    subscriptionExpiresAt: defaultExpiry,
    subscriptionActive: data.subscriptionActive ?? true,
    subscriptionPlan: data.subscriptionPlan || (data.role === 'admin' ? 'Administrador' : 'Plan Mensual Estándar'),
    contactPhone: data.contactPhone?.trim(),
    contactEmail: data.contactEmail?.trim(),
    notes: data.notes?.trim() || undefined,
  };

  const nextUsers = [...users, newUser];
  saveUsers(nextUsers);

  // Sincronizar automáticamente a Firestore para que esté disponible en todas las computadoras
  saveUserToFirestore(newUser).catch(() => {});

  return { success: true, user: newUser };
}

/**
 * Modificar datos de un usuario o suscripción existente
 */
export function updateUser(
  id: string,
  updates: Partial<
    Pick<
      UserAccount,
      | 'fullName'
      | 'companyName'
      | 'pin'
      | 'role'
      | 'notes'
      | 'subscriptionExpiresAt'
      | 'subscriptionActive'
      | 'subscriptionPlan'
      | 'contactPhone'
      | 'contactEmail'
    >
  >
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, error: 'Usuario o imprenta no encontrada.' };
  }

  const existing = users[index];

  // Si actualiza PIN, validar
  if (updates.pin !== undefined && updates.pin.trim().length < 4) {
    return { success: false, error: 'La contraseña / PIN debe tener al menos 4 caracteres.' };
  }

  const newRole = updates.role ?? existing.role;
  const roleDef = ROLE_DEFINITIONS[newRole];

  const updated: UserAccount = {
    ...existing,
    ...updates,
    role: newRole,
    roleLabel: roleDef ? roleDef.label : existing.roleLabel,
  };

  users[index] = updated;
  saveUsers(users);

  // Sincronizar cambio a la nube
  saveUserToFirestore(updated).catch(() => {});

  // Si el usuario actualizado es el de la sesión actual, actualizar sesión
  const currentSession = getSession();
  if (currentSession && currentSession.user.id === id) {
    currentSession.user = updated;
    setSession(currentSession);
  }

  return { success: true, user: updated };
}

/**
 * Renovar suscripción sumando N días (por defecto 30 días mensuales)
 */
export function renewUserSubscription(
  id: string,
  daysToAdd: number = 30
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : Date.now();
  // Si la suscripción ya estaba vencida, renueva 30 días desde HOY; si aún le quedaban días, se los acumula
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

  return updateUser(id, {
    subscriptionExpiresAt: newExpiry,
    subscriptionActive: true,
  });
}

/**
 * Pausar o reanudar el estado de una suscripción
 */
export function toggleUserSubscriptionActive(
  id: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const newState = user.subscriptionActive === false ? true : false;
  return updateUser(id, {
    subscriptionActive: newState,
  });
}

/**
 * Dar de baja (eliminar) a un usuario del sistema
 */
export function deleteUser(
  id: string,
  currentUserId?: string
): { success: boolean; error?: string } {
  const users = getUsers();
  const target = users.find((u) => u.id === id);

  if (!target) {
    return { success: false, error: 'El usuario que intenta eliminar no existe.' };
  }

  // Protección: No permitir eliminar el único administrador restante
  if (target.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'No es posible eliminar el único Administrador del sistema. Asigne el rol a otro usuario primero.',
      };
    }
  }

  // Advertir si se está eliminando a sí mismo
  if (currentUserId && target.id === currentUserId) {
    // Permitir pero retornar indicación
  }

  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);

  // Sincronizar eliminación en la nube
  deleteUserFromFirestore(id).catch(() => {});

  // Si se eliminó el usuario en sesión activa, cerrar sesión
  const currentSession = getSession();
  if (currentSession && currentSession.user.id === id) {
    clearSession();
  }

  return { success: true };
}

/**
 * Restablecer a los usuarios predeterminados de fábrica
 */
export function resetToDefaultUsers(): UserAccount[] {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

/**
 * Guardar sesión activa en almacenamiento del navegador
 */
export function setSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error al guardar sesión:', err);
  }
}

/**
 * Obtener la sesión activa en el navegador
 */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session || !session.user || !session.user.id) return null;

    // Verificar que el usuario todavía exista en la base de usuarios
    const users = getUsers();
    const existing = users.find((u) => u.id === session.user.id);
    if (!existing) {
      clearSession();
      return null;
    }

    // Actualizar datos del usuario por si cambiaron rol o nombre
    session.user = existing;
    return session;
  } catch (err) {
    console.error('Error al recuperar sesión:', err);
    return null;
  }
}

/**
 * Cerrar la sesión actual
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
}

/**
 * Configuración de acceso global: Si está habilitado (por defecto true),
 * los colaboradores en cualquier computadora pueden acceder directamente sin contraseñas bloqueantes.
 */
export function getOpenAccessSetting(): boolean {
  try {
    const raw = localStorage.getItem(OPEN_ACCESS_STORAGE_KEY);
    if (raw === null) return true; // Por defecto activado para evitar bloqueos
    return raw === 'true';
  } catch {
    return true;
  }
}

export function setOpenAccessSetting(enabled: boolean): void {
  try {
    localStorage.setItem(OPEN_ACCESS_STORAGE_KEY, String(enabled));
    saveSystemConfigToFirestore({ openAccess: enabled }).catch(() => {});
  } catch (err) {
    console.error('Error al guardar configuración de acceso abierto:', err);
  }
}

/**
 * Crea una sesión de acceso directo instantáneo para cualquier colaborador
 * (por ejemplo para operarios de taller o gráfica en otras computadoras).
 */
export function createDirectSession(preferredUsername: string = 'graficaed'): AuthSession {
  const users = getUsers();
  const cleanPref = sanitizeUsername(preferredUsername);
  let user = users.find((u) => sanitizeUsername(u.username) === cleanPref);

  if (!user) {
    user = users.find((u) => u.role === 'imprenta' || u.role === 'taller') || users[0] || DEFAULT_USERS[1];
  }

  const session: AuthSession = {
    user: {
      ...user,
      lastLoginAt: new Date().toISOString(),
      subscriptionActive: true,
    },
    loginTimestamp: Date.now(),
    rememberMe: true,
    token: `aravo_direct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  setSession(session);
  return session;
}

/**
 * Sincroniza la base de datos de usuarios con la Nube (Firestore)
 * para que los usuarios creados en una computadora estén disponibles
 * al instante en TODAS las computadoras del taller y clientes.
 */
export async function syncWithCloudDatabase(): Promise<{
  success: boolean;
  usersCount: number;
  users: UserAccount[];
}> {
  try {
    // 1. Obtener usuarios locales actuales
    const localUsers = getUsers();
    const userMap = new Map<string, UserAccount>();
    for (const u of localUsers) {
      const k = sanitizeUsername(u.username);
      if (k) userMap.set(k, u);
    }

    // 2. Traer usuarios guardados en la Nube
    const cloudUsers = await fetchSystemUsersFromFirestore();

    if (cloudUsers && cloudUsers.length > 0) {
      for (const cu of cloudUsers) {
        const k = sanitizeUsername(cu.username);
        if (k) {
          // Si no existe localmente, o incorporar datos de la nube
          userMap.set(k, {
            ...cu,
            subscriptionActive: cu.subscriptionActive ?? true,
          });
        }
      }
    } else {
      // Si la nube está vacía (primer arranque), subir los usuarios locales a la nube
      for (const lu of localUsers) {
        await saveUserToFirestore(lu);
      }
    }

    // 3. Sincronizar configuración de acceso
    const cloudConfig = await fetchSystemConfigFromFirestore();
    if (cloudConfig && typeof cloudConfig.openAccess === 'boolean') {
      localStorage.setItem(OPEN_ACCESS_STORAGE_KEY, String(cloudConfig.openAccess));
    }

    const consolidated = Array.from(userMap.values());
    saveUsers(consolidated);

    return {
      success: true,
      usersCount: consolidated.length,
      users: consolidated,
    };
  } catch (err) {
    console.warn('Sincronización en la nube en segundo plano:', err);
    const localUsers = getUsers();
    return {
      success: false,
      usersCount: localUsers.length,
      users: localUsers,
    };
  }
}


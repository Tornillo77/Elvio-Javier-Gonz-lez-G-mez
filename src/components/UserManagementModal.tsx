import React, { useState } from 'react';
import { UserAccount, UserRole, ROLE_DEFINITIONS } from '../types/user';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  renewUserSubscription,
  toggleUserSubscriptionActive,
  resetToDefaultUsers,
  syncLocalUsersDatabase,
  syncWithCloudDatabase,
  sanitizeUsername,
} from '../utils/authService';
import {
  checkUserSubscription,
  formatDateForDisplay,
  getAdminContactConfig,
  saveAdminContactConfig,
  getWhatsAppContactUrl,
} from '../utils/subscriptionUtils';
import {
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Calendar,
  Building2,
  Database,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Check,
  Pause,
  Play,
  Share2,
  AlertCircle,
  ShieldCheck,
  Cloud,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onUsersChanged?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersChanged,
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'admin_config'>('list');

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'expired'>('all');

  // Formulario de Alta de Imprenta / Cliente
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('imprenta');
  const [newPlan, setNewPlan] = useState('Plan Mensual Estándar');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  // Fecha de vencimiento por defecto: HOY + 30 días
  const [newExpiryDate, setNewExpiryDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  // Edición de Cliente / Suscripción
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('imprenta');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Confirmación de Baja
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Configuración de contacto del Admin
  const [adminContact, setAdminContact] = useState(() => getAdminContactConfig());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mensajes de éxito / error
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  // Restricción de acceso: Solo administradores pueden gestionar usuarios y suscripciones
  if (currentUser && currentUser.role !== 'admin' && !currentUser.isSystemAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Acceso Restringido</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Solo el <strong>Administrador del Sistema</strong> tiene autorización para dar de alta imprentas, asignar contraseñas y configurar fechas de suscripción mensual.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all shadow-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const refreshList = () => {
    const fresh = getUsers();
    setUsers(fresh);
    if (onUsersChanged) onUsersChanged();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    // Formatear fecha a ISO string al final del día seleccionado (23:59:59)
    let isoExpiry: string | undefined = undefined;
    if (newRole !== 'admin' && newExpiryDate) {
      isoExpiry = new Date(`${newExpiryDate}T23:59:59`).toISOString();
    }

    const res = createUser({
      companyName: newCompanyName.trim() || newFullName.trim(),
      fullName: newFullName.trim() || newCompanyName.trim(),
      username: sanitizeUsername(newUsername),
      pin: newPin.replace(/\s+/g, '').trim(),
      role: newRole,
      subscriptionExpiresAt: isoExpiry,
      subscriptionPlan: newPlan,
      contactPhone: newPhone.trim(),
      contactEmail: newEmail.trim(),
      notes: newNotes.trim(),
    });

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Error al crear la imprenta / usuario.' });
      return;
    }

    setFeedbackMsg({
      type: 'success',
      text: `¡Imprenta "${res.user?.companyName || res.user?.fullName}" dada de alta correctamente con vencimiento el ${formatDateForDisplay(isoExpiry)}!`,
    });

    // Reset form
    setNewCompanyName('');
    setNewFullName('');
    setNewUsername('');
    setNewPin('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setNewRole('imprenta');
    setActiveTab('list');
    refreshList();
  };

  const startEdit = (u: UserAccount) => {
    setEditingUserId(u.id);
    setEditCompanyName(u.companyName || u.fullName);
    setEditFullName(u.fullName);
    setEditPin(u.pin);
    setEditRole(u.role);
    setEditPhone(u.contactPhone || '');
    setEditEmail(u.contactEmail || '');
    if (u.subscriptionExpiresAt) {
      setEditExpiryDate(new Date(u.subscriptionExpiresAt).toISOString().slice(0, 10));
    } else {
      setEditExpiryDate('');
    }
    setFeedbackMsg(null);
  };

  const saveEdit = (id: string) => {
    let isoExpiry: string | undefined = undefined;
    if (editExpiryDate) {
      isoExpiry = new Date(`${editExpiryDate}T23:59:59`).toISOString();
    }

    const res = updateUser(id, {
      companyName: editCompanyName.trim(),
      fullName: editFullName.trim(),
      pin: editPin.replace(/\s+/g, '').trim(),
      role: editRole,
      contactPhone: editPhone.trim(),
      contactEmail: editEmail.trim(),
      subscriptionExpiresAt: isoExpiry,
    });

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Error al actualizar datos.' });
      return;
    }

    setEditingUserId(null);
    setFeedbackMsg({ type: 'success', text: 'Datos de la imprenta y suscripción actualizados con éxito.' });
    refreshList();
  };

  // Renovación rápida en 1 clic (+30 días / +15 días / +90 días)
  const handleQuickRenew = (id: string, days: number, companyName: string) => {
    const res = renewUserSubscription(id, days);
    if (res.success && res.user) {
      setFeedbackMsg({
        type: 'success',
        text: `¡Suscripción de "${companyName}" extendida +${days} días (Nuevo vencimiento: ${formatDateForDisplay(res.user.subscriptionExpiresAt)})!`,
      });
      refreshList();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'No se pudo renovar la suscripción.' });
    }
  };

  // Pausar o reanudar suscripción
  const handleToggleActive = (id: string, currentActive?: boolean, name?: string) => {
    const res = toggleUserSubscriptionActive(id);
    if (res.success) {
      const stateName = currentActive === false ? 'reactivada' : 'pausada';
      setFeedbackMsg({
        type: 'success',
        text: `Suscripción de "${name}" ${stateName} correctamente.`,
      });
      refreshList();
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id, currentUser?.id);
    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'No se pudo eliminar el usuario.' });
      setUserToDelete(null);
      return;
    }
    setFeedbackMsg({
      type: 'success',
      text: `Imprenta/Usuario "${userToDelete.companyName || userToDelete.fullName}" dado de baja exitosamente.`,
    });
    setUserToDelete(null);
    refreshList();
  };

  // Copiar credenciales para enviar al cliente por WhatsApp
  const handleCopyCredentials = (u: UserAccount) => {
    const sub = checkUserSubscription(u);
    const msg = `*Credenciales de Acceso Aravo - Sistema Gráfico*\n🏢 Imprenta: ${u.companyName || u.fullName}\n👤 Usuario: ${u.username}\n🔑 Contraseña / PIN: ${u.pin}\n📅 Vencimiento de Suscripción: ${sub.formattedDate} (${sub.formattedExpiresAt})\n\nPuedes ingresar desde tu navegador para calcular presupuestos offset y flexográficos.`;
    navigator.clipboard.writeText(msg);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Enviar PIN de acceso por correo electrónico
  const handleSendPinEmail = (u: UserAccount) => {
    const sub = checkUserSubscription(u);
    const emailTo = u.contactEmail?.trim() || '';
    const subject = encodeURIComponent(`Sus credenciales de acceso a ARAVO - ${u.companyName || u.fullName}`);
    const body = encodeURIComponent(
      `Estimado/a ${u.fullName || u.companyName},\n\nLe enviamos sus credenciales de acceso para el sistema ARAVO:\n\n` +
      `👤 Usuario: ${u.username}\n` +
      `🔑 Código / PIN: ${u.pin}\n` +
      `📅 Suscripción: ${sub.formattedExpiresAt}\n\n` +
      `Para ingresar al calculador gráfico en su computador, abra el siguiente enlace:\n${typeof window !== 'undefined' ? window.location.origin : 'ARAVO'}\n\n` +
      `Atentamente,\nEquipo de Administración ARAVO`
    );

    if (emailTo) {
      window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
      setFeedbackMsg({
        type: 'success',
        text: `Se abrió su cliente de correo para enviar el PIN a ${emailTo}.`,
      });
    } else {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setFeedbackMsg({
        type: 'success',
        text: 'Se abrió su cliente de correo. Ingrese la dirección del destinatario para enviar el PIN.',
      });
    }
  };

  // Guardar configuración del Admin
  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminContactConfig(adminContact);
    setFeedbackMsg({ type: 'success', text: 'Datos de contacto del administrador guardados correctamente.' });
  };

  // Métricas calculadas para la barra superior
  const metrics = users.reduce(
    (acc, u) => {
      if (u.role === 'admin' || u.isSystemAdmin) {
        acc.adminCount++;
      } else {
        acc.totalClients++;
        const sub = checkUserSubscription(u);
        if (sub.isExpired) {
          acc.expiredCount++;
        } else if (sub.isWarning) {
          acc.warningCount++;
        } else {
          acc.activeCount++;
        }
      }
      return acc;
    },
    { totalClients: 0, activeCount: 0, warningCount: 0, expiredCount: 0, adminCount: 0 }
  );

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      (u.companyName && u.companyName.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    const sub = checkUserSubscription(u);
    if (statusFilter === 'active') return !sub.isExpired && !sub.isWarning;
    if (statusFilter === 'warning') return sub.isWarning;
    if (statusFilter === 'expired') return sub.isExpired;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Panel de Administración & Suscripciones Mensuales
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  Acceso Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Altas de imprentas, control de contraseñas, vencimientos y temporizador de bloqueo automático
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Mini Dashboards */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Imprentas Totales</span>
              <span className="text-sm font-black text-slate-100">{metrics.totalClients}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block font-mono">Activas</span>
              <span className="text-sm font-black text-emerald-400">{metrics.activeCount}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block font-mono">Por Vencer (&le;5d)</span>
              <span className="text-sm font-black text-amber-400">{metrics.warningCount}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block font-mono">Vencidas / Bloq.</span>
              <span className="text-sm font-black text-rose-400">{metrics.expiredCount}</span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 border-b border-slate-800 bg-slate-900 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Imprentas & Suscripciones ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Dar de Alta Cliente (Nueva Imprenta)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin_config')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'admin_config'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Contacto Renovación</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: LISTA DE IMPRENTAS & CLIENTES */}
          {activeTab === 'list' && (
            <div className="flex flex-col gap-4">
              {/* Barra de Filtros y Búsqueda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de imprenta, usuario o responsable..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">Estado:</span>
                  {(['all', 'active', 'warning', 'expired'] as const).map((filter) => {
                    const labels = {
                      all: 'Todos',
                      active: 'Activas',
                      warning: 'Por Vencer',
                      expired: 'Vencidas',
                    };
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          statusFilter === filter
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {labels[filter]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Tarjetas de Imprentas */}
              <div className="flex flex-col gap-3">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold">No se encontraron imprentas o clientes</p>
                    <p className="text-xs text-slate-600 mt-1">Prueba cambiando los filtros de búsqueda</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const subInfo = checkUserSubscription(u);
                    const isSystemAdmin = u.isSystemAdmin || u.role === 'admin';

                    return (
                      <div
                        key={u.id}
                        className={`bg-slate-900/90 border rounded-xl p-4 transition-all shadow-md ${
                          subInfo.isExpired && !isSystemAdmin
                            ? 'border-rose-500/40 bg-rose-950/10'
                            : subInfo.isWarning && !isSystemAdmin
                            ? 'border-amber-500/40 bg-amber-950/10'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isEditing ? (
                          /* MODO EDICIÓN */
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5" />
                                Modificar Datos y Suscripción: @{u.username}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="text-xs text-slate-400 hover:text-slate-200"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                  Nombre de la Imprenta
                                </label>
                                <input
                                  type="text"
                                  value={editCompanyName}
                                  onChange={(e) => setEditCompanyName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                  Contacto Responsable
                                </label>
                                <input
                                  type="text"
                                  value={editFullName}
                                  onChange={(e) => setEditFullName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                  Contraseña / PIN
                                </label>
                                <input
                                  type="text"
                                  value={editPin}
                                  onChange={(e) => setEditPin(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 outline-none focus:border-amber-400"
                                />
                              </div>

                              {!isSystemAdmin && (
                                <div>
                                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                    Fecha de Vencimiento de Suscripción
                                  </label>
                                  <input
                                    type="date"
                                    value={editExpiryDate}
                                    onChange={(e) => setEditExpiryDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                  Teléfono / WhatsApp
                                </label>
                                <input
                                  type="text"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  placeholder="+595 981 ..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                                  Rol en la App
                                </label>
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                                >
                                  <option value="imprenta">Cliente / Imprenta Suscrita</option>
                                  <option value="cotizador">Cotizador Técnico</option>
                                  <option value="taller">Taller / Operador</option>
                                  <option value="admin">Administrador Total</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(u.id)}
                                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                              >
                                Guardar Cambios
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MODO VISTA NORMAL */
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Datos de la Imprenta */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${u.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}
                              >
                                {u.companyName ? u.companyName.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-100">
                                    {u.companyName || u.fullName}
                                  </h4>

                                  {/* Badge de Rol */}
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    {u.roleLabel || u.role}
                                  </span>

                                  {/* Badge de Estado de Suscripción */}
                                  {isSystemAdmin ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                                      <Shield className="w-3 h-3" />
                                      Acceso Perpetuo Admin
                                    </span>
                                  ) : subInfo.isExpired ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono animate-pulse">
                                      <Lock className="w-3 h-3" />
                                      Vencida / Bloqueada ({subInfo.formattedExpiresAt})
                                    </span>
                                  ) : subInfo.isWarning ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono">
                                      <Clock className="w-3 h-3" />
                                      Por Vencer ({subInfo.daysRemaining} días)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Activa ({subInfo.daysRemaining} días)
                                    </span>
                                  )}

                                  {u.subscriptionActive === false && !isSystemAdmin && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                      Pausada Manualmente
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                  <span className="flex items-center gap-1 font-mono">
                                    <span className="text-slate-500">Usuario:</span>
                                    <strong className="text-slate-200">@{u.username}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-mono">
                                    <KeyRound className="w-3 h-3 text-amber-400" />
                                    <span className="text-slate-500">PIN:</span>
                                    <span
                                      className="text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] flex items-center gap-1.5"
                                      title="PIN de seguridad protegido. Se remite de forma privada al titular por correo electrónico."
                                    >
                                      <Lock className="w-3 h-3 text-emerald-400" />
                                      <span>••••••••</span>
                                      <span className="text-[10px] text-sky-400 font-sans hidden sm:inline">(Enviado por Correo)</span>
                                    </span>
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-400">
                                    Contacto: {u.fullName}
                                  </span>
                                </div>

                                {!isSystemAdmin && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Vence:</span>
                                    <strong
                                      className={
                                        subInfo.isExpired
                                          ? 'text-rose-400 font-semibold'
                                          : subInfo.isWarning
                                          ? 'text-amber-400 font-semibold'
                                          : 'text-slate-300 font-medium'
                                      }
                                    >
                                      {formatDateForDisplay(u.subscriptionExpiresAt)}
                                    </strong>
                                    {u.contactPhone && (
                                      <span className="text-slate-500 ml-2">
                                        • Tel: {u.contactPhone}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botones de Acción de Suscripción */}
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                              {!isSystemAdmin && (
                                <>
                                  {/* Botón Renovar +30 Días */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickRenew(u.id, 30, u.companyName || u.fullName)
                                    }
                                    title="Renovar 30 días de suscripción mensual"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>+30 Días</span>
                                  </button>

                                  {/* Botón Renovar +90 Días */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickRenew(u.id, 90, u.companyName || u.fullName)
                                    }
                                    title="Renovar 90 días (Trimestre)"
                                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                                  >
                                    +90d
                                  </button>

                                  {/* Pausar / Reactivar */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleActive(u.id, u.subscriptionActive, u.companyName || u.fullName)
                                    }
                                    title={u.subscriptionActive === false ? 'Reactivar acceso' : 'Pausar acceso'}
                                    className={`p-1.5 rounded-lg text-xs transition-all ${
                                      u.subscriptionActive === false
                                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                    }`}
                                  >
                                    {u.subscriptionActive === false ? (
                                      <Play className="w-3.5 h-3.5" />
                                    ) : (
                                      <Pause className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </>
                              )}

                              {/* Copiar credenciales */}
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(u)}
                                title="Copiar credenciales formateadas para enviar por WhatsApp"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1 text-xs"
                              >
                                {copiedId === u.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Enviar PIN de acceso por correo */}
                              <button
                                type="button"
                                onClick={() => handleSendPinEmail(u)}
                                title={u.contactEmail ? `Enviar PIN de acceso por correo a ${u.contactEmail}` : 'Enviar PIN de acceso por correo'}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-sky-200 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                              >
                                <Mail className="w-3.5 h-3.5 text-sky-400" />
                                <span className="hidden sm:inline">Enviar PIN</span>
                              </button>

                              {/* Editar */}
                              <button
                                type="button"
                                onClick={() => startEdit(u)}
                                title="Editar datos y fecha de expiración"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Eliminar (si no es admin protegido) */}
                              {!u.isSystemAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(u)}
                                  title="Dar de baja imprenta"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DAR DE ALTA NUEVA IMPRENTA (FORMULARIO) */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="max-w-2xl mx-auto flex flex-col gap-5">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">
                    Registro de Nueva Imprenta & Configuración de Suscripción Mensual
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Define las credenciales que usará el cliente para ingresar y la fecha límite de pago tras la cual se bloquearán las funciones de cálculo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nombre de la Imprenta / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Gráfica del Sol S.A."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Contacto Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lic. Carlos Gómez"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Nombre de Usuario (Login) *</span>
                    <span className="text-[10px] text-amber-400 font-mono">Sin @ ni espacios</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: graficaed"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/[@\s]/g, '').toLowerCase())}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasteText = e.clipboardData.getData('text');
                      setNewUsername(pasteText.replace(/[@\s]/g, '').toLowerCase());
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Solo letras minúsculas, números o guiones (arrobas y espacios se limpian automáticamente)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Contraseña / PIN de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sol2026"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Mínimo 4 caracteres (se compartirá al cliente)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Rol Asignado
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  >
                    <option value="imprenta">Cliente / Imprenta Suscrita (Recomendado)</option>
                    <option value="cotizador">Cotizador Técnico Senior</option>
                    <option value="taller">Jefe de Taller / Operador</option>
                    <option value="admin">Administrador Total (Sin Vencimiento)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Plan Contratado
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Plan Mensual Estándar"
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>

                {newRole !== 'admin' && (
                  <div className="sm:col-span-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <label className="text-xs font-bold text-slate-200 block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Fecha Límite de la Suscripción Mensual (Vencimiento) *
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-normal">
                        Al llegar a esta fecha, el sistema bloqueará las funciones
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
                      <input
                        type="date"
                        required
                        value={newExpiryDate}
                        onChange={(e) => setNewExpiryDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                      />

                      {/* Accesos rápidos de selección de período */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-mono mr-1">Períodos:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                            setNewExpiryDate(d.toISOString().slice(0, 10));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                        >
                          1 Mes (30 días)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                            setNewExpiryDate(d.toISOString().slice(0, 10));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                        >
                          2 Meses (60 días)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                            setNewExpiryDate(d.toISOString().slice(0, 10));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                        >
                          3 Meses (90 días)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                            setNewExpiryDate(d.toISOString().slice(0, 10));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                        >
                          1 Año (365 días)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Teléfono / WhatsApp de la Imprenta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +595 981 123456"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@imprenta.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notas Internas o del Contrato
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el acuerdo de pago, cuota mensual o condiciones de servicio..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Dar de Alta & Asignar Suscripción</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CONFIGURACIÓN DE CONTACTO DEL ADMIN */}
          {activeTab === 'admin_config' && (
            <form onSubmit={handleSaveAdminConfig} className="max-w-xl mx-auto flex flex-col gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Información de Contacto para Renovaciones
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Estos datos aparecerán en la pantalla de bloqueo cuando la suscripción de un cliente expire, permitiéndoles contactarte directamente por WhatsApp o correo con 1 clic para renovar su pago.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre del Administrador / Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={adminContact.name}
                  onChange={(e) => setAdminContact({ ...adminContact, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Número de Teléfono / WhatsApp para Pagos *
                </label>
                <input
                  type="text"
                  required
                  value={adminContact.phone}
                  onChange={(e) => setAdminContact({ ...adminContact, phone: e.target.value })}
                  placeholder="+595 981 123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Incluye el código de país (ej: +595 para Paraguay, +54 para Argentina, etc.)
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Correo Electrónico de Soporte / Facturación *
                </label>
                <input
                  type="email"
                  required
                  value={adminContact.email}
                  onChange={(e) => setAdminContact({ ...adminContact, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Datos de Contacto</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Modal con Sincronizar Base Local y Restaurar Demo */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] text-slate-300">
              Almacenamiento: Sincronizado en la Nube & Local
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await syncWithCloudDatabase();
                refreshList();
                setFeedbackMsg({
                  type: 'success',
                  text: `¡Sincronizado con la nube con éxito! ${res.usersCount} usuarios e imprentas verificados para todos los computadores.`,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all shadow-sm"
              title="Sincronizar usuarios con Firebase para que estén disponibles en todas las computadoras"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronizar Nube (Todos los Equipos)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    '¿Deseas restablecer los usuarios de prueba predeterminados (incluyendo imprentas activas y de prueba vencida)?'
                  )
                ) {
                  resetToDefaultUsers();
                  refreshList();
                  setFeedbackMsg({ type: 'success', text: 'Usuarios e imprentas demo restablecidos.' });
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-300 hover:underline px-1"
            >
              <span>Restablecer Imprentas Demo</span>
            </button>
          </div>
        </div>

        {/* Modal de Confirmación de Baja */}
        {userToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                ¿Dar de baja a "{userToDelete.companyName || userToDelete.fullName}"?
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Esta acción eliminará la cuenta del cliente y sus credenciales de acceso.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-950/50"
                >
                  Confirmar Baja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

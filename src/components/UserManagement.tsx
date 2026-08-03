import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  UserPlus, 
  RefreshCw, 
  Check, 
  X, 
  Lock, 
  Activity, 
  FileText, 
  Download, 
  Crown,
  Key,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { AuditLog } from '../types';
import { apiFetchJson, parseApiError } from '../lib/api';

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Organization Admin' | 'Security Analyst' | 'Researcher' | 'Viewer';
  status: 'active' | 'suspended' | 'pending';
  organization_id: string;
  organization_name?: string;
  created_at: string;
  isMasterAccount?: boolean;
}

interface UserManagementProps {
  currentUserEmail: string;
  onOpenUpgradeModal?: () => void;
}

export default function UserManagement({ currentUserEmail, onOpenUpgradeModal }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Security Analyst' as ManagedUser['role'],
    password: 'DefenderPassword2026!'
  });
  const [isInviting, setIsInviting] = useState<boolean>(false);

  // Edit Role Modal
  const [selectedUserForRole, setSelectedUserForRole] = useState<ManagedUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<ManagedUser['role']>('Security Analyst');

  const isMasterUser = currentUserEmail.toLowerCase() === 'engr.buru@gmail.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, logsData] = await Promise.all([
        apiFetchJson<ManagedUser[]>('/api/admin/users').catch(() => apiFetchJson<ManagedUser[]>('/api/org/users')),
        apiFetchJson<AuditLog[]>('/api/admin/audit-logs').catch(() => apiFetchJson<AuditLog[]>('/api/org/audit'))
      ]);
      setUsers(usersData || []);
      setAuditLogs(logsData || []);
    } catch (err: any) {
      console.error('Failed to load management data:', err);
      setError(err.message || 'Failed to load user and audit records.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ManagedUser['role']) => {
    try {
      setError('');
      setSuccessMsg('');
      const updated = await apiFetchJson<{ message: string; user: ManagedUser }>(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSelectedUserForRole(null);
      setSuccessMsg(`Successfully updated role for ${updated.user?.email || 'user'} to '${newRole}'.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setError('');
      setSuccessMsg('');
      const updated = await apiFetchJson<{ message: string; user: ManagedUser }>(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
      setSuccessMsg(`Successfully changed status for ${updated.user?.email || 'user'} to '${newStatus}'.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.name) return;

    setIsInviting(true);
    setError('');
    setSuccessMsg('');

    try {
      const created = await apiFetchJson<ManagedUser>('/api/org/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });

      setUsers(prev => [created, ...prev]);
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'Security Analyst', password: 'DefenderPassword2026!' });
      setSuccessMsg(`Defender user ${created.email} provisioned successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to invite user.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleExportAuditLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `karrents_security_audit_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredUsers = users.filter(u => {
    const matchesQuery = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const q = logSearchQuery.toLowerCase();
    return log.user_email.toLowerCase().includes(q) ||
           log.action.toLowerCase().includes(q) ||
           log.details.toLowerCase().includes(q) ||
           log.ip_address.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-neon/10 border border-brand-neon/30 rounded-xl text-brand-neon">
            <Crown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Master User & Audit Console</h1>
              {isMasterUser && (
                <span className="bg-brand-neon/15 border border-brand-neon/30 text-brand-neon text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-brand-neon" />
                  <span>MASTER SUPER ADMIN</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Global defender directory, multi-organization role assignment, and security audit log feed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-berry hover:bg-brand-plum text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-brand-neon/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Defender User</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-brand-neon text-brand-neon font-mono'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-brand-neon text-brand-neon font-mono'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Master Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USER & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon font-mono"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-brand-neon"
              >
                <option value="all">All Security Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Organization Admin">Organization Admin</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Researcher">Researcher</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/80 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Defender User</th>
                  <th className="py-3.5 px-4">Security Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Provisioned Date</th>
                  <th className="py-3.5 px-4 text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 text-xs font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-neon mb-2" />
                      Loading defender user records...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No defender users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isMaster = u.email.toLowerCase() === 'engr.buru@gmail.com';
                    return (
                      <tr key={u.id} className="hover:bg-zinc-850/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMaster ? 'bg-brand-neon/20 border-brand-neon text-brand-neon' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white leading-tight">{u.name}</span>
                                {isMaster && (
                                  <span title="Master Super Admin">
                                    <Crown className="w-3.5 h-3.5 text-brand-neon" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.role === 'Super Admin' 
                              ? 'bg-brand-plum/20 text-brand-neon border-brand-neon/30' 
                              : u.role === 'Organization Admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : u.role === 'Security Analyst'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {u.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-300">
                          {u.organization_name || 'Master Org'}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-500 text-[10px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUserForRole(u);
                                setSelectedNewRole(u.role);
                              }}
                              disabled={isMaster}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-md border border-zinc-700 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Edit Role
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              disabled={isMaster}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors disabled:opacity-40 cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search audit trail by action, email, or IP..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon font-mono"
              />
            </div>

            <button
              onClick={handleExportAuditLogs}
              className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 transition-colors font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-brand-neon" />
              <span>Export Audit Trail (JSON)</span>
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/80 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Security Action</th>
                  <th className="py-3.5 px-4">Defender Email</th>
                  <th className="py-3.5 px-4">Audit Event Details</th>
                  <th className="py-3.5 px-4 text-right">Client Node IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 text-xs font-mono">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No security audit log entries match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-850/40 transition-colors">
                      <td className="py-3.5 px-4 text-zinc-400 text-[10px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                          log.action.includes('REGISTER') || log.action.includes('LOGIN')
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : log.action.includes('ROLE') || log.action.includes('STATUS')
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-zinc-200">
                        {log.user_email}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {log.details}
                      </td>

                      <td className="py-3.5 px-4 text-right text-zinc-500 text-[10px]">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITE USER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-neon" />
                <h3 className="text-sm font-bold text-white">Invite Defender User</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Security Engineer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-neon"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Corporate Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="engineer@company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-neon"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Security Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-neon"
                >
                  <option value="Organization Admin">Organization Admin</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 bg-brand-berry hover:bg-brand-plum text-white font-bold rounded-lg border border-brand-neon/30"
                >
                  {isInviting ? 'Provisioning...' : 'Provision Defender User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Security Role</h3>
              <button onClick={() => setSelectedUserForRole(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-400 space-y-1">
              <span>Target User:</span>
              <div className="font-bold text-white">{selectedUserForRole.email}</div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Assigned Role</label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-neon"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Organization Admin">Organization Admin</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Researcher">Researcher</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRole(selectedUserForRole.id, selectedNewRole)}
                className="px-4 py-2 bg-brand-berry hover:bg-brand-plum text-white font-bold rounded-lg border border-brand-neon/30 text-xs font-mono"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

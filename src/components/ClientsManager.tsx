import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  FolderGit2,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Briefcase,
  X
} from 'lucide-react';
import { Client, Project } from '../types';
import { apiFetchJson } from '../lib/api';

interface ClientsManagerProps {
  onSelectClient?: (clientId: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export default function ClientsManager({ onSelectClient, onSelectProject }: ClientsManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Client Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_email: '',
    contact_phone: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchJson<Client[]>('/api/clients');
      setClients(data || []);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      // Clean production state fallback if DB not connected yet
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiFetchJson<Client>('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setClients((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: '', industry: '', contact_email: '', contact_phone: '', notes: '' });
    } catch (err: any) {
      console.error('Create client failed:', err);
      setError(err.message || 'Failed to create client record.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadClientDetails = async (client: Client) => {
    setSelectedClient(client);
    if (onSelectClient) onSelectClient(client.id);
    try {
      const projects = await apiFetchJson<Project[]>(`/api/clients/${client.id}/projects`);
      setClientProjects(projects || []);
    } catch {
      setClientProjects([]);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Clients Directory</h1>
              <p className="text-sm text-slate-400">
                Commercial assessment scope boundaries and client security posture mapping
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Onboard New Client
        </button>
      </div>

      {/* Main Grid: Client List & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients by name or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2.5 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading client registry...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-medium text-slate-300">No Clients Registered</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No active client organizations found in PostgreSQL registry. Click "Onboard New Client" to start an assessment scope.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => loadClientDetails(client)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-900/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {client.name}
                        </h4>
                        {client.industry && (
                          <span className="inline-block px-2 py-0.5 bg-slate-800 text-[11px] font-medium text-slate-300 rounded">
                            {client.industry}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                        {client.projects_count ?? 0} Active Projects
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Added {new Date(client.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Client Workspaces */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6 backdrop-blur-md">
              <div className="flex items-start justify-between border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{selectedClient.name}</h2>
                    {selectedClient.industry && (
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 rounded-md">
                        {selectedClient.industry}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Client ID: {selectedClient.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Active Scope
                  </span>
                </div>
              </div>

              {/* Client Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Contact Email
                  </span>
                  <p className="text-sm font-medium text-slate-200">
                    {selectedClient.contact_email || 'Not specified'}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Reference
                  </span>
                  <p className="text-sm font-medium text-slate-200">
                    {selectedClient.contact_phone || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Client Scope Projects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-blue-400" />
                    Engaged Assessment Projects ({clientProjects.length})
                  </h3>
                </div>

                {clientProjects.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No security assessment projects launched for this client yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clientProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => onSelectProject && onSelectProject(proj.id)}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">{proj.name}</h4>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase rounded">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Assets: {proj.assets_count ?? 0}</span>
                          <span>Findings: {proj.findings_count ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-8 text-center">
              <Building2 className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Select a Client</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a client from the registry on the left to inspect assessment projects, contact information, and risk exposure profiles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Onboard Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Onboard Client Organization
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Financial Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Banking & Fintech, Healthcare, Cloud Infrastructure"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="security@client.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2831"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assessment Scope Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Authorization details, NDA references, regulatory compliance scope..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                >
                  {submitting ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

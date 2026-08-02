import React, { useState, useEffect } from 'react';
import {
  Building2,
  FolderGit2,
  Layers,
  ShieldAlert,
  Activity,
  FileText,
  Clock,
  Plus,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Download,
  Flame,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Client, Project, Finding, Asset, Report, AuditLog } from '../types';
import { apiFetchJson } from '../lib/api';

interface DashboardProps {
  onNavigateToSection: (section: 'dashboard' | 'clients' | 'projects' | 'assets' | 'findings' | 'saved-reports' | 'profile') => void;
  onSelectProject?: (projectId: string) => void;
  onSelectClient?: (clientId: string) => void;
}

export default function Dashboard({ onNavigateToSection, onSelectProject, onSelectClient }: DashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [clientList, projList, findingList, assetList, auditList] = await Promise.all([
        apiFetchJson<Client[]>('/api/clients').catch(() => []),
        apiFetchJson<Project[]>('/api/projects').catch(() => []),
        apiFetchJson<Finding[]>('/api/findings').catch(() => []),
        apiFetchJson<Asset[]>('/api/assets').catch(() => []),
        apiFetchJson<AuditLog[]>('/api/org/audit').catch(() => [])
      ]);

      setClients(clientList || []);
      setProjects(projList || []);
      setAllFindings(findingList || []);
      setAllAssets(assetList || []);
      setAuditLogs(auditList || []);
    } catch (err) {
      console.error('Failed to load dashboard state:', err);
    } finally {
      setLoading(false);
    }
  };

  const criticalFindingsCount = allFindings.filter((f) => f.severity === 'CRITICAL').length;
  const highFindingsCount = allFindings.filter((f) => f.severity === 'HIGH').length;

  const severityChartData = [
    { name: 'Critical', count: criticalFindingsCount, fill: '#ef4444' },
    { name: 'High', count: highFindingsCount, fill: '#f97316' },
    { name: 'Medium', count: allFindings.filter((f) => f.severity === 'MEDIUM').length, fill: '#f59e0b' },
    { name: 'Low', count: allFindings.filter((f) => f.severity === 'LOW').length, fill: '#3b82f6' },
    { name: 'Info', count: allFindings.filter((f) => f.severity === 'INFO').length, fill: '#64748b' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-md">
              Security Assessment Workspace
            </span>
            <span className="text-xs text-slate-500">• Production Environment</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Assessment Overview</h1>
          <p className="text-sm text-slate-400">
            Real-time client scope, project engagements, asset inventory, and vulnerability correlation matrix
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToSection('clients')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Manage Clients
          </button>
          <button
            onClick={() => onNavigateToSection('projects')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            Launch Project Scope
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Strict Relational Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Clients KPI */}
        <div
          onClick={() => onNavigateToSection('clients')}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all space-y-3 backdrop-blur-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clients</span>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{clients.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Client Organizations</span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>

        {/* Projects KPI */}
        <div
          onClick={() => onNavigateToSection('projects')}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl cursor-pointer transition-all space-y-3 backdrop-blur-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{projects.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Assessment Engagements</span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>

        {/* Assets KPI */}
        <div
          onClick={() => onNavigateToSection('assets')}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl cursor-pointer transition-all space-y-3 backdrop-blur-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assets</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{allAssets.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Discovered Targets</span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>

        {/* Findings KPI */}
        <div
          onClick={() => onNavigateToSection('findings')}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-red-500/40 rounded-2xl cursor-pointer transition-all space-y-3 backdrop-blur-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Findings</span>
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-white font-mono">{allFindings.length}</div>
            {criticalFindingsCount > 0 && (
              <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                {criticalFindingsCount} Critical
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Actionable Vulnerabilities</span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* Main Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Vulnerability Severity Breakdown</h3>
              <p className="text-xs text-slate-400">Validated security findings across all client projects</p>
            </div>

            <button
              onClick={() => onNavigateToSection('findings')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Findings Database <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {allFindings.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/30 text-center p-6 space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-300">Clean Database State</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                No findings have been recorded yet. Execute contextual scanners inside a Project or Asset view to populate findings.
              </p>
            </div>
          ) : (
            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Client & Project Quick Matrix */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Recent Client Scope
          </h3>

          {clients.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30 space-y-2">
              <Building2 className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-400">No client organizations onboarded yet.</p>
              <button
                onClick={() => onNavigateToSection('clients')}
                className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
              >
                + Onboard First Client
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    if (onSelectClient) onSelectClient(c.id);
                    onNavigateToSection('clients');
                  }}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                    <span className="text-[11px] text-slate-400">{c.industry || 'General Sector'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

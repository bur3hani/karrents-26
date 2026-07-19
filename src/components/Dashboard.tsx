import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldAlert,
  Activity,
  FileText,
  Clock,
  Plus,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  User,
  ExternalLink,
  ChevronRight,
  Download
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Project, Finding, Asset, Report, AuditLog } from '../types';

interface DashboardProps {
  onLaunchTool: (toolName: string) => void;
  onNavigateToSection: (section: 'dashboard' | 'tools' | 'mitre' | 'settings' | 'kb' | 'docs' | 'api' | 'pricing' | 'profile' | 'notifications' | 'saved-reports') => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export default function Dashboard({ onLaunchTool, onNavigateToSection, selectedProjectId, setSelectedProjectId }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch active projects
        const projRes = await fetch('/api/projects');
        if (!projRes.ok) throw new Error("Failed to load projects.");
        const projData = await projRes.json();
        const activeProjects: Project[] = projData.projects || [];
        setProjects(activeProjects);

        // Fetch audit logs
        const auditRes = await fetch('/api/organizations/audit-logs');
        let logs: AuditLog[] = [];
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          logs = auditData.logs || [];
          setAuditLogs(logs);
        }

        // Fetch assets, findings, and reports for ALL projects in parallel
        const assetsAccum: Asset[] = [];
        const findingsAccum: Finding[] = [];
        const reportsAccum: Report[] = [];

        await Promise.all(
          activeProjects.map(async (p) => {
            try {
              const [assetsRes, findingsRes, reportsRes] = await Promise.all([
                fetch(`/api/projects/${p.id}/assets`),
                fetch(`/api/projects/${p.id}/findings`),
                fetch(`/api/projects/${p.id}/reports`),
              ]);

              if (assetsRes.ok) {
                const assetsData = await assetsRes.json();
                assetsAccum.push(...(assetsData.assets || []));
              }
              if (findingsRes.ok) {
                const findingsData = await findingsRes.json();
                findingsAccum.push(...(findingsData.findings || []));
              }
              if (reportsRes.ok) {
                const reportsData = await reportsRes.json();
                reportsAccum.push(...(reportsData.reports || []));
              }
            } catch (err) {
              console.error(`Error loading details for project ${p.id}:`, err);
            }
          })
        );

        setAllAssets(assetsAccum);
        setAllFindings(findingsAccum);
        setAllReports(reportsAccum);

      } catch (err: any) {
        console.error("Dashboard hydration error:", err);
        setError(err.message || "Failed to load real-time workspace metrics.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Filter based on selected project
  const filteredProjects = selectedProjectId 
    ? projects.filter(p => p.id === selectedProjectId)
    : projects;

  const filteredFindings = selectedProjectId
    ? allFindings.filter(f => f.project_id === selectedProjectId)
    : allFindings;

  const filteredAssets = selectedProjectId
    ? allAssets.filter(a => a.project_id === selectedProjectId)
    : allAssets;

  const filteredReports = selectedProjectId
    ? allReports.filter(r => r.project_id === selectedProjectId)
    : allReports;

  // Aggregate stats
  const openFindings = filteredFindings.filter(f => f.status !== 'remediated' && f.status !== 'false_positive');
  const criticalFindings = filteredFindings.filter(f => f.severity === 'Critical' || f.severity === 'High');
  const activeAssets = filteredAssets.filter(a => a.status === 'active');

  // Chart data: Distribution of findings by severity (using REAL data)
  const severities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
  const severityDistribution = severities.map(sev => {
    const count = filteredFindings.filter(f => f.severity.toLowerCase() === sev.toLowerCase()).length;
    let fill = '#3b82f6';
    if (sev === 'Critical') fill = '#ef4444';
    if (sev === 'High') fill = '#f97316';
    if (sev === 'Medium') fill = '#eab308';
    if (sev === 'Low') fill = '#22c55e';
    if (sev === 'Informational') fill = '#a1a1aa';

    return { name: sev, Count: count, fill };
  });

  const totalFindingsCount = filteredFindings.length;

  if (loading) {
    return (
      <div id="dashboard-loading" className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-zinc-500">Retrieving operational intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div id="dashboard-error" className="bg-red-950/20 border border-red-900/40 p-6 rounded-xl space-y-2 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-zinc-200">Workspace Hydration Failure</h3>
        <p className="text-xs text-zinc-400">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs font-mono text-blue-400 hover:underline">
          Retry Sync Request
        </button>
      </div>
    );
  }

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Scope Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/40">
        <div className="space-y-0.5">
          <h2 className="text-lg font-black text-white">Workspace Overview</h2>
          <p className="text-xs text-zinc-500">Live operational data synced directly from active organization directories.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Workspace Scope:</span>
          <select
            id="scope-project-selector"
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value ? e.target.value : null)}
            className="bg-zinc-900 border border-zinc-800 text-xs font-semibold rounded-lg text-zinc-300 py-1.5 px-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Projects Combined</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Projects</span>
            <div className="text-2xl font-black text-white font-mono">{projects.length}</div>
            <span className="text-[10px] text-zinc-500">Assigned client namespaces</span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <FolderKanban className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Registered Assets</span>
            <div className="text-2xl font-black text-white font-mono">{activeAssets.length}</div>
            <span className="text-[10px] text-zinc-500">Auditable network endpoints</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Open Findings</span>
            <div className="text-2xl font-black text-white font-mono">{openFindings.length}</div>
            <span className="text-[10px] text-zinc-500">Awaiting patch validation</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Critical & High</span>
            <div className="text-2xl font-black text-white font-mono text-red-500">{criticalFindings.length}</div>
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              Urgent mitigation required
            </span>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>

      {/* Main bento split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left col: Projects & Findings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Projects List */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Recent Projects ({filteredProjects.length})
              </h3>
              <button
                onClick={() => onNavigateToSection('saved-reports')}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-mono"
              >
                Manage Workspaces <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 space-y-2">
                <FolderKanban className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">No active project workspaces discovered under this organization context.</p>
                <button
                  onClick={() => onNavigateToSection('saved-reports')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProjects.slice(0, 4).map(p => {
                  const pFindings = allFindings.filter(f => f.project_id === p.id);
                  const pAssets = allAssets.filter(a => a.project_id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProjectId(p.id); onNavigateToSection('saved-reports'); }}
                      className="bg-zinc-950/40 hover:bg-zinc-850 border border-zinc-800/60 hover:border-blue-500/40 p-4 rounded-xl cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-zinc-100 group-hover:text-blue-400 transition-colors">{p.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 min-h-[32px]">{p.description || "No workspace description compiled."}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 border-t border-zinc-800/40 pt-2">
                        <span>Findings: <strong className="text-zinc-300">{pFindings.length}</strong></span>
                        <span>Assets: <strong className="text-zinc-300">{pAssets.length}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Open Findings / Vulnerabilities Table */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Active Findings Watchlist ({openFindings.length})
              </h3>
            </div>

            {openFindings.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 space-y-1.5">
                <ShieldAlert className="w-8 h-8 mx-auto stroke-1 text-green-400/80" />
                <p className="text-xs font-semibold text-zinc-400">Outstanding Posture Secured</p>
                <p className="text-[10px] text-zinc-500">Zero open vulnerabilities are active in this scope.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-400">
                  <thead>
                    <tr className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/30 pb-2">
                      <th className="pb-2">Vulnerability</th>
                      <th className="pb-2">Severity</th>
                      <th className="pb-2">CVSS</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20">
                    {openFindings.slice(0, 6).map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-800/10 transition-colors">
                        <td className="py-3 font-semibold text-zinc-200 max-w-[200px] truncate">{f.title}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            f.severity === 'Critical' ? 'bg-red-500/15 text-red-500 border border-red-500/25' :
                            f.severity === 'High' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                            f.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' :
                            'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                          }`}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-zinc-300">{f.cvss_score.toFixed(1)}</td>
                        <td className="py-3 text-[10px] text-zinc-400 uppercase font-bold">{f.status.replace('_', ' ')}</td>
                        <td className="py-3 text-right font-mono text-[10px] text-zinc-500">{f.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Severity Chart, Assets, and Audits */}
        <div className="space-y-6">
          
          {/* Dynamic Severity Distribution Chart (Derived from REAL DB data) */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Live Vulnerability Metrics
            </h3>
            {totalFindingsCount === 0 ? (
              <div className="h-40 flex items-center justify-center text-center text-zinc-500 text-xs">
                No telemetry available.<br />Register findings to generate real metrics.
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityDistribution} layout="vertical" barSize={10}>
                    <XAxis type="number" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} hide />
                    <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '10px' }}
                    />
                    <Bar dataKey="Count" fill="#3b82f6" radius={[0, 3, 3, 0]}>
                      {severityDistribution.map((entry, index) => (
                        <rect key={`rect-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Assets List */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Registered Client Assets ({filteredAssets.length})
              </h3>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 text-xs font-mono">
                No active assets registered.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.slice(0, 4).map(asset => (
                  <div key={asset.id} className="bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-200 truncate max-w-[150px]">{asset.name}</div>
                      <div className="text-[9px] text-zinc-500 font-mono">{asset.type} | Owner: {asset.owner}</div>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                      asset.risk_score >= 70 ? 'bg-red-500/10 text-red-400' :
                      asset.risk_score >= 35 ? 'bg-orange-500/10 text-orange-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      Risk {asset.risk_score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Reports Dispatch */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Recent Compiled Reports ({filteredReports.length})
            </h3>

            {filteredReports.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 text-xs font-mono">
                No reports generated yet.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReports.slice(0, 3).map(rep => (
                  <div key={rep.id} className="bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between">
                    <div className="max-w-[160px]">
                      <div className="text-[11px] font-bold text-zinc-200 truncate">{rep.title}</div>
                      <div className="text-[9px] text-zinc-500">Status: <span className="uppercase text-zinc-400">{rep.status}</span></div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={`/api/reports/${rep.id}/export/json`}
                        download
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Export JSON"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                      <a
                        href={`/api/reports/${rep.id}/export/markdown`}
                        download
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Export Markdown"
                      >
                        <FileText className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit / Security Activity */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Security Audit Activity
            </h3>
            {auditLogs.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 text-xs font-mono">
                No activity records logged.
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold font-mono">
                      <span className="text-blue-400">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-300 text-[10.5px] leading-snug">
                      {log.details}
                    </p>
                    <div className="text-[9px] text-zinc-500 font-mono">
                      Actor: {log.user_email} | IP: {log.ip_address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

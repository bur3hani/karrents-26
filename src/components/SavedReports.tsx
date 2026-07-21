import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Calendar, 
  Shield, 
  Activity, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle,
  FileCode,
  Plus,
  Layers,
  Briefcase,
  Cpu,
  BadgeAlert,
  X,
  PlusCircle,
  FileDown
} from 'lucide-react';
import { Project, Asset, Finding, Evidence, Report } from '../types';
import { apiFetch, parseApiError } from '../lib/api';

interface SavedReportsProps {
  onNavigateToTool?: (toolName: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export default function SavedReports({ onNavigateToTool, selectedProjectId, setSelectedProjectId }: SavedReportsProps) {
  // DB States
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // UI Selection Contexts
  const [activeTab, setActiveTab] = useState<'projects' | 'assets' | 'findings' | 'reports'>('projects');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Creator States
  const [showProjModal, setShowProjModal] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');

  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetType, setNewAssetType] = useState<Asset['type']>('Domain');
  const [newAssetNotes, setNewAssetNotes] = useState<string>('');
  const [newAssetRisk, setNewAssetRisk] = useState<number>(0);
  const [newAssetOwner, setNewAssetOwner] = useState<string>('');

  const [showFindingModal, setShowFindingModal] = useState<boolean>(false);
  const [newFindingTitle, setNewFindingTitle] = useState<string>('');
  const [newFindingDesc, setNewFindingDesc] = useState<string>('');
  const [newFindingSeverity, setNewFindingSeverity] = useState<Finding['severity']>('Medium');
  const [newFindingCvss, setNewFindingCvss] = useState<number>(5.0);
  const [newFindingRec, setNewFindingRec] = useState<string>('');
  const [newFindingRef, setNewFindingRef] = useState<string>('');
  const [newFindingOwner, setNewFindingOwner] = useState<string>('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [evidenceFindingId, setEvidenceFindingId] = useState<string>('');
  const [newEvidenceType, setNewEvidenceType] = useState<Evidence['type']>('other');
  const [newEvidenceValue, setNewEvidenceValue] = useState<string>('');
  const [newEvidenceNotes, setNewEvidenceNotes] = useState<string>('');

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [newReportTitle, setNewReportTitle] = useState<string>('');
  const [newReportExec, setNewReportExec] = useState<string>('');
  const [newReportScope, setNewReportScope] = useState<string>('');
  const [newReportRisk, setNewReportRisk] = useState<string>('');
  const [newReportAppendices, setNewReportAppendices] = useState<string>('');

  const [activeReportDetails, setActiveReportDetails] = useState<Report | null>(null);

  // Sync core lists
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    } else {
      setAssets([]);
      setFindings([]);
      setReports([]);
    }
  }, [selectedProjectId]);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/projects');
      if (!res.ok) throw new Error("Failed to load project directories.");
      const data = await res.json();
      const projectsList = Array.isArray(data) ? data : (data.projects || data.data || []);
      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message || "Failed to load database projects.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectDetails(projId: string) {
    try {
      const [assetsRes, findingsRes, reportsRes] = await Promise.all([
        apiFetch(`/api/assets?projectId=${projId}`),
        apiFetch(`/api/findings?projectId=${projId}`),
        apiFetch(`/api/reports?projectId=${projId}`)
      ]);

      if (assetsRes.ok) {
        const d = await assetsRes.json();
        setAssets(Array.isArray(d) ? d : (d.assets || []));
      }
      if (findingsRes.ok) {
        const d = await findingsRes.json();
        setFindings(Array.isArray(d) ? d : (d.findings || []));
      }
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReports(Array.isArray(d) ? d : (d.reports || []));
      }
    } catch (err) {
      console.error("Failed to load workspace details:", err);
    }
  }

  // --------------------------------------------------------------------------
  // CREATORS
  // --------------------------------------------------------------------------

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjName, description: newProjDesc })
      });

      if (!res.ok) {
        const errorMsg = await parseApiError(res, "Failed to create project workspace.");
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const createdProject = data.project || data;
      if (createdProject && createdProject.id) {
        setProjects(prev => [...prev, createdProject]);
        setSelectedProjectId(createdProject.id);
      } else {
        throw new Error("Invalid project response payload returned by server.");
      }
      setNewProjName('');
      setNewProjDesc('');
      setShowProjModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newAssetName.trim()) return;

    try {
      const res = await apiFetch(`/api/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          name: newAssetName,
          type: newAssetType,
          notes: newAssetNotes,
          risk_score: Number(newAssetRisk),
          owner: newAssetOwner
        })
      });

      if (!res.ok) {
        const errorMsg = await parseApiError(res, "Failed to register client asset.");
        throw new Error(errorMsg);
      }

      const d = await res.json();
      setAssets(prev => [...prev, d]);
      setNewAssetName('');
      setNewAssetNotes('');
      setNewAssetRisk(0);
      setNewAssetOwner('');
      setShowAssetModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newFindingTitle.trim()) return;

    try {
      const res = await apiFetch(`/api/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: newFindingTitle,
          description: newFindingDesc,
          severity: newFindingSeverity,
          cvss_score: Number(newFindingCvss),
          recommendations: newFindingRec,
          references: newFindingRef.split('\n').filter(Boolean),
          owner: newFindingOwner,
          affectedAssetIds: selectedAssetIds
        })
      });

      if (!res.ok) {
        const errorMsg = await parseApiError(res, "Failed to log finding.");
        throw new Error(errorMsg);
      }

      const d = await res.json();
      setFindings(prev => [...prev, d]);
      setNewFindingTitle('');
      setNewFindingDesc('');
      setNewFindingRec('');
      setNewFindingRef('');
      setNewFindingOwner('');
      setSelectedAssetIds([]);
      setShowFindingModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFindingId || !newEvidenceValue.trim()) return;

    try {
      const res = await apiFetch(`/api/findings/${evidenceFindingId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newEvidenceType,
          value: newEvidenceValue,
          notes: newEvidenceNotes
        })
      });

      if (!res.ok) {
        const errorMsg = await parseApiError(res, "Failed to submit evidence.");
        throw new Error(errorMsg);
      }

      // Reload project details to sync evidence
      if (selectedProjectId) loadProjectDetails(selectedProjectId);

      setEvidenceFindingId('');
      setNewEvidenceValue('');
      setNewEvidenceNotes('');
      setShowEvidenceModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newReportTitle.trim()) return;

    try {
      const res = await apiFetch(`/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: newReportTitle,
          executive_summary: newReportExec,
          scope: newReportScope,
          risk_summary: newReportRisk,
          appendices: newReportAppendices
        })
      });

      if (!res.ok) {
        const errorMsg = await parseApiError(res, "Failed to compile security report.");
        throw new Error(errorMsg);
      }

      const d = await res.json();
      setReports(prev => [...prev, d]);
      setNewReportTitle('');
      setNewReportExec('');
      setNewReportScope('');
      setNewReportRisk('');
      setNewReportAppendices('');
      setShowReportModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // DELETERS
  // --------------------------------------------------------------------------

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the project '${name}' and ALL associated assets, findings, and reports? This cannot be undone.`)) return;

    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete project.");

      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Delete this registered client asset?")) return;

    try {
      const res = await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete asset.");
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteFinding = async (id: string) => {
    if (!window.confirm("Delete this logged vulnerability finding?")) return;

    try {
      const res = await apiFetch(`/api/findings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete finding.");
      setFindings(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Delete this compiled report?")) return;

    try {
      const res = await apiFetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete report.");
      setReports(prev => prev.filter(r => r.id !== id));
      if (activeReportDetails?.id === id) {
        setActiveReportDetails(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-neon border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-zinc-500">Connecting workspace registry...</span>
      </div>
    );
  }

  return (
    <div id="saved-reports-view" className="space-y-6">
      {/* Top Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-neon" />
            Workspace Assessment Builder & Registry
          </h2>
          <p className="text-xs text-zinc-400">
            Define client projects, map active network assets, log CVE vulnerability findings, and compile client reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'projects' && (
            <button
              id="new-project-btn"
              onClick={() => setShowProjModal(true)}
              className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          )}
          {activeTab === 'assets' && selectedProjectId && (
            <button
              id="new-asset-btn"
              onClick={() => setShowAssetModal(true)}
              className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Asset</span>
            </button>
          )}
          {activeTab === 'findings' && selectedProjectId && (
            <button
              id="new-finding-btn"
              onClick={() => setShowFindingModal(true)}
              className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Finding</span>
            </button>
          )}
          {activeTab === 'reports' && selectedProjectId && (
            <button
              id="new-report-btn"
              onClick={() => setShowReportModal(true)}
              className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compile Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/60 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 border-b-2 transition-all ${activeTab === 'projects' ? 'border-brand-neon text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Client Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 border-b-2 transition-all ${activeTab === 'assets' ? 'border-brand-neon text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Project Assets ({assets.length})
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2 border-b-2 transition-all ${activeTab === 'findings' ? 'border-brand-neon text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Vulnerability Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 border-b-2 transition-all ${activeTab === 'reports' ? 'border-brand-neon text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Reports & Exports ({reports.length})
        </button>
      </div>

      {/* Workspace Picker Info Bar */}
      {activeTab !== 'projects' && (
        <div className="flex items-center gap-2 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/40 text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Active Project Context:</span>
          <select
            id="workspace-picker-selector"
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value ? e.target.value : null)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-semibold focus:outline-none focus:border-brand-neon"
          >
            <option value="">-- No Project Selected --</option>
            {(projects || []).filter(p => p && p.id).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {!selectedProjectId && (
            <span className="text-amber-400 font-medium">⚠️ Please select or create a project context to view/manage elements.</span>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          1. CLIENT PROJECTS TAB
         ---------------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-16 text-center text-zinc-500 space-y-4">
              <Briefcase className="w-12 h-12 mx-auto stroke-1" />
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-300 text-sm">No Client Projects Registered</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Start mapping security postures by creating your first client namespace or active project directory.
                </p>
              </div>
              <button
                onClick={() => setShowProjModal(true)}
                className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Create Project Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(projects || []).filter(p => p && p.id).map(p => (
                <div
                  key={p.id}
                  className={`bg-zinc-900/40 border p-5 rounded-xl space-y-4 relative group hover:border-zinc-700 transition-colors cursor-pointer ${selectedProjectId === p.id ? 'border-brand-neon/60 bg-brand-neon/5 shadow' : 'border-zinc-800/50'}`}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-sm text-zinc-100">{p.name || "Unnamed Workspace"}</h3>
                      <span className="text-[9px] font-mono text-zinc-500">ID: {p.id}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.name); }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded border border-zinc-800 hover:border-red-500/30 transition-colors"
                      title="Delete Project & Cascade Dependencies"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed min-h-[48px]">
                    {p.description || "No workspace description compiled."}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-800/40">
                    <span>Created: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</span>
                    {selectedProjectId === p.id ? (
                      <span className="text-brand-neon font-bold flex items-center gap-1">
                        Active Context <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">Click to select</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          2. PROJECT ASSETS TAB
         ---------------------------------------------------------------------- */}
      {activeTab === 'assets' && selectedProjectId && (
        <div className="space-y-4">
          {assets.length === 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-12 text-center text-zinc-500 space-y-2">
              <Cpu className="w-10 h-10 mx-auto stroke-1" />
              <h3 className="font-bold text-zinc-300 text-sm">No Registered Assets</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Add IP addresses, domains, cloud containers, or application targets in scope for security checks.
              </p>
              <button
                onClick={() => setShowAssetModal(true)}
                className="bg-zinc-850 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg mt-2 font-semibold"
              >
                Register First Asset
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-900/20 border border-zinc-800/50 rounded-xl">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead>
                  <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 bg-zinc-900/40">
                    <th className="p-4">Asset Name / Endpoint</th>
                    <th className="p-4">Asset Class</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Risk Rating</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {assets.map(a => (
                    <tr key={a.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="p-4 font-bold text-zinc-200 select-all">{a.name}</td>
                      <td className="p-4 font-mono text-zinc-400">{a.type}</td>
                      <td className="p-4 font-mono text-[11px] text-zinc-400">{a.owner}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.risk_score >= 70 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          a.risk_score >= 35 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          Risk: {a.risk_score}/100
                        </span>
                      </td>
                      <td className="p-4 uppercase font-bold text-[10px] text-zinc-500">{a.status}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteAsset(a.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded border border-zinc-850 hover:border-red-500/30 transition-colors"
                          title="Revoke Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          3. VULNERABILITY FINDINGS TAB
         ---------------------------------------------------------------------- */}
      {activeTab === 'findings' && selectedProjectId && (
        <div className="space-y-4">
          {findings.length === 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-12 text-center text-zinc-500 space-y-2">
              <BadgeAlert className="w-10 h-10 mx-auto stroke-1" />
              <h3 className="font-bold text-zinc-300 text-sm">No Vulnerabilities Logged</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Log identified software vulnerabilities, unconfigured headers, outdated libraries, or system misconfigurations.
              </p>
              <button
                onClick={() => setShowFindingModal(true)}
                className="bg-zinc-850 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg mt-2 font-semibold"
              >
                Log Finding Manual
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map(f => {
                const fEvidence = f.id ? [] : []; // Wait, let's load or display details
                return (
                  <div key={f.id} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            f.severity === 'Critical' ? 'bg-red-500/15 text-red-500 border border-red-500/35' :
                            f.severity === 'High' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/35' :
                            f.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/35' :
                            'bg-brand-neon/15 text-brand-neon border border-brand-neon/35'
                          }`}>
                            {f.severity} Severity
                          </span>
                          <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                            CVSS {f.cvss_score.toFixed(1)}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
                            Status: {f.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="font-black text-sm text-zinc-100">{f.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEvidenceFindingId(f.id); setShowEvidenceModal(true); }}
                          className="text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-850 px-2.5 py-1.5 border border-zinc-850 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-brand-neon" />
                          <span>Attach Evidence</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFinding(f.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded border border-zinc-850 hover:border-red-500/30 transition-colors"
                          title="Revoke Finding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{f.description}</p>

                    {f.recommendations && (
                      <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Remediation Action Playbook:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">{f.recommendations}</p>
                      </div>
                    )}

                    {/* Affected Assets */}
                    {f.affectedAssets && f.affectedAssets.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Affected Scope Assets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {f.affectedAssets.map(asset => (
                            <span key={asset.id} className="text-[9.5px] font-mono font-bold text-zinc-400 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded">
                              {asset.name} ({asset.type})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          4. REPORTS & EXPORTS TAB
         ---------------------------------------------------------------------- */}
      {activeTab === 'reports' && selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1 space-y-3">
            {reports.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-8 text-center text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto stroke-1" />
                <h3 className="font-bold text-zinc-300 text-sm">No Reports Drafted</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Generate client deliverables containing mapped assets, aggregated severities, and playbooks.
                </p>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-brand-neon hover:bg-brand-neon/80 text-white font-bold text-[10px] px-3 py-1.5 rounded mt-2"
                >
                  Create New Report
                </button>
              </div>
            ) : (
              reports.map(r => (
                <div
                  key={r.id}
                  onClick={() => setActiveReportDetails(r)}
                  className={`border p-4 rounded-xl cursor-pointer transition-all space-y-2.5 ${activeReportDetails?.id === r.id ? 'bg-brand-neon/5 border-brand-neon/60' : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">REPORT MODULE</span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${r.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-750'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 text-xs line-clamp-1">{r.title}</h4>
                    <span className="text-[9.5px] text-zinc-500">Drafted: {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[9.5px]">
                    <span className="text-brand-neon font-bold hover:underline">Inspect details</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id); }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Report Viewer / Details Pane */}
          <div className="lg:col-span-2">
            {activeReportDetails ? (
              <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-xl space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-zinc-800/40">
                  <div>
                    <h3 className="font-black text-base text-zinc-100">{activeReportDetails.title}</h3>
                    <span className="text-[10px] font-mono text-zinc-500">Report Reference: {activeReportDetails.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/reports/${activeReportDetails.id}/export/json`}
                      download
                      className="bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white px-3 py-1.5 rounded border border-zinc-800 text-xs flex items-center gap-1 transition-colors"
                      title="Download JSON Payload"
                    >
                      <FileCode className="w-3.5 h-3.5 text-brand-neon" />
                      <span>Export JSON</span>
                    </a>
                    <a
                      href={`/api/reports/${activeReportDetails.id}/export/markdown`}
                      download
                      className="bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white px-3 py-1.5 rounded border border-zinc-800 text-xs flex items-center gap-1 transition-colors"
                      title="Download Professional Markdown report"
                    >
                      <FileText className="w-3.5 h-3.5 text-green-400" />
                      <span>Export Markdown</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">1. Executive Summary:</span>
                    <p className="text-zinc-300 leading-relaxed font-semibold">{activeReportDetails.executive_summary || "No executive summary configured."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">2. Assessment Scope:</span>
                      <p className="text-zinc-400 leading-relaxed">{activeReportDetails.scope || "No scope configured."}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">3. Vulnerability & Risk Summary:</span>
                      <p className="text-zinc-400 leading-relaxed">{activeReportDetails.risk_summary || "No risk summary compiled."}</p>
                    </div>
                  </div>

                  {activeReportDetails.appendices && (
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">4. Technical Appendices:</span>
                      <p className="text-zinc-400 leading-relaxed font-mono">{activeReportDetails.appendices}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-16 text-center text-zinc-500">
                <FileDown className="w-12 h-12 mx-auto stroke-1 mb-2 text-zinc-600" />
                <h3 className="font-bold text-zinc-300 text-xs">No Report Selected</h3>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Choose a report from the list to preview compiled executive notes, scopes, and execute formal downloads.
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ======================================================================
          MODALS / CREATORS POPUPS
         ====================================================================== */}

      {/* 1. Project Modal */}
      {showProjModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">New Client Project</h3>
              <button onClick={() => setShowProjModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Project Name / Target Client</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Acme Corp Internal Audit"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Description / Scope Details</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Annual external penetration testing of core APIs and web portals."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-neon hover:bg-brand-neon/80 text-white font-bold"
                >
                  Create Namespace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Register Client Asset</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Asset Name / URL / IP</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., api.acme.com or 10.0.4.1"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Asset Class Type</label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    <option value="Domain">Domain</option>
                    <option value="IP Address">IP Address</option>
                    <option value="Server">Server</option>
                    <option value="Cloud Container">Cloud Container</option>
                    <option value="Web Application">Web Application</option>
                    <option value="API Endpoint">API Endpoint</option>
                    <option value="Database">Database</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Risk Level (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newAssetRisk}
                    onChange={(e) => setNewAssetRisk(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Owner Email / Custodian</label>
                <input
                  type="email"
                  placeholder="e.g., sysops@acme.com"
                  value={newAssetOwner}
                  onChange={(e) => setNewAssetOwner(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context about host dependencies..."
                  value={newAssetNotes}
                  onChange={(e) => setNewAssetNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-neon hover:bg-brand-neon/80 text-white font-bold"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Finding Modal */}
      {showFindingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Log Vulnerability Finding</h3>
              <button onClick={() => setShowFindingModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateFinding} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Vulnerability Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Outdated SSL Cipher Suites configuration"
                  value={newFindingTitle}
                  onChange={(e) => setNewFindingTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Severity</label>
                  <select
                    value={newFindingSeverity}
                    onChange={(e) => setNewFindingSeverity(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Informational">Informational</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">CVSS 3.1 Score (0.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newFindingCvss}
                    onChange={(e) => setNewFindingCvss(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Vulnerability Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed description of vulnerability findings and exploits..."
                  value={newFindingDesc}
                  onChange={(e) => setNewFindingDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Mitigation Recommendations</label>
                <textarea
                  rows={2}
                  placeholder="Exact remediation configs or patches..."
                  value={newFindingRec}
                  onChange={(e) => setNewFindingRec(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Owner Email Analyst</label>
                <input
                  type="email"
                  placeholder="analyst@acme.com"
                  value={newFindingOwner}
                  onChange={(e) => setNewFindingOwner(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">References (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="https://nvd.nist.gov/..."
                  value={newFindingRef}
                  onChange={(e) => setNewFindingRef(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>

              {/* Map affected assets */}
              {assets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Link Affected Assets</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
                    {assets.map(a => (
                      <label key={a.id} className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAssetIds(prev => [...prev, a.id]);
                            else setSelectedAssetIds(prev => prev.filter(id => id !== a.id));
                          }}
                          className="rounded border-zinc-800 bg-zinc-900 text-brand-neon accent-brand-neon focus:ring-0"
                        />
                        <span className="truncate">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFindingModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-neon hover:bg-brand-neon/80 text-white font-bold"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Attach Technical Evidence</h3>
              <button onClick={() => { setEvidenceFindingId(''); setShowEvidenceModal(false); }} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateEvidence} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Evidence Type</label>
                <select
                  value={newEvidenceType}
                  onChange={(e) => setNewEvidenceType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                >
                  <option value="terminal_log">Terminal/CLI Log</option>
                  <option value="dns_record">DNS Record</option>
                  <option value="http_header">HTTP Header dump</option>
                  <option value="ssl_cert">SSL/TLS Cert Details</option>
                  <option value="raw_payload">Raw Payload block</option>
                  <option value="other">Other text payload</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Evidence Value / Log Output</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste raw terminal stdout, TLS handshake outputs, or headers..."
                  value={newEvidenceValue}
                  onChange={(e) => setNewEvidenceValue(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-xs text-brand-neon"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Description Notes</label>
                <input
                  type="text"
                  placeholder="Notes explaining what this evidence block represents"
                  value={newEvidenceNotes}
                  onChange={(e) => setNewEvidenceNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEvidenceFindingId(''); setShowEvidenceModal(false); }}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-neon hover:bg-brand-neon/80 text-white font-bold"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Compile Security Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Executive Cybersecurity Assessment - Q3 2026"
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Executive Summary</label>
                <textarea
                  rows={2}
                  placeholder="Consolidated executive high-level summary..."
                  value={newReportExec}
                  onChange={(e) => setNewReportExec(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Assessment Scope</label>
                  <textarea
                    rows={2}
                    placeholder="Specific domains, ranges, repositories in scope..."
                    value={newReportScope}
                    onChange={(e) => setNewReportScope(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Vulnerabilities Risk Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Overview of severities and risk rankings..."
                    value={newReportRisk}
                    onChange={(e) => setNewReportRisk(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Appendices / Notes</label>
                <textarea
                  rows={2}
                  placeholder="References, configurations, methodology notes..."
                  value={newReportAppendices}
                  onChange={(e) => setNewReportAppendices(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-neon hover:bg-brand-neon/80 text-white font-bold"
                >
                  Compile Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

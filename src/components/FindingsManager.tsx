import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  Calculator,
  Paperclip,
  Activity,
  UserCheck,
  Building2,
  FolderGit2,
  Layers,
  X,
  Sparkles,
  Zap,
  Flame,
  HelpCircle
} from 'lucide-react';
import { Finding, Project, Asset, Evidence } from '../types';
import { apiFetchJson } from '../lib/api';

interface FindingsManagerProps {
  onSelectFinding?: (findingId: string) => void;
  onOpenCvssCalculator?: () => void;
}

export default function FindingsManager({ onSelectFinding, onOpenCvssCalculator }: FindingsManagerProps) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Finding Form
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    severity: 'HIGH' as Finding['severity'],
    cvss_score: 7.5,
    epss_score: 0.12,
    status: 'draft' as Finding['status'],
    recommendations: '',
    references: '',
    owner: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [findingList, projectList] = await Promise.all([
        apiFetchJson<Finding[]>('/api/findings'),
        apiFetchJson<Project[]>('/api/projects')
      ]);
      setFindings(findingList || []);
      setProjects(projectList || []);
    } catch (err) {
      console.error('Failed to fetch findings registry:', err);
      setFindings([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project_id) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        references: formData.references
          ? formData.references.split('\n').map((r) => r.trim()).filter(Boolean)
          : []
      };

      const created = await apiFetchJson<Finding>('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setFindings((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setFormData({
        project_id: '',
        title: '',
        description: '',
        severity: 'HIGH',
        cvss_score: 7.5,
        epss_score: 0.12,
        status: 'draft',
        recommendations: '',
        references: '',
        owner: ''
      });
    } catch (err) {
      console.error('Failed to register finding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const loadFindingDetails = async (finding: Finding) => {
    setSelectedFinding(finding);
    if (onSelectFinding) onSelectFinding(finding.id);
    try {
      const evidence = await apiFetchJson<Evidence[]>(`/api/findings/${finding.id}/evidence`);
      setEvidenceList(evidence || []);
    } catch {
      setEvidenceList([]);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity.toUpperCase() === severityFilter.toUpperCase();
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesProject = projectFilter === 'all' || f.project_id === projectFilter;
    return matchesSearch && matchesSeverity && matchesStatus && matchesProject;
  });

  const getSeverityBadge = (severity: Finding['severity']) => {
    const s = severity.toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'LOW':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Findings & Vulnerabilities</h1>
            <p className="text-sm text-slate-400">
              Verified findings database with CVSS v3.1/v4.0 scoring, EPSS probability, and evidence artifacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCvssCalculator && (
            <button
              onClick={onOpenCvssCalculator}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              CVSS Calculator
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Record Finding
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search findings by CVE, vulnerability name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Informational</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="remediated">Remediated</option>
            <option value="risk-accepted">Risk Accepted</option>
            <option value="false-positive">False Positive</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredFindings.length}</span> findings
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Finding List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading findings database...</p>
            </div>
          ) : filteredFindings.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-medium text-slate-300">No Findings Recorded</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No vulnerabilities match your filter set. Execute contextual scanners inside a Project or click "Record Finding" to add manually.
              </p>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isSelected = selectedFinding?.id === finding.id;
              return (
                <div
                  key={finding.id}
                  onClick={() => loadFindingDetails(finding)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 space-y-3 ${
                    isSelected
                      ? 'bg-red-950/30 border-red-500/50 shadow-md shadow-red-900/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 border text-[10px] font-extrabold uppercase tracking-wider rounded-md ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      CVSS {finding.cvss_score?.toFixed(1) || '0.0'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {finding.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize text-slate-400">Status: {finding.status}</span>
                    <span>{new Date(finding.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Finding Inspection & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFinding ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6 backdrop-blur-md">
              <div className="flex items-start justify-between border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 border text-xs font-bold uppercase rounded-md ${getSeverityBadge(
                        selectedFinding.severity
                      )}`}
                    >
                      {selectedFinding.severity}
                    </span>
                    <h2 className="text-xl font-bold text-white">{selectedFinding.title}</h2>
                  </div>
                  <p className="text-xs text-slate-400">Finding ID: {selectedFinding.id}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {selectedFinding.cvss_score?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    CVSS Score
                  </div>
                </div>
              </div>

              {/* Data Science / Risk Intelligence Scoring Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> EPSS Likelihood Score
                  </span>
                  <div className="text-lg font-bold text-slate-200 font-mono">
                    {selectedFinding.epss_score ? `${(selectedFinding.epss_score * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <p className="text-[10px] text-slate-500">Exploit Prediction Scoring System</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-red-400" /> Calculated Risk Weight
                  </span>
                  <div className="text-lg font-bold text-slate-200 font-mono">
                    {selectedFinding.risk_weight ? selectedFinding.risk_weight.toFixed(1) : 'Standard'}
                  </div>
                  <p className="text-[10px] text-slate-500">Asset Criticality × Severity Weight</p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Assigned Analyst
                  </span>
                  <div className="text-sm font-semibold text-slate-200">
                    {selectedFinding.owner || 'Unassigned'}
                  </div>
                  <p className="text-[10px] text-slate-500">Responsible Security Researcher</p>
                </div>
              </div>

              {/* Finding Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Vulnerability Description
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 border border-slate-800/80 rounded-lg">
                    {selectedFinding.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Remediation Guidance
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 border border-slate-800/80 rounded-lg">
                    {selectedFinding.recommendations || 'No remediation guidance provided.'}
                  </p>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-400" /> Evidence Artifacts ({evidenceList.length})
                </h4>

                {evidenceList.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/30">
                    <p className="text-xs text-slate-500">No evidence logs or payloads attached to this finding yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evidenceList.map((ev) => (
                      <div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-300">
                          <span>{ev.type}</span>
                          <span className="text-[10px] text-slate-500">{new Date(ev.created_at).toLocaleTimeString()}</span>
                        </div>
                        <pre className="p-2 bg-black/60 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                          {ev.value}
                        </pre>
                        {ev.notes && <p className="text-[11px] text-slate-400">Notes: {ev.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Select a Finding</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a finding from the left panel to inspect detailed vulnerability metrics, evidence payloads, and remediation guidance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Finding Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" /> Record Vulnerability Finding
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Project Scope *
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select project scope...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Finding Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthenticated Remote Code Execution in API Endpoint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Rating
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as Finding['severity'] })
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="INFO">Informational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CVSS Score (0.0 - 10.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.cvss_score}
                    onChange={(e) => setFormData({ ...formData, cvss_score: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EPSS Probability
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.epss_score}
                    onChange={(e) => setFormData({ ...formData, epss_score: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vulnerability Details & Proof of Concept
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the impact, attack vector, and step-by-step reproduction..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remediation Recommendations
                </label>
                <textarea
                  rows={2}
                  placeholder="Concrete patch instructions, config hardening, or vendor updates..."
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all"
                >
                  {submitting ? 'Recording...' : 'Record Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

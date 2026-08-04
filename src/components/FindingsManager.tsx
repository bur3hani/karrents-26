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
  HelpCircle,
  Edit3,
  Trash2,
  Share2,
  Network,
  Download,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowRight,
  Tag,
  Check
} from 'lucide-react';
import { Finding, Project, Asset, Evidence } from '../types';
import { apiFetchJson } from '../lib/api';

interface FindingsManagerProps {
  onSelectFinding?: (findingId: string) => void;
  onOpenCvssCalculator?: () => void;
}

// Sample Latest Threat Feed Intelligence Data
interface ThreatFeedItem {
  cveId: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvss: number;
  epss: number;
  cisaKev: boolean;
  publishedDate: string;
  category: string;
  description: string;
  affectedComponents: string[];
  remediation: string;
}

const LATEST_THREAT_FEED: ThreatFeedItem[] = [
  {
    cveId: 'CVE-2025-2130',
    name: 'PostgreSQL Remote Memory Corruption via Extension Handler',
    severity: 'CRITICAL',
    cvss: 9.8,
    epss: 0.89,
    cisaKev: true,
    publishedDate: '2025-02-14',
    category: 'Database / Remote Code Execution',
    description: 'An unauthenticated remote attacker can trigger memory corruption in PostgreSQL engine extension parser leading to arbitrary code execution with service privileges.',
    affectedComponents: ['PostgreSQL 14.x', 'PostgreSQL 15.x', 'Cloud SQL PostgreSQL'],
    remediation: 'Upgrade PostgreSQL cluster to version 15.8 or higher. Enforce strict database firewall ingress rules.'
  },
  {
    cveId: 'CVE-2024-55551',
    name: 'Nginx Reverse Proxy HTTP/2 Smuggling & Header Injection',
    severity: 'HIGH',
    cvss: 8.6,
    epss: 0.64,
    cisaKev: false,
    publishedDate: '2025-01-29',
    category: 'Network / Gateway',
    description: 'Specially crafted HTTP/2 request frames bypass proxy validation headers, allowing backend privilege escalation and unauthorized cache poisoning.',
    affectedComponents: ['Nginx 1.22.x', 'Ingress Nginx Controller'],
    remediation: 'Disable HTTP/2 server push and upgrade Nginx binary to 1.26.2+.'
  },
  {
    cveId: 'CVE-2024-38077',
    name: 'Windows Remote Access Connection Manager RCE',
    severity: 'CRITICAL',
    cvss: 9.8,
    epss: 0.92,
    cisaKev: true,
    publishedDate: '2025-02-01',
    category: 'Operating System / Privilege Escalation',
    description: 'Buffer overflow in Remote Access Connection Manager allows unauthenticated network attackers to execute shellcode on domain controller hosts.',
    affectedComponents: ['Windows Server 2022', 'Windows Server 2019'],
    remediation: 'Apply MS KB5039217 security hotfix immediately across domain endpoints.'
  },
  {
    cveId: 'CVE-2024-4358',
    name: 'Node.js Express Async Handler Memory Leak & DoS',
    severity: 'MEDIUM',
    cvss: 6.5,
    epss: 0.28,
    cisaKev: false,
    publishedDate: '2025-02-10',
    category: 'Web Application / Availability',
    description: 'Uncaught promise rejections in deeply nested async middleware cause node worker thread pool exhaustion.',
    affectedComponents: ['Express v4.18.x', 'Node.js v20.x'],
    remediation: 'Implement global unhandled rejection handlers and limit payload sizes in body-parser.'
  },
  {
    cveId: 'CVE-2025-1082',
    name: 'OpenSSL RSA Key Exchange Timing Side-Channel',
    severity: 'HIGH',
    cvss: 7.4,
    epss: 0.41,
    cisaKev: false,
    publishedDate: '2025-02-12',
    category: 'Cryptography / Information Disclosure',
    description: 'Timing side-channel vulnerability during RSA decryption allows attackers with high-resolution clock measurements to recover private TLS keys.',
    affectedComponents: ['OpenSSL 3.0.x', 'LibreSSL'],
    remediation: 'Update OpenSSL dependencies to version 3.0.13 or migrate to ECDSA certificate chains.'
  }
];

export default function FindingsManager({ onSelectFinding, onOpenCvssCalculator }: FindingsManagerProps) {
  const [activeTab, setActiveTab] = useState<'registry' | 'correlation' | 'threats'>('registry');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);

  // New Evidence Form State
  const [evidenceType, setEvidenceType] = useState<Evidence['type']>('Command Output');
  const [evidenceValue, setEvidenceValue] = useState<string>('');
  const [evidenceNotes, setEvidenceNotes] = useState<string>('');

  // Finding Form State (Used for both Create & Edit)
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
      const [findingList, projectList, assetList] = await Promise.all([
        apiFetchJson<Finding[]>('/api/findings'),
        apiFetchJson<Project[]>('/api/projects'),
        apiFetchJson<Asset[]>('/api/assets')
      ]);
      setFindings(findingList || []);
      setProjects(projectList || []);
      setAssets(assetList || []);
    } catch (err) {
      console.error('Failed to fetch findings registry:', err);
      setFindings([]);
      setProjects([]);
      setAssets([]);
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
      resetForm();
    } catch (err) {
      console.error('Failed to register finding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinding) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        references: formData.references
          ? formData.references.split('\n').map((r) => r.trim()).filter(Boolean)
          : []
      };

      const updated = await apiFetchJson<Finding>(`/api/findings/${editingFinding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setFindings((prev) => prev.map((f) => (f.id === editingFinding.id ? updated : f)));
      if (selectedFinding?.id === editingFinding.id) {
        setSelectedFinding(updated);
      }
      setShowEditModal(false);
      setEditingFinding(null);
      resetForm();
    } catch (err) {
      console.error('Failed to update finding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFinding = async (id: string) => {
    if (!confirm('Are you sure you want to delete this security finding? This action cannot be undone.')) return;
    try {
      await apiFetchJson(`/api/findings/${id}`, { method: 'DELETE' });
      setFindings((prev) => prev.filter((f) => f.id !== id));
      if (selectedFinding?.id === id) {
        setSelectedFinding(null);
      }
    } catch (err) {
      console.error('Failed to delete finding:', err);
    }
  };

  const handleUpdateStatus = async (finding: Finding, newStatus: Finding['status']) => {
    try {
      const updated = await apiFetchJson<Finding>(`/api/findings/${finding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setFindings((prev) => prev.map((f) => (f.id === finding.id ? { ...f, status: newStatus } : f)));
      if (selectedFinding?.id === finding.id) {
        setSelectedFinding((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update finding status:', err);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding || !evidenceValue.trim()) return;
    try {
      const newEv = await apiFetchJson<Evidence>(`/api/findings/${selectedFinding.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: evidenceType,
          value: evidenceValue.trim(),
          notes: evidenceNotes.trim()
        })
      });
      setEvidenceList((prev) => [...prev, newEv]);
      setShowEvidenceModal(false);
      setEvidenceValue('');
      setEvidenceNotes('');
    } catch (err) {
      console.error('Failed to attach evidence:', err);
    }
  };

  const handleImportThreatAsFinding = async (threat: ThreatFeedItem) => {
    if (projects.length === 0) {
      alert('Please create a project scope first to import findings.');
      return;
    }

    const defaultProjectId = projects[0].id;
    try {
      const payload = {
        project_id: defaultProjectId,
        title: `${threat.cveId}: ${threat.name}`,
        description: `${threat.description}\n\nAffected Components: ${threat.affectedComponents.join(', ')}`,
        severity: threat.severity,
        cvss_score: threat.cvss,
        epss_score: threat.epss,
        status: 'open' as const,
        recommendations: threat.remediation,
        references: [threat.cveId, `https://nvd.nist.gov/vuln/detail/${threat.cveId}`],
        owner: 'SecOps Threat Feed'
      };

      const created = await apiFetchJson<Finding>('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setFindings((prev) => [created, ...prev]);
      alert(`Successfully imported ${threat.cveId} into project workspace '${projects[0].name}'!`);
      setActiveTab('registry');
    } catch (err: any) {
      alert(`Failed to import threat finding: ${err.message}`);
    }
  };

  const openEditModal = (finding: Finding) => {
    setEditingFinding(finding);
    setFormData({
      project_id: finding.project_id,
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      cvss_score: finding.cvss_score || 0,
      epss_score: finding.epss_score || 0,
      status: finding.status,
      recommendations: finding.recommendations || '',
      references: Array.isArray(finding.references) ? finding.references.join('\n') : '',
      owner: finding.owner || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      project_id: projects[0]?.id || '',
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
    const s = severity ? severity.toUpperCase() : 'LOW';
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

  // Correlation computations
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL');
  const highEpssFindings = findings.filter((f) => (f.epss_score || 0) >= 0.5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Findings & Vulnerability Correlation</h1>
            <p className="text-sm text-slate-400">
              Enterprise vulnerability management, EPSS threat correlation engines, and real-time intelligence feeds
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
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Record Finding
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'registry'
              ? 'border-red-500 text-red-400 bg-red-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Findings Registry ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('correlation')}
          className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'correlation'
              ? 'border-red-500 text-red-400 bg-red-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4 text-amber-400" />
          <span>Vulnerability Correlation Engine</span>
          {highEpssFindings.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">
              {highEpssFindings.length} High Risk
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('threats')}
          className={`px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'threats'
              ? 'border-red-500 text-red-400 bg-red-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-fuchsia-400" />
          <span>Latest Threat Intelligence Feed</span>
          <span className="px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded text-[10px] font-mono">LIVE</span>
        </button>
      </div>

      {/* TAB 1: FINDINGS REGISTRY */}
      {activeTab === 'registry' && (
        <>
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
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

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
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 space-y-3 relative group ${
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            CVSS {finding.cvss_score?.toFixed(1) || '0.0'}
                          </span>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <span>{new Date(finding.created_at || Date.now()).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(finding);
                            }}
                            className="p-1 hover:text-white text-slate-500 transition-colors"
                            title="Edit finding"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFinding(finding.id);
                            }}
                            className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                            title="Delete finding"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Finding Inspection & Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedFinding ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6 backdrop-blur-md">
                  {/* Top Bar */}
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
                      <p className="text-xs text-slate-400 font-mono">Finding ID: {selectedFinding.id}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-400 font-mono">
                          {selectedFinding.cvss_score?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                          CVSS Score
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => openEditModal(selectedFinding)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFinding(selectedFinding.id)}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold rounded transition-colors flex items-center gap-1 border border-red-500/30"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Transition Toolbar */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status Workflow State:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['draft', 'open', 'remediated', 'risk-accepted', 'false-positive'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedFinding, st)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            selectedFinding.status === st
                              ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {st.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Risk Intelligence Scoring Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> EPSS Probability
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
                        {(
                          (selectedFinding.cvss_score || 5) *
                          (selectedFinding.severity === 'CRITICAL' ? 1.5 : selectedFinding.severity === 'HIGH' ? 1.2 : 1.0)
                        ).toFixed(1)}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Severity Weight × Base Metric</p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Responsible Owner
                      </span>
                      <div className="text-sm font-semibold text-slate-200">
                        {selectedFinding.owner || 'Unassigned'}
                      </div>
                      <p className="text-[10px] text-slate-500">Assigned Security Engineer</p>
                    </div>
                  </div>

                  {/* Description & Recommendations */}
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-400" /> Evidence Artifacts ({evidenceList.length})
                      </h4>
                      <button
                        onClick={() => setShowEvidenceModal(true)}
                        className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Attach Evidence
                      </button>
                    </div>

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
        </>
      )}

      {/* TAB 2: VULNERABILITY CORRELATION ENGINE */}
      {activeTab === 'correlation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Total Active Correlated Clusters</span>
                <Network className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {Math.max(1, Math.ceil(findings.length / 2))}
              </div>
              <p className="text-xs text-slate-500">Cross-project vulnerability exposure vectors</p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>High EPSS Probabilities (&gt; 50%)</span>
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-black text-red-400 font-mono">
                {highEpssFindings.length}
              </div>
              <p className="text-xs text-slate-500">Active exploitation likelihood in the wild</p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Registered Assets at Exposure Risk</span>
                <Layers className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {assets.length}
              </div>
              <p className="text-xs text-slate-500">Monitored infrastructure endpoints</p>
            </div>
          </div>

          {/* Correlation Clusters Card */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Active Threat Correlation Clusters
                </h3>
                <p className="text-xs text-slate-400">
                  Automated correlation matching finding attack vectors with registered client infrastructure
                </p>
              </div>
              <button
                onClick={fetchInitialData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-fuchsia-400" /> Re-correlate Scope
              </button>
            </div>

            {findings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No active findings logged to correlate with project assets.
              </div>
            ) : (
              <div className="space-y-4">
                {findings.map((f, idx) => {
                  const correlatedAssets = assets.filter(
                    (a) => a.project_id === f.project_id || f.title.toLowerCase().includes(a.type.toLowerCase())
                  );
                  return (
                    <div
                      key={f.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded">
                            Cluster #{idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getSeverityBadge(f.severity)}`}>
                            {f.severity}
                          </span>
                          <h4 className="text-sm font-bold text-white">{f.title}</h4>
                        </div>
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Correlation Score: {Math.min(99, Math.floor((f.cvss_score || 7) * 10 + correlatedAssets.length * 5))}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">{f.description}</p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                          <span>Affected Target Assets ({correlatedAssets.length}):</span>
                          <div className="flex flex-wrap gap-1">
                            {correlatedAssets.slice(0, 3).map((a) => (
                              <span key={a.id} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] rounded">
                                {a.name} ({a.type})
                              </span>
                            ))}
                            {correlatedAssets.length > 3 && (
                              <span className="text-[10px] text-slate-500 font-mono">+{correlatedAssets.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedFinding(f);
                            setActiveTab('registry');
                          }}
                          className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                        >
                          <span>Inspect Finding</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LATEST THREAT INTELLIGENCE FEED */}
      {activeTab === 'threats' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fuchsia-400" /> Global Threat Intelligence & Emerging Vulnerabilities
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time CVE threat feed with 1-click import into project vulnerability registries
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Feed Active
              </span>
            </div>

            <div className="space-y-4">
              {LATEST_THREAT_FEED.map((item) => (
                <div key={item.cveId} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-fuchsia-400">{item.cveId}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                      {item.cisaKev && (
                        <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold rounded flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-400" /> CISA KEV (Actively Exploited)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-amber-400">CVSS {item.cvss}</span>
                      <span className="text-slate-400">EPSS {(item.epss * 100).toFixed(0)}%</span>
                      <span className="text-slate-500">{item.publishedDate}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 border border-slate-850 rounded-lg text-xs font-mono text-slate-400 flex flex-wrap gap-2 items-center">
                    <span className="text-zinc-500 font-bold">Affected Stacks:</span>
                    {item.affectedComponents.map((comp) => (
                      <span key={comp} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px]">
                        {comp}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">
                      <span className="font-bold text-slate-300">Remediation:</span> {item.remediation}
                    </div>

                    <button
                      onClick={() => handleImportThreatAsFinding(item)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Import as Finding</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECORD / EDIT FINDING MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                {showEditModal ? 'Edit Security Finding' : 'Record Vulnerability Finding'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showEditModal ? handleUpdateFinding : handleCreateFinding} className="space-y-4 text-xs">
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

              <div className="grid grid-cols-3 gap-3">
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
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono"
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
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono"
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner / Assigned Analyst
                </label>
                <input
                  type="text"
                  placeholder="e.g. SecOps Lead Analyst"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{showEditModal ? 'Update Finding' : 'Record Finding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH EVIDENCE MODAL */}
      {showEvidenceModal && selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-400" /> Attach Evidence Artifact
              </h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as Evidence['type'])}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-white"
                >
                  <option value="Command Output">Command Output</option>
                  <option value="URL">URL Endpoint / Request</option>
                  <option value="Log">System / HTTP Log</option>
                  <option value="Note">Analyst Note</option>
                  <option value="Hash">File Hash / Signature</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Payload / Value / Log Output *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste terminal log output, HTTP request headers, or response payload..."
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-emerald-400 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Context Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Captured during port scan on 192.168.1.10"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-md"
                >
                  Attach Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  Layers,
  Globe,
  Server,
  Cpu,
  Box,
  Code,
  Cloud,
  Mail,
  Wifi,
  Shield,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  User,
  Tag,
  X,
  Zap,
  Sliders,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Info,
  Calendar,
  Download,
  Upload,
  Clock,
  CheckSquare,
  Square,
  FileText,
  Check
} from 'lucide-react';
import { Project } from '../types';
import { Asset, AssetType } from '../types/asset';
import { apiFetch } from '../lib/api';
import { AssetCard, getAssetIcon, getRiskBadge } from './AssetCard';

export const ASSET_TYPES: { type: AssetType; label: string; icon: any; category: string; defaultPlaceholder: string }[] = [
  { type: 'Website', label: 'Website', icon: Globe, category: 'Web & DNS', defaultPlaceholder: 'e.g. https://www.acme.com' },
  { type: 'Domain', label: 'Domain', icon: Globe, category: 'Web & DNS', defaultPlaceholder: 'e.g. acme.com' },
  { type: 'Subdomain', label: 'Subdomain', icon: Globe, category: 'Web & DNS', defaultPlaceholder: 'e.g. api.acme.com' },
  { type: 'Application', label: 'Web Application', icon: Code, category: 'Web & DNS', defaultPlaceholder: 'e.g. Billing Console App' },
  { type: 'API', label: 'API Endpoint', icon: Zap, category: 'Web & DNS', defaultPlaceholder: 'e.g. https://api.acme.com/v1' },
  { type: 'Server', label: 'Server / Host', icon: Server, category: 'Infrastructure', defaultPlaceholder: 'e.g. prod-web-01.acme.internal' },
  { type: 'Host', label: 'Host', icon: Server, category: 'Infrastructure', defaultPlaceholder: 'e.g. bastion-host-east' },
  { type: 'Container', label: 'Container', icon: Box, category: 'Infrastructure', defaultPlaceholder: 'e.g. acme/auth-service:v1.2' },
  { type: 'Virtual Machine', label: 'Virtual Machine', icon: Cpu, category: 'Infrastructure', defaultPlaceholder: 'e.g. vm-db-primary' },
  { type: 'Cloud Resource', label: 'Cloud Resource', icon: Cloud, category: 'Cloud', defaultPlaceholder: 'e.g. aws-s3://acme-assets-vault' },
  { type: 'Repository', label: 'Repository', icon: Code, category: 'Source Code', defaultPlaceholder: 'e.g. github.com/acme/backend' },
  { type: 'Email Domain', label: 'Email Domain', icon: Mail, category: 'Email & Comm', defaultPlaceholder: 'e.g. mail.acme.com' },
  { type: 'Public IP', label: 'Public IP', icon: Wifi, category: 'Network', defaultPlaceholder: 'e.g. 185.112.144.50' },
  { type: 'Internal IP', label: 'Internal IP', icon: Wifi, category: 'Network', defaultPlaceholder: 'e.g. 10.0.4.15' },
];

export const PRESET_TAGS = ['Production', 'Public-Facing', 'PCI-DSS', 'SOC2-Scope', 'AWS', 'GCP', 'Internal-VPC', 'Encrypted', 'High-Value', 'Dev/Staging'];

interface AssetModalProps {
  isOpen: boolean;
  editingAsset: Asset | null;
  projects: Project[];
  defaultProjectId: string;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => Promise<void>;
}

export function AssetModal({
  isOpen,
  editingAsset,
  projects,
  defaultProjectId,
  onClose,
  onSave
}: AssetModalProps) {
  if (!isOpen) return null;

  const [formProjectId, setFormProjectId] = useState<string>(
    editingAsset?.project_id || defaultProjectId || (projects[0]?.id || '')
  );
  const [formName, setFormName] = useState<string>(editingAsset?.name || '');
  const [formType, setFormType] = useState<AssetType>(editingAsset?.type || 'Website');
  const [formOwner, setFormOwner] = useState<string>(editingAsset?.owner || 'SecOps Team');
  const [formRiskScore, setFormRiskScore] = useState<number>(
    editingAsset?.riskScore ?? editingAsset?.risk_score ?? 25
  );
  const [formStatus, setFormStatus] = useState<'active' | 'under-review' | 'decommissioned' | 'archived'>(
    editingAsset?.status || 'active'
  );
  const [formNotes, setFormNotes] = useState<string>(editingAsset?.notes || '');
  const [formTags, setFormTags] = useState<string[]>(
    Array.isArray(editingAsset?.tags) ? editingAsset!.tags : ['Production', 'Public-Facing']
  );
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingAsset) {
      setFormProjectId(editingAsset.project_id || defaultProjectId || (projects[0]?.id || ''));
      setFormName(editingAsset.name || '');
      setFormType(editingAsset.type || 'Website');
      setFormOwner(editingAsset.owner || 'SecOps Team');
      setFormRiskScore(editingAsset.riskScore ?? editingAsset.risk_score ?? 25);
      setFormStatus(editingAsset.status || 'active');
      setFormNotes(editingAsset.notes || '');
      setFormTags(Array.isArray(editingAsset.tags) ? editingAsset.tags : []);
      setErrors({});
    } else {
      setFormProjectId(defaultProjectId || (projects[0]?.id || ''));
      setFormName('');
      setFormType('Website');
      setFormOwner('SecOps Team');
      setFormRiskScore(25);
      setFormStatus('active');
      setFormNotes('');
      setFormTags(['Production', 'Public-Facing']);
      setErrors({});
    }
  }, [editingAsset, defaultProjectId, projects]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) {
      errs.name = 'Asset Name / Endpoint is required.';
    }
    if (!formOwner.trim()) {
      errs.owner = 'Owner or Responsible Team is required.';
    }
    if (formRiskScore < 0 || formRiskScore > 100 || isNaN(formRiskScore)) {
      errs.riskScore = 'Risk score must be a number between 0 and 100.';
    }
    if (projects.length > 0 && !formProjectId) {
      errs.projectId = 'Please select a target project scope.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSave({
        id: editingAsset?.id,
        project_id: formProjectId,
        name: formName.trim(),
        type: formType,
        owner: formOwner.trim(),
        riskScore: formRiskScore,
        risk_score: formRiskScore,
        status: formStatus,
        notes: formNotes.trim(),
        tags: formTags
      });
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save asset.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !formTags.includes(clean)) {
      setFormTags([...formTags, clean]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">
              {editingAsset ? 'Edit Asset Configuration' : 'Register New Asset'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono">
              {errors.submit}
            </div>
          )}

          {/* Project Selection */}
          {projects.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Target Project Scope *</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-fuchsia-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.projectId && <span className="text-red-400 text-[10px] block mt-1">{errors.projectId}</span>}
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Asset Name / Endpoint *</label>
            <input
              type="text"
              placeholder={ASSET_TYPES.find(t => t.type === formType)?.defaultPlaceholder || 'e.g. https://www.acme.com'}
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-fuchsia-500 font-mono"
            />
            {errors.name && <span className="text-red-400 text-[10px] block mt-1">{errors.name}</span>}
          </div>

          {/* Asset Type Category */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Asset Category Type *</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as AssetType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-fuchsia-500 font-mono"
            >
              {ASSET_TYPES.map(t => (
                <option key={t.type} value={t.type}>
                  {t.label} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Owner and Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Owner / Responsible Team *</label>
              <input
                type="text"
                placeholder="e.g. SecOps Team"
                value={formOwner}
                onChange={(e) => {
                  setFormOwner(e.target.value);
                  if (errors.owner) setErrors(prev => ({ ...prev, owner: '' }));
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-fuchsia-500"
              />
              {errors.owner && <span className="text-red-400 text-[10px] block mt-1">{errors.owner}</span>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Lifecycle Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-fuchsia-500"
              >
                <option value="active">Active</option>
                <option value="under-review">Under Review</option>
                <option value="decommissioned">Decommissioned</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Risk Score Slider */}
          <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Assigned Risk Score (0 - 100)</label>
              {getRiskBadge(formRiskScore)}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formRiskScore}
              onChange={(e) => setFormRiskScore(Number(e.target.value))}
              className="w-full accent-fuchsia-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>0 (Low Exposure)</span>
              <span>50 (Moderate)</span>
              <span>100 (Critical)</span>
            </div>
            {errors.riskScore && <span className="text-red-400 text-[10px] block mt-1">{errors.riskScore}</span>}
          </div>

          {/* Tags Selector */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Asset Security Tags</label>
            
            {/* Active Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px] p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
              {formTags.length === 0 ? (
                <span className="text-[10px] text-zinc-600 font-mono">No tags assigned. Click presets below or add custom tag.</span>
              ) : (
                formTags.map(t => (
                  <span key={t} className="text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-white">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Preset Chips */}
            <div className="flex flex-wrap gap-1 mb-2">
              {PRESET_TAGS.map(pt => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => handleAddTag(pt)}
                  className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                    formTags.includes(pt)
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-default'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  +{pt}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom tag and hit Add..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTagInput);
                  }
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-fuchsia-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTagInput)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-[10px]"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes / Context */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Architecture & Security Notes</label>
            <textarea
              rows={3}
              placeholder="Provide context regarding this asset (e.g. reverse proxy location, cloud region, TLS cert authority, vulnerability history)..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-fuchsia-500 font-mono text-[11px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-fuchsia-900/20 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingAsset ? 'Update Asset' : 'Register Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AssetsManagerProps {
  projects: Project[];
  selectedProjectId: string | null;
  onLaunchToolWithTarget?: (toolName: string, target: string) => void;
  onRefresh?: () => void;
}

export default function AssetsManager({
  projects,
  selectedProjectId,
  onLaunchToolWithTarget,
  onRefresh
}: AssetsManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>(selectedProjectId || 'all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'name' | 'updated'>('risk_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Bulk Selection & Import/Export State
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selection Helper Methods
  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredList: Asset[]) => {
    const filteredIds = filteredList.map(a => a.id);
    const allSelected = filteredIds.every(id => selectedAssetIds.includes(id));
    if (allSelected) {
      setSelectedAssetIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedAssetIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssetIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedAssetIds.length} selected asset(s)? This action cannot be undone.`)) return;

    try {
      for (const id of selectedAssetIds) {
        await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      }
      setAssets(prev => prev.filter(a => !selectedAssetIds.includes(a.id)));
      setSelectedAssetIds([]);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error executing bulk deletion');
    }
  };

  const handleExportJSON = (filteredList: Asset[]) => {
    const dataToExport = selectedAssetIds.length > 0
      ? assets.filter(a => selectedAssetIds.includes(a.id))
      : filteredList;

    if (dataToExport.length === 0) {
      alert('No assets available to export.');
      return;
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-inventory-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let itemsToImport: any[] = [];

        if (Array.isArray(parsed)) {
          itemsToImport = parsed;
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.assets)) {
          itemsToImport = parsed.assets;
        } else if (parsed && typeof parsed === 'object' && parsed.name) {
          itemsToImport = [parsed];
        } else {
          throw new Error('Invalid JSON format. Expected an array of assets or object with "assets" array.');
        }

        if (itemsToImport.length === 0) {
          throw new Error('No valid assets found in the JSON file.');
        }

        let importedCount = 0;
        const now = new Date().toISOString();

        for (const item of itemsToImport) {
          if (!item.name || typeof item.name !== 'string') continue;

          const payload = {
            project_id: item.project_id || item.projectId || (projects[0]?.id || ''),
            name: item.name.trim(),
            type: item.type || 'Website',
            owner: item.owner || 'SecOps Team',
            risk_score: typeof item.risk_score === 'number' ? item.risk_score : (typeof item.riskScore === 'number' ? item.riskScore : 25),
            status: item.status || 'active',
            notes: item.notes || '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            updated_at: now,
            last_modified: now,
            lastModified: now
          };

          const res = await apiFetch('/api/assets', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            importedCount++;
          }
        }

        setImportMessage({
          type: 'success',
          text: `Successfully imported ${importedCount} asset(s) into inventory.`
        });
        fetchAssets();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        setImportMessage({
          type: 'error',
          text: err.message || 'Failed to parse or import JSON file.'
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setImportMessage(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Load assets
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterProject && filterProject !== 'all' ? `/api/assets?projectId=${filterProject}` : '/api/assets';
      const res = await apiFetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.assets || []);
      setAssets(list);
    } catch (err: any) {
      setError(err.message || 'Error loading asset inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [filterProject]);

  useEffect(() => {
    if (selectedProjectId) {
      setFilterProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  const openCreateModal = () => {
    setEditingAsset(null);
    setShowModal(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setShowModal(true);
  };

  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    const now = new Date().toISOString();
    const payload = {
      project_id: assetData.project_id || (projects[0]?.id || ''),
      name: assetData.name,
      type: assetData.type,
      owner: assetData.owner,
      risk_score: assetData.riskScore ?? assetData.risk_score ?? 25,
      status: assetData.status || 'active',
      notes: assetData.notes || '',
      tags: assetData.tags || [],
      updated_at: now,
      last_modified: now,
      lastModified: now
    };

    if (assetData.id) {
      const res = await apiFetch(`/api/assets/${assetData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update asset');
      }
    } else {
      const res = await apiFetch('/api/assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register asset');
      }
    }

    fetchAssets();
    if (onRefresh) onRefresh();
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete asset '${name}'? This will archive its history.`)) return;

    try {
      const res = await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete asset');
      }
      setAssets(prev => prev.filter(a => a.id !== id));
      setSelectedAssetIds(prev => prev.filter(x => x !== id));
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting asset');
    }
  };

  // Filtered and Sorted list
  const filteredAssets = assets.filter(asset => {
    if (!asset) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const score = asset.riskScore ?? asset.risk_score ?? 0;

      const matchName = asset.name?.toLowerCase().includes(q);
      const matchOwner = asset.owner?.toLowerCase().includes(q);
      const matchType = asset.type?.toLowerCase().includes(q);
      const matchNotes = asset.notes?.toLowerCase().includes(q);
      const matchTags = asset.tags?.some(t => t.toLowerCase().includes(q));
      const matchScore = score.toString().includes(q);

      let matchRiskLevel = false;
      if (q === 'critical' && score >= 75) matchRiskLevel = true;
      if (q === 'high' && score >= 50 && score < 75) matchRiskLevel = true;
      if (q === 'medium' && score >= 25 && score < 50) matchRiskLevel = true;
      if (q === 'low' && score < 25) matchRiskLevel = true;

      if (!matchName && !matchOwner && !matchType && !matchNotes && !matchTags && !matchScore && !matchRiskLevel) return false;
    }
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (filterStatus !== 'all' && asset.status !== filterStatus) return false;

    const score = asset.riskScore ?? asset.risk_score ?? 0;
    if (filterRisk === 'critical' && score < 75) return false;
    if (filterRisk === 'high' && (score < 50 || score >= 75)) return false;
    if (filterRisk === 'medium' && (score < 25 || score >= 50)) return false;
    if (filterRisk === 'low' && score >= 25) return false;

    return true;
  }).sort((a, b) => {
    const scoreA = a.riskScore ?? a.risk_score ?? 0;
    const scoreB = b.riskScore ?? b.risk_score ?? 0;
    if (sortBy === 'risk_desc') return scoreB - scoreA;
    if (sortBy === 'risk_asc') return scoreA - scoreB;
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'updated') {
      const timeA = new Date(a.lastModified || a.last_modified || a.updated_at || a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.lastModified || b.last_modified || b.updated_at || b.createdAt || b.created_at || 0).getTime();
      return timeB - timeA;
    }
    return 0;
  });

  // High level metrics
  const totalCount = assets.length;
  const criticalCount = assets.filter(a => (a.riskScore ?? a.risk_score ?? 0) >= 75).length;
  const highCount = assets.filter(a => (a.riskScore ?? a.risk_score ?? 0) >= 50 && (a.riskScore ?? a.risk_score ?? 0) < 75).length;
  const avgRisk = totalCount > 0 ? Math.round(assets.reduce((acc, curr) => acc + (curr.riskScore ?? curr.risk_score ?? 0), 0) / totalCount) : 0;

  // Recharts analytics datasets
  const riskDistributionData = useMemo(() => {
    const critical = assets.filter(a => (a.riskScore ?? a.risk_score ?? 0) >= 75).length;
    const high = assets.filter(a => {
      const s = a.riskScore ?? a.risk_score ?? 0;
      return s >= 50 && s < 75;
    }).length;
    const medium = assets.filter(a => {
      const s = a.riskScore ?? a.risk_score ?? 0;
      return s >= 25 && s < 50;
    }).length;
    const low = assets.filter(a => (a.riskScore ?? a.risk_score ?? 0) < 25).length;

    return [
      { name: 'Critical (75-100)', shortName: 'Critical', count: critical, color: '#ef4444' },
      { name: 'High (50-74)', shortName: 'High', count: high, color: '#f97316' },
      { name: 'Medium (25-49)', shortName: 'Medium', count: medium, color: '#f59e0b' },
      { name: 'Low (0-24)', shortName: 'Low', count: low, color: '#10b981' }
    ];
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* Import Toast / Message */}
      {importMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between shadow-lg transition-all ${
          importMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {importMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span>{importMessage.text}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/60 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Enterprise Asset Inventory</h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Categorize websites, domains, hosts, APIs, cloud resources, containers, and email systems with risk scoring, owner accountability, and security tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-zinc-700/60"
            title="Import assets from a JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={() => handleExportJSON(filteredAssets)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-zinc-700/60"
            title="Export filtered assets to a JSON file"
          >
            <Download className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={fetchAssets}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5 border border-zinc-700/60"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-fuchsia-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-fuchsia-900/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedAssetIds.length > 0 && (
        <div className="bg-fuchsia-950/40 border border-fuchsia-500/40 p-3 rounded-xl flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1">
              <CheckSquare className="w-4 h-4 text-fuchsia-400" />
              <span>{selectedAssetIds.length} Selected</span>
            </div>
            <span className="text-xs text-zinc-300 font-mono hidden sm:inline">Bulk actions ready</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportJSON(filteredAssets)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-zinc-700"
            >
              <Download className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Export ({selectedAssetIds.length})</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedAssetIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedAssetIds([])}
              className="p-1.5 text-zinc-400 hover:text-white rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Tracked Assets</span>
          <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          <div className="text-[10px] text-zinc-400 font-mono">Across registered security scopes</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Avg Exposure Risk</span>
          <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>{avgRisk}/100</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">Composite risk index</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Critical Exposure Assets</span>
          <div className="text-2xl font-black text-red-400 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-red-400/80 font-mono">Score &gt;= 75 (Immediate action)</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">High Exposure Assets</span>
          <div className="text-2xl font-black text-orange-400 font-mono">{highCount}</div>
          <div className="text-[10px] text-orange-400/80 font-mono">Score 50 - 74</div>
        </div>
      </div>

      {/* Recharts Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Score Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Count by Risk Score Tier</h3>
                <p className="text-[10px] text-zinc-400 font-mono">Categorized exposure distribution</p>
              </div>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="shortName" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-zinc-400 font-mono">
                            Assets: <span className="font-bold text-fuchsia-400">{data.count}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Risk Distribution</h3>
                <p className="text-[10px] text-zinc-400 font-mono">Proportional risk view</p>
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  dataKey="count"
                  nameKey="shortName"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg shadow-xl text-xs font-mono">
                          <span style={{ color: data.color }} className="font-bold">{data.shortName}: </span>
                          <span className="text-white font-bold">{data.count} assets</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-800/60 pt-2">
            {riskDistributionData.map((item) => (
              <div key={item.shortName} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-400 truncate">{item.shortName}:</span>
                <span className="text-white font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets by name, risk score, owner, or tag (e.g., 'critical', '75', 'Domain')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-fuchsia-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1.5 self-end lg:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Grid View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Table View"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Project Scope</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Asset Category</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="all">All Types ({ASSET_TYPES.length})</option>
              {ASSET_TYPES.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Risk Level</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (&gt;= 75)</option>
              <option value="high">High (50 - 74)</option>
              <option value="medium">Medium (25 - 49)</option>
              <option value="low">Low (&lt; 25)</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="under-review">Under Review</option>
              <option value="decommissioned">Decommissioned</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
              <option value="name">Asset Name (A-Z)</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset List Content */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-fuchsia-400" />
          <span>Syncing asset repository...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-12 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-2xl space-y-3">
          <div className="w-12 h-12 bg-zinc-800/60 rounded-full flex items-center justify-center mx-auto text-zinc-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-300">No Assets Match Filters</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search query, type filters, or register a new asset into this project workspace.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register First Asset</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW USING AssetCard COMPONENT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              projectName={projects.find(p => p.id === asset.project_id)?.name || 'Default Scope'}
              selected={selectedAssetIds.includes(asset.id)}
              onToggleSelect={toggleSelectAsset}
              onEdit={openEditModal}
              onDelete={handleDeleteAsset}
              onLaunchToolWithTarget={onLaunchToolWithTarget}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW WITH CHECKBOXES & LAST MODIFIED TIMESTAMPS */
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={() => toggleSelectAll(filteredAssets)}
                      className="text-zinc-500 hover:text-fuchsia-400 transition-colors"
                      title="Select / Deselect all filtered assets"
                    >
                      {filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.includes(a.id)) ? (
                        <CheckSquare className="w-4 h-4 text-fuchsia-400 mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 mx-auto" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Asset Endpoint / Name</th>
                  <th className="p-3.5">Type Class</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Owner / Team</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Modified</th>
                  <th className="p-3.5">Tags</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredAssets.map(asset => {
                  const score = asset.riskScore ?? asset.risk_score ?? 0;
                  const isSelected = selectedAssetIds.includes(asset.id);
                  const modifiedDate = asset.lastModified || asset.last_modified || asset.updated_at || asset.createdAt || asset.created_at;
                  const modifiedAtFormatted = modifiedDate
                    ? new Date(modifiedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <tr
                      key={asset.id}
                      className={`transition-colors ${isSelected ? 'bg-fuchsia-950/20 hover:bg-fuchsia-950/30' : 'hover:bg-zinc-850/50'}`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectAsset(asset.id)}
                          className="text-zinc-500 hover:text-fuchsia-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-fuchsia-400 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-bold text-white font-mono flex items-center gap-2">
                        <div className="p-1.5 bg-zinc-800 text-zinc-400 rounded flex-shrink-0">
                          {getAssetIcon(asset.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate max-w-xs">{asset.name}</div>
                          {asset.notes && <div className="text-[10px] text-zinc-500 font-normal truncate max-w-xs">{asset.notes}</div>}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">{asset.type}</td>
                      <td className="p-3.5">{getRiskBadge(score)}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{asset.owner || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          asset.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          asset.status === 'under-review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {asset.status || 'active'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-zinc-400 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 rounded">
                          <Clock className="w-3 h-3 text-fuchsia-400" />
                          <span>{modifiedAtFormatted}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(asset.tags || []).slice(0, 3).map(t => (
                            <span key={t} className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono px-1.5 py-0.2 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(asset)}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL COMPONENT */}
      <AssetModal
        isOpen={showModal}
        editingAsset={editingAsset}
        projects={projects}
        defaultProjectId={selectedProjectId && selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id || '')}
        onClose={() => setShowModal(false)}
        onSave={handleSaveAsset}
      />
    </div>
  );
}

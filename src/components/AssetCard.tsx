import React from 'react';
import {
  Globe,
  Server,
  Cpu,
  Box,
  Code,
  Cloud,
  Mail,
  Wifi,
  Layers,
  AlertTriangle,
  User,
  Calendar,
  Zap,
  Edit3,
  Trash2,
  Clock,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { Asset, AssetType } from '../types/asset';

export function getAssetIcon(type: AssetType) {
  switch (type) {
    case 'Website':
    case 'Domain':
    case 'Subdomain':
      return <Globe className="w-4 h-4" />;
    case 'Application':
    case 'Repository':
      return <Code className="w-4 h-4" />;
    case 'API':
      return <Zap className="w-4 h-4" />;
    case 'Server':
    case 'Host':
      return <Server className="w-4 h-4" />;
    case 'Container':
      return <Box className="w-4 h-4" />;
    case 'Virtual Machine':
      return <Cpu className="w-4 h-4" />;
    case 'Cloud Resource':
      return <Cloud className="w-4 h-4" />;
    case 'Email Domain':
      return <Mail className="w-4 h-4" />;
    case 'Public IP':
    case 'Internal IP':
      return <Wifi className="w-4 h-4" />;
    default:
      return <Layers className="w-4 h-4" />;
  }
}

export function getRiskBadge(score: number, severity?: string) {
  const sev = severity || (score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low');

  switch (sev) {
    case 'Critical':
      return (
        <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-red-900/20">
          <AlertTriangle className="w-3 h-3 text-red-400" /> Critical ({score})
        </span>
      );
    case 'High':
      return (
        <span className="bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-orange-400" /> High ({score})
        </span>
      );
    case 'Medium':
      return (
        <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
          Medium ({score})
        </span>
      );
    case 'Low':
      return (
        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
          Low ({score})
        </span>
      );
    case 'Info':
      return (
        <span className="bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
          Info ({score})
        </span>
      );
    default:
      return (
        <span className="bg-zinc-800 text-zinc-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
          {sev} ({score})
        </span>
      );
  }
}

export function getSeverityCardStyles(score: number, severity?: string, isSelected?: boolean, isLocked?: boolean) {
  if (isSelected) {
    return 'border-fuchsia-500/80 bg-fuchsia-950/20 shadow-md shadow-fuchsia-950/30';
  }

  const sev = severity || (score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low');

  if (isLocked) {
    return 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60';
  }

  switch (sev) {
    case 'Critical':
      return 'border-red-500/40 bg-red-950/10 hover:border-red-500/70 hover:bg-red-950/20';
    case 'High':
      return 'border-orange-500/40 bg-orange-950/10 hover:border-orange-500/70 hover:bg-orange-950/20';
    case 'Medium':
      return 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60';
    case 'Low':
      return 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/60';
    case 'Info':
      return 'border-blue-500/30 bg-blue-950/10 hover:border-blue-500/60';
    default:
      return 'border-zinc-800/60 hover:border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-900';
  }
}

export interface AssetCardProps {
  asset: Asset;
  projectName?: string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onToggleLock?: (id: string, currentLocked: boolean) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string, name: string) => void;
  onLaunchToolWithTarget?: (toolName: string, target: string) => void;
}

export function AssetCard({
  asset,
  projectName = 'Default Scope',
  selected = false,
  onToggleSelect,
  onToggleLock,
  onEdit,
  onDelete,
  onLaunchToolWithTarget
}: AssetCardProps) {
  const score = asset.riskScore ?? asset.risk_score ?? 0;
  const createdAtDate = asset.createdAt || asset.created_at;
  const createdAtFormatted = createdAtDate
    ? new Date(createdAtDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const modifiedDate = asset.lastModified || asset.last_modified || asset.updated_at;
  const modifiedAtFormatted = modifiedDate
    ? new Date(modifiedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const isLocked = Boolean(asset.locked);
  const cardStyle = getSeverityCardStyles(score, asset.severity, selected, isLocked);

  return (
    <div className={`border p-4 rounded-xl space-y-3 transition-all group flex flex-col justify-between shadow-sm relative ${cardStyle}`}>
      <div className="space-y-2.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(asset.id)}
                className="text-zinc-500 hover:text-fuchsia-400 transition-colors flex-shrink-0"
                title={selected ? "Deselect asset" : "Select asset"}
              >
                {selected ? (
                  <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <div className="p-2 bg-zinc-800/80 group-hover:bg-fuchsia-500/10 text-zinc-300 group-hover:text-fuchsia-400 rounded-lg transition-colors flex-shrink-0">
              {getAssetIcon(asset.type)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate flex items-center gap-1.5" title={asset.name}>
                <span>{asset.name}</span>
                {isLocked && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded text-[9px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                <span className="font-semibold text-zinc-400">{asset.type}</span>
                <span>•</span>
                <span className="truncate max-w-[110px]">{projectName}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">{getRiskBadge(score, asset.severity)}</div>
        </div>

        {/* Notes / Context */}
        {asset.notes && (
          <p className="text-[11px] text-zinc-400 line-clamp-2 bg-zinc-950/40 p-2 rounded border border-zinc-850 font-mono">
            {asset.notes}
          </p>
        )}

        {/* Owner & Status Row */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
          <div className="flex items-center gap-1 text-zinc-400 truncate max-w-[160px]">
            <User className="w-3 h-3 text-zinc-500 flex-shrink-0" />
            <span className="truncate">{asset.owner || 'Unassigned'}</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            asset.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            asset.status === 'under-review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {asset.status || 'active'}
          </span>
        </div>

        {/* Timestamps & Last Modified History Badge */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-mono pt-0.5">
          {createdAtFormatted && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-600" />
              <span>Added {createdAtFormatted}</span>
            </div>
          )}
          {modifiedAtFormatted && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 rounded text-[9px]">
              <Clock className="w-2.5 h-2.5 text-fuchsia-400" />
              <span>Mod {modifiedAtFormatted}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {asset.tags.map(t => (
              <span key={t} className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-zinc-800/50 flex items-center justify-between text-xs mt-2">
        {onLaunchToolWithTarget ? (
          <button
            onClick={() => {
              let tool = 'header';
              if (asset.type === 'Domain' || asset.type === 'Subdomain' || asset.type === 'Email Domain' || asset.type === 'Website') tool = 'dns';
              if (asset.type === 'Public IP' || asset.type === 'Internal IP') tool = 'ioc';
              onLaunchToolWithTarget(tool, asset.name);
            }}
            className="text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Launch Analysis</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-1">
          {/* Lock / Unlock Toggle Button */}
          {onToggleLock && (
            <button
              onClick={() => onToggleLock(asset.id, isLocked)}
              className={`p-1.5 rounded transition-colors ${isLocked ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title={isLocked ? "Unlock Asset Set" : "Lock Asset Set Scope"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => onEdit(asset)}
            disabled={isLocked}
            className={`p-1.5 rounded transition-colors ${isLocked ? 'opacity-40 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
            title={isLocked ? "Asset scope is locked" : "Edit Asset"}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(asset.id, asset.name)}
            disabled={isLocked}
            className={`p-1.5 rounded transition-colors ${isLocked ? 'opacity-40 cursor-not-allowed text-zinc-600' : 'hover:bg-red-500/20 text-zinc-400 hover:text-red-400'}`}
            title={isLocked ? "Asset scope is locked" : "Delete Asset"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssetCard;

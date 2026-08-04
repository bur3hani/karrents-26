import React from 'react';
import {
  Shield,
  ShieldAlert,
  Globe,
  Lock,
  Mail,
  Terminal,
  FileText,
  Bookmark,
  Bell,
  CreditCard,
  Zap,
  ExternalLink,
  User,
  Settings,
  Sparkles,
  Layers,
  FolderGit2,
  Building2,
  Users,
  Database,
  Search,
  ChevronRight
} from 'lucide-react';
import KarrentsLogo from './KarrentsLogo';
import { EditionMode } from '../types';

export interface SidebarProps {
  appSection: string;
  setAppSection?: (section: any) => void;
  selectedTool?: string;
  onNavigateToSection?: (section: string) => void;
  onSelectTool?: (toolKey: string) => void;
  editionMode?: EditionMode;
  userEmail?: string;
  userPlan?: string;
  onOpenUpgradeModal?: () => void;
  onOpenUpgrade?: () => void;
  onOpenLegal?: () => void;
  onLogout?: () => void;
  onOpenLanding?: () => void;
}

export function Sidebar({
  appSection,
  setAppSection,
  selectedTool = 'ssl',
  onNavigateToSection,
  onSelectTool,
  editionMode = 'community',
  userEmail,
  userPlan = 'Free Tier',
  onOpenUpgradeModal,
  onOpenUpgrade,
  onOpenLegal,
  onLogout,
  onOpenLanding
}: SidebarProps) {
  const handleNavigate = (section: string) => {
    if (setAppSection) setAppSection(section);
    if (onNavigateToSection) onNavigateToSection(section);
  };

  const handleToolClick = (toolKey: string) => {
    if (onSelectTool) onSelectTool(toolKey);
    handleNavigate('tools');
  };

  const handleUpgrade = () => {
    if (onOpenUpgradeModal) onOpenUpgradeModal();
    if (onOpenUpgrade) onOpenUpgrade();
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col h-full select-none shrink-0 font-sans">
      {/* Sidebar Header Brand Logo */}
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div
          onClick={() => onNavigateToSection('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <KarrentsLogo className="w-6 h-6 text-white group-hover:text-brand-neon transition-colors" glow={true} />
          <div className="flex flex-col">
            <span className="font-black text-white text-sm tracking-tight leading-none group-hover:text-brand-neon transition-colors">
              Karrents
            </span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
              PLG Utility Suite
            </span>
          </div>
        </div>

        {editionMode === 'pro' ? (
          <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold rounded-full">
            PRO
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold rounded-full">
            FREE
          </span>
        )}
      </div>

      {/* Main Nav Menu Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {/* QUICK UTILITIES (No Auth Required) */}
        <div className="space-y-1">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2.5 mb-2 flex items-center justify-between">
            <span>Quick Utilities</span>
            <span className="text-[9px] font-mono font-normal text-emerald-400">Public</span>
          </div>

          <button
            type="button"
            onClick={() => handleToolClick('ssl')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'tools' && selectedTool === 'ssl'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-green-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-green-400 shrink-0" />
              <span>SSL / TLS Checker</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Fast</span>
          </button>

          <button
            type="button"
            onClick={() => handleToolClick('headers')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'tools' && selectedTool === 'headers'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Security Headers</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Audit</span>
          </button>

          <button
            type="button"
            onClick={() => handleToolClick('dns')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'tools' && (selectedTool === 'dns' || selectedTool === 'email')
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-cyan-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>DNS & Email (SPF/DKIM)</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">DMARC</span>
          </button>

          <button
            type="button"
            onClick={() => handleToolClick('ioc')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'tools' && selectedTool === 'ioc'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-amber-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Threat IOC Lookup</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Intel</span>
          </button>

          <button
            type="button"
            onClick={() => handleToolClick('cve')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'tools' && selectedTool === 'cve'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-red-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>CVE Explorer</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">CVE</span>
          </button>
        </div>

        {/* MY WORKBENCH (Community / Pro) */}
        <div className="space-y-1">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2.5 mb-2 flex items-center justify-between">
            <span>My Workbench</span>
            <span className="text-[9px] font-mono text-zinc-600">Saved State</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSection('dashboard')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'dashboard'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-purple-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Operations Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSection('saved-reports')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-semibold ${
              appSection === 'saved-reports'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-fuchsia-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-fuchsia-400 shrink-0" />
              <span>Saved Audits & History</span>
            </div>
            {editionMode === 'pro' ? (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Permanent</span>
            ) : (
              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">24h</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSection('notifications')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'notifications'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-amber-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Watchlists & Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSection('assets')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'assets'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Monitored Assets</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSection('findings')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'findings'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-red-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Findings Registry</span>
          </button>
        </div>

        {/* ACCOUNT & UPGRADE */}
        <div className="space-y-1 pt-2 border-t border-zinc-800/50">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2.5 mb-2">
            Account & Billing
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSection('pricing')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'pricing'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Subscription & Billing</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToSection('profile')}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2.5 font-semibold ${
              appSection === 'profile'
                ? 'bg-zinc-800/80 text-white font-bold border-l-2 border-purple-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Profile & Credentials</span>
          </button>

          {/* HIGHLIGHTED CTA ELEMENT: UPGRADE TO ZIMAMDR */}
          <div className="pt-3">
            <a
              href="https://zimamdr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/20 transition-all flex items-center justify-between group cursor-pointer border border-purple-400/30"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Upgrade to ZimaMDR</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-[10px] text-zinc-500 text-center mt-1.5 leading-tight font-mono">
              24/7 Continuous MDR Protection
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-zinc-800/50 space-y-2 bg-zinc-950">
        <div
          onClick={() => onNavigateToSection('profile')}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-purple-500/50 hover:bg-zinc-900 transition-all cursor-pointer group"
        >
          <div className="h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black text-white uppercase shrink-0">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'G'}
          </div>
          <div className="truncate min-w-0 flex-1">
            <div className="font-bold text-[11px] text-zinc-200 group-hover:text-white transition-colors capitalize truncate">
              {userEmail ? userEmail.split('@')[0] : 'Guest / Free Tier'}
            </div>
            <div className="text-[9px] text-zinc-500 truncate font-mono">
              {userPlan || 'Community Edition'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

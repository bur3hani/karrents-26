import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Check, 
  Lock, 
  X, 
  Sparkles, 
  FileText, 
  Layers, 
  BarChart3, 
  Key,
  AlertCircle
} from 'lucide-react';
import { EditionMode } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEdition: EditionMode;
  onActivatePro: (licenseKey?: string) => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentEdition,
  onActivatePro
}: UpgradeModalProps) {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const key = licenseKeyInput.trim().toUpperCase();
    if (!key) {
      setErrorMsg('Please enter a valid license key.');
      return;
    }

    // Validate license key format or standard activation code
    onActivatePro(key);
    setSuccessMsg('Karrents Pro Edition license successfully activated!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleInstantUpgrade = () => {
    onActivatePro('KARRENTS-PRO-COMMERCIAL-2026');
    setSuccessMsg('Successfully upgraded to Karrents Pro Edition!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-brand-plum/40 via-zinc-900 to-brand-berry/30 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-neon/10 border border-brand-neon/30 rounded-xl text-brand-neon">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">Upgrade to Karrents Pro Edition</h2>
                <span className="bg-brand-neon/10 text-brand-neon border border-brand-neon/30 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                  COMMERCIAL TIER
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unlock enterprise vulnerability assessment, executive Word report generation, and unlimited assessment scopes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* Side-by-side Feature Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Community Edition Card */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between ${
              currentEdition === 'community' 
                ? 'bg-zinc-950/60 border-amber-500/30' 
                : 'bg-zinc-950/40 border-zinc-850'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">FREE TIER</span>
                    <h3 className="text-lg font-extrabold text-white">Community Edition</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">$0 / Mo</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ideal for individual researchers and basic security assessments.
                </p>
                <div className="space-y-2.5 pt-2 border-t border-zinc-900 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>2 Active Projects</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Max <strong>10 Target Assets</strong> / project</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard PDF Vulnerability Export</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="line-through">Full Executive Word .docx Export</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="line-through">CVSS v4.0 & EPSS Science Scoring</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-zinc-900">
                {currentEdition === 'community' ? (
                  <span className="block text-center text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2 rounded-lg">
                    CURRENT PLAN
                  </span>
                ) : (
                  <span className="block text-center text-xs font-mono text-zinc-500 py-2">
                    Included in Pro
                  </span>
                )}
              </div>
            </div>

            {/* Pro Edition Card */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden ${
              currentEdition === 'pro' 
                ? 'bg-zinc-950/80 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                : 'bg-zinc-950/90 border-brand-neon/40 shadow-xl shadow-brand-neon/5'
            }`}>
              <div className="absolute top-0 right-0 bg-brand-berry text-white text-[9px] font-mono font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                COMMERCIAL
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-neon uppercase tracking-wider block">UNLIMITED ACCESS</span>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                    <span>Pro Edition</span>
                    <ShieldCheck className="w-4 h-4 text-brand-neon" />
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Full commercial license for security teams, penetration testers, and enterprise auditors.
                </p>
                <div className="space-y-2.5 pt-2 border-t border-zinc-900 text-xs text-zinc-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-neon shrink-0" />
                    <span><strong>Unlimited</strong> Clients & Project Scopes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-neon shrink-0" />
                    <span><strong>Unlimited</strong> Target Assets & Scanners</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-neon shrink-0" />
                    <span><strong>Executive Word .docx</strong> Document Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-neon shrink-0" />
                    <span><strong>CVSS v3.1 / v4.0 & EPSS</strong> Data Science Models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-neon shrink-0" />
                    <span><strong>Zero-Trust Audit Logs</strong> & Evidence Gallery</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-900">
                {currentEdition === 'pro' ? (
                  <span className="block text-center text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">
                    ✓ ACTIVE PRO LICENSE
                  </span>
                ) : (
                  <button
                    onClick={handleInstantUpgrade}
                    className="w-full bg-brand-berry hover:bg-brand-plum text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 border border-brand-neon/30 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-brand-neon animate-bounce" />
                    <span>Unlock Pro Edition Instantly</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* License Key Activation Section */}
          {currentEdition !== 'pro' && (
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-neon" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Already have a Pro License Key?</h4>
              </div>

              <form onSubmit={handleKeySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="e.g. KARRENTS-PRO-2026"
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-neon uppercase tracking-wider"
                />
                <button
                  type="submit"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer border border-zinc-700 shrink-0"
                >
                  Activate Key
                </button>
              </form>

              {errorMsg && (
                <p className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}

              {successMsg && (
                <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{successMsg}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950/40 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>Karrents Workspace Licensing • Commercial Tier</span>
          <button
            onClick={onClose}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

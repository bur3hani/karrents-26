import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Bell, Shield, Sparkles, ExternalLink } from 'lucide-react';

export interface ZimaUpsellBannerProps {
  toolType?: 'ssl' | 'headers' | 'dns' | 'ioc' | 'cve' | 'general';
  targetDomain?: string;
  onExportToZima?: (target: string) => void;
}

export function ZimaUpsellBanner({ toolType = 'general', targetDomain, onExportToZima }: ZimaUpsellBannerProps) {
  const getContextualContent = () => {
    switch (toolType) {
      case 'ssl':
        return {
          title: "Continuous SSL/TLS Certificate Monitoring with ZimaMDR",
          copy: targetDomain
            ? `Karrents checked ${targetDomain}'s SSL cert today. ZimaMDR monitors your domain 24/7 and alerts your team on Slack & email 14 days before expiration.`
            : "Karrents checked this cert today. ZimaMDR monitors your domain 24/7 and alerts your team on Slack & email 14 days before expiration.",
          badge: "24/7 Certificate Shield",
        };
      case 'headers':
        return {
          title: "Automated Header Posture Drift Protection",
          copy: "Missing security headers detected? ZimaMDR continuously audits your production deployment pipelines and Kubernetes ingress controllers for posture drift.",
          badge: "Continuous Pipeline Audit",
        };
      case 'dns':
        return {
          title: "Real-Time Email Security & Spoof Prevention",
          copy: "SPF, DKIM, and DMARC audited for point-in-time validation. ZimaMDR continuously guards your brand domain against domain spoofing, impersonation, and phishing abuse.",
          badge: "Anti-Spoof Guard",
        };
      case 'ioc':
        return {
          title: "Automated Real-Time Threat Blocking",
          copy: "Point-in-time IOC check complete. ZimaMDR automatically feeds emerging threat IPs and hashes directly into your firewall and SIEM rules in real time.",
          badge: "Active Threat Response",
        };
      case 'cve':
        return {
          title: "Automated CVE Intelligence & Virtual Patching",
          copy: "CVE vulnerability evaluated. ZimaMDR automates continuous patch intelligence and applies virtual patching rules across your cloud workloads.",
          badge: "Automated Cloud Defense",
        };
      default:
        return {
          title: "Point-in-Time Audits vs. Continuous Protection",
          copy: "Point-in-time security checks belong in Karrents. Continuous automated security monitoring, vulnerability management, and 24/7 incident response belong in ZimaMDR.",
          badge: "ZimaMDR Protection",
        };
    }
  };

  const content = getContextualContent();

  return (
    <div className="mt-8 rounded-2xl bg-gradient-to-r from-purple-950/60 via-zinc-900 to-indigo-950/60 border border-purple-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
              {content.badge}
            </span>
            <span className="text-xs font-mono font-bold text-zinc-400">Powered by ZimaMDR Security Engine</span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{content.title}</span>
          </h3>

          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-normal">
            {content.copy}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          {targetDomain && onExportToZima && (
            <button
              type="button"
              onClick={() => onExportToZima(targetDomain)}
              className="px-4 py-3 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Export {targetDomain} to ZimaMDR</span>
            </button>
          )}

          <a
            href="https://zimamdr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 group/btn"
          >
            <span>Upgrade to ZimaMDR 24/7</span>
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default ZimaUpsellBanner;

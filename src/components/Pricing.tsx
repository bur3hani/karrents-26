import React from 'react';
import { 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap, 
  Terminal, 
  Layers, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  ctaText: string;
  isPopular: boolean;
  badge?: string;
}

export default function Pricing() {
  const tiers: Tier[] = [
    {
      name: 'Guest / Sandbox',
      price: '$0',
      period: 'forever',
      description: 'Zero registration diagnostic sandbox for basic server configurations and manual lookups.',
      icon: <Terminal className="w-5 h-5 text-zinc-400" />,
      features: [
        '5 manual DNS scans / hour',
        '3 HTTP Headers reports / hour',
        'Basic NVD CVE listings',
        'Local browser persistent reports',
        'Standard TLS handshakes diagnostic'
      ],
      ctaText: 'Active In Sandbox',
      isPopular: false
    },
    {
      name: 'SOC Professional',
      price: '$49',
      period: 'analyst / month',
      description: 'Designed for individual blue teamers, security engineers, and DevOps auditors requiring automation.',
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      features: [
        'Uncapped DNS & SSL handshakes',
        'Bulk security headers auditing',
        'Unlimited Gemini-Advisor recommendation prompts',
        'Personal API Key (60 req/min)',
        'JSON, CSV, and Markdown exports',
        'CISA KEV wild-exploit alarms'
      ],
      ctaText: 'Upgrade Workspace',
      isPopular: true,
      badge: 'Best Value'
    },
    {
      name: 'Enterprise / Teams',
      price: '$249',
      period: 'organization / month',
      description: 'Collaborative workspaces for corporate security operations centers and compliance organizations.',
      icon: <Layers className="w-5 h-5 text-purple-400" />,
      features: [
        'Shared organization watchlists',
        'Shared collaborative report archives',
        'Custom Webhook notifications (Slack, Teams)',
        'Priority API Key (300 req/min)',
        'SLA guaranteed 99.99% uptime',
        'Corporate audit logs history'
      ],
      ctaText: 'Deploy Multi-Tenant',
      isPopular: false
    }
  ];

  return (
    <div id="pricing-view" className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Transparent Pricing Plans
          </h2>
          <p className="text-xs text-zinc-400">
            No hidden limits. Choose a layout that optimizes security response speeds across your engineering workspace.
          </p>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Compliant with standard SOC2 Type II</span>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            id={`pricing-tier-${idx}`}
            className={`border rounded-xl p-6 space-y-6 flex flex-col justify-between relative transition-all ${
              tier.isPopular
                ? 'bg-blue-600/5 border-blue-500 shadow-xl'
                : 'bg-zinc-900/40 border-zinc-800/40'
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 right-4 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-400 shadow">
                {tier.badge}
              </span>
            )}

            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850">
                  {tier.icon}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">{tier.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Professional security workbench</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white font-mono">{tier.price}</span>
                <span className="text-xs text-zinc-500">/ {tier.period}</span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px]">
                {tier.description}
              </p>

              <hr className="border-zinc-800/40" />

              {/* Features List */}
              <ul className="space-y-2.5 text-xs">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex gap-2 items-start text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              id={`pricing-cta-${idx}`}
              className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all mt-4 ${
                tier.isPopular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {tier.ctaText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

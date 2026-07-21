import React, { useState } from 'react';
import { 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap, 
  Terminal, 
  Layers, 
  Lock,
  CreditCard,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  X
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

interface PricingProps {
  userPlan?: string;
  onUpgradePlan?: (plan: string) => void;
}

export default function Pricing({ userPlan = 'Guest / Sandbox', onUpgradePlan }: PricingProps) {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentError, setPaymentError] = useState('');

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
      icon: <Zap className="w-5 h-5 text-brand-neon" />,
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(formatted);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(value);
  };

  const handleOpenCheckout = (tier: Tier) => {
    if (tier.name === userPlan) return;
    if (tier.name === 'Guest / Sandbox') {
      // Allow downgrading to sandbox immediately
      if (onUpgradePlan) onUpgradePlan('Guest / Sandbox');
      return;
    }
    setSelectedTier(tier);
    setCheckoutStep('details');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setNameOnCard('');
    setPaymentError('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setPaymentError('Please enter a valid 16-digit credit card number.');
      return;
    }
    if (!expiry.includes('/') || expiry.length < 5) {
      setPaymentError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (cvc.length < 3) {
      setPaymentError('Please enter a valid CVC security code.');
      return;
    }
    if (!nameOnCard.trim()) {
      setPaymentError('Please enter the cardholder name.');
      return;
    }

    setPaymentError('');
    setCheckoutStep('processing');

    // Simulate payment gateway handshake (Stripe / Hostinger SSL)
    setTimeout(() => {
      setCheckoutStep('success');
      if (onUpgradePlan && selectedTier) {
        onUpgradePlan(selectedTier.name);
      }
    }, 2000);
  };

  return (
    <div id="pricing-view" className="space-y-8 relative">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-neon" />
            Transparent Pricing Plans
          </h2>
          <p className="text-xs text-zinc-400">
            No hidden limits. Choose a plan that optimizes security response speeds across your engineering workspace.
          </p>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-neon" />
          <span>Compliant with standard SOC2 Type II</span>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => {
          const isActive = tier.name === userPlan;
          return (
            <div
              key={idx}
              id={`pricing-tier-${idx}`}
              className={`border rounded-xl p-6 space-y-6 flex flex-col justify-between relative transition-all ${
                isActive
                  ? 'bg-brand-neon/10 border-brand-neon shadow-xl shadow-brand-neon/5'
                  : tier.isPopular
                  ? 'bg-zinc-900/30 border-zinc-700/80 hover:border-zinc-600'
                  : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-800'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 right-4 bg-brand-berry text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-neon shadow">
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
                    <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                      {tier.name}
                      {isActive && (
                        <span className="text-[8.5px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold px-1 rounded">
                          ACTIVE
                        </span>
                      )}
                    </h3>
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
                      <CheckCircle className="w-4 h-4 text-brand-neon shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                id={`pricing-cta-${idx}`}
                onClick={() => handleOpenCheckout(tier)}
                disabled={isActive && tier.name !== 'Guest / Sandbox'}
                className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all mt-4 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-850/80 cursor-default'
                    : tier.isPopular
                    ? 'bg-brand-berry hover:bg-brand-plum text-white shadow-lg shadow-brand-neon/15'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {isActive ? 'Current Plan' : tier.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* SECURE CHECKOUT MODAL OVERLAY */}
      {selectedTier && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl shadow-black overflow-hidden relative">
            {/* Header */}
            <div className="bg-zinc-950 p-4 border-b border-zinc-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-zinc-400">SECURE BILLING GATEWAY</span>
              </div>
              <button 
                onClick={() => setSelectedTier(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {checkoutStep === 'details' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {/* Workspace Upgrade Summary */}
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850/60 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Selected Subscription</span>
                      <span className="font-bold text-zinc-100 text-xs">{selectedTier.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Total Amount</span>
                      <span className="font-extrabold text-white font-mono text-base">{selectedTier.price}</span>
                    </div>
                  </div>

                  {/* Payment Inputs */}
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-brand-neon"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-brand-neon font-mono"
                          required
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-brand-neon font-mono text-center"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                          Security Code (CVC)
                        </label>
                        <input
                          type="password"
                          value={cvc}
                          onChange={handleCvcChange}
                          placeholder="•••"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-brand-neon font-mono text-center"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-950/20 border border-red-500/25 p-3 rounded-lg text-red-400 text-[10.5px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer mt-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Secure Payment {selectedTier.price}</span>
                  </button>

                  <div className="text-[9.5px] font-mono text-zinc-500 text-center flex items-center justify-center gap-1.5 pt-1">
                    <Shield className="w-3 h-3 text-zinc-600" />
                    <span>PCI-DSS Enforced • Stripe Engine Proxy active</span>
                  </div>
                </form>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-zinc-800 border-t-brand-neon animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-brand-neon animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Processing Secure Payment</h4>
                    <p className="text-[10px] text-zinc-500">Contacting corporate gateway... Exchanging ECDH keys...</p>
                  </div>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white">Payment Authorized Successfully!</h4>
                    <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mx-auto">
                      Your workspace credentials have been upgraded to <strong className="text-brand-neon">{selectedTier.name}</strong>. Enjoy full programmatic API and automated lookups.
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTier(null)}
                    className="bg-brand-berry hover:bg-brand-plum text-white font-semibold px-6 py-2 rounded-lg text-xs transition-colors cursor-pointer mt-2"
                  >
                    Activate Plan Features
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

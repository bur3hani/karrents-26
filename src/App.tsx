import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  Activity,
  Terminal,
  Globe,
  Mail,
  Layers,
  Settings,
  User,
  Search,
  Menu,
  X,
  ChevronRight,
  Cpu,
  ExternalLink,
  Lock,
  Database,
  FileText,
  Check,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  BookOpen,
  Plus,
  HelpCircle,
  Play,
  Bell,
  CreditCard
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ToolsContainer from './components/ToolsContainer';
import MitreExplorer from './components/MitreExplorer';
import AisearchBar from './components/AisearchBar';
import SavedReports from './components/SavedReports';
import KnowledgeBase from './components/KnowledgeBase';
import Documentation from './components/Documentation';
import ApiDoc from './components/ApiDoc';
import Pricing from './components/Pricing';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import Auth from './components/Auth';
import KarrentsLogo from './components/KarrentsLogo';

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'app' | 'auth'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appSection, setAppSection] = useState<'dashboard' | 'tools' | 'mitre' | 'settings' | 'kb' | 'docs' | 'api' | 'pricing' | 'profile' | 'notifications' | 'saved-reports'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<string>('cve');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLaunchTool = (toolName: string) => {
    setSelectedTool(toolName);
    setAppSection('tools');
    setViewMode(isAuthenticated ? 'app' : 'auth');
  };

  // Profile Email extracted from metadata
  const userEmail = "engr.buru@gmail.com";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* ==========================================
          HEADER / TOP BANNER
         ========================================== */}
      {viewMode === 'landing' && (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setViewMode('landing')}>
              <div className="bg-blue-600 p-1.5 rounded-lg border border-blue-500 shadow-lg shadow-blue-500/10">
                <KarrentsLogo className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-sm leading-none">Karrents</span>
                <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mt-0.5">Security Intelligence</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
              <button onClick={() => handleLaunchTool('cve')} className="hover:text-white transition-colors">Tools</button>
              <button onClick={() => { setAppSection('mitre'); setViewMode(isAuthenticated ? 'app' : 'auth'); }} className="hover:text-white transition-colors">Threat Intelligence</button>
              <a href="#trusted-features" className="hover:text-white transition-colors">Why Karrents</a>
              <a href="#platform-statistics" className="hover:text-white transition-colors">Metrics</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                id="btn-nav-sign-in"
                onClick={() => setViewMode(isAuthenticated ? 'app' : 'auth')}
                className="text-xs font-semibold text-zinc-400 hover:text-white px-3.5 py-2 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{isAuthenticated ? 'Enter Workbench' : 'Sign In'}</span>
              </button>
              <button
                id="btn-nav-launch-workbench"
                onClick={() => { setAppSection('dashboard'); setViewMode(isAuthenticated ? 'app' : 'auth'); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-blue-500/10 flex items-center gap-1"
              >
                <span>Launch Workbench</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-zinc-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-zinc-800/50 bg-zinc-950 p-4 space-y-4 text-xs font-semibold text-zinc-400">
              <button onClick={() => { handleLaunchTool('cve'); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-white">CVE Explorer</button>
              <button onClick={() => { setAppSection('mitre'); setViewMode(isAuthenticated ? 'app' : 'auth'); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-white">MITRE Matrix</button>
              <button onClick={() => { handleLaunchTool('headers'); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-white">Security Headers</button>
              <button onClick={() => { setAppSection('dashboard'); setViewMode(isAuthenticated ? 'app' : 'auth'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-white bg-blue-600 text-center rounded-lg font-bold">Launch Workbench</button>
            </div>
          )}
        </header>
      )}

      {/* ==========================================
          LANDING PAGE CONTENT
         ========================================== */}
      {viewMode === 'landing' && (
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-24 md:py-32 border-b border-zinc-800/50">
            {/* Subtle radial glow background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
              <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-sm">
                Operational Security Workbench
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                Practical Cybersecurity <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Tools for Defenders</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Threat intelligence, security analysis, configuration validation, and forensic utilities designed to save security operations center analysts, blue teams, and DevOps engineers daily auditing time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <button
                  id="hero-cta-start"
                  onClick={() => { setAppSection('dashboard'); setViewMode(isAuthenticated ? 'app' : 'auth'); }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/15 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Using Tools</span>
                </button>
                <button
                  id="hero-cta-intel"
                  onClick={() => { setAppSection('mitre'); setViewMode(isAuthenticated ? 'app' : 'auth'); }}
                  className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs px-6 py-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Explore Intelligence</span>
                </button>
              </div>
            </div>
          </section>

          {/* Trusted Features Grid */}
          <section id="trusted-features" className="py-20 bg-zinc-950 border-b border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">Engineered for Operations</h2>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">Standard capabilities designed to optimize cyber workflows</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">Strict Zero-Logs Policy</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">We evaluate targets in memory. Searched domains, server config queries, and custom indicators of compromise are never stored or logged.</p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">AI Forensic Co-pilot</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">Integrated server-side Gemini 3.5 engine automatically generates configurations, assesses technical risks, and structures remediation playbooks.</p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">Active Network Inquiries</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">Execute live queries against target SSL systems, email DNS records, and security headers directly from our secure backend environment.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Tools Showcases */}
          <section id="featured-tools" className="py-20 bg-zinc-900/20 border-b border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">Forensic Utility Suites</h2>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">Interactive modules supporting daily operations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. CVE Explorer */}
                <div onClick={() => handleLaunchTool('cve')} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
                      <ShieldAlert className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Threat Intelligence</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">CVE Explorer</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Query NVD databases with full business/technical impact summaries and remediation configs.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Analyze vulnerabilities</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 2. Security Headers */}
                <div onClick={() => handleLaunchTool('headers')} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                      <Globe className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Web Security</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">HTTP Security Headers</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Scan client servers for CSP, HSTS, and X-Frame security postures. Generates server mitigations.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Audit configurations</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 3. TLS/SSL Checker */}
                <div onClick={() => handleLaunchTool('ssl')} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Cryptographic check</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">TLS/SSL Checker</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Establish secure TCP handshakes to verify certificate chain signatures, cipher protocols, and expiries.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Verify certificates</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 4. IOC Threat lookup */}
                <div onClick={() => handleLaunchTool('ioc')} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
                      <Terminal className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Forensics</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">IOC Lookup</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Scan suspicious IP addresses, malware files hashes or emails for APT campaigns and active C2 callback rules.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Check threat index</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 5. CVSS Calculator */}
                <div onClick={() => { setAppSection('tools'); setSelectedTool('cve'); setViewMode('app'); }} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg flex items-center justify-center">
                      <Activity className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Standards</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">CVSS v3.1 Calculator</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Interactive metrics configuration module supporting immediate subscore weight calculations and vectors.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Evaluate metrics</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 6. Email Security */}
                <div onClick={() => handleLaunchTool('email')} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Mail Sec</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight mb-1 group-hover:text-blue-400 transition-colors">Email Security Auditor</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Run DNS TXT audits scanning SPF alignments, active DMARC block lists and DKIM guidance.</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:underline">
                    <span>Inspect records</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Statistics */}
          <section id="platform-statistics" className="py-20 bg-zinc-950 border-b border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-white font-mono">197,400+</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Vulnerabilities Indexed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-white font-mono">99.99%</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Service Core Uptime</div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-white font-mono">&lt; 3.2s</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Average Scan Latency</div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-white font-mono">100%</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Secure In-Memory Queries</div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Karrents Comparatives */}
          <section className="py-20 bg-zinc-900/10 border-b border-zinc-800/50">
            <div className="max-w-5xl mx-auto px-4 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">Why Karrents</h2>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">Engineered to deliver clear operational logic, not metrics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl space-y-4">
                  <h3 className="font-bold text-red-400 flex items-center gap-2 text-sm">
                    <X className="w-4 h-4 shrink-0" />
                    Traditional Utilities
                  </h3>
                  <ul className="space-y-2 text-zinc-400 leading-relaxed">
                    <li>● Displays basic results without explanatory context</li>
                    <li>● Fails to analyze technical or organizational impact</li>
                    <li>● Doesn't reference standard MITRE or NIST frameworks</li>
                    <li>● Relies on copy-paste manual remediation workflows</li>
                  </ul>
                </div>

                <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-xl space-y-4">
                  <h3 className="font-bold text-green-400 flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    The Karrents Workbench
                  </h3>
                  <ul className="space-y-2 text-zinc-300 leading-relaxed animate-pulse">
                    <li>● Maps every finding to business and security risk models</li>
                    <li>● Seamless integration with advanced Gemini AI advisory</li>
                    <li>● Full mapping of CISA, OWASP, and NIST SP 800-53 rules</li>
                    <li>● Pre-built copyable configuration files for Nginx, Apache, Caddy</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Roadmap */}
          <section className="py-20 bg-zinc-950 border-b border-zinc-800/50">
            <div className="max-w-4xl mx-auto px-4 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">The Roadmap</h2>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">Active scaling of enterprise workbench features</p>
              </div>

              <div className="relative border-l border-zinc-800 pl-6 ml-4 space-y-8 text-xs">
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-3 w-3 bg-blue-500 rounded-full border border-zinc-950" />
                  <h4 className="font-bold text-zinc-100 text-sm">Q3 2026: Team Workspaces & Watchlists</h4>
                  <p className="text-zinc-400 mt-1">Multi-analyst logins, unified team directories, and active subdomain monitoring alerts via Slack or Email integrations.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-3 w-3 bg-blue-500/30 rounded-full border border-zinc-950" />
                  <h4 className="font-bold text-zinc-100 text-sm">Q4 2026: Scheduled Vulnerability Sweeps</h4>
                  <p className="text-zinc-400 mt-1">Automated daily scanning of configured HTTP headers, SPF registries, and TLS certificates, presenting weekly trends in beautiful report emails.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 h-3 w-3 bg-blue-500/30 rounded-full border border-zinc-950" />
                  <h4 className="font-bold text-zinc-100 text-sm">Q1 2027: Developer API & CLI Client</h4>
                  <p className="text-zinc-400 mt-1">Direct terminal query wrappers allowing dev teams to verify headers, validate SPF domains, and check SSL expiries right from CI/CD pipeline tests.</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section id="faq" className="py-20 bg-zinc-900/10">
            <div className="max-w-3xl mx-auto px-4 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">Frequently Answered Queries</h2>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">Answers regarding architecture and data privacy</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    q: "Is target data stored inside your databases?",
                    a: "No. Karrents prioritizes operational safety. All certificate checks, DNS resolves, and header scans are performed on-demand in-memory on our server. No domain, IP, or credential indicator is ever stored."
                  },
                  {
                    q: "How does the AI Advisory feature generate remediations?",
                    a: "Our backend integrates with server-side Gemini 3.5 models. When you scan configurations or search threat profiles, the model validates the parameters, correlates NIST and MITRE catalogs, and translates them into precise mitigation directives."
                  },
                  {
                    q: "Can I integrate Karrents into our active SIEM or SOAR runs?",
                    a: "Currently, you can export all reports as structured JSON documents by clicking 'Export Intel'. Standardized developer API triggers and command-line clients are active on our immediate Q1 roadmap."
                  }
                ].map((faq, index) => {
                  const isOpen = faqOpen[index];
                  return (
                    <div key={index} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden transition-all">
                      <button
                        id={`faq-btn-${index}`}
                        onClick={() => toggleFaq(index)}
                        className="w-full text-left px-5 py-4 text-xs font-semibold text-zinc-200 flex justify-between items-center hover:bg-zinc-800/30"
                      >
                        <span>{faq.q}</span>
                        <span className="text-zinc-400 font-bold">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/30 pt-3 bg-zinc-950/20">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ==========================================
          LANDING PAGE FOOTER
         ========================================== */}
      {viewMode === 'landing' && (
        <footer className="bg-zinc-950 border-t border-zinc-800/50 py-12 text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg border border-blue-500">
                  <KarrentsLogo className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold tracking-tight text-white text-sm leading-none">Karrents</span>
                  <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mt-0.5">Security Intelligence</span>
                </div>
              </div>
              <p className="leading-relaxed">Practical security tools, threat intelligence, and server-side auditing utilities designed for defenders.</p>
              <div className="text-[10px] text-zinc-600">© 2026 Karrents Security Intelligence. All rights reserved.</div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-zinc-200 text-xs">Security Utilities</h4>
              <ul className="space-y-1.5 text-zinc-400">
                <li><button onClick={() => handleLaunchTool('cve')} className="hover:text-white transition-colors">CVE Explorer</button></li>
                <li><button onClick={() => handleLaunchTool('headers')} className="hover:text-white transition-colors">HTTP Headers Scan</button></li>
                <li><button onClick={() => handleLaunchTool('ssl')} className="hover:text-white transition-colors">TLS/SSL Check</button></li>
                <li><button onClick={() => handleLaunchTool('email')} className="hover:text-white transition-colors">Email Spoofing Audit</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-zinc-200 text-xs">Advisory Resources</h4>
              <ul className="space-y-1.5 text-zinc-400">
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Answered Queries</a></li>
                <li><button onClick={() => { setAppSection('mitre'); setViewMode(isAuthenticated ? 'app' : 'auth'); }} className="hover:text-white transition-colors">MITRE ATT&CK Matrix</button></li>
                <li><a href="#trusted-features" className="hover:text-white transition-colors">Zero Logs Policy Details</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-zinc-200 text-xs">Threat Intelligence Feed</h4>
              <p className="leading-relaxed">Sign up to receive weekly security briefs mapping newly discovered CVEs directly to MITRE matrices.</p>
              <div className="flex gap-1.5">
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="name@agency.com"
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 w-full focus:outline-none focus:border-blue-500"
                />
                <button
                  id="newsletter-submit"
                  onClick={() => alert("Thank you! You have been subscribed to Karrents Threat briefs.")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded transition-colors text-[11px]"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ==========================================
          SECURE GATEWAY AUTHENTICATION VIEW (AUTH)
         ========================================== */}
      {viewMode === 'auth' && (
        <Auth 
          onLoginSuccess={(email) => { 
            setIsAuthenticated(true); 
            setViewMode('app'); 
          }} 
          userEmail={userEmail} 
        />
      )}

      {/* ==========================================
          WORKBENCH INTERACTIVE DASHBOARD VIEW (APP)
         ========================================== */}
      {viewMode === 'app' && (
        <div className="flex-grow flex h-screen overflow-hidden">
          {/* Workbench Left Sidebar */}
          <aside className="w-64 bg-zinc-950 border-r border-zinc-800/50 flex flex-col justify-between hidden md:flex shrink-0">
            <div className="p-5 space-y-6">
              {/* Logo / Brand */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('landing')}>
                  <div className="bg-blue-600 p-1 rounded border border-blue-500 shrink-0">
                    <KarrentsLogo className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-[11px] text-white tracking-tight leading-none">Karrents</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Intelligence</span>
                  </div>
                </div>
                <button
                  id="btn-secure-logout"
                  onClick={() => {
                    setIsAuthenticated(false);
                    setViewMode('landing');
                  }}
                  className="text-[9px] bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/10 hover:text-red-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-all shrink-0"
                >
                  Logout
                </button>
              </div>

              {/* Sidebar navigations */}
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 custom-scrollbar">
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">Workbench</div>
                  <div className="space-y-0.5">
                    <button
                      id="aside-nav-dashboard"
                      onClick={() => setAppSection('dashboard')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'dashboard' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-blue-400/80" />
                      <span>Ops Dashboard</span>
                    </button>

                    <button
                      id="aside-nav-tools"
                      onClick={() => { setAppSection('tools'); setSelectedTool('cve'); }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'tools' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Terminal className="w-4 h-4 text-blue-400/80" />
                      <span>Security Tools</span>
                    </button>

                    <button
                      id="aside-nav-mitre"
                      onClick={() => setAppSection('mitre')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'mitre' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-400/80" />
                      <span>MITRE ATT&CK Matrix</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">Intelligence & Records</div>
                  <div className="space-y-0.5">
                    <button
                      id="aside-nav-kb"
                      onClick={() => setAppSection('kb')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'kb' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Database className="w-4 h-4 text-blue-400/80" />
                      <span>Knowledge Base</span>
                    </button>

                    <button
                      id="aside-nav-saved-reports"
                      onClick={() => setAppSection('saved-reports')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'saved-reports' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-400/80" />
                      <span>Saved Reports</span>
                    </button>

                    <button
                      id="aside-nav-notifications"
                      onClick={() => setAppSection('notifications')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'notifications' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-blue-400/80" />
                      <span>Alert Feed</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">Platform & API</div>
                  <div className="space-y-0.5">
                    <button
                      id="aside-nav-api"
                      onClick={() => setAppSection('api')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'api' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-blue-400/80" />
                      <span>Developer API</span>
                    </button>

                    <button
                      id="aside-nav-docs"
                      onClick={() => setAppSection('docs')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'docs' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-blue-400/80" />
                      <span>Documentation</span>
                    </button>

                    <button
                      id="aside-nav-pricing"
                      onClick={() => setAppSection('pricing')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'pricing' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-400/80" />
                      <span>Workspace Plans</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">Settings</div>
                  <div className="space-y-0.5">
                    <button
                      id="aside-nav-profile"
                      onClick={() => setAppSection('profile')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'profile' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <User className="w-4 h-4 text-blue-400/80" />
                      <span>Profile & Keys</span>
                    </button>

                    <button
                      id="aside-nav-settings"
                      onClick={() => setAppSection('settings')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2.5 font-semibold ${
                        appSection === 'settings' ? 'bg-zinc-800/50 text-blue-400 border-l-2 border-blue-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-blue-400/80" />
                      <span>System Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile badge (using extracted user email engr.buru@gmail.com) */}
            <div className="p-4 border-t border-zinc-800/40 space-y-2">
              <div 
                id="sidebar-profile-card"
                onClick={() => setAppSection('profile')}
                className="flex items-center gap-2.5 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850 hover:border-blue-500/55 hover:bg-zinc-900/70 transition-all cursor-pointer group"
              >
                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white group-hover:bg-blue-500 transition-colors">
                  EB
                </div>
                <div className="truncate space-y-0.5">
                  <div className="font-bold text-[11px] text-zinc-200 group-hover:text-white transition-colors">Buru Security</div>
                  <div className="text-[9.5px] text-zinc-500 truncate select-all">{userEmail}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Workbench Main Content Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
            {/* Workbench Top Bar */}
            <header className="h-16 border-b border-zinc-800/50 bg-zinc-950 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
              {/* Mobile back trigger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('landing')}
                  className="md:hidden bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Shield className="w-4.5 h-4.5" />
                </button>
                <div className="flex md:hidden items-center gap-2 font-bold text-xs">
                  <button onClick={() => setAppSection('dashboard')} className={`px-2 py-1 rounded ${appSection === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400'}`}>Dashboard</button>
                  <button onClick={() => { setAppSection('tools'); setSelectedTool('cve'); }} className={`px-2 py-1 rounded ${appSection === 'tools' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400'}`}>Tools</button>
                  <button onClick={() => setAppSection('mitre')} className={`px-2 py-1 rounded ${appSection === 'mitre' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400'}`}>MITRE</button>
                </div>
                <h1 className="hidden md:block font-bold text-zinc-100 text-sm capitalize">
                  {appSection === 'dashboard' && 'Operations Dashboard'}
                  {appSection === 'tools' && 'Forensic Intelligence Tools'}
                  {appSection === 'mitre' && 'MITRE ATT&CK Mapping'}
                  {appSection === 'kb' && 'Threat Knowledge Base'}
                  {appSection === 'saved-reports' && 'Saved Reports & Audits'}
                  {appSection === 'notifications' && 'Live Alert Feed'}
                  {appSection === 'api' && 'Developer API Portal'}
                  {appSection === 'docs' && 'Platform Documentation'}
                  {appSection === 'pricing' && 'Workspace Plans'}
                  {appSection === 'profile' && 'User Settings & Credentials'}
                  {appSection === 'settings' && 'Workbench Configuration'}
                </h1>
              </div>

              {/* Global search co-pilot */}
              <AisearchBar onNavigateToTool={handleLaunchTool} />

              {/* System metrics */}
              <div className="hidden sm:flex items-center gap-3.5 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>API Connection Online</span>
                </div>
                <span className="text-zinc-800">|</span>
                <span className="text-zinc-500">ENV: Production</span>
              </div>
            </header>

            {/* Workbench Main Body Scroll Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              {appSection === 'dashboard' && (
                <Dashboard onLaunchTool={handleLaunchTool} />
              )}

              {appSection === 'tools' && (
                <ToolsContainer initialActiveTool={selectedTool} />
              )}

              {appSection === 'mitre' && (
                <MitreExplorer />
              )}

              {appSection === 'kb' && (
                <KnowledgeBase onNavigateToTool={handleLaunchTool} />
              )}

              {appSection === 'saved-reports' && (
                <SavedReports />
              )}

              {appSection === 'notifications' && (
                <Notifications />
              )}

              {appSection === 'api' && (
                <ApiDoc />
              )}

              {appSection === 'docs' && (
                <Documentation />
              )}

              {appSection === 'pricing' && (
                <Pricing />
              )}

              {appSection === 'profile' && (
                <Profile />
              )}

              {appSection === 'settings' && (
                <div className="max-w-3xl space-y-6">
                  {/* API Configuration block */}
                  <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-400" />
                        Credentials & Integrations
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Karrents Security Intelligence uses Google Cloud AI Studio secrets management to power dynamic CVE lookups, threat indicators lookup, security headers evaluation, and advisory queries.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-lg text-xs space-y-3.5 leading-relaxed">
                      <div className="flex items-center gap-2 text-green-400 font-semibold text-[11px] uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4" />
                        AI Studio Core API Keys Synced
                      </div>
                      <p className="text-zinc-400">
                        The Google GenAI client is actively proxying queries through <span className="font-mono text-zinc-300">process.env.GEMINI_API_KEY</span>. To configure or renew secrets, navigate to your workspace **Settings &gt; Secrets** panel.
                      </p>
                      <div className="bg-zinc-900 border border-zinc-850 p-3 rounded font-mono text-[10.5px] text-zinc-500 flex items-center justify-between">
                        <span>GEMINI_API_KEY</span>
                        <span className="text-green-400">••••••••••••••••••••ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* System workspace information */}
                  <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        Workspace Specifications
                      </h3>
                      <p className="text-xs text-zinc-400">Current active sandbox deployment metrics.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-1">
                        <span className="text-zinc-500">Node Engine</span>
                        <div className="text-zinc-300">v22.x LTS</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-1">
                        <span className="text-zinc-500">Framework</span>
                        <div className="text-zinc-300">Vite / React 19</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-1">
                        <span className="text-zinc-500">Model Engine</span>
                        <div className="text-zinc-300">Gemini 3.5 Flash</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-1">
                        <span className="text-zinc-500">Logged User</span>
                        <div className="text-zinc-300 truncate select-all">{userEmail}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

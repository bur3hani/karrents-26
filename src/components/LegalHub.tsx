import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Lock,
  Globe,
  Download,
  Search,
  X,
  CheckCircle,
  AlertTriangle,
  Scale,
  Users,
  Eye,
  Building,
  ExternalLink,
  Printer,
  Copy,
  Check
} from 'lucide-react';

export type LegalTab =
  | 'terms'
  | 'privacy'
  | 'gdpr'
  | 'modern-slavery'
  | 'aup'
  | 'vulnerability'
  | 'cookies-subprocessors';

interface LegalHubProps {
  initialTab?: LegalTab;
  onClose?: () => void;
  isModal?: boolean;
}

export default function LegalHub({ initialTab = 'terms', onClose, isModal = false }: LegalHubProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: LegalTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'terms', label: 'Terms & Conditions', icon: <Scale className="w-4 h-4 text-brand-neon" /> },
    { id: 'privacy', label: 'Privacy Policy', icon: <Lock className="w-4 h-4 text-emerald-400" /> },
    { id: 'gdpr', label: 'GDPR Compliance', icon: <Globe className="w-4 h-4 text-sky-400" />, badge: 'EU / UK' },
    { id: 'modern-slavery', label: 'Modern Slavery Statement', icon: <Building className="w-4 h-4 text-amber-400" />, badge: 'Act 2015' },
    { id: 'aup', label: 'Acceptable Use Policy', icon: <AlertTriangle className="w-4 h-4 text-purple-400" /> },
    { id: 'vulnerability', label: 'Vulnerability Disclosure', icon: <Shield className="w-4 h-4 text-rose-400" /> },
    { id: 'cookies-subprocessors', label: 'Cookies & Sub-processors', icon: <Eye className="w-4 h-4 text-indigo-400" /> },
  ];

  const contentContainerClass = isModal
    ? 'max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col'
    : 'max-w-6xl mx-auto space-y-6';

  return (
    <div className={isModal ? 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center' : 'p-4 sm:p-6 lg:p-8'}>
      <div className={contentContainerClass}>
        {/* Header Header Bar */}
        <div className="bg-zinc-900/90 border-b border-zinc-800/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-brand-neon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Legal, Compliance & Trust Center</h2>
                <span className="text-[10px] bg-brand-neon/15 text-brand-neon border border-brand-neon/30 font-mono px-2 py-0.5 rounded-full font-bold">
                  v2026.2
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Official terms, privacy notices, data protection directives, and ethics declarations for Karrents Security Intelligence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy Reference Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-colors cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div className="bg-zinc-900/40 border-b border-zinc-800/60 p-2 sm:px-6 overflow-x-auto custom-scrollbar flex items-center gap-1.5 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand-neon text-white shadow-lg shadow-brand-neon/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-bold ${
                      isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Metadata Bar */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clause (e.g. liability, DPO, logs)..."
              className="bg-transparent text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500">
            <span>Effective Date: July 21, 2026</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Status: Fully Binding & Verified</span>
          </div>
        </div>

        {/* Document Body Area */}
        <div className={`p-6 overflow-y-auto space-y-8 custom-scrollbar text-zinc-300 text-xs sm:text-sm leading-relaxed ${isModal ? 'flex-1' : ''}`}>
          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Terms & Conditions of Service</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Master Subscription & Usage Agreement governing access to Karrents Security Intelligence.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-brand-neon flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important Security Directive & Legal Warning
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Karrents Security Intelligence is strictly provided for authorized cybersecurity auditing, defense testing, threat research, and asset validation. You agree never to perform security scans or threat lookups against infrastructure without explicit, written authorization from the target system owner.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Agreement to Terms</h3>
                <p>
                  By registering for an account, deploying our automated scanning services, calling our public REST API endpoints, or utilizing any features provided by Karrents Security Intelligence ("Karrents", "We", "Us", or "Our"), you ("Customer", "User", or "You") agree to be legally bound by these Terms & Conditions.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Authorized Use & Ethical Testing Rules</h3>
                <p>
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li>You hold full administrative rights or legal permission to audit target domains, IP ranges, and SSL/TLS certificates inputted into Karrents tools.</li>
                  <li>You will not utilize Karrents tools to execute Distributed Denial of Service (DDoS) attacks, unauthorized vulnerability exploitation, or malicious reconnaissance.</li>
                  <li>You will strictly abide by our Acceptable Use Policy (AUP) and all applicable international cybersecurity laws (including the UK Computer Misuse Act 1990 and US CFAA).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Accounts, Subscriptions & Rate Limits</h3>
                <p>
                  Karrents provides Guest, Professional, and Enterprise tier access. Free and Guest tiers are constrained by automated rate limits to protect public scanning infrastructure. Any attempt to bypass rate limits or brute-force API tokens constitutes a material breach of this Agreement.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">4. Intellectual Property & License Rights</h3>
                <p>
                  All proprietary scanning algorithms, threat mapping engines, MITRE ATT&CK correlation logic, and UI visual frameworks remain the exclusive property of Karrents Security Intelligence. Customers are granted a non-exclusive, non-transferable right to access the Workbench for internal security operations.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">5. Disclaimer of Warranties & Limitation of Liability</h3>
                <p>
                  Karrents is provided on an "AS IS" and "AS AVAILABLE" basis. While our threat intelligence maps directly to NIST, NVD, and CISA KEV feeds, security audit reports do not guarantee immunity from zero-day exploits. To the maximum extent permitted by law, Karrents shall not be liable for indirect, incidental, or consequential damages resulting from operational security decisions.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">6. Governing Law & Dispute Resolution</h3>
                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles. Any legal proceedings shall be submitted exclusively to the London Court of International Arbitration (LCIA).
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Privacy Policy & Zero-Logs Architecture</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  How we process, isolate, and protect administrative session data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold block">✓ ZERO SCANNED DATA STORED</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">Target domain lookups, headers, and certificates are evaluated transiently in RAM.</p>
                </div>
                <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold block">✓ ENCRYPTED VAULT SECRETS</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">API keys are encrypted using AES-256-GCM before database sync.</p>
                </div>
                <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold block">✓ NO THIRD-PARTY TRACKING</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">We never sell user emails or telemetry to advertising brokers.</p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Information We Collect</h3>
                <p>
                  We prioritize data minimization. We only collect essential administrative information:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li><strong className="text-white">Account Information:</strong> Business email address, hashed passwords (argon2id / bcrypt), and active plan status.</li>
                  <li><strong className="text-white">Audit Logs:</strong> Timestamps of administrative logins, API key generations, and webhook configurations to support forensic tracking for workspace owners.</li>
                  <li><strong className="text-white">Transient Diagnostic Parameters:</strong> Target domain names or CVE IDs submitted for live lookups are held in ephemeral server memory during execution and discarded immediately after response dispatch.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. How We Use Information</h3>
                <p>
                  Your information is exclusively used to deliver requested security reports, authenticate API calls, enforce rate limits, send critical security alerts via configured webhooks, and maintain platform stability.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Security Measures & Encryption</h3>
                <p>
                  All network traffic in transit is protected via TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS). Data at rest in Karrents database registries is encrypted at rest using FIPS 140-2 validated storage engines.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">4. Data Retention</h3>
                <p>
                  User profile metadata is retained as long as your workspace account remains active. Upon workspace deletion, all associated project records, saved vulnerability reports, and API keys are permanently scrubbed within 7 business days.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: GDPR COMPLIANCE */}
          {activeTab === 'gdpr' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">GDPR & Data Protection Addendum</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Full compliance with General Data Protection Regulation (EU 2016/679) and UK Data Protection Act 2018.
                </p>
              </div>

              <div className="bg-sky-950/30 border border-sky-800/50 p-4 rounded-xl space-y-2">
                <div className="font-bold text-sky-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Data Protection Officer (DPO) Contact
                </div>
                <p className="text-xs text-zinc-300">
                  For formal Data Subject Access Requests (DSAR), Data Processing Agreements (DPA), or privacy queries, contact our dedicated DPO at <span className="font-mono text-sky-300 select-all">dpo@karrents.com</span> or <span className="font-mono text-sky-300 select-all">privacy@karrents.com</span>.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Lawful Basis for Processing</h3>
                <p>
                  Under GDPR Article 6, Karrents processes customer account data under the following lawful bases:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li><strong className="text-white">Contractual Necessity (Article 6(1)(b)):</strong> To deliver cybersecurity threat analysis services as requested under active subscriptions.</li>
                  <li><strong className="text-white">Legitimate Interests (Article 6(1)(f)):</strong> To maintain infrastructure resilience, mitigate cyber attacks against our platform, and prevent illegal misuse.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Data Subject Rights</h3>
                <p>
                  European Union and United Kingdom data subjects hold the following enforceable rights:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <span className="font-bold text-white">1. Right of Access (Art. 15)</span>
                    <p className="text-[11px] text-zinc-400 mt-1">Request a complete copy of all personal data held in your profile registry.</p>
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <span className="font-bold text-white">2. Right to Erasure / Right to be Forgotten (Art. 17)</span>
                    <p className="text-[11px] text-zinc-400 mt-1">Request total deletion of your user profile, saved findings, and API history.</p>
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <span className="font-bold text-white">3. Right to Data Portability (Art. 20)</span>
                    <p className="text-[11px] text-zinc-400 mt-1">Export all stored findings and project metadata in standardized JSON format.</p>
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <span className="font-bold text-white">4. Right to Rectification (Art. 16)</span>
                    <p className="text-[11px] text-zinc-400 mt-1">Update or correct inaccurate email or organizational records instantly via Profile Settings.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. International Data Transfers & SCCs</h3>
                <p>
                  Data hosted by Karrents is maintained within sovereign European and United Kingdom Cloud data centers. Any cross-border administrative transfers are protected by Standard Contractual Clauses (SCCs) approved by the European Commission and the UK International Data Transfer Addendum (IDTA).
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: MODERN SLAVERY STATEMENT */}
          {activeTab === 'modern-slavery' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Modern Slavery & Human Trafficking Statement</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Published pursuant to Section 54 of the UK Modern Slavery Act 2015 for Financial Year 2026.
                </p>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-xl space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Executive Commitment
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Karrents Security Intelligence maintains a strict zero-tolerance approach to modern slavery, human trafficking, forced labor, and child exploitation across our business, technology operations, and global vendor supply chain.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Organizational Structure & Supply Chain</h3>
                <p>
                  Karrents operates as a specialized provider of cybersecurity intelligence, vulnerability assessment software, and threat auditing infrastructure. Our supply chain consists primarily of cloud hosting providers, software engineering toolkits, data center infrastructure, and professional security consulting services.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Supply Chain Due Diligence & Vendor Standards</h3>
                <p>
                  We assess all major technology vendors and cloud infrastructure partners for compliance with international labor laws, including the ILO (International Labour Organization) conventions. Key requirements include:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li>Mandatory verification that all vendor employees work voluntarily under clear employment contracts.</li>
                  <li>Strict prohibition of retention of identity documents or passports.</li>
                  <li>Payment of living wages exceeding local statutory minimum wages in all operational regions.</li>
                  <li>Contractual agreements requiring immediate notification if human rights violations are discovered in upstream sub-tier suppliers.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Whistleblowing & Reporting Mechanism</h3>
                <p>
                  Karrents enforces an open, confidential whistleblowing channel for employees, contractors, and third-party developers. Concerns regarding suspected human rights abuses or unethical practices can be submitted directly to our compliance officer at <span className="font-mono text-amber-300 select-all">compliance@karrents.com</span> without fear of retaliation.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">4. Training & Annual Review</h3>
                <p>
                  All engineering personnel and procurement specialists complete mandatory annual ethics and supply chain compliance training. This Modern Slavery Statement is reviewed annually by the Board of Directors and updated to reflect operational expansions.
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: ACCEPTABLE USE POLICY */}
          {activeTab === 'aup' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Acceptable Use Policy (AUP)</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Rules of engagement and prohibited activities for Karrents security tools and API usage.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Permitted Uses</h3>
                <p>
                  Karrents tools are designed exclusively for legitimate security defense:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-semibold">
                    ✓ Auditing owned domains and subdomains
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-semibold">
                    ✓ Verifying TLS/SSL certificate chains and expiration
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-semibold">
                    ✓ Validating HTTP security header compliance
                  </div>
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-semibold">
                    ✓ Researching CVE vulnerability advisories and CISA KEV feeds
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Strictly Prohibited Activities</h3>
                <p>
                  Users shall NOT under any circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-rose-300">
                  <li>Scan third-party systems without prior written authorization from the system owner.</li>
                  <li>Automate continuous high-frequency requests designed to disrupt or exhaust target network bandwidth.</li>
                  <li>Attempt to bypass rate-limiting controls, IP blocks, or API token quotas.</li>
                  <li>Reverse engineer, decompile, or extract source code from Karrents core analytical engines.</li>
                  <li>Use Karrents outputs to weaponize exploits for illicit black-hat hacking operations.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">3. Enforcement & Account Termination</h3>
                <p>
                  Violation of this AUP will result in immediate suspension or termination of account access, revocation of API tokens, and, where appropriate, reporting of illegal activities to law enforcement authorities.
                </p>
              </section>
            </div>
          )}

          {/* TAB 6: VULNERABILITY DISCLOSURE */}
          {activeTab === 'vulnerability' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Vulnerability Disclosure & Responsible Research</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Our Safe Harbor policy for security researchers reporting bugs in Karrents infrastructure.
                </p>
              </div>

              <div className="bg-rose-950/30 border border-rose-800/50 p-4 rounded-xl space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Responsible Disclosure Safe Harbor
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  If you discover a security flaw in Karrents Security Intelligence platform, we encourage you to notify us immediately. We commit to working with you constructively and will not initiate legal action against researchers acting in good faith under this policy.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. How to Report a Vulnerability</h3>
                <p>
                  Send your encrypted report to <span className="font-mono text-rose-300 select-all font-bold">security@karrents.com</span>. Please include:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li>Detailed steps to reproduce the vulnerability (Proof of Concept).</li>
                  <li>Affected endpoints, components, or URL parameters.</li>
                  <li>Potential impact assessment (CVSS rating estimate).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Our Commitment to Researchers</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li>We will acknowledge receipt of your report within 24 business hours.</li>
                  <li>We will provide a timeline for remediation and keep you informed of progress.</li>
                  <li>We will publicly acknowledge your contribution in our Security Hall of Fame (unless you request anonymity).</li>
                </ul>
              </section>
            </div>
          )}

          {/* TAB 7: COOKIES & SUB-PROCESSORS */}
          {activeTab === 'cookies-subprocessors' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">Cookies & Sub-processors Registry</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Transparent list of essential storage mechanisms and cloud service providers.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Essential Local Storage & Session State</h3>
                <p>
                  Karrents uses strictly functional local storage items. We do NOT use invasive advertising tracking cookies or third-party marketing pixels.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono">
                      <tr>
                        <th className="p-3">Key Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                      <tr>
                        <td className="p-3 font-mono text-brand-neon">karrents_authenticated</td>
                        <td className="p-3 font-mono text-zinc-500">localStorage</td>
                        <td className="p-3">Maintains active session login state</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-brand-neon">karrents_session_token</td>
                        <td className="p-3 font-mono text-zinc-500">localStorage</td>
                        <td className="p-3">Encrypted JWT token for API handshakes</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-brand-neon">karrents_theme</td>
                        <td className="p-3 font-mono text-zinc-500">localStorage</td>
                        <td className="p-3">Stores dark/light theme display preference</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Approved Sub-processors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-white block">Google Cloud Platform (GCP)</span>
                    <span className="text-[11px] text-zinc-400 block">Cloud Hosting & Firestore Security Database</span>
                    <span className="text-[10px] font-mono text-zinc-500">Region: EU (London / Frankfurt)</span>
                  </div>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-white block">Google Gemini AI Engine</span>
                    <span className="text-[11px] text-zinc-400 block">Server-side Threat Intelligence Summarization</span>
                    <span className="text-[10px] font-mono text-zinc-500">Zero data retention for training</span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Bar inside Legal Container */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Karrents Governance & Compliance Registry</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('terms')}
              className="hover:text-white transition-colors underline decoration-zinc-700"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:text-white transition-colors underline decoration-zinc-700"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('gdpr')}
              className="hover:text-white transition-colors underline decoration-zinc-700"
            >
              GDPR Notice
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('modern-slavery')}
              className="hover:text-white transition-colors underline decoration-zinc-700"
            >
              Modern Slavery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Globe,
  Mail,
  Shield,
  Activity,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Cpu,
  Clock,
  Code,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  Info,
  FileText
} from 'lucide-react';
import { CVEData, IOCData, DNSData, EmailSecurityData, HeaderData, SSLData } from '../types';
import { apiFetch } from '../lib/api';

interface ToolsContainerProps {
  initialActiveTool?: string;
}

export default function ToolsContainer({ initialActiveTool = 'cve' }: ToolsContainerProps) {
  const [activeTab, setActiveTab] = useState<string>(initialActiveTool);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tools Form States
  const [cveId, setCveId] = useState<string>('CVE-2021-44228');
  const [iocInput, setIocInput] = useState<string>('185.112.146.10');
  const [dnsDomain, setDnsDomain] = useState<string>('github.com');
  const [dnsType, setDnsType] = useState<string>('A');
  const [emailDomain, setEmailDomain] = useState<string>('google.com');
  const [headersUrl, setHeadersUrl] = useState<string>('github.com');
  const [sslDomain, setSslDomain] = useState<string>('github.com');

  // Tools Results States
  const [cveResult, setCveResult] = useState<CVEData | null>(null);
  const [iocResult, setIocResult] = useState<IOCData | null>(null);
  const [dnsResult, setDnsResult] = useState<DNSData | null>(null);
  const [emailResult, setEmailResult] = useState<EmailSecurityData | null>(null);
  const [headersResult, setHeadersResult] = useState<HeaderData | null>(null);
  const [sslResult, setSslResult] = useState<SSLData | null>(null);

  // Configuration block active tab (for Security Headers config block)
  const [configTab, setConfigTab] = useState<string>('nginx');

  // Generic fetch wrapper
  const handleFetch = async (endpoint: string, body: any, successCallback: (data: any) => void) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        successCallback(data);
      } else {
        setError(data.error || "An error occurred while fetching analysis");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with security backend. Confirm development server status.");
    } finally {
      setLoading(false);
    }
  };

  const executeCveLookup = () => {
    handleFetch('/api/cve', { cveId }, (data) => setCveResult(data));
  };

  const executeIocLookup = () => {
    handleFetch('/api/ioc', { indicator: iocInput }, (data) => setIocResult(data));
  };

  const executeDnsLookup = () => {
    handleFetch('/api/dns', { domain: dnsDomain, recordType: dnsType }, (data) => setDnsResult(data));
  };

  const executeEmailSecurity = () => {
    handleFetch('/api/email-security', { domain: emailDomain }, (data) => setEmailResult(data));
  };

  const executeHeadersScan = () => {
    handleFetch('/api/security-headers', { url: headersUrl }, (data) => setHeadersResult(data));
  };

  const executeSslCheck = () => {
    handleFetch('/api/ssl-checker', { domain: sslDomain }, (data) => setSslResult(data));
  };

  // Export report as simple JSON text document download
  const exportReport = (fileName: string, data: any) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${fileName}_security_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const convertToCSV = (rows: (string | number)[][]): string => {
    return rows.map(row => 
      row.map(value => {
        const stringValue = typeof value === 'number' ? String(value) : (value || '');
        const escaped = stringValue.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    ).join('\n');
  };

  const downloadCSV = (fileName: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const saveToWorkbench = (title: string, target: string, toolType: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', score: number, data: any) => {
    try {
      const stored = localStorage.getItem('karrents_saved_reports');
      let reports = [];
      if (stored) {
        reports = JSON.parse(stored);
      }
      
      let executiveSummary = `Automated vulnerability scan for ${target}.`;
      let technicalSummary = `Technical deep-dive details mapped.`;
      let businessImpact = `Moderate corporate operational risks identified.`;
      let technicalImpact = `Asset vulnerabilities checked and evaluated.`;
      let recommendations: string[] = ['Establish standard perimeter controls', 'Update unpatched assets'];
      let references = [{ title: 'OWASP Security standards', url: 'https://owasp.org' }];

      if (toolType === 'CVE Explorer') {
        executiveSummary = data.description || executiveSummary;
        technicalSummary = `CVSS Vector context: ${data.cvssVector || 'N/A'}`;
        businessImpact = data.businessImpact || businessImpact;
        technicalImpact = data.technicalImpact || technicalImpact;
        recommendations = [data.remediation?.mitigation, data.remediation?.patchInfo].filter(Boolean);
        if (data.references && data.references.length > 0) {
          references = data.references.slice(0, 3).map((ref: any) => ({ title: ref.title || 'Reference link', url: ref.url || '#' }));
        }
      } else if (toolType === 'IOC Lookup') {
        executiveSummary = data.detailedAnalysis || executiveSummary;
        technicalSummary = `Malicious score weight is ${data.maliciousScore || 0}/100. Confidence index: ${data.confidenceScore || 0}%`;
        businessImpact = `Compromised indicators of compromise callout active networks.`;
        technicalImpact = `Endpoint presence facilitates lateral movement, exfiltrations, or secondary command-and-control triggers.`;
        recommendations = [data.remediation || 'Block inbound IP at firewall level'];
        if (data.intelReferences && data.intelReferences.length > 0) {
          references = data.intelReferences.slice(0, 3).map((ref: any) => ({ title: ref.title || 'Intel Reference', url: ref.url || '#' }));
        }
      } else if (toolType === 'Security Headers') {
        executiveSummary = data.aiReport?.executiveSummary || executiveSummary;
        technicalSummary = `Score: ${data.score}/100 with grade: ${data.grade}. Missing headers: ${data.missingHeaders?.join(', ') || 'None'}`;
        businessImpact = `Absence of strict protection headers leaves target vulnerable to clickjacking and XSS framing.`;
        technicalImpact = data.aiReport?.riskAnalysis || technicalImpact;
        recommendations = [
          data.aiReport?.remediationConfigs?.nginx ? `Review Nginx configuration guidelines: ${data.aiReport.remediationConfigs.nginx.slice(0, 80)}...` : 'Configure Content-Security-Policy rules'
        ];
      } else if (toolType === 'TLS/SSL Checker') {
        executiveSummary = data.aiEvaluation || executiveSummary;
        technicalSummary = `Valid from ${data.cert?.validFrom || 'N/A'} to ${data.cert?.validTo || 'N/A'}. Remaining days: ${data.cert?.daysRemaining || 0}. protocol: ${data.cert?.protocol || 'N/A'}`;
        businessImpact = `Insecure ciphers or short lifespan certificates expose transit traffic to spoofing attacks.`;
        technicalImpact = `Subject details resolved: ${data.cert?.subject || 'N/A'}. Issuer structure: ${data.cert?.issuer || 'N/A'}`;
        recommendations = ['Upgrade ciphers to TLS 1.3 protocol', 'Establish automated certificate rotation policies'];
      } else if (toolType === 'Email Security') {
        executiveSummary = `Audit resolved overall spoofing risk level as ${data.overallRisk || 'N/A'}.`;
        technicalSummary = `SPF Status: ${data.spf?.status || 'N/A'}. DMARC Status: ${data.dmarc?.status || 'N/A'}`;
        businessImpact = data.businessImpact || businessImpact;
        technicalImpact = `Absence of alignment protocol enables unauthorized outbound spoofing phishing campaigns.`;
        recommendations = data.remediationSteps || ['Verify DMARC p=reject rules'];
      } else if (toolType === 'DNS Lookup') {
        executiveSummary = data.analysis || executiveSummary;
        technicalSummary = `Records resolved of class ${data.recordType || 'N/A'}. Total count: ${data.records?.length || 0}`;
        businessImpact = `Misconfigured active DNS parameters allow attackers to execute zone transfers or redirect active client traffic channels.`;
        technicalImpact = `Audit resolved records list: ${JSON.stringify(data.records || {})}`;
        recommendations = ['Verify DNS records with hosting providers', 'Implement DNSSEC keys'];
      }

      const newReport = {
        id: `REP-2026-${String(reports.length + 1).padStart(3, '0')}`,
        title: `${toolType} Analysis: ${target}`,
        target,
        toolType,
        severity,
        score,
        timestamp: new Date().toISOString(),
        toolVersion: 'Karrents Analyzer v1.3.1',
        executiveSummary,
        technicalSummary,
        businessImpact,
        technicalImpact,
        evidence: JSON.stringify(data, null, 2),
        recommendations,
        references
      };

      reports.unshift(newReport);
      localStorage.setItem('karrents_saved_reports', JSON.stringify(reports));
      alert(`Success: Report ${newReport.id} successfully saved to Workbench Archive!`);
    } catch (e) {
      console.error("Failed to save report to workbench", e);
      alert("Failed to save report. Please try again.");
    }
  };

  const severityBadgeColors = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'LOW': return 'bg-green-500/10 border-green-500/30 text-green-400';
      default: return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Tools Sidebar selector */}
      <div className="lg:col-span-1 space-y-1 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl h-fit">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-3">
          Security Tools
        </h3>
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 font-bold px-2 py-1 uppercase tracking-wide">Threat Intel</div>
          <button
            id="tab-cve"
            onClick={() => { setActiveTab('cve'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'cve' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>CVE Explorer</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
          <button
            id="tab-ioc"
            onClick={() => { setActiveTab('ioc'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'ioc' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>IOC Lookup</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>

          <div className="text-[10px] text-zinc-500 font-bold px-2 py-1 uppercase tracking-wide mt-4">Web & SSL</div>
          <button
            id="tab-headers"
            onClick={() => { setActiveTab('headers'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'headers' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>Security Headers</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
          <button
            id="tab-ssl"
            onClick={() => { setActiveTab('ssl'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'ssl' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>TLS/SSL Checker</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>

          <div className="text-[10px] text-zinc-500 font-bold px-2 py-1 uppercase tracking-wide mt-4">Network & Mail</div>
          <button
            id="tab-email"
            onClick={() => { setActiveTab('email'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'email' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>Email Security Audits</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
          <button
            id="tab-dns"
            onClick={() => { setActiveTab('dns'); setError(null); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
              activeTab === 'dns' ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <span>DNS Lookup</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="lg:col-span-3 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Execution Failure:</span> {error}
            </div>
          </div>
        )}

        {/* 1. CVE EXPLORER VIEW */}
        {activeTab === 'cve' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  CVE Explorer
                </h2>
                <p className="text-xs text-zinc-400">
                  Search vulnerabilities by standard CVE identifiers. Retreive complete threat breakdowns, CVSS metrics, patch statuses, and configuration blocks.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  id="cve-search-input"
                  type="text"
                  value={cveId}
                  onChange={(e) => setCveId(e.target.value)}
                  placeholder="e.g. CVE-2021-44228"
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  id="cve-search-submit"
                  onClick={executeCveLookup}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Analyzing...' : 'Search'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-zinc-500 self-center">Popular:</span>
                <button id="quick-cve-log4j" onClick={() => { setCveId('CVE-2021-44228'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">CVE-2021-44228 (Log4Shell)</button>
                <button id="quick-cve-heartbleed" onClick={() => { setCveId('CVE-2014-0160'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">CVE-2014-0160 (Heartbleed)</button>
                <button id="quick-cve-shellshock" onClick={() => { setCveId('CVE-2014-6271'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">CVE-2014-6271 (Shellshock)</button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {cveResult && !loading && (
              <div className="space-y-6">
                {/* CVE Overview Panel */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-white">{cveResult.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityBadgeColors(cveResult.severity)}`}>
                          {cveResult.severity}
                        </span>
                      </div>
                      <h3 className="font-semibold text-zinc-100 text-sm leading-snug">{cveResult.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="save-cve-report"
                        onClick={() => saveToWorkbench(cveResult.title, cveResult.id, 'CVE Explorer', cveResult.severity as any, Math.round(cveResult.cvssScore * 10), cveResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Save Report</span>
                      </button>
                      <button
                        id="export-cve-report"
                        onClick={() => exportReport(cveResult.id, cveResult)}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors self-start"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Intel</span>
                      </button>
                      <button
                        id="export-cve-csv"
                        onClick={() => {
                          if (!cveResult) return;
                          const headers = [
                            "Vulnerability ID", "Title", "Severity", "CVSS Score", "CVSS Vector", 
                            "Published Date", "Exploit Status", "Description", "Business Impact", 
                            "Technical Impact", "Mitigation", "Patch Info"
                          ];
                          const row = [
                            cveResult.id,
                            cveResult.title,
                            cveResult.severity,
                            cveResult.cvssScore,
                            cveResult.cvssVector,
                            cveResult.publishedDate,
                            cveResult.exploitStatus,
                            cveResult.description,
                            cveResult.businessImpact,
                            cveResult.technicalImpact,
                            cveResult.remediation?.mitigation || '',
                            cveResult.remediation?.patchInfo || ''
                          ];
                          const csv = convertToCSV([headers, row]);
                          downloadCSV(`${cveResult.id}_findings`, csv);
                        }}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors self-start font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">CVSS Score</div>
                      <div className="text-xl font-extrabold text-zinc-100 font-mono">{cveResult.cvssScore.toFixed(1)}</div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">{cveResult.cvssVector}</div>
                    </div>
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Exploit Status</div>
                      <div className="text-xs font-semibold text-amber-400 flex items-center justify-center gap-1 mt-1">
                        <Activity className="w-3.5 h-3.5" />
                        {cveResult.exploitStatus}
                      </div>
                    </div>
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">OWASP Mapping</div>
                      <div className="text-xs font-medium text-blue-400 mt-1 truncate">{cveResult.owaspMapping}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/30 p-4 rounded-lg border border-zinc-900/40">
                      {cveResult.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Business Impact</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{cveResult.businessImpact}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Technical Impact</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{cveResult.technicalImpact}</p>
                    </div>
                  </div>
                </div>

                {/* CVE Remediation & Code Configurations */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="space-y-1 pb-3 border-b border-zinc-800/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Defensive Remediation Guidelines</h3>
                    <p className="text-xs text-zinc-500">Remediation steps must be followed immediately by network security coordinators.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Temporary Mitigation</span>
                      <p className="text-zinc-300 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 leading-relaxed">{cveResult.remediation.mitigation}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Permanent Patch Info</span>
                      <p className="text-zinc-300 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 leading-relaxed">{cveResult.remediation.patchInfo}</p>
                    </div>
                  </div>

                  {cveResult.remediation.configurations && cveResult.remediation.configurations.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                        Remediation Configuration Code / Commands
                      </span>
                      {cveResult.remediation.configurations.map((config, index) => (
                        <div key={index} className="bg-zinc-950 border border-zinc-900/60 rounded-lg overflow-hidden">
                          <div className="bg-zinc-900/60 px-3 py-1.5 border-b border-zinc-950 text-[10px] font-mono font-medium text-zinc-400">
                            {config.platform}
                          </div>
                          <pre className="p-3 text-[11px] font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {config.config}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MITRE Map reference inside CVE */}
                  {cveResult.mitreAttackMappings && cveResult.mitreAttackMappings.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">MITRE ATT&CK Mappings</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {cveResult.mitreAttackMappings.map((map, idx) => (
                          <div key={idx} className="bg-zinc-950 border border-zinc-900/60 rounded-lg p-2.5 flex items-center gap-3 text-xs">
                            <span className="font-mono text-blue-400 font-semibold">{map.id}</span>
                            <div className="text-[11px]">
                              <span className="text-zinc-500 mr-1.5">{map.tactic}:</span>
                              <span className="text-zinc-300 font-medium">{map.technique}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">NIST SP 800-53 Control Mapping</span>
                      <ul className="list-disc list-inside space-y-1 text-zinc-400">
                        {cveResult.nistReferences.map((ref, i) => (
                          <li key={i}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">External References</span>
                      <div className="space-y-1">
                        {cveResult.references.map((ref, i) => (
                          <a
                            key={i}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{ref.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. IOC LOOKUP VIEW */}
        {activeTab === 'ioc' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  IOC Lookup (Threat Intelligence)
                </h2>
                <p className="text-xs text-zinc-400">
                  Submit active network IP addresses, fully qualified domains, or file hashes (MD5, SHA-1, SHA-256) to scan for threat actor associations, malware families, and confidence metrics.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  id="ioc-search-input"
                  type="text"
                  value={iocInput}
                  onChange={(e) => setIocInput(e.target.value)}
                  placeholder="e.g. 185.112.146.10, file.exe hash, phishing domain..."
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  id="ioc-search-submit"
                  onClick={executeIocLookup}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Querying...' : 'Lookup'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-zinc-500 self-center">Demo Indicators:</span>
                <button id="quick-ioc-ip" onClick={() => { setIocInput('185.112.146.10'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">IP: 185.112.146.10</button>
                <button id="quick-ioc-domain" onClick={() => { setIocInput('cobalt-strike-beacon.malicious-cc.com'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">Domain: cobalt-strike-beacon...</button>
                <button id="quick-ioc-hash" onClick={() => { setIocInput('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); }} className="bg-zinc-950 hover:bg-zinc-800 text-blue-400 px-2 py-0.5 rounded border border-zinc-800/40">Hash (SHA-256)</button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {iocResult && !loading && (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white break-all">{iocResult.indicator}</span>
                        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/60">
                          {iocResult.type} Indicator
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">Threat intelligence validation assessment.</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="save-ioc-report"
                        onClick={() => saveToWorkbench(`Threat Intel Audit: ${iocResult.indicator}`, iocResult.indicator, 'IOC Lookup', iocResult.verdict === 'MALICIOUS' ? 'CRITICAL' : iocResult.verdict === 'SUSPICIOUS' ? 'HIGH' : 'LOW', iocResult.maliciousScore, iocResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Save Report</span>
                      </button>
                      <button
                        id="export-ioc-report"
                        onClick={() => exportReport(iocResult.indicator, iocResult)}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors self-start"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Report</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-xs">
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Verdict</div>
                      <div className={`text-sm font-bold mt-1 ${
                        iocResult.verdict === 'MALICIOUS' ? 'text-red-400' :
                        iocResult.verdict === 'SUSPICIOUS' ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {iocResult.verdict}
                      </div>
                    </div>
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Threat Severity Score</div>
                      <div className="text-lg font-bold text-zinc-100 font-mono mt-1">{iocResult.maliciousScore} / 100</div>
                    </div>
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Confidence Level</div>
                      <div className="text-lg font-bold text-zinc-100 font-mono mt-1">{iocResult.confidenceScore}%</div>
                    </div>
                    <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-900/60 space-y-1 text-center">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Associated Campaign</div>
                      <div className="text-xs font-semibold text-blue-400 mt-1.5 truncate">{iocResult.campaignName}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Associated Threat Actors</span>
                      <p className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/60 text-zinc-300 font-medium">
                        {iocResult.threatActor}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Linked Malware Families</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {iocResult.malwareFamilies.length > 0 ? (
                          iocResult.malwareFamilies.map((fam, idx) => (
                            <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                              {fam}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 italic">None discovered</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Technical Context Analysis</span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/30 p-4 rounded-lg border border-zinc-900/60 leading-relaxed">
                      {iocResult.detailedAnalysis}
                    </p>
                  </div>

                  <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-red-400">
                      <Shield className="w-3.5 h-3.5" />
                      Defensive Remediation Steps
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {iocResult.remediation}
                    </p>
                  </div>

                  {iocResult.intelReferences && iocResult.intelReferences.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Intelligence Feeds References</span>
                      <div className="space-y-1">
                        {iocResult.intelReferences.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-[11px] flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {ref.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. HTTP SECURITY HEADERS SCANNER VIEW */}
        {activeTab === 'headers' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  HTTP Security Headers Analyzer
                </h2>
                <p className="text-xs text-zinc-400">
                  Analyze web server HTTP response headers. Evaluates HSTS, CSP, clickjacking mitigations, and generates Nginx/Apache configuration lines.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  id="headers-url-input"
                  type="text"
                  value={headersUrl}
                  onChange={(e) => setHeadersUrl(e.target.value)}
                  placeholder="e.g. github.com, my-agency-app.org"
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  id="headers-scan-submit"
                  onClick={executeHeadersScan}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{loading ? 'Scanning...' : 'Analyze Headers'}</span>
                </button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {headersResult && !loading && (
              <div className="space-y-6 animate-fade-in">
                {/* Headers Analysis Dashboard */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1.5">
                      <div>
                        <div className="font-mono text-sm font-semibold text-zinc-200 break-all">{headersResult.url}</div>
                        <div className="text-[11px] text-zinc-400">Response Header Policy Assessment</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="save-headers-report"
                          onClick={() => saveToWorkbench(`Security Headers: ${headersResult.url}`, headersResult.url, 'Security Headers', headersResult.score >= 80 ? 'LOW' : headersResult.score >= 50 ? 'MEDIUM' : 'HIGH', headersResult.score, headersResult)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors font-semibold shadow-sm shadow-blue-500/10"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Save Report</span>
                        </button>
                        <button
                          id="export-headers-report"
                          onClick={() => exportReport(headersResult.url.replace(/https?:\/\//, ''), headersResult)}
                          className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1 rounded-lg border border-zinc-800 hover:border-zinc-750 text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Intel</span>
                        </button>
                        <button
                          id="export-headers-csv"
                          onClick={() => {
                            if (!headersResult) return;
                            const headers = [
                              "Target URL", "Domain", "Grade", "Score", "Header Name", "Status", "Value", "Severity", "Description"
                            ];
                            const rows = headersResult.headers.map(h => [
                              headersResult.url,
                              headersResult.domain,
                              headersResult.grade,
                              headersResult.score,
                              h.name,
                              h.present ? "Present" : "Missing",
                              h.value || 'N/A',
                              h.severity,
                              h.description
                            ]);
                            const csv = convertToCSV([headers, ...rows]);
                            downloadCSV(`${headersResult.domain}_security_headers_findings`, csv);
                          }}
                          className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1 rounded-lg border border-zinc-800 hover:border-zinc-750 text-[11px] flex items-center gap-1 transition-colors font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Security Score</div>
                        <div className="text-xl font-extrabold font-mono text-white">{headersResult.score} / 100</div>
                      </div>
                      <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-xl font-black text-blue-400">
                        {headersResult.grade}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 font-medium">
                    <span className="font-bold text-zinc-200">Executive Summary: </span>
                    {headersResult.aiReport.executiveSummary}
                  </p>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Inspected Headers Checklist</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {headersResult.headers.map((header, idx) => (
                        <div key={idx} className="bg-zinc-950/60 border border-zinc-900/60 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono font-bold text-xs text-zinc-200 truncate">{header.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              header.present ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {header.present ? 'ACTIVE' : 'MISSING'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{header.description}</p>
                          {header.present && header.value && (
                            <div className="bg-zinc-950 p-2 rounded border border-zinc-900/60 font-mono text-[10px] text-blue-400 break-all select-all leading-normal max-h-16 overflow-y-auto">
                              {header.value}
                            </div>
                          )}
                          {!header.present && (
                            <div className="text-[10px] font-semibold text-amber-500 flex items-center gap-1 pt-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Severity impact: {header.severity}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900/60 p-4 rounded-lg space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-red-400">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Header Threat Analysis
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{headersResult.aiReport.riskAnalysis}</p>
                  </div>
                </div>

                {/* Configurations Remediations Tabs */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Remediation Server Configurations</h3>
                    <p className="text-xs text-zinc-500">Apply these directives to your configuration rules to enforce missing headers.</p>
                  </div>

                  <div className="flex border-b border-zinc-800/50 gap-1">
                    {['nginx', 'apache', 'caddy', 'cloudflare'].map((tech) => (
                      <button
                        key={tech}
                        id={`btn-config-${tech}`}
                        onClick={() => setConfigTab(tech)}
                        className={`px-3 py-1.5 text-xs font-semibold capitalize border-b-2 transition-colors ${
                          configTab === tech ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>

                  <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-900/60">
                    <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {configTab === 'nginx' && headersResult.aiReport.remediationConfigs.nginx}
                      {configTab === 'apache' && headersResult.aiReport.remediationConfigs.apache}
                      {configTab === 'caddy' && headersResult.aiReport.remediationConfigs.caddy}
                      {configTab === 'cloudflare' && headersResult.aiReport.remediationConfigs.cloudflare}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TLS/SSL CERTIFICATE CHECKER VIEW */}
        {activeTab === 'ssl' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  TLS/SSL Cryptographic Checker
                </h2>
                <p className="text-xs text-zinc-400">
                  Connect over cryptographic SSL port 443. Parses validity parameters, issuer chains, cipher suites, and alerts on imminent key exhaustion risk.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  id="ssl-domain-input"
                  type="text"
                  value={sslDomain}
                  onChange={(e) => setSslDomain(e.target.value)}
                  placeholder="e.g. github.com, secure-gateway.com"
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  id="ssl-check-submit"
                  onClick={executeSslCheck}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{loading ? 'Evaluating...' : 'Check SSL'}</span>
                </button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {sslResult && !loading && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{sslResult.domain}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          sslResult.cert.isValid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {sslResult.cert.isValid ? 'VALID CERTIFICATE' : 'EXPIRED / INVALID'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">Cryptographic TLS chain validation report.</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="save-ssl-report"
                        onClick={() => saveToWorkbench(`TLS/SSL Security: ${sslResult.domain}`, sslResult.domain, 'TLS/SSL Checker', sslResult.cert.isValid ? 'LOW' : 'CRITICAL', sslResult.cert.daysRemaining < 30 ? 40 : 95, sslResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-semibold shadow-sm shadow-blue-500/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Save Report</span>
                      </button>
                      <button
                        id="export-ssl-report"
                        onClick={() => exportReport(sslResult.domain, sslResult)}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Intel</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Days to Expiry</div>
                      <div className={`text-2xl font-black font-mono ${sslResult.cert.daysRemaining < 15 ? 'text-red-400' : 'text-zinc-100'}`}>
                        {sslResult.cert.daysRemaining}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">Valid until {sslResult.cert.validTo}</div>
                    </div>
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">TLS Protocol</div>
                      <div className="text-lg font-bold text-zinc-100 font-mono mt-1">{sslResult.cert.protocol}</div>
                      <div className="text-[10px] text-zinc-500 font-medium truncate">{sslResult.cert.cipherSuite}</div>
                    </div>
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Certificate Issuer</div>
                      <div className="text-xs font-bold text-blue-400 mt-2 truncate">{sslResult.cert.issuer}</div>
                      <div className="text-[10px] text-zinc-500 font-medium">Subject: {sslResult.cert.subject}</div>
                    </div>
                  </div>

                  <div className="space-y-3.5 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-lg text-xs font-mono">
                    <div className="flex items-start gap-2 border-b border-zinc-900/40 pb-2">
                      <span className="text-zinc-500 select-none shrink-0 w-24">Serial Number:</span>
                      <span className="text-zinc-300 break-all select-all">{sslResult.cert.serialNumber}</span>
                    </div>
                    <div className="flex items-start gap-2 border-b border-zinc-900/40 pb-2">
                      <span className="text-zinc-500 select-none shrink-0 w-24">SHA-256 Sig:</span>
                      <span className="text-zinc-300 break-all select-all">{sslResult.cert.fingerprint}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500 select-none shrink-0 w-24">Valid From:</span>
                      <span className="text-zinc-300">{sslResult.cert.validFrom}</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-blue-400">
                      <Info className="w-3.5 h-3.5" />
                      AI Cryptographic Evaluation
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {sslResult.aiEvaluation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. EMAIL SECURITY AUDITS VIEW */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Spoofing Security Auditor (SPF & DMARC)
                </h2>
                <p className="text-xs text-zinc-400">
                  Performs active lookups of SPF and DMARC TXT records. Conducts policy audits, flagging misaligned softfail rules or missing reports.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  id="email-domain-input"
                  type="text"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  placeholder="e.g. google.com, state.gov, school.edu"
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  id="email-audit-submit"
                  onClick={executeEmailSecurity}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{loading ? 'Auditing...' : 'Audit Email Policies'}</span>
                </button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {emailResult && !loading && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{emailResult.domain}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          emailResult.overallRisk === 'LOW' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          emailResult.overallRisk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          OVERALL SPOOFING RISK: {emailResult.overallRisk}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">DNS email security control validation.</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="save-email-report"
                        onClick={() => saveToWorkbench(`Email Security Audit: ${emailResult.domain}`, emailResult.domain, 'Email Security', emailResult.overallRisk === 'LOW' ? 'LOW' : emailResult.overallRisk === 'MEDIUM' ? 'MEDIUM' : 'HIGH', emailResult.overallRisk === 'LOW' ? 95 : emailResult.overallRisk === 'MEDIUM' ? 70 : 35, emailResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-semibold shadow-sm shadow-blue-500/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Save Report</span>
                      </button>
                      <button
                        id="export-email-report"
                        onClick={() => exportReport(emailResult.domain, emailResult)}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Intel</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 font-medium">
                    <span className="font-bold text-zinc-200">Business Impact: </span>
                    {emailResult.businessImpact}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* SPF Record Assessment */}
                    <div className="bg-zinc-950/60 border border-zinc-900/60 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                        <span className="text-xs font-bold text-zinc-200">Sender Policy Framework (SPF)</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          emailResult.spf.status === 'VALID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          emailResult.spf.status === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {emailResult.spf.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Discovered Record</span>
                          <pre className="font-mono text-[10.5px] p-2 bg-zinc-950 rounded border border-zinc-900/40 text-blue-400 break-all select-all leading-normal">
                            {emailResult.spf.record}
                          </pre>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{emailResult.spf.explanation}</p>
                        {emailResult.spf.risks && emailResult.spf.risks.length > 0 && (
                          <div className="space-y-1 bg-red-500/5 p-2 rounded border border-red-500/10">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Identified Vulnerabilities</span>
                            <ul className="list-disc list-inside text-[10.5px] text-red-300">
                              {emailResult.spf.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="pt-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Remediation Best-Practice Record</span>
                          <pre className="font-mono text-[10.5px] p-2 bg-zinc-950 rounded border border-blue-500/15 text-green-400 select-all">
                            {emailResult.spf.bestPracticeFix}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* DMARC Record Assessment */}
                    <div className="bg-zinc-950/60 border border-zinc-900/60 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                        <span className="text-xs font-bold text-zinc-200">DMARC (Domain-based Auth)</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          emailResult.dmarc.status === 'VALID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          emailResult.dmarc.status === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {emailResult.dmarc.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Discovered Record</span>
                          <pre className="font-mono text-[10.5px] p-2 bg-zinc-950 rounded border border-zinc-900/40 text-blue-400 break-all select-all leading-normal">
                            {emailResult.dmarc.record}
                          </pre>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{emailResult.dmarc.explanation}</p>
                        {emailResult.dmarc.risks && emailResult.dmarc.risks.length > 0 && (
                          <div className="space-y-1 bg-red-500/5 p-2 rounded border border-red-500/10">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Identified Vulnerabilities</span>
                            <ul className="list-disc list-inside text-[10.5px] text-red-300">
                              {emailResult.dmarc.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="pt-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">Remediation Best-Practice Record</span>
                          <pre className="font-mono text-[10.5px] p-2 bg-zinc-950 rounded border border-blue-500/15 text-green-400 select-all">
                            {emailResult.dmarc.bestPracticeFix}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 text-xs">
                    {/* DKIM Guide */}
                    <div className="bg-zinc-950/40 p-4 border border-zinc-900/60 rounded-lg space-y-2.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">DKIM Keys Setup Configuration</span>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">{emailResult.dkimGuide.explanation}</p>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">TXT Record: {emailResult.dkimGuide.selector}._domainkey</span>
                        <pre className="font-mono text-[9.5px] p-2.5 bg-zinc-950 rounded border border-zinc-900/60 text-blue-300 overflow-x-auto whitespace-pre-wrap select-all leading-normal">
                          {emailResult.dkimGuide.examplePublicKeyRecord}
                        </pre>
                      </div>
                    </div>

                    {/* Overall Remediation steps */}
                    <div className="bg-zinc-950/40 p-4 border border-zinc-900/60 rounded-lg space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-blue-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Remediation Path
                      </span>
                      <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                        {emailResult.remediationSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. DNS LOOKUP VIEW */}
        {activeTab === 'dns' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  DNS Lookup & Security Auditor
                </h2>
                <p className="text-xs text-zinc-400">
                  Query real DNS servers. Retreive structured address zones, MX servers, TXT records, and evaluates the records against security postures (subdomain takeovers, DNSSEC).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="dns-domain-input"
                  type="text"
                  value={dnsDomain}
                  onChange={(e) => setDnsDomain(e.target.value)}
                  placeholder="e.g. state.gov, school.edu"
                  className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <select
                  id="dns-record-type-select"
                  value={dnsType}
                  onChange={(e) => setDnsType(e.target.value)}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="A">A Record</option>
                  <option value="AAAA">AAAA Record</option>
                  <option value="MX">MX Record</option>
                  <option value="TXT">TXT Record</option>
                  <option value="CNAME">CNAME Record</option>
                  <option value="NS">NS Record</option>
                </select>
                <button
                  id="dns-query-submit"
                  onClick={executeDnsLookup}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Resolving...' : 'Query DNS'}</span>
                </button>
              </div>
            </div>

            {loading && <LoadingSkeleton />}

            {dnsResult && !loading && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{dnsResult.domain}</span>
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {dnsResult.recordType} Lookup
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">Active zone record resolution results.</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="save-dns-report"
                        onClick={() => saveToWorkbench(`DNS Lookup: ${dnsResult.domain}`, dnsResult.domain, 'DNS Lookup', 'LOW', 90, dnsResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-semibold shadow-sm shadow-blue-500/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Save Report</span>
                      </button>
                      <button
                        id="export-dns-report"
                        onClick={() => exportReport(dnsResult.domain, dnsResult)}
                        className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-750 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Intel</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Raw Resolved DNS Records</span>
                    <pre className="font-mono text-xs p-4 bg-zinc-950 rounded-lg border border-zinc-900/60 text-blue-300 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                      {JSON.stringify(dnsResult.records, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-xs">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-blue-400">
                      <Info className="w-3.5 h-3.5" />
                      Security Context Analysis
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {dnsResult.analysis}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div id="loading-skeleton-view" className="bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-xl space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
          <div className="h-3 w-48 bg-zinc-800 rounded"></div>
        </div>
        <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
      </div>
      <div className="h-32 bg-zinc-950/40 rounded-lg border border-zinc-900/60"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-zinc-800 rounded"></div>
        <div className="h-16 bg-zinc-800 rounded"></div>
      </div>
    </div>
  );
}

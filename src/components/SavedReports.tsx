import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Calendar, 
  Shield, 
  Activity, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle,
  FileCode,
  Printer,
  ChevronRight,
  Info,
  Layers,
  ArrowDown
} from 'lucide-react';

export interface SavedReport {
  id: string;
  title: string;
  target: string;
  toolType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  timestamp: string;
  toolVersion: string;
  executiveSummary: string;
  technicalSummary: string;
  businessImpact: string;
  technicalImpact: string;
  evidence: string; // JSON or raw string
  recommendations: string[];
  references: { title: string; url: string }[];
}

interface SavedReportsProps {
  onNavigateToTool?: (toolName: string) => void;
}

export default function SavedReports({ onNavigateToTool }: SavedReportsProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);

  useEffect(() => {
    // Load from localStorage or seed with high-fidelity defaults
    const stored = localStorage.getItem('karrents_saved_reports') || localStorage.getItem('buruops_saved_reports');
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved reports", e);
        loadDefaultSeedReports();
      }
    } else {
      loadDefaultSeedReports();
    }
  }, []);

  const loadDefaultSeedReports = () => {
    const seed: SavedReport[] = [
      {
        id: 'REP-2026-001',
        title: 'HTTP Security Headers Penetration Audit',
        target: 'github.com',
        toolType: 'Security Headers',
        severity: 'MEDIUM',
        score: 80,
        timestamp: '2026-07-15T15:24:00Z',
        toolVersion: 'Karrents Analyzer v1.3.1',
        executiveSummary: 'Automated vulnerability sweep identified 4 out of 6 standard HTTP security headers on github.com. Communication path utilizes TLS 1.3 encryption. Passive monitoring suggests high reputation, but mitigation actions should be queued to achieve full baseline alignment.',
        technicalSummary: 'Target hosts enforce Strict-Transport-Security (HSTS) with preloads and secure Referrer Policies. However, the Content-Security-Policy is missing standard sandbox definitions, and no Permissions-Policy was broadcast. Frame options are handled via frame-ancestors directives inside CSP.',
        businessImpact: 'Unconfigured headers facilitate micro-clickjacking exploitation and hardware permissions hijacking vectors in legacy browser engines, potentially leading to brand-reputation degradation and minor user session compromises.',
        technicalImpact: 'Absence of strict Content-Security-Policy rules could enable Cross-Site Scripting (XSS) and code-injection vectors if secondary input validation mechanisms fail. Clickjacking risks are moderate but mitigated by modern client engines.',
        evidence: JSON.stringify({
          scanned_url: 'https://github.com',
          grade: 'B',
          score: 80,
          detected_headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
            'referrer-policy': 'origin-when-cross-origin',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'deny'
          },
          missing_headers: [
            'content-security-policy',
            'permissions-policy'
          ]
        }, null, 2),
        recommendations: [
          'Enable Strict Content-Security-Policy (CSP) headers limiting default-src to self and trusted API domains.',
          'Inject browser Permissions-Policy directives to strictly forbid client hardware requests (camera, microphone, geolocation) by default.',
          'Verify TLS cipher parity to forbid legacy AES-CBC handshakes.'
        ],
        references: [
          { title: 'OWASP Secure Headers Project', url: 'https://owasp.org/www-project-secure-headers/' },
          { title: 'CISA Web Application Configuration Guide', url: 'https://www.cisa.gov' }
        ]
      },
      {
        id: 'REP-2026-002',
        title: 'Critical Infrastructure Exploit Intelligence Assessment',
        target: 'CVE-2021-44228',
        toolType: 'CVE Explorer',
        severity: 'CRITICAL',
        score: 100,
        timestamp: '2026-07-15T14:12:00Z',
        toolVersion: 'Karrents Advisor Engine v3.0-flash',
        executiveSummary: 'Critical threat advisory concerning Apache Log4j JNDI Remote Code Execution (Log4Shell). Wild exploitation is actively tracked across enterprise networks. Immediate patch compliance is required.',
        technicalSummary: 'Log4j JNDI lookups fail to sanitize attacker-controlled LDAP endpoints, allowing dynamic loading of malicious Java class files. Attacker-controlled variables inside headers, search forms, or logs immediately trigger code payload execution.',
        businessImpact: 'Total loss of server confidentiality, data integrity, and business continuity. Exploit vectors are directly utilized by global ransomware syndicates and APT actors, risking catastrophic operational shutdowns and multi-million dollar liabilities.',
        technicalImpact: 'Unauthenticated full remote code execution (RCE) with the security context of the parent Java execution runtime. Enables EDR evasion, credential exfiltration, and lateral active directory movement.',
        evidence: JSON.stringify({
          cve_id: 'CVE-2021-44228',
          cvss_score: 10.0,
          cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
          exploit_status: 'Active Wild Exploitation',
          platform_affected: 'Java JVM Runtime / Apache Log4j 2.0-beta9 to 2.15.0'
        }, null, 2),
        recommendations: [
          'Update all active systems to Apache Log4j version 2.16.0 or higher instantly.',
          'For legacy systems unable to patch, apply the JVM argument flag -Dlog4j2.formatMsgNoLookups=true.',
          'Deploy network signature rules blocklisting inbound LDAP and RMI directory connections from egress channels.'
        ],
        references: [
          { title: 'NIST NVD CVE-2021-44228 Entry', url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228' },
          { title: 'CISA Apache Log4j Vulnerability Guidance', url: 'https://www.cisa.gov' }
        ]
      }
    ];
    setReports(seed);
    localStorage.setItem('karrents_saved_reports', JSON.stringify(seed));
  };

  const saveReportsToStorage = (updated: SavedReport[]) => {
    setReports(updated);
    localStorage.setItem('karrents_saved_reports', JSON.stringify(updated));
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.filter(r => r.id !== id);
    saveReportsToStorage(updated);
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all saved reports? This action cannot be undone.")) {
      saveReportsToStorage([]);
      setSelectedReport(null);
    }
  };

  // Export functions
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = (report: SavedReport) => {
    downloadFile(JSON.stringify(report, null, 2), `${report.id}_${report.target}_security_report.json`, 'application/json');
  };

  const exportAsMarkdown = (report: SavedReport) => {
    const md = `# SECURITY ANALYSIS REPORT: ${report.id}
## ${report.title}

* **Target:** ${report.target}
* **Tool / Engine:** ${report.toolType} (${report.toolVersion})
* **Severity:** ${report.severity}
* **Risk Score:** ${report.score}/100
* **Timestamp:** ${new Date(report.timestamp).toUTCString()}

---

### 1. EXECUTIVE SUMMARY
${report.executiveSummary}

### 2. TECHNICAL SUMMARY
${report.technicalSummary}

### 3. IMPACT ANALYSIS
* **Business Impact:** ${report.businessImpact}
* **Technical Impact:** ${report.technicalImpact}

### 4. EVIDENCE & TECHNICAL TELEMETRY
\`\`\`json
${report.evidence}
\`\`\`

### 5. MITIGATION & REMEDIATION RECOMMENDATIONS
${report.recommendations.map((rec, idx) => `${idx + 1}. [ ] ${rec}`).join('\n')}

### 6. INTEL REFERENCES
${report.references.map(ref => `* [${ref.title}](${ref.url})`).join('\n')}

---
*Report generated securely by Karrents Security Intelligence Cybersecurity Workbench*
`;
    downloadFile(md, `${report.id}_${report.target}_security_report.md`, 'text/markdown');
  };

  const exportAsCSV = (report: SavedReport) => {
    const headers = ['Report ID', 'Title', 'Target', 'Tool', 'Severity', 'Score', 'Timestamp'];
    const row = [report.id, report.title, report.target, report.toolType, report.severity, report.score, report.timestamp];
    const csvContent = [headers.join(','), row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')].join('\n');
    downloadFile(csvContent, `${report.id}_${report.target}_security_report.csv`, 'text/csv');
  };

  const triggerPrint = () => {
    window.print();
  };

  // Filters
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toolType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSev = filterSeverity === 'ALL' || r.severity === filterSeverity;
    return matchesSearch && matchesSev;
  });

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'LOW': return 'bg-green-500/10 border-green-500/30 text-green-400';
      default: return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
    }
  };

  return (
    <div id="saved-reports-view" className="space-y-6">
      {/* Top filter section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Security Reports & Audits Archive
          </h2>
          <p className="text-xs text-zinc-400">
            Persistent local registry of professional security posture audits and forensic CVE investigations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="report-search-input"
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            id="report-severity-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
          {reports.length > 0 && (
            <button
              id="clear-reports-btn"
              onClick={handleClearAll}
              className="bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white border border-red-500/20 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Archive</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  id={`report-item-${report.id}`}
                  onClick={() => setSelectedReport(report)}
                  className={`border p-4 rounded-xl cursor-pointer transition-all space-y-2.5 ${
                    isSelected
                      ? 'bg-blue-600/5 border-blue-500/60 shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800/40 hover:bg-zinc-800/20 hover:border-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-blue-400 font-bold bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                      {report.id}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-xs tracking-tight line-clamp-1">{report.title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 font-mono">
                      <span className="text-zinc-300 font-bold select-all">{report.target}</span>
                      <span>•</span>
                      <span>{report.toolType}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-zinc-400 font-bold">{report.score}/100 Score</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-8 text-center text-zinc-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">No saved reports matches your query.</p>
              <button 
                onClick={loadDefaultSeedReports}
                className="text-[10px] text-blue-400 font-semibold hover:underline"
              >
                Reload Default Demos
              </button>
            </div>
          )}
        </div>

        {/* Detailed Report View Panel */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div id="printable-area" className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              {/* Report Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      {selectedReport.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(selectedReport.severity)}`}>
                      {selectedReport.severity}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">{selectedReport.toolVersion}</span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-base leading-tight tracking-tight">
                    {selectedReport.title}
                  </h3>
                  <div className="text-xs text-zinc-400">
                    Target Audit Parity: <span className="font-mono font-bold text-zinc-200 select-all">{selectedReport.target}</span>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <button
                    id="btn-print-report"
                    onClick={triggerPrint}
                    className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white p-2 rounded-lg border border-zinc-800 text-xs transition-colors"
                    title="Print / Export to PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-export-json"
                    onClick={() => exportAsJSON(selectedReport)}
                    className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs transition-colors flex items-center gap-1 font-semibold"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                  <button
                    id="btn-export-md"
                    onClick={() => exportAsMarkdown(selectedReport)}
                    className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs transition-colors flex items-center gap-1 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                  </button>
                  <button
                    id="btn-export-csv"
                    onClick={() => exportAsCSV(selectedReport)}
                    className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs transition-colors flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* KPI Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Security score</span>
                  <div className="text-xl font-extrabold font-mono text-zinc-100">{selectedReport.score}/100</div>
                  <div className="text-[9.5px] text-zinc-500">Based on standard risk matrix</div>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Timestamp (UTC)</span>
                  <div className="text-xs font-semibold text-zinc-300 mt-1 font-mono truncate">
                    {new Date(selectedReport.timestamp).toUTCString()}
                  </div>
                  <div className="text-[9.5px] text-zinc-500">Scan runtime signature</div>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900/60 text-center space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Remediations</span>
                  <div className="text-xs font-semibold text-zinc-300 mt-1 flex items-center justify-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>{selectedReport.recommendations.length} Queue Items</span>
                  </div>
                  <div className="text-[9.5px] text-zinc-500">Active corrective actions</div>
                </div>
              </div>

              {/* Report Narrative Section */}
              <div className="space-y-4 text-xs">
                {/* 1. Executive Summary */}
                <div className="space-y-1.5 p-4 bg-zinc-950/30 rounded-lg border border-zinc-900/50">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                    <Info className="w-3.5 h-3.5" />
                    1. Executive Summary
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {selectedReport.executiveSummary}
                  </p>
                </div>

                {/* 2. Technical Summary */}
                <div className="space-y-1.5 p-4 bg-zinc-950/30 rounded-lg border border-zinc-900/50">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                    <Activity className="w-3.5 h-3.5" />
                    2. Technical Deep Dive
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    {selectedReport.technicalSummary}
                  </p>
                </div>

                {/* 3. Impact Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-4 bg-zinc-950/30 rounded-lg border border-zinc-900/50">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Business Impact
                    </span>
                    <p className="text-zinc-400 leading-relaxed">{selectedReport.businessImpact}</p>
                  </div>
                  <div className="space-y-1.5 p-4 bg-zinc-950/30 rounded-lg border border-zinc-900/50">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Technical Impact
                    </span>
                    <p className="text-zinc-400 leading-relaxed">{selectedReport.technicalImpact}</p>
                  </div>
                </div>

                {/* 4. Evidence Payload */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    4. Technical Evidence & Telemetry JSON
                  </span>
                  <pre className="font-mono text-xs p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                    {selectedReport.evidence}
                  </pre>
                </div>

                {/* 5. Remediation Recommendations */}
                <div className="space-y-2.5 p-4 bg-zinc-950/30 rounded-lg border border-zinc-900/50">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    5. Actions & Remediations Playbook
                  </span>
                  <ul className="space-y-2">
                    {selectedReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-zinc-300 leading-relaxed">
                        <span className="font-mono text-green-400 font-bold">[{idx+1}]</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 6. Intel References */}
                {selectedReport.references && selectedReport.references.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      6. Intelligence References & Guidelines
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.references.map((ref, idx) => (
                        <a
                          key={idx}
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-zinc-850 text-xs flex items-center gap-1.5 transition-colors font-mono"
                        >
                          <span>{ref.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-16 text-center text-zinc-500 space-y-3.5">
              <FileText className="w-12 h-12 mx-auto text-zinc-600" />
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-300 text-sm">No Report Selected</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Select an audit report from the archive stream to view standard impacts, severity breakdown indicators, and copyable remediation blocks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

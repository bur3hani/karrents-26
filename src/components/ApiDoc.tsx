import React, { useState } from 'react';
import { 
  Terminal, 
  Layers, 
  Code, 
  Copy, 
  Check, 
  Cpu, 
  Activity, 
  Info, 
  BookOpen,
  ArrowRight,
  ExternalLink,
  Lock
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  rateLimit: string;
  requestBody?: string;
  responseBody: string;
  curlExample: string;
}

export default function ApiDoc() {
  const [activeEndpointIdx, setActiveEndpointIdx] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const endpoints: Endpoint[] = [
    {
      method: 'POST',
      path: '/api/security-headers',
      description: 'Resolves and returns complete HTTP security headers configurations for any public URL host.',
      rateLimit: '60 requests / minute',
      requestBody: JSON.stringify({
        url: "github.com"
      }, null, 2),
      responseBody: JSON.stringify({
        url: "github.com",
        grade: "B",
        score: 80,
        detectedHeaders: {
          "strict-transport-security": "max-age=31536000; includeSubDomains",
          "x-content-type-options": "nosniff"
        },
        missingHeaders: ["content-security-policy", "permissions-policy"],
        assessment: {
          xss_risk: "MODERATE",
          clickjacking_risk: "LOW"
        }
      }, null, 2),
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/security-headers \\\n  -H 'Content-Type: application/json' \\\n  -d '{"url": "github.com"}'`
    },
    {
      method: 'POST',
      path: '/api/cve',
      description: 'Fetches NIST National Vulnerability Database parameters, CVSS v3 vectors, patch statuses, and mitigations.',
      rateLimit: '120 requests / minute',
      requestBody: JSON.stringify({
        cveId: "CVE-2021-44228"
      }, null, 2),
      responseBody: JSON.stringify({
        id: "CVE-2021-44228",
        title: "Apache Log4j2 JNDI Remote Code Execution",
        severity: "CRITICAL",
        cvssScore: 10,
        cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        exploitStatus: "Active Wild Exploitation",
        owaspMapping: "A06:2021-Vulnerable and Outdated Components",
        description: "Apache Log4j2 JNDI features do not protect against attacker-controlled LDAP endpoints...",
        remediation: {
          patchVersion: "Log4j v2.16.0",
          mitigationFlags: "-Dlog4j2.formatMsgNoLookups=true"
        }
      }, null, 2),
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/cve \\\n  -H 'Content-Type: application/json' \\\n  -d '{"cveId": "CVE-2021-44228"}'`
    },
    {
      method: 'POST',
      path: '/api/ssl-checker',
      description: 'Establishes full socket connections to port 443 of target domain to parse certificate chains, trust models, and expirations.',
      rateLimit: '30 requests / minute',
      requestBody: JSON.stringify({
        domain: "github.com"
      }, null, 2),
      responseBody: JSON.stringify({
        domain: "github.com",
        issuer: "DigiCert SHA2 High Assurance Server CA",
        validFrom: "2025-03-01T00:00:00Z",
        validTo: "2026-03-15T23:59:59Z",
        daysRemaining: 243,
        signatureAlgorithm: "sha256WithRSAEncryption",
        isTrusted: true,
        cipherSuite: "TLS_AES_256_GCM_SHA384"
      }, null, 2),
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/ssl-checker \\\n  -H 'Content-Type: application/json' \\\n  -d '{"domain": "github.com"}'`
    }
  ];

  const activeEndpoint = endpoints[activeEndpointIdx];

  return (
    <div id="api-reference-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" />
            Developer REST API Center
          </h2>
          <p className="text-xs text-zinc-400">
            Build integrations, automate scans, and query threat intelligence feeds dynamically using our robust REST API endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-zinc-500 font-mono text-[10px] bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-800">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>API Gate: Active SSL/HMAC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Endpoints Sidebar List */}
        <div className="lg:col-span-1 space-y-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl h-fit">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-2 block">Endpoints Reference</span>
          <div className="space-y-1.5">
            {endpoints.map((ep, idx) => {
              const isActive = activeEndpointIdx === idx;
              return (
                <button
                  key={idx}
                  id={`btn-api-item-${idx}`}
                  onClick={() => setActiveEndpointIdx(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all space-y-1.5 ${
                    isActive
                      ? 'bg-blue-600/5 border-blue-500/60 text-white font-semibold'
                      : 'bg-zinc-950/20 border-zinc-900/40 hover:border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-zinc-200 truncate">{ep.path}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 line-clamp-1">{ep.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Endpoint Technical Specs Sheet */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {activeEndpoint.method}
                  </span>
                  <span className="font-mono text-base font-bold text-white select-all">{activeEndpoint.path}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{activeEndpoint.description}</p>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-900">
                Limit: {activeEndpoint.rateLimit}
              </div>
            </div>

            {/* Code and Request specs */}
            <div className="space-y-4 text-xs">
              {/* CURL Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                  <span>Terminal cURL Example</span>
                  <button 
                    onClick={() => handleCopy('curl', activeEndpoint.curlExample)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedId === 'curl' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-blue-300 overflow-x-auto select-all leading-relaxed">
                  {activeEndpoint.curlExample}
                </pre>
              </div>

              {/* Grid of Request & Response */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Request Body */}
                {activeEndpoint.requestBody && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                      <span>Request Payload (JSON)</span>
                      <button 
                        onClick={() => handleCopy('req', activeEndpoint.requestBody!)}
                        className="flex items-center gap-1 hover:text-white transition-colors text-[11px]"
                      >
                        {copiedId === 'req' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-blue-300 overflow-x-auto max-h-60 select-all leading-relaxed">
                      {activeEndpoint.requestBody}
                    </pre>
                  </div>
                )}

                {/* Response Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                    <span>Response Payload (JSON)</span>
                    <button 
                      onClick={() => handleCopy('res', activeEndpoint.responseBody)}
                      className="flex items-center gap-1 hover:text-white transition-colors text-[11px]"
                    >
                      {copiedId === 'res' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-green-400 overflow-x-auto max-h-60 select-all leading-relaxed">
                    {activeEndpoint.responseBody}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

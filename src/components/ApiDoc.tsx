import React, { useState, useEffect } from 'react';
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
  Lock,
  Key,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiFetch, apiFetchJson } from '../lib/api';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  rateLimit: string;
  requestBody?: string;
  responseBody: string;
  curlExample: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  tier: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: 'active' | 'revoked';
  rawKey?: string;
}

export default function ApiDoc() {
  const [activeEndpointIdx, setActiveEndpointIdx] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pro API Keys Management State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [generatingKey, setGeneratingKey] = useState<boolean>(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string>('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await apiFetchJson<{ success: boolean; keys: ApiKeyItem[] }>('/api/keys');
      if (res.keys) {
        setApiKeys(res.keys);
      }
    } catch (err) {
      console.warn('Could not fetch API keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    setKeyError('');
    try {
      const res = await apiFetchJson<{ success: boolean; apiKey: any }>('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim(), tier: 'SOC Professional' })
      });
      if (res.apiKey) {
        setCreatedSecret(res.apiKey.rawKey);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (err: any) {
      setKeyError(err.message || 'Failed to generate API Key.');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any automated integration using this key will be disconnected.')) {
      return;
    }
    try {
      await apiFetch(`/api/keys/${id}`, { method: 'DELETE' });
      fetchApiKeys();
    } catch (err: any) {
      alert('Failed to revoke API Key: ' + err.message);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeApiKeySecret = apiKeys.find(k => k.status === 'active')?.prefix || 'krt_live_your_api_key_here';

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
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/security-headers \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Key: ${createdSecret || activeApiKeySecret}' \\\n  -d '{"url": "github.com"}'`
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
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/cve \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Key: ${createdSecret || activeApiKeySecret}' \\\n  -d '{"cveId": "CVE-2021-44228"}'`
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
      curlExample: `curl -X POST \\\n  https://karrents-workbench.app/api/ssl-checker \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Key: ${createdSecret || activeApiKeySecret}' \\\n  -d '{"domain": "github.com"}'`
    }
  ];

  const activeEndpoint = endpoints[activeEndpointIdx];

  return (
    <div id="api-reference-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Code className="w-4 h-4 text-brand-neon" />
            Developer REST API & Pro Key Manager
          </h2>
          <p className="text-xs text-zinc-400">
            Build integrations, automate scans, and query threat intelligence feeds dynamically using robust REST API keys.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="px-3 py-1.5 bg-brand-neon hover:bg-brand-neon/90 text-black font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-neon/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Pro API Key</span>
          </button>
        </div>
      </div>

      {/* Pro API Keys Management Box */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-neon" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Your Active Pro API Keys</h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Header format: <code className="text-brand-neon bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">X-API-Key: krt_live_...</code></span>
        </div>

        {/* Created Key Banner (Shown ONCE right after generation) */}
        {createdSecret && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                New API Key Secret Generated! Save it securely now:
              </span>
              <button
                onClick={() => setCreatedSecret(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-emerald-900 font-mono text-xs text-emerald-300 select-all">
              <span className="truncate flex-1">{createdSecret}</span>
              <button
                onClick={() => handleCopy('new_key', createdSecret)}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedId === 'new_key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'new_key' ? 'Copied!' : 'Copy Secret'}</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 italic">
              Note: For security reasons, full raw API key secrets are never stored in plain text or displayed again.
            </p>
          </div>
        )}

        {/* API Keys Table */}
        {loadingKeys ? (
          <div className="text-xs text-zinc-500 animate-pulse py-2 font-mono">Loading active API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-xs text-zinc-500 font-mono py-2 flex items-center justify-between">
            <span>No custom API keys generated yet. Click "Generate Pro API Key" to build automated pipelines.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">Key Name</th>
                  <th className="p-2.5">Key Identifier</th>
                  <th className="p-2.5">Access Tier</th>
                  <th className="p-2.5">Created</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-2.5 font-bold text-white font-sans">{key.name}</td>
                    <td className="p-2.5 text-brand-neon">{key.prefix}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-brand-neon/10 text-brand-neon border border-brand-neon/20 text-[10px]">
                        {key.tier}
                      </span>
                    </td>
                    <td className="p-2.5 text-zinc-400 text-[11px]">{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5">
                      {key.status === 'active' ? (
                        <span className="text-emerald-400 font-bold text-[10px]">● Active</span>
                      ) : (
                        <span className="text-zinc-500 text-[10px]">● Revoked</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="p-1 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Revoke API Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-neon" />
                Generate Pro Developer API Key
              </h3>
              <button onClick={() => setShowGeneratorModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              {keyError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg">
                  {keyError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Key Identifier / Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. CI/CD Security Pipeline Key"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon"
                />
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 space-y-1">
                <span className="font-bold text-white block">Key Permissions & Quota</span>
                <p className="text-[11px] leading-relaxed">
                  Grants full access to Karrents REST APIs (security headers, CVE lookup, SSL checker, DNS analysis) with up to 120 requests/minute.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingKey || !newKeyName.trim()}
                  className="px-4 py-2 bg-brand-neon hover:bg-brand-neon/90 text-black font-bold rounded-lg shadow-lg shadow-brand-neon/10 disabled:opacity-50"
                >
                  {generatingKey ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Endpoints Documentation Reference Grid */}
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
                      ? 'bg-brand-neon/5 border-brand-neon/60 text-white font-semibold'
                      : 'bg-zinc-950/20 border-zinc-900/40 hover:border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
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
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
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
                <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-brand-neon/90 overflow-x-auto select-all leading-relaxed">
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
                    <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-brand-neon/90 overflow-x-auto max-h-60 select-all leading-relaxed">
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

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api.ts';
import { 
  User, 
  Key, 
  Bell, 
  Activity, 
  Shield, 
  Plus, 
  Trash2, 
  Check, 
  Copy,
  Terminal,
  RefreshCw,
  CreditCard,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed: string;
}

interface ProfileProps {
  userEmail: string;
  userPlan: string;
  onChangePlan?: (plan: string) => void;
  onLogout?: () => void;
}

export default function Profile({ userEmail, userPlan, onChangePlan, onLogout }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<string>('keys');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // MFA states
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [mfaSecret, setMfaSecret] = useState<string>('');
  const [mfaQrCode, setMfaQrCode] = useState<string>('');
  const [mfaSetupCode, setMfaSetupCode] = useState<string>('');
  const [mfaStatusMsg, setMfaStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSettingUpMfa, setIsSettingUpMfa] = useState<boolean>(false);
  const [isSubmittingMfa, setIsSubmittingMfa] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setMfaEnabled(data.user?.mfa_enabled || false);
        }
      } catch (err) {
        console.error('Failed to load user profile details for MFA:', err);
      }
    };
    fetchUser();
  }, []);

  const handleStartMfaSetup = async () => {
    setMfaStatusMsg(null);
    try {
      const res = await apiFetch('/api/auth/mfa/setup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMfaSecret(data.secret);
        setMfaQrCode(data.qrCodeDataUrl);
        setIsSettingUpMfa(true);
      } else {
        const errData = await res.json();
        setMfaStatusMsg({ type: 'error', text: errData.error || 'Failed to initialize MFA setup.' });
      }
    } catch (err: any) {
      setMfaStatusMsg({ type: 'error', text: err.message || 'MFA setup error.' });
    }
  };

  const handleVerifyAndEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupCode.trim()) return;
    setIsSubmittingMfa(true);
    setMfaStatusMsg(null);
    try {
      const res = await apiFetch('/api/auth/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret: mfaSecret, code: mfaSetupCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setMfaEnabled(true);
        setIsSettingUpMfa(false);
        setMfaSetupCode('');
        setMfaSecret('');
        setMfaQrCode('');
        setMfaStatusMsg({ type: 'success', text: 'Google Authenticator MFA enabled successfully!' });
      } else {
        setMfaStatusMsg({ type: 'error', text: data.error || 'Invalid verification code. Please check your app.' });
      }
    } catch (err: any) {
      setMfaStatusMsg({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setIsSubmittingMfa(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm('Are you sure you want to disable Multi-Factor Authentication? Your account will be less secure.')) {
      return;
    }
    setMfaStatusMsg(null);
    try {
      const res = await apiFetch('/api/auth/mfa/disable', { method: 'POST' });
      if (res.ok) {
        setMfaEnabled(false);
        setMfaStatusMsg({ type: 'success', text: 'Multi-Factor Authentication disabled successfully.' });
      } else {
        const errData = await res.json();
        setMfaStatusMsg({ type: 'error', text: errData.error || 'Failed to disable MFA.' });
      }
    } catch (err: any) {
      setMfaStatusMsg({ type: 'error', text: err.message || 'Failed to disable MFA.' });
    }
  };

  // Webhook states
  const [webhookSlack, setWebhookSlack] = useState<string>('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
  const [webhookTeams, setWebhookTeams] = useState<string>('');
  const [webhookDiscord, setWebhookDiscord] = useState<string>('');
  const [hookEvents, setHookEvents] = useState({
    certExp: true,
    headersFail: true,
    cveAlert: false
  });

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'key_01',
      name: 'GitHub CI Pipeline Scan',
      keyPrefix: 'kar_live_8f3a...',
      createdAt: '2026-06-12T10:14:00Z',
      lastUsed: '2026-07-15T15:24:00Z'
    },
    {
      id: 'key_02',
      name: 'Local Prometheus Exporter',
      keyPrefix: 'kar_live_2e7b...',
      createdAt: '2026-07-01T11:00:00Z',
      lastUsed: '2026-07-15T14:50:00Z'
    }
  ]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = () => {
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: `Workbench Integration Key ${apiKeys.length + 1}`,
      keyPrefix: `kar_live_${Math.random().toString(36).substring(2, 6)}...`,
      createdAt: new Date().toISOString(),
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const auditLogs = [
    { event: 'User Authenticated', ip: '192.168.1.144', time: '2026-07-15T15:20:00Z', status: 'SUCCESS' },
    { event: 'API Key Created', ip: '192.168.1.144', time: '2026-07-15T14:32:00Z', status: 'SUCCESS' },
    { event: 'Report Exported (JSON)', ip: '192.168.1.144', time: '2026-07-15T14:15:00Z', status: 'SUCCESS' }
  ];

  return (
    <div id="profile-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            User Settings & Profile Control
          </h2>
          <p className="text-xs text-zinc-400">
            Configure authentication preferences, manage programmatic API keys, setup team webhooks, and review platform audits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl h-fit">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-2 block">Configuration Settings</span>
          <button
            id="profile-tab-keys"
            onClick={() => { setActiveTab('keys'); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
              activeTab === 'keys' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Developer Keys</span>
          </button>
          <button
            id="profile-tab-webhooks"
            onClick={() => { setActiveTab('webhooks'); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
              activeTab === 'webhooks' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Integrations & Hooks</span>
          </button>
          <button
            id="profile-tab-audit"
            onClick={() => { setActiveTab('audit'); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
              activeTab === 'audit' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit History Logs</span>
          </button>
          <button
            id="profile-tab-billing"
            onClick={() => { setActiveTab('billing'); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
              activeTab === 'billing' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing & Plan</span>
          </button>
          <button
            id="profile-tab-security"
            onClick={() => { setActiveTab('security'); }}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
              activeTab === 'security' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & MFA</span>
          </button>
          {onLogout && (
            <>
              <hr className="border-zinc-800/40 my-2" />
              <button
                id="profile-logout-btn"
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors flex items-center gap-2.5 cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Session</span>
              </button>
            </>
          )}
        </div>

        {/* Content Sheets */}
        <div className="lg:col-span-3">
          {/* 1. Developer Keys */}
          {activeTab === 'keys' && (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/40 pb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-400" />
                    Programmatic API Credentials
                  </h3>
                  <p className="text-xs text-zinc-400">Keys enable full-access server operations over CLI integrations.</p>
                </div>
                <button
                  id="btn-create-api-key"
                  onClick={handleCreateKey}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>

              {/* Keys list */}
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1 shrink min-w-0">
                      <span className="font-bold text-zinc-200 truncate block">{k.name}</span>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="font-bold text-blue-400 select-all">{k.keyPrefix}</span>
                        <span>•</span>
                        <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Last used: {k.lastUsed === 'Never' ? 'Never' : new Date(k.lastUsed).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`btn-copy-prefix-${k.id}`}
                        onClick={() => handleCopy(k.id, k.keyPrefix)}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copy Key Reference"
                      >
                        {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        id={`btn-delete-key-${k.id}`}
                        onClick={() => handleDeleteKey(k.id)}
                        className="bg-red-950/25 border border-red-500/20 p-1.5 rounded text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    No active integration keys. Click "Generate Key" to establish automation triggers.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Webhooks & Notification integration */}
          {activeTab === 'webhooks' && (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              <div className="border-b border-zinc-800/40 pb-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  Outgoing Webhooks & Teams Alert Delivery
                </h3>
                <p className="text-xs text-zinc-400">Configure outbound HTTP POST pipelines when certificate expirations or validation anomalies occur.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Slack */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Slack Webhook URL</label>
                  <input
                    id="webhook-slack-input"
                    type="text"
                    value={webhookSlack}
                    onChange={(e) => setWebhookSlack(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* MS Teams */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">MS Teams Webhook URL</label>
                  <input
                    id="webhook-teams-input"
                    type="text"
                    value={webhookTeams}
                    onChange={(e) => setWebhookTeams(e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Discord */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Discord Webhook URL</label>
                  <input
                    id="webhook-discord-input"
                    type="text"
                    value={webhookDiscord}
                    onChange={(e) => setWebhookDiscord(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <hr className="border-zinc-800/40" />

                {/* Subscription toggles */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Trigger Hook Events</span>
                  <div className="space-y-2 text-zinc-300">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        id="hook-cb-certexp"
                        type="checkbox"
                        checked={hookEvents.certExp}
                        onChange={(e) => setHookEvents({ ...hookEvents, certExp: e.target.checked })}
                        className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Inbound SSL Certificate Expiration Warnings (&lt;30 Days remaining)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        id="hook-cb-headersfail"
                        type="checkbox"
                        checked={hookEvents.headersFail}
                        onChange={(e) => setHookEvents({ ...hookEvents, headersFail: e.target.checked })}
                        className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Security Headers grade drop warnings (below score of B)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        id="hook-cb-cvealert"
                        type="checkbox"
                        checked={hookEvents.cveAlert}
                        onChange={(e) => setHookEvents({ ...hookEvents, cveAlert: e.target.checked })}
                        className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Urgent CISA KEV Exploitation Alerts corresponding to infrastructure catalog</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-save-webhooks"
                    onClick={() => { alert("Webhook integration settings saved successfully!"); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    Save Integrations Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Audit logs */}
          {activeTab === 'audit' && (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-4">
              <div className="border-b border-zinc-800/40 pb-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Workspace Audit & Event Stream
                </h3>
                <p className="text-xs text-zinc-400">Passive forensic auditing of all platform sessions, API credential handshakes, and diagnostic lookups.</p>
              </div>

              {/* Log Table */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">Audit Action</th>
                      <th className="py-2.5">Source Node IP</th>
                      <th className="py-2.5">Timestamp (UTC)</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-zinc-300 font-mono">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-zinc-950/20">
                        <td className="py-3 font-semibold text-zinc-200">{log.event}</td>
                        <td className="py-3 text-zinc-400">{log.ip}</td>
                        <td className="py-3 text-zinc-500">{new Date(log.time).toUTCString()}</td>
                        <td className="py-3 text-green-400 font-bold">{log.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Billing & Workspace Plan sheet */}
          {activeTab === 'billing' && (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              <div className="border-b border-zinc-800/40 pb-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    Billing & Workspace Plan
                  </h3>
                  <p className="text-xs text-zinc-400">Review subscription features, update billing details, and view payment histories.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-zinc-950/40 border border-zinc-850 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Active Workspace Tier</span>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 capitalize">
                        {userPlan}
                        <span className="text-[8px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold px-1 rounded uppercase">Current</span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Rate / Cost</span>
                      <span className="text-sm font-bold text-zinc-300 font-mono">
                        {userPlan === 'Guest / Sandbox' ? '$0 / forever' : userPlan === 'SOC Professional' ? '$49 / month' : '$249 / month'}
                      </span>
                    </div>
                  </div>

                  <hr className="border-zinc-900/50" />

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Included Tier Features</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                      {userPlan === 'Guest / Sandbox' ? (
                        <>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>5 manual DNS scans/hour</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>3 HTTP Header reports/hour</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Standard TLS Handshakes</span>
                          </li>
                        </>
                      ) : userPlan === 'SOC Professional' ? (
                        <>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Uncapped scans & reports</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Unlimited Gemini AI prompts</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>60 req/min API Key limits</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>JSON/CSV/Markdown exports</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Shared team watchlists</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Slack/Teams webhooks integration</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>300 req/min Priority API Key</span>
                          </li>
                          <li className="flex gap-1.5 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>SLA 99.99% Guaranteed uptime</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {userPlan !== 'Guest / Sandbox' && onChangePlan && (
                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel your paid workspace subscription? This will downgrade you to the Sandbox tier.")) {
                            onChangePlan('Guest / Sandbox');
                          }
                        }}
                        className="bg-red-950/25 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Plan / Downgrade
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl space-y-3.5 text-xs">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Workspace Admin</span>
                  </div>
                  <div className="space-y-2 text-zinc-400 leading-relaxed font-mono text-[10.5px]">
                    <div>
                      <span className="text-zinc-500 block">Workspace Email:</span>
                      <span className="text-zinc-300 font-bold select-all truncate">{userEmail}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Next Renewal Date:</span>
                      <span className="text-zinc-300">August 16, 2026</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Payment Method:</span>
                      <span className="text-zinc-300">•••• •••• •••• 4242 (Stripe)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Invoice History Logs</h4>
                <div className="bg-zinc-950/30 border border-zinc-850 rounded-xl overflow-hidden text-xs font-mono">
                  <div className="grid grid-cols-4 bg-zinc-950 px-4 py-2 text-zinc-500 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-850">
                    <span>Invoice ID</span>
                    <span>Date (UTC)</span>
                    <span>Amount</span>
                    <span className="text-right">Receipt File</span>
                  </div>
                  <div className="divide-y divide-zinc-900/60">
                    {userPlan === 'Guest / Sandbox' ? (
                      <div className="px-4 py-4 text-center text-zinc-500">
                        No billing transactions registered. Complete a checkout in the Plans view to upgrade.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 px-4 py-3 items-center hover:bg-zinc-950/20 text-zinc-300">
                        <span className="font-semibold text-zinc-200">INV-2026-0042</span>
                        <span className="text-zinc-400">{new Date().toLocaleDateString()}</span>
                        <span className="font-bold text-emerald-400">{userPlan === 'SOC Professional' ? '$49.00' : '$249.00'}</span>
                        <button
                          type="button"
                          onClick={() => alert("Downloading encrypted invoice receipt... Done!")}
                          className="text-right text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                        >
                          Download (PDF)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Security & MFA (Google Authenticator) */}
          {activeTab === 'security' && (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              <div className="border-b border-zinc-800/40 pb-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Multi-Factor Authentication (MFA)
                </h3>
                <p className="text-xs text-zinc-400">
                  Secure your administrator session with Google Authenticator TOTP cryptological tokens.
                </p>
              </div>

              {mfaStatusMsg && (
                <div className={`p-4 rounded-lg text-xs flex items-center gap-2 ${
                  mfaStatusMsg.type === 'success' ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-400' : 'bg-red-950/30 border border-red-500/20 text-red-400'
                }`}>
                  <span>{mfaStatusMsg.text}</span>
                </div>
              )}

              {/* MFA Active state */}
              {mfaEnabled ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider font-mono">Google Authenticator MFA Active</span>
                        <span className="text-[11px] text-zinc-400 block">Your account is fully hardened against unauthorized access sessions.</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    To log in to your dashboard, you are required to submit your 6-digit dynamic TOTP token generated by your Google Authenticator mobile app in addition to your standard master password credential.
                  </p>

                  <div className="pt-2">
                    <button
                      id="btn-disable-mfa"
                      onClick={handleDisableMfa}
                      className="bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Disable Multi-Factor Authentication
                    </button>
                  </div>
                </div>
              ) : isSettingUpMfa ? (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Step 1: Scan QR Code</span>
                      <p className="text-xs text-zinc-400">Open Google Authenticator on your mobile device, tap "+" then choose "Scan a QR code".</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      <div className="bg-white p-3 rounded-xl border border-zinc-800">
                        <img 
                          src={mfaQrCode} 
                          alt="Google Authenticator QR Code" 
                          className="w-40 h-40 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2 max-w-sm shrink">
                        <span className="text-xs font-semibold text-zinc-300 block">Can't scan the code?</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          You can manually add this key into Google Authenticator under the "Enter a setup key" tab:
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px]">
                          <span className="text-blue-400 select-all font-bold break-all">{mfaSecret}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mfaSecret);
                              alert('MFA secret key copied to clipboard!');
                            }}
                            className="text-zinc-400 hover:text-white shrink-0"
                            title="Copy Secret Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAndEnableMfa} className="space-y-4">
                    <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-3">
                      <div className="space-y-1">
                        <label htmlFor="mfa-setup-code-input" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Step 2: Enter Verification Code
                        </label>
                        <p className="text-xs text-zinc-400">Input the 6-digit authorization code displayed in Google Authenticator to synchronize.</p>
                      </div>
                      <input
                        id="mfa-setup-code-input"
                        type="text"
                        required
                        value={mfaSetupCode}
                        onChange={(e) => setMfaSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-32 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-center text-zinc-200 tracking-widest focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        id="btn-confirm-mfa"
                        type="submit"
                        disabled={isSubmittingMfa || mfaSetupCode.length < 6}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                      >
                        {isSubmittingMfa ? 'Enabling MFA...' : 'Verify & Enable MFA'}
                      </button>
                      <button
                        id="btn-cancel-mfa"
                        type="button"
                        onClick={() => {
                          setIsSettingUpMfa(false);
                          setMfaSecret('');
                          setMfaQrCode('');
                          setMfaSetupCode('');
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                      >
                        Cancel Setup
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    By binding a Google Authenticator MFA configuration to your administrator account, you ensure that brute-force password guessing or physical key exposure is insufficient to compromise the platform.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      id="btn-setup-mfa"
                      onClick={handleStartMfaSetup}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Setup Google Authenticator</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

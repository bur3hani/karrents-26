import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed: string;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<string>('keys');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        </div>
      </div>
    </div>
  );
}

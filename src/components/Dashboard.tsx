import React from 'react';
import {
  ShieldAlert,
  Activity,
  Rss,
  Terminal,
  Zap,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  Play,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

interface DashboardProps {
  onLaunchTool: (toolName: string) => void;
}

export default function Dashboard({ onLaunchTool }: DashboardProps) {
  // Hardcoded mockup statistics for Recharts
  const auditVolumeData = [
    { name: 'Jul 09', Scans: 12, ThreatAlerts: 1 },
    { name: 'Jul 10', Scans: 18, ThreatAlerts: 3 },
    { name: 'Jul 11', Scans: 25, ThreatAlerts: 2 },
    { name: 'Jul 12', Scans: 14, ThreatAlerts: 5 },
    { name: 'Jul 13', Scans: 35, ThreatAlerts: 4 },
    { name: 'Jul 14', Scans: 42, ThreatAlerts: 8 },
    { name: 'Jul 15', Scans: 48, ThreatAlerts: 6 },
  ];

  const severityDistribution = [
    { name: 'Critical', Count: 14, fill: '#ef4444' },
    { name: 'High', Count: 28, fill: '#f97316' },
    { name: 'Medium', Count: 42, fill: '#eab308' },
    { name: 'Low', Count: 19, fill: '#22c55e' },
  ];

  const recentAnalyses = [
    { target: 'github.com', tool: 'Security Headers', grade: 'A', date: '10 mins ago', status: 'COMPLETED' },
    { target: '185.112.146.10', tool: 'IOC Lookup', grade: 'CRITICAL', date: '1 hour ago', status: 'MALICIOUS_FOUND' },
    { target: 'CVE-2021-44228', tool: 'CVE Explorer', grade: 'CRITICAL', date: '2 hours ago', status: 'COMPLETED' },
    { target: 'google.com', tool: 'Email Auditor', grade: 'LOW RISK', date: '1 day ago', status: 'COMPLETED' },
    { target: 'auth.banking-internal.net', tool: 'SSL Checker', grade: 'F', date: '3 days ago', status: 'EXPIRED' },
  ];

  const threatFeed = [
    { id: 'ADV-2026-041', title: 'Active Exploitation of Ivanti Secure Web Gateways', actor: 'UNC4312', severity: 'CRITICAL' },
    { id: 'ADV-2026-040', title: 'Zero-Click RCE in OpenSSH Server (regreSSHion Patch)', actor: 'Multiple APTs', severity: 'HIGH' },
    { id: 'ADV-2026-039', title: 'Ransomware Group LockBit Deploying New ESXi Encryptor', actor: 'LockBit 3.0', severity: 'CRITICAL' },
    { id: 'ADV-2026-038', title: 'Credential Harvesting Targeting Fortune 500 HR Portals', actor: 'Scattered Spider', severity: 'MEDIUM' },
  ];

  const securityNews = [
    { source: 'CISA Alert', headline: 'CISA Adds Apache HugeGraph-Server vulnerability to Known Exploited List', time: '4 hours ago' },
    { source: 'Wired Security', headline: 'Sophisticated Supply Chain malware discovered in widely distributed NPM registry package', time: '12 hours ago' },
    { source: 'BleepingComputer', headline: 'Hackers active in exploiting zero-day vulnerability in Outlook desktop application clients', time: '1 day ago' },
  ];

  const savedCves = [
    { id: 'CVE-2021-44228', title: 'Apache Log4j2 JNDI RCE (Log4Shell)', score: 10.0, dateSaved: 'Jul 12' },
    { id: 'CVE-2024-3094', title: 'XZ Utils Backdoor Injected Shell Injection', score: 10.0, dateSaved: 'Jul 14' },
    { id: 'CVE-2014-0160', title: 'OpenSSL Heartbeat Extension Leak (Heartbleed)', score: 7.5, dateSaved: 'Jul 15' },
  ];

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Scans Conducted</span>
            <div className="text-2xl font-black text-white font-mono">197</div>
            <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +24% this week
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Saved Indicators</span>
            <div className="text-2xl font-black text-white font-mono">42</div>
            <span className="text-[10px] text-zinc-500">Standard SOC watchlist tracking</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Watchlists</span>
            <div className="text-2xl font-black text-white font-mono">8</div>
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              2 Critical threats flagged
            </span>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Terminal className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">API Key Status</span>
            <div className="text-2xl font-black text-white font-mono">Active</div>
            <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" />
              Primary server connection live
            </span>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Award className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans Timeline Area Chart */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/40">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Security Scans Over Time</h3>
              <p className="text-[11px] text-zinc-500">Forensic inspection and configuration audit volume.</p>
            </div>
            <span className="text-[10px] font-mono bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800/40">
              UTC Local Time
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={auditVolumeData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Scans" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity distribution bar chart */}
        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/40">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Severity Distribution</h3>
              <p className="text-[11px] text-zinc-500">Categorization of flagged vulnerabilities.</p>
            </div>
          </div>
          <div className="h-64 flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="75%">
              <BarChart data={severityDistribution} layout="vertical" barSize={12}>
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="Count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-zinc-500 border-t border-zinc-800/40 pt-2 font-mono">
              <div>C: <span className="text-red-400 font-bold">14</span></div>
              <div>H: <span className="text-orange-400 font-bold">28</span></div>
              <div>M: <span className="text-yellow-400 font-bold">42</span></div>
              <div>L: <span className="text-green-400 font-bold">19</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main widgets split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Col: Recent Audits & Saved CVEs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Analyses list */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Recent Forensic Inspections
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead>
                  <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/30 pb-2">
                    <th className="pb-2">Target Scope</th>
                    <th className="pb-2">Utility Tool</th>
                    <th className="pb-2 text-center">Threat Status</th>
                    <th className="pb-2 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/20">
                  {recentAnalyses.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="py-3 font-mono font-bold text-zinc-200 select-all">{item.target}</td>
                      <td className="py-3">{item.tool}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.grade === 'A' || item.grade === 'LOW RISK' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          item.grade === 'CRITICAL' || item.grade === 'F' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-3 text-right text-zinc-500 text-[10.5px]">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Launch Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Operational Quick Launch
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <button
                id="quick-launch-cve"
                onClick={() => onLaunchTool('cve')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <Terminal className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">CVE Explorer</div>
                <div className="text-[10px] text-zinc-500 leading-snug">Lookup NVD databases</div>
              </button>

              <button
                id="quick-launch-ioc"
                onClick={() => onLaunchTool('ioc')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <ShieldAlert className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">IOC Lookup</div>
                <div className="text-[10px] text-zinc-500 leading-snug">Query threat indicators</div>
              </button>

              <button
                id="quick-launch-headers"
                onClick={() => onLaunchTool('headers')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <Activity className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">Headers Scan</div>
                <div className="text-[10px] text-zinc-500 leading-snug">Audit HTTP headers</div>
              </button>

              <button
                id="quick-launch-ssl"
                onClick={() => onLaunchTool('ssl')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <Zap className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">TLS/SSL Checker</div>
                <div className="text-[10px] text-zinc-500 leading-snug">Cryptographic validation</div>
              </button>

              <button
                id="quick-launch-email"
                onClick={() => onLaunchTool('email')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <Rss className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">Email Security</div>
                <div className="text-[10px] text-zinc-500 leading-snug">SPF/DMARC validators</div>
              </button>

              <button
                id="quick-launch-dns"
                onClick={() => onLaunchTool('dns')}
                className="bg-zinc-950/60 hover:bg-blue-600/10 border border-zinc-800/50 hover:border-blue-500 p-4 rounded-xl text-left space-y-2 transition-all group"
              >
                <Activity className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-zinc-200 text-xs">DNS Lookup</div>
                <div className="text-[10px] text-zinc-500 leading-snug">Domain zone queries</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Saved CVE Database & Curated Threat Bulletins */}
        <div className="space-y-6">
          {/* Intel Threat feed */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Active Threat Bulletins
            </h3>
            <div className="space-y-3">
              {threatFeed.map((feed) => (
                <div key={feed.id} className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg space-y-1.5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-blue-400 font-bold">{feed.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      feed.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {feed.severity}
                    </span>
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-xs leading-normal">{feed.title}</h4>
                  <div className="text-[10px] text-zinc-500">Adversary: {feed.actor}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Curated CVE Database */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              Saved Critical CVE Database
            </h3>
            <div className="space-y-3">
              {savedCves.map((cve) => (
                <div key={cve.id} className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg space-y-1.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-zinc-200">{cve.id}</span>
                      <span className="text-[9px] font-mono bg-zinc-800 text-zinc-500 px-1 py-0.2 rounded">{cve.dateSaved}</span>
                    </div>
                    <h4 className="font-medium text-zinc-400 text-[11px] leading-snug max-w-[150px] truncate">{cve.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-white">{cve.score.toFixed(1)}</div>
                    <div className="text-[9px] uppercase font-bold text-red-400">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security News curated headlines */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/40">
              CISA / Cyber Security News
            </h3>
            <div className="space-y-3.5 text-xs">
              {securityNews.map((news, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                    <span>{news.source}</span>
                    <span className="font-mono text-[9px]">{news.time}</span>
                  </div>
                  <p className="text-zinc-300 leading-snug text-[11px] hover:text-blue-400 cursor-pointer transition-colors">
                    {news.headline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Search, ShieldAlert, BookOpen, Layers, CheckSquare } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  description: string;
  detection: string;
  mitigation: string;
  actors: string[];
}

interface Tactic {
  id: string;
  name: string;
  techniques: Technique[];
}

export default function MitreExplorer() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>({
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    description: 'Adversaries may attempt to exploit a weakness in an Internet-facing computer or program to acquire unauthorized access. This can include websites, mail servers, databases, or API gateways containing unpatched vulnerabilities.',
    detection: 'Monitor application process parent-child flows (e.g., IIS or Apache spawning cmd.exe or bash). Review application access logs for SQL injection patterns, unusual path traversing, or massive payload lengths.',
    mitigation: 'Implement a Web Application Firewall (WAF). Keep server-side environments updated with immediate patch cycles. Follow strict privilege separation for process execution environments.',
    actors: ['APT29 (Cozy Bear)', 'APT41 (Double Dragon)', 'Lazarus Group']
  });

  const tactics: Tactic[] = [
    {
      id: 'TA0001',
      name: 'Initial Access',
      techniques: [
        {
          id: 'T1190',
          name: 'Exploit Public-Facing Application',
          description: 'Adversaries may attempt to exploit a weakness in an Internet-facing computer or program to acquire unauthorized access. This can include websites, mail servers, databases, or API gateways containing unpatched vulnerabilities.',
          detection: 'Monitor application process parent-child flows (e.g., IIS or Apache spawning cmd.exe or bash). Review application access logs for SQL injection patterns, unusual path traversing, or massive payload lengths.',
          mitigation: 'Implement a Web Application Firewall (WAF). Keep server-side environments updated with immediate patch cycles. Follow strict privilege separation for process execution environments.',
          actors: ['APT29 (Cozy Bear)', 'APT41 (Double Dragon)', 'Lazarus Group']
        },
        {
          id: 'T1566',
          name: 'Phishing',
          description: 'Adversaries may send phishing messages to gain access to victim systems. All forms of phishing (spearphishing attachment, spearphishing link, spearphishing service) rely on social engineering to trick victims.',
          detection: 'Implement robust email security filters scanning inbound SPF/DKIM/DMARC configurations. Analyze attachments for dual extensions or macro-enabled structures.',
          mitigation: 'Conduct security awareness training. Disable macro execution in Office documents. Use secure email gateways.',
          actors: ['APT28 (Fancy Bear)', 'FIN7', 'Lazarus Group']
        },
        {
          id: 'T1133',
          name: 'External Remote Services',
          description: 'Adversaries may leverage external remote services such as VPNs, Citrix gateways, or RDP ports to gain access to corporate networks using compromised credentials.',
          detection: 'Monitor auth logs for concurrent logins, geolocation anomalies, and massive login failure cycles.',
          mitigation: 'Enforce multi-factor authentication (MFA) across all endpoints. Terminate stale administrative sessions.',
          actors: ['APT29', 'LockBit Ransomware Affiliates']
        }
      ]
    },
    {
      id: 'TA0002',
      name: 'Execution',
      techniques: [
        {
          id: 'T1059',
          name: 'Command and Scripting Interpreter',
          description: 'Adversaries may abuse cmd.exe, PowerShell, bash, or python shell execution to run malicious scripts, automate attack commands, and lateral-move payloads.',
          detection: 'Enable PowerShell Transcription Logs (Event ID 4104). Monitor process arguments for encoded script flags (e.g., -EncodedCommand).',
          mitigation: 'Enable AppLocker or Software Restriction Policies. Restrict execution of powershell.exe to admins.',
          actors: ['APT29', 'APT41', 'FIN7']
        },
        {
          id: 'T1203',
          name: 'Exploitation for Client Execution',
          description: 'Adversaries may exploit vulnerabilities in client programs (web browsers, PDF readers, office editors) to execute arbitrary commands upon loading a resource.',
          detection: 'Audit endpoint security controls (EDR) for memory protection violations and spawning processes under document readers.',
          mitigation: 'Keep browsers and file rendering tools continuously patched. Restrict high-risk scripts (e.g., Silverlight, Flash).',
          actors: ['APT28', 'APT37 (Reaper)']
        }
      ]
    },
    {
      id: 'TA0003',
      name: 'Persistence',
      techniques: [
        {
          id: 'T1543',
          name: 'Create or Modify System Process',
          description: 'Adversaries may create or modify system services, daemons, or launch agents to run malicious binary structures automatically during OS boot schedules.',
          detection: 'Monitor Windows Event Logs (Event ID 7045 - Service Creation). Audit additions inside systemd services directory.',
          mitigation: 'Enforce Least Privilege. Use integrity controls like Windows Defender Application Control (WDAC).',
          actors: ['APT29', 'APT41', 'Lazarus Group']
        },
        {
          id: 'T1547',
          name: 'Boot or Logon Autostart Execution',
          description: 'Adversaries may register malicious programs inside Startup folders, registry Run keys, or system config profiles to execute code at user logon.',
          detection: 'Continuously scan registry hives containing key Run/RunOnce vectors.',
          mitigation: 'Restrict read-write privileges on critical user startup folders and registry subtrees.',
          actors: ['FIN7', 'LockBit Ransomware']
        }
      ]
    },
    {
      id: 'TA0004',
      name: 'Privilege Escalation',
      techniques: [
        {
          id: 'T1548',
          name: 'Abuse Elevation Control Mechanism',
          description: 'Adversaries may bypass User Account Control (UAC) prompts or exploit SUID shell vulnerabilities to elevate execution credentials.',
          detection: 'Monitor UAC elevation events. Scan Linux hosts for abnormal SUID binary flags.',
          mitigation: 'Configure UAC to "Always Notify". Eliminate unneeded SUID flags from user-facing systems.',
          actors: ['APT29', 'APT28', 'FIN7']
        },
        {
          id: 'T1068',
          name: 'Exploitation for Privilege Escalation',
          description: 'Adversaries may exploit local kernel or driver vulnerabilities to transition local user shell access to full administrative permissions (SYSTEM / Root).',
          detection: 'Analyze abnormal kernel crash logs and system driver updates.',
          mitigation: 'Implement host credential guard architectures. Restrict raw kernel driver loads using driver blocklists.',
          actors: ['APT41', 'Lazarus Group']
        }
      ]
    },
    {
      id: 'TA0005',
      name: 'Defense Evasion',
      techniques: [
        {
          id: 'T1070',
          name: 'Indicator Removal',
          description: 'Adversaries may clear event logs, delete shell histories, or overwrite audit trails to conceal active compromises.',
          detection: 'Monitor Security Log Event ID 1102 (The audit log was cleared) or deletion of .bash_history files.',
          mitigation: 'Stream security audit logs to an offsite secure read-only SIEM / Log Collector instantly.',
          actors: ['APT41', 'FIN7', 'LockBit']
        },
        {
          id: 'T1027',
          name: 'Obfuscated Files or Information',
          description: 'Adversaries may compress, encrypt, or base64-encode code components to evade signature-based antivirus engines.',
          detection: 'Trigger alerts on command-line variables presenting high Shannon entropy.',
          mitigation: 'Use next-generation heuristic-based EDR engines to analyze runtime process memory space.',
          actors: ['APT29', 'Lazarus Group']
        }
      ]
    },
    {
      id: 'TA0006',
      name: 'Credential Access',
      techniques: [
        {
          id: 'T1003',
          name: 'OS Credential Dumping',
          description: 'Adversaries may dump LSASS memory, SAM database hives, or shadow passwd files to exfiltrate active user password hashes.',
          detection: 'Monitor API calls to LSASS with memory read permissions (e.g., Mimikatz behavior). Alert on creation of SAM registry backups.',
          mitigation: 'Enable Credential Guard. Set LSASS process validation to strictly run as a protected process (LSA Protection).',
          actors: ['APT29', 'APT28', 'FIN7', 'Lazarus']
        },
        {
          id: 'T1110',
          name: 'Brute Force',
          description: 'Adversaries may execute password guessing, credential stuffing, or password spraying campaigns to compromise accounts.',
          detection: 'Set up multi-failed login triggers targeting single accounts or single source IPs.',
          mitigation: 'Implement strict account lockout policies. Enforce long complex passwords or passwordless standards.',
          actors: ['APT28', 'APT29']
        }
      ]
    },
    {
      id: 'TA0011',
      name: 'Command and Control',
      techniques: [
        {
          id: 'T1071',
          name: 'Application Layer Protocol',
          description: 'Adversaries may encapsulate malicious communication inside standard DNS, HTTP, or HTTPS protocol streams to slip past egress boundaries.',
          detection: 'Review beaconing pattern frequencies, DNS queries presenting long subdomain hashes, or abnormal user agents.',
          mitigation: 'Use TLS interception proxies. Block dynamic newly-registered domains at the gateway proxy level.',
          actors: ['APT29', 'APT41', 'Lazarus Group']
        },
        {
          id: 'T1090',
          name: 'Proxy',
          description: 'Adversaries may redirect C2 traffic through relays, SOCKS proxies, or Tor nodes to mask command origin sites.',
          detection: 'Monitor outgoing sessions targeting public Tor relays or standard VPN egress gateways.',
          mitigation: 'Block outgoing ports not explicitly authorized by proxy architecture rules.',
          actors: ['APT28', 'LockBit']
        }
      ]
    }
  ];

  // Filter based on search query
  const filteredTactics = tactics.map(t => {
    const matchingTechs = t.techniques.filter(tech =>
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...t, techniques: matchingTechs };
  }).filter(t => t.techniques.length > 0);

  return (
    <div id="mitre-explorer-view" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-neon" />
            MITRE ATT&CK® Matrix Explorer
          </h2>
          <p className="text-xs text-zinc-400">
            Interactive visualization of adversary tactics and defense mitigation blueprints.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            id="mitre-search-input"
            type="text"
            placeholder="Search Techniques (e.g. Phishing)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Techniques Matrix Column */}
        <div className="lg:col-span-3 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(searchQuery ? filteredTactics : tactics).map((tactic) => (
              <div key={tactic.id} className="bg-zinc-900/40 border border-zinc-800/30 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-zinc-900 border-b border-zinc-800/30 px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-200 tracking-tight">{tactic.name}</span>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{tactic.id}</span>
                </div>
                <div className="p-3 space-y-2">
                  {tactic.techniques.map((tech) => {
                    const isSelected = selectedTechnique?.id === tech.id;
                    return (
                      <button
                        key={tech.id}
                        id={`btn-mitre-tech-${tech.id}`}
                        onClick={() => setSelectedTechnique(tech)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-brand-neon/10 border-brand-neon text-brand-neon shadow-sm'
                            : 'bg-zinc-950/30 border-zinc-900/60 hover:border-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full font-medium">
                          <span className="truncate">{tech.name}</span>
                          <span className="text-[9px] font-mono opacity-80 shrink-0 bg-zinc-900 text-zinc-400 px-1 rounded ml-2">{tech.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Technique Details Panel */}
        <div className="space-y-6">
          {selectedTechnique ? (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-5 shadow-md space-y-5 h-fit lg:sticky lg:top-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold bg-brand-neon/10 text-brand-neon px-2 py-0.5 rounded border border-brand-neon/20">
                  {selectedTechnique.id}
                </span>
                <h3 className="font-bold text-zinc-100 text-base leading-tight tracking-tight">
                  {selectedTechnique.name}
                </h3>
              </div>

              <div className="space-y-4 text-xs text-zinc-300">
                <div className="space-y-1.5 p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-900/60">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-brand-neon" />
                    Description
                  </div>
                  <p className="leading-relaxed text-zinc-400">{selectedTechnique.description}</p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-900/60">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider mb-1">
                    <CheckSquare className="w-3.5 h-3.5 text-green-400" />
                    Detection Vector
                  </div>
                  <p className="leading-relaxed text-zinc-400">{selectedTechnique.detection}</p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-900/60">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Defensive Mitigations
                  </div>
                  <p className="leading-relaxed text-zinc-400">{selectedTechnique.mitigation}</p>
                </div>

                {selectedTechnique.actors.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Associated Threat Actors
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTechnique.actors.map((actor, idx) => (
                        <span key={idx} className="bg-zinc-950 text-zinc-400 font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-800/40">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800/30 rounded-xl p-8 text-center text-zinc-500">
              Select a technique from the matrix to inspect security metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

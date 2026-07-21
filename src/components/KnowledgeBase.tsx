import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  Layers, 
  ShieldAlert, 
  ArrowRight, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';

interface KBEntry {
  id: string; // e.g. CWE-79, CAPEC-63
  category: 'CWE' | 'CAPEC' | 'ATTACK_GROUP' | 'MITIGATION';
  title: string;
  description: string;
  impact: string;
  mitigations: string[];
  relatedTools: string[];
  relatedMitreId?: string;
  relatedCwes?: string[];
  externalUrl: string;
}

interface KnowledgeBaseProps {
  onNavigateToTool: (toolName: string) => void;
}

export default function KnowledgeBase({ onNavigateToTool }: KnowledgeBaseProps) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<KBEntry | null>({
    id: 'CWE-79',
    category: 'CWE',
    title: 'Improper Neutralization of Input During Web Page Generation (Cross-Site Scripting)',
    description: 'The software does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users. This allows attackers to execute arbitrary HTML or scripts in the context of the user session.',
    impact: 'Enables hijacking of client cookies, session tokens, keylogging, and arbitrary browser redirect actions on the victim host.',
    mitigations: [
      'Incorporate context-aware output encoding (HTML, JavaScript, Attribute, CSS).',
      'Implement a strict Content-Security-Policy (CSP) restricting script sources.',
      'Deploy HTTPOnly flags on critical cookie items.'
    ],
    relatedTools: ['Security Headers'],
    relatedMitreId: 'T1190',
    externalUrl: 'https://cwe.mitre.org/data/definitions/79.html'
  });

  const kbData: KBEntry[] = [
    {
      id: 'CWE-79',
      category: 'CWE',
      title: 'Improper Neutralization of Input During Web Page Generation (Cross-Site Scripting / XSS)',
      description: 'The software does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users. This allows attackers to execute arbitrary HTML or scripts in the context of the user session.',
      impact: 'Enables hijacking of client cookies, session tokens, keylogging, and arbitrary browser redirect actions on the victim host.',
      mitigations: [
        'Incorporate context-aware output encoding (HTML, JavaScript, Attribute, CSS).',
        'Implement a strict Content-Security-Policy (CSP) restricting script sources.',
        'Deploy HTTPOnly flags on critical cookie items.'
      ],
      relatedTools: ['Security Headers'],
      relatedMitreId: 'T1190',
      externalUrl: 'https://cwe.mitre.org/data/definitions/79.html'
    },
    {
      id: 'CWE-20',
      category: 'CWE',
      title: 'Improper Input Validation',
      description: 'The product receives input or data, but does not validate or incorrectly validates that the input has the properties that are required to process the data safely and correctly. Attackers can submit arbitrary formats to trigger crashes or stack overflows.',
      impact: 'Allows denial of service, stack buffer overflows, resource exhaustion, or remote code execution when un-vetted parameters bypass runtime bounds.',
      mitigations: [
        'Enforce robust server-side input validation mapping to white-listed parameters only.',
        'Adopt type-safe structures or strictly bounded parser engines.',
        'Validate parameter lengths and characters before processing.'
      ],
      relatedTools: ['CVE Explorer', 'IOC Lookup'],
      relatedMitreId: 'T1190',
      externalUrl: 'https://cwe.mitre.org/data/definitions/20.html'
    },
    {
      id: 'CWE-524',
      category: 'CWE',
      title: 'Use of Cache-Control Header with Sensitive Information',
      description: 'The software does not properly configure Cache-Control or Pragma directives, allowing browsers or shared intermediate proxy caches to write sensitive transactions onto persistent local storage disks.',
      impact: 'Enables session replay or corporate data leaks if administrative terminal cache structures are inspected by local non-authorized personnel.',
      mitigations: [
        'Set Cache-Control: no-store, no-cache, must-revalidate globally on authenticated routes.',
        'Add Pragma: no-cache and Expires: 0 to fallback responses.'
      ],
      relatedTools: ['Security Headers'],
      externalUrl: 'https://cwe.mitre.org/data/definitions/524.html'
    },
    {
      id: 'CAPEC-63',
      category: 'CAPEC',
      title: 'Simple Script Injection',
      description: 'An adversary injects malicious scripts into standard client inputs (comments, headers, parameter blocks) expecting the server-side environment to render the raw script payload back to auxiliary users without screening.',
      impact: 'Execution of rogue JavaScript blocks in secondary client spaces, facilitating data exfiltration and credential theft campaigns.',
      mitigations: [
        'Enforce context-specific output encoding schemes.',
        'Install Content-Security-Policy rules forbidding unsafe-inline scripts.'
      ],
      relatedTools: ['Security Headers'],
      relatedMitreId: 'T1190',
      relatedCwes: ['CWE-79'],
      externalUrl: 'https://capec.mitre.org/data/definitions/63.html'
    },
    {
      id: 'CAPEC-112',
      category: 'CAPEC',
      title: 'Query System Spoofing (Query Injection)',
      description: 'An adversary targets database or directory systems (SQL, LDAP, NoSQL, JNDI) by manipulating request syntax structures, coercing the interpreter to run malicious nested commands.',
      impact: 'Unauthorized table modifications, full database leaks, bypass of administrative gates, and raw remote execution triggers.',
      mitigations: [
        'Use parameterized prepared statements exclusively.',
        'Limit system privileges given to database connection users.'
      ],
      relatedTools: ['CVE Explorer'],
      relatedMitreId: 'T1190',
      relatedCwes: ['CWE-20'],
      externalUrl: 'https://capec.mitre.org/data/definitions/112.html'
    },
    {
      id: 'APT29',
      category: 'ATTACK_GROUP',
      title: 'APT29 / Cozy Bear (Nobelium / Midnight Blizzard)',
      description: 'Highly sophisticated cyber espionage group linked to the Russian Foreign Intelligence Service (SVR). Known for targeting government, diplomatic, think-tank, and IT systems globally using advanced supply chain compromises and credential attacks.',
      impact: 'Long-term stealthy intelligence harvesting, enterprise email domain compromises (SolarWinds hack), and geopolitical system infiltration.',
      mitigations: [
        'Enforce strictly monitored Multi-Factor Authentication (MFA) with number-matching configs.',
        'Continuously audit mail rules, OAuth applications permissions, and administrative token lifetimes.'
      ],
      relatedTools: ['IOC Lookup', 'Email Security'],
      relatedMitreId: 'T1566',
      externalUrl: 'https://attack.mitre.org/groups/G0016/'
    },
    {
      id: 'Lazarus',
      category: 'ATTACK_GROUP',
      title: 'Lazarus Group (Hidden Cobra)',
      description: 'State-sponsored threat actor group linked to the North Korean government. Highly active in financial cyber crime, cryptocurrency exchange theft, aerospace espionage, and destructive wiper attacks (Sony Pictures compromise).',
      impact: 'Massive capital exfiltration, intellectual property theft, ransomware disruption, and systemic supply chain compromises.',
      mitigations: [
        'Strictly block known malicious indicators of compromise (IOCs) at firewall and gateway level.',
        'Deploy host-based EDR agents tracking atypical parent-child process relationships.'
      ],
      relatedTools: ['IOC Lookup', 'CVE Explorer'],
      relatedMitreId: 'T1190',
      externalUrl: 'https://attack.mitre.org/groups/G0032/'
    }
  ];

  // Filters
  const filteredKB = kbData.filter(entry => {
    const matchesCategory = activeCategory === 'ALL' || entry.category === activeCategory;
    const matchesSearch = 
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'CWE': return 'Common Weakness';
      case 'CAPEC': return 'Attack Pattern';
      case 'ATTACK_GROUP': return 'Threat Actor';
      case 'MITIGATION': return 'Defensive Control';
      default: return cat;
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'CWE': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'CAPEC': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'ATTACK_GROUP': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'MITIGATION': return 'bg-green-500/10 border-green-500/20 text-green-400';
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
    }
  };

  const getToolRouteName = (toolTitle: string): string => {
    const title = toolTitle.toLowerCase();
    if (title.includes('cve') || title.includes('explorer')) return 'cve';
    if (title.includes('ioc') || title.includes('indicator') || title.includes('lookup')) return 'ioc';
    if (title.includes('header') || title.includes('headers') || title.includes('analyzer')) return 'headers';
    if (title.includes('ssl') || title.includes('tls') || title.includes('checker')) return 'ssl';
    if (title.includes('email') || title.includes('auditor') || title.includes('spf')) return 'email';
    if (title.includes('dns') || title.includes('lookup')) return 'dns';
    return 'cve';
  };

  return (
    <div id="knowledge-base-view" className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-neon" />
            Cybersecurity Knowledge Graph & Advisories
          </h2>
          <p className="text-xs text-zinc-400">
            Search standard databases of CWEs, CAPECs, mitigations and threat actor profiles, linked to active operational tools.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="kb-search-input"
              type="text"
              placeholder="Search CWE, Group, CAPEC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
            />
          </div>
          <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
            {['ALL', 'CWE', 'CAPEC', 'ATTACK_GROUP'].map((cat) => (
              <button
                key={cat}
                id={`btn-kb-filter-${cat}`}
                onClick={() => { setActiveCategory(cat); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  activeCategory === cat ? 'bg-brand-neon/25 text-brand-neon font-extrabold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat === 'ALL' ? 'Show All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entries List */}
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredKB.map((entry) => {
            const isSelected = selectedEntry?.id === entry.id;
            return (
              <div
                key={entry.id}
                id={`kb-item-${entry.id}`}
                onClick={() => setSelectedEntry(entry)}
                className={`border p-4 rounded-xl cursor-pointer transition-all space-y-2.5 ${
                  isSelected
                    ? 'bg-brand-neon/5 border-brand-neon/60 shadow-md'
                    : 'bg-zinc-900/40 border-zinc-800/40 hover:bg-zinc-800/20 hover:border-zinc-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand-neon font-bold bg-brand-neon/5 px-2 py-0.5 rounded border border-brand-neon/10">
                    {entry.id}
                  </span>
                  <span className={`px-2 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold border ${getCategoryBadgeColor(entry.category)}`}>
                    {getCategoryLabel(entry.category)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-xs tracking-tight line-clamp-1">{entry.title}</h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mt-1">{entry.description}</p>
                </div>
                {entry.relatedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center pt-1 text-[9.5px] text-zinc-500">
                    <span>Applicable:</span>
                    {entry.relatedTools.map((tool, tIdx) => (
                      <span key={tIdx} className="bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-900 text-zinc-400 font-semibold">{tool}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Entry Detail Sheet */}
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-800/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-brand-neon font-bold bg-brand-neon/10 border border-brand-neon/20 px-2 py-0.5 rounded">
                      {selectedEntry.id}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider border ${getCategoryBadgeColor(selectedEntry.category)}`}>
                      {getCategoryLabel(selectedEntry.category)}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-100 text-base leading-tight tracking-tight">
                    {selectedEntry.title}
                  </h3>
                </div>
                <a
                  href={selectedEntry.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 text-xs flex items-center gap-1.5 transition-colors font-mono shrink-0"
                >
                  <span>MITRE Feed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Summary Description */}
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-900/60 space-y-2 leading-relaxed">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description</span>
                  <p className="text-zinc-300">{selectedEntry.description}</p>
                </div>

                <div className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-900/60 space-y-2 leading-relaxed">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-red-400">Security & Business Impact</span>
                  <p className="text-zinc-300">{selectedEntry.impact}</p>
                </div>

                {/* Mitigations */}
                {selectedEntry.mitigations.length > 0 && (
                  <div className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-900/60 space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-green-400">Recommended Mitigations</span>
                    <ul className="space-y-2 text-zinc-300">
                      {selectedEntry.mitigations.map((mit, mIdx) => (
                        <li key={mIdx} className="flex gap-2 items-start leading-relaxed">
                          <span className="text-green-500 font-bold">•</span>
                          <span>{mit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Knowledge Graph Connections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Related Tools Links */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Applicable Workbench Tool</span>
                    <div className="space-y-1.5">
                      {selectedEntry.relatedTools.map((tool, idx) => (
                        <button
                          key={idx}
                          id={`btn-kb-tool-${idx}`}
                          onClick={() => onNavigateToTool(getToolRouteName(tool))}
                          className="w-full flex items-center justify-between text-left p-3 bg-zinc-950/60 hover:bg-brand-neon/10 border border-zinc-850 hover:border-brand-neon/30 rounded-xl transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand-neon" />
                            <span className="font-semibold text-zinc-300">{tool} Analyzer</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand-neon group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Connected Threat vectors */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Connected Framework Node</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {selectedEntry.relatedMitreId && (
                        <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                          <span className="text-zinc-500">MITRE Technique:</span>
                          <span className="text-brand-neon font-bold">{selectedEntry.relatedMitreId}</span>
                        </div>
                      )}
                      {selectedEntry.relatedCwes && selectedEntry.relatedCwes.length > 0 && (
                        <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                          <span className="text-zinc-500">Implements Weakness:</span>
                          <span className="text-yellow-400 font-bold">{selectedEntry.relatedCwes.join(', ')}</span>
                        </div>
                      )}
                      {!selectedEntry.relatedMitreId && !selectedEntry.relatedCwes && (
                        <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl text-center text-zinc-500">
                          Direct matrix endpoints active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-16 text-center text-zinc-500 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-zinc-600" />
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-300 text-sm">Select Knowledge Base Item</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Browse definitions and mitigations catalog to see correlated tools, standards mappings, and corporate security impacts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

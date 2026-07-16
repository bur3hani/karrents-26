import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Layers, 
  Cpu, 
  FileText, 
  HelpCircle, 
  Search, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  Code,
  Copy,
  Check
} from 'lucide-react';

interface DocSection {
  id: string;
  category: 'START' | 'GUIDES' | 'ARCHITECTURE' | 'LEGAL';
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function Documentation() {
  const [activeDocId, setActiveDocId] = useState<string>('welcome');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const docSections: DocSection[] = [
    {
      id: 'welcome',
      category: 'START',
      title: 'Introduction to Karrents',
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Introduction to Karrents Security Intelligence</h1>
          <p className="text-zinc-300 leading-relaxed text-xs">
            Karrents is an integrated, operational cybersecurity platform designed to consolidate critical defensive workflows under a unified workbench. By replacing fragmented, isolated scanning tools with state-of-the-art live diagnostic engines, Karrents empowers Security Operations Center (SOC) analysts, DevOps engineers, and incident responders to validate infrastructures, track threats, and automate mitigations from one trusted dashboard. It aggregates, enriches, analyses, correlates and explains cybersecurity information from multiple trusted sources into actionable intelligence.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2">
              <span className="font-bold text-xs text-blue-400">Deterministic Diagnostics</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Active SSL certificate handshakes, DNS records checks, and HTTP headers resolutions are compiled strictly in-memory on our sandboxed backend server, assuring zero trace and true telemetry data privacy.
              </p>
            </div>
            <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2">
              <span className="font-bold text-xs text-blue-400">Advanced AI Co-pilot</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Powered by server-side Gemini models, our workbench translates raw resolved JSON records into natural-language business risk vectors, CISA catalog correlations, and actionable Nginx/Apache configuration blocks.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <h2 className="text-sm font-bold text-zinc-200">The Core Philosophy</h2>
            <p className="text-zinc-400 text-xs leading-relaxed mt-1">
              Defenders should spend their time patching and monitoring, not manually scripting parser structures. Karrents enforces standard formats, professional report layouts, and interconnected knowledge graphs to optimize operational response latency.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'dev_guide',
      category: 'GUIDES',
      title: 'Developer Onboarding Guide',
      icon: <Terminal className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Developer Guide & Setup</h1>
          <p className="text-zinc-300 leading-relaxed text-xs">
            Karrents is built using an ultra-performant full-stack model combining Vite, React 19, and Tailwind CSS on the client, with a secure Express.js server running Node.js.
          </p>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 pt-2">Local Project Bootstrapping</h2>
          <div className="relative">
            <button 
              onClick={() => handleCopyCode('dev1', 'npm install\nnpm run dev')}
              className="absolute right-3 top-3 text-zinc-500 hover:text-white"
            >
              {copiedId === 'dev1' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-blue-300 overflow-x-auto">
              {`# Install dependencies from packages\nnpm install\n\n# Launch the local TSX development server on port 3000\nnpm run dev`}
            </pre>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 pt-2">Build Pipeline and Bundling</h2>
          <p className="text-zinc-400 text-xs leading-relaxed">
            For standalone container deployments, the Node server compiles TypeScript models via esbuild to a packed CommonJS file, bypasses relative ES Module resolving friction:
          </p>
          <div className="relative">
            <button 
              onClick={() => handleCopyCode('dev2', 'npm run build\nnpm run start')}
              className="absolute right-3 top-3 text-zinc-500 hover:text-white"
            >
              {copiedId === 'dev2' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="font-mono text-[11px] p-4 bg-zinc-950 rounded-lg border border-zinc-900 text-blue-300 overflow-x-auto">
              {`# Compiles front-end assets to static and compiles server.ts to dist/server.cjs\nnpm run build\n\n# Fire up the compiled production build\nnpm run start`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'architecture',
      category: 'ARCHITECTURE',
      title: 'Platform Architecture & Privacy',
      icon: <Cpu className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Architecture & Data Ingestion</h1>
          <p className="text-zinc-300 leading-relaxed text-xs">
            Karrents enforces a strict **Zero-Logs Policy**. Because security auditing queries often target highly sensitive corporate network nodes, our workspace handles data securely in memory.
          </p>
          <div className="border border-zinc-800/60 p-4 rounded-xl bg-zinc-950/20 space-y-3">
            <h3 className="font-bold text-zinc-100 text-xs">Diagnostic Execution Lifecycle:</h3>
            <ol className="space-y-2 text-xs text-zinc-400 list-decimal pl-4 leading-relaxed">
              <li><strong className="text-zinc-200">Input validation:</strong> Express sanitize controllers strip URL protocol parameters, ensuring regex-safe strings.</li>
              <li><strong className="text-zinc-200">Ephemeral connection:</strong> The server establishes secure sockets on port 443 (for certificates) or spawns asynchronous DNS resolvers directly.</li>
              <li><strong className="text-zinc-200">AI Augmentation:</strong> Clean metrics payloads are sent to Gemini models over SSL. Responses are parsed to JSON.</li>
              <li><strong className="text-zinc-200">Egress Delivery:</strong> The server returns raw payloads directly to client memory frames. System sockets are explicitly ended and garbage-collected. No databases persist scanned results without user-instantiated "Save Report" triggers.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'security_policy',
      category: 'LEGAL',
      title: 'Security and Privacy Policies',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Security & Vulnerability Disclosure Policy</h1>
          <p className="text-zinc-300 leading-relaxed text-xs">
            Karrents is committed to maintaining the highest security posture. We operate in accordance with defense-in-depth methodologies.
          </p>
          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
            <h3 className="font-bold text-zinc-200">1. Data Encryption</h3>
            <p>All trans-perimeter traffic to and from the Karrents dev container is protected by Transport Layer Security (TLS 1.3) protocols. Credentials, keys, and session cookies are secured with HTTPOnly, Secure, and SameSite=Strict headers to prevent client-side hijacking vectors.</p>
            
            <h3 className="font-bold text-zinc-200">2. Responsible Vulnerability Disclosure</h3>
            <p>If you identify an active configuration anomaly or server-side exploit path on our platform, please report it immediately to the security team. We request that you abstain from executing automated brute-force attacks or scanning public-facing endpoints, allowing us 30 days to apply patching remediations before public disclosure.</p>
          </div>
        </div>
      )
    }
  ];

  const filteredDocs = docSections.filter(doc => {
    return (
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeDoc = docSections.find(doc => doc.id === activeDocId) || docSections[0];

  return (
    <div id="documentation-view" className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Platform Documentation Hub
          </h2>
          <p className="text-xs text-zinc-400">
            Learn how to deploy Karrents, configure developer environments, utilize platform APIs, and inspect safety disclosure policies.
          </p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            id="doc-search-input"
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Sidebar Index */}
        <div className="lg:col-span-1 space-y-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl h-fit">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-2 block">Quick Index</span>
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === activeDocId;
              return (
                <button
                  key={doc.id}
                  id={`btn-doc-item-${doc.id}`}
                  onClick={() => setActiveDocId(doc.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                  }`}
                >
                  {doc.icon}
                  <span className="truncate">{doc.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documentation Content Body */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 shadow-md space-y-4 min-h-[50vh]">
            {activeDoc.content}
          </div>
        </div>
      </div>
    </div>
  );
}

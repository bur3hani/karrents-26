import React, { useState } from 'react';
import { Search, Sparkles, Terminal, Activity, HelpCircle, X, ChevronRight } from 'lucide-react';
import { AdvisoryData } from '../types';
import { apiFetch } from '../lib/api';

interface AisearchBarProps {
  onNavigateToTool: (toolName: string) => void;
}

export default function AisearchBar({ onNavigateToTool }: AisearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AdvisoryData | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || query.trim().length < 2) return;

    setLoading(true);
    setIsOpen(true);
    try {
      const response = await apiFetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error("AI Advisor Search Error:", err);
    } finally {
      setLoading(false);
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
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          id="global-advisor-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI Advisor (e.g. How to mitigate clickjacking?)..."
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-24 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          id="global-advisor-submit"
          type="submit"
          className="absolute right-1.5 top-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold tracking-tight transition-colors flex items-center gap-1 border border-blue-500/20"
        >
          <Sparkles className="w-3 h-3" />
          <span>Ask AI</span>
        </button>
      </form>

      {/* Advisor Overlay Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-full sm:w-[480px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-5 space-y-4 z-50 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900/60">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>AI Security Advisory Copilot</span>
            </div>
            <button
              id="close-advisor-panel"
              onClick={() => { setIsOpen(false); setResult(null); setQuery(''); }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-3 bg-zinc-900 rounded w-1/3"></div>
              <div className="h-2 bg-zinc-900 rounded w-3/4"></div>
              <div className="h-2 bg-zinc-900 rounded w-5/6"></div>
              <div className="h-2 bg-zinc-900 rounded w-2/3"></div>
              <div className="pt-4 h-12 bg-zinc-900/60 rounded-lg"></div>
            </div>
          ) : result ? (
            <div className="space-y-4 text-xs">
              {/* Answer Content */}
              <div className="space-y-1.5 text-zinc-300 leading-relaxed bg-zinc-900/30 p-3.5 border border-zinc-900/60 rounded-lg">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Advisory Answer</span>
                <p className="whitespace-pre-wrap">{result.answer}</p>
              </div>

              {/* Recommended tools mapped to active queries */}
              {result.suggestedTools && result.suggestedTools.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Recommended Workbench Tools</span>
                  <div className="grid grid-cols-2 gap-2">
                    {result.suggestedTools.map((tool, idx) => (
                      <button
                        key={idx}
                        id={`advisor-tool-${idx}`}
                        onClick={() => {
                          onNavigateToTool(getToolRouteName(tool));
                          setIsOpen(false);
                          setResult(null);
                        }}
                        className="flex items-center justify-between text-left p-2 bg-zinc-900/60 hover:bg-blue-600/10 border border-zinc-900/60 hover:border-blue-500/30 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-semibold text-zinc-300 truncate max-w-[120px]">{tool}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Related MITRE mappings */}
              {result.mitreTechniques && result.mitreTechniques.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Associated Attack Techniques</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.mitreTechniques.map((tech, idx) => (
                      <span key={idx} className="bg-zinc-900 border border-zinc-800/40 px-2 py-0.5 rounded font-mono text-[9px] text-zinc-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related security standards */}
              {result.relatedConcepts && result.relatedConcepts.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Associated Cyber Concepts</span>
                  <div className="flex flex-wrap gap-1">
                    {result.relatedConcepts.map((concept, idx) => (
                      <span key={idx} className="bg-zinc-950 text-zinc-500 border border-zinc-900/60 px-1.5 py-0.5 rounded text-[9px]">
                        #{concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 space-y-1.5">
              <HelpCircle className="w-6 h-6 mx-auto text-zinc-600" />
              <p>Type a cyber concept (e.g. "CVE-2021-44228", "DMARC", "HSTS") above to begin advisory analysis.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Folder, Globe, AlertTriangle, User, FileText, BookOpen, Shield, ShieldAlert, ArrowRight, Bookmark, History, Trash2, Clock, Check } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface SearchResultItem {
  id: string;
  projectId?: string;
  title: string;
  subtitle: string;
  type: 'project' | 'asset' | 'finding' | 'user' | 'report' | 'knowledge' | 'mitre' | 'cve' | 'doc';
  details?: string;
  severity?: string;
  status?: string;
  riskScore?: number;
  date?: string;
}

interface ProductionSearchBarProps {
  onNavigateToSection?: (section: string, itemData?: any) => void;
}

export default function ProductionSearchBar({ onNavigateToSection }: ProductionSearchBarProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, SearchResultItem[]>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Saved and Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('karrents_recent_searches');
      return saved ? JSON.parse(saved) : ['Log4j', 'CVE-2021-44228', 'TLS 1.3', 'Acme Corp'];
    } catch {
      return ['Log4j', 'CVE-2021-44228'];
    }
  });

  const [savedSearches, setSavedSearches] = useState<{ id: string; query: string; category: string }[]>(() => {
    try {
      const saved = localStorage.getItem('karrents_saved_searches');
      return saved ? JSON.parse(saved) : [
        { id: '1', query: 'CRITICAL', category: 'findings' },
        { id: '2', query: 'Domain', category: 'assets' }
      ];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute Search
  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      setTotalCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/search?q=${encodeURIComponent(query)}&category=${category}&sortBy=${sortBy}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || {});
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Production Search Error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, category, sortBy]);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('karrents_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSearch = () => {
    if (!query.trim()) return;
    const newItem = { id: Date.now().toString(), query: query.trim(), category };
    const updated = [newItem, ...savedSearches.filter(s => s.query !== query.trim())];
    setSavedSearches(updated);
    try {
      localStorage.setItem('karrents_saved_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(item.title);
    setIsOpen(false);

    if (!onNavigateToSection) return;

    switch (item.type) {
      case 'project':
        onNavigateToSection('dashboard', { projectId: item.id });
        break;
      case 'asset':
        onNavigateToSection('dashboard', { assetId: item.id, projectId: item.projectId });
        break;
      case 'finding':
        onNavigateToSection('dashboard', { findingId: item.id, projectId: item.projectId });
        break;
      case 'user':
        onNavigateToSection('profile', { userId: item.id });
        break;
      case 'report':
        onNavigateToSection('saved-reports', { reportId: item.id });
        break;
      case 'knowledge':
        onNavigateToSection('kb', { articleId: item.id });
        break;
      case 'mitre':
        onNavigateToSection('mitre', { techniqueId: item.id });
        break;
      case 'cve':
        onNavigateToSection('tools', { tool: 'cve', query: item.id });
        break;
      case 'doc':
        onNavigateToSection('docs', { docId: item.id });
        break;
      default:
        onNavigateToSection('dashboard');
    }
  };

  const flattenResults = (): SearchResultItem[] => {
    const list: SearchResultItem[] = [];
    Object.values(results).forEach(group => {
      if (Array.isArray(group)) list.push(...group);
    });
    return list;
  };

  const allList = flattenResults();

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'project': return <Folder className="w-3.5 h-3.5 text-blue-400" />;
      case 'asset': return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      case 'finding': return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case 'user': return <User className="w-3.5 h-3.5 text-green-400" />;
      case 'report': return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'knowledge': return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'mitre': return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'cve': return <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />;
      default: return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-lg">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          ref={inputRef}
          id="global-workbench-search"
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search projects, assets, findings, users, reports, CVEs, MITRE..."
          className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-lg pl-10 pr-24 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded shadow-sm">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Expanded Live Search Overlay Modal Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-11 w-full sm:w-[560px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-4 space-y-3 z-50 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900 overflow-x-auto gap-1 custom-scrollbar">
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'projects', label: 'Projects' },
                { id: 'assets', label: 'Assets' },
                { id: 'findings', label: 'Findings' },
                { id: 'reports', label: 'Reports' },
                { id: 'knowledge', label: 'Knowledge' },
                { id: 'mitre', label: 'MITRE' },
                { id: 'cves', label: 'CVEs' },
                { id: 'users', label: 'Users' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat.id
                      ? 'bg-brand-neon/20 text-brand-neon border border-brand-neon/30'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {query.trim() && (
              <button
                onClick={handleSaveSearch}
                className="text-[10px] text-zinc-400 hover:text-brand-neon flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-1 rounded bg-zinc-900"
                title="Save this search query"
              >
                <Bookmark className="w-3 h-3" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
          </div>

          {/* Search Query Empty / Initial State: Show Recent & Saved Searches */}
          {!query.trim() && (
            <div className="space-y-4 py-1 text-xs">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><History className="w-3 h-3 text-zinc-500" /> Recent Searches</span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('karrents_recent_searches');
                      }}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setQuery(s); }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 rounded px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {savedSearches.length > 0 && (
                <div>
                  <div className="text-[11px] text-zinc-400 mb-2 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-3 h-3 text-brand-neon" /> Saved Searches
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {savedSearches.map((saved) => (
                      <button
                        key={saved.id}
                        onClick={() => {
                          setQuery(saved.query);
                          setCategory(saved.category || 'all');
                        }}
                        className="text-left bg-zinc-900/50 hover:bg-zinc-800/80 p-2 rounded-lg border border-zinc-800/60 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-semibold text-zinc-200 text-xs">{saved.query}</p>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">{saved.category}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-brand-neon transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-6 space-y-2 text-center text-zinc-500 text-xs font-mono">
              <div className="inline-block w-4 h-4 border-2 border-brand-neon border-t-transparent rounded-full animate-spin mb-1" />
              <p>Searching workspace index across security records...</p>
            </div>
          )}

          {/* Results Display */}
          {!loading && query.trim() && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono border-b border-zinc-900 pb-1.5">
                <span>{totalCount} {totalCount === 1 ? 'match' : 'matches'} found</span>
                <span className="text-[10px] text-zinc-500 uppercase">Category: {category}</span>
              </div>

              {totalCount === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs space-y-1">
                  <p className="font-medium text-zinc-400">No matching workspace records found for "{query}".</p>
                  <p className="text-[11px] text-zinc-600">Try broadening your search term or switching the category filter.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {allList.map((item, idx) => (
                    <div
                      key={`${item.type}-${item.id}-${idx}`}
                      onClick={() => handleSelectResult(item)}
                      className="p-2.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg transition-all cursor-pointer flex items-start gap-3 group"
                    >
                      <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-md mt-0.5 group-hover:border-zinc-700 transition-colors">
                        {getCategoryIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-zinc-200 text-xs truncate group-hover:text-brand-neon transition-colors">
                            {item.title}
                          </p>
                          {item.severity && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              item.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {item.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.subtitle}</p>
                        {item.details && (
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1 font-sans">
                            {item.details}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-brand-neon opacity-0 group-hover:opacity-100 transition-all self-center" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

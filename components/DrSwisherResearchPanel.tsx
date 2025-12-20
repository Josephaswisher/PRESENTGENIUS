/**
 * Dr. Swisher Research Panel - Optimized Medical Research UI
 * Integrates UpToDate, MKSAP 19, Perplexity, and PubMed directly
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  BeakerIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  BoltIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  searchMedicalEvidence,
  getLatestGuidelines,
  getDifferentialDiagnosis,
  getDrugInfo,
} from '../services/perplexity';
import {
  searchUpToDate,
  searchMKSAP,
  searchPubMed,
  aggregateSearch,
  checkScraperHealth,
  loginUpToDate,
  loginMKSAP,
  formatSearchResults,
  getLoginStatus,
  type ScraperSearchResponse,
  type ScraperStatus,
} from '../services/medical-scrapers';

// Research source configuration
type ResearchSource = 'perplexity' | 'uptodate' | 'mksap' | 'pubmed' | 'all';

interface SourceConfig {
  id: ResearchSource;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  description: string;
  requiresLogin: boolean;
  requiresService: boolean;
}

const SOURCES: SourceConfig[] = [
  { 
    id: 'uptodate', 
    name: 'UpToDate', 
    shortName: 'UTD',
    icon: '📚', 
    color: 'orange',
    description: 'Gold standard clinical decision support',
    requiresLogin: true,
    requiresService: true,
  },
  { 
    id: 'mksap', 
    name: 'MKSAP 19', 
    shortName: 'MKSAP',
    icon: '🩺', 
    color: 'blue',
    description: 'Board-style content & questions',
    requiresLogin: true,
    requiresService: true,
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity AI', 
    shortName: 'PPLX',
    icon: '🔮', 
    color: 'purple',
    description: 'AI-powered medical search with citations',
    requiresLogin: false,
    requiresService: false,
  },
  { 
    id: 'pubmed', 
    name: 'PubMed', 
    shortName: 'PM',
    icon: '📄', 
    color: 'green',
    description: 'Primary literature search',
    requiresLogin: false,
    requiresService: true,
  },
  { 
    id: 'all', 
    name: 'All Sources', 
    shortName: 'ALL',
    icon: '🔥', 
    color: 'red',
    description: 'Aggregate search across all sources',
    requiresLogin: false,
    requiresService: true,
  },
];

type SearchType = 'evidence' | 'guidelines' | 'differential' | 'drug';

interface SearchResult {
  source: ResearchSource;
  content: string;
  keyPoints: string[];
  citations: string[];
  timestamp: number;
  error?: string;
}

interface DrSwisherResearchPanelProps {
  onInsertContent?: (content: string, citations: string[]) => void;
  onResearchComplete?: (results: SearchResult[]) => void;
  initialQuery?: string;
  compact?: boolean;
}

export const DrSwisherResearchPanel: React.FC<DrSwisherResearchPanelProps> = ({
  onInsertContent,
  onResearchComplete,
  initialQuery = '',
  compact = false,
}) => {
  // State
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('evidence');
  const [selectedSources, setSelectedSources] = useState<ResearchSource[]>(['uptodate', 'perplexity']);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<ResearchSource | null>(null);
  
  // Service status
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check scraper service on mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    const status = await checkScraperHealth();
    setScraperStatus(status);
  };

  // Toggle source selection
  const toggleSource = (source: ResearchSource) => {
    if (source === 'all') {
      setSelectedSources(['all']);
    } else {
      setSelectedSources(prev => {
        const filtered = prev.filter(s => s !== 'all');
        if (filtered.includes(source)) {
          return filtered.filter(s => s !== source);
        } else {
          return [...filtered, source];
        }
      });
    }
  };

  // Login to services
  const handleLogin = async (target: 'uptodate' | 'mksap') => {
    setIsLoggingIn(true);
    try {
      const success = target === 'uptodate' 
        ? await loginUpToDate() 
        : await loginMKSAP();
      if (success) {
        await checkServiceHealth();
      }
    } catch (error) {
      console.error(`Login to ${target} failed:`, error);
    }
    setIsLoggingIn(false);
  };

  // Main search function
  const handleSearch = async () => {
    if (!query.trim() || selectedSources.length === 0) return;
    
    setIsSearching(true);
    setResults([]);
    const newResults: SearchResult[] = [];

    const sourcesToSearch = selectedSources.includes('all') 
      ? ['uptodate', 'mksap', 'perplexity', 'pubmed'] as ResearchSource[]
      : selectedSources;

    // Search each source in parallel
    const searchPromises = sourcesToSearch.map(async (source) => {
      try {
        let result: SearchResult;
        
        switch (source) {
          case 'uptodate': {
            const res = await searchUpToDate(query);
            if (res) {
              const formatted = formatSearchResults(res);
              result = {
                source: 'uptodate',
                content: formatted.summary,
                keyPoints: formatted.keyPoints,
                citations: formatted.citations,
                timestamp: res.timestamp,
              };
            } else {
              throw new Error('UpToDate search returned no results');
            }
            break;
          }
          case 'mksap': {
            const res = await searchMKSAP(query);
            if (res) {
              const formatted = formatSearchResults(res);
              result = {
                source: 'mksap',
                content: formatted.summary,
                keyPoints: formatted.keyPoints,
                citations: formatted.citations,
                timestamp: res.timestamp,
              };
            } else {
              throw new Error('MKSAP search returned no results');
            }
            break;
          }
          case 'perplexity': {
            let res;
            switch (searchType) {
              case 'guidelines':
                res = await getLatestGuidelines(query);
                break;
              case 'differential':
                const ddx = await getDifferentialDiagnosis(query);
                res = {
                  summary: `Differential Diagnosis:\n${ddx.differentials.map((d, i) => 
                    `${i + 1}. ${d.diagnosis} (${d.likelihood})`
                  ).join('\n')}\n\nMust Not Miss:\n${ddx.mustNotMiss.join('\n')}\n\nWorkup:\n${ddx.workup.join('\n')}`,
                  keyPoints: ddx.differentials.map(d => d.diagnosis),
                  citations: ddx.citations,
                };
                break;
              case 'drug':
                const drug = await getDrugInfo(query);
                res = {
                  summary: `${query}\n\nMechanism: ${drug.mechanism}\n\nIndications:\n${drug.indications.join('\n')}\n\nDosing: ${drug.dosing}\n\nSide Effects:\n${drug.sideEffects.join('\n')}\n\nPearls:\n${drug.pearls.join('\n')}`,
                  keyPoints: drug.pearls,
                  citations: drug.citations,
                };
                break;
              default:
                res = await searchMedicalEvidence(query);
            }
            result = {
              source: 'perplexity',
              content: res.summary,
              keyPoints: res.keyPoints,
              citations: res.citations,
              timestamp: Date.now(),
            };
            break;
          }
          case 'pubmed': {
            const res = await searchPubMed(query);
            if (res) {
              const formatted = formatSearchResults(res);
              result = {
                source: 'pubmed',
                content: formatted.summary,
                keyPoints: formatted.keyPoints,
                citations: formatted.citations,
                timestamp: res.timestamp,
              };
            } else {
              throw new Error('PubMed search returned no results');
            }
            break;
          }
          default:
            throw new Error(`Unknown source: ${source}`);
        }
        
        return result!;
      } catch (error) {
        return {
          source,
          content: '',
          keyPoints: [],
          citations: [],
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Search failed',
        } as SearchResult;
      }
    });

    const searchResults = await Promise.all(searchPromises);
    setResults(searchResults);
    setIsSearching(false);

    // Expand first successful result
    const firstSuccess = searchResults.find(r => !r.error && r.content);
    if (firstSuccess) {
      setExpandedResult(firstSuccess.source);
    }

    // Callback
    if (onResearchComplete) {
      onResearchComplete(searchResults.filter(r => !r.error));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const insertResult = (result: SearchResult) => {
    if (onInsertContent) {
      onInsertContent(result.content, result.citations);
    }
  };

  // Get source status
  const getSourceStatus = (source: ResearchSource): 'ready' | 'needs-login' | 'service-down' | 'ready-no-service' => {
    const config = SOURCES.find(s => s.id === source);
    if (!config) return 'ready';
    
    if (!config.requiresService) return 'ready-no-service';
    if (!scraperStatus) return 'service-down';
    
    if (config.requiresLogin) {
      if (source === 'uptodate' && !scraperStatus.uptodate_logged_in) return 'needs-login';
      if (source === 'mksap' && !scraperStatus.mksap_logged_in) return 'needs-login';
    }
    
    return 'ready';
  };

  const getSourceColor = (source: ResearchSource): string => {
    const config = SOURCES.find(s => s.id === source);
    const colors: Record<string, string> = {
      orange: 'from-orange-500 to-amber-500',
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-pink-500',
      green: 'from-green-500 to-emerald-500',
      red: 'from-red-500 to-orange-500',
    };
    return colors[config?.color || 'purple'] || colors.purple;
  };

  return (
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${compact ? '' : 'max-w-3xl'}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <AcademicCapIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dr. Swisher Research</h3>
              <p className="text-xs text-zinc-500">Multi-source medical evidence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Service Status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
              scraperStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {scraperStatus ? (
                <><CheckCircleIcon className="w-3 h-3" /> Scraper Online</>
              ) : (
                <><ExclamationTriangleIcon className="w-3 h-3" /> Scraper Offline</>
              )}
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 mb-2">Login Status</div>
            <div className="flex gap-2">
              <button
                onClick={() => handleLogin('uptodate')}
                disabled={isLoggingIn || !scraperStatus}
                className={`flex-1 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-all ${
                  scraperStatus?.uptodate_logged_in
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                }`}
              >
                {isLoggingIn ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : '📚'}
                {scraperStatus?.uptodate_logged_in ? 'UpToDate ✓' : 'Login UpToDate'}
              </button>
              
              <button
                onClick={() => handleLogin('mksap')}
                disabled={isLoggingIn || !scraperStatus}
                className={`flex-1 px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-all ${
                  scraperStatus?.mksap_logged_in
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                }`}
              >
                {isLoggingIn ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : '🩺'}
                {scraperStatus?.mksap_logged_in ? 'MKSAP ✓' : 'Login MKSAP'}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-zinc-500">
              💡 Start scraper: <code className="px-1 py-0.5 bg-zinc-900 rounded">python3 studio/scraper/scraper_service.py</code>
            </div>
          </div>
        )}

        {/* Source Selection */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SOURCES.map((source) => {
            const isSelected = selectedSources.includes(source.id);
            const status = getSourceStatus(source.id);
            
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                disabled={status === 'service-down' && source.requiresService}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? `bg-gradient-to-r ${getSourceColor(source.id)} text-white border-transparent shadow-lg`
                    : status === 'service-down' || status === 'needs-login'
                    ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700 opacity-50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <span>{source.icon}</span>
                <span className="font-medium">{source.shortName}</span>
                {status === 'needs-login' && <span className="text-yellow-400">🔐</span>}
              </button>
            );
          })}
        </div>

        {/* Search Type */}
        <div className="flex gap-1 mb-3">
          {[
            { type: 'evidence' as SearchType, label: 'Evidence', icon: <BookOpenIcon className="w-3 h-3" /> },
            { type: 'guidelines' as SearchType, label: 'Guidelines', icon: <CheckBadgeIcon className="w-3 h-3" /> },
            { type: 'differential' as SearchType, label: 'DDx', icon: <BeakerIcon className="w-3 h-3" /> },
            { type: 'drug' as SearchType, label: 'Drug', icon: <DocumentTextIcon className="w-3 h-3" /> },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                searchType === type
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Hypertensive emergency management..."
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl
                       text-white text-sm placeholder-zinc-500 focus:outline-none
                       focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim() || selectedSources.length === 0}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2
                        transition-all ${
                          isSearching || !query.trim() || selectedSources.length === 0
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        }`}
          >
            {isSearching ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <BoltIcon className="w-4 h-4" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="divide-y divide-zinc-800">
          {results.map((result) => {
            const sourceConfig = SOURCES.find(s => s.id === result.source);
            const isExpanded = expandedResult === result.source;
            
            return (
              <div key={result.source} className={`${result.error ? 'opacity-50' : ''}`}>
                {/* Result Header */}
                <button
                  onClick={() => setExpandedResult(isExpanded ? null : result.source)}
                  className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getSourceColor(result.source)}/20`}>
                      <span className="text-lg">{sourceConfig?.icon}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {sourceConfig?.name}
                        {result.error ? (
                          <span className="text-xs text-red-400">Error</span>
                        ) : (
                          <span className="text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {result.error || `${result.keyPoints.length} key points • ${result.citations.length} citations`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!result.error && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(result.content);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                        {onInsertContent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              insertResult(result);
                            }}
                            className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/30"
                          >
                            Insert
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && !result.error && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Key Points */}
                    {result.keyPoints.length > 0 && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1.5">Key Points</div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.keyPoints.slice(0, 6).map((point, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${getSourceColor(result.source)}/10 text-zinc-300`}
                            >
                              {point.slice(0, 60)}{point.length > 60 ? '...' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-zinc-800/50 rounded-xl p-3 max-h-48 overflow-y-auto">
                      <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {result.content.slice(0, 1500)}{result.content.length > 1500 ? '...' : ''}
                      </pre>
                    </div>

                    {/* Citations */}
                    {result.citations.length > 0 && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Citations ({result.citations.length})</div>
                        <div className="text-xs text-zinc-400 max-h-20 overflow-y-auto space-y-0.5">
                          {result.citations.slice(0, 5).map((cite, i) => (
                            <div key={i} className="truncate">📎 {cite}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-zinc-400 text-sm mb-2">Ready to research</p>
          <p className="text-zinc-500 text-xs">
            Search UpToDate, MKSAP, Perplexity, and PubMed simultaneously
          </p>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="p-8 text-center">
          <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Searching {selectedSources.length} sources...</p>
          <div className="flex justify-center gap-2 mt-3">
            {selectedSources.map(source => {
              const config = SOURCES.find(s => s.id === source);
              return (
                <span key={source} className="text-lg animate-pulse">{config?.icon}</span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrSwisherResearchPanel;

/**
 * Research Panel - Quick medical research integration
 * Uses Perplexity for evidence search and fact-checking
 */
import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  BeakerIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  searchMedicalEvidence,
  getLatestGuidelines,
  getDifferentialDiagnosis,
  getDrugInfo,
  MedicalSearchResult,
} from '../services/perplexity';

interface ResearchPanelProps {
  onInsertContent?: (content: string) => void;
  initialQuery?: string;
}

type SearchType = 'evidence' | 'guidelines' | 'differential' | 'drug';

export const ResearchPanel: React.FC<ResearchPanelProps> = ({
  onInsertContent,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('evidence');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<MedicalSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTypes: { type: SearchType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: 'evidence', label: 'Evidence', icon: <BookOpenIcon className="w-4 h-4" />, placeholder: 'e.g., COPD exacerbation treatment' },
    { type: 'guidelines', label: 'Guidelines', icon: <CheckBadgeIcon className="w-4 h-4" />, placeholder: 'e.g., Heart failure management' },
    { type: 'differential', label: 'DDx', icon: <BeakerIcon className="w-4 h-4" />, placeholder: 'e.g., Acute chest pain, young male' },
    { type: 'drug', label: 'Drug', icon: <BeakerIcon className="w-4 h-4" />, placeholder: 'e.g., Metformin' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      let searchResult: MedicalSearchResult;
      
      switch (searchType) {
        case 'guidelines':
          searchResult = await getLatestGuidelines(query);
          break;
        case 'differential':
          const ddx = await getDifferentialDiagnosis(query);
          searchResult = {
            summary: `Differential Diagnosis for: ${query}\n\n` +
              ddx.differentials.map((d, i) => `${i + 1}. ${d.diagnosis} (${d.likelihood})`).join('\n') +
              `\n\nMust Not Miss:\n${ddx.mustNotMiss.join('\n')}\n\nWorkup:\n${ddx.workup.join('\n')}`,
            keyPoints: ddx.differentials.map(d => d.diagnosis),
            citations: ddx.citations,
          };
          break;
        case 'drug':
          const drug = await getDrugInfo(query);
          searchResult = {
            summary: `Drug Information: ${query}\n\n` +
              `Mechanism: ${drug.mechanism}\n\n` +
              `Indications:\n${drug.indications.map(i => `• ${i}`).join('\n')}\n\n` +
              `Dosing: ${drug.dosing}\n\n` +
              `Side Effects:\n${drug.sideEffects.map(s => `• ${s}`).join('\n')}\n\n` +
              `Interactions:\n${drug.interactions.map(i => `• ${i}`).join('\n')}\n\n` +
              `Pearls:\n${drug.pearls.map(p => `• ${p}`).join('\n')}`,
            keyPoints: drug.pearls,
            citations: drug.citations,
          };
          break;
        case 'evidence':
        default:
          searchResult = await searchMedicalEvidence(query);
      }
      
      setResult(searchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
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

  const insertContent = () => {
    if (result && onInsertContent) {
      onInsertContent(result.summary);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-medium text-white">Medical Research</span>
        </div>
        
        {/* Search Type Tabs */}
        <div className="flex gap-1">
          {searchTypes.map(({ type, label, icon }) => (
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
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchTypes.find(s => s.type === searchType)?.placeholder}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                       text-white text-sm placeholder-zinc-500 focus:outline-none
                       focus:border-cyan-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1
                        transition-all ${
                          isSearching || !query.trim()
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-cyan-500 text-white hover:bg-cyan-600'
                        }`}
          >
            {isSearching ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="px-3 pb-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {result && (
        <div className="px-3 pb-3 space-y-3">
          {/* Summary */}
          <div className="bg-zinc-800/50 rounded-lg p-3 max-h-64 overflow-y-auto">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">
              {result.summary}
            </pre>
          </div>

          {/* Key Points */}
          {result.keyPoints.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Key Points</div>
              <div className="flex flex-wrap gap-1">
                {result.keyPoints.slice(0, 5).map((point, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded"
                  >
                    {point.slice(0, 50)}{point.length > 50 ? '...' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          {result.citations.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Citations ({result.citations.length})</div>
              <div className="text-xs text-zinc-400 max-h-20 overflow-y-auto">
                {result.citations.slice(0, 3).map((cite, i) => (
                  <div key={i} className="truncate">{cite}</div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(result.summary)}
              className="flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 
                         text-zinc-300 text-xs rounded-lg flex items-center justify-center gap-1"
            >
              <ClipboardDocumentIcon className="w-3 h-3" />
              Copy
            </button>
            {onInsertContent && (
              <button
                onClick={insertContent}
                className="flex-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 
                           text-cyan-400 text-xs rounded-lg flex items-center justify-center gap-1"
              >
                Insert into Lecture
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchPanel;

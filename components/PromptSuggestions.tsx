/**
 * AI-Generated Prompt Suggestions Component
 *
 * Replaces boring static prompts with fresh AI-generated creative medical topics
 */

import React, { useState, useEffect } from 'react';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { promptSuggestions, type SuggestionPrompt } from '../services/prompt-suggestions';
import type { AIProvider } from '../services/ai-provider';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  provider?: AIProvider;
  compact?: boolean;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  provider = 'glm',
  compact = false,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const newSuggestions = await promptSuggestions.generateSuggestions(provider, 6);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [provider]);

  const handleRefresh = () => {
    promptSuggestions.clearCache();
    loadSuggestions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-sm text-zinc-400">Generating creative prompts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button
          onClick={handleRefresh}
          className="text-xs text-cyan-400 hover:text-cyan-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-cyan-400" />
            AI Suggestions
          </h4>
          <button
            onClick={handleRefresh}
            className="p-1 text-zinc-500 hover:text-cyan-400 transition-colors"
            title="Refresh suggestions"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion.text)}
              className="group text-left px-3 py-2 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-lg transition-all text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-300 group-hover:text-white line-clamp-2">
                    {suggestion.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500 capitalize">
                      {suggestion.category}
                    </span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">
                      ~{suggestion.estimatedSlides} slides
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          AI-Generated Suggestions
        </h3>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-cyan-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.text)}
            className="group text-left p-4 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{suggestion.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 group-hover:text-white mb-2 line-clamp-3">
                  {suggestion.text}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-zinc-500 capitalize">
                    {suggestion.category}
                  </span>
                  <span className="text-xs text-zinc-600">
                    ~{suggestion.estimatedSlides} slides
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-zinc-500 text-center">
          Powered by AI • Suggestions refresh every 5 minutes
        </p>
      </div>
    </div>
  );
};

export default PromptSuggestions;

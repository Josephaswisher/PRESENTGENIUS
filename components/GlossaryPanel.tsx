/**
 * Glossary Panel - Interactive panel showing key medical terms and definitions
 * Auto-generated from content analysis
 */

import React, { useState, useMemo } from 'react';
import { KeyConcept } from '../services/content-analyzer';

interface GlossaryPanelProps {
  keyTerms: KeyConcept[];
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS = {
  disease: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  drug: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  procedure: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  anatomy: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  symptom: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  test: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  general: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
};

export function GlossaryPanel({ keyTerms, isOpen, onClose }: GlossaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTerms = useMemo(() => {
    return keyTerms.filter((term) => {
      const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [keyTerms, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: keyTerms.length,
      disease: 0,
      drug: 0,
      procedure: 0,
      anatomy: 0,
      symptom: 0,
      test: 0,
      general: 0,
    };

    keyTerms.forEach((term) => {
      counts[term.category]++;
    });

    return counts;
  }, [keyTerms]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>📖</span>
                Medical Glossary
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                {filteredTerms.length} of {keyTerms.length} terms
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close glossary"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <svg
              className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({categoryCounts.all})
            </button>
            {Object.entries(categoryCounts)
              .filter(([cat]) => cat !== 'all')
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => {
                if (count === 0) return null;
                const colors = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      selectedCategory === category
                        ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">No terms found matching your search</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTerms.map((term, index) => {
                const colors = CATEGORY_COLORS[term.category];
                return (
                  <div
                    key={`${term.term}-${index}`}
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 transition-all hover:shadow-lg hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-bold ${colors.text}`}>{term.term}</h3>
                          <span className={`px-3 py-1 ${colors.bg} ${colors.text} border ${colors.border} rounded-full text-xs font-semibold uppercase`}>
                            {term.category}
                          </span>
                        </div>
                        {term.definition && (
                          <p className="text-gray-700 text-sm leading-relaxed mb-3">{term.definition}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>First mentioned: Slide {term.firstMentionSlideIndex + 1}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>{term.occurrences.length} occurrences</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">💡 Tip:</span>
              <span>Hover over highlighted terms in the presentation for quick definitions</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FormatPicker Component
 * Visual cards grid for selecting output formats
 */

import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { FormatCard } from './FormatCard';
import { FormatPickerProps, FormatOption, FormatCategory, CATEGORY_INFO } from './types';

// All available formats
const ALL_FORMATS: FormatOption[] = [
  // Primary Formats
  {
    id: 'slides',
    name: 'Slide Presentation',
    icon: '📽️',
    description: 'Traditional slide-by-slide format with progressive reveal',
    category: 'primary',
    previewThumbnail: '/templates/new-formats/presentation-standard/preview.svg',
    subOptions: [
      { id: 'slides-standard', label: 'Standard (Title + Content)', default: true },
      { id: 'slides-visual', label: 'Visual Heavy (Image-first)' },
      { id: 'slides-dense', label: 'Dense (Max content per slide)' },
      { id: 'slides-reveal', label: 'Progressive Reveal' },
    ],
  },
  {
    id: 'canvas',
    name: 'Canvas / Freeform',
    icon: '🎨',
    description: 'Infinite canvas with zoomable nodes',
    category: 'primary',
    subOptions: [
      { id: 'canvas-mindmap', label: 'Mind Map Layout', default: true },
      { id: 'canvas-flowchart', label: 'Flowchart/Process' },
      { id: 'canvas-radial', label: 'Radial/Spoke Layout' },
      { id: 'canvas-timeline', label: 'Timeline/Linear Flow' },
    ],
  },
  {
    id: 'interactive',
    name: 'Interactive Module',
    icon: '🎮',
    description: 'Click-through with branching logic',
    category: 'interactive',
    subOptions: [
      { id: 'interactive-case', label: 'Case-Based (Clinical Decision)', default: true },
      { id: 'interactive-sim', label: 'Simulation/Scenario' },
      { id: 'interactive-explore', label: 'Exploratory (Non-linear)' },
      { id: 'interactive-guided', label: 'Guided Tour' },
    ],
  },
  {
    id: 'document',
    name: 'Long-Form Document',
    icon: '📄',
    description: 'Scrollable article or report format',
    category: 'primary',
    subOptions: [
      { id: 'doc-article', label: 'Article/Blog Style', default: true },
      { id: 'doc-textbook', label: 'Textbook Chapter' },
      { id: 'doc-protocol', label: 'Protocol/Guidelines' },
      { id: 'doc-review', label: 'Literature Review' },
    ],
  },

  // Assessment Formats
  {
    id: 'board-mcq',
    name: 'Board-Style MCQ',
    icon: '🅰️',
    description: 'USMLE-format vignette with 5 options',
    category: 'assessment',
    previewThumbnail: '/templates/assessment/board-mcq/preview.svg',
  },
  {
    id: 'quiz',
    name: 'Assessment Quiz',
    icon: '❓',
    description: 'MCQs, T/F, matching questions',
    category: 'assessment',
    subOptions: [
      { id: 'quiz-board', label: 'Board-Style (Vignettes)', default: true },
      { id: 'quiz-rapid', label: 'Rapid Fire (Quick recall)' },
      { id: 'quiz-applied', label: 'Applied/Clinical' },
    ],
  },

  // New Formats
  {
    id: 'infographic',
    name: 'Medical Infographic',
    icon: '📊',
    description: 'Visual single-page summary with stats and icons',
    category: 'new-formats',
    previewThumbnail: '/templates/new-formats/infographic/preview.svg',
  },
  {
    id: 'journal-club',
    name: 'Journal Club',
    icon: '📚',
    description: 'PICO framework with critical appraisal',
    category: 'new-formats',
    previewThumbnail: '/templates/new-formats/journal-club/preview.svg',
  },
  {
    id: 'diagnosis-mannequin',
    name: 'Diagnosis Mannequin',
    icon: '🧍',
    description: 'Interactive body diagram with clickable exam regions',
    category: 'new-formats',
    previewThumbnail: '/templates/new-formats/diagnosis-mannequin/preview.svg',
  },
  {
    id: 'chief-complaint-approach',
    name: 'Chief Complaint Approach',
    icon: '🩺',
    description: 'Algorithmic symptom workup with differential',
    category: 'new-formats',
    previewThumbnail: '/templates/new-formats/chief-complaint-approach/preview.svg',
  },

  // Supplementary Formats
  {
    id: 'handout',
    name: 'Quick Reference Card',
    icon: '📋',
    description: 'Dense, printable 1-2 page summary',
    category: 'supplementary',
  },
  {
    id: 'flashcards',
    name: 'Flashcard Deck',
    icon: '🗂️',
    description: 'Spaced repetition ready',
    category: 'supplementary',
  },
  {
    id: 'speaker-notes',
    name: 'Speaker Notes',
    icon: '🎤',
    description: 'Talking points and delivery cues',
    category: 'supplementary',
  },
];

export const FormatPicker: React.FC<FormatPickerProps> = ({
  selectedFormats,
  onToggleFormat,
  selectedSubOptions,
  onSubOptionChange,
  disabled = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FormatCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter formats based on search and category
  const filteredFormats = useMemo(() => {
    let formats = ALL_FORMATS;

    // Filter by category
    if (activeCategory !== 'all') {
      formats = formats.filter(f => f.category === activeCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      formats = formats.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
    }

    return formats;
  }, [activeCategory, searchQuery]);

  // Group formats by category for display
  const formatsByCategory = useMemo(() => {
    const groups: Record<string, FormatOption[]> = {};
    filteredFormats.forEach(format => {
      if (!groups[format.category]) {
        groups[format.category] = [];
      }
      groups[format.category].push(format);
    });
    return groups;
  }, [filteredFormats]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search formats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                       text-sm text-white placeholder:text-zinc-500 focus:outline-none
                       focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
            ${activeCategory === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }
          `}
        >
          All Formats
        </button>
        {CATEGORY_INFO.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
              ${activeCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }
              ${cat.id === 'new-formats' ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30' : ''}
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {selectedFormats.size} format{selectedFormats.size !== 1 ? 's' : ''} selected
        </span>
        {selectedFormats.size > 0 && (
          <button
            onClick={() => selectedFormats.forEach(f => onToggleFormat(f))}
            className="text-zinc-400 hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Formats Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFormats.map((format) => (
            <FormatCard
              key={format.id}
              format={format}
              isSelected={selectedFormats.has(format.id)}
              onToggle={() => onToggleFormat(format.id)}
              selectedSubOption={selectedSubOptions[format.id]}
              onSubOptionChange={(subId) => onSubOptionChange(format.id, subId)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFormats.map((format) => (
            <div
              key={format.id}
              onClick={() => !disabled && onToggleFormat(format.id)}
              className={`
                flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all
                ${selectedFormats.has(format.id)
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : 'bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-2xl">{format.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm text-white">{format.name}</div>
                <div className="text-xs text-zinc-500">{format.description}</div>
              </div>
              {selectedFormats.has(format.id) && (
                <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredFormats.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No formats found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default FormatPicker;

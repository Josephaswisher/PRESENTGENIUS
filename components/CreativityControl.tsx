/**
 * Creativity Control Component
 *
 * UI controls for creativity settings and layout preferences
 */

import React from 'react';
import { SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { CreativityLevel, LayoutType } from '../types/creative-layouts';

interface CreativityControlProps {
  level: CreativityLevel;
  layoutVariety: boolean;
  autoLayoutSelection: boolean;
  onLevelChange: (level: CreativityLevel) => void;
  onLayoutVarietyChange: (enabled: boolean) => void;
  onAutoSelectionChange: (enabled: boolean) => void;
  compact?: boolean;
}

export const CreativityControl: React.FC<CreativityControlProps> = ({
  level,
  layoutVariety,
  autoLayoutSelection,
  onLevelChange,
  onLayoutVarietyChange,
  onAutoSelectionChange,
  compact = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const creativityLevels: { value: CreativityLevel; label: string; icon: string; description: string }[] = [
    {
      value: 'standard',
      label: 'Standard',
      icon: '📄',
      description: 'Traditional rectangle slides only',
    },
    {
      value: 'mixed',
      label: 'Mixed',
      icon: '🎨',
      description: '70% standard, 30% creative layouts',
    },
    {
      value: 'creative',
      label: 'Creative',
      icon: '✨',
      description: '30% standard, 70% creative layouts',
    },
    {
      value: 'experimental',
      label: 'Experimental',
      icon: '🚀',
      description: '100% creative - maximum variety',
    },
  ];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-300 transition-all"
          title="Creativity Settings"
        >
          <SparklesIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{creativityLevels.find(l => l.value === level)?.icon} {level}</span>
          <AdjustmentsHorizontalIcon className="w-3 h-3" />
        </button>

        {expanded && (
          <div className="absolute top-full mt-2 right-0 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                Creativity
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Creativity Level */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-zinc-400 block">Layout Style</label>
              <div className="grid grid-cols-2 gap-2">
                {creativityLevels.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      onLevelChange(value);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      level === value
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={creativityLevels.find(l => l.value === value)?.description}
                  >
                    <span className="mr-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                {creativityLevels.find(l => l.value === level)?.description}
              </p>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-zinc-300">AI Layout Selection</span>
                <input
                  type="checkbox"
                  checked={autoLayoutSelection}
                  onChange={(e) => onAutoSelectionChange(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
              </label>
              <p className="text-[10px] text-zinc-500 ml-0">
                AI analyzes content to choose best layout
              </p>

              <label className="flex items-center justify-between cursor-pointer mt-2">
                <span className="text-xs text-zinc-300">Layout Variety</span>
                <input
                  type="checkbox"
                  checked={layoutVariety}
                  onChange={(e) => onLayoutVarietyChange(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
              </label>
              <p className="text-[10px] text-zinc-500 ml-0">
                Prevent repetitive layouts across slides
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full-width version for settings panel
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-cyan-400" />
        <h3 className="text-base font-bold text-white">Creativity & Layouts</h3>
      </div>

      {/* Creativity Level */}
      <div className="mb-6">
        <label className="text-sm text-zinc-300 block mb-3">Layout Style</label>
        <div className="grid grid-cols-2 gap-3">
          {creativityLevels.map(({ value, label, icon, description }) => (
            <button
              key={value}
              onClick={() => onLevelChange(value)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                level === value
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 border-2 border-cyan-400'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border-2 border-transparent'
              }`}
              title={description}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div>{label}</div>
              <div className="text-[10px] opacity-70 mt-1">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <label className="flex items-start justify-between cursor-pointer group">
          <div>
            <div className="text-sm text-zinc-300 group-hover:text-white transition-colors">
              AI Layout Selection
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              AI analyzes content to choose best layout (timelines→slider, comparisons→split-screen)
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoLayoutSelection}
            onChange={(e) => onAutoSelectionChange(e.target.checked)}
            className="mt-1 w-5 h-5 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
        </label>

        <label className="flex items-start justify-between cursor-pointer group">
          <div>
            <div className="text-sm text-zinc-300 group-hover:text-white transition-colors">
              Layout Variety Enforcement
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Prevent repetitive layouts across consecutive slides for more dynamic presentations
            </div>
          </div>
          <input
            type="checkbox"
            checked={layoutVariety}
            onChange={(e) => onLayoutVarietyChange(e.target.checked)}
            className="mt-1 w-5 h-5 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
        </label>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <div className="text-sm font-medium text-cyan-300 mb-1">Creative Layouts</div>
            <div className="text-xs text-zinc-400 leading-relaxed">
              Choose from 10+ stunning layouts: horizontal sliders, radial arrangements, split-screens,
              card stacks, masonry grids, parallax effects, and more. AI automatically selects the best
              layout based on your content, or manually control creativity level.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativityControl;

/**
 * Compact Lecture Setup - Streamlined single-panel configuration
 * Designed for quick input with minimal UI overhead
 */
import React, { useState } from 'react';
import {
  ClockIcon,
  SparklesIcon,
  PrinterIcon,
  ChevronDownIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import {
  LectureTheme,
  ColorScheme,
  COLOR_SCHEMES,
  VISUAL_METAPHORS,
  DURATION_PRESETS,
  PRINTABLE_TYPES,
  PrintableConfig,
} from '../../types/lecture';

interface CompactLectureSetupProps {
  onGenerate: (config: LectureConfig) => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export interface LectureConfig {
  topic: string;
  durationPreset: string;
  customMinutes?: number;
  customSlides?: number;
  metaphor?: string;
  colorScheme: string;
  printables: string[];
  prompt: string;
}

export const CompactLectureSetup: React.FC<CompactLectureSetupProps> = ({
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [topic, setTopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('conference');
  const [metaphor, setMetaphor] = useState('none');
  const [colorScheme, setColorScheme] = useState('clinical-blue');
  const [printables, setPrintables] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const preset = DURATION_PRESETS.find(p => p.id === duration)!;
  const scheme = COLOR_SCHEMES.find(s => s.id === colorScheme)!;

  const togglePrintable = (type: string) => {
    setPrintables(prev => 
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const handleGenerate = () => {
    onGenerate({
      topic,
      durationPreset: duration,
      metaphor: metaphor !== 'none' ? metaphor : undefined,
      colorScheme,
      printables,
      prompt,
    });
  };

  const canGenerate = topic.trim().length > 0 || prompt.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Main Input - Topic */}
      <div className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Lecture topic (e.g., COPD Exacerbation Management)"
          disabled={disabled || isGenerating}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl
                     text-white text-lg placeholder-zinc-500 focus:outline-none 
                     focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
          autoFocus
        />
      </div>

      {/* Quick Settings Row */}
      <div className="flex flex-wrap gap-2">
        {/* Duration Dropdown */}
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={disabled || isGenerating}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                     text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          {DURATION_PRESETS.filter(p => p.id !== 'custom').map(p => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.durationMinutes}min / {p.defaultSlides} slides
            </option>
          ))}
        </select>

        {/* Color Scheme Quick Pick */}
        <div className="flex gap-1 items-center px-2 bg-zinc-800 border border-zinc-700 rounded-lg">
          {COLOR_SCHEMES.slice(0, 5).map(s => (
            <button
              key={s.id}
              onClick={() => setColorScheme(s.id)}
              disabled={disabled || isGenerating}
              className={`w-5 h-5 rounded-full transition-all ${
                colorScheme === s.id ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-800 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: s.primary }}
              title={s.name}
            />
          ))}
        </div>

        {/* Metaphor Quick Pick */}
        <select
          value={metaphor}
          onChange={(e) => setMetaphor(e.target.value)}
          disabled={disabled || isGenerating}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                     text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="none">No metaphor</option>
          {VISUAL_METAPHORS.filter(m => m.id !== 'none').map(m => (
            <option key={m.id} value={m.id}>
              {m.icon} {m.name}
            </option>
          ))}
        </select>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all ${
            showAdvanced ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <span>More</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced Options (Collapsible) */}
      {showAdvanced && (
        <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-3">
          {/* Additional Prompt */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Additional instructions (optional)..."
            disabled={disabled || isGenerating}
            rows={2}
            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg
                       text-white text-sm placeholder-zinc-500 resize-none
                       focus:outline-none focus:border-cyan-500"
          />

          {/* Printables - Compact Pills */}
          <div>
            <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
              <PrinterIcon className="w-3 h-3" /> Generate printables:
            </div>
            <div className="flex flex-wrap gap-1">
              {PRINTABLE_TYPES.map(p => (
                <button
                  key={p.type}
                  onClick={() => togglePrintable(p.type)}
                  disabled={disabled || isGenerating}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    printables.includes(p.type)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-zinc-700/50 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  {p.icon} {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || disabled || isGenerating}
        className={`w-full py-3 rounded-xl font-medium text-lg flex items-center justify-center gap-2
                    transition-all ${
                      canGenerate && !isGenerating
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <PlayIcon className="w-5 h-5" />
            Generate {preset.defaultSlides}-Slide Lecture
          </>
        )}
      </button>

      {/* Quick Stats Footer */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span>{preset.icon} {preset.durationMinutes} min</span>
        <span>•</span>
        <span>{preset.defaultSlides} slides</span>
        {printables.length > 0 && (
          <>
            <span>•</span>
            <span className="text-cyan-400">+{printables.length} printables</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CompactLectureSetup;

/**
 * Compact Input - Minimal, fast lecture creation interface
 * Single text area with smart defaults and quick toggles
 */
import React, { useState, useRef } from 'react';
import {
  PlayIcon,
  PaperClipIcon,
  Cog6ToothIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AIProvider, PROVIDERS } from '../services/ai-provider';
import { DURATION_PRESETS, COLOR_SCHEMES, PRINTABLE_TYPES } from '../types/lecture';

interface CompactInputProps {
  onGenerate: (config: GenerateConfig) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export interface GenerateConfig {
  prompt: string;
  files: File[];
  duration: string;
  slideCount: number;
  colorScheme: string;
  printables: string[];
  provider: AIProvider;
}

export const CompactInput: React.FC<CompactInputProps> = ({
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [duration, setDuration] = useState('conference');
  const [colorScheme, setColorScheme] = useState('clinical-blue');
  const [printables, setPrintables] = useState<string[]>([]);
  const [provider, setProvider] = useState<AIProvider>('openrouter');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const preset = DURATION_PRESETS.find(p => p.id === duration)!;

  const handleSubmit = () => {
    if (!prompt.trim() && files.length === 0) return;
    onGenerate({
      prompt,
      files,
      duration,
      slideCount: preset.defaultSlides,
      colorScheme,
      printables,
      provider,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const togglePrintable = (type: string) => {
    setPrintables(prev =>
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const canSubmit = (prompt.trim() || files.length > 0) && !isGenerating && !disabled;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Input Card */}
      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Text Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to teach? (e.g., COPD exacerbation for residents)"
            disabled={isGenerating || disabled}
            rows={2}
            className="w-full px-4 py-4 bg-transparent text-white placeholder-zinc-500
                       resize-none focus:outline-none text-lg leading-relaxed"
          />
        </div>

        {/* Files Preview */}
        {files.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-300">
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-zinc-500 hover:text-white">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/50">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating || disabled}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf"
            className="hidden"
          />

          {/* Duration Quick Select */}
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isGenerating || disabled}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs
                       text-zinc-300 focus:outline-none cursor-pointer hover:border-zinc-600"
          >
            {DURATION_PRESETS.filter(p => p.id !== 'custom').map(p => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>

          {/* AI Provider Toggle */}
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                disabled={isGenerating || disabled}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  provider === p.id
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
                title={p.name}
              >
                {p.icon}
              </button>
            ))}
          </div>

          {/* Options Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 rounded-lg transition-colors ${
              showOptions ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="More options"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isGenerating ? 'Generating...' : `${preset.defaultSlides} Slides`}
            </span>
          </button>
        </div>

        {/* Expanded Options */}
        {showOptions && (
          <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-950/50 space-y-3">
            {/* Color Scheme */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-16">Colors</span>
              <div className="flex gap-1">
                {COLOR_SCHEMES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setColorScheme(s.id)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      colorScheme === s.id ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: s.primary }}
                    title={s.name}
                  />
                ))}
              </div>
            </div>

            {/* Printables */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-16">Print</span>
              <div className="flex flex-wrap gap-1">
                {PRINTABLE_TYPES.map(p => (
                  <button
                    key={p.type}
                    onClick={() => togglePrintable(p.type)}
                    className={`px-2 py-0.5 rounded text-xs transition-all ${
                      printables.includes(p.type)
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {p.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-2 text-xs text-zinc-600">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">⌘</kbd>
        <span className="mx-1">+</span>
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd>
        <span className="ml-2">to generate</span>
      </div>
    </div>
  );
};

export default CompactInput;

/**
 * Centered Input Component - AI Studio Style
 * Clean, focused prompt interface with minimal distractions
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  PhotoIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { AIProvider, PROVIDERS } from '../services/ai-provider';
import { promptSuggestions, type SuggestionPrompt } from '../services/prompt-suggestions';

interface CenteredInputProps {
  onGenerate: (prompt: string, files: File[], provider: AIProvider, modelId?: string, useParallel?: boolean) => void;
  isGenerating: boolean;
}

export const CenteredInput: React.FC<CenteredInputProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [provider, setProvider] = useState<AIProvider>('auto'); // Auto-select best provider
  const [modelId, setModelId] = useState<string>('gemini-3.0-flash');
  const [useParallel, setUseParallel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<SuggestionPrompt[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Get available models for the current provider
  const availableModels = PROVIDERS[provider]?.models || [];
  const providerInfo = PROVIDERS[provider] || PROVIDERS[0];

  // Handle provider change and auto-select first model
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const firstModel = PROVIDERS[newProvider]?.models?.[0];
    if (firstModel) {
      setModelId(firstModel.id);
    } else {
      // For auto and dual which don't have sub-models
      setModelId(newProvider);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() && files.length === 0) return;
    onGenerate(prompt, files, provider, modelId, useParallel);
    setPrompt('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) setFiles(prev => [...prev, file]);
      });
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }
  }, [prompt]);

  // Load intelligent suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const newSuggestions = await promptSuggestions.generateSuggestions(provider, 6);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      // Keep existing suggestions or show fallback
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleRefreshSuggestions = () => {
    promptSuggestions.clearCache();
    loadSuggestions();
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-20 pb-48 snap-start snap-always">
      {/* Logo/Title */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight">
          PresentGenius
        </h1>
        <p className="text-zinc-400 text-lg">
          Create medical presentations with AI
        </p>
      </div>

      {/* Input Container */}
      <div className="w-full max-w-3xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        {/* Main Input Box */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

          <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden">
            {/* File Attachments */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 pb-0">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <PaperClipIcon className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className="text-zinc-300 max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 p-0.5 hover:bg-zinc-700 rounded transition"
                    >
                      <XMarkIcon className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Describe your medical presentation..."
              disabled={isGenerating}
              className="w-full px-6 py-5 bg-transparent text-white placeholder-zinc-500
                       resize-none outline-none text-lg font-light
                       disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '60px' }}
            />

            {/* Bottom Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 pb-4 pt-2 border-t border-zinc-800/50 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white disabled:opacity-50"
                  title="Attach files"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>

                {/* AI Provider Selector */}
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-all">
                  <label htmlFor="provider-select" className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                    Provider:
                  </label>
                  <select
                    id="provider-select"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                    disabled={isGenerating}
                    className="bg-transparent text-sm text-white font-medium outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={isGenerating ? "Cannot change provider during generation" : "Select AI Provider"}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selector */}
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-all">
                  <label htmlFor="model-select" className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                    Model:
                  </label>
                  <select
                    id="model-select"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    disabled={isGenerating}
                    className="bg-transparent text-sm text-white font-medium outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={isGenerating ? "Cannot change model during generation" : `Select ${providerInfo.name} Model`}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id} className="bg-zinc-900 text-white">
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Parallel Generation Toggle */}
                <button
                  onClick={() => setUseParallel(!useParallel)}
                  disabled={isGenerating}
                  className={`px-3 py-2 border rounded-lg text-xs font-medium transition-all duration-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap
                           ${useParallel
                             ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
                             : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'
                           }`}
                  title={`${useParallel ? 'Disable' : 'Enable'} 5-agent parallel generation (1 Architect + 4 Builders)`}
                >
                  <span className={`text-sm transition-transform duration-300 ${useParallel ? 'scale-110' : ''}`}>⚡</span>
                  <span>Parallel {useParallel ? 'ON' : 'OFF'}</span>
                  {useParallel && <span className="text-[10px] opacity-70">(5x)</span>}
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isGenerating || (!prompt.trim() && files.length === 0)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500
                         text-white rounded-xl font-medium transition-all
                         hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <ArrowUpIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-4 text-center text-sm text-zinc-500">
          Press <kbd className="px-2 py-1 bg-zinc-800/50 rounded text-xs">⌘</kbd> + <kbd className="px-2 py-1 bg-zinc-800/50 rounded text-xs">Enter</kbd> to generate
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Scroll Indicator */}
      <div className="mt-6 flex flex-col items-center animate-bounce-subtle opacity-50">
        <p className="text-xs text-zinc-600 mb-1">Scroll for more</p>
        <ChevronDownIcon className="w-4 h-4 text-zinc-600" />
      </div>

      {/* Intelligent Suggestions */}
      <div className="mt-8 max-w-3xl w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center justify-center gap-3 mb-4">
          <p className="text-xs text-zinc-500">AI-generated suggestions</p>
          <button
            onClick={handleRefreshSuggestions}
            disabled={loadingSuggestions || isGenerating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate new suggestions with AI"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 text-zinc-400 ${loadingSuggestions ? 'animate-spin' : ''}`} />
            <span className="text-zinc-400">Refresh</span>
          </button>
        </div>

        {loadingSuggestions && suggestions.length === 0 ? (
          <div className="flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 px-4 py-2 bg-zinc-900/30 border border-zinc-800/30 rounded-xl animate-pulse"
                style={{ width: `${120 + Math.random() * 80}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => setPrompt(suggestion.text)}
                disabled={isGenerating}
                className="group relative px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-left
                         hover:bg-zinc-900 hover:border-zinc-700 transition-all disabled:opacity-50
                         overflow-hidden"
              >
                {/* Category Icon */}
                <div className="absolute top-2 right-2 text-lg opacity-30 group-hover:opacity-50 transition-opacity">
                  {suggestion.icon}
                </div>

                {/* Suggestion Text */}
                <div className="pr-8">
                  <p className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">
                    {suggestion.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
                      {suggestion.category.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-700">•</span>
                    <span className="text-[10px] text-zinc-600">
                      ~{suggestion.estimatedSlides} slides
                    </span>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/20 rounded-xl transition-colors pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

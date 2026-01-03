/**
 * LectureBuilder - Clean, focused lecture creation interface
 * Prompt is the hero, everything else is secondary
 */
import React, { useState, useRef } from 'react';
import {
  SparklesIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ClockIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { AIProvider, PROVIDERS, GenerationOptions } from '../services/ai-provider';

interface LectureBuilderProps {
  onGenerate: (prompt: string, files: File[], options: GenerationOptions, provider?: AIProvider) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

// Quick template suggestions
const QUICK_STARTERS = [
  { label: 'Chalk Talk', prompt: 'Create an interactive chalk talk on ' },
  { label: 'Case-Based', prompt: 'Create a case-based learning session on ' },
  { label: 'Board Review', prompt: 'Create a high-yield board review on ' },
  { label: 'Procedure Guide', prompt: 'Create a step-by-step procedure guide for ' },
  { label: 'Morning Report', prompt: 'Create a morning report case presentation on ' },
  { label: 'Patient Education', prompt: 'Create patient-friendly education materials about ' },
];

const AUDIENCES = [
  { id: 'students', label: 'Medical Students', icon: '📚' },
  { id: 'residents', label: 'Residents', icon: '🩺' },
  { id: 'fellows', label: 'Fellows', icon: '🔬' },
  { id: 'attendings', label: 'Attendings', icon: '👨‍⚕️' },
  { id: 'nurses', label: 'Nursing Staff', icon: '💉' },
  { id: 'patients', label: 'Patients', icon: '❤️' },
];

const DURATIONS = [
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '90 min' },
];

export const LectureBuilder: React.FC<LectureBuilderProps> = ({
  onGenerate,
  isGenerating,
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [audience, setAudience] = useState('residents');
  const [duration, setDuration] = useState(30);
  const [provider, setProvider] = useState<AIProvider>('openrouter');
  const [showOptions, setShowOptions] = useState(false);
  const [slideCount, setSlideCount] = useState<number | ''>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles = Array.from(newFiles).filter(file =>
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const applyStarter = (starterPrompt: string) => {
    setPrompt(starterPrompt);
    textareaRef.current?.focus();
    // Move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.value.length;
      }
    }, 0);
  };

  const buildFinalPrompt = () => {
    const audienceInfo = AUDIENCES.find(a => a.id === audience);
    let finalPrompt = prompt;
    
    if (audienceInfo) {
      finalPrompt += `\n\nTarget Audience: ${audienceInfo.label}`;
    }
    finalPrompt += `\nDuration: ${duration} minutes`;
    if (slideCount) {
      finalPrompt += `\nTarget Slides: approximately ${slideCount}`;
    }
    
    return finalPrompt;
  };

  const handleSubmit = () => {
    if (!prompt.trim() && files.length === 0) return;
    onGenerate(buildFinalPrompt(), files, {}, provider);
    setPrompt('');
    setFiles([]);
  };

  const canSubmit = (prompt.trim() || files.length > 0) && !isGenerating && !disabled;

  const currentProvider = PROVIDERS.find(p => p.id === provider);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-700/50 overflow-hidden">
        
        {/* Main Prompt Area - THE HERO */}
        <div className="p-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            What do you want to create?
          </label>
          
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your lecture, presentation, or learning module..."
            className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white 
                       placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 
                       focus:ring-cyan-500/20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey && canSubmit) {
                handleSubmit();
              }
            }}
          />
          
          {/* Quick Starters */}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_STARTERS.map((starter) => (
              <button
                key={starter.label}
                onClick={() => applyStarter(starter.prompt)}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 
                           hover:border-zinc-600 rounded-lg text-zinc-400 hover:text-white transition-all"
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Options Bar */}
        <div className="px-6 py-3 bg-zinc-800/50 border-t border-zinc-800 flex items-center gap-4 flex-wrap">
          {/* Audience Dropdown */}
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-4 h-4 text-zinc-500" />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white 
                         focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {AUDIENCES.map((aud) => (
                <option key={aud.id} value={aud.id}>
                  {aud.icon} {aud.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Dropdown */}
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-zinc-500" />
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white 
                         focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {DURATIONS.map((dur) => (
                <option key={dur.value} value={dur.value}>{dur.label}</option>
              ))}
            </select>
          </div>

          {/* AI Provider - Compact */}
          <div className="flex items-center gap-1 ml-auto">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                title={p.name}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                  provider === p.id
                    ? `bg-gradient-to-r ${p.color} shadow-lg`
                    : 'bg-zinc-800 hover:bg-zinc-700 opacity-50 hover:opacity-100'
                }`}
              >
                {p.icon}
              </button>
            ))}
          </div>

          {/* More Options Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 rounded-lg transition-all ${
              showOptions ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Extended Options (collapsed by default) */}
        {showOptions && (
          <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Target Slide Count</label>
                <input
                  type="number"
                  value={slideCount}
                  onChange={(e) => setSlideCount(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Auto"
                  min={5}
                  max={100}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white
                             focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Add Files</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 
                             border border-zinc-700 rounded-lg text-sm text-zinc-300"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Upload Images/PDFs
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700"
                  >
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <DocumentIcon className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-zinc-300 max-w-[100px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-0.5 text-zinc-500 hover:text-red-400"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {currentProvider && (
              <span className="flex items-center gap-1">
                <span>{currentProvider.icon}</span>
                <span>{currentProvider.name}</span>
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all
              ${canSubmit
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-900/30 hover:shadow-cyan-500/30 hover:scale-[1.02]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate
                <span className="text-xs opacity-70 ml-1">⌘↵</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LectureBuilder;

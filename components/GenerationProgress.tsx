/**
 * Generation Progress Component
 * Shows real-time progress of AI generation with phase indicators
 */
import React from 'react';
import { GenerationPhase } from '../services/ai-provider';

interface GenerationProgressProps {
  isVisible: boolean;
  phase: GenerationPhase;
  progress: number;
  message?: string;
}

const PHASE_CONFIG: Record<GenerationPhase, { icon: string; label: string; color: string }> = {
  starting: { icon: '🚀', label: 'Starting', color: 'bg-zinc-500' },
  gemini: { icon: '✨', label: 'Gemini', color: 'bg-blue-500' },
  opus: { icon: '👑', label: 'Opus', color: 'bg-purple-500' },
  claude: { icon: '🧠', label: 'Claude', color: 'bg-orange-500' },
  enhancing: { icon: '🔧', label: 'Enhancing', color: 'bg-cyan-500' },
  caching: { icon: '💾', label: 'Saving', color: 'bg-green-500' },
  complete: { icon: '✅', label: 'Complete', color: 'bg-green-500' },
};

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isVisible,
  phase,
  progress,
  message,
}) => {
  if (!isVisible) return null;

  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.starting;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl min-w-[280px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-xl`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {config.label}
            </div>
            <div className="text-xs text-zinc-400 truncate max-w-[180px]">
              {message || 'Processing...'}
            </div>
          </div>
          <div className="text-sm font-mono text-zinc-400">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.color} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase Dots */}
        <div className="flex justify-between mt-3 px-1">
          {(['gemini', 'opus', 'complete'] as GenerationPhase[]).map((p, i) => {
            const pConfig = PHASE_CONFIG[p];
            const isActive = phase === p;
            const isPast = ['gemini', 'opus', 'claude', 'enhancing', 'caching', 'complete'].indexOf(phase) > 
                          ['gemini', 'opus', 'claude', 'enhancing', 'caching', 'complete'].indexOf(p);
            
            return (
              <div key={p} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive ? `${pConfig.color} scale-125` : 
                    isPast ? 'bg-green-500' : 'bg-zinc-700'
                  }`} 
                />
                <span className={`text-[10px] ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                  {pConfig.icon}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GenerationProgress;

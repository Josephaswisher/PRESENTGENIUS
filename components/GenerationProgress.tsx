/**
 * Generation Progress Component
 * Shows real-time progress of AI generation with phase indicators and detailed activity log
 */
import React, { useEffect, useRef, useState } from 'react';
import { GenerationPhase } from '../services/ai-provider';

interface GenerationProgressProps {
  isVisible: boolean;
  phase: GenerationPhase;
  progress: number;
  message?: string;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'processing';
}

const PHASE_CONFIG: Record<GenerationPhase, { icon: string; label: string; color: string }> = {
  starting: { icon: '🚀', label: 'Starting', color: 'bg-zinc-500' },
  gemini: { icon: '✨', label: 'Gemini', color: 'bg-blue-500' },
  opus: { icon: '👑', label: 'Opus', color: 'bg-purple-500' },
  claude: { icon: '🧠', label: 'Claude', color: 'bg-orange-500' },
  minimax: { icon: '⚡', label: 'MiniMax', color: 'bg-cyan-500' },
  deepseek: { icon: '🔮', label: 'DeepSeek', color: 'bg-purple-500' },
  glm: { icon: '🟡', label: 'GLM', color: 'bg-yellow-500' },
  enhancing: { icon: '🔧', label: 'Enhancing', color: 'bg-cyan-500' },
  processing: { icon: '⚙️', label: 'Processing', color: 'bg-blue-500' },
  retrying: { icon: '🔄', label: 'Retrying', color: 'bg-orange-500' },
  caching: { icon: '💾', label: 'Saving', color: 'bg-green-500' },
  complete: { icon: '✅', label: 'Complete', color: 'bg-green-500' },
};

const LOG_TYPE_CONFIG = {
  info: { icon: '💬', color: 'text-zinc-400' },
  success: { icon: '✅', color: 'text-green-400' },
  warning: { icon: '⚠️', color: 'text-yellow-400' },
  processing: { icon: '⚙️', color: 'text-cyan-400' },
};

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isVisible,
  phase,
  progress,
  message,
}) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevMessageRef = useRef<string>('');

  // Add new log entry when message changes
  useEffect(() => {
    if (message && message !== prevMessageRef.current && isVisible) {
      const logType: ActivityLog['type'] =
        message.includes('✅') || message.includes('complete') ? 'success' :
        message.includes('⚠️') || message.includes('warning') || message.includes('fallback') ? 'warning' :
        message.includes('⚙️') || message.includes('Processing') || message.includes('Sending') ? 'processing' :
        'info';

      const newLog: ActivityLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        message,
        type: logType,
      };

      setActivityLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
      prevMessageRef.current = message;
    }
  }, [message, isVisible]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activityLogs, showLogs]);

  // Clear logs when modal closes
  useEffect(() => {
    if (!isVisible) {
      setActivityLogs([]);
      prevMessageRef.current = '';
    }
  }, [isVisible]);

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

        {/* Activity Log Section */}
        {activityLogs.length > 0 && (
          <div className="mt-4 border-t border-zinc-700 pt-3">
            {/* Log Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">Activity Log</span>
                <span className="text-[10px] font-mono text-zinc-600">
                  {activityLogs.length}/100
                </span>
              </div>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {showLogs ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Log Container */}
            {showLogs && (
              <div className="max-h-[300px] overflow-y-auto bg-zinc-950/50 rounded-lg border border-zinc-800 p-2 space-y-1.5">
                {activityLogs.map((log) => {
                  const typeConfig = LOG_TYPE_CONFIG[log.type];
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 text-xs animate-in fade-in slide-in-from-bottom-1 duration-200"
                    >
                      {/* Timestamp */}
                      <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0 w-12">
                        {log.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }).slice(-8)}
                      </span>

                      {/* Type Icon */}
                      <span className="flex-shrink-0" title={log.type}>
                        {typeConfig.icon}
                      </span>

                      {/* Message */}
                      <span className={`flex-1 ${typeConfig.color} leading-relaxed`}>
                        {log.message}
                      </span>
                    </div>
                  );
                })}
                {/* Auto-scroll anchor */}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress;

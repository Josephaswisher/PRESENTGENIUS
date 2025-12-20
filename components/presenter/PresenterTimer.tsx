/**
 * Presenter Timer Component
 *
 * Shows elapsed time or countdown timer for the presentation.
 * Features:
 * - Elapsed time display
 * - Countdown mode
 * - Pause/resume
 * - Reset
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PresenterTimerProps {
  mode?: 'elapsed' | 'countdown';
  countdownMinutes?: number;
  onTimeWarning?: () => void; // Called when < 5 minutes remaining
  onTimeUp?: () => void; // Called when countdown reaches 0
}

export function PresenterTimer({
  mode = 'elapsed',
  countdownMinutes = 30,
  onTimeWarning,
  onTimeUp,
}: PresenterTimerProps) {
  const [seconds, setSeconds] = useState(mode === 'countdown' ? countdownMinutes * 60 : 0);
  const [isRunning, setIsRunning] = useState(true);
  const [timerMode, setTimerMode] = useState(mode);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (timerMode === 'countdown') {
          const newTime = prev - 1;

          // Time warning at 5 minutes
          if (newTime === 300) {
            onTimeWarning?.();
          }

          // Time up
          if (newTime <= 0) {
            onTimeUp?.();
            return 0;
          }

          return newTime;
        } else {
          return prev + 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerMode, onTimeWarning, onTimeUp]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleReset = () => {
    setSeconds(timerMode === 'countdown' ? countdownMinutes * 60 : 0);
  };

  const toggleMode = () => {
    const newMode = timerMode === 'elapsed' ? 'countdown' : 'elapsed';
    setTimerMode(newMode);
    setSeconds(newMode === 'countdown' ? countdownMinutes * 60 : 0);
  };

  // Color based on time remaining (for countdown)
  const getTimeColor = () => {
    if (timerMode !== 'countdown') return 'text-white';
    if (seconds <= 0) return 'text-red-500';
    if (seconds <= 60) return 'text-red-400 animate-pulse';
    if (seconds <= 300) return 'text-yellow-400';
    return 'text-white';
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      {/* Timer Display */}
      <div className={`font-mono text-4xl font-bold ${getTimeColor()}`}>
        {formatTime(seconds)}
      </div>

      {/* Mode Label */}
      <div className="text-xs text-zinc-500 uppercase tracking-wide flex items-center gap-1">
        <ClockIcon className="w-3 h-3" />
        {timerMode === 'elapsed' ? 'Elapsed' : 'Remaining'}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-2 rounded-lg transition-colors ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title="Reset"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>

        <button
          onClick={toggleMode}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
          title="Switch mode"
        >
          {timerMode === 'elapsed' ? '→ Countdown' : '→ Elapsed'}
        </button>
      </div>
    </div>
  );
}

export default PresenterTimer;

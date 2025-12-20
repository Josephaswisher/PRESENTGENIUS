/**
 * Duration Calculator - Set lecture duration and slide count
 */
import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  RectangleStackIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { DurationPreset, DURATION_PRESETS } from '../../types/lecture';

interface DurationCalculatorProps {
  selectedPreset: string;
  customDuration?: number;
  customSlideCount?: number;
  onPresetChange: (presetId: string) => void;
  onCustomDurationChange: (minutes: number) => void;
  onCustomSlideCountChange: (count: number) => void;
  disabled?: boolean;
}

export const DurationCalculator: React.FC<DurationCalculatorProps> = ({
  selectedPreset,
  customDuration = 45,
  customSlideCount = 30,
  onPresetChange,
  onCustomDurationChange,
  onCustomSlideCountChange,
  disabled,
}) => {
  const [showCustom, setShowCustom] = useState(selectedPreset === 'custom');
  
  const preset = DURATION_PRESETS.find(p => p.id === selectedPreset) || DURATION_PRESETS[1];

  useEffect(() => {
    setShowCustom(selectedPreset === 'custom');
  }, [selectedPreset]);

  const handlePresetSelect = (presetId: string) => {
    onPresetChange(presetId);
    if (presetId !== 'custom') {
      const p = DURATION_PRESETS.find(pr => pr.id === presetId);
      if (p) {
        onCustomDurationChange(p.durationMinutes);
        onCustomSlideCountChange(p.defaultSlides);
      }
    }
  };

  const getTimePerSlide = () => {
    const duration = selectedPreset === 'custom' ? customDuration : preset.durationMinutes;
    const slides = selectedPreset === 'custom' ? customSlideCount : preset.defaultSlides;
    const seconds = (duration * 60) / slides;
    if (seconds >= 60) {
      return `${Math.round(seconds / 60 * 10) / 10} min/slide`;
    }
    return `${Math.round(seconds)} sec/slide`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        <ClockIcon className="w-4 h-4 inline mr-2" />
        Lecture Duration
      </label>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DURATION_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetSelect(p.id)}
            disabled={disabled}
            className={`p-3 rounded-xl border transition-all text-left
              ${selectedPreset === p.id
                ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{p.icon}</span>
              <span className={`font-medium text-sm ${selectedPreset === p.id ? 'text-cyan-400' : 'text-white'}`}>
                {p.name}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              {p.id === 'custom' ? (
                'Set your own'
              ) : (
                <>
                  {p.durationMinutes} min • {p.defaultSlides} slides
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Custom Controls */}
      {showCustom && (
        <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300 mb-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Custom Settings
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Duration</span>
              <span className="text-cyan-400 font-mono">{customDuration} minutes</span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={customDuration}
              onChange={(e) => onCustomDurationChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>5 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {/* Slide Count Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Slide Count</span>
              <span className="text-purple-400 font-mono">{customSlideCount} slides</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={1}
              value={customSlideCount}
              onChange={(e) => onCustomSlideCountChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>5 slides</span>
              <span>200 slides</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium">
              {selectedPreset === 'custom' ? customDuration : preset.durationMinutes} min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RectangleStackIcon className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">
              {selectedPreset === 'custom' ? customSlideCount : preset.defaultSlides} slides
            </span>
          </div>
        </div>
        <div className="text-sm text-zinc-400">
          ~{getTimePerSlide()}
        </div>
      </div>

      {/* Pacing Indicator */}
      <div className="flex gap-1">
        {['Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'].map((pace, i) => {
          const seconds = ((selectedPreset === 'custom' ? customDuration : preset.durationMinutes) * 60) / 
                          (selectedPreset === 'custom' ? customSlideCount : preset.defaultSlides);
          const isActive = 
            (i === 0 && seconds < 30) ||
            (i === 1 && seconds >= 30 && seconds < 60) ||
            (i === 2 && seconds >= 60 && seconds < 90) ||
            (i === 3 && seconds >= 90 && seconds < 120) ||
            (i === 4 && seconds >= 120);
          
          return (
            <div
              key={pace}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                isActive 
                  ? i === 0 ? 'bg-red-500' 
                    : i === 1 ? 'bg-orange-500'
                    : i === 2 ? 'bg-green-500'
                    : i === 3 ? 'bg-blue-500'
                    : 'bg-purple-500'
                  : 'bg-zinc-700'
              }`}
              title={pace}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-zinc-600">
        <span>Rapid Fire</span>
        <span>Deep Dive</span>
      </div>
    </div>
  );
};

/**
 * LearnerLevelSelector Component
 * Dropdown for selecting target audience level (MS3-4 to Fellow)
 * Part of VibePresenterPro
 */
import React, { useState } from 'react';
import { LEARNER_LEVELS, LearnerLevel } from '../data/activities';

interface LearnerLevelSelectorProps {
  selectedLevel: LearnerLevel | null;
  onSelectLevel: (level: LearnerLevel | null) => void;
  disabled?: boolean;
}

export const LearnerLevelSelector: React.FC<LearnerLevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLevelData = selectedLevel
    ? LEARNER_LEVELS.find(l => l.id === selectedLevel)
    : null;

  const handleSelect = (level: LearnerLevel | null) => {
    onSelectLevel(level);
    setIsOpen(false);
  };

  // Level icons for visual distinction
  const levelIcons: Record<LearnerLevel, string> = {
    'MS3-4': '🎓',
    'PGY1': '🏥',
    'PGY2-3': '👨‍⚕️',
    'Fellow': '🔬'
  };

  // Level colors for badges
  const levelColors: Record<LearnerLevel, string> = {
    'MS3-4': 'bg-green-500/20 text-green-400 border-green-500/30',
    'PGY1': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'PGY2-3': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Fellow': 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          border transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${selectedLevel
            ? `${levelColors[selectedLevel]} border`
            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'}
          ${isOpen ? 'ring-1 ring-cyan-500/30 border-cyan-500/50' : ''}
        `}
      >
        {selectedLevel ? (
          <>
            <span>{levelIcons[selectedLevel]}</span>
            <span className="font-medium">{selectedLevelData?.name}</span>
          </>
        ) : (
          <>
            <span>👤</span>
            <span>Learner Level</span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-200">Target Audience</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Select to calibrate content complexity</p>
            </div>

            {/* Options */}
            <div className="p-2">
              {/* Auto option */}
              <button
                onClick={() => handleSelect(null)}
                className={`
                  w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                  ${!selectedLevel
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'hover:bg-zinc-800 border border-transparent'}
                `}
              >
                <span className="text-xl">🎯</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${!selectedLevel ? 'text-cyan-300' : 'text-zinc-200'}`}>
                    Auto-detect
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    AI will determine appropriate level from content
                  </div>
                </div>
                {!selectedLevel && (
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="my-2 border-t border-zinc-800" />

              {/* Level options */}
              {LEARNER_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => handleSelect(level.id)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all mb-1
                    ${selectedLevel === level.id
                      ? `${levelColors[level.id]} border`
                      : 'hover:bg-zinc-800 border border-transparent'}
                  `}
                >
                  <span className="text-xl">{levelIcons[level.id]}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${selectedLevel === level.id ? '' : 'text-zinc-200'}`}>
                      {level.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {level.description}
                    </div>
                  </div>
                  {selectedLevel === level.id && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Footer tip */}
            <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-xs text-zinc-600">
                💡 Tip: MS3-4 gets scaffolded reasoning, Fellows get evidence debates
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LearnerLevelSelector;

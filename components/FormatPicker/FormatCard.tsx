/**
 * FormatCard Component
 * Visual card with thumbnail, selection state, and hover preview
 */

import React, { useState } from 'react';
import { CheckIcon, EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FormatCardProps } from './types';

export const FormatCard: React.FC<FormatCardProps> = ({
  format,
  isSelected,
  onToggle,
  onPreview,
  selectedSubOption,
  onSubOptionChange,
  disabled = false,
}) => {
  const [showSubOptions, setShowSubOptions] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const handleSubOptionSelect = (e: React.MouseEvent, subOptionId: string) => {
    e.stopPropagation();
    onSubOptionChange?.(subOptionId);
    setShowSubOptions(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative group cursor-pointer rounded-xl overflow-hidden
        border-2 transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800'
        }
      `}
    >
      {/* Preview Thumbnail */}
      <div className="aspect-video bg-zinc-900 overflow-hidden relative">
        {format.previewThumbnail ? (
          <img
            src={format.previewThumbnail}
            alt={`${format.name} preview`}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
            {format.icon}
          </div>
        )}

        {/* Hover Preview Button */}
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg
                       opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Preview format"
          >
            <EyeIcon className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckIcon className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`
            text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
            ${format.category === 'new-formats'
              ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white'
              : 'bg-zinc-900/80 text-zinc-400'
            }
          `}>
            {format.category === 'new-formats' ? '✨ New' : format.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{format.icon}</span>
          <span className={`font-medium text-sm ${isSelected ? 'text-cyan-300' : 'text-zinc-200'}`}>
            {format.name}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
          {format.description}
        </p>

        {/* Sub-options dropdown */}
        {format.subOptions && format.subOptions.length > 0 && isSelected && (
          <div className="mt-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubOptions(!showSubOptions);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-zinc-700/50
                         hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
            >
              <span>
                {format.subOptions.find(o => o.id === selectedSubOption)?.label || 'Select style'}
              </span>
              <ChevronDownIcon className={`w-3 h-3 transition-transform ${showSubOptions ? 'rotate-180' : ''}`} />
            </button>

            {showSubOptions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700
                              rounded-lg shadow-xl z-10 overflow-hidden">
                {format.subOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={(e) => handleSubOptionSelect(e, option.id)}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors
                      ${selectedSubOption === option.id
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }
                    `}
                  >
                    {option.label}
                    {option.default && (
                      <span className="ml-2 text-[10px] text-zinc-500">(default)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormatCard;

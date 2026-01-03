/**
 * DrawingToolbar Component
 * Toolbar for drawing controls in presentation mode
 *
 * Features:
 * - Pen/eraser tool selection
 * - Color palette (6 colors)
 * - Width slider (1-10px)
 * - Clear button
 * - Save/export button
 */

import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export interface DrawingToolbarProps {
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  onToolChange: (tool: 'pen' | 'eraser') => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClear: () => void;
  onSave?: () => void;
  className?: string;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'White', value: '#FFFFFF' },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  tool,
  color,
  width,
  onToolChange,
  onColorChange,
  onWidthChange,
  onClear,
  onSave,
  className = '',
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClearClick = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    } else {
      onClear();
      setShowClearConfirm(false);
    }
  };

  const handleSaveClick = () => {
    onSave?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className={`fixed bottom-20 right-4 bg-zinc-900/95 backdrop-blur-sm rounded-xl border border-zinc-700 shadow-2xl p-3 flex flex-col gap-3 z-30 ${className}`}
    >
      {/* Tools Section */}
      <div className="flex flex-col gap-2">
        <div className="text-xs text-zinc-400 uppercase tracking-wide px-1">Tools</div>
        <div className="flex gap-2">
          <button
            onClick={() => onToolChange('pen')}
            className={`flex-1 p-2.5 rounded-lg transition-all ${
              tool === 'pen'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Pen"
          >
            <PencilIcon className="w-5 h-5 mx-auto" />
          </button>
          <button
            onClick={() => onToolChange('eraser')}
            className={`flex-1 p-2.5 rounded-lg transition-all ${
              tool === 'eraser'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Eraser"
          >
            <div className="w-5 h-5 mx-auto flex items-center justify-center">
              <div className="w-4 h-4 bg-current rounded-sm" />
            </div>
          </button>
        </div>
      </div>

      {/* Color Palette */}
      {tool === 'pen' && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-zinc-400 uppercase tracking-wide px-1">Color</div>
          <div className="grid grid-cols-3 gap-2">
            {COLORS.map(({ name, value }) => (
              <button
                key={value}
                onClick={() => onColorChange(value)}
                className={`w-10 h-10 rounded-lg transition-all relative ${
                  color === value
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-900 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: value,
                  border: value === '#FFFFFF' ? '1px solid #3f3f46' : 'none',
                }}
                title={name}
              >
                {color === value && (
                  <CheckIcon
                    className="w-4 h-4 absolute inset-0 m-auto"
                    style={{
                      color: value === '#FFFFFF' || value === '#F59E0B' ? '#000000' : '#FFFFFF',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Width Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-zinc-400 uppercase tracking-wide">Width</span>
          <span className="text-xs text-zinc-300 font-mono">{width}px</span>
        </div>
        <div className="px-1">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-cyan-500
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-cyan-500/50
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-cyan-500
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:shadow-lg
                     [&::-moz-range-thumb]:shadow-cyan-500/50"
          />
        </div>
        {/* Width Preview */}
        <div className="flex items-center justify-center py-2">
          <div
            className="rounded-full transition-all"
            style={{
              width: `${width * 2}px`,
              height: `${width * 2}px`,
              backgroundColor: tool === 'pen' ? color : '#EF4444',
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-700" />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleClearClick}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
            showClearConfirm
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <TrashIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showClearConfirm ? 'Click again to confirm' : 'Clear All'}
          </span>
        </button>

        {onSave && (
          <button
            onClick={handleSaveClick}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
              saved
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {saved ? (
              <>
                <CheckIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Saved!</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-zinc-500 text-center pt-1 border-t border-zinc-800">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">D</kbd> to toggle
      </div>
    </div>
  );
};

export default DrawingToolbar;

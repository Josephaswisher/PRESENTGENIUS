/**
 * Printable Selector - Choose which printable materials to generate
 */
import React from 'react';
import {
  DocumentIcon,
  CheckIcon,
  PrinterIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { PrintableConfig, PrintableType, PRINTABLE_TYPES } from '../../types/lecture';

interface PrintableSelectorProps {
  printables: PrintableConfig[];
  onUpdatePrintables: (printables: PrintableConfig[]) => void;
  disabled?: boolean;
}

export const PrintableSelector: React.FC<PrintableSelectorProps> = ({
  printables,
  onUpdatePrintables,
  disabled,
}) => {
  const togglePrintable = (type: PrintableType) => {
    const existing = printables.find(p => p.type === type);
    if (existing) {
      onUpdatePrintables(printables.filter(p => p.type !== type));
    } else {
      onUpdatePrintables([
        ...printables,
        {
          type,
          enabled: true,
          options: getDefaultOptions(type),
        },
      ]);
    }
  };

  const updateOptions = (type: PrintableType, options: Partial<PrintableConfig['options']>) => {
    onUpdatePrintables(
      printables.map(p =>
        p.type === type ? { ...p, options: { ...p.options, ...options } } : p
      )
    );
  };

  const getDefaultOptions = (type: PrintableType): PrintableConfig['options'] => {
    switch (type) {
      case 'one-page-handout':
        return { includeQR: true, pageLimit: 1 };
      case 'study-guide':
        return { includeQR: true, pageLimit: undefined };
      case 'follow-along':
        return { blankSpaces: 10, includeQR: true };
      case 'fast-facts':
        return { pageLimit: 2 };
      case 'board-questions':
        return { includeAnswerKey: true };
      default:
        return {};
    }
  };

  const isSelected = (type: PrintableType) => printables.some(p => p.type === type);
  const getConfig = (type: PrintableType) => printables.find(p => p.type === type);

  const selectedCount = printables.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-300">
          <PrinterIcon className="w-4 h-4 inline mr-2" />
          Printable Materials
        </label>
        {selectedCount > 0 && (
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
            {selectedCount} selected
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Generate these materials alongside your presentation
      </p>

      {/* Printable Options Grid */}
      <div className="space-y-2">
        {PRINTABLE_TYPES.map((printable) => {
          const selected = isSelected(printable.type);
          const config = getConfig(printable.type);

          return (
            <div
              key={printable.type}
              className={`rounded-xl border transition-all ${
                selected
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30'
                  : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              {/* Main Toggle */}
              <button
                onClick={() => togglePrintable(printable.type)}
                disabled={disabled}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-cyan-500 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {selected ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">{printable.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${selected ? 'text-white' : 'text-zinc-300'}`}>
                    {printable.name}
                  </div>
                  <div className="text-xs text-zinc-500">{printable.description}</div>
                </div>
                <span className="text-2xl opacity-50">{printable.icon}</span>
              </button>

              {/* Options (when selected) */}
              {selected && config && (
                <div className="px-3 pb-3 pt-0 border-t border-zinc-700/30 mt-0">
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* QR Code Option */}
                    {(printable.type === 'one-page-handout' ||
                      printable.type === 'study-guide' ||
                      printable.type === 'follow-along') && (
                      <button
                        onClick={() => updateOptions(printable.type, { includeQR: !config.options.includeQR })}
                        className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                          config.options.includeQR
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                        }`}
                      >
                        <span>📱</span> QR to Slides
                      </button>
                    )}

                    {/* Answer Key Option */}
                    {printable.type === 'board-questions' && (
                      <button
                        onClick={() => updateOptions(printable.type, { includeAnswerKey: !config.options.includeAnswerKey })}
                        className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                          config.options.includeAnswerKey
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                        }`}
                      >
                        <span>✓</span> Include Answer Key
                      </button>
                    )}

                    {/* Blank Spaces for Follow-Along */}
                    {printable.type === 'follow-along' && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">Blanks:</span>
                        <input
                          type="number"
                          min={5}
                          max={30}
                          value={config.options.blankSpaces || 10}
                          onChange={(e) => updateOptions(printable.type, { blankSpaces: Number(e.target.value) })}
                          className="w-14 px-2 py-1 bg-zinc-700/50 border border-zinc-600 rounded text-white text-center"
                        />
                      </div>
                    )}

                    {/* Page Limit */}
                    {(printable.type === 'one-page-handout' || printable.type === 'fast-facts') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">Pages:</span>
                        <select
                          value={config.options.pageLimit || 1}
                          onChange={(e) => updateOptions(printable.type, { pageLimit: Number(e.target.value) })}
                          className="px-2 py-1 bg-zinc-700/50 border border-zinc-600 rounded text-white"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={4}>4</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const allConfigs = PRINTABLE_TYPES.map(p => ({
              type: p.type,
              enabled: true,
              options: getDefaultOptions(p.type),
            }));
            onUpdatePrintables(allConfigs);
          }}
          disabled={disabled}
          className="flex-1 text-xs py-2 px-3 bg-zinc-800 hover:bg-zinc-700 
                     text-zinc-300 rounded-lg transition-colors"
        >
          Select All
        </button>
        <button
          onClick={() => onUpdatePrintables([])}
          disabled={disabled || printables.length === 0}
          className="flex-1 text-xs py-2 px-3 bg-zinc-800 hover:bg-zinc-700 
                     text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

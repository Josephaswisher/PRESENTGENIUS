/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ClockIcon, ArrowRightIcon, DocumentIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface Creation {
  id: string;
  name: string;
  html: string;
  originalImage?: string; // Base64 data URL
  timestamp: Date;
  activityId?: string;
  learnerLevel?: string;
}

interface CreationHistoryProps {
  history: Creation[];
  onSelect: (creation: Creation) => void;
  onDelete?: (creation: Creation) => void;
}

export const CreationHistory: React.FC<CreationHistoryProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;

  const handleDelete = (e: React.MouseEvent, item: Creation) => {
    e.stopPropagation(); // Prevent triggering onSelect
    onDelete?.(item);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Horizontal Scroll Container for Compact Layout */}
      <div className="flex overflow-x-auto space-x-4 pb-2 px-2 scrollbar-hide">
        {history.map((item) => {
          const isPdf = item.originalImage?.startsWith('data:application/pdf');
          return (
            <div
              key={item.id}
              className="group flex-shrink-0 relative w-44 h-28"
            >
              {/* Delete Button - Top Right Corner */}
              {onDelete && (
                <button
                  onClick={(e) => handleDelete(e, item)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Delete presentation"
                >
                  <TrashIcon className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                </button>
              )}

              {/* Main Card Button */}
              <button
                onClick={() => onSelect(item)}
                className="w-full h-full flex flex-col text-left bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-1.5 bg-zinc-800 rounded group-hover:bg-zinc-700 transition-colors border border-zinc-700/50">
                      {isPdf ? (
                        <DocumentIcon className="w-4 h-4 text-zinc-400" />
                      ) : item.originalImage ? (
                        <PhotoIcon className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <DocumentIcon className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-blue-400">Restore</span>
                      <ArrowRightIcon className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

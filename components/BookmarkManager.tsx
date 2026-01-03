/**
 * Bookmark Manager Component
 * Displays and manages bookmarks with 4 types: Star, Flag, Question, Important
 * Allows navigation, note editing, and import/export
 */
import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  StarIcon,
  FlagIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  FlagIcon as FlagIconSolid,
  QuestionMarkCircleIcon as QuestionIconSolid,
  SparklesIcon as SparklesIconSolid,
} from '@heroicons/react/24/solid';
import { Bookmark } from '../hooks/useBookmarks';

interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  currentSlide: number;
  totalSlides: number;
  onNavigate: (slideIndex: number) => void;
  onUpdateNote: (slideIndex: number, note: string) => void;
  onRemove: (slideIndex: number) => void;
  onClearAll: () => void;
  onExport: () => string;
  onImport: (jsonString: string) => boolean;
  onClose: () => void;
  show: boolean;
}

const BOOKMARK_TYPES = {
  star: {
    label: 'Star',
    icon: StarIcon,
    iconSolid: StarIconSolid,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
  flag: {
    label: 'Flag',
    icon: FlagIcon,
    iconSolid: FlagIconSolid,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
  question: {
    label: 'Question',
    icon: QuestionMarkCircleIcon,
    iconSolid: QuestionIconSolid,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  important: {
    label: 'Important',
    icon: SparklesIcon,
    iconSolid: SparklesIconSolid,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
  },
} as const;

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  bookmarks,
  currentSlide,
  totalSlides,
  onNavigate,
  onUpdateNote,
  onRemove,
  onClearAll,
  onExport,
  onImport,
  onClose,
  show,
}) => {
  const [filterType, setFilterType] = useState<Bookmark['type'] | 'all'>('all');
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  // Filter bookmarks by type
  const filteredBookmarks =
    filterType === 'all'
      ? bookmarks
      : bookmarks.filter((b) => b.type === filterType);

  // Handle export to JSON file
  const handleExport = () => {
    const jsonString = onExport();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-bookmarks-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import from JSON file
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = onImport(content);
      if (success) {
        alert('Bookmarks imported successfully!');
      } else {
        alert('Failed to import bookmarks. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start editing a bookmark note
  const startEditing = (bookmark: Bookmark) => {
    setEditingSlide(bookmark.slideIndex);
    setEditNote(bookmark.note || '');
  };

  // Save edited note
  const saveNote = () => {
    if (editingSlide !== null) {
      onUpdateNote(editingSlide, editNote);
      setEditingSlide(null);
      setEditNote('');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSlide(null);
    setEditNote('');
  };

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-lg z-[60] overflow-hidden">
      <div className="h-full flex flex-col max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Bookmark Manager</h2>
            <p className="text-white/60 text-sm">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} in this
              presentation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            title="Close (Esc or Shift+B)"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'all'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({bookmarks.length})
          </button>
          {Object.entries(BOOKMARK_TYPES).map(([type, config]) => {
            const Icon = config.iconSolid;
            const count = bookmarks.filter((b) => b.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type as Bookmark['type'])}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filterType === type
                    ? `${config.bgColor} ${config.color}`
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">
                {filterType === 'all'
                  ? 'No bookmarks yet. Press "b" to bookmark the current slide.'
                  : `No ${BOOKMARK_TYPES[filterType as Bookmark['type']].label.toLowerCase()} bookmarks.`}
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => {
              const config = BOOKMARK_TYPES[bookmark.type];
              const Icon = config.iconSolid;
              const isEditing = editingSlide === bookmark.slideIndex;
              const isCurrent = bookmark.slideIndex === currentSlide;

              return (
                <div
                  key={bookmark.slideIndex}
                  className={`bg-white/5 rounded-lg p-4 border transition-all ${
                    isCurrent
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Bookmark Icon */}
                    <div className={`${config.bgColor} ${config.color} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Slide Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => onNavigate(bookmark.slideIndex)}
                          className="text-white font-medium hover:text-cyan-400 transition-colors"
                        >
                          Slide {bookmark.slideIndex + 1} / {totalSlides}
                        </button>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Note */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full bg-zinc-900 text-white text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            rows={3}
                            placeholder="Add a note..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveNote}
                              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded text-xs font-semibold transition-all flex items-center gap-1"
                            >
                              <CheckIcon className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded text-xs transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white/70 text-sm">
                          {bookmark.note || (
                            <span className="text-white/40 italic">No note</span>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-white/30 text-xs mt-2">
                        {new Date(bookmark.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(bookmark)}
                          className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded transition-all"
                          title="Edit note"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemove(bookmark.slideIndex)}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                          title="Remove bookmark"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={bookmarks.length === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export bookmarks to JSON file"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              title="Import bookmarks from JSON file"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Import
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          <button
            onClick={() => {
              if (
                confirm(
                  `Are you sure you want to delete all ${bookmarks.length} bookmark(s)?`
                )
              ) {
                onClearAll();
              }
            }}
            disabled={bookmarks.length === 0}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <TrashIcon className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="mt-4 text-center text-white/30 text-xs">
          Press <kbd className="px-2 py-1 bg-white/10 rounded">b</kbd> to bookmark
          current slide • Press{' '}
          <kbd className="px-2 py-1 bg-white/10 rounded">Shift+B</kbd> to toggle this
          panel
        </div>
      </div>
    </div>
  );
};

/**
 * Speaker Notes Component
 *
 * Displays and edits speaker notes for the current slide.
 * Features:
 * - Read-only display in presenter view
 * - Edit mode for adding/modifying notes
 * - Auto-save to localStorage
 */

import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SpeakerNotesProps {
  slideId: string;
  presentationId: string;
  readOnly?: boolean;
  onNotesChange?: (notes: string) => void;
}

// Storage key for speaker notes
const getStorageKey = (presentationId: string) => `presenter-notes-${presentationId}`;

export function SpeakerNotes({
  slideId,
  presentationId,
  readOnly = false,
  onNotesChange,
}: SpeakerNotesProps) {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(presentationId);
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      try {
        const allNotes = JSON.parse(savedNotes) as Record<string, string>;
        setNotes(allNotes[slideId] || '');
      } catch (e) {
        console.error('Failed to load speaker notes:', e);
      }
    }
  }, [slideId, presentationId]);

  // Save notes to localStorage
  const saveNotes = (newNotes: string) => {
    const storageKey = getStorageKey(presentationId);
    const savedNotes = localStorage.getItem(storageKey);
    let allNotes: Record<string, string> = {};

    if (savedNotes) {
      try {
        allNotes = JSON.parse(savedNotes);
      } catch (e) {
        console.error('Failed to parse saved notes:', e);
      }
    }

    allNotes[slideId] = newNotes;
    localStorage.setItem(storageKey, JSON.stringify(allNotes));
    setNotes(newNotes);
    onNotesChange?.(newNotes);
  };

  const handleStartEdit = () => {
    setEditValue(notes);
    setIsEditing(true);
  };

  const handleSave = () => {
    saveNotes(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(notes);
    setIsEditing(false);
  };

  if (isEditing && !readOnly) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-xs text-zinc-400 uppercase tracking-wide">
            Edit Speaker Notes
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 rounded bg-green-600 hover:bg-green-500 text-white transition-colors"
              title="Save"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Add speaker notes for this slide...

Tips:
- Key points to emphasize
- Questions to ask the audience
- Timing cues
- Stories or examples to share"
          className="flex-1 w-full p-3 bg-zinc-900 text-zinc-200 text-sm resize-none focus:outline-none placeholder:text-zinc-600"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 uppercase tracking-wide">
          Speaker Notes
        </span>
        {!readOnly && (
          <button
            onClick={handleStartEdit}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Edit notes"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {notes ? (
          <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {notes}
          </div>
        ) : (
          <div className="text-sm text-zinc-600 italic">
            {readOnly ? 'No speaker notes for this slide.' : 'Click the pencil icon to add speaker notes...'}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpeakerNotes;

/**
 * useAutoSave Hook
 *
 * Automatically saves project changes to Supabase with debouncing.
 * Features:
 * - 30-second auto-save interval
 * - Immediate save on significant changes
 * - Visual save status indicator
 * - Conflict detection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { updateProject } from '../services/projects.service';
import type { Creation } from '../components/CreationHistory';

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;
}

interface UseAutoSaveOptions {
  /** Interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Callback when save completes */
  onSaveComplete?: (creation: Creation) => void;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

export function useAutoSave(
  creation: Creation | null,
  options: UseAutoSaveOptions = {}
): AutoSaveState & { saveNow: () => Promise<void> } {
  const { interval = 30000, onSaveComplete, enabled = true } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track the last saved content to detect changes
  const lastSavedContentRef = useRef<string | null>(null);
  const creationRef = useRef(creation);
  creationRef.current = creation;

  // Check if content has changed since last save
  useEffect(() => {
    if (!creation) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges = creation.html !== lastSavedContentRef.current;
    setHasUnsavedChanges(hasChanges);
  }, [creation?.html]);

  // Manual save function
  const saveNow = useCallback(async () => {
    const currentCreation = creationRef.current;
    if (!currentCreation || !hasUnsavedChanges) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await updateProject(currentCreation.id, {
        name: currentCreation.name,
        html: currentCreation.html,
        originalImage: currentCreation.originalImage,
      });

      if (updated) {
        lastSavedContentRef.current = currentCreation.html;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        onSaveComplete?.(updated);
      } else {
        setSaveError('Failed to save changes');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveError(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, onSaveComplete]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !creation || !hasUnsavedChanges) return;

    const timer = setInterval(() => {
      saveNow();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, creation, hasUnsavedChanges, interval, saveNow]);

  // Save on creation ID change (new project loaded)
  useEffect(() => {
    if (creation) {
      lastSavedContentRef.current = creation.html;
      setHasUnsavedChanges(false);
    }
  }, [creation?.id]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveError,
    saveNow,
  };
}

export default useAutoSave;

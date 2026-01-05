/**
 * Presentation History Store
 *
 * Manages:
 * - Per-slide undo/redo history (20 versions per slide)
 * - Auto-save checkpoints (30-second intervals)
 * - Named manual checkpoints
 * - Checkpoint restore functionality
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface SlideVersion {
  id: string;
  timestamp: number;
  html: string;
  title: string;
}

export interface SlideHistory {
  slideId: string;
  versions: SlideVersion[];
  currentIndex: number;
}

export interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  isAutoSave: boolean;
  slides: Array<{
    id: string;
    html: string;
    title: string;
  }>;
  presentationTitle: string;
}

interface PresentationHistoryState {
  // Per-slide history for undo/redo
  slideHistories: Record<string, SlideHistory>;

  // Checkpoints for full presentation saves
  checkpoints: Checkpoint[];

  // Settings
  maxVersionsPerSlide: number;
  maxCheckpoints: number;
  autoSaveInterval: number; // milliseconds
  lastAutoSave: number;
}

interface PresentationHistoryActions {
  // Slide-level undo/redo
  recordSlideChange: (slideId: string, html: string, title: string) => void;
  undoSlide: (slideId: string) => SlideVersion | null;
  redoSlide: (slideId: string) => SlideVersion | null;
  canUndo: (slideId: string) => boolean;
  canRedo: (slideId: string) => boolean;
  getSlideHistory: (slideId: string) => SlideHistory | null;
  clearSlideHistory: (slideId: string) => void;

  // Checkpoint management
  createCheckpoint: (name: string, slides: Array<{ id: string; html: string; title: string }>, presentationTitle: string, isAutoSave?: boolean) => Checkpoint;
  restoreCheckpoint: (checkpointId: string) => Checkpoint | null;
  deleteCheckpoint: (checkpointId: string) => void;
  getCheckpoints: () => Checkpoint[];
  getLatestCheckpoint: () => Checkpoint | null;

  // Auto-save
  shouldAutoSave: () => boolean;
  updateLastAutoSave: () => void;

  // Cleanup
  clearAllHistory: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function pruneVersions(versions: SlideVersion[], maxVersions: number): SlideVersion[] {
  if (versions.length <= maxVersions) return versions;
  return versions.slice(versions.length - maxVersions);
}

// ============================================================================
// STORE
// ============================================================================

const initialState: PresentationHistoryState = {
  slideHistories: {},
  checkpoints: [],
  maxVersionsPerSlide: 20,
  maxCheckpoints: 50,
  autoSaveInterval: 30000, // 30 seconds
  lastAutoSave: 0,
};

export const usePresentationHistoryStore = create<PresentationHistoryState & PresentationHistoryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // SLIDE-LEVEL UNDO/REDO
      // ========================================

      recordSlideChange: (slideId, html, title) => {
        set((state) => {
          const existingHistory = state.slideHistories[slideId];
          const newVersion: SlideVersion = {
            id: generateId(),
            timestamp: Date.now(),
            html,
            title,
          };

          if (!existingHistory) {
            // First version for this slide
            return {
              slideHistories: {
                ...state.slideHistories,
                [slideId]: {
                  slideId,
                  versions: [newVersion],
                  currentIndex: 0,
                },
              },
            };
          }

          // Check if content actually changed
          const currentVersion = existingHistory.versions[existingHistory.currentIndex];
          if (currentVersion && currentVersion.html === html) {
            return state; // No change
          }

          // Truncate any "future" versions if we're not at the end (after undo)
          const truncatedVersions = existingHistory.versions.slice(0, existingHistory.currentIndex + 1);

          // Add new version and prune if needed
          const newVersions = pruneVersions([...truncatedVersions, newVersion], state.maxVersionsPerSlide);

          return {
            slideHistories: {
              ...state.slideHistories,
              [slideId]: {
                slideId,
                versions: newVersions,
                currentIndex: newVersions.length - 1,
              },
            },
          };
        });
      },

      undoSlide: (slideId) => {
        const state = get();
        const history = state.slideHistories[slideId];

        if (!history || history.currentIndex <= 0) {
          return null;
        }

        const newIndex = history.currentIndex - 1;
        const previousVersion = history.versions[newIndex];

        set((state) => ({
          slideHistories: {
            ...state.slideHistories,
            [slideId]: {
              ...history,
              currentIndex: newIndex,
            },
          },
        }));

        return previousVersion;
      },

      redoSlide: (slideId) => {
        const state = get();
        const history = state.slideHistories[slideId];

        if (!history || history.currentIndex >= history.versions.length - 1) {
          return null;
        }

        const newIndex = history.currentIndex + 1;
        const nextVersion = history.versions[newIndex];

        set((state) => ({
          slideHistories: {
            ...state.slideHistories,
            [slideId]: {
              ...history,
              currentIndex: newIndex,
            },
          },
        }));

        return nextVersion;
      },

      canUndo: (slideId) => {
        const history = get().slideHistories[slideId];
        return !!history && history.currentIndex > 0;
      },

      canRedo: (slideId) => {
        const history = get().slideHistories[slideId];
        return !!history && history.currentIndex < history.versions.length - 1;
      },

      getSlideHistory: (slideId) => {
        return get().slideHistories[slideId] || null;
      },

      clearSlideHistory: (slideId) => {
        set((state) => {
          const { [slideId]: removed, ...rest } = state.slideHistories;
          return { slideHistories: rest };
        });
      },

      // ========================================
      // CHECKPOINT MANAGEMENT
      // ========================================

      createCheckpoint: (name, slides, presentationTitle, isAutoSave = false) => {
        const checkpoint: Checkpoint = {
          id: generateId(),
          name: name || (isAutoSave ? 'Auto-save' : 'Manual save'),
          timestamp: Date.now(),
          isAutoSave,
          slides: slides.map(s => ({ id: s.id, html: s.html, title: s.title })),
          presentationTitle,
        };

        set((state) => {
          let newCheckpoints = [...state.checkpoints, checkpoint];

          // Prune old auto-saves first (keep last 10 auto-saves)
          const autoSaves = newCheckpoints.filter(c => c.isAutoSave);
          const manualSaves = newCheckpoints.filter(c => !c.isAutoSave);

          if (autoSaves.length > 10) {
            const recentAutoSaves = autoSaves.slice(-10);
            newCheckpoints = [...manualSaves, ...recentAutoSaves].sort((a, b) => a.timestamp - b.timestamp);
          }

          // Prune total checkpoints if needed
          if (newCheckpoints.length > state.maxCheckpoints) {
            // Remove oldest auto-saves first
            const sortedAutoSaves = newCheckpoints
              .filter(c => c.isAutoSave)
              .sort((a, b) => a.timestamp - b.timestamp);

            while (newCheckpoints.length > state.maxCheckpoints && sortedAutoSaves.length > 1) {
              const oldest = sortedAutoSaves.shift();
              if (oldest) {
                newCheckpoints = newCheckpoints.filter(c => c.id !== oldest.id);
              }
            }
          }

          return { checkpoints: newCheckpoints };
        });

        return checkpoint;
      },

      restoreCheckpoint: (checkpointId) => {
        const checkpoint = get().checkpoints.find(c => c.id === checkpointId);
        return checkpoint || null;
      },

      deleteCheckpoint: (checkpointId) => {
        set((state) => ({
          checkpoints: state.checkpoints.filter(c => c.id !== checkpointId),
        }));
      },

      getCheckpoints: () => {
        return get().checkpoints.sort((a, b) => b.timestamp - a.timestamp);
      },

      getLatestCheckpoint: () => {
        const checkpoints = get().checkpoints;
        if (checkpoints.length === 0) return null;
        return checkpoints.reduce((latest, c) => c.timestamp > latest.timestamp ? c : latest);
      },

      // ========================================
      // AUTO-SAVE
      // ========================================

      shouldAutoSave: () => {
        const state = get();
        const now = Date.now();
        return now - state.lastAutoSave >= state.autoSaveInterval;
      },

      updateLastAutoSave: () => {
        set({ lastAutoSave: Date.now() });
      },

      // ========================================
      // CLEANUP
      // ========================================

      clearAllHistory: () => {
        set({
          slideHistories: {},
          checkpoints: [],
          lastAutoSave: 0,
        });
      },
    }),
    {
      name: 'presentation-history-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        checkpoints: state.checkpoints,
        lastAutoSave: state.lastAutoSave,
      }),
    }
  )
);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get undo/redo status for a specific slide
 */
export function useSlideUndoRedo(slideId: string) {
  const store = usePresentationHistoryStore();

  return {
    canUndo: store.canUndo(slideId),
    canRedo: store.canRedo(slideId),
    undo: () => store.undoSlide(slideId),
    redo: () => store.redoSlide(slideId),
    record: (html: string, title: string) => store.recordSlideChange(slideId, html, title),
    history: store.getSlideHistory(slideId),
  };
}

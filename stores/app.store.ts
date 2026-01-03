/**
 * App Store (Zustand)
 *
 * Global state management for VibePresenterPro V2.
 * Handles:
 * - User authentication state
 * - Active project/creation
 * - UI state (modals, panels)
 * - Settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Creation } from '../components/CreationHistory';

interface AppState {
  // Auth
  user: User | null;
  isAuthModalOpen: boolean;

  // Projects
  activeCreation: Creation | null;
  history: Creation[];
  isLoading: boolean;
  isGenerating: boolean;
  isRefining: boolean;

  // UI State
  sidebarCollapsed: boolean;
  previewZoom: number;
  editorMode: 'preview' | 'block' | 'inline' | 'panel';

  // Save State
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  // Presentation
  isPresentationMode: boolean;
  currentSlide: number;

  // Settings
  settings: {
    theme: 'dark' | 'light';
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // ms
    defaultLearnerLevel: string;
    promptCacheEnabled: boolean;
  };
}

interface AppActions {
  // Auth
  setUser: (user: User | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Projects
  setActiveCreation: (creation: Creation | null) => void;
  updateActiveCreation: (updates: Partial<Creation>) => void;
  setHistory: (history: Creation[]) => void;
  addToHistory: (creation: Creation) => void;
  removeFromHistory: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsRefining: (refining: boolean) => void;

  // UI
  toggleSidebar: () => void;
  setPreviewZoom: (zoom: number) => void;
  setEditorMode: (mode: AppState['editorMode']) => void;

  // Save
  markSaved: () => void;
  markUnsaved: () => void;
  setIsSaving: (saving: boolean) => void;

  // Presentation
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
  setCurrentSlide: (slide: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;

  // Settings
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  // Reset
  reset: () => void;
}

const initialState: AppState = {
  // Auth
  user: null,
  isAuthModalOpen: false,

  // Projects
  activeCreation: null,
  history: [],
  isLoading: false,
  isGenerating: false,
  isRefining: false,

  // UI
  sidebarCollapsed: false,
  previewZoom: 100,
  editorMode: 'preview',

  // Save
  lastSaved: null,
  hasUnsavedChanges: false,
  isSaving: false,

  // Presentation
  isPresentationMode: false,
  currentSlide: 0,

  // Settings
  settings: {
    theme: 'dark',
    autoSaveEnabled: true,
    autoSaveInterval: 30000,
    defaultLearnerLevel: 'PGY1',
    promptCacheEnabled: false,
  },
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Auth Actions
      setUser: (user) => set({ user }),

      openAuthModal: () => set({ isAuthModalOpen: true }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      // Project Actions
      setActiveCreation: (creation) =>
        set({
          activeCreation: creation,
          hasUnsavedChanges: false,
          currentSlide: 0,
        }),

      updateActiveCreation: (updates) =>
        set((state) => ({
          activeCreation: state.activeCreation
            ? { ...state.activeCreation, ...updates }
            : null,
          hasUnsavedChanges: true,
        })),

      setHistory: (history) => set({ history }),

      addToHistory: (creation) =>
        set((state) => ({
          history: [creation, ...state.history.filter((c) => c.id !== creation.id)],
        })),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((c) => c.id !== id),
          activeCreation: state.activeCreation?.id === id ? null : state.activeCreation,
        })),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsGenerating: (isGenerating) => set({ isGenerating }),

      setIsRefining: (isRefining) => set({ isRefining }),

      // UI Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setPreviewZoom: (zoom) =>
        set({ previewZoom: Math.max(50, Math.min(200, zoom)) }),

      setEditorMode: (editorMode) => set({ editorMode }),

      // Save Actions
      markSaved: () =>
        set({
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }),

      markUnsaved: () => set({ hasUnsavedChanges: true }),

      setIsSaving: (isSaving) => set({ isSaving }),

      // Presentation Actions
      enterPresentationMode: () => set({ isPresentationMode: true }),

      exitPresentationMode: () => set({ isPresentationMode: false }),

      setCurrentSlide: (currentSlide) => set({ currentSlide }),

      nextSlide: () =>
        set((state) => ({ currentSlide: state.currentSlide + 1 })),

      prevSlide: () =>
        set((state) => ({
          currentSlide: state.currentSlide > 0 ? state.currentSlide - 1 : 0,
        })),

      // Settings Actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'vibe-presenter-pro-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useAppStore;

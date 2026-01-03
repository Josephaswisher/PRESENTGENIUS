/**
 * Slide Annotations Service
 * Handles per-slide drawing annotation persistence with Supabase (primary) and localStorage (fallback)
 *
 * Features:
 * - Per-slide stroke storage
 * - Supabase sync with offline fallback
 * - Auto-sync to cloud when connection restored
 * - localStorage as primary cache and offline backup
 */

import { supabase, isSupabaseConfigured, getCurrentUser } from '../lib/supabase/client';
import type { DrawingStroke } from '../components/DrawingCanvas';

export interface SlideAnnotation {
  id?: string;
  presentation_id: string;
  slide_index: number;
  strokes: DrawingStroke[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// localStorage key generator
const getLocalStorageKey = (presentationId: string, slideIndex: number) =>
  `annotations-${presentationId}-slide-${slideIndex}`;

/**
 * Load annotations for a specific slide
 * Tries Supabase first, falls back to localStorage
 */
export async function loadSlideAnnotations(
  presentationId: string,
  slideIndex: number
): Promise<DrawingStroke[]> {
  // Try localStorage first (immediate response)
  const localKey = getLocalStorageKey(presentationId, slideIndex);
  let localStrokes: DrawingStroke[] = [];

  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      localStrokes = JSON.parse(cached);
    }
  } catch (error) {
    console.warn('[Annotations] Failed to load from localStorage:', error);
  }

  // If Supabase is configured, try to sync from cloud
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();

      const { data, error } = await supabase!
        .from('slide_annotations')
        .select('strokes')
        .eq('presentation_id', presentationId)
        .eq('slide_index', slideIndex)
        .eq('created_by', user?.id || null)
        .single();

      if (!error && data) {
        // Update localStorage cache with cloud data
        const cloudStrokes = data.strokes as DrawingStroke[];
        localStorage.setItem(localKey, JSON.stringify(cloudStrokes));
        return cloudStrokes;
      }
    } catch (error) {
      console.warn('[Annotations] Failed to load from Supabase, using localStorage:', error);
    }
  }

  // Return local cache
  return localStrokes;
}

/**
 * Save annotations for a specific slide
 * Saves to localStorage immediately, then syncs to Supabase if available
 */
export async function saveSlideAnnotations(
  presentationId: string,
  slideIndex: number,
  strokes: DrawingStroke[]
): Promise<boolean> {
  const localKey = getLocalStorageKey(presentationId, slideIndex);

  // Save to localStorage immediately (for offline support)
  try {
    localStorage.setItem(localKey, JSON.stringify(strokes));
  } catch (error) {
    console.error('[Annotations] Failed to save to localStorage:', error);
    // Continue to try Supabase even if localStorage fails
  }

  // Sync to Supabase if available
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();

      const annotation: Partial<SlideAnnotation> = {
        presentation_id: presentationId,
        slide_index: slideIndex,
        strokes,
        created_by: user?.id || undefined,
      };

      const { error } = await supabase!
        .from('slide_annotations')
        .upsert(annotation, {
          onConflict: 'presentation_id,slide_index,created_by',
        });

      if (error) {
        console.warn('[Annotations] Failed to sync to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[Annotations] Supabase sync error:', error);
      return false;
    }
  }

  // Return true if localStorage succeeded (offline mode)
  return true;
}

/**
 * Clear annotations for a specific slide
 */
export async function clearSlideAnnotations(
  presentationId: string,
  slideIndex: number
): Promise<boolean> {
  const localKey = getLocalStorageKey(presentationId, slideIndex);

  // Clear from localStorage
  try {
    localStorage.removeItem(localKey);
  } catch (error) {
    console.warn('[Annotations] Failed to clear localStorage:', error);
  }

  // Clear from Supabase if available
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();

      const { error } = await supabase!
        .from('slide_annotations')
        .delete()
        .eq('presentation_id', presentationId)
        .eq('slide_index', slideIndex)
        .eq('created_by', user?.id || null);

      if (error) {
        console.warn('[Annotations] Failed to clear from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[Annotations] Supabase clear error:', error);
      return false;
    }
  }

  return true;
}

/**
 * Load all annotations for a presentation (all slides)
 */
export async function loadPresentationAnnotations(
  presentationId: string
): Promise<Map<number, DrawingStroke[]>> {
  const annotations = new Map<number, DrawingStroke[]>();

  // Try Supabase first if available
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();

      const { data, error } = await supabase!
        .from('slide_annotations')
        .select('slide_index, strokes')
        .eq('presentation_id', presentationId)
        .eq('created_by', user?.id || null);

      if (!error && data) {
        data.forEach((item) => {
          annotations.set(item.slide_index, item.strokes as DrawingStroke[]);
        });
        return annotations;
      }
    } catch (error) {
      console.warn('[Annotations] Failed to load all from Supabase:', error);
    }
  }

  // Fall back to localStorage (scan for all slides)
  // This is less efficient but works offline
  try {
    const prefix = `annotations-${presentationId}-slide-`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const slideIndex = parseInt(key.replace(prefix, ''));
        const data = localStorage.getItem(key);
        if (data) {
          annotations.set(slideIndex, JSON.parse(data));
        }
      }
    }
  } catch (error) {
    console.warn('[Annotations] Failed to scan localStorage:', error);
  }

  return annotations;
}

/**
 * Export all annotations for a presentation as JSON
 */
export async function exportPresentationAnnotations(
  presentationId: string
): Promise<string> {
  const annotations = await loadPresentationAnnotations(presentationId);
  const exportData: Record<number, DrawingStroke[]> = {};

  annotations.forEach((strokes, slideIndex) => {
    exportData[slideIndex] = strokes;
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import annotations for a presentation from JSON
 */
export async function importPresentationAnnotations(
  presentationId: string,
  jsonData: string
): Promise<boolean> {
  try {
    const importData = JSON.parse(jsonData) as Record<number, DrawingStroke[]>;

    for (const [slideIndexStr, strokes] of Object.entries(importData)) {
      const slideIndex = parseInt(slideIndexStr);
      await saveSlideAnnotations(presentationId, slideIndex, strokes);
    }

    return true;
  } catch (error) {
    console.error('[Annotations] Import failed:', error);
    return false;
  }
}

/**
 * Sync pending localStorage annotations to Supabase
 * Useful when connection is restored
 */
export async function syncLocalAnnotationsToSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  let synced = 0;

  try {
    const prefix = 'annotations-';
    const pendingSync: Array<{ presentationId: string; slideIndex: number; strokes: DrawingStroke[] }> = [];

    // Collect all local annotations
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          // Parse key: annotations-{presentationId}-slide-{slideIndex}
          const match = key.match(/annotations-(.+)-slide-(\d+)/);
          if (match) {
            const [, presentationId, slideIndexStr] = match;
            const slideIndex = parseInt(slideIndexStr);
            pendingSync.push({
              presentationId,
              slideIndex,
              strokes: JSON.parse(data),
            });
          }
        }
      }
    }

    // Sync each to Supabase
    for (const item of pendingSync) {
      const success = await saveSlideAnnotations(
        item.presentationId,
        item.slideIndex,
        item.strokes
      );
      if (success) synced++;
    }

    console.log(`[Annotations] Synced ${synced} slide annotations to Supabase`);
  } catch (error) {
    console.error('[Annotations] Sync to Supabase failed:', error);
  }

  return synced;
}

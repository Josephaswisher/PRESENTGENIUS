/**
 * localStorage Utility for PresentGenius
 *
 * Handles persistent storage of presentation history with:
 * - Quota management (keeps newest items if quota exceeded)
 * - Error handling for SSR compatibility
 * - JSON validation and recovery
 * - Deduplication by ID
 */

import { Creation } from '../components/CreationHistory';

const STORAGE_KEY = 'presentgenius_history';
const MAX_HISTORY_SIZE = 100; // Maximum number of presentations to keep
const QUOTA_BUFFER = 0.9; // Use 90% of available quota to leave some buffer

export interface StorageStats {
  itemCount: number;
  estimatedSize: number;
  maxSize: number;
  usagePercent: number;
}

/**
 * Check if localStorage is available (handles SSR)
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Estimate size of data in bytes (rough approximation)
 */
const estimateSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

/**
 * Get storage statistics
 */
export const getStorageStats = (): StorageStats => {
  if (!isLocalStorageAvailable()) {
    return { itemCount: 0, estimatedSize: 0, maxSize: 0, usagePercent: 0 };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    // Most browsers allow 5-10MB for localStorage
    // We'll estimate 5MB as a conservative limit
    const maxSize = 5 * 1024 * 1024;
    if (!data) {
      return { itemCount: 0, estimatedSize: 0, maxSize, usagePercent: 0 };
    }

    const parsed = JSON.parse(data);
    const size = estimateSize(parsed);

    return {
      itemCount: parsed.length,
      estimatedSize: parsed.length === 0 ? 0 : size,
      maxSize,
      usagePercent: parsed.length === 0 ? 0 : (size / maxSize) * 100,
    };
  } catch {
    return { itemCount: 0, estimatedSize: 0, maxSize: 0, usagePercent: 0 };
  }
};

/**
 * Load history from localStorage
 * Returns empty array if:
 * - localStorage is not available
 * - Data is corrupted
 * - No data exists
 */
export const loadHistory = (): Creation[] => {
  if (!isLocalStorageAvailable()) {
    console.warn('[Storage] localStorage not available (SSR or disabled)');
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    // Validate structure
    if (!Array.isArray(parsed)) {
      console.warn('[Storage] Invalid data structure, clearing storage');
      clearHistory();
      return [];
    }

    // Convert timestamp strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch (error) {
    console.error('[Storage] Failed to load history:', error);
    // Clear corrupted data
    clearHistory();
    return [];
  }
};

/**
 * Save history to localStorage with quota management
 *
 * If quota is exceeded:
 * 1. Removes oldest items until it fits
 * 2. Shows console warning with stats
 * 3. Returns success/failure status
 */
export const saveHistory = (history: Creation[]): { success: boolean; message?: string } => {
  if (!isLocalStorageAvailable()) {
    return { success: false, message: 'localStorage not available' };
  }

  try {
    // Limit to max history size
    let dataToSave = history.slice(0, MAX_HISTORY_SIZE);

    // Try to save
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

        // Success - log stats if we had to trim
        if (attempts > 0) {
          const stats = getStorageStats();
          console.warn(`[Storage] Trimmed to ${dataToSave.length} items (${Math.round(stats.estimatedSize / 1024)}KB)`);
          return {
            success: true,
            message: `Storage quota reached. Kept ${dataToSave.length} most recent presentations.`
          };
        }

        return { success: true };
      } catch (error: any) {
        // Quota exceeded - remove oldest 20% and try again
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          const removeCount = Math.ceil(dataToSave.length * 0.2);
          dataToSave = dataToSave.slice(0, -removeCount);
          attempts++;

          if (dataToSave.length === 0) {
            // Can't save anything - clear and fail
            clearHistory();
            return {
              success: false,
              message: 'Storage quota exceeded. History cleared. Please reduce file sizes or clear browser data.'
            };
          }
        } else {
          throw error; // Different error - rethrow
        }
      }
    }

    // Failed after max attempts
    return {
      success: false,
      message: `Could only save ${dataToSave.length} items due to storage limits.`
    };

  } catch (error) {
    console.error('[Storage] Failed to save history:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

/**
 * Clear all history from localStorage
 */
export const clearHistory = (): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Storage] History cleared');
  } catch (error) {
    console.error('[Storage] Failed to clear history:', error);
  }
};

/**
 * Merge local and remote history, removing duplicates by ID
 * Keeps the version with the most recent timestamp
 *
 * @param local - History from localStorage
 * @param remote - History from Supabase or other source
 * @returns Merged and deduplicated history, sorted by timestamp (newest first)
 */
export const mergeHistory = (local: Creation[], remote: Creation[]): Creation[] => {
  const merged = new Map<string, Creation>();

  // Add all items to map (later items overwrite if same ID)
  [...remote, ...local].forEach(item => {
    const existing = merged.get(item.id);

    if (!existing) {
      merged.set(item.id, item);
    } else {
      // Keep the version with the most recent timestamp
      const existingTime = existing.timestamp.getTime();
      const itemTime = item.timestamp.getTime();

      if (itemTime > existingTime) {
        merged.set(item.id, item);
      }
    }
  });

  // Convert to array and sort by timestamp (newest first)
  return Array.from(merged.values()).sort((a, b) =>
    b.timestamp.getTime() - a.timestamp.getTime()
  );
};

/**
 * Migrate old localStorage key to new key
 * Call this once on app initialization
 */
export const migrateOldStorage = (): void => {
  if (!isLocalStorageAvailable()) return;

  const oldKey = 'gemini_app_history';
  const oldData = localStorage.getItem(oldKey);

  if (oldData && !localStorage.getItem(STORAGE_KEY)) {
    try {
      // Copy old data to new key
      localStorage.setItem(STORAGE_KEY, oldData);
      // Remove old key
      localStorage.removeItem(oldKey);
      console.log('[Storage] Migrated from old storage key');
    } catch (error) {
      console.error('[Storage] Migration failed:', error);
    }
  }
};

/**
 * Get a single presentation by ID
 */
export const getPresentation = (id: string): Creation | null => {
  const history = loadHistory();
  return history.find(item => item.id === id) || null;
};

/**
 * Update a single presentation in history
 */
export const updatePresentation = (id: string, updates: Partial<Creation>): { success: boolean; message?: string } => {
  const history = loadHistory();
  const index = history.findIndex(item => item.id === id);

  if (index === -1) {
    return { success: false, message: 'Presentation not found' };
  }

  history[index] = { ...history[index], ...updates };
  return saveHistory(history);
};

/**
 * Delete a single presentation by ID
 */
export const deletePresentation = (id: string): { success: boolean; message?: string } => {
  const history = loadHistory();
  const filtered = history.filter(item => item.id !== id);

  if (filtered.length === history.length) {
    return { success: false, message: 'Presentation not found' };
  }

  return saveHistory(filtered);
};

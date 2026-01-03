/**
 * Hook for managing per-slide scroll position memory using sessionStorage
 * Scroll positions are cleared when the browser tab is closed
 */

import { useCallback } from 'react';

export interface UseSlideScrollMemoryReturn {
  saveScrollPosition: (slideIndex: number, position: number) => void;
  getScrollPosition: (slideIndex: number) => number;
  clearScrollMemory: () => void;
  clearSlideScrollPosition: (slideIndex: number) => void;
}

export function useSlideScrollMemory(storageKey: string): UseSlideScrollMemoryReturn {
  const saveScrollPosition = useCallback((slideIndex: number, position: number) => {
    try {
      const key = `${storageKey}-slide-${slideIndex}`;
      sessionStorage.setItem(key, position.toString());
    } catch (error) {
      console.warn('Failed to save scroll position to sessionStorage:', error);
    }
  }, [storageKey]);

  const getScrollPosition = useCallback((slideIndex: number): number => {
    try {
      const key = `${storageKey}-slide-${slideIndex}`;
      const saved = sessionStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('Failed to read scroll position from sessionStorage:', error);
      return 0;
    }
  }, [storageKey]);

  const clearScrollMemory = useCallback(() => {
    try {
      // Find all keys matching the pattern and remove them
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(storageKey)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear scroll memory:', error);
    }
  }, [storageKey]);

  const clearSlideScrollPosition = useCallback((slideIndex: number) => {
    try {
      const key = `${storageKey}-slide-${slideIndex}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear slide scroll position:', error);
    }
  }, [storageKey]);

  return {
    saveScrollPosition,
    getScrollPosition,
    clearScrollMemory,
    clearSlideScrollPosition,
  };
}

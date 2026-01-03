/**
 * Custom hook for managing presentation bookmarks
 * Supports 4 bookmark types: star, flag, question, important
 * Persists to localStorage with presentation-specific keys
 */
import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  slideIndex: number;
  type: 'star' | 'flag' | 'question' | 'important';
  note?: string;
  timestamp: number;
}

interface UseBookmarksProps {
  presentationId?: string;
}

export const useBookmarks = ({ presentationId = 'default' }: UseBookmarksProps = {}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const storageKey = `presentgenius-bookmarks-${presentationId}`;

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(storageKey);
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks) as Bookmark[];
        setBookmarks(parsed);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, [storageKey]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, [bookmarks, storageKey]);

  // Add or update a bookmark
  const addBookmark = useCallback((
    slideIndex: number,
    type: Bookmark['type'],
    note?: string
  ) => {
    setBookmarks(prev => {
      // Remove existing bookmark for this slide if any
      const filtered = prev.filter(b => b.slideIndex !== slideIndex);

      // Add new bookmark
      return [
        ...filtered,
        {
          slideIndex,
          type,
          note,
          timestamp: Date.now(),
        },
      ].sort((a, b) => a.slideIndex - b.slideIndex);
    });
  }, []);

  // Remove a bookmark by slide index
  const removeBookmark = useCallback((slideIndex: number) => {
    setBookmarks(prev => prev.filter(b => b.slideIndex !== slideIndex));
  }, []);

  // Update bookmark note
  const updateBookmarkNote = useCallback((slideIndex: number, note: string) => {
    setBookmarks(prev =>
      prev.map(b =>
        b.slideIndex === slideIndex
          ? { ...b, note, timestamp: Date.now() }
          : b
      )
    );
  }, []);

  // Get bookmark for a specific slide
  const getBookmark = useCallback(
    (slideIndex: number): Bookmark | undefined => {
      return bookmarks.find(b => b.slideIndex === slideIndex);
    },
    [bookmarks]
  );

  // Check if slide has a bookmark
  const hasBookmark = useCallback(
    (slideIndex: number): boolean => {
      return bookmarks.some(b => b.slideIndex === slideIndex);
    },
    [bookmarks]
  );

  // Get bookmarks by type
  const getBookmarksByType = useCallback(
    (type: Bookmark['type']): Bookmark[] => {
      return bookmarks.filter(b => b.type === type);
    },
    [bookmarks]
  );

  // Clear all bookmarks
  const clearAllBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  // Export bookmarks as JSON
  const exportBookmarks = useCallback((): string => {
    return JSON.stringify(bookmarks, null, 2);
  }, [bookmarks]);

  // Import bookmarks from JSON
  const importBookmarks = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString) as Bookmark[];

      // Validate structure
      if (!Array.isArray(imported)) {
        throw new Error('Invalid bookmarks format');
      }

      for (const bookmark of imported) {
        if (
          typeof bookmark.slideIndex !== 'number' ||
          !['star', 'flag', 'question', 'important'].includes(bookmark.type) ||
          typeof bookmark.timestamp !== 'number'
        ) {
          throw new Error('Invalid bookmark structure');
        }
      }

      setBookmarks(imported.sort((a, b) => a.slideIndex - b.slideIndex));
      return true;
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      return false;
    }
  }, []);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkNote,
    getBookmark,
    hasBookmark,
    getBookmarksByType,
    clearAllBookmarks,
    exportBookmarks,
    importBookmarks,
  };
};

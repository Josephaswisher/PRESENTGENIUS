/**
 * Storage Utility Tests
 *
 * Tests for localStorage persistence:
 * - Save/load history
 * - Quota management
 * - Merging with no duplicates
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadHistory,
  saveHistory,
  clearHistory,
  mergeHistory,
  getStorageStats,
  migrateOldStorage,
} from '../lib/storage';
import { Creation } from '../components/CreationHistory';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to create mock creation
const createMockCreation = (id: string, name: string, timestamp?: Date): Creation => ({
  id,
  name,
  html: `<html><body><h1>${name}</h1></body></html>`,
  timestamp: timestamp || new Date(),
});

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('loadHistory', () => {
    it('should return empty array when no data exists', () => {
      const history = loadHistory();
      expect(history).toEqual([]);
    });

    it('should load and parse history correctly', () => {
      const mockData = [
        createMockCreation('1', 'Test 1'),
        createMockCreation('2', 'Test 2'),
      ];

      localStorage.setItem('presentgenius_history', JSON.stringify(mockData));

      const history = loadHistory();
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('1');
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('presentgenius_history', 'invalid json');

      const history = loadHistory();
      expect(history).toEqual([]);
      expect(localStorage.getItem('presentgenius_history')).toBeNull();
    });

    it('should clear storage if data is not an array', () => {
      localStorage.setItem('presentgenius_history', JSON.stringify({ invalid: 'structure' }));

      const history = loadHistory();
      expect(history).toEqual([]);
      expect(localStorage.getItem('presentgenius_history')).toBeNull();
    });
  });

  describe('saveHistory', () => {
    it('should save history successfully', () => {
      const mockData = [createMockCreation('1', 'Test 1')];

      const result = saveHistory(mockData);

      expect(result.success).toBe(true);
      expect(localStorage.getItem('presentgenius_history')).toBeTruthy();
    });

    it('should limit history to MAX_HISTORY_SIZE', () => {
      // Create 150 items (exceeds MAX of 100)
      const mockData = Array.from({ length: 150 }, (_, i) =>
        createMockCreation(`${i}`, `Test ${i}`)
      );

      saveHistory(mockData);
      const loaded = loadHistory();

      expect(loaded.length).toBeLessThanOrEqual(100);
    });
  });

  describe('mergeHistory', () => {
    it('should merge without duplicates', () => {
      const local = [
        createMockCreation('1', 'Local 1'),
        createMockCreation('2', 'Local 2'),
      ];

      const remote = [
        createMockCreation('2', 'Remote 2 (updated)'),
        createMockCreation('3', 'Remote 3'),
      ];

      const merged = mergeHistory(local, remote);

      expect(merged).toHaveLength(3);
      expect(merged.find(c => c.id === '1')).toBeTruthy();
      expect(merged.find(c => c.id === '2')).toBeTruthy();
      expect(merged.find(c => c.id === '3')).toBeTruthy();
    });

    it('should keep most recent version on conflict', () => {
      const older = new Date('2024-01-01');
      const newer = new Date('2024-12-01');

      const local = [createMockCreation('1', 'Old Version', older)];
      const remote = [createMockCreation('1', 'New Version', newer)];

      const merged = mergeHistory(local, remote);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe('New Version');
    });

    it('should sort by timestamp (newest first)', () => {
      const local = [
        createMockCreation('1', 'Oldest', new Date('2024-01-01')),
        createMockCreation('2', 'Newest', new Date('2024-12-01')),
      ];

      const remote = [
        createMockCreation('3', 'Middle', new Date('2024-06-01')),
      ];

      const merged = mergeHistory(local, remote);

      expect(merged[0].name).toBe('Newest');
      expect(merged[1].name).toBe('Middle');
      expect(merged[2].name).toBe('Oldest');
    });
  });

  describe('clearHistory', () => {
    it('should remove history from localStorage', () => {
      const mockData = [createMockCreation('1', 'Test 1')];
      saveHistory(mockData);

      expect(localStorage.getItem('presentgenius_history')).toBeTruthy();

      clearHistory();

      expect(localStorage.getItem('presentgenius_history')).toBeNull();
    });
  });

  describe('getStorageStats', () => {
    it('should return stats for stored data', () => {
      const mockData = [
        createMockCreation('1', 'Test 1'),
        createMockCreation('2', 'Test 2'),
      ];

      saveHistory(mockData);
      const stats = getStorageStats();

      expect(stats.itemCount).toBe(2);
      expect(stats.estimatedSize).toBeGreaterThan(0);
      expect(stats.usagePercent).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats when no data', () => {
      const stats = getStorageStats();

      expect(stats.itemCount).toBe(0);
      expect(stats.estimatedSize).toBe(0);
    });
  });

  describe('migrateOldStorage', () => {
    it('should migrate from old key to new key', () => {
      const mockData = [createMockCreation('1', 'Old Test')];
      localStorage.setItem('gemini_app_history', JSON.stringify(mockData));

      migrateOldStorage();

      expect(localStorage.getItem('presentgenius_history')).toBeTruthy();
      expect(localStorage.getItem('gemini_app_history')).toBeNull();
    });

    it('should not migrate if new key already exists', () => {
      const oldData = [createMockCreation('1', 'Old')];
      const newData = [createMockCreation('2', 'New')];

      localStorage.setItem('gemini_app_history', JSON.stringify(oldData));
      localStorage.setItem('presentgenius_history', JSON.stringify(newData));

      migrateOldStorage();

      const loaded = loadHistory();
      expect(loaded[0].id).toBe('2'); // Should keep new data
    });
  });
});

/**
 * Local Storage Persistence Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Local Storage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve data', () => {
    const key = 'test-key';
    const value = { name: 'Test', html: '<h1>Hello</h1>' };

    localStorage.setItem(key, JSON.stringify(value));
    const retrieved = JSON.parse(localStorage.getItem(key) || '{}');

    expect(retrieved.name).toBe(value.name);
    expect(retrieved.html).toBe(value.html);
  });

  it('should handle creation history storage', () => {
    const historyKey = 'presentgenius-history';
    const history = [
      { id: '1', name: 'Presentation 1', html: '<html></html>' },
      { id: '2', name: 'Presentation 2', html: '<html></html>' },
    ];

    localStorage.setItem(historyKey, JSON.stringify(history));
    const retrieved = JSON.parse(localStorage.getItem(historyKey) || '[]');

    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].id).toBe('1');
  });

  it('should handle settings persistence', () => {
    const settingsKey = 'presentgenius-settings';
    const settings = {
      theme: 'dark',
      autoSaveEnabled: true,
      autoSaveInterval: 30000,
      defaultLearnerLevel: 'resident',
    };

    localStorage.setItem(settingsKey, JSON.stringify(settings));
    const retrieved = JSON.parse(localStorage.getItem(settingsKey) || '{}');

    expect(retrieved.theme).toBe('dark');
    expect(retrieved.autoSaveEnabled).toBe(true);
  });

  it('should handle large HTML content', () => {
    const largeHtml = '<html>' + 'a'.repeat(100000) + '</html>';
    const key = 'large-presentation';

    localStorage.setItem(key, largeHtml);
    const retrieved = localStorage.getItem(key);

    expect(retrieved).toBe(largeHtml);
    expect(retrieved?.length).toBeGreaterThan(100000);
  });

  it('should clear specific keys', () => {
    localStorage.setItem('keep-this', 'value1');
    localStorage.setItem('remove-this', 'value2');

    localStorage.removeItem('remove-this');

    expect(localStorage.getItem('keep-this')).toBe('value1');
    expect(localStorage.getItem('remove-this')).toBeNull();
  });
});

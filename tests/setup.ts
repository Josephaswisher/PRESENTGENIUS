/**
 * Vitest Test Setup
 */
import { vi } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location for environment checks
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    hostname: 'localhost',
  },
  writable: true,
});

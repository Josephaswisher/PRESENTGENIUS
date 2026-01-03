/**
 * Error Handler Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createUserFriendlyError,
  formatErrorMessage,
  isRetryableError,
  getRetryDelay,
  OpenRouterErrorType,
  toLegacyError,
} from '../services/error-handler';

describe('Error Handler', () => {
  describe('createUserFriendlyError', () => {
    it('handles network errors', () => {
      const error = new TypeError('fetch failed');
      const result = createUserFriendlyError(error, { provider: 'DeepSeek' });
      expect(result.retryable).toBe(true);
      expect(result.severity).toBe('error');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('handles authentication errors', () => {
      const result = createUserFriendlyError({ message: 'Unauthorized', status: 401 }, { provider: 'MiniMax' });
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.userMessage.toLowerCase()).toContain('key');
    });

    it('handles rate limit errors', () => {
      const result = createUserFriendlyError({ message: 'Rate limit exceeded', status: 429 }, { statusCode: 429 });
      expect(result.retryable).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('handles invalid request errors', () => {
      const result = createUserFriendlyError({ message: 'Invalid request', status: 400 }, { statusCode: 400 });
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('handles payload too large errors', () => {
      const result = createUserFriendlyError({ message: 'Payload too large', status: 413 }, { statusCode: 413 });
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('handles timeout errors', () => {
      const result = createUserFriendlyError(new Error('Request timed out'));
      expect(result.retryable).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('handles server errors', () => {
      const result = createUserFriendlyError({ message: 'Internal server error', status: 503 }, { statusCode: 503 });
      expect(result.retryable).toBe(true);
    });

    it('handles API key missing errors', () => {
      const result = createUserFriendlyError(new Error('API key not configured'), { provider: 'DeepSeek' });
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('handles model not found errors', () => {
      const result = createUserFriendlyError(new Error('Model not found'));
      expect(result.retryable).toBe(false);
    });
  });

  describe('formatErrorMessage', () => {
    it('formats error with suggestions', () => {
      const error = {
        userMessage: 'Something went wrong',
        technicalMessage: 'Technical details',
        suggestions: ['Try this', 'Or try that'],
        retryable: true,
        severity: 'error' as const,
      };
      const formatted = formatErrorMessage(error);
      expect(formatted).toContain('Something went wrong');
      expect(formatted).toContain('Troubleshooting steps');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for retryable errors', () => {
      const error = { userMessage: 'Error', technicalMessage: '', suggestions: [], retryable: true, severity: 'error' as const };
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const error = { userMessage: 'Error', technicalMessage: '', suggestions: [], retryable: false, severity: 'error' as const };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('implements exponential backoff', () => {
      const delay1 = getRetryDelay(1, 1000);
      const delay2 = getRetryDelay(2, 1000);
      const delay3 = getRetryDelay(3, 1000);
      expect(delay1).toBeGreaterThan(1000);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('caps delay at 30 seconds', () => {
      const delay = getRetryDelay(10, 1000);
      expect(delay).toBeLessThanOrEqual(36000);
    });
  });

  describe('toLegacyError', () => {
    it('converts network error to legacy format', () => {
      const error = createUserFriendlyError(new TypeError('fetch failed'));
      const legacy = toLegacyError(error);
      expect(legacy.type).toBe(OpenRouterErrorType.NETWORK_ERROR);
      expect(legacy.retryable).toBe(true);
    });

    it('converts auth error to legacy format', () => {
      const error = createUserFriendlyError({ message: 'Invalid API key', status: 401 }, { statusCode: 401 });
      const legacy = toLegacyError(error, 401);
      expect(legacy.type).toBe(OpenRouterErrorType.AUTH_ERROR);
      expect(legacy.retryable).toBe(false);
    });

    it('converts rate limit error to legacy format', () => {
      const error = createUserFriendlyError({ message: 'Rate limit', status: 429 }, { statusCode: 429 });
      const legacy = toLegacyError(error, 429);
      expect(legacy.type).toBe(OpenRouterErrorType.RATE_LIMIT);
      expect(legacy.retryable).toBe(true);
    });
  });
});

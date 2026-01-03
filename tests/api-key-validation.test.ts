/**
 * API Key Validation Service Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Key Validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('VITE_GLM_API_KEY', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAPIKeys', () => {
    it('returns valid result with default test env', async () => {
      const { validateAPIKeys } = await import('../services/api-key-validation');
      const result = validateAPIKeys();
      expect(result.isValid).toBe(true);
      expect(['claude', 'gemini', 'glm', 'minimax', 'deepseek']).toContain(result.provider);
    });

    it('prefers GLM key when provided', async () => {
      vi.stubEnv('VITE_GLM_API_KEY', 'glm-valid-key-1234567890');
      const { validateAPIKeys } = await import('../services/api-key-validation');
      const result = validateAPIKeys();
      expect(result.provider).toBe('glm');
    });
  });

  describe('Error Classification', () => {
    it('classifies network errors correctly', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new TypeError('Failed to fetch'), undefined);
      expect(error.type).toBe(OpenRouterErrorType.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('classifies 401 errors as authentication errors', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Unauthorized'), 401);
      expect(error.type).toBe(OpenRouterErrorType.AUTH_ERROR);
      expect(error.retryable).toBe(false);
    });

    it('classifies 429 errors as rate limit errors', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Rate limit exceeded'), 429);
      expect(error.type).toBe(OpenRouterErrorType.RATE_LIMIT);
      expect(error.retryable).toBe(true);
    });

    it('classifies 400 errors as invalid request', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Invalid request'), 400);
      expect(error.type).toBe(OpenRouterErrorType.INVALID_REQUEST);
      expect(error.retryable).toBe(false);
    });

    it('classifies 500 errors as server errors', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Internal server error'), 500);
      expect(error.type).toBe(OpenRouterErrorType.SERVER_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('classifies timeout errors correctly', async () => {
      const { classifyOpenRouterError, OpenRouterErrorType } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Request timed out'));
      expect(error.type).toBe(OpenRouterErrorType.TIMEOUT);
      expect(error.retryable).toBe(true);
    });

    it('provides suggestions for each error type', async () => {
      const { classifyOpenRouterError } = await import('../services/api-key-validation');
      const error = classifyOpenRouterError(new Error('Test error'));
      expect(error.suggestions).toBeDefined();
      expect(Array.isArray(error.suggestions)).toBe(true);
      expect(error.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Retry Logic', () => {
    it('returns true for retryable error types', async () => {
      const { isRetryableError, classifyOpenRouterError } = await import('../services/api-key-validation');
      const networkError = classifyOpenRouterError(new TypeError('Network error'));
      const rateLimitError = classifyOpenRouterError(new Error('Rate limit'), 429);
      const serverError = classifyOpenRouterError(new Error('Server error'), 500);
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(rateLimitError)).toBe(true);
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('returns false for non-retryable error types', async () => {
      const { isRetryableError, classifyOpenRouterError } = await import('../services/api-key-validation');
      const authError = classifyOpenRouterError(new Error('Unauthorized'), 401);
      const invalidError = classifyOpenRouterError(new Error('Bad request'), 400);
      expect(isRetryableError(authError)).toBe(false);
      expect(isRetryableError(invalidError)).toBe(false);
    });

    it('calculates increasing delay with jitter', async () => {
      const { getRetryDelay } = await import('../services/api-key-validation');
      const delay1 = getRetryDelay(0);
      const delay2 = getRetryDelay(1);
      const delay3 = getRetryDelay(2);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(5000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(9000);
    });

    it('caps delay at 30 seconds', async () => {
      const { getRetryDelay } = await import('../services/api-key-validation');
      const delay = getRetryDelay(10);
      expect(delay).toBeLessThanOrEqual(31000);
    });
  });

  describe('Setup Instructions', () => {
    it('returns non-empty setup instructions', async () => {
      const { getSetupInstructions } = await import('../services/api-key-validation');
      const instructions = getSetupInstructions();
      expect(typeof instructions).toBe('string');
      expect(instructions.length).toBeGreaterThan(100);
      expect(instructions).toContain('GLM');
      expect(instructions).toContain('API key');
    });
  });
});

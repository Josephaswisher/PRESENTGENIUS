/**
 * Retry Logic Tests
 */
import { describe, it, expect, vi } from 'vitest';

describe('Retry Logic', () => {
  it('should export retry utilities', async () => {
    const retry = await import('../lib/retry');

    expect(retry.withRetry).toBeDefined();
    expect(retry.createRetryableFunction).toBeDefined();
  });

  it('should succeed on first try without retrying', async () => {
    const retry = await import('../lib/retry');

    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retry.withRetry(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable failure and succeed', async () => {
    const retry = await import('../lib/retry');

    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('429 rate limit'));
      }
      return Promise.resolve('success');
    });

    const result = await retry.withRetry(mockFn, { maxRetries: 3, baseDelay: 10 });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const retry = await import('../lib/retry');

    const mockFn = vi.fn().mockRejectedValue(new Error('Invalid API key'));

    await expect(
      retry.withRetry(mockFn, { maxRetries: 3, baseDelay: 10 })
    ).rejects.toThrow('Invalid API key');

    // Should not retry since "Invalid API key" is not retryable
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries for retryable errors', async () => {
    const retry = await import('../lib/retry');

    const mockFn = vi.fn().mockRejectedValue(new Error('500 server error'));

    await expect(
      retry.withRetry(mockFn, { maxRetries: 2, baseDelay: 10 })
    ).rejects.toThrow('500 server error');

    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should call onRetry callback', async () => {
    const retry = await import('../lib/retry');

    const onRetry = vi.fn();
    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject(new Error('503 service unavailable'));
      }
      return Promise.resolve('success');
    });

    await retry.withRetry(mockFn, { maxRetries: 3, baseDelay: 10, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

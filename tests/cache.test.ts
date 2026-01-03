/**
 * Cache Service Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    import.meta.env.VITE_ENABLE_PROMPT_CACHE = 'true';
    localStorage.setItem('presentgenius_prompt_cache_opt_in', 'true');
  });

  it('should export cache functions', async () => {
    const cache = await import('../services/cache');

    expect(cache.getCachedResponse).toBeDefined();
    expect(cache.setCachedResponse).toBeDefined();
    expect(cache.clearCache).toBeDefined();
  });

  it('should return null for cache miss', async () => {
    const cache = await import('../services/cache');

    const result = await cache.getCachedResponse('nonexistent-prompt', 'gemini');

    expect(result).toBeNull();
  });

  it('should store and retrieve cached response', async () => {
    const cache = await import('../services/cache');

    const prompt = 'Test prompt for caching';
    const response = '<html><body>Cached Content</body></html>';
    const provider = 'gemini';

    await cache.setCachedResponse(prompt, response, provider);
    const cached = await cache.getCachedResponse(prompt, provider);

    expect(cached).toBe(response);
  });

  it('should separate cache by provider', async () => {
    const cache = await import('../services/cache');

    const prompt = 'Same prompt';
    const geminiResponse = '<html>Gemini response</html>';
    const opusResponse = '<html>Opus response</html>';

    await cache.setCachedResponse(prompt, geminiResponse, 'gemini');
    await cache.setCachedResponse(prompt, opusResponse, 'opus');

    expect(await cache.getCachedResponse(prompt, 'gemini')).toBe(geminiResponse);
    expect(await cache.getCachedResponse(prompt, 'opus')).toBe(opusResponse);
  });

  it('should clear all cache', async () => {
    const cache = await import('../services/cache');

    await cache.setCachedResponse('prompt1', 'response1', 'gemini');
    await cache.setCachedResponse('prompt2', 'response2', 'opus');

    cache.clearCache();

    expect(await cache.getCachedResponse('prompt1', 'gemini')).toBeNull();
    expect(await cache.getCachedResponse('prompt2', 'opus')).toBeNull();
  });
});

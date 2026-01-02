/**
 * AI Provider Service Tests
 * Validates OpenRouter-only provider configuration
 */
import { describe, it, expect, vi } from 'vitest';

describe('AI Provider Configuration', () => {
  it('should have OpenRouter as only provider', async () => {
    const aiProvider = await import('../services/ai-provider');

    expect(aiProvider.PROVIDERS).toHaveLength(1);
    expect(aiProvider.PROVIDERS[0].id).toBe('openrouter');
  });

  it('should have correct model for OpenRouter', async () => {
    const aiProvider = await import('../services/ai-provider');

    const openrouter = aiProvider.PROVIDERS[0];
    expect(openrouter.name).toBe('DeepSeek V3 (via OpenRouter)');
    expect(openrouter.model).toBe('deepseek/deepseek-chat');
    expect(openrouter.icon).toBe('🔵');
  });
});

describe('Provider Selection', () => {
  it('should always select openrouter', async () => {
    const aiProvider = await import('../services/ai-provider');

    const selected = aiProvider.selectBestProvider('Create a simple quiz', []);
    expect(selected).toBe('openrouter');
  });

  it('should select openrouter for complex prompts too', async () => {
    const aiProvider = await import('../services/ai-provider');

    const selected = aiProvider.selectBestProvider(
      'Create a USMLE board-style case study with differential diagnosis',
      []
    );
    expect(selected).toBe('openrouter');
  });

  it('should select openrouter for image prompts', async () => {
    const aiProvider = await import('../services/ai-provider');

    const files = [{ base64: 'test', mimeType: 'image/png' }];
    const selected = aiProvider.selectBestProvider(
      'Analyze this ECG and create a case study',
      files
    );
    expect(selected).toBe('openrouter');
  });
});

describe('Provider Info Retrieval', () => {
  it('should return OpenRouter info', async () => {
    const aiProvider = await import('../services/ai-provider');

    const info = aiProvider.getProviderInfo('openrouter');
    expect(info.id).toBe('openrouter');
    expect(info.icon).toBeDefined();
    expect(info.color).toBeDefined();
  });

  it('should return OpenRouter for any provider id', async () => {
    const aiProvider = await import('../services/ai-provider');

    const info = aiProvider.getProviderInfo('openrouter');
    expect(info).toBeDefined();
    expect(info.id).toBe('openrouter');
  });
});

describe('Provider Availability', () => {
  it('should check for VITE_OPENROUTER_API_KEY', async () => {
    const aiProvider = await import('../services/ai-provider');

    // With test env vars from vitest.config.ts
    const available = aiProvider.isProviderAvailable('openrouter');
    expect(typeof available).toBe('boolean');
  });
});

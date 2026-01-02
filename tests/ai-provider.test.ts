/**
 * AI Provider Service Tests
 * Validates provider selection and configuration
 */
import { describe, it, expect, vi } from 'vitest';

describe('AI Provider Configuration', () => {
  it('should have correct provider list', async () => {
    const aiProvider = await import('../services/ai-provider');

    const providerIds = aiProvider.PROVIDERS.map(p => p.id);

    expect(providerIds).toContain('auto');
    expect(providerIds).toContain('gemini');
    expect(providerIds).toContain('claude');
    expect(providerIds).toContain('opus');
    expect(providerIds).toContain('openrouter');
    expect(providerIds).toContain('dual');
  });

  it('should have correct model names for providers', async () => {
    const aiProvider = await import('../services/ai-provider');

    const gemini = aiProvider.PROVIDERS.find(p => p.id === 'gemini');
    expect(gemini?.name).toBe('Gemini 2.0 Flash');

    const claude = aiProvider.PROVIDERS.find(p => p.id === 'claude');
    expect(claude?.name).toBe('Claude Sonnet 4');

    const opus = aiProvider.PROVIDERS.find(p => p.id === 'opus');
    expect(opus?.name).toBe('Claude Opus 4');
  });
});

describe('Provider Auto-Selection', () => {
  it('should select gemini for simple prompts', async () => {
    const aiProvider = await import('../services/ai-provider');

    const selected = aiProvider.selectBestProvider('Create a simple quiz', []);
    expect(selected).toBe('gemini');
  });

  it('should select opus for complex medical content', async () => {
    const aiProvider = await import('../services/ai-provider');

    const selected = aiProvider.selectBestProvider(
      'Create a USMLE board-style case study with differential diagnosis',
      []
    );
    expect(selected).toBe('opus');
  });

  it('should select dual for images with complex content', async () => {
    const aiProvider = await import('../services/ai-provider');

    const files = [{ base64: 'test', mimeType: 'image/png' }];
    const selected = aiProvider.selectBestProvider(
      'Analyze this ECG and create a comprehensive case study with algorithm explanations',
      files
    );
    expect(selected).toBe('dual');
  });
});

describe('Provider Info Retrieval', () => {
  it('should return provider info by id', async () => {
    const aiProvider = await import('../services/ai-provider');

    const geminiInfo = aiProvider.getProviderInfo('gemini');
    expect(geminiInfo.id).toBe('gemini');
    expect(geminiInfo.icon).toBeDefined();
    expect(geminiInfo.color).toBeDefined();
  });

  it('should return default provider for unknown id', async () => {
    const aiProvider = await import('../services/ai-provider');

    const unknownInfo = aiProvider.getProviderInfo('unknown' as any);
    expect(unknownInfo).toBeDefined();
    expect(unknownInfo.id).toBe('auto');
  });
});

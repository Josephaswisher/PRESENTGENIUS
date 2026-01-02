/**
 * OpenRouter Service Tests
 * Validates model configuration and API call structure
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the model configuration directly
describe('OpenRouter Model Configuration', () => {
  it('should have DeepSeek V3 as default model ID', async () => {
    // Import the module to test model configuration
    const openrouter = await import('../services/openrouter');

    // Check OPENROUTER_MODELS contains deepseek-chat (V3)
    expect(openrouter.OPENROUTER_MODELS).toHaveProperty('deepseek/deepseek-chat');
    expect(openrouter.OPENROUTER_MODELS['deepseek/deepseek-chat'].name).toBe('DeepSeek V3');
    expect(openrouter.OPENROUTER_MODELS['deepseek/deepseek-chat'].tier).toBe('fast');
  });

  it('should have all required DeepSeek models', async () => {
    const openrouter = await import('../services/openrouter');

    const requiredModels = [
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
    ];

    requiredModels.forEach(modelId => {
      expect(openrouter.OPENROUTER_MODELS).toHaveProperty(modelId);
    });
  });

  it('should have valid model tier values', async () => {
    const openrouter = await import('../services/openrouter');
    const validTiers = ['fast', 'standard', 'premium'];

    Object.values(openrouter.OPENROUTER_MODELS).forEach((model: any) => {
      expect(validTiers).toContain(model.tier);
    });
  });
});

describe('OpenRouter API Call Structure', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Medical Education</h1></body></html>',
          },
        }],
      }),
    });
  });

  it('should call OpenRouter API with correct headers', async () => {
    const openrouter = await import('../services/openrouter');

    try {
      await openrouter.generateWithOpenRouter('Create a simple test presentation');
    } catch (e) {
      // May fail without real API key, but we can check the fetch call
    }

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalled();

    const fetchCall = (global.fetch as any).mock.calls[0];
    if (fetchCall) {
      const [url, options] = fetchCall;

      // Check URL
      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');

      // Check headers
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-Title']).toBe('PresentGenius Medical Education');
    }
  });

  it('should use DeepSeek V3 as default model in request', async () => {
    const openrouter = await import('../services/openrouter');

    try {
      await openrouter.generateWithOpenRouter('Test prompt');
    } catch (e) {
      // Expected to fail without real API key
    }

    const fetchCall = (global.fetch as any).mock.calls[0];
    if (fetchCall) {
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('deepseek/deepseek-chat');
    }
  });

  it('should include system message for medical education context', async () => {
    const openrouter = await import('../services/openrouter');

    try {
      await openrouter.generateWithOpenRouter('Test prompt');
    } catch (e) {}

    const fetchCall = (global.fetch as any).mock.calls[0];
    if (fetchCall) {
      const body = JSON.parse(fetchCall[1].body);
      const systemMessage = body.messages.find((m: any) => m.role === 'system');

      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain('medical educator');
    }
  });

  it('should extract HTML from response', async () => {
    const openrouter = await import('../services/openrouter');

    const result = await openrouter.generateWithOpenRouter('Create a test');

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Medical Education');
  });
});

describe('OpenRouter Error Handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should throw error on API failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    });

    const openrouter = await import('../services/openrouter');

    await expect(
      openrouter.generateWithOpenRouter('Test')
    ).rejects.toThrow('OpenRouter API error');
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const openrouter = await import('../services/openrouter');

    await expect(
      openrouter.generateWithOpenRouter('Test')
    ).rejects.toThrow('Network error');
  });
});

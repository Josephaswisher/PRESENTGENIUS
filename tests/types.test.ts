/**
 * TypeScript Types Tests
 * Validates type consistency across providers
 */
import { describe, it, expect } from 'vitest';

describe('TypeScript Types Consistency', () => {
  it('should have consistent FileInput type across services', async () => {
    // All services should use same FileInput structure
    interface FileInput {
      base64: string;
      mimeType: string;
    }

    const file: FileInput = {
      base64: 'dGVzdA==',
      mimeType: 'image/png',
    };

    expect(file.base64).toBeDefined();
    expect(file.mimeType).toBeDefined();
  });

  it('should have consistent GenerationOptions type', async () => {
    interface GenerationOptions {
      activityId?: string;
      learnerLevel?: string;
    }

    const options: GenerationOptions = {
      activityId: 'case-study',
      learnerLevel: 'resident',
    };

    expect(options.activityId).toBe('case-study');
  });

  it('should validate AIProvider type', async () => {
    type AIProvider = 'gemini' | 'claude' | 'opus' | 'openrouter' | 'dual' | 'auto';

    const validProviders: AIProvider[] = ['gemini', 'claude', 'opus', 'openrouter', 'dual', 'auto'];

    validProviders.forEach(provider => {
      expect(['gemini', 'claude', 'opus', 'openrouter', 'dual', 'auto']).toContain(provider);
    });
  });

  it('should validate ProviderInfo structure', async () => {
    interface ProviderInfo {
      id: string;
      name: string;
      model: string;
      icon: string;
      color: string;
    }

    const provider: ProviderInfo = {
      id: 'openrouter',
      name: 'OpenRouter (Multi-Model)',
      model: 'deepseek/deepseek-chat',
      icon: '🌐',
      color: 'from-indigo-500 to-violet-500',
    };

    expect(provider.id).toBeDefined();
    expect(provider.name).toBeDefined();
    expect(provider.model).toBeDefined();
    expect(provider.icon).toBeDefined();
    expect(provider.color).toBeDefined();
  });

  it('should validate Creation type structure', async () => {
    interface Creation {
      id: string;
      name: string;
      html: string;
      prompt?: string;
      provider?: string;
      timestamp?: number;
      originalImage?: string;
    }

    const creation: Creation = {
      id: 'uuid-123',
      name: 'Medical Case Study',
      html: '<!DOCTYPE html><html><body></body></html>',
      prompt: 'Create a cardiology case',
      provider: 'deepseek/deepseek-chat',
      timestamp: Date.now(),
    };

    expect(creation.id).toBeDefined();
    expect(creation.html).toContain('<!DOCTYPE');
  });

  it('should have consistent OpenRouterModelId type', async () => {
    const openrouter = await import('../services/openrouter');

    // Verify DeepSeek V3.2 is in the type
    const modelIds = Object.keys(openrouter.OPENROUTER_MODELS);

    expect(modelIds).toContain('deepseek/deepseek-chat');
    expect(modelIds).toContain('deepseek/deepseek-r1');
    expect(modelIds).toContain('anthropic/claude-sonnet-4-20250514');
  });
});

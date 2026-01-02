/**
 * Model Configuration Tests
 * Validates AI model IDs and configuration
 */
import { describe, it, expect } from 'vitest';

describe('AI Models Configuration', () => {
  it('should have correct Gemini model ID', async () => {
    const models = await import('../config/models');

    expect(models.AI_MODELS.gemini.id).toBe('gemini-2.0-flash');
    expect(models.AI_MODELS.gemini.provider).toBe('google');
  });

  it('should have correct Claude Sonnet 4 model ID', async () => {
    const models = await import('../config/models');

    expect(models.AI_MODELS.claude.id).toBe('anthropic/claude-sonnet-4-20250514');
    expect(models.AI_MODELS.claude.provider).toBe('openrouter');
  });

  it('should have correct Claude Opus 4 model ID', async () => {
    const models = await import('../config/models');

    expect(models.AI_MODELS.opus.id).toBe('anthropic/claude-opus-4-20250514');
    expect(models.AI_MODELS.opus.provider).toBe('openrouter');
  });

  it('should return model ID via getModelId helper', async () => {
    const models = await import('../config/models');

    expect(models.getModelId('gemini')).toBe('gemini-2.0-flash');
    expect(models.getModelId('claude')).toBe('anthropic/claude-sonnet-4-20250514');
    expect(models.getModelId('opus')).toBe('anthropic/claude-opus-4-20250514');
  });

  it('should have valid pricing information', async () => {
    const models = await import('../config/models');

    Object.values(models.AI_MODELS).forEach((model) => {
      expect(model.maxTokens).toBeGreaterThan(0);
      if (model.inputCostPer1M !== undefined) {
        expect(model.inputCostPer1M).toBeGreaterThanOrEqual(0);
      }
      if (model.outputCostPer1M !== undefined) {
        expect(model.outputCostPer1M).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Model Configuration Helpers', () => {
  it('should return full config via getModelConfig', async () => {
    const models = await import('../config/models');

    const config = models.getModelConfig('gemini');

    expect(config).toHaveProperty('id');
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('maxTokens');
  });
});

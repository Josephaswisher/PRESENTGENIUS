/**
 * Environment Validator Tests
 */
import { describe, it, expect } from 'vitest';

describe('Environment Validator', () => {
  it('should validate env module exists', async () => {
    const validator = await import('../lib/env-validator');
    expect(validator.validateEnv).toBeDefined();
    expect(validator.logEnvStatus).toBeDefined();
    expect(validator.getMissingConfigMessage).toBeDefined();
  });

  it('should return valid result with mocked env vars', async () => {
    const validator = await import('../lib/env-validator');
    const result = validator.validateEnv();

    // With test env vars from vitest.config.ts
    expect(result.hasAnyProvider).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it('should detect configured providers', async () => {
    const validator = await import('../lib/env-validator');
    const result = validator.validateEnv();

    expect(result.configured.length).toBeGreaterThan(0);
  });

  it('should check specific provider availability', async () => {
    const validator = await import('../lib/env-validator');

    // These are mocked in vitest.config.ts
    expect(validator.isProviderConfigured('openrouter')).toBe(true);
    expect(validator.isProviderConfigured('gemini')).toBe(true);
  });
});

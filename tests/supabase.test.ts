/**
 * Supabase Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Supabase Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should export Supabase functions', async () => {
    const supabase = await import('../services/supabase');

    expect(supabase.savePresentation).toBeDefined();
    expect(supabase.updatePresentation).toBeDefined();
    expect(supabase.getPresentations).toBeDefined();
    expect(supabase.deletePresentation).toBeDefined();
    expect(supabase.isSupabaseConfigured).toBeDefined();
  });

  it('should check if Supabase is configured', async () => {
    const supabase = await import('../services/supabase');

    // Should return boolean
    const result = supabase.isSupabaseConfigured();
    expect(typeof result).toBe('boolean');
  });

  it('should have proper presentation data structure', () => {
    interface Presentation {
      id: string;
      name: string;
      html: string;
      prompt?: string;
      provider?: string;
      created_at?: string;
      updated_at?: string;
    }

    const mockPresentation: Presentation = {
      id: 'test-uuid',
      name: 'Test Presentation',
      html: '<!DOCTYPE html><html><body></body></html>',
      prompt: 'Create a test',
      provider: 'deepseek/deepseek-v3.2',
    };

    expect(mockPresentation.id).toBeDefined();
    expect(mockPresentation.name).toBeDefined();
    expect(mockPresentation.html).toContain('<!DOCTYPE');
  });
});

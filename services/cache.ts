/**
 * Prompt Caching Service
 * Reduces API costs by caching identical prompts

 * Uses Supabase for persistent storage with localStorage fallback
 */
import supabase, { isSupabaseConfigured } from '../lib/supabase/client';
import { clampText, redactSensitive } from '../utils/sanitization';

const CACHE_ENV_ENABLED = import.meta.env.VITE_ENABLE_PROMPT_CACHE === 'true';
const USER_OPT_IN_KEY = 'presentgenius_prompt_cache_opt_in';
const REDACTED_PROMPT_MAX = 400;
const REDACTED_RESPONSE_MAX = 6000;

const isUserOptedIn = (): boolean => {
  try {
    return localStorage.getItem(USER_OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setUserCachePreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(USER_OPT_IN_KEY, enabled ? 'true' : 'false');
  } catch {
    /* ignore */
  }
};

export const isCacheEnabled = (): boolean => CACHE_ENV_ENABLED && isUserOptedIn();

interface CacheEntry {
  hash: string;
  prompt: string;
  response: string;
  provider: string;
  created_at: string;
  hits: number;
}

// Simple hash function for prompts
function sanitizeCacheText(input: string, maxLength: number): string {
  return clampText(redactSensitive(input || ''), maxLength);
}

function hashPrompt(prompt: string, provider: string): string {
  const str = `${provider}:${prompt}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

// Local storage fallback
const LOCAL_CACHE_KEY = 'presentgenius_cache';
const MAX_LOCAL_CACHE_SIZE = 50;

function getLocalCache(): Map<string, CacheEntry> {
  try {
    const data = localStorage.getItem(LOCAL_CACHE_KEY);
    if (data) {
      const entries = JSON.parse(data);
      return new Map(Object.entries(entries));
    }
  } catch (e) {
    console.warn('[Cache] Failed to load local cache');
  }
  return new Map();
}

function saveLocalCache(cache: Map<string, CacheEntry>): void {
  try {
    // Limit cache size
    if (cache.size > MAX_LOCAL_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].hits - a[1].hits); // Keep most used
      cache = new Map(entries.slice(0, MAX_LOCAL_CACHE_SIZE));
    }
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch (e) {
    console.warn('[Cache] Failed to save local cache');
  }
}

export async function getCachedResponse(prompt: string, provider: string): Promise<string | null> {
  if (!isCacheEnabled()) {
    return null;
  }
  const safePrompt = sanitizeCacheText(prompt, REDACTED_PROMPT_MAX);
  if (!safePrompt) return null;
  const hash = hashPrompt(safePrompt, provider);

  // Try Supabase first
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('prompt_cache')
        .select('response, hits')
        .eq('hash', hash)
        .limit(1);

      if (data && data.length > 0 && !error) {
        const entry = data[0];
        // Increment hit count
        await supabase
          .from('prompt_cache')
          .update({ hits: (entry.hits || 0) + 1 })
          .eq('hash', hash);

        console.log(`[Cache] HIT from Supabase: ${hash}`);
        return entry.response;
      }
    } catch (e) {
      console.warn('[Cache] Supabase query failed, falling back:', e);
      // Fall through to local cache
    }
  }

  // Fallback to local cache
  const localCache = getLocalCache();
  const entry = localCache.get(hash);
  if (entry) {
    entry.hits++;
    saveLocalCache(localCache);
    console.log(`[Cache] HIT from localStorage: ${hash}`);
    return entry.response;
  }

  console.log(`[Cache] MISS: ${hash}`);
  return null;
}

export async function setCachedResponse(
  prompt: string,
  response: string,
  provider: string
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  const safePrompt = sanitizeCacheText(prompt, REDACTED_PROMPT_MAX);
  const safeResponse = sanitizeCacheText(response, REDACTED_RESPONSE_MAX);
  if (!safePrompt || !safeResponse) return;

  const hash = hashPrompt(safePrompt, provider);

  const entry: CacheEntry = {
    hash,
    prompt: safePrompt,
    response: safeResponse,
    provider,
    created_at: new Date().toISOString(),
    hits: 1
  };

  // Save to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('prompt_cache')
        .upsert([entry], { onConflict: 'hash' });
      console.log(`[Cache] Saved to Supabase: ${hash}`);
    } catch (e) {
      console.warn('[Cache] Failed to save to Supabase, using local:', e);
    }
  }

  // Always save to local cache as fallback
  const localCache = getLocalCache();
  localCache.set(hash, entry);
  saveLocalCache(localCache);
}

export async function clearCache(): Promise<void> {
  // Clear local
  localStorage.removeItem(LOCAL_CACHE_KEY);

  // Clear Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('prompt_cache').delete().neq('hash', '');
      console.log('[Cache] Cleared all cache');
    } catch (e) {
      console.warn('[Cache] Failed to clear Supabase cache:', e);
    }
  }
}

export async function getCacheStats(): Promise<{ entries: number; totalHits: number }> {
  let entries = 0;
  let totalHits = 0;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('prompt_cache')
        .select('hits');

      if (data) {
        entries = data.length;
        totalHits = data.reduce((sum, row) => sum + (row.hits || 0), 0);
      }
    } catch (e) {
      console.warn('[Cache] Failed to get stats from Supabase:', e);
      // Fall through
    }
  }

  // Add local cache stats
  const localCache = getLocalCache();
  entries += localCache.size;
  for (const entry of localCache.values()) {
    totalHits += entry.hits;
  }

  return { entries, totalHits };
}

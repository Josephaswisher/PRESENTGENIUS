/**
 * Prompt Caching Service
 * Reduces API costs by caching identical prompts
 * Uses Supabase for persistent storage with localStorage fallback
 */
import { getSupabase, isSupabaseConfigured } from './supabase';

interface CacheEntry {
  hash: string;
  prompt: string;
  response: string;
  provider: string;
  created_at: string;
  hits: number;
}

// Simple hash function for prompts
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
  const hash = hashPrompt(prompt, provider);
  
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('prompt_cache')
        .select('response, hits')
        .eq('hash', hash)
        .single();

      if (data && !error) {
        // Increment hit count
        await client
          .from('prompt_cache')
          .update({ hits: (data.hits || 0) + 1 })
          .eq('hash', hash);
        
        console.log(`[Cache] HIT from Supabase: ${hash}`);
        return data.response;
      }
    } catch (e) {
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
  const hash = hashPrompt(prompt, provider);
  
  const entry: CacheEntry = {
    hash,
    prompt: prompt.slice(0, 500), // Store truncated prompt for debugging
    response,
    provider,
    created_at: new Date().toISOString(),
    hits: 1
  };

  // Save to Supabase
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      await client
        .from('prompt_cache')
        .upsert([entry], { onConflict: 'hash' });
      console.log(`[Cache] Saved to Supabase: ${hash}`);
    } catch (e) {
      console.warn('[Cache] Failed to save to Supabase, using local');
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
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      await client.from('prompt_cache').delete().neq('hash', '');
      console.log('[Cache] Cleared all cache');
    } catch (e) {
      console.warn('[Cache] Failed to clear Supabase cache');
    }
  }
}

export async function getCacheStats(): Promise<{ entries: number; totalHits: number }> {
  let entries = 0;
  let totalHits = 0;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      const { data } = await client
        .from('prompt_cache')
        .select('hits');
      
      if (data) {
        entries = data.length;
        totalHits = data.reduce((sum, row) => sum + (row.hits || 0), 0);
      }
    } catch (e) {
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

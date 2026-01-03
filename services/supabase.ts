/**
 * Supabase Client & Database Operations
 * Handles presentation storage, prompt history, and caching
 *
 * DEPRECATED: Use supabase from lib/supabase/client instead
 * This module re-exports the shared client to prevent multiple instances
 */
import supabase, { isSupabaseConfigured as isConfigured } from '../lib/supabase/client';

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase credentials not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return isConfigured();
}

// Types
export interface Presentation {
  id: string;
  user_id?: string;
  name: string;
  html: string;
  prompt?: string;
  provider?: string;
  original_image?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptHistory {
  id: string;
  presentation_id?: string;
  prompt: string;
  response_preview?: string;
  provider?: string;
  tokens_used?: number;
  created_at: string;
}

// Presentation CRUD
export async function savePresentation(presentation: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>): Promise<Presentation | null> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('presentations')
      .insert([presentation])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Failed to save presentation:', err);
    return null;
  }
}

export async function updatePresentation(id: string, updates: Partial<Presentation>): Promise<Presentation | null> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('presentations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Failed to update presentation:', err);
    return null;
  }
}

export async function getPresentations(limit = 50): Promise<Presentation[]> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('presentations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to fetch presentations:', err);
    return [];
  }
}

export async function deletePresentation(id: string): Promise<boolean> {
  try {
    const client = getSupabase();
    const { error } = await client
      .from('presentations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete presentation:', err);
    return false;
  }
}

// Prompt History
export async function savePromptHistory(entry: Omit<PromptHistory, 'id' | 'created_at'>): Promise<PromptHistory | null> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('prompt_history')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Failed to save prompt history:', err);
    return null;
  }
}

export async function getPromptHistory(limit = 100): Promise<PromptHistory[]> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('prompt_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to fetch prompt history:', err);
    return [];
  }
}

// Storage - For backup files
export async function uploadBackup(
  fileName: string,
  content: string,
  bucket = 'backups'
): Promise<string | null> {
  try {
    const client = getSupabase();
    const blob = new Blob([content], { type: 'text/html' });
    
    const { data, error } = await client.storage
      .from(bucket)
      .upload(`presentations/${fileName}`, blob, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) throw error;
    
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (err) {
    console.error('[Supabase] Failed to upload backup:', err);
    return null;
  }
}

// Sync helper - migrate localStorage to Supabase
export async function syncLocalStorageToSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  
  try {
    const saved = localStorage.getItem('gemini_app_history');
    if (!saved) return 0;

    const localPresentations = JSON.parse(saved);
    let synced = 0;

    for (const item of localPresentations) {
      const result = await savePresentation({
        name: item.name,
        html: item.html,
        prompt: item.prompt,
        provider: item.provider,
        original_image: item.originalImage,
      });
      if (result) synced++;
    }

    console.log(`[Supabase] Synced ${synced} presentations from localStorage`);
    return synced;
  } catch (err) {
    console.error('[Supabase] Sync failed:', err);
    return 0;
  }
}

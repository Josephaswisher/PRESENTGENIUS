/**
 * Enhanced Supabase Service for PRESENTGENIUS
 * Features: Auth, Real-time, Canvas Sync, Research Cache, Analytics
 *
 * DEPRECATED: Now uses shared client from lib/supabase/client
 * This prevents multiple GoTrueClient instances
 */
import supabase, { isSupabaseConfigured, getCurrentUser as libGetCurrentUser } from '../lib/supabase/client';
import type { RealtimeChannel, User } from '@supabase/supabase-js';

let realtimeChannel: RealtimeChannel | null = null;

// Backward compatibility re-exports
export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  return supabase;
}

export function isConfigured(): boolean {
  return isSupabaseConfigured();
}

// ============================================================
// TYPES
// ============================================================

export interface Presentation {
  id: string;
  user_id?: string;
  name: string;
  html: string;
  prompt?: string;
  provider?: string;
  activity_type?: string;
  learner_level?: string;
  duration_minutes?: number;
  slide_count?: number;
  original_image?: string;
  research_context?: string;
  tags?: string[];
  is_public?: boolean;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasDocument {
  id: string;
  user_id?: string;
  title: string;
  topic: string;
  target_audience: string;
  duration: number;
  outline_json: string;
  research_json?: string;
  status: 'planning' | 'researching' | 'outlining' | 'generating' | 'complete';
  created_at: string;
  updated_at: string;
}

export interface ResearchCache {
  id: string;
  query_hash: string;
  query: string;
  provider: string;
  result_json: string;
  citations_json?: string;
  hits: number;
  expires_at: string;
  created_at: string;
}

export interface PromptCache {
  hash: string;
  prompt: string;
  response: string;
  provider: string;
  hits: number;
  created_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id?: string;
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
  created_at: string;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function signInWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  return libGetCurrentUser();
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
}

// ============================================================
// PRESENTATIONS CRUD
// ============================================================

export async function savePresentation(
  presentation: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>
): Promise<Presentation | null> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await getSupabase()
      .from('presentations')
      .insert([{ ...presentation, user_id: user?.id }])
      .select()
      .single();
    if (error) throw error;
    
    // Track analytics
    trackEvent('presentation_created', { provider: presentation.provider });
    return data;
  } catch (err) {
    console.error('[Supabase] Save presentation failed:', err);
    return null;
  }
}

export async function updatePresentation(
  id: string,
  updates: Partial<Presentation>
): Promise<Presentation | null> {
  try {
    const { data, error } = await getSupabase()
      .from('presentations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Update presentation failed:', err);
    return null;
  }
}

export async function getPresentation(id: string): Promise<Presentation | null> {
  try {
    const { data, error } = await getSupabase()
      .from('presentations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // Increment view count
    await getSupabase()
      .from('presentations')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);
    
    return data;
  } catch (err) {
    console.error('[Supabase] Get presentation failed:', err);
    return null;
  }
}

export async function getUserPresentations(limit = 50): Promise<Presentation[]> {
  try {
    const user = await getCurrentUser();
    let query = getSupabase()
      .from('presentations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] Get presentations failed:', err);
    return [];
  }
}

export async function getPublicPresentations(limit = 20): Promise<Presentation[]> {
  try {
    const { data, error } = await getSupabase()
      .from('presentations')
      .select('*')
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] Get public presentations failed:', err);
    return [];
  }
}

export async function deletePresentation(id: string): Promise<boolean> {
  try {
    const { error } = await getSupabase()
      .from('presentations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    trackEvent('presentation_deleted', { id });
    return true;
  } catch (err) {
    console.error('[Supabase] Delete presentation failed:', err);
    return false;
  }
}

// ============================================================
// CANVAS DOCUMENTS (for interactive canvas mode)
// ============================================================

export async function saveCanvasDocument(
  doc: Omit<CanvasDocument, 'id' | 'created_at' | 'updated_at'>
): Promise<CanvasDocument | null> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await getSupabase()
      .from('canvas_documents')
      .insert([{ ...doc, user_id: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Save canvas failed:', err);
    return null;
  }
}

export async function updateCanvasDocument(
  id: string,
  updates: Partial<CanvasDocument>
): Promise<CanvasDocument | null> {
  try {
    const { data, error } = await getSupabase()
      .from('canvas_documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase] Update canvas failed:', err);
    return null;
  }
}

export async function getCanvasDocuments(limit = 20): Promise<CanvasDocument[]> {
  try {
    const user = await getCurrentUser();
    let query = getSupabase()
      .from('canvas_documents')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] Get canvas docs failed:', err);
    return [];
  }
}

// ============================================================
// RESEARCH CACHE (reduces API costs)
// ============================================================

function hashQuery(query: string, provider: string): string {
  // Simple hash for caching
  let hash = 0;
  const str = `${provider}:${query.toLowerCase().trim()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function getCachedResearch(
  query: string,
  provider: string
): Promise<{ result: any; citations: any[] } | null> {
  try {
    const queryHash = hashQuery(query, provider);
    const { data, error } = await getSupabase()
      .from('research_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    
    // Increment hit count
    await getSupabase()
      .from('research_cache')
      .update({ hits: data.hits + 1 })
      .eq('query_hash', queryHash);
    
    return {
      result: JSON.parse(data.result_json),
      citations: data.citations_json ? JSON.parse(data.citations_json) : [],
    };
  } catch {
    return null;
  }
}

export async function setCachedResearch(
  query: string,
  provider: string,
  result: any,
  citations: any[] = [],
  ttlHours = 24
): Promise<void> {
  try {
    const queryHash = hashQuery(query, provider);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    
    await getSupabase()
      .from('research_cache')
      .upsert({
        query_hash: queryHash,
        query,
        provider,
        result_json: JSON.stringify(result),
        citations_json: JSON.stringify(citations),
        hits: 1,
        expires_at: expiresAt,
      });
  } catch (err) {
    console.error('[Supabase] Cache research failed:', err);
  }
}

// ============================================================
// PROMPT CACHE (reduces AI API costs)
// ============================================================

export async function getCachedPrompt(
  prompt: string,
  provider: string
): Promise<string | null> {
  try {
    const hash = hashQuery(prompt, provider);
    const { data, error } = await getSupabase()
      .from('prompt_cache')
      .select('response, hits')
      .eq('hash', hash)
      .single();
    
    if (error || !data) return null;
    
    // Increment hits
    await getSupabase()
      .from('prompt_cache')
      .update({ hits: data.hits + 1 })
      .eq('hash', hash);
    
    return data.response;
  } catch {
    return null;
  }
}

export async function setCachedPrompt(
  prompt: string,
  response: string,
  provider: string
): Promise<void> {
  try {
    const hash = hashQuery(prompt, provider);
    await getSupabase()
      .from('prompt_cache')
      .upsert({
        hash,
        prompt: prompt.slice(0, 1000), // Truncate for storage
        response,
        provider,
        hits: 1,
      });
  } catch (err) {
    console.error('[Supabase] Cache prompt failed:', err);
  }
}

// ============================================================
// ANALYTICS
// ============================================================

export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>
): Promise<void> {
  if (!isConfigured()) return;
  
  try {
    const user = await getCurrentUser();
    const sessionId = sessionStorage.getItem('pg_session_id') || 
      (sessionStorage.setItem('pg_session_id', crypto.randomUUID()), sessionStorage.getItem('pg_session_id'));
    
    await getSupabase()
      .from('analytics')
      .insert([{
        user_id: user?.id,
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
      }]);
  } catch (err) {
    // Silent fail for analytics
    console.debug('[Analytics] Track failed:', err);
  }
}

export async function getAnalyticsSummary(): Promise<{
  totalPresentations: number;
  totalPrompts: number;
  cacheHitRate: number;
  topProviders: { provider: string; count: number }[];
}> {
  try {
    const [presentations, prompts, cache] = await Promise.all([
      getSupabase().from('presentations').select('id', { count: 'exact', head: true }),
      getSupabase().from('prompt_history').select('id', { count: 'exact', head: true }),
      getSupabase().from('prompt_cache').select('hits'),
    ]);
    
    const totalHits = cache.data?.reduce((sum, c) => sum + (c.hits || 0), 0) || 0;
    const totalCacheEntries = cache.data?.length || 1;
    
    return {
      totalPresentations: presentations.count || 0,
      totalPrompts: prompts.count || 0,
      cacheHitRate: totalHits / totalCacheEntries,
      topProviders: [], // TODO: aggregate query
    };
  } catch {
    return { totalPresentations: 0, totalPrompts: 0, cacheHitRate: 0, topProviders: [] };
  }
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

export function subscribeToPresentation(
  presentationId: string,
  onUpdate: (presentation: Presentation) => void
): () => void {
  const channel = getSupabase()
    .channel(`presentation:${presentationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'presentations',
        filter: `id=eq.${presentationId}`,
      },
      (payload) => {
        onUpdate(payload.new as Presentation);
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToUserPresentations(
  userId: string,
  onChange: (change: { event: string; presentation: Presentation }) => void
): () => void {
  const channel = getSupabase()
    .channel(`user:${userId}:presentations`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'presentations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({
          event: payload.eventType,
          presentation: (payload.new || payload.old) as Presentation,
        });
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

// ============================================================
// STORAGE (for images, exports)
// ============================================================

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string | null> {
  try {
    const { data, error } = await getSupabase().storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = getSupabase().storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (err) {
    console.error('[Supabase] Upload failed:', err);
    return null;
  }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await getSupabase().storage
      .from(bucket)
      .remove([path]);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// MIGRATIONS / SYNC
// ============================================================

export async function migrateFromLocalStorage(): Promise<number> {
  if (!isConfigured()) return 0;
  
  try {
    const saved = localStorage.getItem('gemini_app_history');
    if (!saved) return 0;
    
    const items = JSON.parse(saved);
    let migrated = 0;
    
    for (const item of items) {
      const result = await savePresentation({
        name: item.name,
        html: item.html,
        prompt: item.prompt,
        provider: item.provider || 'gemini',
        original_image: item.originalImage,
      });
      if (result) migrated++;
    }
    
    // Clear localStorage after successful migration
    if (migrated > 0) {
      localStorage.setItem('gemini_app_history_backup', saved);
      localStorage.removeItem('gemini_app_history');
    }
    
    trackEvent('migration_complete', { count: migrated });
    return migrated;
  } catch (err) {
    console.error('[Supabase] Migration failed:', err);
    return 0;
  }
}

// Export for direct access if needed
export { supabase };

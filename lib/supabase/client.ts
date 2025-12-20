/**
 * Supabase Client Configuration
 *
 * This initializes the Supabase client for:
 * - Authentication (magic link, OAuth)
 * - Database operations (projects, folders, versions)
 * - Realtime subscriptions (live polling, presenter sync)
 * - Storage (PDFs, images)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase not configured. Running in local-only mode.\n' +
    'To enable cloud features, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

// Create the Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Helper to check if Supabase is available
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Get current user (or null if not logged in)
export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Get current session
export const getSession = async () => {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export default supabase;

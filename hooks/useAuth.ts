/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth actions:
 * - Sign in with magic link (email)
 * - Sign in with OAuth (Google, GitHub)
 * - Sign out
 * - Listen for auth state changes
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
}

interface AuthActions {
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with magic link
  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  }, []);

  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    isLoading,
    isConfigured,
    signInWithEmail,
    signInWithOAuth,
    signOut,
  };
}

export default useAuth;

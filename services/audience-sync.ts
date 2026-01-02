/**
 * Audience Sync Service
 * Real-time sync for collaboration and audience engagement using Supabase Realtime
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface SessionState {
  code: string;
  currentSlide: number;
  totalSlides: number;
  title: string;
  isActive: boolean;
  presenterId?: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

export interface SyncEvent {
  type: 'slide_change' | 'annotation' | 'reaction';
  payload: any;
  timestamp: number;
}

// State
let currentChannel: RealtimeChannel | null = null;
let sessionState: SessionState | null = null;

/**
 * Generate a random 6-character code
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Initialize a session (Host)
 */
export async function createSession(title: string, totalSlides: number, presenterId: string): Promise<SessionState> {
  const code = generateSessionCode();
  
  sessionState = {
    code,
    currentSlide: 0,
    totalSlides,
    title,
    isActive: true,
    presenterId
  };

  if (isSupabaseConfigured() && supabase) {
    // Join the channel
    await joinSessionChannel(code, presenterId, 'Presenter');
    
    // Store session metadata in DB (optional persistence)
    // await supabase.from('sessions').insert({ ... })
  }

  return sessionState;
}

/**
 * Join a session (Audience/Collaborator)
 */
export async function joinSession(code: string, userId: string, userName: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    currentChannel = await joinSessionChannel(code, userId, userName);
    return !!currentChannel;
  }
  return false;
}

/**
 * Internal: Setup Realtime Channel
 */
async function joinSessionChannel(code: string, userId: string, userName: string): Promise<RealtimeChannel> {
  if (!supabase) throw new Error('Supabase not initialized');

  // Clean up existing channel
  if (currentChannel) {
    await supabase.removeChannel(currentChannel);
  }

  const channel = supabase.channel(`session:${code}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // Notify listeners of user list update
      notifyPresenceListeners(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .on('broadcast', { event: 'slide_change' }, (payload) => {
      if (sessionState) {
        sessionState.currentSlide = payload.slideIndex;
        notifySlideListeners(payload.slideIndex);
      }
    })
    .on('broadcast', { event: 'cursor_move' }, (payload) => {
      // Supabase payload wrapper handling
      const cursor = payload.payload as CursorPosition;
      notifyCursorListeners(cursor);
    });

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      channel.track({
        user_id: userId,
        user_name: userName,
        online_at: new Date().toISOString(),
        cursor: null
      });
    }
  });

  currentChannel = channel;
  return channel;
}

/**
 * Broadcast slide update
 */
export async function updateSlide(slideIndex: number) {
  if (sessionState) {
    sessionState.currentSlide = slideIndex;
  }

  if (currentChannel) {
    await currentChannel.send({
      type: 'broadcast',
      event: 'slide_change',
      payload: { slideIndex, timestamp: Date.now() },
    });
  }
}

/**
 * Broadcast cursor movement
 */
export async function broadcastCursor(x: number, y: number, userId: string, userName: string, color: string) {
  if (currentChannel) {
    // Debounce/throttle could be applied here if needed
    await currentChannel.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { x, y, userId, userName, color } as CursorPosition,
    });
  }
}

/**
 * Leave session
 */
export async function leaveSession() {
  if (currentChannel && supabase) {
    await supabase.removeChannel(currentChannel);
    currentChannel = null;
    sessionState = null;
  }
}

/**
 * Generate QR code URL for session
 */
export function getFollowAlongUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/follow/${code}`;
}

// --------------------------------------------------------------------------
// Event Listeners
// --------------------------------------------------------------------------

type PresenceCallback = (state: any) => void;
type SlideCallback = (slideIndex: number) => void;
type CursorCallback = (cursor: CursorPosition) => void;

const presenceListeners = new Set<PresenceCallback>();
const slideListeners = new Set<SlideCallback>();
const cursorListeners = new Set<CursorCallback>();

export function onPresenceUpdate(cb: PresenceCallback) {
  presenceListeners.add(cb);
  return () => presenceListeners.delete(cb);
}

export function onSlideUpdate(cb: SlideCallback) {
  slideListeners.add(cb);
  return () => slideListeners.delete(cb);
}

export function onCursorMove(cb: CursorCallback) {
  cursorListeners.add(cb);
  return () => cursorListeners.delete(cb);
}

function notifyPresenceListeners(state: any) {
  presenceListeners.forEach(cb => cb(state));
}

function notifySlideListeners(slideIndex: number) {
  slideListeners.forEach(cb => cb(slideIndex));
}

function notifyCursorListeners(cursor: CursorPosition) {
  cursorListeners.forEach(cb => cb(cursor));
}

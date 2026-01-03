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
  type: 'slide_change' | 'annotation' | 'reaction' | 'poll_vote' | 'qa_question' | 'qa_upvote' | 'qa_answer';
  payload: any;
  timestamp: number;
}

export interface Reaction {
  emoji: '👍' | '❤️' | '🤔' | '👏' | '🎯';
  x: number;
  y: number;
  userId: string;
  userName: string;
}

export interface PollVote {
  pollId: string;
  optionIndex: number;
  userId: string;
}

export interface QAQuestion {
  id: string;
  sessionId: string;
  question: string;
  askerName: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
}

export interface QAUpvote {
  questionId: string;
  userId: string;
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
    })
    .on('broadcast', { event: 'reaction' }, (payload) => {
      const reaction = payload.payload as Reaction;
      notifyReactionListeners(reaction);
    })
    .on('broadcast', { event: 'poll_vote' }, (payload) => {
      const vote = payload.payload as PollVote;
      notifyPollVoteListeners(vote);
    })
    .on('broadcast', { event: 'qa_question' }, (payload) => {
      const question = payload.payload as QAQuestion;
      notifyQAQuestionListeners(question);
    })
    .on('broadcast', { event: 'qa_upvote' }, (payload) => {
      const upvote = payload.payload as QAUpvote;
      notifyQAUpvoteListeners(upvote);
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
 * Broadcast reaction (ephemeral - no DB storage)
 */
export async function broadcastReaction(emoji: Reaction['emoji'], x: number, y: number, userId: string, userName: string) {
  if (currentChannel) {
    await currentChannel.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji, x, y, userId, userName } as Reaction,
    });
  }
}

/**
 * Broadcast poll vote
 */
export async function broadcastPollVote(pollId: string, optionIndex: number, userId: string) {
  if (currentChannel) {
    await currentChannel.send({
      type: 'broadcast',
      event: 'poll_vote',
      payload: { pollId, optionIndex, userId } as PollVote,
    });
  }
}

/**
 * Submit a Q&A question
 */
export async function submitQuestion(sessionId: string, question: string, askerName: string): Promise<QAQuestion | null> {
  if (!supabase) return null;

  const newQuestion: Omit<QAQuestion, 'id' | 'createdAt'> = {
    sessionId,
    question,
    askerName,
    upvotes: 0,
    isAnswered: false,
  };

  const { data, error } = await supabase
    .from('qa_questions')
    .insert(newQuestion)
    .select()
    .single();

  if (error) {
    console.error('Error submitting question:', error);
    return null;
  }

  const qaQuestion = data as QAQuestion;

  // Broadcast to all session participants
  if (currentChannel) {
    await currentChannel.send({
      type: 'broadcast',
      event: 'qa_question',
      payload: qaQuestion,
    });
  }

  return qaQuestion;
}

/**
 * Upvote a Q&A question
 */
export async function upvoteQuestion(questionId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('qa_questions')
    .update({ upvotes: supabase.raw('upvotes + 1') })
    .eq('id', questionId);

  if (error) {
    console.error('Error upvoting question:', error);
    return false;
  }

  // Broadcast upvote event
  if (currentChannel) {
    await currentChannel.send({
      type: 'broadcast',
      event: 'qa_upvote',
      payload: { questionId, userId } as QAUpvote,
    });
  }

  return true;
}

/**
 * Mark a question as answered
 */
export async function markQuestionAnswered(questionId: string, isAnswered: boolean = true): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('qa_questions')
    .update({ isAnswered })
    .eq('id', questionId);

  if (error) {
    console.error('Error marking question as answered:', error);
    return false;
  }

  return true;
}

/**
 * Get all questions for a session
 */
export async function getSessionQuestions(sessionId: string): Promise<QAQuestion[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('qa_questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return data as QAQuestion[];
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
type ReactionCallback = (reaction: Reaction) => void;
type PollVoteCallback = (vote: PollVote) => void;
type QAQuestionCallback = (question: QAQuestion) => void;
type QAUpvoteCallback = (upvote: QAUpvote) => void;

const presenceListeners = new Set<PresenceCallback>();
const slideListeners = new Set<SlideCallback>();
const cursorListeners = new Set<CursorCallback>();
const reactionListeners = new Set<ReactionCallback>();
const pollVoteListeners = new Set<PollVoteCallback>();
const qaQuestionListeners = new Set<QAQuestionCallback>();
const qaUpvoteListeners = new Set<QAUpvoteCallback>();

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

export function onReaction(cb: ReactionCallback) {
  reactionListeners.add(cb);
  return () => reactionListeners.delete(cb);
}

export function onPollVote(cb: PollVoteCallback) {
  pollVoteListeners.add(cb);
  return () => pollVoteListeners.delete(cb);
}

export function onQAQuestion(cb: QAQuestionCallback) {
  qaQuestionListeners.add(cb);
  return () => qaQuestionListeners.delete(cb);
}

export function onQAUpvote(cb: QAUpvoteCallback) {
  qaUpvoteListeners.add(cb);
  return () => qaUpvoteListeners.delete(cb);
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

function notifyReactionListeners(reaction: Reaction) {
  reactionListeners.forEach(cb => cb(reaction));
}

function notifyPollVoteListeners(vote: PollVote) {
  pollVoteListeners.forEach(cb => cb(vote));
}

function notifyQAQuestionListeners(question: QAQuestion) {
  qaQuestionListeners.forEach(cb => cb(question));
}

function notifyQAUpvoteListeners(upvote: QAUpvote) {
  qaUpvoteListeners.forEach(cb => cb(upvote));
}

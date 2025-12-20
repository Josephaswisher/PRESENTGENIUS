/**
 * Live Polling Service
 * Real-time audience response system using Supabase Realtime
 */

import { supabase } from '../lib/supabase/client';

export interface PollSession {
  id: string;
  code: string;
  presentationId: string;
  presentationTitle: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface PollQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  options: string[];
  correctAnswer?: number;
  isActive: boolean;
  timeLimit?: number; // seconds
  createdAt: string;
}

export interface PollResponse {
  id: string;
  questionId: string;
  sessionId: string;
  selectedOption: number;
  responderId: string; // anonymous ID
  createdAt: string;
}

export interface ResponseAggregate {
  questionId: string;
  options: {
    index: number;
    text: string;
    count: number;
    percentage: number;
  }[];
  totalResponses: number;
}

// Local storage for offline/demo mode
const LOCAL_SESSIONS_KEY = 'vibe-poll-sessions';
const LOCAL_RESPONSES_KEY = 'vibe-poll-responses';

/**
 * Generate a unique session code
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar chars (0,O,I,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate anonymous responder ID
 */
export function generateResponderId(): string {
  const existing = localStorage.getItem('vibe-responder-id');
  if (existing) return existing;

  const id = `resp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem('vibe-responder-id', id);
  return id;
}

/**
 * Create a new polling session
 */
export async function createSession(
  presentationId: string,
  presentationTitle: string
): Promise<PollSession> {
  const code = generateSessionCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const session: PollSession = {
    id: `session-${Date.now()}`,
    code,
    presentationId,
    presentationTitle,
    isActive: true,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('poll_sessions')
        .insert({
          code: session.code,
          presentation_id: session.presentationId,
          presentation_title: session.presentationTitle,
          is_active: session.isActive,
          expires_at: session.expiresAt,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          presentationId: data.presentation_id,
          presentationTitle: data.presentation_title,
          isActive: data.is_active,
          createdAt: data.created_at,
          expiresAt: data.expires_at,
        };
      }
    } catch (e) {
      console.warn('Supabase session creation failed, using local storage:', e);
    }
  }

  // Fallback to local storage
  const sessions = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
  sessions.push(session);
  localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));

  return session;
}

/**
 * Find session by code
 */
export async function findSessionByCode(code: string): Promise<PollSession | null> {
  const normalizedCode = code.toUpperCase().trim();

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('poll_sessions')
        .select()
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          presentationId: data.presentation_id,
          presentationTitle: data.presentation_title,
          isActive: data.is_active,
          createdAt: data.created_at,
          expiresAt: data.expires_at,
        };
      }
    } catch (e) {
      console.warn('Supabase session lookup failed:', e);
    }
  }

  // Fallback to local storage
  const sessions = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
  return sessions.find((s: PollSession) => s.code === normalizedCode && s.isActive) || null;
}

/**
 * End a polling session
 */
export async function endSession(sessionId: string): Promise<void> {
  if (supabase) {
    try {
      await supabase
        .from('poll_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      return;
    } catch (e) {
      console.warn('Supabase session end failed:', e);
    }
  }

  // Local fallback
  const sessions = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
  const updated = sessions.map((s: PollSession) =>
    s.id === sessionId ? { ...s, isActive: false } : s
  );
  localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated));
}

/**
 * Start a poll question
 */
export async function startQuestion(
  sessionId: string,
  questionText: string,
  options: string[],
  correctAnswer?: number,
  timeLimit?: number
): Promise<PollQuestion> {
  const question: PollQuestion = {
    id: `q-${Date.now()}`,
    sessionId,
    questionText,
    options,
    correctAnswer,
    isActive: true,
    timeLimit,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      // Deactivate previous questions first
      await supabase
        .from('poll_questions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      const { data, error } = await supabase
        .from('poll_questions')
        .insert({
          session_id: sessionId,
          question_text: questionText,
          options,
          correct_answer: correctAnswer,
          is_active: true,
          time_limit: timeLimit,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          sessionId: data.session_id,
          questionText: data.question_text,
          options: data.options,
          correctAnswer: data.correct_answer,
          isActive: data.is_active,
          timeLimit: data.time_limit,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase question creation failed:', e);
    }
  }

  return question;
}

/**
 * Get active question for a session
 */
export async function getActiveQuestion(sessionId: string): Promise<PollQuestion | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('poll_questions')
        .select()
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          sessionId: data.session_id,
          questionText: data.question_text,
          options: data.options,
          correctAnswer: data.correct_answer,
          isActive: data.is_active,
          timeLimit: data.time_limit,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase question lookup failed:', e);
    }
  }

  return null;
}

/**
 * Submit a response
 */
export async function submitResponse(
  questionId: string,
  sessionId: string,
  selectedOption: number
): Promise<PollResponse> {
  const responderId = generateResponderId();

  const response: PollResponse = {
    id: `r-${Date.now()}`,
    questionId,
    sessionId,
    selectedOption,
    responderId,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .insert({
          question_id: questionId,
          session_id: sessionId,
          selected_option: selectedOption,
          responder_id: responderId,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          questionId: data.question_id,
          sessionId: data.session_id,
          selectedOption: data.selected_option,
          responderId: data.responder_id,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase response submission failed:', e);
    }
  }

  // Local fallback
  const responses = JSON.parse(localStorage.getItem(LOCAL_RESPONSES_KEY) || '[]');
  responses.push(response);
  localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(responses));

  return response;
}

/**
 * Get aggregated responses for a question
 */
export async function getResponseAggregate(
  questionId: string,
  options: string[]
): Promise<ResponseAggregate> {
  let responses: PollResponse[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select()
        .eq('question_id', questionId);

      if (!error && data) {
        responses = data.map(r => ({
          id: r.id,
          questionId: r.question_id,
          sessionId: r.session_id,
          selectedOption: r.selected_option,
          responderId: r.responder_id,
          createdAt: r.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase response fetch failed:', e);
    }
  }

  // Also check local storage
  const localResponses = JSON.parse(localStorage.getItem(LOCAL_RESPONSES_KEY) || '[]');
  const localForQuestion = localResponses.filter(
    (r: PollResponse) => r.questionId === questionId
  );
  responses = [...responses, ...localForQuestion];

  // Count responses per option
  const counts = new Map<number, number>();
  responses.forEach(r => {
    counts.set(r.selectedOption, (counts.get(r.selectedOption) || 0) + 1);
  });

  const totalResponses = responses.length;

  return {
    questionId,
    options: options.map((text, index) => ({
      index,
      text,
      count: counts.get(index) || 0,
      percentage: totalResponses > 0 ? ((counts.get(index) || 0) / totalResponses) * 100 : 0,
    })),
    totalResponses,
  };
}

/**
 * Subscribe to real-time responses (for presenter)
 */
export function subscribeToResponses(
  sessionId: string,
  onNewResponse: (response: PollResponse) => void
): (() => void) | null {
  if (!supabase) return null;

  const channel = supabase
    .channel(`responses:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_responses',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const data = payload.new as any;
        onNewResponse({
          id: data.id,
          questionId: data.question_id,
          sessionId: data.session_id,
          selectedOption: data.selected_option,
          responderId: data.responder_id,
          createdAt: data.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to active question changes (for audience)
 */
export function subscribeToQuestions(
  sessionId: string,
  onQuestionChange: (question: PollQuestion | null) => void
): (() => void) | null {
  if (!supabase) return null;

  const channel = supabase
    .channel(`questions:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'poll_questions',
        filter: `session_id=eq.${sessionId}`,
      },
      async () => {
        // Fetch the current active question
        const question = await getActiveQuestion(sessionId);
        onQuestionChange(question);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get join URL for audience
 */
export function getJoinUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/join/${code}`;
}

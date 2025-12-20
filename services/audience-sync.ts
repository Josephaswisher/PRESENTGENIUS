/**
 * Audience Sync Service
 * Real-time sync for phone follow-along mode using Supabase Realtime
 */

// Session code generator
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Session state
export interface SessionState {
  code: string;
  currentSlide: number;
  totalSlides: number;
  title: string;
  isActive: boolean;
  startedAt: Date;
  presenterName?: string;
}

export interface SlideContent {
  slideNumber: number;
  title?: string;
  keyPoints: string[];
  fillInBlanks?: { id: string; prompt: string; answer: string; revealed: boolean }[];
  poll?: { question: string; options: string[]; votes: Record<string, number> };
}

// In-memory session store (would use Supabase in production)
const sessions = new Map<string, SessionState>();
const slideContents = new Map<string, SlideContent[]>();
const listeners = new Map<string, Set<(state: SessionState) => void>>();

/**
 * Create a new presentation session
 */
export function createSession(title: string, totalSlides: number): SessionState {
  const code = generateSessionCode();
  const session: SessionState = {
    code,
    currentSlide: 0,
    totalSlides,
    title,
    isActive: true,
    startedAt: new Date(),
  };
  sessions.set(code, session);
  slideContents.set(code, []);
  listeners.set(code, new Set());
  return session;
}

/**
 * Get session by code
 */
export function getSession(code: string): SessionState | null {
  return sessions.get(code.toUpperCase()) || null;
}

/**
 * Update current slide
 */
export function updateSlide(code: string, slideNumber: number): void {
  const session = sessions.get(code);
  if (session) {
    session.currentSlide = slideNumber;
    notifyListeners(code, session);
  }
}

/**
 * Add slide content for follow-along
 */
export function setSlideContent(code: string, content: SlideContent): void {
  const contents = slideContents.get(code) || [];
  contents[content.slideNumber] = content;
  slideContents.set(code, contents);
}

/**
 * Get current slide content
 */
export function getCurrentSlideContent(code: string): SlideContent | null {
  const session = sessions.get(code);
  const contents = slideContents.get(code);
  if (session && contents) {
    return contents[session.currentSlide] || null;
  }
  return null;
}

/**
 * Subscribe to session updates
 */
export function subscribeToSession(
  code: string, 
  callback: (state: SessionState) => void
): () => void {
  const sessionListeners = listeners.get(code);
  if (sessionListeners) {
    sessionListeners.add(callback);
    // Send current state immediately
    const session = sessions.get(code);
    if (session) callback(session);
    
    return () => {
      sessionListeners.delete(callback);
    };
  }
  return () => {};
}

/**
 * End session
 */
export function endSession(code: string): void {
  const session = sessions.get(code);
  if (session) {
    session.isActive = false;
    notifyListeners(code, session);
  }
  // Clean up after a delay
  setTimeout(() => {
    sessions.delete(code);
    slideContents.delete(code);
    listeners.delete(code);
  }, 60000); // Keep for 1 minute after ending
}

// Notify all listeners
function notifyListeners(code: string, state: SessionState): void {
  const sessionListeners = listeners.get(code);
  if (sessionListeners) {
    sessionListeners.forEach(cb => cb(state));
  }
}

/**
 * Generate QR code URL for session
 */
export function getFollowAlongUrl(code: string): string {
  // In production, this would be your actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}/follow/${code}`;
}

/**
 * Parse slide content from HTML to extract key points
 */
export function parseSlideContent(html: string, slideNumber: number): SlideContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract title
  const title = doc.querySelector('h1, h2, .slide-title')?.textContent || undefined;
  
  // Extract bullet points
  const keyPoints: string[] = [];
  doc.querySelectorAll('li, .key-point, .bullet').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 0 && text.length < 200) {
      keyPoints.push(text);
    }
  });
  
  // Look for fill-in-the-blank patterns (text with ___ or [blank])
  const fillInBlanks: SlideContent['fillInBlanks'] = [];
  const blankPattern = /___+|\[blank\]|\[fill\]/gi;
  doc.querySelectorAll('p, li, span').forEach((el, i) => {
    const text = el.textContent || '';
    if (blankPattern.test(text)) {
      fillInBlanks.push({
        id: `blank-${slideNumber}-${i}`,
        prompt: text.replace(blankPattern, '_____'),
        answer: '', // Would need AI to fill this
        revealed: false,
      });
    }
  });

  return {
    slideNumber,
    title,
    keyPoints: keyPoints.slice(0, 5), // Limit to 5 key points
    fillInBlanks: fillInBlanks.length > 0 ? fillInBlanks : undefined,
  };
}

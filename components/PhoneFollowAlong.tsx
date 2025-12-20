/**
 * Phone Follow-Along View
 * Mobile-optimized view for audience members to follow presentation
 */
import React, { useState, useEffect } from 'react';
import {
  SignalIcon,
  SignalSlashIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  SessionState,
  SlideContent,
  getSession,
  subscribeToSession,
  getCurrentSlideContent,
} from '../services/audience-sync';

interface PhoneFollowAlongProps {
  sessionCode: string;
}

export const PhoneFollowAlong: React.FC<PhoneFollowAlongProps> = ({ sessionCode }) => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [content, setContent] = useState<SlideContent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedBlanks, setRevealedBlanks] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const foundSession = getSession(sessionCode);
    if (!foundSession) {
      setError('Session not found. Check the code and try again.');
      return;
    }

    setSession(foundSession);
    setConnected(true);

    const unsubscribe = subscribeToSession(sessionCode, (state) => {
      setSession(state);
      if (!state.isActive) {
        setConnected(false);
      }
      // Update content when slide changes
      const slideContent = getCurrentSlideContent(sessionCode);
      setContent(slideContent);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionCode]);

  const revealBlank = (blankId: string) => {
    setRevealedBlanks(prev => new Set(prev).add(blankId));
  };

  const updateAnswer = (blankId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [blankId]: answer }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <SignalSlashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Connection Error</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connected ? (
              <SignalIcon className="w-5 h-5 text-green-400" />
            ) : (
              <SignalSlashIcon className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm font-medium truncate max-w-[200px]">
              {session.title}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="font-mono">
              {session.currentSlide + 1}/{session.totalSlides}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((session.currentSlide + 1) / session.totalSlides) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {/* Slide Number */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
            Slide {session.currentSlide + 1}
          </span>
        </div>

        {content ? (
          <div className="space-y-6">
            {/* Title */}
            {content.title && (
              <h1 className="text-2xl font-bold text-center">{content.title}</h1>
            )}

            {/* Key Points */}
            {content.keyPoints.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Key Points
                </h2>
                <ul className="space-y-2">
                  {content.keyPoints.map((point, i) => (
                    <li 
                      key={i}
                      className="flex items-start gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fill-in-the-Blanks */}
            {content.fillInBlanks && content.fillInBlanks.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Fill in the Blanks
                </h2>
                <div className="space-y-3">
                  {content.fillInBlanks.map((blank) => {
                    const isRevealed = revealedBlanks.has(blank.id);
                    const userAnswer = userAnswers[blank.id] || '';
                    
                    return (
                      <div 
                        key={blank.id}
                        className="p-4 bg-zinc-900 rounded-xl border border-zinc-800"
                      >
                        <p className="text-sm mb-3">{blank.prompt}</p>
                        
                        {!isRevealed ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={userAnswer}
                              onChange={(e) => updateAnswer(blank.id, e.target.value)}
                              placeholder="Your answer..."
                              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                                         text-sm text-white placeholder-zinc-500 focus:outline-none
                                         focus:border-cyan-500"
                            />
                            <button
                              onClick={() => revealBlank(blank.id)}
                              className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm
                                         hover:bg-cyan-500/30 transition-colors"
                            >
                              Reveal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="font-medium">{blank.answer || 'Answer revealed'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Poll (if present) */}
            {content.poll && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Quick Poll
                </h2>
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="font-medium mb-3">{content.poll.question}</p>
                  <div className="space-y-2">
                    {content.poll.options.map((option, i) => (
                      <button
                        key={i}
                        className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg
                                   text-left text-sm transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Waiting for presenter...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Session: {sessionCode}</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PhoneFollowAlong;

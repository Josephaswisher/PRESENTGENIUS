/**
 * Audience View - Mobile-friendly polling interface for participants
 */
import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  findSessionByCode,
  getActiveQuestion,
  submitResponse,
  subscribeToQuestions,
  generateResponderId,
  type PollSession,
  type PollQuestion,
} from '../../services/polling.service';

interface AudienceViewProps {
  sessionCode?: string;
  onClose?: () => void;
}

export function AudienceView({ sessionCode, onClose }: AudienceViewProps) {
  // Join state
  const [inputCode, setInputCode] = useState(sessionCode || '');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Session state
  const [session, setSession] = useState<PollSession | null>(null);
  const [question, setQuestion] = useState<PollQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Auto-join if code provided
  useEffect(() => {
    if (sessionCode) {
      handleJoin();
    }
  }, [sessionCode]);

  // Subscribe to questions when session is active
  useEffect(() => {
    if (!session) return;

    // Get initial active question
    getActiveQuestion(session.id).then(q => {
      if (q) {
        setQuestion(q);
        setSelectedOption(null);
        setHasSubmitted(false);
        if (q.timeLimit) setTimeRemaining(q.timeLimit);
      }
    });

    // Subscribe to question changes
    const unsubscribe = subscribeToQuestions(session.id, (newQuestion) => {
      setQuestion(newQuestion);
      setSelectedOption(null);
      setHasSubmitted(false);
      if (newQuestion?.timeLimit) setTimeRemaining(newQuestion.timeLimit);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question]); // Reset when question changes

  // Join session
  const handleJoin = async () => {
    if (!inputCode.trim()) {
      setJoinError('Please enter a session code');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const foundSession = await findSessionByCode(inputCode);
      if (foundSession) {
        setSession(foundSession);
        generateResponderId(); // Ensure we have an ID
      } else {
        setJoinError('Session not found or has ended');
      }
    } catch (err) {
      setJoinError('Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  // Submit response
  const handleSubmit = async () => {
    if (selectedOption === null || !question || !session) return;

    setIsSubmitting(true);

    try {
      await submitResponse(question.id, session.id, selectedOption);
      setHasSubmitted(true);
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Leave session
  const handleLeave = () => {
    setSession(null);
    setQuestion(null);
    setInputCode('');
    onClose?.();
  };

  // Render join view
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SignalIcon className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join Poll</h1>
            <p className="text-zinc-400">Enter the session code to participate</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={6}
              className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />

            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={isJoining || !inputCode.trim()}
              className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-lg transition-colors disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 text-zinc-500 hover:text-white transition-colors text-sm w-full text-center"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render waiting view
  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Waiting for question...</h2>
          <p className="text-zinc-400 mb-6">
            Connected to: {session.presentationTitle}
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            Session code: <span className="font-mono font-bold">{session.code}</span>
          </p>
          <button
            onClick={handleLeave}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Leave Session
          </button>
        </div>
      </div>
    );
  }

  // Render submitted view
  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Response Submitted!</h2>
          <p className="text-zinc-400 mb-2">
            You selected option {String.fromCharCode(65 + selectedOption!)}
          </p>
          <p className="text-sm text-zinc-500">
            Waiting for next question...
          </p>
        </div>
      </div>
    );
  }

  // Render question view
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <SignalIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm text-zinc-400">Live</span>
        </div>
        {timeRemaining !== null && timeRemaining > 0 && (
          <span className={`px-3 py-1 rounded-full text-sm font-mono font-bold ${
            timeRemaining <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {timeRemaining}s
          </span>
        )}
        <button
          onClick={handleLeave}
          className="p-1 text-zinc-500 hover:text-white"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Question */}
      <div className="flex-1 p-4 flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
          {question.questionText}
        </h2>

        {/* Options */}
        <div className="flex-1 space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(index)}
              disabled={timeRemaining === 0}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedOption === index
                  ? 'border-cyan-500 bg-cyan-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              } ${timeRemaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${
                  selectedOption === index
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null || isSubmitting || timeRemaining === 0}
          className="mt-6 w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : timeRemaining === 0 ? 'Time\'s up!' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}

export default AudienceView;

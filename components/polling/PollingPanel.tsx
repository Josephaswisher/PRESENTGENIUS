/**
 * Polling Panel - Main presenter interface for live polling
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import {
  createSession,
  startQuestion,
  endSession,
  getResponseAggregate,
  subscribeToResponses,
  getJoinUrl,
  type PollSession,
  type PollQuestion,
  type PollResponse,
  type ResponseAggregate,
} from '../../services/polling.service';
import { extractContent, type QuizQuestion } from '../../services/content-extractor';

interface PollingPanelProps {
  html: string;
  title: string;
  onClose: () => void;
}

export function PollingPanel({ html, title, onClose }: PollingPanelProps) {
  // Session state
  const [session, setSession] = useState<PollSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Question state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [activeQuestion, setActiveQuestion] = useState<PollQuestion | null>(null);
  const [isStartingQuestion, setIsStartingQuestion] = useState(false);

  // Response state
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [aggregate, setAggregate] = useState<ResponseAggregate | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Settings
  const [timeLimit, setTimeLimit] = useState(30);
  const [showTimer, setShowTimer] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Extract questions from HTML on mount
  useEffect(() => {
    const content = extractContent(html, title);
    if (content.quizQuestions.length > 0) {
      setQuestions(content.quizQuestions);
    }
  }, [html, title]);

  // Create session
  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const newSession = await createSession(title, title);
      setSession(newSession);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Subscribe to responses
  useEffect(() => {
    if (!session) return;

    const unsubscribe = subscribeToResponses(session.id, (response) => {
      setResponses(prev => [...prev, response]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session]);

  // Update aggregate when responses change
  useEffect(() => {
    if (!activeQuestion) return;

    const updateAggregate = async () => {
      const currentQ = questions[currentQuestionIndex];
      if (!currentQ) return;

      const agg = await getResponseAggregate(activeQuestion.id, currentQ.options);
      setAggregate(agg);
    };

    updateAggregate();
  }, [responses, activeQuestion, currentQuestionIndex, questions]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setShowResults(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Start a question
  const handleStartQuestion = async (index: number) => {
    if (!session) return;

    const q = questions[index];
    if (!q) return;

    setIsStartingQuestion(true);
    setShowResults(false);
    setResponses([]);
    setAggregate(null);

    try {
      const pollQ = await startQuestion(
        session.id,
        q.question,
        q.options,
        q.correctAnswer,
        showTimer ? timeLimit : undefined
      );

      setActiveQuestion(pollQ);
      setCurrentQuestionIndex(index);

      if (showTimer) {
        setCountdown(timeLimit);
      }
    } catch (err) {
      console.error('Failed to start question:', err);
    } finally {
      setIsStartingQuestion(false);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!session) return;

    try {
      await endSession(session.id);
      setSession(null);
      setActiveQuestion(null);
      setResponses([]);
      setAggregate(null);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const joinUrl = session ? getJoinUrl(session.code) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Live Polling</h2>
              <p className="text-sm text-zinc-400">
                {session ? `Session: ${session.code}` : 'Create a session to start polling'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!session ? (
            /* No Session - Create Session View */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
                <UserGroupIcon className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start Live Polling</h3>
              <p className="text-zinc-400 text-center max-w-md mb-6">
                Create a session to let your audience respond to questions in real-time.
                They can join by scanning a QR code or entering a code.
              </p>

              {questions.length > 0 ? (
                <p className="text-sm text-cyan-400 mb-4">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} detected in your presentation
                </p>
              ) : (
                <p className="text-sm text-amber-400 mb-4">
                  No quiz questions found - you can still poll manually
                </p>
              )}

              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCreatingSession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Create Session
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Active Session View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: QR Code & Info */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-xl p-6 flex flex-col items-center">
                  <QRCodeSVG
                    value={joinUrl}
                    size={180}
                    level="H"
                    includeMargin
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-zinc-600">Join at</p>
                    <p className="font-mono text-lg font-bold text-zinc-900">{session.code}</p>
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Settings</h4>
                  <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTimer}
                      onChange={(e) => setShowTimer(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-500"
                    />
                    Show countdown timer
                  </label>
                  {showTimer && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-zinc-500" />
                      <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                        min={5}
                        max={300}
                        className="w-16 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-white"
                      />
                      <span className="text-sm text-zinc-500">seconds</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleEndSession}
                  className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <StopIcon className="w-4 h-4" />
                  End Session
                </button>
              </div>

              {/* Right: Questions & Results */}
              <div className="lg:col-span-2 space-y-4">
                {/* Active Question */}
                {activeQuestion && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-white">Current Question</h4>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-400 font-medium">
                          {aggregate?.totalResponses || 0} responses
                        </span>
                        {countdown !== null && (
                          <span className={`ml-2 px-2 py-1 rounded text-sm font-mono ${
                            countdown <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-300'
                          }`}>
                            {countdown}s
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-lg text-white mb-4">
                      {questions[currentQuestionIndex]?.question}
                    </p>

                    {/* Results Bars */}
                    <div className="space-y-2">
                      {aggregate?.options.map((opt, i) => (
                        <div key={i} className="relative">
                          <div
                            className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ${
                              showResults && questions[currentQuestionIndex]?.correctAnswer === i
                                ? 'bg-green-500/30'
                                : 'bg-cyan-500/30'
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />
                          <div className="relative flex items-center justify-between p-3 border border-zinc-700 rounded">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded text-sm font-medium text-zinc-300">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-zinc-200">{opt.text}</span>
                              {showResults && questions[currentQuestionIndex]?.correctAnswer === i && (
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-400">{opt.count}</span>
                              <span className="text-cyan-400 font-medium w-12 text-right">
                                {opt.percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!showResults && countdown === null && (
                      <button
                        onClick={() => setShowResults(true)}
                        className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm transition-colors"
                      >
                        Show Results
                      </button>
                    )}
                  </div>
                )}

                {/* Question List */}
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Questions</h4>
                  {questions.length > 0 ? (
                    <div className="space-y-2">
                      {questions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleStartQuestion(i)}
                          disabled={isStartingQuestion}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            currentQuestionIndex === i
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 truncate flex-1 pr-4">
                              {i + 1}. {q.question}
                            </span>
                            <span className="text-xs text-zinc-500 shrink-0">
                              {q.options.length} options
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">
                      No questions found in the presentation. Add quiz questions to enable polling.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PollingPanel;

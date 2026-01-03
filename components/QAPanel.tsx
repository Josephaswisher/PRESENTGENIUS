import React, { useState, useEffect } from 'react';
import {
  QAQuestion,
  submitQuestion,
  upvoteQuestion,
  markQuestionAnswered,
  getSessionQuestions,
  onQAQuestion,
  onQAUpvote,
} from '../services/audience-sync';

interface QAPanelProps {
  sessionId: string;
  userId: string;
  userName: string;
  isPresenter?: boolean;
  enabled?: boolean;
}

export function QAPanel({
  sessionId,
  userId,
  userName,
  isPresenter = false,
  enabled = true,
}: QAPanelProps) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());

  // Load initial questions
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const loadQuestions = async () => {
      const data = await getSessionQuestions(sessionId);
      setQuestions(data);
    };

    loadQuestions();
  }, [sessionId, enabled]);

  // Listen for new questions
  useEffect(() => {
    if (!enabled) return;

    const unsubscribeQuestion = onQAQuestion((question) => {
      setQuestions(prev => {
        // Check if question already exists
        if (prev.some(q => q.id === question.id)) {
          return prev;
        }
        return [...prev, question].sort((a, b) => {
          // Sort by upvotes (desc), then by date (asc)
          if (b.upvotes !== a.upvotes) {
            return b.upvotes - a.upvotes;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      });
    });

    const unsubscribeUpvote = onQAUpvote((upvote) => {
      setQuestions(prev =>
        prev.map(q =>
          q.id === upvote.questionId
            ? { ...q, upvotes: q.upvotes + 1 }
            : q
        ).sort((a, b) => {
          if (b.upvotes !== a.upvotes) {
            return b.upvotes - a.upvotes;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
      );
    });

    return () => {
      unsubscribeQuestion();
      unsubscribeUpvote();
    };
  }, [enabled]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || loading) return;

    setLoading(true);
    try {
      const question = await submitQuestion(sessionId, newQuestion.trim(), userName);
      if (question) {
        setNewQuestion('');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (upvotedQuestions.has(questionId)) {
      return; // Already upvoted
    }

    const success = await upvoteQuestion(questionId, userId);
    if (success) {
      setUpvotedQuestions(prev => new Set(prev).add(questionId));
    }
  };

  const handleToggleAnswered = async (questionId: string, currentStatus: boolean) => {
    if (!isPresenter) return;

    const success = await markQuestionAnswered(questionId, !currentStatus);
    if (success) {
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, isAnswered: !currentStatus } : q
        )
      );
    }
  };

  if (!enabled) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Q&A
          <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
            {questions.length} questions
          </span>
        </h2>
      </div>

      {/* Question submission form */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmitQuestion} className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newQuestion.trim() || loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Ask'}
          </button>
        </form>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No questions yet</p>
            <p className="text-sm mt-1">Be the first to ask a question!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className={`p-4 rounded-lg border transition-all ${
                question.isAnswered
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Upvote button */}
                <button
                  onClick={() => handleUpvote(question.id)}
                  disabled={upvotedQuestions.has(question.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    upvotedQuestions.has(question.id)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600'
                  }`}
                  title={upvotedQuestions.has(question.id) ? 'Already upvoted' : 'Upvote this question'}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold text-sm">{question.upvotes}</span>
                </button>

                {/* Question content */}
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    {question.question}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {question.askerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {new Date(question.createdAt).toLocaleTimeString()}
                    </span>
                    {question.isAnswered && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Answered
                      </span>
                    )}
                  </div>
                </div>

                {/* Presenter controls */}
                {isPresenter && (
                  <button
                    onClick={() => handleToggleAnswered(question.id, question.isAnswered)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      question.isAnswered
                        ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {question.isAnswered ? 'Mark Unanswered' : 'Mark Answered'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

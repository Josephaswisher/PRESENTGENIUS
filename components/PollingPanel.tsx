import React, { useState, useEffect } from 'react';
import { PollVote, onPollVote, broadcastPollVote } from '../services/audience-sync';

interface PollOption {
  text: string;
  votes: number;
  voters: Set<string>;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
}

interface PollingPanelProps {
  sessionId: string;
  userId: string;
  userName: string;
  isPresenter?: boolean;
  enabled?: boolean;
}

export function PollingPanel({
  sessionId,
  userId,
  userName,
  isPresenter = false,
  enabled = true,
}: PollingPanelProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [userVotes, setUserVotes] = useState<Map<string, number>>(new Map());

  // Listen for poll votes
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = onPollVote((vote: PollVote) => {
      setPolls(prev =>
        prev.map(poll => {
          if (poll.id !== vote.pollId) return poll;

          const newOptions = poll.options.map((option, idx) => {
            if (idx === vote.optionIndex) {
              return {
                ...option,
                votes: option.votes + 1,
                voters: new Set(option.voters).add(vote.userId),
              };
            }
            return option;
          });

          return {
            ...poll,
            options: newOptions,
            totalVotes: poll.totalVotes + 1,
          };
        })
      );

      // Update active poll if it's the one being voted on
      setActivePoll(prev => {
        if (prev?.id !== vote.pollId) return prev;
        const updated = polls.find(p => p.id === vote.pollId);
        return updated || prev;
      });
    });

    return unsubscribe;
  }, [enabled, polls]);

  const handleCreatePoll = () => {
    if (!newPollQuestion.trim() || !isPresenter) return;

    const validOptions = newPollOptions.filter(opt => opt.trim());
    if (validOptions.length < 2) return;

    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPollQuestion.trim(),
      options: validOptions.map(text => ({
        text: text.trim(),
        votes: 0,
        voters: new Set(),
      })),
      isActive: true,
      totalVotes: 0,
    };

    setPolls(prev => [...prev, newPoll]);
    setActivePoll(newPoll);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (userVotes.has(pollId)) {
      return; // Already voted
    }

    await broadcastPollVote(pollId, optionIndex, userId);

    // Update local state
    setUserVotes(prev => new Map(prev).set(pollId, optionIndex));

    // Update poll locally for immediate feedback
    setPolls(prev =>
      prev.map(poll => {
        if (poll.id !== pollId) return poll;

        const newOptions = poll.options.map((option, idx) => {
          if (idx === optionIndex) {
            return {
              ...option,
              votes: option.votes + 1,
              voters: new Set(option.voters).add(userId),
            };
          }
          return option;
        });

        return {
          ...poll,
          options: newOptions,
          totalVotes: poll.totalVotes + 1,
        };
      })
    );
  };

  const handleClosePoll = (pollId: string) => {
    if (!isPresenter) return;

    setPolls(prev =>
      prev.map(poll =>
        poll.id === pollId ? { ...poll, isActive: false } : poll
      )
    );

    if (activePoll?.id === pollId) {
      setActivePoll(null);
    }
  };

  const addPollOption = () => {
    setNewPollOptions(prev => [...prev, '']);
  };

  const updatePollOption = (index: number, value: string) => {
    setNewPollOptions(prev =>
      prev.map((opt, idx) => (idx === index ? value : opt))
    );
  };

  const removePollOption = (index: number) => {
    if (newPollOptions.length <= 2) return;
    setNewPollOptions(prev => prev.filter((_, idx) => idx !== index));
  };

  if (!enabled) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Live Polls
          <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
            {polls.length} polls
          </span>
        </h2>
      </div>

      {/* Create poll form (presenter only) */}
      {isPresenter && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-3">
            <input
              type="text"
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
              placeholder="Poll question..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="space-y-2">
              {newPollOptions.map((option, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {newPollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(idx)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPollOption}
                className="px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg font-medium"
              >
                + Add Option
              </button>
              <button
                onClick={handleCreatePoll}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors ml-auto"
                disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active poll display */}
      {activePoll && (
        <div className="p-6 border-b-4 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {activePoll.question}
            </h3>
            {isPresenter && (
              <button
                onClick={() => handleClosePoll(activePoll.id)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
              >
                Close Poll
              </button>
            )}
          </div>

          <div className="space-y-3">
            {activePoll.options.map((option, idx) => {
              const percentage = activePoll.totalVotes > 0
                ? Math.round((option.votes / activePoll.totalVotes) * 100)
                : 0;
              const hasVoted = userVotes.get(activePoll.id) === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleVote(activePoll.id, idx)}
                  disabled={!activePoll.isActive || userVotes.has(activePoll.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    hasVoted
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                  } ${!activePoll.isActive || userVotes.has(activePoll.id) ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {option.votes} votes ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Total votes: {activePoll.totalVotes}
          </div>
        </div>
      )}

      {/* Poll history */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Poll History
        </h3>

        {polls.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No polls yet</p>
            {isPresenter && (
              <p className="text-sm mt-1">Create your first poll to get started!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {polls.filter(p => p.id !== activePoll?.id).map(poll => (
              <div
                key={poll.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {poll.question}
                  </h4>
                  {!poll.isActive && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Closed
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {poll.options.map((option, idx) => {
                    const percentage = poll.totalVotes > 0
                      ? Math.round((option.votes / poll.totalVotes) * 100)
                      : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                          {option.votes} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

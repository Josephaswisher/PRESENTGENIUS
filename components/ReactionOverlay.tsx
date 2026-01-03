import React, { useEffect, useState } from 'react';
import { Reaction, onReaction, broadcastReaction } from '../services/audience-sync';

interface FloatingReaction {
  id: string;
  emoji: Reaction['emoji'];
  x: number;
  y: number;
  userName: string;
}

interface ReactionOverlayProps {
  userId: string;
  userName: string;
  enabled?: boolean;
  showReactionBar?: boolean;
}

const REACTION_EMOJIS: Reaction['emoji'][] = ['👍', '❤️', '🤔', '👏', '🎯'];
const REACTION_LIFETIME = 3000; // 3 seconds

export function ReactionOverlay({
  userId,
  userName,
  enabled = true,
  showReactionBar = true
}: ReactionOverlayProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;

    // Listen for reactions from other users
    const unsubscribe = onReaction((reaction) => {
      // Add to floating reactions
      const floatingReaction: FloatingReaction = {
        id: `${reaction.userId}-${Date.now()}-${Math.random()}`,
        emoji: reaction.emoji,
        x: reaction.x,
        y: reaction.y,
        userName: reaction.userName,
      };

      setReactions(prev => [...prev, floatingReaction]);

      // Update aggregate counts
      setReactionCounts(prev => ({
        ...prev,
        [reaction.emoji]: (prev[reaction.emoji] || 0) + 1,
      }));

      // Remove after lifetime
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== floatingReaction.id));
      }, REACTION_LIFETIME);
    });

    return unsubscribe;
  }, [enabled]);

  // Reset counts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setReactionCounts({});
    }, 10000); // Reset every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleReactionClick = async (emoji: Reaction['emoji'], event: React.MouseEvent) => {
    if (!enabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    // Broadcast reaction
    await broadcastReaction(emoji, x, y, userId, userName);

    // Also trigger locally for immediate feedback
    const floatingReaction: FloatingReaction = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      emoji,
      x,
      y,
      userName,
    };

    setReactions(prev => [...prev, floatingReaction]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== floatingReaction.id));
    }, REACTION_LIFETIME);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Floating reactions */}
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute animate-float-up pointer-events-none"
          style={{
            left: `${reaction.x}px`,
            top: `${reaction.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="text-4xl opacity-0 animate-fade-in-out">
            {reaction.emoji}
          </div>
        </div>
      ))}

      {/* Reaction bar */}
      {showReactionBar && enabled && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-4 py-3 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => handleReactionClick(emoji, e)}
                  className="relative group transition-transform hover:scale-125 active:scale-95"
                  title={`React with ${emoji}`}
                >
                  <span className="text-3xl cursor-pointer select-none">
                    {emoji}
                  </span>
                  {reactionCounts[emoji] > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {reactionCounts[emoji] > 99 ? '99+' : reactionCounts[emoji]}
                    </span>
                  )}
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {emoji === '👍' && 'Like'}
                    {emoji === '❤️' && 'Love'}
                    {emoji === '🤔' && 'Thinking'}
                    {emoji === '👏' && 'Applause'}
                    {emoji === '🎯' && 'On Point'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) translateY(-40px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-80px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes fade-in-out {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }

        .animate-fade-in-out {
          animation: fade-in-out 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ClipboardIcon,
  CheckIcon,
  CodeBracketIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/markup';

// Register languages to keep bundle small
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('ts', ts);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', html);

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  action?: string;
  avatar?: React.ReactNode;
  timestamp?: Date;
  showTimestamp?: boolean;
  onReaction?: (reaction: 'up' | 'down') => void;
  isLatest?: boolean;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-zinc-800 rounded-md text-cyan-300 font-mono text-[13px] border border-zinc-700/50" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden bg-[#1e1e1e] border border-zinc-700 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <CodeBracketIcon className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-zinc-300 font-mono font-medium">{language.toUpperCase()}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white transition-all bg-zinc-800/50 hover:bg-zinc-700 p-1.5 rounded-lg"
          title="Copy code"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-400" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}
        wrapLines={true}
        wrapLongLines={true}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

// Format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  action,
  avatar,
  timestamp,
  showTimestamp = true,
  onReaction,
  isLatest = false,
}) => {
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (type: 'up' | 'down') => {
    const newReaction = reaction === type ? null : type;
    setReaction(newReaction);
    if (onReaction && newReaction) onReaction(newReaction);
  };

  return (
    <div
      className={`group flex gap-3 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start animate-slide-up`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar with pulse for latest assistant message */}
      <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${role === 'user'
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border border-blue-400/30'
          : 'bg-gradient-to-br from-purple-500 to-pink-600 border border-purple-400/30'
        }`}>
        {avatar || (role === 'user' ? '👤' : '✨')}
        {/* Pulse ring for latest assistant message */}
        {role === 'assistant' && isLatest && (
          <span className="absolute inset-0 rounded-full animate-ping bg-purple-500/30" />
        )}
      </div>

      {/* Message Bubble */}
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={`relative rounded-2xl p-4 shadow-sm transition-all duration-200 ${role === 'user'
              ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-cyan-50 border border-cyan-500/20'
              : 'bg-[#18181b] text-zinc-100 border border-zinc-700/50 hover:border-zinc-600/50'
            }`}
        >
          <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:m-0 prose-pre:p-0 ${role === 'assistant' ? 'prose-headings:text-purple-200' : 'prose-headings:text-cyan-200'
            }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-zinc-200" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-600 pl-4 my-2 italic text-zinc-400" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {action && (
            <div className="mt-3 pt-2 border-t border-zinc-700/50 flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                <SparklesIcon className="w-3.5 h-3.5" />
                {action}
              </span>
            </div>
          )}

          {/* Reaction buttons - show on hover for assistant messages */}
          {role === 'assistant' && (showReactions || reaction) && (
            <div className={`absolute -bottom-3 right-4 flex gap-1 transition-opacity duration-200 ${showReactions ? 'opacity-100' : 'opacity-70'}`}>
              <button
                onClick={() => handleReaction('up')}
                className={`p-1.5 rounded-full transition-all ${
                  reaction === 'up'
                    ? 'bg-green-500/20 text-green-400 scale-110'
                    : 'bg-zinc-800 text-zinc-500 hover:text-green-400 hover:bg-green-500/10'
                } border border-zinc-700`}
                title="Helpful"
              >
                {reaction === 'up' ? (
                  <HandThumbUpSolid className="w-3.5 h-3.5" />
                ) : (
                  <HandThumbUpIcon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => handleReaction('down')}
                className={`p-1.5 rounded-full transition-all ${
                  reaction === 'down'
                    ? 'bg-red-500/20 text-red-400 scale-110'
                    : 'bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                } border border-zinc-700`}
                title="Not helpful"
              >
                {reaction === 'down' ? (
                  <HandThumbDownSolid className="w-3.5 h-3.5" />
                ) : (
                  <HandThumbDownIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && timestamp && (
          <div className={`flex items-center gap-1 text-[10px] text-zinc-600 ${role === 'user' ? 'justify-end' : 'justify-start'} px-2`}>
            <ClockIcon className="w-3 h-3" />
            {formatRelativeTime(timestamp)}
            {role === 'user' && (
              <CheckIcon className="w-3 h-3 text-cyan-500 ml-1" title="Delivered" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Typing Indicator Component
export const TypingIndicator: React.FC<{ assistantName?: string }> = ({ assistantName = 'Assistant' }) => (
  <div className="flex gap-3 items-start animate-fade-in">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 border border-purple-400/30 flex items-center justify-center shadow-md">
      ✨
    </div>
    <div className="bg-[#18181b] border border-zinc-700/50 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">{assistantName} is thinking</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

// Conversation Starter Chips
interface ConversationStarterProps {
  suggestions: { icon: string; label: string; prompt: string }[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const ConversationStarters: React.FC<ConversationStarterProps> = ({ suggestions, onSelect, disabled }) => (
  <div className="space-y-3">
    <div className="text-center">
      <div className="inline-flex items-center gap-2 text-zinc-500 text-xs">
        <SparklesIcon className="w-4 h-4" />
        <span>Try asking</span>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.prompt)}
          disabled={disabled}
          className="group flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50
                     hover:border-purple-500/30 rounded-xl text-left transition-all disabled:opacity-50
                     hover:shadow-lg hover:shadow-purple-500/5"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">{s.icon}</span>
          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{s.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// Context Pill - Shows current state
interface ContextPillProps {
  topic?: string;
  sectionsCount?: number;
  progress?: number;
  isResearching?: boolean;
  isGenerating?: boolean;
}

export const ContextPill: React.FC<ContextPillProps> = ({
  topic,
  sectionsCount = 0,
  progress = 0,
  isResearching,
  isGenerating,
}) => {
  if (!topic && sectionsCount === 0 && !isResearching && !isGenerating) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 backdrop-blur-sm rounded-full border border-zinc-700/50 text-xs">
      {isResearching && (
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Researching...
        </span>
      )}
      {isGenerating && (
        <span className="flex items-center gap-1.5 text-purple-400">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          Generating...
        </span>
      )}
      {topic && !isResearching && !isGenerating && (
        <>
          <span className="text-zinc-400">Topic:</span>
          <span className="text-white font-medium truncate max-w-[120px]">{topic}</span>
        </>
      )}
      {sectionsCount > 0 && (
        <>
          <span className="w-px h-3 bg-zinc-700" />
          <span className="text-zinc-400">{sectionsCount} sections</span>
          {progress > 0 && (
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Assistant Status Indicator
interface AssistantStatusProps {
  status: 'ready' | 'thinking' | 'researching' | 'generating';
  mood?: 'neutral' | 'happy' | 'focused';
}

export const AssistantStatus: React.FC<AssistantStatusProps> = ({ status, mood = 'neutral' }) => {
  const statusConfig = {
    ready: { color: 'bg-green-500', text: 'Ready to help', icon: '✨' },
    thinking: { color: 'bg-purple-500 animate-pulse', text: 'Thinking...', icon: '🧠' },
    researching: { color: 'bg-cyan-500 animate-pulse', text: 'Researching...', icon: '🔍' },
    generating: { color: 'bg-pink-500 animate-pulse', text: 'Creating...', icon: '🎨' },
  };

  const moodEmoji = { neutral: '', happy: '😊', focused: '🎯' };
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
          <span className="text-base">{config.icon}</span>
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${config.color} rounded-full border-2 border-zinc-900`} />
      </div>
      <div>
        <div className="text-sm font-medium text-white flex items-center gap-1">
          Lecture Assistant
          {moodEmoji[mood] && <span className="text-xs">{moodEmoji[mood]}</span>}
        </div>
        <div className="text-[10px] text-zinc-500">{config.text}</div>
      </div>
    </div>
  );
};

// Keyboard Shortcut Hint
export const KeyboardHint: React.FC<{ show?: boolean }> = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-600">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Enter</kbd>
        <span>send</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Shift+Enter</kbd>
        <span>new line</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">/</kbd>
        <span>commands</span>
      </span>
    </div>
  );
};

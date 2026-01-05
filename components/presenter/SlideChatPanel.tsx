/**
 * Slide Chat Panel
 *
 * AI-powered chat interface for editing slides in presentation mode.
 * Features:
 * - Context-aware prompts (current slide HTML as context)
 * - Apply suggestions directly to slides
 * - Conversation history
 * - Quick action buttons
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  PaintBrushIcon,
  ListBulletIcon,
  QuestionMarkCircleIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { generateWithProvider } from '../../services/ai-provider';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  htmlSuggestion?: string;
  isApplied?: boolean;
}

interface SlideChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlideHtml: string;
  currentSlideTitle: string;
  currentSlideIndex: number;
  onApplyHtml: (html: string) => void;
}

const QUICK_ACTIONS = [
  { icon: PaintBrushIcon, label: 'Make more visual', prompt: 'Make this slide more visually appealing with better styling, colors, and layout. Keep the same content but enhance the presentation.' },
  { icon: ListBulletIcon, label: 'Add bullet points', prompt: 'Convert the main content into clear, concise bullet points. Keep it scannable and easy to read.' },
  { icon: QuestionMarkCircleIcon, label: 'Add a quiz', prompt: 'Add an interactive quiz question at the end of this slide to test understanding of the content.' },
  { icon: LightBulbIcon, label: 'Simplify', prompt: 'Simplify this slide content. Make it more concise and easier to understand while keeping the key points.' },
  { icon: CodeBracketIcon, label: 'Add animation', prompt: 'Add subtle CSS animations to make elements appear with fade-in or slide-in effects.' },
];

export const SlideChatPanel: React.FC<SlideChatPanelProps> = ({
  isOpen,
  onClose,
  currentSlideHtml,
  currentSlideTitle,
  currentSlideIndex,
  onApplyHtml
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear messages when slide changes
  useEffect(() => {
    // Add system context message when slide changes
    if (currentSlideHtml && messages.length === 0) {
      setMessages([{
        id: 'system-1',
        role: 'system',
        content: `Ready to help with "${currentSlideTitle}". Ask me to modify the content, styling, or add interactive elements.`,
        timestamp: Date.now()
      }]);
    }
  }, [currentSlideIndex]);

  const generateResponse = useCallback(async (userPrompt: string) => {
    setIsLoading(true);
    setStreamingContent('');

    const systemPrompt = `You are a presentation slide editor assistant. The user wants to modify their slide.

CURRENT SLIDE HTML:
\`\`\`html
${currentSlideHtml}
\`\`\`

SLIDE TITLE: ${currentSlideTitle}

INSTRUCTIONS:
1. When asked to modify the slide, respond with the complete updated HTML
2. Wrap your HTML response in a code block with \`\`\`html ... \`\`\`
3. Keep the slide structure (section.slide-section)
4. Use modern CSS styling inline or in a <style> block
5. Be creative but maintain readability
6. For interactive elements, use simple JavaScript that works in an isolated iframe

USER REQUEST: ${userPrompt}

Respond with a brief explanation of what you changed, followed by the complete updated HTML in a code block.`;

    try {
      let fullResponse = '';

      await generateWithProvider(
        'minimax',
        systemPrompt,
        [],
        {},
        (phase, progress, message, error, partialContent) => {
          if (partialContent) {
            fullResponse = partialContent;
            setStreamingContent(partialContent);
          }
        }
      );

      // Extract HTML from response
      const htmlMatch = fullResponse.match(/```html\n?([\s\S]*?)```/);
      const htmlSuggestion = htmlMatch ? htmlMatch[1].trim() : undefined;

      // Extract explanation (text before the code block)
      const explanation = fullResponse.split('```')[0].trim() || 'Here\'s the updated slide:';

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: explanation,
        timestamp: Date.now(),
        htmlSuggestion
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

    } catch (error) {
      console.error('Chat generation error:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSlideHtml, currentSlideTitle]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuickActions(false);

    await generateResponse(input.trim());
  };

  const handleQuickAction = async (prompt: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowQuickActions(false);

    await generateResponse(prompt);
  };

  const handleApplyHtml = (messageId: string, html: string) => {
    onApplyHtml(html);
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isApplied: true } : msg
    ));
  };

  const handleCopyHtml = (html: string) => {
    navigator.clipboard.writeText(html);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-700 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">AI Slide Editor</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Current Slide Context */}
      <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
        <p className="text-xs text-zinc-400">
          Editing: <span className="text-cyan-400">Slide {currentSlideIndex + 1}</span> - {currentSlideTitle}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'ml-8'
                : message.role === 'system'
                ? 'mx-4'
                : 'mr-8'
            }`}
          >
            {message.role === 'system' ? (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-sm text-cyan-300">
                {message.content}
              </div>
            ) : message.role === 'user' ? (
              <div className="bg-blue-500/20 rounded-lg p-3 text-sm text-white">
                {message.content}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-200">
                  {message.content}
                </div>

                {/* HTML Suggestion Actions */}
                {message.htmlSuggestion && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400">Generated HTML</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopyHtml(message.htmlSuggestion!)}
                          className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                          title="Copy HTML"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApplyHtml(message.id, message.htmlSuggestion!)}
                          disabled={message.isApplied}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            message.isApplied
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
                          }`}
                        >
                          {message.isApplied ? (
                            <>
                              <CheckIcon className="w-3 h-3" />
                              Applied
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-3 h-3" />
                              Apply to Slide
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs text-zinc-400 overflow-x-auto max-h-32 overflow-y-auto bg-zinc-900 rounded p-2">
                      {message.htmlSuggestion.slice(0, 500)}
                      {message.htmlSuggestion.length > 500 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Streaming Response */}
        {isLoading && streamingContent && (
          <div className="mr-8 bg-zinc-800 rounded-lg p-3 text-sm text-zinc-200">
            {streamingContent.split('```')[0]}
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="mr-8 flex items-center gap-2 text-zinc-400 text-sm">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && !isLoading && messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-zinc-700">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1 text-xs text-zinc-400 mb-2"
          >
            Quick actions
            {showQuickActions ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.prompt)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <action.icon className="w-3.5 h-3.5 text-cyan-400" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to edit this slide..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-cyan-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors self-end"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

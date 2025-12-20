/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Enhanced Chat Panel
 * Includes Quick Actions toolbar for one-click refinements
 */
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon, UserIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

// Quick Action definitions for one-click refinements
const QUICK_ACTIONS = [
    {
        id: 'add-quiz',
        icon: '📝',
        label: 'Add Quiz',
        prompt: 'Add a 5-question multiple choice quiz at the end with explanations for each answer. Use board-style question format.',
    },
    {
        id: 'add-pearls',
        icon: '💡',
        label: 'Pearls',
        prompt: 'Add 3-5 clinical pearls or high-yield takeaways highlighted in a visually distinct box.',
    },
    {
        id: 'simplify',
        icon: '📉',
        label: 'Simplify',
        prompt: 'Simplify the language for medical students (MS3-4 level). Reduce jargon, add more explanations for complex concepts.',
    },
    {
        id: 'advanced',
        icon: '📈',
        label: 'Advanced',
        prompt: 'Add more advanced details suitable for senior residents/fellows. Include gray-zone nuances and evidence-based considerations.',
    },
    {
        id: 'print-friendly',
        icon: '🖨️',
        label: 'Print',
        prompt: 'Make this more print-friendly. Reduce interactivity, use cleaner layout, ensure good contrast for printing.',
    },
    {
        id: 'add-refs',
        icon: '📚',
        label: 'Cite',
        prompt: 'Add relevant guideline references and citations. Include source badges like [ACC/AHA 2023] or [UpToDate] where appropriate.',
    },
    {
        id: 'research',
        icon: '🔬',
        label: 'Research',
        prompt: '[RESEARCH] Search PubMed and medical databases for the latest evidence on this topic. Add evidence-based citations and guideline references.',
        isResearch: true,
    },
    {
        id: 'deep-dive',
        icon: '🧠',
        label: 'Deep Dive',
        prompt: '[DEEP_RESEARCH] Perform comprehensive research using Perplexity sonar-deep-research model. Synthesize information from multiple high-quality medical sources.',
        isResearch: true,
    },
];

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Handle quick action click
    const handleQuickAction = (prompt: string) => {
        if (isProcessing) return;
        onSendMessage(prompt);
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-[#0E0E10] border-r border-zinc-800 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center space-x-2 bg-[#0E0E10]">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold tracking-wide text-zinc-200">Assistant</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 opacity-50">
                        <ChatBubbleLeftRightIcon className="w-8 h-8" />
                        <p className="text-xs text-center px-4">Ask me to modify the content, add questions, or change the style.</p>
                     </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`
                                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                                ${msg.role === 'user' 
                                    ? 'bg-zinc-800 text-zinc-100 rounded-br-none' 
                                    : 'bg-cyan-900/20 border border-cyan-900/30 text-cyan-100 rounded-bl-none'
                                }
                            `}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start">
                         <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                         </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center gap-1 mb-1.5">
                    <SparklesIcon className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isProcessing}
                            className={`
                                flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                                transition-all duration-150
                                ${isProcessing
                                    ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-cyan-300 active:scale-95'
                                }
                            `}
                            title={action.prompt}
                        >
                            <span>{action.icon}</span>
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-[#0E0E10]">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a change or use quick actions above..."
                        className="w-full bg-zinc-900/50 text-zinc-200 placeholder-zinc-500 border border-zinc-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        disabled={isProcessing}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
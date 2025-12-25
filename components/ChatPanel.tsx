/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Premium Chat Assistant UI
 * Modern, futuristic interface with Markdown support and syntax highlighting.
 */
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    Send,
    Sparkles,
    BrainCircuit,
    MessageSquare,
    Zap,
    Info,
    ChevronRight,
    User,
    Bot
} from 'lucide-react';

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp?: Date;
    action?: string;
}

const QUICK_ACTIONS = [
    {
        id: 'suggest-sections',
        icon: <BrainCircuit className="w-3.5 h-3.5" />,
        label: 'Suggest Steps',
        prompt: 'Suggest the next 3 logical sections for this medical lecture to build understanding.',
    },
    {
        id: 'add-quiz',
        icon: '📝',
        label: 'Add Quiz',
        prompt: 'Add a 5-question multiple choice quiz slide at the end with detailed clinical explanations.',
    },
    {
        id: 'simplify',
        icon: '📉',
        label: 'Simplify',
        prompt: 'Simplify this content for medical students. Use more analogies and reduce jargon.',
    },
    {
        id: 'advanced',
        icon: '📈',
        label: 'Level Up',
        prompt: 'Increase the complexity for senior residents. Include recent clinical trial data and nuances.',
    },
    {
        id: 'clinical-correlate',
        icon: '🏥',
        label: 'Clinical Case',
        prompt: 'Add a realistic clinical case section that matches the current pathophysiology.',
    }
];

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

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
        <div className="flex flex-col h-full bg-[#09090b] border-r border-zinc-800/50 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950/20 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/20">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white leading-none">Lecture Copilot</h2>
                        <div className="flex items-center mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5"></span>
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Neural Engine Active</span>
                        </div>
                    </div>
                </div>
                <div className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-help group relative">
                    <Info className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        Ask me to modify slides, add cases, or research new topics.
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 py-20 translate-y-[-10%]">
                        <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/20 to-zinc-900/40 rounded-3xl flex items-center justify-center border border-zinc-800/50 shadow-inner">
                            <MessageSquare className="w-6 h-6 text-zinc-600" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-zinc-400 italic">Ready to assist, Dr.</p>
                            <p className="text-xs text-zinc-600 max-w-[200px] leading-relaxed">Try saying: "Add a section about the mechanism of action" or use actions below.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex max-w-[90%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${msg.role === 'user'
                                    ? 'bg-zinc-800 border-zinc-700'
                                    : 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-500/30 shadow-lg shadow-cyan-900/20'
                                }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-300" /> : <Bot className="w-4 h-4 text-white" />}
                            </div>

                            <div
                                className={`
                                    rounded-2xl px-4 py-3 text-sm leading-relaxed border shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                        : 'bg-zinc-900/40 border-cyan-900/20 text-zinc-100 backdrop-blur-sm'
                                    }
                                `}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            className="rounded-lg !my-2 !bg-[#0E0E10] border border-zinc-800"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono" {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start animate-pulse">
                        <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/20 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="px-5 py-4 border-t border-zinc-800/50 bg-[#0c0c0e]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-cyan-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rapid Commands</span>
                    </div>
                    <div className="h-px flex-1 bg-zinc-800/50 mx-4"></div>
                </div>
                <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isProcessing}
                            className={`
                                shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold
                                transition-all duration-200 border
                                ${isProcessing
                                    ? 'bg-zinc-900/50 text-zinc-700 border-zinc-800/50 cursor-not-allowed opacity-50'
                                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 active:scale-95 shadow-sm'
                                }
                            `}
                        >
                            <span className="opacity-70 group-hover:opacity-100">{action.icon}</span>
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-zinc-800/50 bg-[#09090b]">
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-2xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none"></div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Direct neuronal link established..."
                            className="w-full bg-zinc-900 text-zinc-100 placeholder-zinc-600 border border-zinc-800 rounded-2xl pl-4 pr-14 py-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className={`
                                absolute right-2.5 p-2 rounded-xl transition-all
                                ${!input.trim() || isProcessing
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed text-xs'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 active:scale-95 hover:brightness-110'
                                }
                            `}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
                <div className="mt-3 flex justify-center">
                    <p className="text-[10px] text-zinc-600 font-medium">Shift + Enter to send. Use natural language commands.</p>
                </div>
            </div>
        </div>
    );
};

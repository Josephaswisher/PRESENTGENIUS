/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Premium Chat Assistant UI
 * Modern, futuristic interface with Markdown support and syntax highlighting.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { PROVIDERS, type AIProvider } from '../services/ai-provider';

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp?: Date;
    action?: string;
}

// Models now imported from PROVIDERS in ai-provider.ts

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
    onSendMessage: (message: string, provider: AIProvider, modelId: string) => void;
    isProcessing: boolean;
    selectedProvider: AIProvider;
    selectedModelId: string;
    onProviderChange: (provider: AIProvider) => void;
    onModelChange: (modelId: string) => void;
    currentHtmlLength?: number; // For context usage calculation
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSendMessage,
    isProcessing,
    selectedProvider,
    selectedModelId,
    onProviderChange,
    onModelChange,
    currentHtmlLength = 0
}) => {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Get current provider info and available models
    const providerInfo = PROVIDERS[selectedProvider] || PROVIDERS['openrouter'];
    const availableModels = providerInfo?.models || [];
    const selectedModel = availableModels.find(m => m.id === selectedModelId) || availableModels[0] || {
        id: 'fallback',
        name: 'Fallback Model',
        contextLimit: 64000,
        costTier: 'balanced' as const,
        description: 'Default fallback'
    };

    // Calculate context usage (memoized for performance)
    const contextStats = useMemo(() => {
        const messagesLength = messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
        const totalChars = Math.max(0, currentHtmlLength + messagesLength);
        const estimatedTokens = Math.floor(totalChars / 4) || 0;
        const contextLimit = selectedModel?.contextLimit || 64000;
        const usagePercent = Math.min((estimatedTokens / contextLimit) * 100, 100) || 0;

        // Determine warning level colors
        let colors;
        if (usagePercent >= 90) {
            colors = { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        } else if (usagePercent >= 80) {
            colors = { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
        } else {
            colors = { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
        }

        return { estimatedTokens, contextLimit, usagePercent, colors };
    }, [messages, currentHtmlLength, selectedModel]);

    const { estimatedTokens, contextLimit, usagePercent: contextUsagePercent, colors: contextColors } = contextStats;

    const handleQuickAction = (prompt: string) => {
        if (isProcessing) return;
        onSendMessage(prompt, selectedProvider, selectedModelId);
    };

    const handleProviderChange = (newProvider: AIProvider) => {
        onProviderChange(newProvider);
        // Auto-select first model of new provider
        const providerModels = PROVIDERS[newProvider]?.models || [];
        if (providerModels.length > 0) {
            onModelChange(providerModels[0].id);
        }
    };

    const handleModelChange = (newModelId: string) => {
        onModelChange(newModelId);
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;
        onSendMessage(input, selectedProvider, selectedModelId);
        setInput('');
    };

    const tierColors = {
        budget: 'text-green-400 bg-green-500/10 border-green-500/20',
        balanced: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        premium: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b] border-r border-zinc-800/50 font-sans selection:bg-cyan-500/30">
            {/* Header - Compact (24px target height) */}
            <div className="px-3 py-2 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950/20 backdrop-blur-md">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/20">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold tracking-tight text-white leading-none">Copilot</h2>
                        <div className="flex items-center mt-0.5">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                            <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">Active</span>
                        </div>
                    </div>
                </div>
                <div className="p-1 hover:bg-zinc-800 rounded-md transition-colors cursor-help group relative">
                    <Info className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        Ask me to modify slides, add cases, or research new topics.
                    </div>
                </div>
            </div>

            {/* Messages Area - Compact spacing */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
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
                        <div className={`flex max-w-[90%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${msg.role === 'user'
                                    ? 'bg-zinc-800 border-zinc-700'
                                    : 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-500/30 shadow-lg shadow-cyan-900/20'
                                }`}>
                                {msg.role === 'user' ? <User className="w-3 h-3 text-zinc-300" /> : <Bot className="w-3 h-3 text-white" />}
                            </div>

                            <div
                                className={`
                                    rounded-xl px-3 py-2 text-sm leading-relaxed border shadow-sm
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
                        <div className="flex gap-2">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/20 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-cyan-400" />
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Actions Toolbar - Compact */}
            <div className="px-3 py-2 border-t border-zinc-800/50 bg-[#0c0c0e]">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-2.5 h-2.5 text-cyan-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Actions</span>
                    </div>
                    <div className="h-px flex-1 bg-zinc-800/50 mx-3"></div>
                    <span className="text-[8px] text-zinc-600 italic">Quick</span>
                </div>
                <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isProcessing}
                            className={`
                                shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold
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

            {/* Provider & Model Selector - Ultra Compact (32px target) */}
            <div className="px-3 py-2 border-t border-zinc-800/50 bg-[#0a0a0c] space-y-1.5">
                {/* Compact Provider Icons + Model Dropdown Row */}
                <div className="flex items-center gap-2">
                    {/* Provider Icon Buttons */}
                    <div className="flex gap-1">
                        {PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => handleProviderChange(provider.id)}
                                disabled={isProcessing}
                                title={`${provider.name} - ${provider.contextLimit / 1000}K context`}
                                className={`
                                    w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all border
                                    ${selectedProvider === provider.id
                                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                    }
                                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {provider.icon}
                            </button>
                        ))}
                    </div>

                    {/* Model Dropdown - Compact */}
                    <select
                        value={selectedModelId}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={isProcessing}
                        className="flex-1 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                    >
                        {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name} ({model.contextLimit / 1000}K)
                            </option>
                        ))}
                    </select>

                    {/* Tier Badge */}
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0 ${tierColors[selectedModel.costTier]}`}>
                        {selectedModel.costTier}
                    </div>
                </div>

                {/* Context Usage - Minimal */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div
                            className={`h-full ${contextColors.bar} transition-all duration-500 ${contextUsagePercent >= 90 ? 'animate-pulse' : ''}`}
                            style={{ width: `${contextUsagePercent}%` }}
                        />
                    </div>
                    <span className={`text-[8px] font-mono ${contextColors.text} shrink-0`}>
                        {contextUsagePercent.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Input Area - Compact */}
            <div className="px-3 py-2 border-t border-zinc-800/50 bg-[#09090b]">
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none"></div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Refine presentation..."
                            className="w-full bg-zinc-900 text-zinc-100 placeholder-zinc-600 border border-zinc-800 rounded-xl pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className={`
                                absolute right-1.5 p-1.5 rounded-lg transition-all
                                ${!input.trim() || isProcessing
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20 active:scale-95 hover:brightness-110'
                                }
                            `}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
                <div className="mt-1 flex justify-center">
                    <p className="text-[8px] text-zinc-600 font-medium">⌘↵ to send</p>
                </div>
            </div>
        </div>
    );
};

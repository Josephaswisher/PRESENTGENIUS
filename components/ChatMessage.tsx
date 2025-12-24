import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ClipboardIcon, CheckIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
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

export const ChatMessage: React.FC<ChatMessageProps> = ({ content, role, action, avatar }) => {
  return (
    <div className={`group flex gap-3 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start animate-slide-up`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${role === 'user'
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border border-blue-400/30'
          : 'bg-gradient-to-br from-purple-500 to-pink-600 border border-purple-400/30'
        }`}>
        {avatar || (role === 'user' ? '👤' : '✨')}
      </div>

      {/* Message Bubble */}
      <div
        className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm ${role === 'user'
            ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-cyan-50 border border-cyan-500/20'
            : 'bg-[#18181b] text-zinc-100 border border-zinc-700/50'
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
              <CheckIcon className="w-3.5 h-3.5" />
              Action: {action}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

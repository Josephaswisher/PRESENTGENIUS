/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HTML Import Assistant
 * AI-powered HTML import with automatic formatting into presentation slides
 */
import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  CodeBracketIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface HTMLSection {
  id: string;
  rawHtml: string;
  formattedHtml: string;
  status: 'idle' | 'formatting' | 'complete' | 'error';
  error?: string;
}

interface HTMLImportAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (formattedHtml: string) => void;
}

type ProcessingState = 'idle' | 'analyzing' | 'formatting' | 'complete' | 'error';

const HTMLImportAssistant: React.FC<HTMLImportAssistantProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [sections, setSections] = useState<HTMLSection[]>([
    { id: '1', rawHtml: '', formattedHtml: '', status: 'idle' }
  ]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [showCodeView, setShowCodeView] = useState<Record<string, boolean>>({});

  const handleAddSection = () => {
    const newSection: HTMLSection = {
      id: Date.now().toString(),
      rawHtml: '',
      formattedHtml: '',
      status: 'idle'
    };
    setSections(prev => [...prev, newSection]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSectionHtmlChange = (id: string, html: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, rawHtml: html } : s));
  };

  const toggleCodeView = (id: string) => {
    setShowCodeView(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFormatSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section || !section.rawHtml.trim()) {
      setError('Please paste some HTML content first');
      return;
    }

    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'formatting' as const, error: undefined } : s
    ));

    try {
      const { formatImportedHtml } = await import('../services/html-import-formatter');

      const formatted = await formatImportedHtml(section.rawHtml, (progress) => {
        setStatusMessage(progress);
      });

      setSections(prev => prev.map(s =>
        s.id === id ? { ...s, formattedHtml: formatted, status: 'complete' as const } : s
      ));
    } catch (err) {
      console.error('[HTMLImportAssistant] Error formatting HTML:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to format HTML';
      setSections(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'error' as const, error: errorMsg } : s
      ));
    }
  };

  const handleFormatAll = async () => {
    const sectionsToFormat = sections.filter(s => s.rawHtml.trim() && s.status !== 'complete');
    if (sectionsToFormat.length === 0) {
      setError('Please add HTML content to at least one section');
      return;
    }

    setError('');
    setProcessingState('formatting');

    for (const section of sectionsToFormat) {
      await handleFormatSection(section.id);
    }

    setProcessingState('complete');
  };

  const handleImport = () => {
    const allFormatted = sections
      .filter(s => s.formattedHtml)
      .map(s => s.formattedHtml)
      .join('\n\n');

    if (allFormatted) {
      onImport(allFormatted);
      handleClose();
    }
  };

  const handleClose = () => {
    setSections([{ id: '1', rawHtml: '', formattedHtml: '', status: 'idle' }]);
    setProcessingState('idle');
    setStatusMessage('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">HTML Import Assistant</h2>
              <p className="text-sm text-zinc-400">AI-powered formatting for LMArena, ChatGPT, and other HTML sources</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {/* Content - Scrollable Sections */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-cyan-400">{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-200">HTML Section {index + 1}</h3>
                    {section.status === 'complete' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {sections.length > 1 && (
                    <button
                      onClick={() => handleRemoveSection(section.id)}
                      className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                      title="Remove section"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Two-column layout for this section */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Raw HTML Input */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                      <DocumentTextIcon className="w-4 h-4" />
                      Raw HTML Input
                      <span className="text-zinc-600">({section.rawHtml.length} chars)</span>
                    </label>
                    <textarea
                      value={section.rawHtml}
                      onChange={(e) => handleSectionHtmlChange(section.id, e.target.value)}
                      placeholder="Paste HTML from LMArena, ChatGPT, etc..."
                      className="h-48 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-600 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <button
                      onClick={() => handleFormatSection(section.id)}
                      disabled={section.status === 'formatting' || !section.rawHtml.trim()}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {section.status === 'formatting' ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Formatting...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4" />
                          Format This Section
                        </>
                      )}
                    </button>
                  </div>

                  {/* Formatted Output */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <SparklesIcon className="w-4 h-4 text-cyan-400" />
                        Formatted Output
                        {section.status === 'complete' && (
                          <span className="text-green-500">✓ Ready</span>
                        )}
                      </label>
                      {section.status === 'complete' && section.formattedHtml && (
                        <button
                          onClick={() => toggleCodeView(section.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 bg-zinc-800/50 hover:bg-zinc-800 rounded transition-colors"
                          title={showCodeView[section.id] ? "View slides" : "View code"}
                        >
                          {showCodeView[section.id] ? (
                            <>
                              <EyeIcon className="w-3 h-3" />
                              Preview
                            </>
                          ) : (
                            <>
                              <CodeBracketIcon className="w-3 h-3" />
                              Code
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="h-48 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto">
                      {section.status === 'idle' && !section.formattedHtml && (
                        <div className="h-full flex items-center justify-center text-zinc-600">
                          <div className="text-center text-sm">
                            <SparklesIcon className="w-8 h-8 mx-auto opacity-50 mb-2" />
                            <p>Click "Format This Section"</p>
                          </div>
                        </div>
                      )}
                      {section.status === 'formatting' && (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <ArrowPathIcon className="w-8 h-8 mx-auto text-cyan-400 animate-spin mb-2" />
                            <p className="text-sm text-zinc-400">{statusMessage}</p>
                          </div>
                        </div>
                      )}
                      {section.status === 'complete' && section.formattedHtml && (
                        showCodeView[section.id] ? (
                          <pre className="p-3 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
                            {section.formattedHtml}
                          </pre>
                        ) : (
                          <div className="h-full w-full overflow-auto">
                            <iframe
                              srcDoc={section.formattedHtml}
                              className="w-full h-full border-0"
                              style={{ minHeight: '100%' }}
                              sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                              title={`Preview Section ${index + 1}`}
                            />
                          </div>
                        )
                      )}
                      {section.status === 'error' && (
                        <div className="h-full flex items-center justify-center p-4">
                          <div className="text-center text-sm">
                            <ExclamationTriangleIcon className="w-8 h-8 mx-auto text-red-400 mb-2" />
                            <p className="text-red-400">{section.error}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Section Button */}
            <button
              onClick={handleAddSection}
              className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 rounded-xl text-zinc-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span>
              <span>Add Another HTML Section</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="text-sm space-y-1">
            <div className="text-zinc-400">
              {sections.length} section{sections.length !== 1 ? 's' : ''} • {' '}
              {sections.filter(s => s.status === 'complete').length} formatted
            </div>
            {statusMessage && (
              <div className="text-cyan-400">{statusMessage}</div>
            )}
            {error && (
              <div className="text-red-400">{error}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {sections.some(s => s.rawHtml.trim() && s.status !== 'complete') && (
              <button
                onClick={handleFormatAll}
                disabled={processingState === 'formatting'}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5" />
                {processingState === 'formatting' ? 'Formatting All...' : 'Format All Sections'}
              </button>
            )}
            {sections.some(s => s.status === 'complete') && (
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Import {sections.filter(s => s.status === 'complete').length} Section{sections.filter(s => s.status === 'complete').length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HTMLImportAssistant;

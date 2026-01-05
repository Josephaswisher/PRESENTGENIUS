/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Slide Editor
 * Slide-by-slide editing interface with vertical scrolling
 * Each slide has its own isolated container for independent rendering
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { createIsolatedSlideHtml } from '../services/html-import-formatter';

interface Slide {
  id: string;
  content: string; // Raw section HTML content
  isolatedHtml: string; // Full isolated HTML document for iframe
  title: string; // Extracted slide title
  originalContent: string; // For change tracking
  status: 'idle' | 'editing' | 'modified' | 'refining' | 'error';
  error?: string;
}

interface SlideEditorProps {
  html: string;
  title: string;
  topic: string;
  onHtmlChange: (updatedHtml: string) => void;
  className?: string;
}

/**
 * Parse HTML to extract individual slides from <section> tags
 * Each slide gets its own isolated HTML container
 */
function parseSlides(html: string): Slide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = doc.querySelectorAll('section, [data-slide-container]');

  // Extract global styles to include in each isolated container
  const styleElements = doc.querySelectorAll('style');
  const globalStyles = Array.from(styleElements).map(s => s.innerHTML).join('\n');

  if (sections.length === 0) {
    // If no sections found, treat entire body as one slide
    const bodyContent = doc.body.innerHTML;
    return [{
      id: 'slide-1',
      content: bodyContent,
      isolatedHtml: createIsolatedSlideHtml(bodyContent, 'Slide 1'),
      title: 'Slide 1',
      originalContent: bodyContent,
      status: 'idle'
    }];
  }

  return Array.from(sections).map((section, index) => {
    const slideContent = section.outerHTML;
    const slideId = section.id || `slide-${index + 1}`;

    // Extract title from heading
    const heading = section.querySelector('h1, h2, h3');
    const title = heading?.textContent?.trim() || `Slide ${index + 1}`;

    return {
      id: slideId,
      content: slideContent,
      isolatedHtml: createIsolatedSlideHtml(slideContent, title),
      title,
      originalContent: slideContent,
      status: 'idle' as const
    };
  });
}

/**
 * Reconstruct full HTML from individual slides
 */
function reconstructHtml(slides: Slide[], originalHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHtml, 'text/html');

  // Extract the style and head content from original
  const styleTag = doc.querySelector('style');
  const headContent = Array.from(doc.head.children)
    .map(el => el.outerHTML)
    .join('\n');

  // Combine all slide content
  const allSlidesHtml = slides.map(s => s.content).join('\n\n');

  // Reconstruct with proper structure
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${headContent}
</head>
<body>
${allSlidesHtml}
</body>
</html>`;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
  html,
  title,
  topic,
  onHtmlChange,
  className = ''
}) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showCodeView, setShowCodeView] = useState<Record<string, boolean>>({});
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [refiningSlide, setRefiningSlide] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');

  // Parse slides on mount or when HTML changes
  useEffect(() => {
    const parsed = parseSlides(html);
    setSlides(parsed);
  }, [html]);

  const toggleCodeView = (id: string) => {
    setShowCodeView(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (slide: Slide) => {
    setEditingSlide(slide.id);
    setEditContent(slide.content);
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    setEditContent('');
  };

  const handleSaveEdit = (slideId: string) => {
    setSlides(prev => {
      const updated = prev.map(s => {
        if (s.id === slideId) {
          // Extract title from new content
          const parser = new DOMParser();
          const doc = parser.parseFromString(editContent, 'text/html');
          const heading = doc.querySelector('h1, h2, h3');
          const newTitle = heading?.textContent?.trim() || s.title;

          return {
            ...s,
            content: editContent,
            isolatedHtml: createIsolatedSlideHtml(editContent, newTitle),
            title: newTitle,
            status: 'modified' as const
          };
        }
        return s;
      });

      // Reconstruct full HTML and notify parent
      const reconstructed = reconstructHtml(updated, html);
      onHtmlChange(reconstructed);

      return updated;
    });

    setEditingSlide(null);
    setEditContent('');
  };

  // AI-powered slide refinement
  const handleRefineSlide = async (slideId: string) => {
    if (!refinePrompt.trim()) return;

    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;

    setSlides(prev => prev.map(s =>
      s.id === slideId ? { ...s, status: 'refining' as const } : s
    ));

    try {
      const { refineSingleSlide } = await import('../services/slide-refinement');

      const refinedHtml = await refineSingleSlide(
        slide.isolatedHtml,
        refinePrompt,
        slides.findIndex(s => s.id === slideId),
        { title, topic },
        (msg) => console.log('[SlideRefine]', msg)
      );

      // Extract the section content from the refined isolated HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(refinedHtml, 'text/html');
      const section = doc.querySelector('section, .slide-section');
      const newContent = section ? section.outerHTML : doc.body.innerHTML;

      // Extract new title
      const heading = doc.querySelector('h1, h2, h3');
      const newTitle = heading?.textContent?.trim() || slide.title;

      setSlides(prev => {
        const updated = prev.map(s => {
          if (s.id === slideId) {
            return {
              ...s,
              content: newContent,
              isolatedHtml: refinedHtml,
              title: newTitle,
              status: 'modified' as const
            };
          }
          return s;
        });

        // Reconstruct and notify parent
        const reconstructed = reconstructHtml(updated, html);
        onHtmlChange(reconstructed);

        return updated;
      });

      setRefiningSlide(null);
      setRefinePrompt('');
    } catch (error) {
      console.error('[SlideEditor] Refinement error:', error);
      setSlides(prev => prev.map(s =>
        s.id === slideId ? {
          ...s,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Refinement failed'
        } : s
      ));
    }
  };

  const handleDuplicateSlide = (slide: Slide) => {
    const newSlide: Slide = {
      id: `${slide.id}-copy-${Date.now()}`,
      content: slide.content,
      isolatedHtml: slide.isolatedHtml,
      title: `${slide.title} (Copy)`,
      originalContent: slide.content,
      status: 'idle'
    };

    setSlides(prev => {
      const slideIndex = prev.findIndex(s => s.id === slide.id);
      const updated = [
        ...prev.slice(0, slideIndex + 1),
        newSlide,
        ...prev.slice(slideIndex + 1)
      ];

      // Reconstruct and notify
      const reconstructed = reconstructHtml(updated, html);
      onHtmlChange(reconstructed);

      return updated;
    });
  };

  const handleStartRefine = (slideId: string) => {
    setRefiningSlide(slideId);
    setRefinePrompt('');
  };

  const handleCancelRefine = () => {
    setRefiningSlide(null);
    setRefinePrompt('');
  };

  const modifiedCount = useMemo(() =>
    slides.filter(s => s.status === 'modified').length,
    [slides]
  );

  return (
    <div className={`flex flex-col bg-zinc-950 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {slides.length} slide{slides.length !== 1 ? 's' : ''} • {' '}
              {modifiedCount > 0 && (
                <span className="text-cyan-400">{modifiedCount} modified</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Slides Container */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
            >
              {/* Slide Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <span className="text-base font-bold text-cyan-400">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-200">
                      {slide.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {slide.status === 'modified' && (
                        <span className="text-xs text-cyan-400 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Modified
                        </span>
                      )}
                      {slide.status === 'refining' && (
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <ArrowPathIcon className="w-3 h-3 animate-spin" />
                          AI Refining...
                        </span>
                      )}
                      {slide.status === 'error' && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          {slide.error || 'Error'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Preview/Code */}
                  {!editingSlide && !refiningSlide && (
                    <button
                      onClick={() => toggleCodeView(slide.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-cyan-400 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                      title={showCodeView[slide.id] ? "View preview" : "View code"}
                    >
                      {showCodeView[slide.id] ? (
                        <>
                          <EyeIcon className="w-3.5 h-3.5" />
                          Preview
                        </>
                      ) : (
                        <>
                          <CodeBracketIcon className="w-3.5 h-3.5" />
                          Code
                        </>
                      )}
                    </button>
                  )}

                  {/* AI Refine Button */}
                  {!editingSlide && refiningSlide !== slide.id && (
                    <button
                      onClick={() => handleStartRefine(slide.id)}
                      disabled={refiningSlide !== null || slide.status === 'refining'}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="AI-powered refinement"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      AI Refine
                    </button>
                  )}

                  {/* Duplicate Slide */}
                  <button
                    onClick={() => handleDuplicateSlide(slide)}
                    disabled={editingSlide !== null || refiningSlide !== null}
                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Duplicate slide"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  {editingSlide !== slide.id ? (
                    <button
                      onClick={() => handleStartEdit(slide)}
                      disabled={editingSlide !== null || refiningSlide !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(slide.id)}
                        className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Slide Content */}
              <div className="p-6">
                {editingSlide === slide.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-zinc-400 block">
                      Edit Slide HTML
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      placeholder="Edit the HTML content..."
                    />
                    <p className="text-xs text-zinc-500">
                      {editContent.length} characters
                    </p>
                  </div>
                ) : refiningSlide === slide.id ? (
                  /* AI Refine Mode */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-400">
                      <SparklesIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">AI-Powered Refinement</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Describe how you want to improve this slide. The AI will modify only this slide, keeping the rest of your presentation unchanged.
                    </p>
                    <textarea
                      value={refinePrompt}
                      onChange={(e) => setRefinePrompt(e.target.value)}
                      disabled={slide.status === 'refining'}
                      className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                      placeholder="e.g., 'Add more detail about pathophysiology' or 'Make the quiz questions more challenging' or 'Simplify for medical students'"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setRefinePrompt('Add more clinical details and examples')}
                          className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                        >
                          + Clinical details
                        </button>
                        <button
                          onClick={() => setRefinePrompt('Simplify the content for beginners')}
                          className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                        >
                          Simplify
                        </button>
                        <button
                          onClick={() => setRefinePrompt('Make it more interactive with quiz questions')}
                          className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                        >
                          + Quiz
                        </button>
                        <button
                          onClick={() => setRefinePrompt('Improve the visual layout and styling')}
                          className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                        >
                          Better styling
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelRefine}
                          disabled={slide.status === 'refining'}
                          className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRefineSlide(slide.id)}
                          disabled={!refinePrompt.trim() || slide.status === 'refining'}
                          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {slide.status === 'refining' ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-4 h-4" />
                              Refine Slide
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Preview below refinement UI */}
                    <div className="mt-4">
                      <label className="text-xs font-medium text-zinc-500 block mb-2">Current slide preview:</label>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                        <iframe
                          srcDoc={slide.isolatedHtml}
                          className="w-full h-full border-0"
                          sandbox="allow-same-origin allow-scripts"
                          title={`${slide.title} Preview`}
                        />
                      </div>
                    </div>
                  </div>
                ) : showCodeView[slide.id] ? (
                  /* Code View */
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto max-h-96">
                    <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
                      {slide.content}
                    </pre>
                  </div>
                ) : (
                  /* Preview - Using isolated HTML container */
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <iframe
                      srcDoc={slide.isolatedHtml}
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin allow-scripts"
                      title={`${slide.title} Preview`}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between text-sm">
          <div className="text-zinc-400">
            {slides.length} total slide{slides.length !== 1 ? 's' : ''}
            {modifiedCount > 0 && (
              <span className="ml-3 text-cyan-400">• {modifiedCount} modified</span>
            )}
          </div>
          {modifiedCount > 0 && (
            <div className="text-xs text-zinc-500">
              Changes are automatically saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SlideEditor };
export default SlideEditor;

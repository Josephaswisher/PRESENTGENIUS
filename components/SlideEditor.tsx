/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Slide Editor
 * Slide-by-slide editing interface with vertical scrolling
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface Slide {
  id: string;
  content: string; // HTML content of this slide
  originalContent: string; // For change tracking
  status: 'idle' | 'editing' | 'modified' | 'error';
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
 */
function parseSlides(html: string): Slide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = doc.querySelectorAll('section');

  if (sections.length === 0) {
    // If no sections found, treat entire HTML as one slide
    return [{
      id: '1',
      content: html,
      originalContent: html,
      status: 'idle'
    }];
  }

  return Array.from(sections).map((section, index) => {
    const slideContent = section.outerHTML;
    return {
      id: section.id || `slide-${index + 1}`,
      content: slideContent,
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
          return {
            ...s,
            content: editContent,
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

  const handleDuplicateSlide = (slide: Slide) => {
    const newSlide: Slide = {
      id: `${slide.id}-copy-${Date.now()}`,
      content: slide.content,
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
                      Slide {index + 1}
                    </h3>
                    {slide.status === 'modified' && (
                      <span className="text-xs text-cyan-400 flex items-center gap-1 mt-0.5">
                        <CheckCircleIcon className="w-3 h-3" />
                        Modified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Preview/Code */}
                  {!editingSlide && (
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

                  {/* Duplicate Slide */}
                  <button
                    onClick={() => handleDuplicateSlide(slide)}
                    disabled={editingSlide !== null}
                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Duplicate slide"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  {editingSlide !== slide.id ? (
                    <button
                      onClick={() => handleStartEdit(slide)}
                      disabled={editingSlide !== null}
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
                ) : showCodeView[slide.id] ? (
                  /* Code View */
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto max-h-96">
                    <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
                      {slide.content}
                    </pre>
                  </div>
                ) : (
                  /* Preview */
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <iframe
                      srcDoc={slide.content}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                      title={`Slide ${index + 1} Preview`}
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

export default SlideEditor;

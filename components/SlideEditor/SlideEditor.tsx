
/**
 * SlideEditor Component
 * Main container for the slide-by-slide editing interface
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useSlideStore } from '../../stores/slide.store';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { SlideCanvas } from './SlideCanvas';
import { SlideToolbar } from './SlideToolbar';
import { SpeakerNotesPanel } from './SpeakerNotesPanel';
import { TemplateLibraryPanel } from './TemplateLibraryPanel';
import { ThemeEditorPanel } from './ThemeEditorPanel';
import type { Slide, SlideElement, ThemeConfig } from '../../types/slides';

interface SlideEditorProps {
  html?: string;
  title?: string;
  topic?: string;
  onHtmlChange?: (html: string) => void;
  className?: string;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  html,
  title = 'Untitled Presentation',
  topic = 'General',
  onHtmlChange,
  className = '',
}) => {
  const {
    presentation,
    initPresentation,
    parseHtmlToSlides,
    exportToHtml,
    viewMode,
    showSpeakerNotes,
    showTemplateLibrary,
    showThemeEditor,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    deleteSlide,
    undo,
    redo,
  } = useSlideStore();

  const htmlUpdateRef = useRef<number | null>(null);

  // Initialize presentation from HTML if provided
  useEffect(() => {
    if (html && !presentation) {
      parseHtmlToSlides(html);
    } else if (!presentation) {
      initPresentation(title, topic);
    }
  }, [html, title, topic, presentation, parseHtmlToSlides, initPresentation]);

  // Export HTML when presentation changes (debounced to reduce churn)
  useEffect(() => {
    if (htmlUpdateRef.current) {
      clearTimeout(htmlUpdateRef.current);
    }

    if (presentation && onHtmlChange) {
      htmlUpdateRef.current = window.setTimeout(() => {
        const newHtml = exportToHtml();
        onHtmlChange(newHtml);
      }, 200);
    }

    return () => {
      if (htmlUpdateRef.current) {
        clearTimeout(htmlUpdateRef.current);
      }
    };
  }, [presentation, exportToHtml, onHtmlChange]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            e.preventDefault();
            break;
          case 'y':
            redo();
            e.preventDefault();
            break;
          case 'n':
            addSlide(currentSlideIndex);
            e.preventDefault();
            break;
        }
      }

      // Arrow navigation
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            if (currentSlideIndex > 0) {
              setCurrentSlide(currentSlideIndex - 1);
            }
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            if (presentation && currentSlideIndex < presentation.slides.length - 1) {
              setCurrentSlide(currentSlideIndex + 1);
            }
            break;
          case 'Delete':
          case 'Backspace':
            if (e.shiftKey && presentation && presentation.slides.length > 1) {
              deleteSlide(currentSlideIndex);
            }
            break;
        }
      }
    },
    [
      currentSlideIndex,
      presentation,
      setCurrentSlide,
      addSlide,
      deleteSlide,
      undo,
      redo,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!presentation) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
        <div className="text-zinc-500">Loading editor...</div>
      </div>
    );
  }

  // Presenter mode (fullscreen)
  if (viewMode === 'presenter') {
    return (
      <PresenterView
        presentation={presentation}
        currentSlideIndex={currentSlideIndex}
        onSlideChange={setCurrentSlide}
        onExit={() => useSlideStore.getState().setViewMode('edit')}
        theme={presentation.theme}
      />
    );
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>
      {/* Toolbar */}
      <SlideToolbar />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Thumbnail Sidebar */}
        <ThumbnailSidebar className="w-44 flex-shrink-0" />

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <SlideCanvas className="flex-1" />

          {/* Speaker Notes (bottom) */}
          {showSpeakerNotes && <SpeakerNotesPanel className="h-36 border-t border-zinc-700" />}
        </div>

        {/* Right Panels */}
        {showTemplateLibrary && (
          <TemplateLibraryPanel className="w-72 border-l border-zinc-700" />
        )}
        {showThemeEditor && (
          <ThemeEditorPanel className="w-72 border-l border-zinc-700" />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PRESENTER VIEW COMPONENT
// ============================================================================

interface PresenterViewProps {
  presentation: any;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onExit: () => void;
  theme: ThemeConfig;
}

const PresenterView: React.FC<PresenterViewProps> = ({
  presentation,
  currentSlideIndex,
  onSlideChange,
  onExit,
  theme,
}) => {
  const currentSlide = presentation.slides[currentSlideIndex];
  const nextSlide = presentation.slides[currentSlideIndex + 1];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          if (currentSlideIndex > 0) {
            onSlideChange(currentSlideIndex - 1);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          if (currentSlideIndex < presentation.slides.length - 1) {
            onSlideChange(currentSlideIndex + 1);
          }
          break;
        case 'Escape':
          onExit();
          break;
      }
    },
    [currentSlideIndex, presentation.slides.length, onSlideChange, onExit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* Main Slide (Left 2/3) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-5xl aspect-video bg-zinc-900 rounded-lg shadow-2xl overflow-hidden"
          style={{
            background: currentSlide?.background?.value || '#1e293b',
          }}
        >
          <SlideContent slide={currentSlide} theme={theme} />
        </div>
      </div>

      {/* Presenter Panel (Right 1/3) */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-700 flex flex-col">
        {/* Timer & Progress */}
        <div className="p-4 border-b border-zinc-700">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-mono text-cyan-400">00:00</span>
            <span className="text-sm text-zinc-400">
              {currentSlideIndex + 1} / {presentation.slides.length}
            </span>
          </div>
          <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{
                width: `${((currentSlideIndex + 1) / presentation.slides.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Next Slide Preview */}
        <div className="p-4 border-b border-zinc-700">
          <h3 className="text-xs text-zinc-500 uppercase mb-2">Next Slide</h3>
          {nextSlide ? (
            <div className="aspect-video bg-zinc-800 rounded border border-zinc-700 overflow-hidden">
              <SlideContent slide={nextSlide} theme={theme} compact />
            </div>
          ) : (
            <div className="aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-500">End of presentation</span>
            </div>
          )}
        </div>

        {/* Speaker Notes */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-xs text-zinc-500 uppercase mb-2">Speaker Notes</h3>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap">
            {currentSlide?.speakerNotes || 'No notes for this slide.'}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={onExit}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-zinc-200 transition-colors"
          >
            Exit Presenter View (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

const SlideContent: React.FC<{ slide: Slide; theme: ThemeConfig; compact?: boolean }> = ({ slide, theme, compact = false }) => {
  if (!slide) return null;
  return (
    <div className="relative w-full h-full" style={{ padding: compact ? '0.75rem' : '1.5rem' }}>
      {slide.elements.map((element: SlideElement) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${element.position.x}%`,
          top: `${element.position.y}%`,
          width: `${element.position.width}%`,
          height: `${element.position.height}%`,
          fontSize: element.style?.fontSize || '1rem',
          fontWeight: element.style?.fontWeight || 'normal',
          fontFamily: element.style?.fontFamily || theme.typography.bodyFont,
          color: element.style?.color || theme.colors.text,
          backgroundColor: element.style?.backgroundColor || 'transparent',
          textAlign: element.style?.textAlign || 'left',
          padding: element.style?.padding || '0.5rem',
          borderRadius: element.style?.borderRadius || '0',
          opacity: element.style?.opacity ?? 1,
          overflow: 'hidden',
        };

        const content = (() => {
          switch (element.type) {
            case 'heading':
              return <h1 className="m-0">{element.content}</h1>;
            case 'subheading':
              return <h2 className="m-0">{element.content}</h2>;
            case 'paragraph':
              return <p className="m-0 whitespace-pre-wrap">{element.content}</p>;
            case 'bullet-list':
              return (
                <ul className="m-0 pl-4 space-y-1">
                  {element.content.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            case 'numbered-list':
              return (
                <ol className="m-0 pl-4 space-y-1">
                  {element.content.split('\n').map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              );
            case 'image':
              return <img src={element.content} alt="" className="w-full h-full object-cover rounded" />;
            case 'quote':
              return <blockquote className="m-0 italic border-l-4 border-cyan-500 pl-4">{element.content}</blockquote>;
            case 'divider':
              return <hr className="border-t border-current" />;
            case 'code-block':
              return (
                <pre className="m-0 p-3 bg-zinc-900 rounded font-mono text-sm overflow-x-auto">
                  <code>{element.content}</code>
                </pre>
              );
            default:
              return <div>{element.content}</div>;
          }
        })();

        return (
          <div key={element.id} style={style} className="slide-element">
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default SlideEditor;

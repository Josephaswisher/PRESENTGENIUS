/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PresentGenius - Enhanced Fullscreen Presentation Mode
 * Full presenter controls with slide navigation, editing, and HTML import
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  HomeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  ArrowsUpDownIcon,
  CheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface PresentationModeProps {
  html: string;
  title: string;
  onClose: () => void;
  onUpdateHtml?: (html: string) => void;
}

interface SlideInfo {
  id: string;
  index: number;
  title: string;
  html: string; // Complete isolated HTML for iframe
  rawContent: string; // Raw content for editing
}

// Extract styles from the original HTML document
function extractGlobalStyles(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const styles: string[] = [];

  // Get all style tags
  doc.querySelectorAll('style').forEach(style => {
    styles.push(style.innerHTML);
  });

  // Get linked stylesheets (we'll inline common ones)
  const defaultStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      min-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      scroll-behavior: smooth;
    }
    section, .slide-section, .slide {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 4rem;
    }
    h1, h2, h3, h4, h5, h6 { color: #f1f5f9; }
    h1 { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; }
    h2 { font-size: 2.25rem; font-weight: 600; margin-bottom: 0.75rem; }
    h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { font-size: 1.25rem; line-height: 1.75; margin-bottom: 1rem; color: #cbd5e1; }
    ul, ol { padding-left: 2rem; margin-bottom: 1rem; }
    li { font-size: 1.125rem; line-height: 1.75; margin-bottom: 0.5rem; color: #cbd5e1; }
    img { max-width: 100%; height: auto; border-radius: 0.5rem; }
    code { background: #1e293b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: monospace; }
    pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    .text-cyan-400, .text-cyan-500 { color: #22d3ee; }
    .text-blue-400, .text-blue-500 { color: #60a5fa; }
    .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
    button {
      cursor: pointer;
      font-size: 1rem;
      padding: 0.75rem 1.5rem;
      max-width: 100%;
    }
    .quiz-option, .interactive-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
      font-size: 1.125rem;
    }
    .quiz-option:hover, .interactive-btn:hover {
      background: rgba(255,255,255,0.2);
      border-color: #22d3ee;
    }
  `;

  return defaultStyles + '\n' + styles.join('\n');
}

// Create a complete isolated HTML document for a single slide
function createIsolatedSlideHtml(content: string, globalStyles: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${globalStyles}</style>
</head>
<body>
  ${content}
</body>
</html>`;
}

// Parse slides from HTML - extract sections as separate slides
function parseSlides(html: string, title: string): SlideInfo[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const globalStyles = extractGlobalStyles(html);

  // Try multiple selectors to find slides
  let sections = doc.querySelectorAll('section.slide-section, section[id^="slide-"]');
  if (sections.length === 0) {
    sections = doc.querySelectorAll('section');
  }
  if (sections.length === 0) {
    sections = doc.querySelectorAll('.slide');
  }

  const slideList: SlideInfo[] = [];

  if (sections.length > 0) {
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3');
      const rawContent = section.outerHTML;
      slideList.push({
        id: section.id || `slide-${index + 1}`,
        index,
        title: heading?.textContent?.trim() || `Slide ${index + 1}`,
        html: createIsolatedSlideHtml(rawContent, globalStyles),
        rawContent
      });
    });
  } else {
    // No sections found - treat entire body as single slide
    const bodyContent = doc.body.innerHTML;
    slideList.push({
      id: 'slide-1',
      index: 0,
      title: title,
      html: createIsolatedSlideHtml(bodyContent, globalStyles),
      rawContent: bodyContent
    });
  }

  return slideList;
}

// Reconstruct full HTML from slides
function reconstructHtml(slides: SlideInfo[], originalHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHtml, 'text/html');

  // Clear body and add slides
  doc.body.innerHTML = slides.map(slide => slide.rawContent).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  ${doc.head.innerHTML}
</head>
<body>
  ${doc.body.innerHTML}
</body>
</html>`;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  html,
  title,
  onClose,
  onUpdateHtml
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval] = useState(5000);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [showEditSlideModal, setShowEditSlideModal] = useState(false);
  const [newSlideHtml, setNewSlideHtml] = useState('');
  const [editSlideHtml, setEditSlideHtml] = useState('');
  const [editSlideIndex, setEditSlideIndex] = useState(-1);
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse slides from HTML on mount or when html changes
  useEffect(() => {
    const parsedSlides = parseSlides(html, title);
    setSlides(parsedSlides);
  }, [html, title]);

  const totalSlides = slides.length;

  // Get current slide HTML
  const currentSlideHtml = useMemo(() => {
    return slides[currentSlide]?.html || '';
  }, [slides, currentSlide]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToFirst = useCallback(() => setCurrentSlide(0), []);
  const goToLast = useCallback(() => setCurrentSlide(totalSlides - 1), [totalSlides]);

  // Scroll functions for up/down navigation within current slide
  const scrollUp = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      const iframe = iframeRef.current;
      const scrollAmount = 100; // pixels to scroll
      iframe.contentWindow.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const scrollDown = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      const iframe = iframeRef.current;
      const scrollAmount = 100; // pixels to scroll
      iframe.contentWindow.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  // Slide management functions
  const addSlide = useCallback((htmlContent: string, afterIndex?: number) => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.length;
    const globalStyles = extractGlobalStyles(html);

    // Wrap in section if not already
    let content = htmlContent.trim();
    if (!content.startsWith('<section')) {
      content = `<section class="slide-section" id="slide-${insertIndex + 1}">${content}</section>`;
    }

    // Parse title from content
    const tempParser = new DOMParser();
    const tempDoc = tempParser.parseFromString(content, 'text/html');
    const heading = tempDoc.querySelector('h1, h2, h3');

    const newSlide: SlideInfo = {
      id: `slide-${Date.now()}`,
      index: insertIndex,
      title: heading?.textContent?.trim() || `Slide ${insertIndex + 1}`,
      html: createIsolatedSlideHtml(content, globalStyles),
      rawContent: content
    };

    const newSlides = [...slides];
    newSlides.splice(insertIndex, 0, newSlide);

    // Update indices
    newSlides.forEach((slide, idx) => {
      slide.index = idx;
    });

    setSlides(newSlides);
    setCurrentSlide(insertIndex);

    // Propagate changes
    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml]);

  const updateSlide = useCallback((index: number, htmlContent: string) => {
    const globalStyles = extractGlobalStyles(html);

    // Wrap in section if not already
    let content = htmlContent.trim();
    if (!content.startsWith('<section')) {
      content = `<section class="slide-section" id="slide-${index + 1}">${content}</section>`;
    }

    // Parse title from content
    const tempParser = new DOMParser();
    const tempDoc = tempParser.parseFromString(content, 'text/html');
    const heading = tempDoc.querySelector('h1, h2, h3');

    const newSlides = [...slides];
    newSlides[index] = {
      ...newSlides[index],
      title: heading?.textContent?.trim() || `Slide ${index + 1}`,
      html: createIsolatedSlideHtml(content, globalStyles),
      rawContent: content
    };

    setSlides(newSlides);

    // Propagate changes
    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml]);

  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return; // Keep at least one slide

    const newSlides = slides.filter((_, idx) => idx !== index);

    // Update indices
    newSlides.forEach((slide, idx) => {
      slide.index = idx;
    });

    setSlides(newSlides);

    // Adjust current slide if needed
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }

    // Propagate changes
    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, currentSlide, html, onUpdateHtml]);

  const duplicateSlide = useCallback((index: number) => {
    const slide = slides[index];
    if (!slide) return;

    addSlide(slide.rawContent, index);
  }, [slides, addSlide]);

  const moveSlide = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);

    // Update indices
    newSlides.forEach((slide, idx) => {
      slide.index = idx;
    });

    setSlides(newSlides);
    setCurrentSlide(toIndex);

    // Propagate changes
    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= totalSlides - 1) {
            setIsAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, autoPlayInterval, totalSlides]);

  // Fullscreen control
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Auto-hide controls
  const resetHideTimeout = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (!showThumbnails && !isEditMode) {
        setShowControls(false);
      }
    }, 3000);
  }, [showThumbnails, isEditMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys when modals are open
      if (showAddSlideModal || showEditSlideModal) return;

      switch (e.key) {
        case 'Escape':
          if (showThumbnails) {
            setShowThumbnails(false);
          } else if (isEditMode) {
            setIsEditMode(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          scrollUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          scrollDown();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'PageDown':
          e.preventDefault();
          // Check if at bottom of current slide, if so go to next slide
          if (iframeRef.current?.contentWindow) {
            const win = iframeRef.current.contentWindow;
            const isAtBottom = (win.innerHeight + win.scrollY) >= win.document.body.scrollHeight - 10;
            if (isAtBottom) {
              nextSlide();
            } else {
              scrollDown();
            }
          } else {
            nextSlide();
          }
          break;
        case 'PageUp':
          e.preventDefault();
          // Check if at top of current slide, if so go to previous slide
          if (iframeRef.current?.contentWindow) {
            const win = iframeRef.current.contentWindow;
            const isAtTop = win.scrollY <= 10;
            if (isAtTop) {
              prevSlide();
            } else {
              scrollUp();
            }
          } else {
            prevSlide();
          }
          break;
        case 'Home':
          e.preventDefault();
          goToFirst();
          break;
        case 'End':
          e.preventDefault();
          goToLast();
          break;
        case 'f':
        case 'F':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowThumbnails(prev => !prev);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsAutoPlay(prev => !prev);
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          setIsEditMode(prev => !prev);
          break;
        case 'a':
        case 'A':
          if (isEditMode) {
            e.preventDefault();
            setShowAddSlideModal(true);
          }
          break;
      }
      // Show controls on any key press
      setShowControls(true);
      resetHideTimeout();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextSlide, prevSlide, goToFirst, goToLast, scrollUp, scrollDown, showThumbnails, isEditMode, showAddSlideModal, showEditSlideModal, toggleFullscreen, resetHideTimeout]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    resetHideTimeout();
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [resetHideTimeout]);

  const handleMouseMove = () => {
    setShowControls(true);
    resetHideTimeout();
  };

  // Handle add slide
  const handleAddSlide = () => {
    if (newSlideHtml.trim()) {
      addSlide(newSlideHtml, currentSlide);
      setNewSlideHtml('');
      setShowAddSlideModal(false);
    }
  };

  // Handle edit slide
  const handleEditSlide = () => {
    if (editSlideHtml.trim() && editSlideIndex >= 0) {
      updateSlide(editSlideIndex, editSlideHtml);
      setEditSlideHtml('');
      setEditSlideIndex(-1);
      setShowEditSlideModal(false);
    }
  };

  // Open edit modal for a slide
  const openEditModal = (index: number) => {
    setEditSlideIndex(index);
    setEditSlideHtml(slides[index]?.rawContent || '');
    setShowEditSlideModal(true);
  };

  // Progress percentage
  const progressPercent = totalSlides > 1 ? ((currentSlide) / (totalSlides - 1)) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black"
      onMouseMove={handleMouseMove}
      onClick={() => {
        setShowControls(true);
        resetHideTimeout();
      }}
    >
      {/* Top Control Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent
                    transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Title & Slide Counter */}
          <div className="flex items-center gap-4">
            <h2 className="text-white font-semibold text-lg truncate max-w-md">
              {title}
            </h2>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <span className="text-cyan-400 font-bold">{currentSlide + 1}</span>
              <span className="text-white/50">/</span>
              <span className="text-white/70">{totalSlides}</span>
            </div>
            {isEditMode && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded">
                EDIT MODE
              </span>
            )}
          </div>

          {/* Right: Top Controls */}
          <div className="flex items-center gap-2">
            {/* Edit Mode Toggle */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-lg transition-colors ${isEditMode ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Toggle Edit Mode (E)"
            >
              <PencilIcon className="w-5 h-5" />
            </button>

            {/* Add Slide Button (only in edit mode) */}
            {isEditMode && (
              <button
                onClick={() => setShowAddSlideModal(true)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                title="Add Slide (A)"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}

            {/* Thumbnail Grid Toggle */}
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2 rounded-lg transition-colors ${showThumbnails ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Slide Overview (G)"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              title="Exit Presentation (Esc)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content - Current Slide in Isolated Iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={currentSlideHtml}
        className="w-full h-full border-none"
        title={`${title} - Slide ${currentSlide + 1}`}
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
        key={`slide-${currentSlide}-${slides[currentSlide]?.id}`}
      />

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent
                    transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}
      >
        <div className="flex items-center justify-center gap-4 px-6 py-5">
          {/* Go to First */}
          <button
            onClick={goToFirst}
            disabled={currentSlide === 0}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="First Slide (Home)"
          >
            <HomeIcon className="w-5 h-5" />
          </button>

          {/* Previous Slide */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous Slide (←)"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          {/* Slide Dots / Mini Progress */}
          <div className="flex items-center gap-1.5 px-4">
            {totalSlides <= 15 ? (
              // Show dots for small presentations
              slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'bg-cyan-400 scale-125'
                      : idx < currentSlide
                        ? 'bg-white/50 hover:bg-white/70'
                        : 'bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))
            ) : (
              // Show compact progress for large presentations
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-sm font-mono">
                  {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                </span>
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Next Slide */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Slide (→)"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-2 rounded-lg transition-colors ${isAutoPlay ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isAutoPlay ? 'Pause Auto-Play (P)' : 'Start Auto-Play (P)'}
          >
            {isAutoPlay ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center justify-center gap-6 pb-3 text-white/40 text-xs">
          <span>← → Slides</span>
          <span>↑ ↓ Scroll</span>
          <span>Space Next</span>
          <span>G Overview</span>
          <span>E Edit</span>
          <span>P Auto-play</span>
          <span>Esc Exit</span>
        </div>
      </div>

      {/* Left/Right Click Zones for Navigation */}
      {!isEditMode && (
        <>
          <div
            className="absolute left-0 top-20 bottom-20 w-1/4 cursor-pointer z-30 group"
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeftIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div
            className="absolute right-0 top-20 bottom-20 w-1/4 cursor-pointer z-30 group"
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRightIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </>
      )}

      {/* Thumbnail Grid Overlay with Edit Controls */}
      {showThumbnails && (
        <div
          className="absolute inset-0 z-40 bg-black/95 backdrop-blur-sm overflow-auto p-8"
          onClick={() => !isEditMode && setShowThumbnails(false)}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-white text-xl font-semibold">Slide Overview</h3>
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAddSlideModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Slide
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 transition-all group ${
                    idx === currentSlide ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Slide preview iframe */}
                  <iframe
                    srcDoc={slide.html}
                    className="w-full h-full pointer-events-none transform scale-100"
                    title={`Slide ${idx + 1} preview`}
                    sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                    style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                  />

                  {/* Click overlay to select slide */}
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(idx);
                      if (!isEditMode) setShowThumbnails(false);
                    }}
                  />

                  {/* Slide number badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold z-10 ${
                    idx === currentSlide ? 'bg-cyan-500 text-white' : 'bg-black/70 text-white/70'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Slide title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xs truncate">{slide.title}</p>
                  </div>

                  {/* Edit controls (visible in edit mode) */}
                  {isEditMode && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(idx); }}
                        className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-colors"
                        title="Edit slide HTML"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                        className="p-1.5 bg-purple-500/80 hover:bg-purple-500 text-white rounded transition-colors"
                        title="Duplicate slide"
                      >
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      </button>
                      {idx > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSlide(idx, idx - 1); }}
                          className="p-1.5 bg-gray-500/80 hover:bg-gray-500 text-white rounded transition-colors"
                          title="Move up"
                        >
                          <ArrowsUpDownIcon className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      )}
                      {slides.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                          className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                          title="Delete slide"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add slide card (in edit mode) */}
              {isEditMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddSlideModal(true); }}
                  className="aspect-video bg-zinc-900/50 rounded-lg border-2 border-dashed border-white/20 hover:border-green-500/50 hover:bg-green-500/10 transition-all flex flex-col items-center justify-center gap-2 text-white/50 hover:text-green-400"
                >
                  <PlusIcon className="w-8 h-8" />
                  <span className="text-sm">Add Slide</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Slide Modal */}
      {showAddSlideModal && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setShowAddSlideModal(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <ClipboardDocumentIcon className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Add New Slide</h3>
              </div>
              <button
                onClick={() => setShowAddSlideModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-zinc-400 text-sm mb-3">
                Paste HTML content below to create a new slide. You can paste HTML from LMArena, ChatGPT, or any other source.
              </p>
              <textarea
                ref={textareaRef}
                value={newSlideHtml}
                onChange={(e) => setNewSlideHtml(e.target.value)}
                placeholder={`<section class="slide-section">
  <h2>Your Slide Title</h2>
  <p>Your content here...</p>
  <ul>
    <li>Point 1</li>
    <li>Point 2</li>
  </ul>
</section>`}
                className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button
                onClick={() => setShowAddSlideModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlide}
                disabled={!newSlideHtml.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="w-4 h-4" />
                Add Slide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slide Modal */}
      {showEditSlideModal && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setShowEditSlideModal(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <PencilIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Edit Slide {editSlideIndex + 1}</h3>
              </div>
              <button
                onClick={() => setShowEditSlideModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-zinc-400 text-sm mb-3">
                Edit the HTML content for this slide. Changes will be applied when you save.
              </p>
              <textarea
                value={editSlideHtml}
                onChange={(e) => setEditSlideHtml(e.target.value)}
                className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button
                onClick={() => setShowEditSlideModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSlide}
                disabled={!editSlideHtml.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

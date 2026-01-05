/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PresentGenius - Enhanced Fullscreen Presentation Mode
 * Full presenter controls with slide navigation, progress, and keyboard support
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
  HomeIcon
} from '@heroicons/react/24/outline';

interface PresentationModeProps {
  html: string;
  title: string;
  onClose: () => void;
}

interface SlideInfo {
  id: string;
  index: number;
  title: string;
  element: string;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  html,
  title,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5000);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Parse slides from HTML
  const slides = useMemo<SlideInfo[]>(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections = doc.querySelectorAll('section.slide-section, section[id^="slide-"], .slide, section');

    const slideList: SlideInfo[] = [];
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3');
      slideList.push({
        id: section.id || `slide-${index + 1}`,
        index,
        title: heading?.textContent?.trim() || `Slide ${index + 1}`,
        element: section.outerHTML
      });
    });

    // If no sections found, treat entire content as single slide
    if (slideList.length === 0) {
      slideList.push({
        id: 'slide-1',
        index: 0,
        title: title,
        element: html
      });
    }

    return slideList;
  }, [html, title]);

  const totalSlides = slides.length;

  // Generate HTML for current slide with navigation script
  const slideHtml = useMemo(() => {
    if (slides.length === 0) return html;

    // Create a full HTML document with just the current slide
    const currentSlideContent = slides[currentSlide]?.element || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    section, .slide-section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2rem 4rem;
    }
    /* Ensure content fits viewport */
    body > section:first-child,
    body > div:first-child {
      height: 100vh;
      overflow: auto;
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', system-ui, sans-serif;">
  ${currentSlideContent}
</body>
</html>`;
  }, [slides, currentSlide, html]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (showThumbnails) {
            setShowThumbnails(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
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
      }
      // Show controls on any key press
      setShowControls(true);
      resetHideTimeout();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextSlide, prevSlide, goToFirst, goToLast, showThumbnails]);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      toggleFullscreen();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
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
  };

  // Auto-hide controls
  const resetHideTimeout = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (!showThumbnails) {
        setShowControls(false);
      }
    }, 3000);
  }, [showThumbnails]);

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
          </div>

          {/* Right: Top Controls */}
          <div className="flex items-center gap-2">
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

      {/* Main Content - Current Slide */}
      <iframe
        srcDoc={slideHtml}
        className="w-full h-full border-none"
        title={`${title} - Slide ${currentSlide + 1}`}
        sandbox="allow-scripts allow-same-origin allow-modals"
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
          <span>← → Navigate</span>
          <span>Space Next</span>
          <span>G Overview</span>
          <span>P Auto-play</span>
          <span>F Fullscreen</span>
          <span>Esc Exit</span>
        </div>
      </div>

      {/* Left/Right Click Zones for Navigation */}
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

      {/* Thumbnail Grid Overlay */}
      {showThumbnails && (
        <div
          className="absolute inset-0 z-40 bg-black/95 backdrop-blur-sm overflow-auto p-8"
          onClick={() => setShowThumbnails(false)}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-semibold">Slide Overview</h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                    setShowThumbnails(false);
                  }}
                  className={`relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    idx === currentSlide ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-white/10 hover:border-white/30'
                  }`}
                >
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
                  {/* Mini preview placeholder */}
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <span className="text-4xl font-bold">{idx + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

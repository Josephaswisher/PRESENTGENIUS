/**
 * Presentation Mode - Full-screen presentation with animations
 * Supports keyboard navigation, speaker notes, and drawing
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  QrCodeIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid,
  FlagIcon as FlagIconSolid,
  QuestionMarkCircleIcon as QuestionIconSolid,
  SparklesIcon as SparklesIconSolid,
} from '@heroicons/react/24/solid';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ScrollHints } from './ScrollHints';
import { ScrollProgressIndicator } from './ScrollProgressIndicator';
import { MiniMapNavigation } from './MiniMapNavigation';
import { PresentationDrawingLayer } from './PresentationDrawingLayer';
import { PictureInPictureVideo } from './PictureInPictureVideo';
import {
  createSession,
  updateSlide,
  leaveSession,
  SessionState
} from '../services/audience-sync';
import { toggleFullscreen, onFullscreenChange, type FullscreenResult } from '../utils/fullscreen-api';
import { queryIFrameElements, waitForIFrameReady, type IFrameResult } from '../utils/iframe-helpers';
import { getScrollStyles } from '../utils/ios-scroll-fix';
import { detectBrowser, type BrowserInfo } from '../utils/browser-detection';
import { usePrompt } from '../hooks/usePrompt';
import { useSlideScrollMemory } from '../hooks/useSlideScrollMemory';
import {
  initializeProgressiveDisclosure,
  injectProgressiveDisclosureStyles,
  enableProgressiveDisclosure,
  disableProgressiveDisclosure,
  resetProgressiveDisclosure,
  revealNext,
  revealPrevious,
  revealAll,
  isFullyRevealed,
  getProgressString,
  type ProgressiveDisclosureState,
} from '../utils/progressive-disclosure';


import { useBookmarks, Bookmark } from '../hooks/useBookmarks';
import { BookmarkManager } from './BookmarkManager';
import { detectContentTypeAndBackground, applyBackgroundStyle } from '../utils/content-detector';

interface PresentationModeProps {
  html: string;
  onClose: () => void;
  title?: string;
}

interface SlideInfo {
  index: number;
  total: number;
  element: Element | null;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  html,
  onClose,
  title,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');

  // Generate a presentation ID based on title
  const presentationId = useMemo(() => {
    return title ? `pres-${title.replace(/\s+/g, '-').toLowerCase()}` : `pres-${Date.now()}`;
  }, [title]);

  // Speaker notes state
  const [speakerNotes, setSpeakerNotes] = useState<{[key: number]: string}>({});

  // Slide thumbnails state
  const [showThumbnails, setShowThumbnails] = useState(false);

  // Laser pointer state
  const [laserPointer, setLaserPointer] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });

  // Notes editor state
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [presentationNotes, setPresentationNotes] = useState('');

  // Mini-map navigation state
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Bookmark states
  const [showBookmarkManager, setShowBookmarkManager] = useState(false);
  const [showBookmarkTypeSelector, setShowBookmarkTypeSelector] = useState(false);

  // Zoom/pan states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Timer states
  const [targetDuration, setTargetDuration] = useState<number | null>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  // Settings persistence
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(10000); // milliseconds

  // Progressive disclosure states
  const [progressiveDisclosureEnabled, setProgressiveDisclosureEnabled] = useState(false);
  const [progressiveDisclosureStates, setProgressiveDisclosureStates] = useState<{[slideIndex: number]: ProgressiveDisclosureState}>({});

  // Picture-in-Picture video state
  const [showPiPVideo, setShowPiPVideo] = useState(false);
  const [pipVideoSource, setPipVideoSource] = useState<string | undefined>(undefined);
  const [enableWebcam, setEnableWebcam] = useState(false);

  // Split-screen mode state
  const [showSplitScreen, setShowSplitScreen] = useState(false);
  const [splitDividerPosition, setSplitDividerPosition] = useState(60); // percentage (60% slide, 40% notes)
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  // Transition type state
  const [transitionType, setTransitionType] = useState<'fade' | 'slide' | 'zoom' | 'flip' | 'cube'>('fade');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { prompt: showPrompt } = usePrompt();

  // Scroll memory hook (sessionStorage - clears on tab close)
  const { saveScrollPosition, getScrollPosition } = useSlideScrollMemory('presentgenius-scroll');

  // Bookmarks hook (persisted to localStorage per presentation)
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkNote,
    getBookmark,
    hasBookmark,
    clearAllBookmarks,
    exportBookmarks,
    importBookmarks,
  } = useBookmarks({ presentationId: title || 'default' });

  // Per-slide zoom levels (persisted to localStorage)
  const [slideZoomLevels, setSlideZoomLevels] = useState<{[key: number]: number}>({});

  // Content-aware backgrounds per slide
  const [slideBackgrounds, setSlideBackgrounds] = useState<{[key: number]: string}>({});

  const strictSandbox = import.meta.env.VITE_STRICT_IFRAME_SANDBOX !== 'false';
  const [sandboxPermissions, setSandboxPermissions] = useState<string>(
    strictSandbox ? 'allow-scripts' : 'allow-scripts allow-same-origin'
  );
  const sandboxRelaxedRef = useRef(false);

  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);

  // Detect browser on mount
  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const SETTINGS_KEY = 'presentgenius-presentation-settings';
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.autoAdvanceInterval) setAutoAdvanceInterval(settings.autoAdvanceInterval);
        if (settings.defaultTimerTarget) setTargetDuration(settings.defaultTimerTarget);
        if (typeof settings.showControlsOnStart === 'boolean') setShowControls(settings.showControlsOnStart);
        if (settings.slideZoomLevels) setSlideZoomLevels(settings.slideZoomLevels);
        if (typeof settings.showSplitScreen === 'boolean') setShowSplitScreen(settings.showSplitScreen);
        if (settings.splitDividerPosition) setSplitDividerPosition(settings.splitDividerPosition);
      }
    } catch (error) {
      console.error('Failed to load presentation settings:', error);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    const SETTINGS_KEY = 'presentgenius-presentation-settings';
    try {
      const settings = {
        autoAdvanceInterval,
        defaultTimerTarget: targetDuration,
        showControlsOnStart: showControls,
        slideZoomLevels,
        showSplitScreen,
        splitDividerPosition,
        transitionType,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save presentation settings:', error);
    }
  }, [autoAdvanceInterval, targetDuration, showControls, slideZoomLevels, showSplitScreen, splitDividerPosition, transitionType]);

  // Listen for fullscreen changes
  useEffect(() => {
    const cleanup = onFullscreenChange((isFullscreen) => {
      // Clear error when successfully entering/exiting fullscreen
      if (fullscreenError) {
        setFullscreenError(null);
      }
    });
    return cleanup;
  }, [fullscreenError]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= totalSlides - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, autoAdvanceInterval); // Use configurable interval
    } else {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    }

    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [isPlaying, totalSlides, autoAdvanceInterval]);

  // Hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Helper functions for smooth scrolling within slides
  const scrollSlideByViewport = useCallback((direction: 1 | -1) => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) return;

    const scrollAmount = slide.clientHeight * 0.9; // Scroll 90% of viewport
    slide.scrollBy({ top: scrollAmount * direction, behavior: 'smooth' });
  }, [currentSlide]);

  const scrollSlideToTop = useCallback(() => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) return;

    slide.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSlide]);

  const scrollSlideToBottom = useCallback(() => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) return;

    slide.scrollTo({ top: slide.scrollHeight, behavior: 'smooth' });
  }, [currentSlide]);

  const isSlideAtBottom = useCallback((): boolean => {
    if (!iframeRef.current?.contentDocument) return true;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) return true;

    const atBottom = slide.scrollTop >= (slide.scrollHeight - slide.clientHeight - 10);
    return atBottom;
  }, [currentSlide]);

  // Zoom helper functions for per-slide content zoom
  const adjustSlideZoom = useCallback((delta: number) => {
    const currentZoom = slideZoomLevels[currentSlide] || 1;
    const newZoom = Math.min(3, Math.max(0.5, currentZoom + delta));

    setSlideZoomLevels(prev => ({
      ...prev,
      [currentSlide]: newZoom,
    }));
  }, [currentSlide, slideZoomLevels]);

  const resetSlideZoom = useCallback(() => {
    setSlideZoomLevels(prev => ({
      ...prev,
      [currentSlide]: 1,
    }));
  }, [currentSlide]);

  // Keyboard navigation - Enhanced with all shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowDown':
          // Arrow down just goes to next slide (no scrolling)
          e.preventDefault();
          nextSlide();
          break;
case ' ':
          // Space: Progressive disclosure reveal OR scroll down OR next slide if at bottom
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Space: Go back in progressive disclosure OR scroll up
            if (progressiveDisclosureEnabled) {
              const currentState = progressiveDisclosureStates[currentSlide];
              if (currentState && !revealPrevious(currentState)) {
                scrollSlideByViewport(-1);
              } else if (currentState) {
                setProgressiveDisclosureStates(states => ({
                  ...states,
                  [currentSlide]: currentState,
                }));
              }
            } else {
              scrollSlideByViewport(-1);
            }
          } else {
            // Space: Reveal next item in progressive disclosure OR scroll/next slide
            if (progressiveDisclosureEnabled) {
              const currentState = progressiveDisclosureStates[currentSlide];
              if (currentState && !isFullyRevealed(currentState)) {
                revealNext(currentState);
                setProgressiveDisclosureStates(states => ({
                  ...states,
                  [currentSlide]: currentState,
                }));
              } else if (isSlideAtBottom()) {
                nextSlide();
              } else {
                scrollSlideByViewport(1);
              }
            } else {
              // Check if at bottom of slide
              if (isSlideAtBottom()) {
                nextSlide();
              } else {
                scrollSlideByViewport(1);
              }
            }
          }
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowUp':
          // Arrow up just goes to previous slide (no scrolling)
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          // Close overlays first, then exit
          if (showBookmarkManager) setShowBookmarkManager(false);
          else if (showBookmarkTypeSelector) setShowBookmarkTypeSelector(false);
          else if (showThumbnails) setShowThumbnails(false);
          else if (showTimerSettings) setShowTimerSettings(false);
          else if (showNotesEditor) setShowNotesEditor(false);
          else onClose();
          break;
        case 'f':
        case 'F':
          handleToggleFullscreen();
          break;
        case 'p':
        case 'P':
          setIsPlaying(prev => !prev);
          break;
        case 'd':
        case 'D':
          setShowDrawing(prev => !prev);
          break;
        case 'n':
          // Lowercase n: Toggle speaker notes (bottom-left panel)
          setShowNotes(prev => !prev);
          break;
        case 'N':
          // Uppercase N (Shift+N): Toggle mini-map navigation
          e.preventDefault();
        case 'b':
          // Lowercase b: Quick bookmark current slide with star
          e.preventDefault();
          if (hasBookmark(currentSlide)) {
            // If already bookmarked, show type selector
            setShowBookmarkTypeSelector(true);
          } else {
            // Quick star bookmark
            addBookmark(currentSlide, 'star');
          }
          break;
        case 'B':
          // Uppercase B (Shift+B): Toggle bookmark manager
          e.preventDefault();
          setShowBookmarkManager(prev => !prev);
          break;
          setShowMiniMap(prev => !prev);
          break;
        case 'm':
        case 'M':
          // Toggle notes editor (bottom-right panel)
          setShowNotesEditor(prev => !prev);
          break;
        case 'q':
        case 'Q':
          setShowQR(prev => !prev);
          break;
        case 'g':
          // Lowercase g for "go to slide" prompt
          e.preventDefault();
          handleGoToSlide();
          break;
        case 'G':
          // Capital G for thumbnails grid
          e.preventDefault();
          setShowThumbnails(prev => !prev);
          break;
        case 'l':
        case 'L':
          // Toggle laser pointer
          setLaserPointer(prev => !prev);
          break;
        case '+':
        case '=':
          // Zoom in (per-slide zoom)
          e.preventDefault();
          adjustSlideZoom(0.1);
          break;
        case '-':
        case '_':
          // Zoom out (per-slide zoom)
          e.preventDefault();
          adjustSlideZoom(-0.1);
          break;
        case '0':
          // Reset zoom to 100% (per-slide zoom)
          e.preventDefault();
          resetSlideZoom();
          setPanPosition({ x: 0, y: 0 });
          break;
        case 't':
        case 'T':
          // Toggle timer settings
          setShowTimerSettings(prev => !prev);
          break;
        case 's':
        case 'S':
          // Toggle split-screen mode
          setShowSplitScreen(prev => !prev);
          break;
        case 'r':
        case 'R':
          // Toggle progressive disclosure mode
          e.preventDefault();
          setProgressiveDisclosureEnabled(prev => {
            const newEnabled = !prev;
            
            // Enable or disable progressive disclosure for current slide
            const currentState = progressiveDisclosureStates[currentSlide];
            if (currentState) {
              if (newEnabled) {
                enableProgressiveDisclosure(currentState);
                setProgressiveDisclosureStates(states => ({
                  ...states,
                  [currentSlide]: currentState,
                }));
              } else {
                disableProgressiveDisclosure(currentState);
                setProgressiveDisclosureStates(states => ({
                  ...states,
                  [currentSlide]: currentState,
                }));
              }
            }
            
            return newEnabled;
          });
          break;
          break;
        case 'v':
        case 'V':
          // Toggle PiP video (webcam mode)
          e.preventDefault();
          setShowPiPVideo(prev => !prev);
          setEnableWebcam(true);
          break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+Home: Jump to first slide
            setCurrentSlide(0);
          } else {
            // Home: Scroll to top of current slide
            scrollSlideToTop();
          }
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+End: Jump to last slide
            setCurrentSlide(totalSlides - 1);
          } else {
            // End: Scroll to bottom of current slide
            scrollSlideToBottom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    totalSlides,
    onClose,
    showThumbnails,
    showTimerSettings,
    showNotesEditor,
    nextSlide,
    prevSlide,
    scrollSlideByViewport,
    scrollSlideToTop,
    scrollSlideToBottom,
    isSlideAtBottom,
    adjustSlideZoom,
    resetSlideZoom,
  ]);

  // Parse slides from HTML with safe iframe access and extract speaker notes
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = async () => {
        // Wait for iframe to be ready
        const readyResult = await waitForIFrameReady(iframe, 5000);

        if (!readyResult.success) {
          setIframeError(readyResult.message || 'Could not load presentation content');
          if (!sandboxPermissions.includes('allow-same-origin') && !sandboxRelaxedRef.current) {
            sandboxRelaxedRef.current = true;
            setSandboxPermissions('allow-scripts allow-same-origin');
          }
          return;
        }

        // Parse speaker notes from HTML
        const doc = iframe.contentDocument;
        if (doc) {
          const notesData: {[key: number]: string} = {};

          // Look for <aside class="notes"> elements
          const asideNotes = doc.querySelectorAll('aside.notes');
          asideNotes.forEach((aside, index) => {
            notesData[index] = aside.textContent || '';
          });

          // Look for <!-- NOTES: ... --> comments
          const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
          let commentNode;
          let slideIndex = 0;
          while (commentNode = walker.nextNode()) {
            const comment = commentNode.textContent || '';
            if (comment.trim().startsWith('NOTES:')) {
              notesData[slideIndex] = comment.replace('NOTES:', '').trim();
              slideIndex++;
            }
          }

          setSpeakerNotes(notesData);
        }

        // Safely query slide elements
        const slidesResult = queryIFrameElements(
          iframe,
          '[data-slide], .slide, section, .reveal .slides > section'
        );

        if (!slidesResult.success) {
          setIframeError(slidesResult.message || 'Could not access presentation slides');
          return;
        }

        if (slidesResult.data) {
          const slides = slidesResult.data;
          if (slides.length > 1) {
            setTotalSlides(slides.length);
          } else {
            // Single page content - treat as one slide
            setTotalSlides(1);
          }

          // Inject presentation styles
          try {
            const doc = readyResult.data;
            if (doc) {
              const style = doc.createElement('style');
              style.textContent = `
                /* Disable default transitions for controlled slide animation */
                * { box-sizing: border-box; }

                /* Each slide is a full-height scrollable container */
                [data-slide], .slide, section {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100vh !important;
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  -webkit-overflow-scrolling: touch !important;
                  scroll-behavior: smooth !important;
                  padding: clamp(1rem, 3vw, 2rem) !important;

                  /* Better scrollbar styling */
                  scrollbar-width: thin !important;
                  scrollbar-color: rgba(6, 182, 212, 0.5) transparent !important;
                }

                /* Webkit scrollbar styling */
                [data-slide]::-webkit-scrollbar,
                .slide::-webkit-scrollbar,
                section::-webkit-scrollbar {
                  width: 6px !important;
                }

                [data-slide]::-webkit-scrollbar-track,
                .slide::-webkit-scrollbar-track,
                section::-webkit-scrollbar-track {
                  background: transparent !important;
                }

                [data-slide]::-webkit-scrollbar-thumb,
                .slide::-webkit-scrollbar-thumb,
                section::-webkit-scrollbar-thumb {
                  background: rgba(6, 182, 212, 0.5) !important;
                  border-radius: 3px !important;
                }

                [data-slide]::-webkit-scrollbar-thumb:hover,
                .slide::-webkit-scrollbar-thumb:hover,
                section::-webkit-scrollbar-thumb:hover {
                  background: rgba(6, 182, 212, 0.7) !important;
                }

                /* Hidden slides - Base state */
                .slide-hidden {
                  pointer-events: none !important;
                  visibility: hidden !important;
                }

                /* Visible slide - Base state */
                .slide-visible {
                  pointer-events: auto !important;
                  visibility: visible !important;
                  z-index: 10 !important;
                }

                /* Fade Transition */
                .transition-fade {
                  transition: opacity 0.5s ease !important;
                }
                .transition-fade.slide-hidden {
                  opacity: 0 !important;
                }
                .transition-fade.slide-visible {
                  opacity: 1 !important;
                }

                /* Slide Transition */
                .transition-slide {
                  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease !important;
                }
                .transition-slide.slide-hidden {
                  transform: translateX(100%) !important;
                  opacity: 0 !important;
                }
                .transition-slide.slide-visible {
                  transform: translateX(0) !important;
                  opacity: 1 !important;
                }

                /* Zoom Transition */
                .transition-zoom {
                  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease !important;
                  transform-origin: center center !important;
                }
                .transition-zoom.slide-hidden {
                  transform: scale(0.5) !important;
                  opacity: 0 !important;
                }
                .transition-zoom.slide-visible {
                  transform: scale(1) !important;
                  opacity: 1 !important;
                }

                /* Flip Transition */
                .transition-flip {
                  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease !important;
                  transform-origin: center center !important;
                  backface-visibility: hidden !important;
                }
                .transition-flip.slide-hidden {
                  transform: rotateY(90deg) !important;
                  opacity: 0 !important;
                }
                .transition-flip.slide-visible {
                  transform: rotateY(0deg) !important;
                  opacity: 1 !important;
                }

                /* Cube Transition (3D) */
                .transition-cube {
                  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
                  transform-origin: center center !important;
                  transform-style: preserve-3d !important;
                  backface-visibility: hidden !important;
                }
                .transition-cube.slide-hidden {
                  transform: perspective(1200px) rotateY(-90deg) translateZ(-50vw) !important;
                  opacity: 0 !important;
                }
                .transition-cube.slide-visible {
                  transform: perspective(1200px) rotateY(0deg) translateZ(0) !important;
                  opacity: 1 !important;
                }

                /* Body and HTML setup */
                body {
                  overflow: hidden !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  height: 100vh !important;
                  width: 100vw !important;
                  perspective: 1200px !important;
                }

                html {
                  overflow: hidden !important;
                  height: 100vh !important;
                  width: 100vw !important;
                }

                /* Scroll snap for better section navigation */
                [data-slide], .slide, section {
                  scroll-snap-type: y proximity !important;
                }

                h1, h2, h3, h4, hr {
                  scroll-snap-align: start !important;
                  scroll-margin-top: 2rem !important;
                }

                /* Ensure images and media don't overflow */
                img, video, iframe {
                  max-width: 100% !important;
                  height: auto !important;
                }

              `
              doc.head.appendChild(style);

          // Initialize progressive disclosure for all slides
          try {
            const doc = readyResult.data;
            if (doc) {
              // Inject progressive disclosure styles
              injectProgressiveDisclosureStyles(doc);

              // Initialize progressive disclosure state for each slide
              const newStates: {[slideIndex: number]: ProgressiveDisclosureState} = {};
              slides.forEach((slide, index) => {
                if (slide instanceof HTMLElement) {
                  newStates[index] = initializeProgressiveDisclosure(slide);
                }
              });
              setProgressiveDisclosureStates(newStates);
            }
          } catch (e) {
            console.warn('Could not initialize progressive disclosure:', e);
          }
            }
          } catch (e) {
            // Non-critical error, presentation can still work
            console.warn('Could not inject presentation styles:', e);
          }

          // Detect content type and apply context-aware backgrounds to all slides
          try {
            const backgroundData: {[key: number]: string} = {};
            slides.forEach((slide, index) => {
              const backgroundStyle = detectContentTypeAndBackground(slide);
              backgroundData[index] = backgroundStyle;

              // Apply background style immediately to slide element
              if (slide instanceof HTMLElement) {
                applyBackgroundStyle(slide, backgroundStyle);
              }
            });
            setSlideBackgrounds(backgroundData);
          } catch (e) {
            console.warn('Could not apply context-aware backgrounds:', e);
          }

          // Clear any previous errors
          setIframeError(null);
        }
      };
    }
  }, [sanitizedHtml, sandboxPermissions]);

  // Update visible slide with auto-reset scroll
  useEffect(() => {
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      const slides = doc.querySelectorAll('[data-slide], .slide, section');

      slides.forEach((slide, index) => {
        // Remove all transition classes first
        slide.classList.remove(
          'transition-fade',
          'transition-slide',
          'transition-zoom',
          'transition-flip',
          'transition-cube'
        );

        // Add the current transition class
        slide.classList.add(`transition-${transitionType}`);

        if (index === currentSlide) {
          slide.classList.remove('slide-hidden');
          slide.classList.add('slide-visible');

          // Apply context-aware background for current slide
          if (slide instanceof HTMLElement && slideBackgrounds[index]) {
            applyBackgroundStyle(slide, slideBackgrounds[index]);
          }

          // Auto-reset scroll to top (can restore saved position if scroll memory is enabled)
          if (slide instanceof HTMLElement) {
            const savedPosition = getScrollPosition(currentSlide);
            slide.scrollTop = savedPosition; // 0 for reset by default
          }
        } else {
          slide.classList.add('slide-hidden');
          slide.classList.remove('slide-visible');
        }
      });
    }
  }, [currentSlide, transitionType, getScrollPosition, slideBackgrounds]);

  // Apply per-slide zoom levels
  useEffect(() => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');

    slides.forEach((slide, index) => {
      if (slide instanceof HTMLElement) {
        const zoom = slideZoomLevels[index] || 1;
        slide.style.transform = `scale(${zoom})`;
        slide.style.transformOrigin = 'top left';

        // Adjust scroll width to account for zoom
        if (zoom !== 1) {
          slide.style.width = `${100 / zoom}%`;
          slide.style.height = `${100 / zoom}vh`;
        } else {
          slide.style.width = '100%';
          slide.style.height = '100vh';
        }
      }
    });
  }, [slideZoomLevels, currentSlide]);

  // Reset and apply progressive disclosure when slide changes
  useEffect(() => {
    if (!progressiveDisclosureEnabled) return;

    const currentState = progressiveDisclosureStates[currentSlide];
    if (currentState) {
      // Reset to hidden state when entering a new slide
      resetProgressiveDisclosure(currentState);
      
      // Force re-render to apply changes
      setProgressiveDisclosureStates(states => ({
        ...states,
        [currentSlide]: currentState,
      }));
    }
  }, [currentSlide, progressiveDisclosureEnabled, progressiveDisclosureStates]);

  // Save scroll position (debounced) when user scrolls within a slide
  useEffect(() => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const currentSlideElement = slides[currentSlide];

    if (!(currentSlideElement instanceof HTMLElement)) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll position saving (250ms after last scroll event)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (currentSlideElement instanceof HTMLElement) {
          saveScrollPosition(currentSlide, currentSlideElement.scrollTop);
        }
      }, 250);
    };

    currentSlideElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      currentSlideElement.removeEventListener('scroll', handleScroll);
    };
  }, [currentSlide, saveScrollPosition]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = Math.min(prev + 1, totalSlides - 1);
      if (session) updateSlide(next);
      return next;
    });
  }, [totalSlides, session]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = Math.max(prev - 1, 0);
      if (session) updateSlide(next);
      return next;
    });
  }, [session]);

  const handleToggleFullscreen = async () => {
    const result: FullscreenResult = await toggleFullscreen();

    if (!result.success) {
      setFullscreenError(result.message || 'Could not toggle fullscreen');
      // Auto-clear error after 5 seconds
      setTimeout(() => setFullscreenError(null), 5000);
    } else {
      setFullscreenError(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Drawing functionality
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [showDrawing]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !showDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, showDrawing, drawColor, brushSize]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Initialize canvas size when drawing is enabled
  useEffect(() => {
    if (showDrawing && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, [showDrawing]);

  // Split-screen divider drag handlers
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  }, []);

  const handleDividerMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingDivider) return;

    const containerWidth = window.innerWidth;
    const newPosition = (e.clientX / containerWidth) * 100;

    // Constrain divider position between 30% and 80%
    const constrainedPosition = Math.min(80, Math.max(30, newPosition));
    setSplitDividerPosition(constrainedPosition);
  }, [isDraggingDivider]);

  const handleDividerMouseUp = useCallback(() => {
    setIsDraggingDivider(false);
  }, []);

  // Add global mouse event listeners for divider dragging
  useEffect(() => {
    if (isDraggingDivider) {
      window.addEventListener('mousemove', handleDividerMouseMove);
      window.addEventListener('mouseup', handleDividerMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleDividerMouseMove);
        window.removeEventListener('mouseup', handleDividerMouseUp);
      };
    }
  }, [isDraggingDivider, handleDividerMouseMove, handleDividerMouseUp]);

  // Track mouse for laser pointer
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (laserPointer) {
      setLaserPosition({ x: e.clientX, y: e.clientY });
    }
  }, [laserPointer]);

  // Get timer color based on target duration
  const getTimerColor = useCallback(() => {
    if (!targetDuration) return 'text-white/40';
    const percentage = (elapsedTime / targetDuration) * 100;

    if (percentage >= 90) return 'text-red-400 animate-pulse';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-green-400';
  }, [targetDuration, elapsedTime]);

  const handleGoToSlide = async () => {
    const slideNum = await showPrompt({
      title: 'Go to Slide',
      message: `Enter a slide number (1-${totalSlides}):`,
      type: 'number',
      placeholder: '1',
      validator: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > totalSlides) {
          return `Please enter a number between 1 and ${totalSlides}`;
        }
        return null;
      },
    });

    if (slideNum) {
      const num = parseInt(slideNum) - 1;
      setCurrentSlide(num);
    }
  };

  // Generate enhanced HTML with slide navigation
  // Inject a marker element so we can detect clicks that should pass through
  const enhancedHtml = sanitizedHtml.replace(
    '</body>',
    `<div id="presentation-click-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; z-index: -1;"></div>
    <script>
      // Enable click navigation - only on content, not on click zones
      document.addEventListener('click', (e) => {
        // Check if click is on the presentation content, not the overlay zones
        // The parent window handles the click zones via React, so we don't duplicate
        const target = e.target;

        // Allow clicks to pass through - parent will handle navigation
        // This prevents iframe content clicks from interfering
        window.parent.postMessage({
          type: 'contentClick',
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        }, '*');
      }, false);
    <\/script></body>`
  );

  // Listen for messages from iframe (for debugging and future use)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Log content clicks for debugging if needed
      if (e.data.type === 'contentClick') {
        // Clicks on iframe content are logged but don't trigger navigation
        // Navigation is handled by the click zones in the parent
        console.debug('Iframe click detected at:', e.data.x, e.data.y);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black" onMouseMove={handleMouseMove}>
      {/* Main Content - Full Screen */}
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={enhancedHtml}
          className="w-full h-full border-0"
          title="Presentation"
          sandbox={sandboxPermissions}
          style={{
            pointerEvents: showDrawing ? 'none' : 'auto',
            touchAction: 'pan-y',
            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
            ...getScrollStyles({ enableMomentum: true, direction: 'vertical' }) as React.CSSProperties
          }}
        />

        {/* Drawing Canvas Overlay */}
        <PresentationDrawingLayer
          presentationId={presentationId}
          currentSlide={currentSlide}
          isVisible={showDrawing}
          tool={drawTool}
          color={drawColor}
          width={brushSize}
        />

        {/* Click Zones - Subtle navigation areas */}
        <div
          className="absolute inset-0 flex pointer-events-none"
          style={{ zIndex: showDrawing ? 15 : 10 }}
        >
          {/* Left Navigation Zone */}
          <div
            className="w-1/3 h-full pointer-events-auto cursor-w-resize opacity-0 hover:opacity-30
                       flex items-center justify-start pl-4 transition-opacity duration-300 bg-gradient-to-r from-white/5 to-transparent"
            onClick={prevSlide}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'Enter') prevSlide();
            }}
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-8 h-8 text-white/60" />
          </div>

          {/* Center Zone - No interaction */}
          <div className="w-1/3 h-full" />

          {/* Right Navigation Zone */}
          <div
            className="w-1/3 h-full pointer-events-auto cursor-e-resize opacity-0 hover:opacity-30
                       flex items-center justify-end pr-4 transition-opacity duration-300 bg-gradient-to-l from-white/5 to-transparent"
            onClick={nextSlide}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'Enter') nextSlide();
            }}
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-8 h-8 text-white/60" />
          </div>
        </div>

        {/* Scroll Hints - Shows gradient and chevron when more content below */}
        <ScrollHints
          iframeRef={iframeRef}
          currentSlide={currentSlide}
          show={showControls} // Only show hints when controls are visible
        />

        {/* Scroll Progress Indicator - Vertical bar on right showing scroll progress */}
        <ScrollProgressIndicator
          iframeRef={iframeRef}
          currentSlide={currentSlide}
          show={showControls}
        />

        {/* Mini-Map Navigation - Hierarchical heading navigation */}
        <MiniMapNavigation
          iframeRef={iframeRef}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onNavigate={(slideIndex) => setCurrentSlide(slideIndex)}
          onClose={() => setShowMiniMap(false)}
          show={showMiniMap}
        />

        {/* Resizable Divider */}
        {showSplitScreen && (
          <div
            className="relative w-1 bg-cyan-500/20 hover:bg-cyan-500/40 cursor-col-resize group transition-colors"
            onMouseDown={handleDividerMouseDown}
            role="separator"
            aria-label="Resize split-screen divider"
          >
            {/* Drag handle indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-12 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
            </div>
          </div>
        )}

        {/* Notes Panel */}
        {showSplitScreen && (
          <div
            className="relative bg-zinc-900 overflow-hidden"
            style={{
              width: `${100 - splitDividerPosition}%`,
              transition: isDraggingDivider ? 'none' : 'width 0.3s ease'
            }}
          >
            <div className="h-full overflow-y-auto p-6">
              {/* Notes Header */}
              <div className="mb-4 pb-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-lg mb-1">
                  Speaker Notes
                </h3>
                <p className="text-white/40 text-xs">
                  Slide {currentSlide + 1} of {totalSlides}
                </p>
              </div>

              {/* Notes Content */}
              <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {speakerNotes[currentSlide] || (
                  <div className="text-white/30 italic">
                    No notes available for this slide.
                  </div>
                )}
              </div>

              {/* Slide Navigation in Notes Panel */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all"
                    title="Previous slide"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === totalSlides - 1}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all"
                    title="Next slide"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookmark Manager */}
        <BookmarkManager
          bookmarks={bookmarks}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onNavigate={setCurrentSlide}
          onUpdateNote={updateBookmarkNote}
          onRemove={removeBookmark}
          onClearAll={clearAllBookmarks}
          onExport={exportBookmarks}
          onImport={importBookmarks}
          onClose={() => setShowBookmarkManager(false)}
          show={showBookmarkManager}
        />

        {/* Bookmark Type Selector */}
        {showBookmarkTypeSelector && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center">
            <div className="bg-zinc-900 rounded-xl p-6 max-w-md">
              <h3 className="text-white text-lg font-bold mb-4">Choose Bookmark Type</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    addBookmark(currentSlide, 'star');
                    setShowBookmarkTypeSelector(false);
                  }}
                  className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-400 transition-all flex flex-col items-center gap-2"
                >
                  <StarIconSolid className="w-8 h-8" />
                  <span className="text-sm font-medium">Star</span>
                </button>
                <button
                  onClick={() => {
                    addBookmark(currentSlide, 'flag');
                    setShowBookmarkTypeSelector(false);
                  }}
                  className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-all flex flex-col items-center gap-2"
                >
                  <FlagIconSolid className="w-8 h-8" />
                  <span className="text-sm font-medium">Flag</span>
                </button>
                <button
                  onClick={() => {
                    addBookmark(currentSlide, 'question');
                    setShowBookmarkTypeSelector(false);
                  }}
                  className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 transition-all flex flex-col items-center gap-2"
                >
                  <QuestionIconSolid className="w-8 h-8" />
                  <span className="text-sm font-medium">Question</span>
                </button>
                <button
                  onClick={() => {
                    addBookmark(currentSlide, 'important');
                    setShowBookmarkTypeSelector(false);
                  }}
                  className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 transition-all flex flex-col items-center gap-2"
                >
                  <SparklesIconSolid className="w-8 h-8" />
                  <span className="text-sm font-medium">Important</span>
                </button>
              </div>
              <button
                onClick={() => setShowBookmarkTypeSelector(false)}
                className="mt-4 w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mini-Map Navigation */}
        <MiniMapNavigation
          iframeRef={iframeRef}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onNavigate={setCurrentSlide}
          onClose={() => setShowMiniMap(false)}
          show={showMiniMap}
        />

        {/* QR Code Overlay */}
        {showQR && (
          <QRCodeDisplay
            title={title || 'Presentation'}
            totalSlides={totalSlides}
            onSessionCreated={(newSession) => setSession(newSession)}
            onClose={() => setShowQR(false)}
          />
        )}
      </div>

      {/* Bottom Controls - Minimal & Discrete */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Compact Control Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm">
          {/* Left: Slide Counter */}
          <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
            <span>{currentSlide + 1}</span>
            <span>/</span>
            <span>{totalSlides}</span>
            {hasBookmark(currentSlide) && (
              <BookmarkIconSolid className="w-3 h-3 text-cyan-400" title="Bookmarked" />
            )}
          </div>

            {progressiveDisclosureEnabled && progressiveDisclosureStates[currentSlide] && (
              <span className="text-cyan-400 text-[10px] ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                {getProgressString(progressiveDisclosureStates[currentSlide])} revealed
              </span>
            )}
          {/* Center: Compact Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-1.5 text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
              title="Previous"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white/90 transition-all mx-1"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="p-1.5 text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
              title="Next"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDrawing(!showDrawing)}
              className={`p-1.5 rounded transition-all ${
                showDrawing ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'
              }`}
              title="Draw (D)"
            >
              <PencilIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`p-1.5 rounded transition-all ${
                showQR ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'
              }`}
              title="QR (Q)"
            >
              <QrCodeIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowBookmarkManager(!showBookmarkManager)}
              className={`p-1.5 rounded transition-all ${
                showBookmarkManager ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'
              }`}
              title="Bookmarks (Shift+B)"
            >
              {hasBookmark(currentSlide) ? (
                <BookmarkIconSolid className="w-4 h-4" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 text-white/40 hover:text-white/80 transition-all"
              title="Fullscreen (F)"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white/80 transition-all ml-1"
              title="Exit (Esc)"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
          {/* Tool Selector */}
          <div>
            <div className="text-white/40 text-[10px] mb-1.5">Tool</div>
            <div className="flex gap-1">
              <button
                onClick={() => setDrawTool('pen')}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  drawTool === 'pen' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Pen
              </button>
              <button
                onClick={() => setDrawTool('eraser')}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  drawTool === 'eraser' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Eraser
              </button>
            </div>
          </div>


        {/* Ultra-thin Progress Bar */}
        <div className="h-0.5 bg-white/10">
          <div
            className="h-full bg-cyan-400/60 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
      </div>

      {/* Drawing Controls Panel */}
      {showDrawing && (
        <div className="absolute bottom-20 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 space-y-3 z-30">
          <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
            Drawing Tools
          </div>

          {/* Color Picker */}
          <div>
            <div className="text-white/40 text-[10px] mb-1.5">Color</div>
            <div className="flex gap-2">
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => setDrawColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    drawColor === color ? 'border-white scale-110' : 'border-white/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div>
            <div className="text-white/40 text-[10px] mb-1.5">Brush Size: {brushSize}px</div>
            <input
              type="range"
              min="1"
              max="10"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={() => {
              if ((window as any).__presentationClearDrawing) {
                (window as any).__presentationClearDrawing();
              }
            }}
            className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-xs font-semibold transition-all"
          >
            Clear Drawing
          </button>
        </div>
      )}

      {/* Minimal Info Overlay - Top */}
      <div
        className={`absolute top-0 left-0 right-0 transition-all duration-500 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm">
          {/* Title */}
          {title && (
            <div className="text-white/40 text-xs font-medium truncate max-w-md">
              {title}
            </div>
          )}

          {/* Time Elapsed - Color-coded timer */}
          <div className={`flex items-center gap-1.5 text-xs font-mono ml-auto cursor-pointer ${getTimerColor()}`}
               onClick={() => setShowTimerSettings(true)}
               title={targetDuration ? `Target: ${formatTime(targetDuration)} - Click to edit` : 'Click to set target duration'}>
            <ClockIcon className="w-3 h-3" />
            <span>{formatTime(elapsedTime)}</span>
            {targetDuration && (
              <span className="text-[10px] opacity-70">/ {formatTime(targetDuration)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Speaker Notes Panel */}
      {showNotes && (
        <div className="absolute bottom-20 left-4 w-96 max-h-48 bg-black/90 backdrop-blur-sm rounded-xl p-4 overflow-y-auto z-30">
          <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
            Speaker Notes - Slide {currentSlide + 1}
          </div>
          <div className="text-white/80 text-sm leading-relaxed">
            {speakerNotes[currentSlide] || 'No notes for this slide.'}
          </div>
        </div>
      )}

      {/* Slide Thumbnails Grid Overlay */}
      {showThumbnails && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-lg z-[50] overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Slide Navigator</h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setShowThumbnails(false);
                  }}
                  className={`aspect-video bg-white/5 rounded-lg border-2 transition-all hover:scale-105 ${
                    index === currentSlide
                      ? 'border-cyan-400 ring-4 ring-cyan-400/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-white/60 text-lg font-bold">{index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Laser Pointer Effect */}
      {laserPointer && (
        <div
          className="fixed pointer-events-none z-[100] transition-all duration-75"
          style={{
            left: laserPosition.x,
            top: laserPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Laser dot */}
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
          {/* Laser beam effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-500/30 rounded-full blur-md animate-ping" />
        </div>
      )}

      {/* Notes Editor Panel */}
      {showNotesEditor && (
        <div className="absolute bottom-20 right-4 w-96 bg-black/90 backdrop-blur-sm rounded-xl p-4 z-30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">
              Presentation Notes
            </h4>
            <button
              onClick={() => setShowNotesEditor(false)}
              className="text-white/40 hover:text-white/80"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={presentationNotes}
            onChange={(e) => setPresentationNotes(e.target.value)}
            className="w-full h-32 bg-zinc-900 text-white text-sm rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Add notes during your presentation..."
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(presentationNotes);
            }}
            className="mt-2 w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition-all"
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {/* Zoom Indicator */}
      {zoomLevel > 1 && (
        <div className="absolute top-20 left-4 bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-mono z-30">
          Zoom: {Math.round(zoomLevel * 100)}%
        </div>
      )}

      {/* Presentation Settings Modal */}
      {showTimerSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[60]">
          <div className="bg-zinc-900 rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Presentation Settings</h3>

            {/* Target Duration */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                Target Duration (minutes)
              </label>
              <input
                type="number"
                value={targetDuration ? Math.floor(targetDuration / 60) : ''}
                onChange={(e) => setTargetDuration(Number(e.target.value) * 60)}
                className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="30"
              />
              <p className="text-white/40 text-xs mt-1">Timer will turn yellow at 80%, red at 90%</p>
            </div>

            {/* Auto-advance Interval */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                Auto-advance Interval (seconds)
              </label>
              <input
                type="number"
                value={Math.floor(autoAdvanceInterval / 1000)}
                onChange={(e) => setAutoAdvanceInterval(Number(e.target.value) * 1000)}
                className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="10"
                min="1"
                max="300"
              />
              <p className="text-white/40 text-xs mt-1">Time between slides when auto-play is active</p>
            </div>

            {/* Transition Type */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                Slide Transition Effect
              </label>
              <select
                value={transitionType}
                onChange={(e) => setTransitionType(e.target.value as 'fade' | 'slide' | 'zoom' | 'flip' | 'cube')}
                className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="fade">Fade - Classic opacity transition</option>
                <option value="slide">Slide - Horizontal sliding</option>
                <option value="zoom">Zoom - Scale in/out effect</option>
                <option value="flip">Flip - Card flip animation</option>
                <option value="cube">Cube - 3D cube rotation</option>
              </select>
              <p className="text-white/40 text-xs mt-1">Choose how slides transition between each other</p>
            </div>

            {/* Show Controls on Start */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showControls}
                  onChange={(e) => setShowControls(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                />
                Show controls when presentation starts
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTimerSettings(false)}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Save & Close
              </button>
              <button
                onClick={() => {
                  setTargetDuration(null);
                  setAutoAdvanceInterval(10000);
                  setShowControls(true);
                  setTransitionType('fade');
                  setShowTimerSettings(false);
                }}
                className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Notifications */}
      {fullscreenError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md animate-slide-down">
          <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Fullscreen Error</p>
              <p className="text-sm text-white/90">{fullscreenError}</p>
            </div>
            <button
              onClick={() => setFullscreenError(null)}
              className="text-white/80 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {iframeError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md animate-slide-down">
          <div className="bg-yellow-500/90 text-black px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Content Warning</p>
              <p className="text-sm opacity-90">{iframeError}</p>
            </div>
            <button
              onClick={() => setIframeError(null)}
              className="text-black/80 hover:text-black"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Picture-in-Picture Video */}
      <PictureInPictureVideo
        show={showPiPVideo}
        onClose={() => setShowPiPVideo(false)}
        enableWebcam={enableWebcam}
        videoSource={pipVideoSource}
        initialCorner="bottom-right"
      />
    </div>
  );
};

function sanitizeHtml(input: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    doc.querySelectorAll('script, iframe, object, embed, link[rel="prefetch"]').forEach((el) => el.remove());

    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });

      if (el.tagName.toLowerCase() === 'form') {
        el.removeAttribute('action');
        el.removeAttribute('method');
      }
    });

    return input.trim().toLowerCase().startsWith('<!doctype')
      ? doc.documentElement.outerHTML
      : doc.body.innerHTML;
  } catch (e) {
    return input;
  }
}


export default PresentationMode;

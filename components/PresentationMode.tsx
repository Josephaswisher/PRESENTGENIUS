/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PresentGenius - Enhanced Fullscreen Presentation Mode
 * Features:
 * - Isolated slide iframes (no CSS/JS bleeding)
 * - Per-slide undo/redo history
 * - Auto-save checkpoints (30 seconds)
 * - Manual named checkpoints
 * - Error boundaries per slide
 * - HTML import/paste capability
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
  DocumentDuplicateIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BookmarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  WrenchScrewdriverIcon,
  RectangleStackIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { usePresentationHistoryStore, type Checkpoint } from '../stores/presentation-history.store';
import { SlideChatPanel } from './presenter/SlideChatPanel';
import { SlideTemplateLibrary } from './presenter/SlideTemplateLibrary';
import { SlideDiffViewer } from './presenter/SlideDiffViewer';
import { SlideImportModal } from './presenter/SlideImportModal';
import { validateHtml, autoFixHtml, type ValidationResult, type ValidationWarning } from '../utils/html-validator';
import { type ImportedSlide } from '../utils/slide-import-export';

// ============================================================================
// TYPES
// ============================================================================

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
  html: string;
  rawContent: string;
  hasError?: boolean;
  errorMessage?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractGlobalStyles(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const styles: string[] = [];

  doc.querySelectorAll('style').forEach(style => {
    styles.push(style.innerHTML);
  });

  const defaultStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
    button { cursor: pointer; }
    .quiz-option, .interactive-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 1rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }
    .quiz-option:hover, .interactive-btn:hover {
      background: rgba(255,255,255,0.2);
      border-color: #22d3ee;
    }
  `;

  return defaultStyles + '\n' + styles.join('\n');
}

function createIsolatedSlideHtml(content: string, globalStyles: string): string {
  // Add error catching wrapper
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
  <script>
    // Error boundary - catch any JS errors
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      window.parent.postMessage({
        type: 'slide-error',
        message: msg,
        error: error ? error.toString() : 'Unknown error'
      }, '*');
      return true; // Prevent default error handling
    };
    // Catch unhandled promise rejections
    window.onunhandledrejection = function(event) {
      window.parent.postMessage({
        type: 'slide-error',
        message: 'Unhandled promise rejection',
        error: event.reason ? event.reason.toString() : 'Unknown error'
      }, '*');
    };
  </script>
</body>
</html>`;
}

function parseSlides(html: string, title: string): SlideInfo[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const globalStyles = extractGlobalStyles(html);

  let sections = doc.querySelectorAll('section.slide-section, section[id^="slide-"]');
  if (sections.length === 0) sections = doc.querySelectorAll('section');
  if (sections.length === 0) sections = doc.querySelectorAll('.slide');

  const slideList: SlideInfo[] = [];

  if (sections.length > 0) {
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3');
      const rawContent = section.outerHTML;
      slideList.push({
        id: section.id || `slide-${Date.now()}-${index}`,
        index,
        title: heading?.textContent?.trim() || `Slide ${index + 1}`,
        html: createIsolatedSlideHtml(rawContent, globalStyles),
        rawContent,
        hasError: false
      });
    });
  } else {
    const bodyContent = doc.body.innerHTML;
    slideList.push({
      id: `slide-${Date.now()}-0`,
      index: 0,
      title: title,
      html: createIsolatedSlideHtml(bodyContent, globalStyles),
      rawContent: bodyContent,
      hasError: false
    });
  }

  return slideList;
}

function reconstructHtml(slides: SlideInfo[], originalHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHtml, 'text/html');
  doc.body.innerHTML = slides.map(slide => slide.rawContent).join('\n');

  return `<!DOCTYPE html>
<html>
<head>${doc.head.innerHTML}</head>
<body>${doc.body.innerHTML}</body>
</html>`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PresentationMode: React.FC<PresentationModeProps> = ({
  html,
  title,
  onClose,
  onUpdateHtml
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // History store
  const historyStore = usePresentationHistoryStore();

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval] = useState(5000);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [showEditSlideModal, setShowEditSlideModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [newSlideHtml, setNewSlideHtml] = useState('');
  const [editSlideHtml, setEditSlideHtml] = useState('');
  const [editSlideIndex, setEditSlideIndex] = useState(-1);
  const [checkpointName, setCheckpointName] = useState('');
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [lastSelectedSlide, setLastSelectedSlide] = useState<number | null>(null);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Parse slides on mount
  useEffect(() => {
    const parsedSlides = parseSlides(html, title);
    setSlides(parsedSlides);

    // Record initial state for each slide
    parsedSlides.forEach(slide => {
      historyStore.recordSlideChange(slide.id, slide.rawContent, slide.title);
    });
  }, [html, title]);

  // Auto-save interval
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (slides.length > 0 && historyStore.shouldAutoSave()) {
        performAutoSave();
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [slides]);

  // Listen for iframe errors
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'slide-error') {
        setSlides(prev => prev.map((slide, idx) =>
          idx === currentSlide
            ? { ...slide, hasError: true, errorMessage: event.data.message }
            : slide
        ));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentSlide]);

  const totalSlides = slides.length;
  const currentSlideHtml = useMemo(() => slides[currentSlide]?.html || '', [slides, currentSlide]);
  const currentSlideInfo = slides[currentSlide];

  // Navigation
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) setCurrentSlide(index);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(prev => prev + 1);
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  }, [currentSlide]);

  const goToFirst = useCallback(() => setCurrentSlide(0), []);
  const goToLast = useCallback(() => setCurrentSlide(totalSlides - 1), [totalSlides]);

  // Auto-save
  const performAutoSave = useCallback(() => {
    if (slides.length === 0) return;

    setSaveStatus('saving');
    historyStore.createCheckpoint(
      'Auto-save',
      slides.map(s => ({ id: s.id, html: s.rawContent, title: s.title })),
      title,
      true
    );
    historyStore.updateLastAutoSave();
    setLastSaveTime(Date.now());
    setSaveStatus('saved');
  }, [slides, title, historyStore]);

  // Manual checkpoint
  const createManualCheckpoint = useCallback((name: string) => {
    if (slides.length === 0) return;

    setSaveStatus('saving');
    historyStore.createCheckpoint(
      name || `Checkpoint ${new Date().toLocaleTimeString()}`,
      slides.map(s => ({ id: s.id, html: s.rawContent, title: s.title })),
      title,
      false
    );
    setLastSaveTime(Date.now());
    setSaveStatus('saved');
    setShowCheckpointModal(false);
    setCheckpointName('');
  }, [slides, title, historyStore]);

  // Restore checkpoint
  const restoreCheckpoint = useCallback((checkpoint: Checkpoint) => {
    const globalStyles = extractGlobalStyles(html);

    const restoredSlides: SlideInfo[] = checkpoint.slides.map((s, index) => ({
      id: s.id,
      index,
      title: s.title,
      html: createIsolatedSlideHtml(s.html, globalStyles),
      rawContent: s.html,
      hasError: false
    }));

    setSlides(restoredSlides);
    setCurrentSlide(0);
    setShowRestoreModal(false);

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(restoredSlides, html));
    }
  }, [html, onUpdateHtml]);

  // Undo/Redo for current slide
  const handleUndo = useCallback(() => {
    const slideId = slides[currentSlide]?.id;
    if (!slideId) return;

    const previousVersion = historyStore.undoSlide(slideId);
    if (previousVersion) {
      const globalStyles = extractGlobalStyles(html);
      setSlides(prev => prev.map((slide, idx) =>
        idx === currentSlide
          ? {
              ...slide,
              rawContent: previousVersion.html,
              html: createIsolatedSlideHtml(previousVersion.html, globalStyles),
              title: previousVersion.title,
              hasError: false
            }
          : slide
      ));
      setSaveStatus('unsaved');
    }
  }, [currentSlide, slides, html, historyStore]);

  const handleRedo = useCallback(() => {
    const slideId = slides[currentSlide]?.id;
    if (!slideId) return;

    const nextVersion = historyStore.redoSlide(slideId);
    if (nextVersion) {
      const globalStyles = extractGlobalStyles(html);
      setSlides(prev => prev.map((slide, idx) =>
        idx === currentSlide
          ? {
              ...slide,
              rawContent: nextVersion.html,
              html: createIsolatedSlideHtml(nextVersion.html, globalStyles),
              title: nextVersion.title,
              hasError: false
            }
          : slide
      ));
      setSaveStatus('unsaved');
    }
  }, [currentSlide, slides, html, historyStore]);

  const canUndo = currentSlideInfo ? historyStore.canUndo(currentSlideInfo.id) : false;
  const canRedo = currentSlideInfo ? historyStore.canRedo(currentSlideInfo.id) : false;

  // Reset slide (error recovery)
  const resetSlide = useCallback((index: number) => {
    const slideId = slides[index]?.id;
    if (!slideId) return;

    const history = historyStore.getSlideHistory(slideId);
    if (history && history.versions.length > 0) {
      const firstVersion = history.versions[0];
      const globalStyles = extractGlobalStyles(html);

      setSlides(prev => prev.map((slide, idx) =>
        idx === index
          ? {
              ...slide,
              rawContent: firstVersion.html,
              html: createIsolatedSlideHtml(firstVersion.html, globalStyles),
              title: firstVersion.title,
              hasError: false,
              errorMessage: undefined
            }
          : slide
      ));
    }
  }, [slides, html, historyStore]);

  // Slide management
  const addSlide = useCallback((htmlContent: string, afterIndex?: number) => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.length;
    const globalStyles = extractGlobalStyles(html);

    let content = htmlContent.trim();
    if (!content.startsWith('<section')) {
      content = `<section class="slide-section" id="slide-${Date.now()}">${content}</section>`;
    }

    const tempParser = new DOMParser();
    const tempDoc = tempParser.parseFromString(content, 'text/html');
    const heading = tempDoc.querySelector('h1, h2, h3');

    const newSlideId = `slide-${Date.now()}`;
    const newSlide: SlideInfo = {
      id: newSlideId,
      index: insertIndex,
      title: heading?.textContent?.trim() || `Slide ${insertIndex + 1}`,
      html: createIsolatedSlideHtml(content, globalStyles),
      rawContent: content,
      hasError: false
    };

    const newSlides = [...slides];
    newSlides.splice(insertIndex, 0, newSlide);
    newSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(newSlides);
    setCurrentSlide(insertIndex);
    setSaveStatus('unsaved');

    // Record in history
    historyStore.recordSlideChange(newSlideId, content, newSlide.title);

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml, historyStore]);

  const updateSlide = useCallback((index: number, htmlContent: string) => {
    const globalStyles = extractGlobalStyles(html);
    const slideId = slides[index]?.id;

    let content = htmlContent.trim();
    if (!content.startsWith('<section')) {
      content = `<section class="slide-section" id="${slideId}">${content}</section>`;
    }

    const tempParser = new DOMParser();
    const tempDoc = tempParser.parseFromString(content, 'text/html');
    const heading = tempDoc.querySelector('h1, h2, h3');
    const newTitle = heading?.textContent?.trim() || `Slide ${index + 1}`;

    const newSlides = [...slides];
    newSlides[index] = {
      ...newSlides[index],
      title: newTitle,
      html: createIsolatedSlideHtml(content, globalStyles),
      rawContent: content,
      hasError: false,
      errorMessage: undefined
    };

    setSlides(newSlides);
    setSaveStatus('unsaved');

    // Record in history
    if (slideId) {
      historyStore.recordSlideChange(slideId, content, newTitle);
    }

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml, historyStore]);

  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return;

    const newSlides = slides.filter((_, idx) => idx !== index);
    newSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(newSlides);
    setSaveStatus('unsaved');

    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, currentSlide, html, onUpdateHtml]);

  const duplicateSlide = useCallback((index: number) => {
    const slide = slides[index];
    if (slide) addSlide(slide.rawContent, index);
  }, [slides, addSlide]);

  const moveSlide = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    newSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(newSlides);
    setCurrentSlide(toIndex);
    setSaveStatus('unsaved');

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [slides, html, onUpdateHtml]);

  // Template selection handler
  const handleTemplateSelect = useCallback((templateHtml: string) => {
    addSlide(templateHtml, currentSlide);
    setShowTemplateLibrary(false);
  }, [addSlide, currentSlide]);

  // Multi-select handlers
  const toggleSlideSelection = useCallback((index: number, shiftKey: boolean) => {
    setSelectedSlides(prev => {
      const newSet = new Set(prev);

      if (shiftKey && lastSelectedSlide !== null) {
        // Range selection
        const start = Math.min(lastSelectedSlide, index);
        const end = Math.max(lastSelectedSlide, index);
        for (let i = start; i <= end; i++) {
          newSet.add(i);
        }
      } else {
        // Toggle single selection
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      }

      return newSet;
    });
    setLastSelectedSlide(index);
  }, [lastSelectedSlide]);

  const selectAllSlides = useCallback(() => {
    setSelectedSlides(new Set(slides.map((_, idx) => idx)));
  }, [slides]);

  const clearSelection = useCallback(() => {
    setSelectedSlides(new Set());
    setLastSelectedSlide(null);
  }, []);

  // Batch operations
  const deleteSelectedSlides = useCallback(() => {
    if (selectedSlides.size === 0 || selectedSlides.size >= slides.length) return;

    const newSlides = slides.filter((_, idx) => !selectedSlides.has(idx));
    newSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(newSlides);
    setSaveStatus('unsaved');
    clearSelection();

    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [selectedSlides, slides, currentSlide, html, onUpdateHtml, clearSelection]);

  const duplicateSelectedSlides = useCallback(() => {
    if (selectedSlides.size === 0) return;

    const sortedIndices = Array.from(selectedSlides).sort((a, b) => a - b);
    const newSlides = [...slides];
    const globalStyles = extractGlobalStyles(html);

    // Insert duplicates after the last selected slide
    const insertPoint = sortedIndices[sortedIndices.length - 1] + 1;
    const duplicates: SlideInfo[] = sortedIndices.map((idx) => {
      const original = slides[idx];
      const newId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: newId,
        index: 0, // Will be updated
        title: `${original.title} (copy)`,
        html: createIsolatedSlideHtml(original.rawContent, globalStyles),
        rawContent: original.rawContent,
        hasError: false
      };
    });

    newSlides.splice(insertPoint, 0, ...duplicates);
    newSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(newSlides);
    setSaveStatus('unsaved');
    clearSelection();

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(newSlides, html));
    }
  }, [selectedSlides, slides, html, onUpdateHtml, clearSelection]);

  const exportSelectedSlides = useCallback(() => {
    if (selectedSlides.size === 0) return;

    const sortedIndices = Array.from(selectedSlides).sort((a, b) => a - b);
    const globalStyles = extractGlobalStyles(html);

    const exportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Slides</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${globalStyles}</style>
</head>
<body>
${sortedIndices.map(idx => slides[idx].rawContent).join('\n\n')}
</body>
</html>`;

    const blob = new Blob([exportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slides-export-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedSlides, slides, html]);

  // Diff viewer revert handler
  const handleDiffRevert = useCallback((revertedHtml: string) => {
    updateSlide(currentSlide, revertedHtml);
    setShowDiffViewer(false);
  }, [currentSlide, updateSlide]);

  // Import slides handler
  const handleImportSlides = useCallback((importedSlides: ImportedSlide[]) => {
    const globalStyles = extractGlobalStyles(html);

    const newSlides: SlideInfo[] = importedSlides.map((imported, idx) => {
      const slideId = `slide-${Date.now()}-${idx}`;
      return {
        id: slideId,
        index: slides.length + idx,
        title: imported.title,
        html: createIsolatedSlideHtml(imported.html, globalStyles),
        rawContent: imported.html,
        hasError: false
      };
    });

    const allSlides = [...slides, ...newSlides];
    allSlides.forEach((slide, idx) => { slide.index = idx; });

    setSlides(allSlides);
    setSaveStatus('unsaved');

    // Record in history
    newSlides.forEach(slide => {
      historyStore.recordSlideChange(slide.id, slide.rawContent, slide.title);
    });

    if (onUpdateHtml) {
      onUpdateHtml(reconstructHtml(allSlides, html));
    }

    // Jump to first imported slide
    setCurrentSlide(slides.length);
  }, [slides, html, onUpdateHtml, historyStore]);

  // Auto-play
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
      // Allow Escape and C to work even when chat panel is open
      if (e.key === 'Escape' && showChatPanel) {
        e.preventDefault();
        setShowChatPanel(false);
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && showChatPanel && !e.ctrlKey && !e.metaKey) {
        // Don't toggle when typing in chat
        return;
      }

      if (showAddSlideModal || showEditSlideModal || showCheckpointModal || showRestoreModal) return;

      switch (e.key) {
        case 'Escape':
          if (showThumbnails) setShowThumbnails(false);
          else if (isEditMode) setIsEditMode(false);
          else onClose();
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
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
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
        case 'z':
        case 'Z':
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
          } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowCheckpointModal(true);
          }
          break;
        case 'c':
        case 'C':
          if (isEditMode && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowChatPanel(prev => !prev);
          }
          break;
        case 't':
        case 'T':
          if (isEditMode && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowTemplateLibrary(prev => !prev);
          }
          break;
        case 'a':
          if ((e.ctrlKey || e.metaKey) && isEditMode && showThumbnails) {
            e.preventDefault();
            selectAllSlides();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (isEditMode && showThumbnails && selectedSlides.size > 0) {
            e.preventDefault();
            deleteSelectedSlides();
          }
          break;
        case 'd':
        case 'D':
          if (isEditMode && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowDiffViewer(prev => !prev);
          }
          break;
        case 'i':
        case 'I':
          if (isEditMode && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowImportModal(prev => !prev);
          }
          break;
      }
      setShowControls(true);
      resetHideTimeout();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextSlide, prevSlide, goToFirst, goToLast, showThumbnails, isEditMode, showAddSlideModal, showEditSlideModal, showCheckpointModal, showRestoreModal, showChatPanel, showTemplateLibrary, showDiffViewer, showImportModal, selectedSlides, handleUndo, handleRedo, selectAllSlides, deleteSelectedSlides]);

  // Fullscreen
  useEffect(() => {
    const timer = setTimeout(() => toggleFullscreen(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
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
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (!showThumbnails && !isEditMode) setShowControls(false);
    }, 3000);
  }, [showThumbnails, isEditMode]);

  useEffect(() => {
    resetHideTimeout();
    return () => { if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current); };
  }, [resetHideTimeout]);

  const handleMouseMove = () => {
    setShowControls(true);
    resetHideTimeout();
  };

  // Modal handlers
  const handleAddSlide = () => {
    if (newSlideHtml.trim()) {
      addSlide(newSlideHtml, currentSlide);
      setNewSlideHtml('');
      setPreviewHtml('');
      setShowAddSlideModal(false);
    }
  };

  const handleEditSlide = () => {
    if (editSlideHtml.trim() && editSlideIndex >= 0) {
      updateSlide(editSlideIndex, editSlideHtml);
      setEditSlideHtml('');
      setEditSlideIndex(-1);
      setShowEditSlideModal(false);
    }
  };

  const openEditModal = (index: number) => {
    setEditSlideIndex(index);
    setEditSlideHtml(slides[index]?.rawContent || '');
    setShowEditSlideModal(true);
  };

  // Live preview update with validation
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (newSlideHtml.trim()) {
        // Validate HTML
        const validation = validateHtml(newSlideHtml);
        setValidationResult(validation);

        // Generate preview
        const globalStyles = extractGlobalStyles(html);
        setPreviewHtml(createIsolatedSlideHtml(newSlideHtml, globalStyles));
      } else {
        setPreviewHtml('');
        setValidationResult(null);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [newSlideHtml, html]);

  // Handle auto-fix
  const handleAutoFix = useCallback(() => {
    if (newSlideHtml.trim()) {
      const { fixed, changes } = autoFixHtml(newSlideHtml);
      setNewSlideHtml(fixed);
    }
  }, [newSlideHtml]);

  // Handle chat panel apply
  const handleChatApplyHtml = useCallback((newHtml: string) => {
    updateSlide(currentSlide, newHtml);
    setShowChatPanel(false);
  }, [currentSlide, updateSlide]);

  const progressPercent = totalSlides > 1 ? (currentSlide / (totalSlides - 1)) * 100 : 100;
  const checkpoints = historyStore.getCheckpoints();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black"
      onMouseMove={handleMouseMove}
      onClick={() => { setShowControls(true); resetHideTimeout(); }}
    >
      {/* Top Control Bar */}
      <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-semibold text-lg truncate max-w-md">{title}</h2>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <span className="text-cyan-400 font-bold">{currentSlide + 1}</span>
              <span className="text-white/50">/</span>
              <span className="text-white/70">{totalSlides}</span>
            </div>
            {isEditMode && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded">EDIT MODE</span>
            )}
            {currentSlideInfo?.hasError && (
              <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3 h-3" />
                Error
              </span>
            )}
            {/* Save status */}
            <span className={`text-xs px-2 py-1 rounded ${
              saveStatus === 'saved' ? 'text-green-400/70' :
              saveStatus === 'saving' ? 'text-yellow-400/70' :
              'text-orange-400/70'
            }`}>
              {saveStatus === 'saved' && lastSaveTime > 0 ? `Saved ${formatTimestamp(lastSaveTime)}` :
               saveStatus === 'saving' ? 'Saving...' :
               'Unsaved changes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo (in edit mode) */}
            {isEditMode && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <ArrowUturnRightIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
              </>
            )}

            {/* Save Checkpoint */}
            <button
              onClick={() => setShowCheckpointModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Save Checkpoint (Ctrl+S)"
            >
              <BookmarkIcon className="w-5 h-5" />
            </button>

            {/* Restore */}
            <button
              onClick={() => setShowRestoreModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Restore Checkpoint"
            >
              <ClockIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Edit Mode */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-lg transition-colors ${isEditMode ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Toggle Edit Mode (E)"
            >
              <PencilIcon className="w-5 h-5" />
            </button>

            {isEditMode && (
              <>
                <button
                  onClick={() => setShowAddSlideModal(true)}
                  className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                  title="Add Slide (A)"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                {/* Template Library */}
                <button
                  onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
                  className={`p-2 rounded-lg transition-colors ${showTemplateLibrary ? 'bg-cyan-500 text-white' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'}`}
                  title="Template Library (T)"
                >
                  <RectangleStackIcon className="w-5 h-5" />
                </button>

                {/* AI Chat Panel */}
                <button
                  onClick={() => setShowChatPanel(!showChatPanel)}
                  className={`p-2 rounded-lg transition-colors ${showChatPanel ? 'bg-purple-500 text-white' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'}`}
                  title="AI Slide Editor (C)"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>

                {/* Diff Viewer */}
                <button
                  onClick={() => setShowDiffViewer(!showDiffViewer)}
                  className={`p-2 rounded-lg transition-colors ${showDiffViewer ? 'bg-orange-500 text-white' : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'}`}
                  title="Compare Versions (D)"
                >
                  <ArrowsRightLeftIcon className="w-5 h-5" />
                </button>

                {/* Import/Export */}
                <button
                  onClick={() => setShowImportModal(!showImportModal)}
                  className={`p-2 rounded-lg transition-colors ${showImportModal ? 'bg-blue-500 text-white' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'}`}
                  title="Import/Export (I)"
                >
                  <CloudArrowDownIcon className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2 rounded-lg transition-colors ${showThumbnails ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Slide Overview (G)"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              title="Exit (Esc)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Main Slide Content */}
      {currentSlideInfo?.hasError ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-lg text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-red-400 text-xl font-semibold mb-2">Slide Error</h3>
            <p className="text-red-300/70 mb-4">{currentSlideInfo.errorMessage || 'An error occurred rendering this slide'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => resetSlide(currentSlide)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reset Slide
              </button>
              <button
                onClick={() => openEditModal(currentSlide)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit HTML
              </button>
            </div>
          </div>
        </div>
      ) : (
        <iframe
          srcDoc={currentSlideHtml}
          className="w-full h-full border-none"
          title={`${title} - Slide ${currentSlide + 1}`}
          sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
          key={`slide-${currentSlide}-${currentSlideInfo?.id}`}
        />
      )}

      {/* Bottom Control Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-center gap-4 px-6 py-5">
          <button onClick={goToFirst} disabled={currentSlide === 0} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30" title="First (Home)">
            <HomeIcon className="w-5 h-5" />
          </button>
          <button onClick={prevSlide} disabled={currentSlide === 0} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-30" title="Previous (←)">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-1.5 px-4">
            {totalSlides <= 15 ? (
              slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    slide.hasError ? 'bg-red-500' :
                    idx === currentSlide ? 'bg-cyan-400 scale-125' :
                    idx < currentSlide ? 'bg-white/50 hover:bg-white/70' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  title={slide.hasError ? `Slide ${idx + 1} (Error)` : `Slide ${idx + 1}`}
                />
              ))
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-white/70 text-sm font-mono">{String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}</span>
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </div>

          <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-30" title="Next (→)">
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <button onClick={() => setIsAutoPlay(!isAutoPlay)} className={`p-2 rounded-lg transition-colors ${isAutoPlay ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`} title={isAutoPlay ? 'Pause (P)' : 'Auto-Play (P)'}>
            {isAutoPlay ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 pb-3 text-white/40 text-xs">
          <span>← → Navigate</span>
          <span>Ctrl+Z Undo</span>
          <span>Ctrl+S Save</span>
          <span>G Overview</span>
          <span>E Edit</span>
          {isEditMode && <span>T Templates</span>}
          {isEditMode && <span>D Diff</span>}
          {isEditMode && <span>I Import</span>}
        </div>
      </div>

      {/* Navigation Click Zones */}
      {!isEditMode && (
        <>
          <div className="absolute left-0 top-20 bottom-20 w-1/4 cursor-pointer z-30 group" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeftIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute right-0 top-20 bottom-20 w-1/4 cursor-pointer z-30 group" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRightIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </>
      )}

      {/* Thumbnail Grid */}
      {showThumbnails && (
        <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-sm overflow-auto p-8" onClick={() => { if (!isEditMode) setShowThumbnails(false); if (isEditMode && selectedSlides.size > 0) clearSelection(); }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-white text-xl font-semibold">Slide Overview</h3>
                {isEditMode && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setShowAddSlideModal(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm">
                      <PlusIcon className="w-4 h-4" />
                      Add Slide
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowTemplateLibrary(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm">
                      <RectangleStackIcon className="w-4 h-4" />
                      Templates
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); selectAllSlides(); }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                  >
                    Select All
                  </button>
                )}
                <button onClick={() => { setShowThumbnails(false); clearSelection(); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Operations Toolbar */}
            {isEditMode && selectedSlides.size > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">{selectedSlides.size} slide{selectedSlides.size > 1 ? 's' : ''} selected</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={duplicateSelectedSlides}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={exportSelectedSlides}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={deleteSelectedSlides}
                    disabled={selectedSlides.size >= slides.length}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {slides.map((slide, idx) => (
                <div key={slide.id} className={`relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 transition-all group ${
                  selectedSlides.has(idx) ? 'border-purple-500 ring-2 ring-purple-500/50' :
                  slide.hasError ? 'border-red-500' :
                  idx === currentSlide ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-white/10 hover:border-white/30'
                }`}>
                  {slide.hasError ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-500/10">
                      <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                    </div>
                  ) : (
                    <iframe srcDoc={slide.html} className="w-full h-full pointer-events-none" title={`Slide ${idx + 1}`} sandbox="allow-same-origin" />
                  )}
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditMode && (e.ctrlKey || e.metaKey || e.shiftKey)) {
                        toggleSlideSelection(idx, e.shiftKey);
                      } else {
                        goToSlide(idx);
                        if (!isEditMode) setShowThumbnails(false);
                      }
                    }}
                  />
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold z-10 ${
                    selectedSlides.has(idx) ? 'bg-purple-500 text-white' :
                    idx === currentSlide ? 'bg-cyan-500 text-white' : 'bg-black/70 text-white/70'
                  }`}>
                    {idx + 1}
                  </div>
                  {/* Selection checkbox in edit mode */}
                  {isEditMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSlideSelection(idx, e.shiftKey); }}
                      className={`absolute top-2 left-10 w-5 h-5 rounded border-2 flex items-center justify-center z-20 transition-all ${
                        selectedSlides.has(idx)
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-black/50 border-white/30 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {selectedSlides.has(idx) && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xs truncate">{slide.title}</p>
                  </div>
                  {isEditMode && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(idx); }} className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded" title="Edit">
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }} className="p-1.5 bg-purple-500/80 hover:bg-purple-500 text-white rounded" title="Duplicate">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      </button>
                      {idx > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, idx - 1); }} className="p-1.5 bg-gray-500/80 hover:bg-gray-500 text-white rounded" title="Move Up">
                          <ArrowsUpDownIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {slide.hasError && (
                        <button onClick={(e) => { e.stopPropagation(); resetSlide(idx); }} className="p-1.5 bg-orange-500/80 hover:bg-orange-500 text-white rounded" title="Reset">
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {slides.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }} className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded" title="Delete">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isEditMode && (
                <button onClick={(e) => { e.stopPropagation(); setShowAddSlideModal(true); }} className="aspect-video bg-zinc-900/50 rounded-lg border-2 border-dashed border-white/20 hover:border-green-500/50 hover:bg-green-500/10 transition-all flex flex-col items-center justify-center gap-2 text-white/50 hover:text-green-400">
                  <PlusIcon className="w-8 h-8" />
                  <span className="text-sm">Add Slide</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Slide Modal with Live Preview and Validation */}
      {showAddSlideModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowAddSlideModal(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-6xl h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <ClipboardDocumentIcon className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Add New Slide</h3>
                {/* Validation Status Badge */}
                {validationResult && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                    validationResult.isValid
                      ? validationResult.warnings.length > 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {validationResult.isValid ? (
                      validationResult.warnings.length > 0 ? (
                        <><ShieldExclamationIcon className="w-3 h-3" /> {validationResult.warnings.length} warning(s)</>
                      ) : (
                        <><CheckIcon className="w-3 h-3" /> Valid</>
                      )
                    ) : (
                      <><ExclamationTriangleIcon className="w-3 h-3" /> {validationResult.errors.length} error(s)</>
                    )}
                  </span>
                )}
              </div>
              <button onClick={() => { setShowAddSlideModal(false); setNewSlideHtml(''); setPreviewHtml(''); setValidationResult(null); }} className="p-2 hover:bg-zinc-800 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* Editor */}
              <div className="w-1/2 p-4 flex flex-col border-r border-zinc-700">
                <p className="text-zinc-400 text-sm mb-3">Paste HTML from LMArena, ChatGPT, or any source:</p>
                <textarea
                  ref={textareaRef}
                  value={newSlideHtml}
                  onChange={(e) => setNewSlideHtml(e.target.value)}
                  placeholder={`<section class="slide-section">\n  <h2>Your Slide Title</h2>\n  <p>Content here...</p>\n</section>`}
                  className={`flex-1 w-full bg-zinc-800 border rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none ${
                    validationResult && !validationResult.isValid ? 'border-red-500/50' : 'border-zinc-700 focus:border-cyan-500'
                  }`}
                  autoFocus
                />

                {/* Validation Errors & Warnings */}
                {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                  <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <div key={`error-${idx}`} className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error.message}{error.line ? ` (line ${error.line})` : ''}</span>
                      </div>
                    ))}
                    {validationResult.warnings.map((warning, idx) => (
                      <div key={`warning-${idx}`} className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 rounded p-2">
                        <ShieldExclamationIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <span>{warning.message}</span>
                          {warning.suggestion && <p className="text-yellow-400/70 mt-0.5">{warning.suggestion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Live Preview */}
              <div className="w-1/2 p-4 flex flex-col">
                <p className="text-zinc-400 text-sm mb-3">Live Preview:</p>
                <div className="flex-1 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                  {previewHtml ? (
                    <iframe srcDoc={previewHtml} className="w-full h-full" title="Preview" sandbox="allow-scripts allow-same-origin" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <p>Preview will appear here...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-zinc-700">
              {/* Auto-fix button */}
              <div>
                {validationResult && validationResult.canAutoFix && (
                  <button
                    onClick={handleAutoFix}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    Auto-fix Issues
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowAddSlideModal(false); setNewSlideHtml(''); setPreviewHtml(''); setValidationResult(null); }} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
                <button
                  onClick={handleAddSlide}
                  disabled={!newSlideHtml.trim() || (validationResult && !validationResult.isValid)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4" />
                  Add Slide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slide Modal */}
      {showEditSlideModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowEditSlideModal(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <PencilIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Edit Slide {editSlideIndex + 1}</h3>
              </div>
              <button onClick={() => setShowEditSlideModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <textarea
                value={editSlideHtml}
                onChange={(e) => setEditSlideHtml(e.target.value)}
                className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button onClick={() => setShowEditSlideModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={handleEditSlide} disabled={!editSlideHtml.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50">
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Checkpoint Modal */}
      {showCheckpointModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowCheckpointModal(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <BookmarkIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold">Save Checkpoint</h3>
              </div>
              <button onClick={() => setShowCheckpointModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-zinc-400 text-sm mb-2">Checkpoint Name (optional)</label>
              <input
                type="text"
                value={checkpointName}
                onChange={(e) => setCheckpointName(e.target.value)}
                placeholder={`Checkpoint ${new Date().toLocaleTimeString()}`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createManualCheckpoint(checkpointName)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
              <button onClick={() => setShowCheckpointModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={() => createManualCheckpoint(checkpointName)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg">
                <CloudArrowUpIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Checkpoint Modal */}
      {showRestoreModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowRestoreModal(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Restore Checkpoint</h3>
              </div>
              <button onClick={() => setShowRestoreModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {checkpoints.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No checkpoints yet</p>
                  <p className="text-sm">Checkpoints are saved automatically every 30 seconds</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {checkpoints.map((checkpoint) => (
                    <button
                      key={checkpoint.id}
                      onClick={() => restoreCheckpoint(checkpoint)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="text-white font-medium">{checkpoint.name}</p>
                        <p className="text-zinc-400 text-sm">{checkpoint.slides.length} slides • {formatTimestamp(checkpoint.timestamp)}</p>
                      </div>
                      {checkpoint.isAutoSave && (
                        <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-1 rounded">Auto</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end p-4 border-t border-zinc-700">
              <button onClick={() => setShowRestoreModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Slide Chat Panel */}
      <SlideChatPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        currentSlideHtml={currentSlideInfo?.rawContent || ''}
        currentSlideTitle={currentSlideInfo?.title || ''}
        currentSlideIndex={currentSlide}
        onApplyHtml={handleChatApplyHtml}
      />

      {/* Slide Template Library */}
      <SlideTemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={handleTemplateSelect}
        currentSlideHtml={currentSlideInfo?.rawContent}
      />

      {/* Slide Diff Viewer */}
      <SlideDiffViewer
        isOpen={showDiffViewer}
        onClose={() => setShowDiffViewer(false)}
        slideId={currentSlideInfo?.id || ''}
        slideTitle={currentSlideInfo?.title || ''}
        currentHtml={currentSlideInfo?.rawContent || ''}
        globalStyles={extractGlobalStyles(html)}
        onRevertToVersion={handleDiffRevert}
      />

      {/* Slide Import/Export Modal */}
      <SlideImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSlides={handleImportSlides}
        currentSlides={slides.map(s => ({ id: s.id, title: s.title, rawContent: s.rawContent }))}
        presentationTitle={title}
        globalStyles={extractGlobalStyles(html)}
      />
    </div>
  );
};

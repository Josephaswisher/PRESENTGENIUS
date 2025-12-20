/**
 * Presenter View Component
 *
 * Dual-screen presenter interface showing:
 * - Current slide (large)
 * - Next slide preview
 * - Speaker notes
 * - Timer
 * - Slide progress
 *
 * Syncs with main presentation window via BroadcastChannel.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  DocumentTextIcon,
  Square2StackIcon,
} from '@heroicons/react/24/outline';
import { PresenterTimer } from './PresenterTimer';
import { SpeakerNotes } from './SpeakerNotes';
import { SlideContent, buildPresentation, PresentationConfig } from '../../services/reveal-builder';

interface PresenterViewProps {
  slides: SlideContent[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onClose: () => void;
  title: string;
  presentationConfig: PresentationConfig;
}

// BroadcastChannel name for syncing
const CHANNEL_NAME = 'vibe-presenter-sync';

export function PresenterView({
  slides,
  currentSlide,
  onSlideChange,
  onClose,
  title,
  presentationConfig,
}: PresenterViewProps) {
  const [showNotes, setShowNotes] = useState(true);
  const [audienceWindow, setAudienceWindow] = useState<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for same-device sync
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    // Listen for messages from audience window
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'SLIDE_REQUEST') {
        // Audience window is requesting current slide
        channelRef.current?.postMessage({
          type: 'SLIDE_UPDATE',
          slideIndex: currentSlide,
        });
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast slide changes
  useEffect(() => {
    channelRef.current?.postMessage({
      type: 'SLIDE_UPDATE',
      slideIndex: currentSlide,
    });
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          e.preventDefault();
          if (currentSlide < slides.length - 1) {
            onSlideChange(currentSlide + 1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentSlide > 0) {
            onSlideChange(currentSlide - 1);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length, onSlideChange, onClose]);

  // Open audience window
  const openAudienceWindow = () => {
    // Build presentation HTML with only current slide
    const audienceHTML = buildPresentation(slides, {
      ...presentationConfig,
      showProgress: true,
      showSlideNumber: true,
    });

    const newWindow = window.open('', '_blank', 'width=1920,height=1080');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Audience View</title>
          <style>
            body { margin: 0; background: #000; overflow: hidden; }
            iframe { width: 100vw; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe id="presentation" srcdoc="${audienceHTML.replace(/"/g, '&quot;')}"></iframe>
          <script>
            const channel = new BroadcastChannel('${CHANNEL_NAME}');
            let currentSlide = ${currentSlide};

            // Request current slide on load
            channel.postMessage({ type: 'SLIDE_REQUEST' });

            // Listen for slide updates
            channel.onmessage = (event) => {
              if (event.data.type === 'SLIDE_UPDATE') {
                const iframe = document.getElementById('presentation');
                // Reload with new slide index via Reveal.js navigation
                // This is a simplified version - in production you'd use Reveal.js API
                currentSlide = event.data.slideIndex;
              }
            };
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
      setAudienceWindow(newWindow);
    }
  };

  // Build HTML for slide preview
  const buildSlidePreview = (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= slides.length) return '';
    return buildPresentation([slides[slideIndex]], {
      ...presentationConfig,
      showProgress: false,
      showSlideNumber: false,
    });
  };

  const currentSlideContent = slides[currentSlide];
  const nextSlideContent = slides[currentSlide + 1];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Close Presenter View"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-white font-semibold text-sm">{title}</h2>
            <p className="text-zinc-500 text-xs">Presenter View</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Notes */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-lg transition-colors ${
              showNotes
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Speaker Notes"
          >
            <DocumentTextIcon className="w-5 h-5" />
          </button>

          {/* Open Audience Window */}
          <button
            onClick={openAudienceWindow}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            Open Audience View
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Side: Slides */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Current Slide (Large) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <Square2StackIcon className="w-4 h-4" />
              Current Slide ({currentSlide + 1} of {slides.length})
            </div>
            <div className="flex-1 bg-black rounded-lg overflow-hidden border border-zinc-800">
              <iframe
                srcDoc={buildSlidePreview(currentSlide)}
                className="w-full h-full"
                title="Current Slide"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Next Slide (Small) */}
          <div className="h-48 flex flex-col">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
              Next Slide
            </div>
            <div className="flex-1 bg-black rounded-lg overflow-hidden border border-zinc-800 opacity-70">
              {nextSlideContent ? (
                <iframe
                  srcDoc={buildSlidePreview(currentSlide + 1)}
                  className="w-full h-full"
                  title="Next Slide"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                  End of Presentation
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Notes & Timer */}
        {showNotes && (
          <div className="w-80 flex flex-col gap-4">
            {/* Timer */}
            <PresenterTimer
              mode="elapsed"
              countdownMinutes={30}
              onTimeWarning={() => console.log('5 minutes remaining!')}
              onTimeUp={() => console.log('Time is up!')}
            />

            {/* Speaker Notes */}
            <div className="flex-1 min-h-0">
              <SpeakerNotes
                slideId={currentSlideContent?.id || `slide-${currentSlide}`}
                presentationId={title}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-800">
        {/* Slide Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => onSlideChange(index)}
              className={`flex-shrink-0 w-16 h-10 rounded border-2 transition-all overflow-hidden ${
                currentSlide === index
                  ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                {index + 1}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous (←)"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <span className="text-zinc-400 text-sm px-3">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next (→ or Space)"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="absolute bottom-20 left-4 text-zinc-600 text-xs space-y-1">
        <p>← → Navigate</p>
        <p>Space Next</p>
        <p>Esc Close</p>
      </div>
    </div>
  );
}

export default PresenterView;

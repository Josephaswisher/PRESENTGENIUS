/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Fullscreen Presentation Mode
 * Clean, simple fullscreen viewer for generated presentations
 */
import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PresentationModeProps {
  html: string;
  title: string;
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  html,
  title,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to exit
      if (e.key === 'Escape') {
        onClose();
      }
      // F11 or F to toggle native fullscreen
      else if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  // Create blob URL for the HTML content
  const createBlobUrl = () => {
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Control Bar - Hidden by default, shows on hover */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-lg truncate max-w-md">
              {title}
            </h2>
            <span className="text-white/60 text-sm">
              {isFullscreen ? 'Fullscreen' : 'Press F for fullscreen'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
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
      </div>

      {/* Presentation iframe */}
      <iframe
        ref={iframeRef}
        src={createBlobUrl()}
        className="w-full h-full border-none"
        title={title}
        sandbox="allow-scripts allow-same-origin allow-modals"
      />

      {/* Keyboard Hints - Shows briefly on load */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg text-sm animate-fade-out pointer-events-none">
        <div className="flex items-center gap-6">
          <span>← → Navigate slides</span>
          <span className="text-white/40">|</span>
          <span>F Fullscreen</span>
          <span className="text-white/40">|</span>
          <span>Esc Exit</span>
        </div>
      </div>

      <style>{`
        @keyframes fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-out {
          animation: fade-out 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

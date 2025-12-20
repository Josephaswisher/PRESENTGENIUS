/**
 * Presentation Mode - Full-screen presentation with animations
 * Supports keyboard navigation, speaker notes, and drawing
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@heroicons/react/24/outline';
import { QRCodeDisplay } from './QRCodeDisplay';
import { 
  createSession, 
  updateSlide, 
  endSession,
  SessionState 
} from '../services/audience-sync';

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
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      }, 10000); // 10 seconds per slide
    } else {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    }
    
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [isPlaying, totalSlides]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          setIsPlaying(prev => !prev);
          break;
        case 'd':
          setShowDrawing(prev => !prev);
          break;
        case 'n':
          setShowNotes(prev => !prev);
          break;
        case 'q':
          setShowQR(prev => !prev);
          break;
        case 'Home':
          setCurrentSlide(0);
          break;
        case 'End':
          setCurrentSlide(totalSlides - 1);
          break;
        case 'g':
          const slideNum = prompt('Go to slide:');
          if (slideNum) {
            const num = parseInt(slideNum) - 1;
            if (num >= 0 && num < totalSlides) {
              setCurrentSlide(num);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, onClose]);

  // Parse slides from HTML
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument;
          if (doc) {
            // Try to find slide-like elements
            const slides = doc.querySelectorAll('[data-slide], .slide, section, .reveal .slides > section');
            if (slides.length > 1) {
              setTotalSlides(slides.length);
            } else {
              // Single page content - treat as one slide
              setTotalSlides(1);
            }
            
            // Inject presentation styles
            const style = doc.createElement('style');
            style.textContent = `
              * { transition: opacity 0.3s ease, transform 0.3s ease; }
              .slide-hidden { opacity: 0; transform: translateX(100px); pointer-events: none; position: absolute; }
              .slide-visible { opacity: 1; transform: translateX(0); }
              body { overflow: hidden; }
            `;
            doc.head.appendChild(style);
          }
        } catch (e) {
          console.error('Error accessing iframe content:', e);
        }
      };
    }
  }, [html]);

  // Update visible slide
  useEffect(() => {
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      const slides = doc.querySelectorAll('[data-slide], .slide, section');
      
      slides.forEach((slide, index) => {
        if (index === currentSlide) {
          slide.classList.remove('slide-hidden');
          slide.classList.add('slide-visible');
        } else {
          slide.classList.add('slide-hidden');
          slide.classList.remove('slide-visible');
        }
      });
    }
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = Math.min(prev + 1, totalSlides - 1);
      if (session) updateSlide(session.code, next);
      return next;
    });
  }, [totalSlides, session]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const next = Math.max(prev - 1, 0);
      if (session) updateSlide(session.code, next);
      return next;
    });
  }, [session]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate enhanced HTML with slide navigation
  const enhancedHtml = html.replace(
    '</body>',
    `<script>
      // Enable click navigation
      document.addEventListener('click', (e) => {
        if (e.clientX > window.innerWidth / 2) {
          window.parent.postMessage({ type: 'nextSlide' }, '*');
        } else {
          window.parent.postMessage({ type: 'prevSlide' }, '*');
        }
      });
    </script></body>`
  );

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'nextSlide') nextSlide();
      if (e.data.type === 'prevSlide') prevSlide();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextSlide, prevSlide]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={enhancedHtml}
          className="w-full h-full border-0"
          title="Presentation"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Drawing Canvas Overlay */}
        {showDrawing && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 cursor-crosshair"
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Click Zones */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div 
            className="w-1/3 h-full pointer-events-auto cursor-w-resize opacity-0 hover:opacity-100 
                       flex items-center justify-start pl-4 transition-opacity"
            onClick={prevSlide}
          >
            <ChevronLeftIcon className="w-12 h-12 text-white/50" />
          </div>
          <div className="w-1/3 h-full" />
          <div 
            className="w-1/3 h-full pointer-events-auto cursor-e-resize opacity-0 hover:opacity-100 
                       flex items-center justify-end pr-4 transition-opacity"
            onClick={nextSlide}
          >
            <ChevronRightIcon className="w-12 h-12 text-white/50" />
          </div>
        </div>

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

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent
                    transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Timer & Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/70">
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="text-white/70 font-mono">
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrawing(!showDrawing)}
              className={`p-2 rounded-lg transition-colors ${
                showDrawing ? 'bg-cyan-500 text-white' : 'text-white/70 hover:text-white'
              }`}
              title="Draw (D)"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${
                showNotes ? 'bg-cyan-500 text-white' : 'text-white/70 hover:text-white'
              }`}
              title="Notes (N)"
            >
              <SpeakerWaveIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className={`p-2 rounded-lg transition-colors ${
                showQR ? 'bg-cyan-500 text-white' : 'text-white/70 hover:text-white'
              }`}
              title="QR Code (Q)"
            >
              <QrCodeIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Fullscreen (F)"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Exit (Esc)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help (shown briefly) */}
      <div className={`absolute top-4 right-4 bg-black/80 text-white/70 text-xs p-3 rounded-lg
                       transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span>←/→</span><span>Navigate</span>
          <span>Space</span><span>Next</span>
          <span>P</span><span>Play/Pause</span>
          <span>D</span><span>Draw</span>
          <span>Q</span><span>QR Code</span>
          <span>F</span><span>Fullscreen</span>
          <span>Esc</span><span>Exit</span>
        </div>
      </div>

      {/* Title */}
      {title && (
        <div className={`absolute top-4 left-4 text-white/50 text-sm transition-opacity duration-300
                        ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </div>
      )}
    </div>
  );
};

export default PresentationMode;

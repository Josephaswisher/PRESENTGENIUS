/**
 * Picture-in-Picture Video Component
 * Supports presenter webcam or demo videos in PiP mode
 * Falls back to fixed overlay for unsupported browsers
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VideoCameraIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';

interface PictureInPictureVideoProps {
  /** Video source URL or MediaStream */
  videoSource?: string | MediaStream;
  /** Show/hide the PiP video */
  show: boolean;
  /** Callback when PiP is closed */
  onClose: () => void;
  /** Enable webcam mode (will request camera access) */
  enableWebcam?: boolean;
  /** Initial corner position */
  initialCorner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const PictureInPictureVideo: React.FC<PictureInPictureVideoProps> = ({
  videoSource,
  show,
  onClose,
  enableWebcam = false,
  initialCorner = 'bottom-right',
}) => {
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [currentCorner, setCurrentCorner] = useState<Corner>(initialCorner);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for PiP API support
  useEffect(() => {
    const supported = 'pictureInPictureEnabled' in document;
    setIsPiPSupported(supported);
  }, []);

  // Request webcam access if enabled
  useEffect(() => {
    if (!enableWebcam || !show) return;

    const getWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
        setWebcamStream(stream);
        setError(null);
      } catch (err) {
        console.error('Failed to access webcam:', err);
        setError('Camera access denied or unavailable');
      }
    };

    getWebcam();

    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enableWebcam, show]);

  // Set video source
  useEffect(() => {
    if (!videoRef.current) return;

    if (webcamStream) {
      videoRef.current.srcObject = webcamStream;
    } else if (videoSource) {
      if (typeof videoSource === 'string') {
        videoRef.current.src = videoSource;
      } else {
        videoRef.current.srcObject = videoSource;
      }
    }
  }, [videoSource, webcamStream]);

  // Enter/exit PiP mode
  const togglePiP = useCallback(async () => {
    if (!videoRef.current || !isPiPSupported) return;

    try {
      if (isPiPActive) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP toggle failed:', err);
      setError('Picture-in-Picture failed');
    }
  }, [isPiPActive, isPiPSupported]);

  // Listen for PiP enter/exit events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Corner positioning styles
  const getCornerStyles = (corner: Corner) => {
    const baseStyles = 'fixed z-[9998] transition-all duration-300';
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-24 left-4',
      'bottom-right': 'bottom-24 right-4',
    };
    return `${baseStyles} ${positions[corner]}`;
  };

  // Handle dragging to change corner
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPiPActive) return; // Can't drag when in PiP mode
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isPiPActive]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Determine new corner based on drag direction
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;

    let newCorner: Corner;
    if (e.clientX < centerX) {
      newCorner = e.clientY < centerY ? 'top-left' : 'bottom-left';
    } else {
      newCorner = e.clientY < centerY ? 'top-right' : 'bottom-right';
    }

    setCurrentCorner(newCorner);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard shortcut 'v' for toggle
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (isPiPSupported) {
          togglePiP();
        } else {
          setIsMinimized(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, togglePiP, isPiPSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (isPiPActive && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    };
  }, [webcamStream, isPiPActive]);

  if (!show) return null;

  return (
    <>
      {/* Fallback fixed overlay for unsupported browsers or when not in PiP */}
      {!isPiPActive && (
        <div
          ref={containerRef}
          className={`${getCornerStyles(currentCorner)} ${
            isMinimized ? 'w-16 h-12' : 'w-80 h-60'
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 group">
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={enableWebcam} // Mute webcam to prevent feedback
              className={`w-full h-full object-cover ${isMinimized ? 'hidden' : ''}`}
            />

            {/* Minimized Icon */}
            {isMinimized && (
              <div className="flex items-center justify-center w-full h-full bg-zinc-900">
                <VideoCameraIcon className="w-8 h-8 text-white/60" />
              </div>
            )}

            {/* Error Message */}
            {error && !isMinimized && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                <div className="text-white text-xs text-center px-4">
                  <VideoCameraIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  {error}
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* PiP Toggle (if supported) */}
                  {isPiPSupported && !isMinimized && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePiP();
                      }}
                      className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-white/80 hover:text-white transition-all"
                      title="Enter Picture-in-Picture (V)"
                    >
                      <ArrowsPointingOutIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Minimize/Maximize Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(prev => !prev);
                    }}
                    className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-white/80 hover:text-white transition-all"
                    title={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? (
                      <ArrowsPointingOutIcon className="w-4 h-4" />
                    ) : (
                      <ArrowsPointingInIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1.5 bg-black/40 hover:bg-red-500/60 rounded text-white/80 hover:text-white transition-all"
                  title="Close"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corner Indicator (when dragging) */}
            {isDragging && (
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <div className="inline-block px-3 py-1 bg-black/80 rounded-full text-white/80 text-xs font-medium">
                  {currentCorner.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </div>
              </div>
            )}

            {/* Keyboard Hint */}
            {!isMinimized && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-black/60 rounded text-white/60 text-[10px] font-mono">
                  Press V
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden video element for PiP mode */}
      {isPiPSupported && isPiPActive && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={enableWebcam}
          className="hidden"
        />
      )}

      {/* Status indicator when in PiP mode */}
      {isPiPActive && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-cyan-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 animate-fade-in">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Picture-in-Picture Active - Press V to exit
          </div>
        </div>
      )}
    </>
  );
};

export default PictureInPictureVideo;

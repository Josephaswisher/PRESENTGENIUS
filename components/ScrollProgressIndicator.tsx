/**
 * Vertical scroll progress indicator for current slide
 * Shows how far user has scrolled within the slide content
 */

import React, { useState, useEffect } from 'react';

interface ScrollProgressIndicatorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  currentSlide: number;
  show: boolean;
}

export const ScrollProgressIndicator: React.FC<ScrollProgressIndicatorProps> = ({
  iframeRef,
  currentSlide,
  show,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    if (!show || !iframeRef.current?.contentDocument) {
      setScrollProgress(0);
      setIsScrollable(false);
      return;
    }

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) {
      setScrollProgress(0);
      setIsScrollable(false);
      return;
    }

    const updateProgress = () => {
      const scrollableHeight = slide.scrollHeight - slide.clientHeight;
      const isSlideScrollable = scrollableHeight > 0;
      setIsScrollable(isSlideScrollable);

      if (isSlideScrollable) {
        const progress = (slide.scrollTop / scrollableHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      } else {
        setScrollProgress(100); // Show full if not scrollable
      }
    };

    // Initial check
    updateProgress();

    // Listen for scroll events
    const handleScroll = () => {
      updateProgress();
    };

    slide.addEventListener('scroll', handleScroll, { passive: true });

    // Also check on resize
    const handleResize = () => {
      updateProgress();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      slide.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [iframeRef, currentSlide, show]);

  // Don't show if slide isn't scrollable
  if (!show || !isScrollable) return null;

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-15 pointer-events-none"
      role="progressbar"
      aria-label="Slide scroll progress"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Track (background) */}
      <div className="relative w-1 h-64 bg-zinc-800/50 rounded-full overflow-hidden">
        {/* Progress bar with gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-150 ease-out rounded-full"
          style={{
            height: `${scrollProgress}%`,
            background: 'linear-gradient(to top, rgb(6, 182, 212), rgb(34, 211, 238))',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Percentage label (optional, shows on hover) */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-cyan-300 font-medium">
          {Math.round(scrollProgress)}%
        </span>
      </div>
    </div>
  );
};

/**
 * Visual hints to indicate scrollable content
 * Shows gradient fade and animated chevron at bottom of slide
 */

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ScrollHintsProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  currentSlide: number;
  show: boolean; // Control visibility from parent
}

export const ScrollHints: React.FC<ScrollHintsProps> = ({
  iframeRef,
  currentSlide,
  show,
}) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!show || !iframeRef.current?.contentDocument) {
      setShowHint(false);
      return;
    }

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');
    const slide = slides[currentSlide];

    if (!(slide instanceof HTMLElement)) {
      setShowHint(false);
      return;
    }

    const checkScrollability = () => {
      const isScrollable = slide.scrollHeight > slide.clientHeight;
      const scrolledToBottom = slide.scrollTop >= (slide.scrollHeight - slide.clientHeight - 20);

      setShowHint(isScrollable && !scrolledToBottom);
    };

    // Initial check
    checkScrollability();

    // Listen for scroll events to hide hint when at bottom
    const handleScroll = () => {
      checkScrollability();
    };

    slide.addEventListener('scroll', handleScroll, { passive: true });

    // Also check on resize
    const handleResize = () => {
      checkScrollability();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      slide.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [iframeRef, currentSlide, show]);

  if (!showHint) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none z-10"
      aria-live="polite"
      aria-label="More content below"
    >
      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent)',
        }}
      />

      {/* Animated chevron and text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-cyan-300 text-sm font-medium">
          Scroll for more content
        </p>
        <ChevronDownIcon
          className="w-6 h-6 text-cyan-400 animate-bounce"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

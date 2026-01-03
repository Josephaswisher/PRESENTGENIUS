/**
 * Mini-map navigation component
 * Displays hierarchical navigation of all headings across all slides
 */

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Heading {
  title: string;
  slideIndex: number;
  level: number;
  element?: HTMLElement;
}

interface MiniMapNavigationProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  currentSlide: number;
  totalSlides: number;
  onNavigate: (slideIndex: number) => void;
  onClose: () => void;
  show: boolean;
}

export const MiniMapNavigation: React.FC<MiniMapNavigationProps> = ({
  iframeRef,
  currentSlide,
  totalSlides,
  onNavigate,
  onClose,
  show,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract headings from iframe content
  useEffect(() => {
    if (!show || !iframeRef.current?.contentDocument) {
      return;
    }

    const doc = iframeRef.current.contentDocument;
    const slides = doc.querySelectorAll('[data-slide], .slide, section');

    const extractedHeadings: Heading[] = [];

    slides.forEach((slide, slideIndex) => {
      const slideHeadings = slide.querySelectorAll('h1, h2, h3, h4');

      slideHeadings.forEach((heading) => {
        if (heading instanceof HTMLElement && heading.textContent) {
          const level = parseInt(heading.tagName[1]);
          extractedHeadings.push({
            title: heading.textContent.trim(),
            slideIndex,
            level,
            element: heading,
          });
        }
      });
    });

    setHeadings(extractedHeadings);
  }, [iframeRef, totalSlides, show]);

  // Filter headings based on search query
  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return headings;

    const query = searchQuery.toLowerCase();
    return headings.filter(h => h.title.toLowerCase().includes(query));
  }, [headings, searchQuery]);

  // Jump to heading
  const handleHeadingClick = (heading: Heading) => {
    // Navigate to slide
    onNavigate(heading.slideIndex);

    // Scroll to heading within slide (after a brief delay for slide transition)
    setTimeout(() => {
      if (heading.element) {
        heading.element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 350);
  };

  if (!show) return null;

  return (
    <div className="fixed left-4 top-20 bottom-20 w-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-2xl z-30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Navigation</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
          aria-label="Close navigation"
        >
          <XMarkIcon className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-zinc-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search headings..."
            className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredHeadings.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 text-sm">
            {searchQuery ? 'No headings found' : 'No headings in presentation'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHeadings.map((heading, index) => {
              const isCurrentSlide = heading.slideIndex === currentSlide;
              const indent = (heading.level - 1) * 12; // Indent based on heading level

              return (
                <button
                  key={index}
                  onClick={() => handleHeadingClick(heading)}
                  className={`
                    w-full text-left px-3 py-2 rounded text-sm transition-all
                    ${isCurrentSlide
                      ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-500'
                      : 'text-zinc-300 hover:bg-zinc-800 border-l-2 border-transparent'
                    }
                  `}
                  style={{ paddingLeft: `${12 + indent}px` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex-1">{heading.title}</span>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded
                      ${isCurrentSlide
                        ? 'bg-cyan-500/30 text-cyan-200'
                        : 'bg-zinc-700 text-zinc-400'
                      }
                    `}>
                      {heading.slideIndex + 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Statistics */}
      <div className="p-3 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between">
        <span>{filteredHeadings.length} {filteredHeadings.length === 1 ? 'heading' : 'headings'}</span>
        <span>Slide {currentSlide + 1}/{totalSlides}</span>
      </div>

      {/* Keyboard hint */}
      <div className="px-3 pb-3 text-xs text-zinc-600">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700">Shift+N</kbd> to toggle
      </div>
    </div>
  );
};

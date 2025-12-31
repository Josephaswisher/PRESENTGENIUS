/**
 * ThumbnailSidebar Component
 * Displays slide thumbnails with drag-to-reorder functionality
 * Mobile-optimized with collapsible drawer and touch support
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileSidebar } from '../mobile/MobileSidebar';
import type { Slide } from '../../types/slides';

interface ThumbnailSidebarProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  mobileMode?: 'drawer' | 'inline' | 'auto';
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  className = '',
  isOpen: controlledIsOpen,
  onToggle,
  mobileMode = 'auto',
}) => {
  const {
    presentation,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
  } = useSlideStore();

  const { isMobile, isTablet } = useMediaQuery();
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Determine if sidebar should be open
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Determine display mode based on screen size
  const shouldUseDrawer = mobileMode === 'drawer' || (mobileMode === 'auto' && (isMobile || isTablet));

  // Auto-close on mobile after selecting a slide
  const handleSlideSelect = (index: number) => {
    setCurrentSlide(index);
    if (shouldUseDrawer && isMobile) {
      setInternalIsOpen(false);
      onToggle?.();
    }
  };

  const handleToggle = () => {
    setInternalIsOpen(!isOpen);
    onToggle?.();
  };

  if (!presentation) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderSlides(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Sidebar content (shared between mobile and desktop)
  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 flex-shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Slides ({presentation.slides.length})
        </span>
        <button
          onClick={() => addSlide(currentSlideIndex)}
          className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors touch-manipulation"
          title="Add slide"
        >
          <PlusIcon className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 overscroll-contain">
        {presentation.slides.map((slide, index) => (
          <ThumbnailItem
            key={slide.id}
            slide={slide}
            index={index}
            isActive={index === currentSlideIndex}
            isDragging={index === draggedIndex}
            isDragOver={index === dragOverIndex}
            onClick={() => handleSlideSelect(index)}
            onDuplicate={() => duplicateSlide(index)}
            onDelete={() => deleteSlide(index)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            canDelete={presentation.slides.length > 1}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Add Slide Button */}
      <div className="p-2 border-t border-zinc-700 flex-shrink-0">
        <button
          onClick={() => addSlide()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5
                     bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors
                     text-sm text-zinc-300 touch-manipulation active:scale-[0.98]"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add Slide</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </>
  );

  // Mobile drawer mode
  if (shouldUseDrawer) {
    return (
      <>
        {/* Floating toggle button for mobile */}
        {!isOpen && (
          <button
            onClick={handleToggle}
            className="
              fixed left-3 top-20 z-40
              flex items-center gap-2
              px-3 py-2
              bg-zinc-800/95 backdrop-blur-sm
              border border-zinc-700
              rounded-xl shadow-lg
              text-zinc-300
              transition-all
              active:scale-95
              touch-manipulation
              sm:hidden
            "
            aria-label="Open slides panel"
          >
            <RectangleStackIcon className="w-5 h-5" />
            <span className="text-xs font-medium">{currentSlideIndex + 1}/{presentation.slides.length}</span>
          </button>
        )}

        {/* Mobile drawer */}
        <MobileSidebar
          isOpen={isOpen}
          onClose={() => {
            setInternalIsOpen(false);
            onToggle?.();
          }}
          position="left"
          title="Slides"
          width="w-56 sm:w-64"
          enableSwipeClose
        >
          {sidebarContent}
        </MobileSidebar>
      </>
    );
  }

  // Desktop inline mode with collapse toggle
  return (
    <div
      className={`
        relative flex flex-col bg-zinc-900 border-r border-zinc-700
        transition-all duration-300 ease-out
        ${isOpen ? 'w-44 md:w-52' : 'w-12'}
        ${className}
      `}
    >
      {/* Collapse toggle button */}
      <button
        onClick={handleToggle}
        className="
          absolute -right-3 top-1/2 -translate-y-1/2 z-10
          w-6 h-12 flex items-center justify-center
          bg-zinc-800 hover:bg-zinc-700
          border border-zinc-700
          rounded-lg shadow-md
          transition-all duration-200
        "
        aria-label={isOpen ? 'Collapse slides panel' : 'Expand slides panel'}
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Collapsed state */}
      {!isOpen && (
        <div className="flex flex-col items-center py-3 gap-2">
          <RectangleStackIcon className="w-5 h-5 text-zinc-500" />
          <span className="text-[10px] text-zinc-500 font-medium">
            {presentation.slides.length}
          </span>
        </div>
      )}

      {/* Expanded content */}
      {isOpen && sidebarContent}
    </div>
  );
};

// ============================================================================
// THUMBNAIL ITEM COMPONENT
// ============================================================================

interface ThumbnailItemProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  canDelete: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isMobile?: boolean;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({
  slide,
  index,
  isActive,
  isDragging,
  isDragOver,
  canDelete,
  onClick,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isMobile = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle touch for mobile - long press to show actions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(Date.now());
    longPressTimerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    // Hide actions after a delay on mobile
    if (isMobile && showActions) {
      setTimeout(() => setShowActions(false), 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      draggable={!isMobile}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => !isMobile && setShowActions(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden
        transition-all duration-200
        touch-manipulation
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isDragOver ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-zinc-900' : ''}
        ${isActive
          ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20'
          : 'ring-1 ring-zinc-700 hover:ring-zinc-500 active:ring-zinc-400'
        }
      `}
      onClick={onClick}
    >
      {/* Slide Number Badge */}
      <div className={`
        absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded text-[10px] font-medium
        ${isActive ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400'}
      `}>
        {index + 1}
      </div>

      {/* Drag Handle (desktop only) */}
      {!isMobile && (
        <div
          className={`
            absolute top-1 right-1 z-10 p-0.5 rounded cursor-grab
            ${showActions ? 'opacity-100' : 'opacity-0'}
            hover:bg-zinc-700 transition-opacity
          `}
        >
          <Bars3Icon className="w-3 h-3 text-zinc-400" />
        </div>
      )}

      {/* Thumbnail Preview */}
      <div className="aspect-video bg-zinc-800 relative">
        {slide.thumbnail ? (
          <img
            src={slide.thumbnail}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="text-[8px] text-zinc-500 text-center line-clamp-3">
              {slide.title || 'Untitled Slide'}
            </span>
          </div>
        )}

        {/* Hover/Touch Actions */}
        {showActions && (
          <div className={`
            absolute bottom-1 right-1 flex gap-1
            ${isMobile ? 'gap-2' : ''}
          `}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className={`
                bg-zinc-800/90 hover:bg-zinc-700 rounded transition-colors
                ${isMobile ? 'p-2' : 'p-1'}
              `}
              title="Duplicate"
            >
              <DocumentDuplicateIcon className={`text-zinc-300 ${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`
                  bg-red-900/80 hover:bg-red-800 rounded transition-colors
                  ${isMobile ? 'p-2' : 'p-1'}
                `}
                title="Delete"
              >
                <TrashIcon className={`text-red-300 ${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className={`
        px-2 py-1.5 text-[10px] truncate
        ${isActive ? 'bg-cyan-500/10 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}
      `}>
        {slide.title || 'Untitled'}
      </div>
    </div>
  );
};

export default ThumbnailSidebar;

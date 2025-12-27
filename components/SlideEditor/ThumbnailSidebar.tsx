/**
 * ThumbnailSidebar Component
 * Displays slide thumbnails with drag-to-reorder functionality
 */

import React, { useState, useRef } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';
import type { Slide } from '../../types/slides';

interface ThumbnailSidebarProps {
  className?: string;
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({ className = '' }) => {
  const {
    presentation,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
  } = useSlideStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  return (
    <div className={`flex flex-col bg-zinc-900 border-r border-zinc-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Slides ({presentation.slides.length})
        </span>
        <button
          onClick={() => addSlide(currentSlideIndex)}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
          title="Add slide"
        >
          <PlusIcon className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {presentation.slides.map((slide, index) => (
          <ThumbnailItem
            key={slide.id}
            slide={slide}
            index={index}
            isActive={index === currentSlideIndex}
            isDragging={index === draggedIndex}
            isDragOver={index === dragOverIndex}
            onClick={() => setCurrentSlide(index)}
            onDuplicate={() => duplicateSlide(index)}
            onDelete={() => deleteSlide(index)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            canDelete={presentation.slides.length > 1}
          />
        ))}
      </div>

      {/* Add Slide Button */}
      <div className="p-2 border-t border-zinc-700">
        <button
          onClick={() => addSlide()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
                     bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors
                     text-sm text-zinc-300"
        >
          <PlusIcon className="w-4 h-4" />
          Add Slide
        </button>
      </div>
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
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isDragOver ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-zinc-900' : ''}
        ${isActive
          ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20'
          : 'ring-1 ring-zinc-700 hover:ring-zinc-500'
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

      {/* Drag Handle */}
      <div
        className={`
          absolute top-1 right-1 z-10 p-0.5 rounded cursor-grab
          ${showActions ? 'opacity-100' : 'opacity-0'}
          hover:bg-zinc-700 transition-opacity
        `}
      >
        <Bars3Icon className="w-3 h-3 text-zinc-400" />
      </div>

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

        {/* Hover Actions */}
        {showActions && (
          <div className="absolute bottom-1 right-1 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 bg-zinc-800/90 hover:bg-zinc-700 rounded transition-colors"
              title="Duplicate"
            >
              <DocumentDuplicateIcon className="w-3 h-3 text-zinc-300" />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 bg-red-900/80 hover:bg-red-800 rounded transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-3 h-3 text-red-300" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className={`
        px-2 py-1 text-[10px] truncate
        ${isActive ? 'bg-cyan-500/10 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}
      `}>
        {slide.title || 'Untitled'}
      </div>
    </div>
  );
};

export default ThumbnailSidebar;

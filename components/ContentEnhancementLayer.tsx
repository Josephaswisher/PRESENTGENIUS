/**
 * Content Enhancement Layer Component
 *
 * Overlays clinical pearls, warnings, and evidence on slides as draggable floating cards.
 * Features:
 * - Three enhancement types: Clinical Pearls, Warnings, Evidence
 * - Toggle layers on/off with buttons
 * - Draggable to reposition
 * - Auto-positioned based on content
 * - Persists positions per slide via localStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export type EnhancementType = 'pearl' | 'warning' | 'evidence';

export interface ContentEnhancement {
  id: string;
  type: EnhancementType;
  title: string;
  content: string;
  citation?: string;
  position: { x: number; y: number }; // Percentage-based positioning
  isVisible: boolean;
}

interface Props {
  slideId: string;
  enhancements: ContentEnhancement[];
  onUpdatePosition: (enhancementId: string, x: number, y: number) => void;
  onToggleVisibility: (enhancementId: string) => void;
  onClose: (enhancementId: string) => void;
  className?: string;
}

// Enhancement type configurations
const ENHANCEMENT_CONFIG: Record<EnhancementType, {
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  pearl: {
    icon: SparklesIcon,
    emoji: '💎',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    label: 'Clinical Pearl',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    emoji: '⚠️',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Warning',
  },
  evidence: {
    icon: ChartBarIcon,
    emoji: '📊',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Evidence',
  },
};

export const ContentEnhancementLayer: React.FC<Props> = ({
  slideId,
  enhancements,
  onUpdatePosition,
  onToggleVisibility,
  onClose,
  className = '',
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent, enhancement: ContentEnhancement) => {
    if (!containerRef.current) return;

    // Don't start drag if clicking on close button
    if ((e.target as HTMLElement).closest('[data-close-button]')) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const cardX = (enhancement.position.x / 100) * rect.width;
    const cardY = (enhancement.position.y / 100) * rect.height;

    setDraggedId(enhancement.id);
    setDragOffset({
      x: e.clientX - cardX,
      y: e.clientY - cardY,
    });
  };

  // Handle mouse move during drag
  useEffect(() => {
    if (!draggedId || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
      const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

      // Constrain to container bounds
      const boundedX = Math.max(0, Math.min(100, x));
      const boundedY = Math.max(0, Math.min(100, y));

      onUpdatePosition(draggedId, boundedX, boundedY);
    };

    const handleMouseUp = () => {
      setDraggedId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedId, dragOffset, onUpdatePosition]);

  const visibleEnhancements = enhancements.filter(e => e.isVisible);

  if (visibleEnhancements.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 100 }}
    >
      {visibleEnhancements.map((enhancement) => {
        const config = ENHANCEMENT_CONFIG[enhancement.type];
        const Icon = config.icon;
        const isDragging = draggedId === enhancement.id;

        return (
          <div
            key={enhancement.id}
            className={`
              absolute pointer-events-auto transition-all duration-200
              ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl z-50' : 'cursor-grab hover:scale-102 hover:shadow-xl'}
            `}
            style={{
              left: `${enhancement.position.x}%`,
              top: `${enhancement.position.y}%`,
              maxWidth: '320px',
              minWidth: '240px',
            }}
            onMouseDown={(e) => handleMouseDown(e, enhancement)}
          >
            <div
              className={`
                ${config.bgColor} ${config.borderColor} backdrop-blur-sm
                border-2 rounded-xl shadow-lg overflow-hidden
                transform-gpu transition-all duration-200
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.emoji}</span>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-bold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
                <button
                  data-close-button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(enhancement.id);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-4 h-4 text-white/70 hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                {enhancement.title && (
                  <h4 className="font-semibold text-white text-sm leading-tight">
                    {enhancement.title}
                  </h4>
                )}
                <p className="text-white/90 text-sm leading-relaxed">
                  {enhancement.content}
                </p>
                {enhancement.citation && (
                  <p className="text-white/60 text-xs italic mt-2 pt-2 border-t border-white/10">
                    {enhancement.citation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Enhancement Layer Toggle Controls
 * Shows buttons to toggle each enhancement type on/off
 */
interface ToggleControlsProps {
  enhancements: ContentEnhancement[];
  onToggleType: (type: EnhancementType) => void;
  className?: string;
}

export const EnhancementToggleControls: React.FC<ToggleControlsProps> = ({
  enhancements,
  onToggleType,
  className = '',
}) => {
  // Count visible enhancements by type
  const counts = enhancements.reduce((acc, e) => {
    if (!acc[e.type]) acc[e.type] = { visible: 0, total: 0 };
    acc[e.type].total++;
    if (e.isVisible) acc[e.type].visible++;
    return acc;
  }, {} as Record<EnhancementType, { visible: number; total: number }>);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {(['pearl', 'warning', 'evidence'] as EnhancementType[]).map((type) => {
        const config = ENHANCEMENT_CONFIG[type];
        const count = counts[type] || { visible: 0, total: 0 };
        const isActive = count.visible > 0;

        if (count.total === 0) return null;

        return (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              flex items-center gap-1.5 border-2
              ${isActive
                ? `${config.bgColor} ${config.borderColor} ${config.color}`
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }
            `}
            title={`${isActive ? 'Hide' : 'Show'} ${config.label}s`}
          >
            <span>{config.emoji}</span>
            <span>{count.visible}/{count.total}</span>
            {isActive ? (
              <EyeIcon className="w-3.5 h-3.5" />
            ) : (
              <EyeSlashIcon className="w-3.5 h-3.5" />
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Hook to manage enhancement layer state with localStorage persistence
 */
export const useEnhancementLayer = (slideId: string, initialEnhancements: ContentEnhancement[]) => {
  const [enhancements, setEnhancements] = useState<ContentEnhancement[]>(initialEnhancements);

  // Load positions from localStorage on mount
  useEffect(() => {
    const key = `enhancement-positions-${slideId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const positions = JSON.parse(saved) as Record<string, { x: number; y: number; isVisible: boolean }>;
        setEnhancements(prev => prev.map(e => ({
          ...e,
          position: positions[e.id]?.position || e.position,
          isVisible: positions[e.id]?.isVisible ?? e.isVisible,
        })));
      } catch (e) {
        console.error('Failed to load enhancement positions:', e);
      }
    }
  }, [slideId]);

  // Save positions to localStorage when they change
  const saveToStorage = (updatedEnhancements: ContentEnhancement[]) => {
    const key = `enhancement-positions-${slideId}`;
    const positions = updatedEnhancements.reduce((acc, e) => {
      acc[e.id] = { position: e.position, isVisible: e.isVisible };
      return acc;
    }, {} as Record<string, { position: { x: number; y: number }; isVisible: boolean }>);
    localStorage.setItem(key, JSON.stringify(positions));
  };

  const updatePosition = (enhancementId: string, x: number, y: number) => {
    setEnhancements(prev => {
      const updated = prev.map(e =>
        e.id === enhancementId ? { ...e, position: { x, y } } : e
      );
      saveToStorage(updated);
      return updated;
    });
  };

  const toggleVisibility = (enhancementId: string) => {
    setEnhancements(prev => {
      const updated = prev.map(e =>
        e.id === enhancementId ? { ...e, isVisible: !e.isVisible } : e
      );
      saveToStorage(updated);
      return updated;
    });
  };

  const toggleType = (type: EnhancementType) => {
    setEnhancements(prev => {
      const typeEnhancements = prev.filter(e => e.type === type);
      const anyVisible = typeEnhancements.some(e => e.isVisible);
      const updated = prev.map(e =>
        e.type === type ? { ...e, isVisible: !anyVisible } : e
      );
      saveToStorage(updated);
      return updated;
    });
  };

  const closeEnhancement = (enhancementId: string) => {
    setEnhancements(prev => {
      const updated = prev.map(e =>
        e.id === enhancementId ? { ...e, isVisible: false } : e
      );
      saveToStorage(updated);
      return updated;
    });
  };

  return {
    enhancements,
    updatePosition,
    toggleVisibility,
    toggleType,
    closeEnhancement,
  };
};

export default ContentEnhancementLayer;

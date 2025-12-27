/**
 * SlideCanvas Component
 * Main editing area for the current slide
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSlideStore } from '../../stores/slide.store';
import type { Slide, SlideElement } from '../../types/slides';

interface SlideCanvasProps {
  className?: string;
  onElementSelect?: (elementId: string | null) => void;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  className = '',
  onElementSelect,
}) => {
  const {
    presentation,
    currentSlideIndex,
    selectedElementId,
    selectElement,
    updateElement,
    zoom,
    showGrid,
  } = useSlideStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const currentSlide = presentation?.slides[currentSlideIndex];

  if (!presentation || !currentSlide) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
        <div className="text-zinc-500">No slide selected</div>
      </div>
    );
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
      setEditingElementId(null);
      onElementSelect?.(null);
    }
  };

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    selectElement(elementId);
    onElementSelect?.(elementId);
  };

  const handleElementDoubleClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setEditingElementId(elementId);
  };

  const handleElementDragStart = (e: React.MouseEvent, elementId: string) => {
    if (editingElementId === elementId) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    selectElement(elementId);
  };

  const handleElementDrag = (e: React.MouseEvent, element: SlideElement) => {
    if (!isDragging || !canvasRef.current) return;

    const canvas = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / canvas.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / canvas.height) * 100;

    updateElement(element.id, {
      position: {
        ...element.position,
        x: Math.max(0, Math.min(100 - element.position.width, element.position.x + deltaX)),
        y: Math.max(0, Math.min(100 - element.position.height, element.position.y + deltaY)),
      },
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleContentChange = (elementId: string, content: string) => {
    updateElement(elementId, { content });
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-zinc-900 p-8 overflow-auto ${className}`}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Slide Container */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="relative bg-zinc-800 shadow-2xl"
        style={{
          width: `${(16 / 9) * 400 * (zoom / 100)}px`,
          height: `${400 * (zoom / 100)}px`,
          background: getBackgroundStyle(currentSlide),
        }}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '10% 10%',
            }}
          />
        )}

        {/* Slide Elements */}
        {currentSlide.elements.map((element) => (
          <ElementRenderer
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id}
            isEditing={editingElementId === element.id}
            onClick={(e) => handleElementClick(e, element.id)}
            onDoubleClick={(e) => handleElementDoubleClick(e, element.id)}
            onMouseDown={(e) => handleElementDragStart(e, element.id)}
            onMouseMove={(e) => handleElementDrag(e, element)}
            onContentChange={(content) => handleContentChange(element.id, content)}
            onBlur={() => setEditingElementId(null)}
            theme={presentation.theme}
          />
        ))}

        {/* Slide Number */}
        <div className="absolute bottom-2 right-3 text-xs text-zinc-500">
          {currentSlideIndex + 1} / {presentation.slides.length}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ELEMENT RENDERER COMPONENT
// ============================================================================

interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  isEditing: boolean;
  theme: any;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onContentChange: (content: string) => void;
  onBlur: () => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  isEditing,
  theme,
  onClick,
  onDoubleClick,
  onMouseDown,
  onMouseMove,
  onContentChange,
  onBlur,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    width: `${element.position.width}%`,
    height: `${element.position.height}%`,
    fontSize: element.style?.fontSize || '1rem',
    fontWeight: element.style?.fontWeight || 'normal',
    fontFamily: element.style?.fontFamily || theme.typography.bodyFont,
    color: element.style?.color || theme.colors.text,
    backgroundColor: element.style?.backgroundColor || 'transparent',
    textAlign: element.style?.textAlign || 'left',
    padding: element.style?.padding || '0.5rem',
    borderRadius: element.style?.borderRadius || '0',
    opacity: element.style?.opacity ?? 1,
    cursor: isEditing ? 'text' : 'move',
    userSelect: isEditing ? 'text' : 'none',
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={element.content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={onBlur}
          className="w-full h-full bg-transparent resize-none outline-none"
          style={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
            textAlign: element.style?.textAlign as any,
          }}
        />
      );
    }

    switch (element.type) {
      case 'heading':
        return <h1 className="m-0">{element.content}</h1>;
      case 'subheading':
        return <h2 className="m-0">{element.content}</h2>;
      case 'paragraph':
        return <p className="m-0 whitespace-pre-wrap">{element.content}</p>;
      case 'bullet-list':
        return (
          <ul className="m-0 pl-5 space-y-1">
            {element.content.split('\n').map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      case 'numbered-list':
        return (
          <ol className="m-0 pl-5 space-y-1">
            {element.content.split('\n').map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      case 'image':
        return (
          <img
            src={element.content}
            alt=""
            className="w-full h-full object-cover rounded"
          />
        );
      case 'quote':
        return (
          <blockquote className="m-0 italic border-l-4 border-cyan-500 pl-4">
            {element.content}
          </blockquote>
        );
      case 'divider':
        return <hr className="border-t border-current" />;
      case 'code-block':
        return (
          <pre className="m-0 p-3 bg-zinc-900 rounded font-mono text-sm overflow-x-auto">
            <code>{element.content}</code>
          </pre>
        );
      default:
        return <div>{element.content}</div>;
    }
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      className={`
        transition-shadow
        ${isSelected ? 'ring-2 ring-cyan-500 ring-offset-1 ring-offset-transparent shadow-lg' : ''}
        ${isSelected && !isEditing ? 'cursor-move' : ''}
      `}
    >
      {renderContent()}

      {/* Resize Handles (when selected) */}
      {isSelected && !isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getBackgroundStyle(slide: Slide): string {
  if (!slide.background) {
    return '#1e293b';
  }

  switch (slide.background.type) {
    case 'solid':
      return slide.background.value;
    case 'gradient':
      return slide.background.value;
    case 'image':
      return `url(${slide.background.value}) center/cover`;
    case 'pattern':
      return slide.background.value;
    default:
      return '#1e293b';
  }
}

export default SlideCanvas;

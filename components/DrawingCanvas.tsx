/**
 * DrawingCanvas Component
 * Full HTML5 Canvas drawing implementation with mouse and touch support
 *
 * Features:
 * - Pen and eraser tools
 * - Color and width selection
 * - Auto-resize to match container
 * - localStorage persistence
 * - Export/import strokes as JSON
 * - Smooth drawing with requestAnimationFrame
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface DrawingCanvasProps {
  presentationId: string;
  slideIndex: number;
  tool?: 'pen' | 'eraser';
  color?: string;
  width?: number;
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  className?: string;
}

// Storage key generator
const getStorageKey = (presentationId: string, slideIndex: number) =>
  `presentation-${presentationId}-slide-${slideIndex}-drawing`;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  presentationId,
  slideIndex,
  tool = 'pen',
  color = '#000000',
  width = 3,
  onStrokesChange,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const rafRef = useRef<number | null>(null);

  // Load strokes from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(presentationId, slideIndex);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const loadedStrokes = JSON.parse(saved) as DrawingStroke[];
        setStrokes(loadedStrokes);
      } else {
        setStrokes([]);
      }
    } catch (error) {
      console.error('Failed to load drawing from localStorage:', error);
      setStrokes([]);
    }
  }, [presentationId, slideIndex]);

  // Save strokes to localStorage
  const saveStrokes = useCallback((newStrokes: DrawingStroke[]) => {
    const storageKey = getStorageKey(presentationId, slideIndex);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newStrokes));
      onStrokesChange?.(newStrokes);
    } catch (error) {
      console.error('Failed to save drawing to localStorage:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old drawings...');
        // Could implement cleanup strategy here
      }
    }
  }, [presentationId, slideIndex, onStrokesChange]);

  // Auto-resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Set actual size (scaled for retina displays)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale context to match
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        // Redraw all strokes after resize
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    // Draw current stroke if drawing
    if (currentStroke && currentStroke.points.length > 0) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke]);

  // Draw a single stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Use quadratic curves for smoother lines
    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    // Draw the last point
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.restore();
  };

  // Redraw when strokes or currentStroke change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get canvas coordinates from event
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Start drawing
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool,
      color,
      width,
      points: [point],
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
  };

  // Continue drawing
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    // Use RAF for smooth drawing
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setCurrentStroke(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          points: [...prev.points, point],
        };
      });
    });
  };

  // Stop drawing
  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Save the completed stroke
    const newStrokes = [...strokes, currentStroke];
    setStrokes(newStrokes);
    saveStrokes(newStrokes);
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  // Export strokes
  const exportStrokes = useCallback((): string => {
    return JSON.stringify(strokes);
  }, [strokes]);

  // Import strokes
  const importStrokes = useCallback((data: string) => {
    try {
      const imported = JSON.parse(data) as DrawingStroke[];
      setStrokes(imported);
      saveStrokes(imported);
    } catch (error) {
      console.error('Failed to import strokes:', error);
    }
  }, [saveStrokes]);

  // Clear all strokes
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    saveStrokes([]);
    setCurrentStroke(null);
  }, [saveStrokes]);

  // Expose methods via ref (if needed by parent)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Attach utility methods to canvas element for parent access
      (canvas as any).exportStrokes = exportStrokes;
      (canvas as any).importStrokes = importStrokes;
      (canvas as any).clearCanvas = clearCanvas;
    }
  }, [exportStrokes, importStrokes, clearCanvas]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      />
    </div>
  );
};

export default DrawingCanvas;

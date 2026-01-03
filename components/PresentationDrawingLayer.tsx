/**
 * Presentation Drawing Layer
 * Wraps DrawingCanvas with per-slide annotation persistence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DrawingCanvas, type DrawingStroke } from './DrawingCanvas';
import {
  loadSlideAnnotations,
  saveSlideAnnotations,
  clearSlideAnnotations,
} from '../services/annotations';

export interface PresentationDrawingLayerProps {
  presentationId: string;
  currentSlide: number;
  isVisible: boolean;
  tool?: 'pen' | 'eraser';
  color?: string;
  width?: number;
  onClearRequest?: () => void;
}

export const PresentationDrawingLayer: React.FC<PresentationDrawingLayerProps> = ({
  presentationId,
  currentSlide,
  isVisible,
  tool = 'pen',
  color = '#ff0000',
  width = 3,
}) => {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load annotations when slide changes
  useEffect(() => {
    let isMounted = true;

    const loadAnnotations = async () => {
      setIsLoading(true);
      try {
        const loadedStrokes = await loadSlideAnnotations(presentationId, currentSlide);
        if (isMounted) {
          setStrokes(loadedStrokes);
        }
      } catch (error) {
        console.error('[PresentationDrawingLayer] Failed to load annotations:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnnotations();

    return () => {
      isMounted = false;
    };
  }, [presentationId, currentSlide]);

  // Handle annotation changes - save to storage
  const handleStrokesChange = useCallback(
    async (newStrokes: DrawingStroke[]) => {
      setStrokes(newStrokes);
      try {
        await saveSlideAnnotations(presentationId, currentSlide, newStrokes);
      } catch (error) {
        console.error('[PresentationDrawingLayer] Failed to save annotations:', error);
      }
    },
    [presentationId, currentSlide]
  );

  // Clear annotations for current slide
  const handleClear = useCallback(async () => {
    try {
      await clearSlideAnnotations(presentationId, currentSlide);
      setStrokes([]);
    } catch (error) {
      console.error('[PresentationDrawingLayer] Failed to clear annotations:', error);
    }
  }, [presentationId, currentSlide]);

  // Expose clear method globally for parent access
  React.useEffect(() => {
    if (isVisible) {
      (window as any).__presentationClearDrawing = handleClear;
    }
    return () => {
      if ((window as any).__presentationClearDrawing === handleClear) {
        delete (window as any).__presentationClearDrawing;
      }
    };
  }, [isVisible, handleClear]);

  if (!isVisible || isLoading) {
    return null;
  }

  return (
    <DrawingCanvas
      presentationId={presentationId}
      slideIndex={currentSlide}
      tool={tool}
      color={color}
      width={width}
      onStrokesChange={handleStrokesChange}
      className="z-20"
    />
  );
};

export default PresentationDrawingLayer;

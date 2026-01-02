/**
 * useSwipeGesture Hook
 *
 * Touch gesture utilities for mobile sidebar interactions:
 * - Detects swipe gestures (left, right, up, down)
 * - Provides drag-to-open/close functionality
 * - Handles velocity-based swipe detection
 * - Supports edge swipes for drawer activation
 */

import { useRef, useCallback, useEffect, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (state: SwipeState) => void;
  onSwipeMove?: (state: SwipeState) => void;
  onSwipeEnd?: (state: SwipeState) => void;
}

interface SwipeConfig {
  threshold?: number;           // Min distance to trigger swipe (px)
  velocityThreshold?: number;   // Min velocity to trigger swipe (px/ms)
  edgeSwipeWidth?: number;      // Edge detection zone width (px)
  enableEdgeSwipe?: boolean;    // Enable edge swipe detection
  preventScroll?: boolean;      // Prevent default scroll during swipe
  direction?: 'horizontal' | 'vertical' | 'both';
}

const DEFAULT_CONFIG: SwipeConfig = {
  threshold: 50,
  velocityThreshold: 0.3,
  edgeSwipeWidth: 20,
  enableEdgeSwipe: false,
  preventScroll: false,
  direction: 'both',
};

/**
 * Hook for detecting swipe gestures
 */
export function useSwipeGesture(
  handlers: SwipeHandlers = {},
  config: SwipeConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    threshold,
    velocityThreshold,
    edgeSwipeWidth,
    enableEdgeSwipe,
    preventScroll,
    direction,
  } = mergedConfig;

  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
  });

  const [swipeState, setSwipeState] = useState<SwipeState>(stateRef.current);

  const detectDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (direction === 'horizontal' && absY > absX) return null;
    if (direction === 'vertical' && absX > absY) return null;

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, [direction]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const isEdgeSwipe = enableEdgeSwipe && (
      touch.clientX < edgeSwipeWidth! ||
      touch.clientX > window.innerWidth - edgeSwipeWidth!
    );

    if (enableEdgeSwipe && !isEdgeSwipe) return;

    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    };

    setSwipeState({ ...stateRef.current });
    handlers.onSwipeStart?.(stateRef.current);
  }, [enableEdgeSwipe, edgeSwipeWidth, handlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!stateRef.current.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - stateRef.current.startX;
    const deltaY = touch.clientY - stateRef.current.startY;
    const elapsed = Date.now() - stateRef.current.startTime;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed;
    const detectedDirection = detectDirection(deltaX, deltaY);

    // Prevent scroll if configured and swiping horizontally
    if (preventScroll && direction !== 'vertical' && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }

    stateRef.current = {
      ...stateRef.current,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      velocity,
      direction: detectedDirection,
    };

    setSwipeState({ ...stateRef.current });
    handlers.onSwipeMove?.(stateRef.current);
  }, [detectDirection, preventScroll, direction, handlers]);

  const handleTouchEnd = useCallback(() => {
    if (!stateRef.current.isSwiping) return;

    const { deltaX, deltaY, velocity, direction: swipeDir } = stateRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if swipe meets threshold requirements
    const meetsDistanceThreshold = absX > threshold! || absY > threshold!;
    const meetsVelocityThreshold = velocity > velocityThreshold!;
    const isValidSwipe = meetsDistanceThreshold || meetsVelocityThreshold;

    if (isValidSwipe && swipeDir) {
      switch (swipeDir) {
        case 'left':
          handlers.onSwipeLeft?.();
          break;
        case 'right':
          handlers.onSwipeRight?.();
          break;
        case 'up':
          handlers.onSwipeUp?.();
          break;
        case 'down':
          handlers.onSwipeDown?.();
          break;
      }
    }

    handlers.onSwipeEnd?.(stateRef.current);

    stateRef.current = {
      ...stateRef.current,
      isSwiping: false,
      direction: null,
    };
    setSwipeState({ ...stateRef.current });
  }, [threshold, velocityThreshold, handlers]);

  // Bind event handlers
  const bind = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  return {
    bind,
    state: swipeState,
    isSwiping: swipeState.isSwiping,
    direction: swipeState.direction,
    deltaX: swipeState.deltaX,
    deltaY: swipeState.deltaY,
  };
}

/**
 * Hook for drag-to-dismiss sidebar functionality
 */
export function useDragToDismiss(
  onDismiss: () => void,
  config: {
    direction: 'left' | 'right' | 'down';
    threshold?: number;
    enabled?: boolean;
  }
) {
  const { direction, threshold = 100, enabled = true } = config;
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { bind, state } = useSwipeGesture({
    onSwipeMove: (s) => {
      if (!enabled) return;

      let offset = 0;
      if (direction === 'left' && s.deltaX < 0) {
        offset = s.deltaX;
      } else if (direction === 'right' && s.deltaX > 0) {
        offset = s.deltaX;
      } else if (direction === 'down' && s.deltaY > 0) {
        offset = s.deltaY;
      }

      setDragOffset(offset);
      setIsDragging(true);
    },
    onSwipeEnd: (s) => {
      if (!enabled) return;

      const shouldDismiss =
        (direction === 'left' && s.deltaX < -threshold) ||
        (direction === 'right' && s.deltaX > threshold) ||
        (direction === 'down' && s.deltaY > threshold);

      if (shouldDismiss) {
        onDismiss();
      }

      setDragOffset(0);
      setIsDragging(false);
    },
  }, {
    direction: direction === 'down' ? 'vertical' : 'horizontal',
    preventScroll: true,
  });

  // Calculate transform based on drag
  const getTransform = useCallback(() => {
    if (!isDragging || dragOffset === 0) return undefined;

    if (direction === 'left' || direction === 'right') {
      return `translateX(${dragOffset}px)`;
    } else {
      return `translateY(${dragOffset}px)`;
    }
  }, [direction, dragOffset, isDragging]);

  return {
    bind,
    dragOffset,
    isDragging,
    transform: getTransform(),
    style: isDragging
      ? { transform: getTransform(), transition: 'none' }
      : { transition: 'transform 0.3s ease-out' },
  };
}

/**
 * Hook for edge swipe to open sidebar
 */
export function useEdgeSwipe(
  onOpen: () => void,
  edge: 'left' | 'right' = 'left',
  edgeWidth = 20
) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const isLeftEdge = edge === 'left' && touch.clientX < edgeWidth;
      const isRightEdge = edge === 'right' && touch.clientX > window.innerWidth - edgeWidth;

      if (isLeftEdge || isRightEdge) {
        elementRef.current = document.body;

        const handleTouchEnd = (endEvent: TouchEvent) => {
          const endTouch = endEvent.changedTouches[0];
          const deltaX = endTouch.clientX - touch.clientX;

          if (
            (edge === 'left' && deltaX > 50) ||
            (edge === 'right' && deltaX < -50)
          ) {
            onOpen();
          }

          document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchend', handleTouchEnd);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [onOpen, edge, edgeWidth]);
}

export default useSwipeGesture;

/**
 * useMediaQuery Hook
 *
 * Provides responsive detection for mobile-first design:
 * - Tracks viewport size changes in real-time
 * - Returns boolean for each breakpoint
 * - Optimized with debouncing for performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Tailwind default breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

interface MediaQueryState {
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // >= 640px && < 1024px
  isDesktop: boolean;     // >= 1024px
  isSmUp: boolean;        // >= 640px
  isMdUp: boolean;        // >= 768px
  isLgUp: boolean;        // >= 1024px
  isXlUp: boolean;        // >= 1280px
  is2xlUp: boolean;       // >= 1536px
  width: number;
  height: number;
}

/**
 * Hook to detect current viewport breakpoint
 */
export function useMediaQuery(): MediaQueryState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const handleResize = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Set initial dimensions
    handleResize();

    // Debounced resize handler for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return useMemo(() => ({
    isMobile: dimensions.width < BREAKPOINTS.sm,
    isTablet: dimensions.width >= BREAKPOINTS.sm && dimensions.width < BREAKPOINTS.lg,
    isDesktop: dimensions.width >= BREAKPOINTS.lg,
    isSmUp: dimensions.width >= BREAKPOINTS.sm,
    isMdUp: dimensions.width >= BREAKPOINTS.md,
    isLgUp: dimensions.width >= BREAKPOINTS.lg,
    isXlUp: dimensions.width >= BREAKPOINTS.xl,
    is2xlUp: dimensions.width >= BREAKPOINTS['2xl'],
    width: dimensions.width,
    height: dimensions.height,
  }), [dimensions]);
}

/**
 * Hook to check a specific media query
 */
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    return undefined;
  }, [query]);

  return matches;
}

/**
 * Hook to detect touch device
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  return useMatchMedia('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect dark mode preference
 */
export function useDarkMode(): boolean {
  return useMatchMedia('(prefers-color-scheme: dark)');
}

export default useMediaQuery;

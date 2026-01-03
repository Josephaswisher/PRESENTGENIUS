/**
 * iOS Scroll Fix Utility
 * Provides modern scrolling styles with iOS version detection and fallbacks
 */

import { detectBrowser } from './browser-detection';

export interface ScrollConfig {
  enableMomentum?: boolean;
  enableSmoothScrolling?: boolean;
  direction?: 'vertical' | 'horizontal' | 'both';
}

export interface ScrollStyles {
  overflowY?: string;
  overflowX?: string;
  overflow?: string;
  WebkitOverflowScrolling?: string;
  scrollBehavior?: string;
  scrollbarWidth?: string;
  msOverflowStyle?: string;
}

/**
 * Returns CSS properties for cross-browser scrolling support
 * Automatically detects iOS version and uses appropriate APIs
 */
export function getScrollStyles(config: ScrollConfig = {}): ScrollStyles {
  const {
    enableMomentum = true,
    enableSmoothScrolling = true,
    direction = 'vertical',
  } = config;

  const browser = detectBrowser();
  const styles: ScrollStyles = {};

  // Set overflow properties based on direction
  if (direction === 'vertical') {
    styles.overflowY = 'auto';
    styles.overflowX = 'hidden';
  } else if (direction === 'horizontal') {
    styles.overflowX = 'auto';
    styles.overflowY = 'hidden';
  } else {
    styles.overflow = 'auto';
  }

  // iOS-specific scrolling
  if (browser.isIOS) {
    const iOSVersion = browser.iOSVersion
      ? parseFloat(browser.iOSVersion)
      : 13; // Default to modern iOS if version unknown

    if (iOSVersion >= 13) {
      // iOS 13+ uses modern scrolling by default
      // No need for -webkit-overflow-scrolling
      if (enableMomentum) {
        // Modern iOS handles momentum scrolling automatically
      }
    } else {
      // iOS 12 and below need the webkit property
      if (enableMomentum) {
        styles.WebkitOverflowScrolling = 'touch';
      }
    }
  }

  // Smooth scrolling for modern browsers
  if (enableSmoothScrolling && 'scrollBehavior' in document.documentElement.style) {
    styles.scrollBehavior = 'smooth';
  }

  // Hide scrollbars (optional, based on design requirements)
  // Uncomment if you want to hide scrollbars while maintaining functionality
  // styles.scrollbarWidth = 'none'; // Firefox
  // styles.msOverflowStyle = 'none'; // IE/Edge

  return styles;
}

/**
 * Returns true if the browser uses modern scrolling APIs
 */
export function usesModernScrolling(): boolean {
  const browser = detectBrowser();

  if (!browser.isIOS) {
    return true; // Non-iOS browsers use modern scrolling
  }

  const iOSVersion = browser.iOSVersion
    ? parseFloat(browser.iOSVersion)
    : 13;

  return iOSVersion >= 13;
}

/**
 * Applies scroll styles to an element
 */
export function applyScrollStyles(
  element: HTMLElement,
  config: ScrollConfig = {}
): void {
  const styles = getScrollStyles(config);

  Object.assign(element.style, styles);
}

/**
 * Creates a CSS class string with scroll styles for Tailwind
 */
export function getScrollClassNames(config: ScrollConfig = {}): string {
  const { direction = 'vertical' } = config;

  const classes: string[] = [];

  if (direction === 'vertical') {
    classes.push('overflow-y-auto', 'overflow-x-hidden');
  } else if (direction === 'horizontal') {
    classes.push('overflow-x-auto', 'overflow-y-hidden');
  } else {
    classes.push('overflow-auto');
  }

  // Add smooth scrolling class if supported
  if ('scrollBehavior' in document.documentElement.style) {
    classes.push('scroll-smooth');
  }

  return classes.join(' ');
}

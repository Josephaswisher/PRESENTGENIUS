/**
 * Browser Detection Utility
 * Detects browser type, version, and feature support for cross-browser compatibility
 */

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  version: string;
  isIOS: boolean;
  iOSVersion?: string;
  isMobile: boolean;
}

/**
 * Detects the current browser and returns detailed information
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // Detect iOS
  const isIOS = /iphone|ipad|ipod/.test(userAgent) ||
                (platform === 'macintel' && navigator.maxTouchPoints > 1);

  // Detect iOS version
  let iOSVersion: string | undefined;
  if (isIOS) {
    const match = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      iOSVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    }
  }

  // Detect mobile
  const isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);

  // Detect browser
  let name: BrowserInfo['name'] = 'unknown';
  let version = '';

  if (userAgent.includes('edg/')) {
    name = 'edge';
    const match = userAgent.match(/edg\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('chrome/') && !userAgent.includes('edg/')) {
    name = 'chrome';
    const match = userAgent.match(/chrome\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('firefox/')) {
    name = 'firefox';
    const match = userAgent.match(/firefox\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) {
    name = 'safari';
    const match = userAgent.match(/version\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('opr/') || userAgent.includes('opera/')) {
    name = 'opera';
    const match = userAgent.match(/(?:opr|opera)\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }

  return {
    name,
    version,
    isIOS,
    iOSVersion,
    isMobile,
  };
}

/**
 * Gets the current fullscreen element with vendor prefix support
 */
export function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Checks if the document is currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  return getFullscreenElement() !== null;
}

/**
 * Feature flags for browser capabilities
 */
export interface FeatureSupport {
  fullscreen: boolean;
  fullscreenEnabled: boolean;
  modernScrolling: boolean;
  cssSmoothScrolling: boolean;
  intersectionObserver: boolean;
}

/**
 * Checks browser feature support
 */
export function checkFeatureSupport(): FeatureSupport {
  const browser = detectBrowser();

  // Check fullscreen API support
  const fullscreen = !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );

  // Check if fullscreen is actually available (not blocked by iframe, etc.)
  const fullscreenEnabled = fullscreen && !document.fullscreenElement;

  // Modern scrolling (iOS 13+, modern browsers)
  const modernScrolling =
    !browser.isIOS ||
    (browser.iOSVersion ? parseFloat(browser.iOSVersion) >= 13 : true);

  // CSS smooth scrolling
  const cssSmoothScrolling = 'scrollBehavior' in document.documentElement.style;

  // Intersection Observer API
  const intersectionObserver = 'IntersectionObserver' in window;

  return {
    fullscreen,
    fullscreenEnabled,
    modernScrolling,
    cssSmoothScrolling,
    intersectionObserver,
  };
}

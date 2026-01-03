/**
 * Cross-Browser Fullscreen API Wrapper
 * Provides a unified interface for fullscreen operations with proper error handling
 */

import { getFullscreenElement } from './browser-detection';

export interface FullscreenResult {
  success: boolean;
  error?: Error;
  message?: string;
}

/**
 * Requests fullscreen mode for the specified element (or document element if not specified)
 */
export async function requestFullscreen(
  element?: HTMLElement
): Promise<FullscreenResult> {
  const targetElement = element || document.documentElement;

  try {
    // Check if fullscreen is supported
    if (!isFullscreenSupported()) {
      return {
        success: false,
        message: 'Fullscreen is not supported in your browser',
      };
    }

    // Check if already in fullscreen
    if (getFullscreenElement()) {
      return {
        success: true,
        message: 'Already in fullscreen mode',
      };
    }

    // Try different vendor-prefixed methods
    if (targetElement.requestFullscreen) {
      await targetElement.requestFullscreen();
    } else if ((targetElement as any).webkitRequestFullscreen) {
      await (targetElement as any).webkitRequestFullscreen();
    } else if ((targetElement as any).mozRequestFullScreen) {
      await (targetElement as any).mozRequestFullScreen();
    } else if ((targetElement as any).msRequestFullscreen) {
      await (targetElement as any).msRequestFullscreen();
    } else {
      return {
        success: false,
        message: 'Fullscreen method not found',
      };
    }

    return {
      success: true,
      message: 'Entered fullscreen mode',
    };
  } catch (error) {
    // Handle specific error cases
    const err = error as Error;
    let message = 'Could not enter fullscreen mode';

    if (err.name === 'NotAllowedError') {
      message = 'Fullscreen blocked. Please allow fullscreen in your browser settings.';
    } else if (err.name === 'TypeError') {
      message = 'Fullscreen is not available for this element';
    } else if (err.message?.includes('permissions policy')) {
      message = 'Fullscreen blocked by permissions policy';
    }

    return {
      success: false,
      error: err,
      message,
    };
  }
}

/**
 * Exits fullscreen mode
 */
export async function exitFullscreen(): Promise<FullscreenResult> {
  try {
    // Check if actually in fullscreen
    if (!getFullscreenElement()) {
      return {
        success: true,
        message: 'Not in fullscreen mode',
      };
    }

    // Try different vendor-prefixed methods
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    } else {
      return {
        success: false,
        message: 'Exit fullscreen method not found',
      };
    }

    return {
      success: true,
      message: 'Exited fullscreen mode',
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err,
      message: 'Could not exit fullscreen mode',
    };
  }
}

/**
 * Toggles fullscreen mode
 */
export async function toggleFullscreen(
  element?: HTMLElement
): Promise<FullscreenResult> {
  if (getFullscreenElement()) {
    return exitFullscreen();
  } else {
    return requestFullscreen(element);
  }
}

/**
 * Registers a callback for fullscreen change events
 * Returns a cleanup function to remove the listener
 */
export function onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
  const handler = () => {
    callback(!!getFullscreenElement());
  };

  // Add listeners for all vendor-prefixed events
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  // Return cleanup function
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}

/**
 * Checks if fullscreen is supported by the browser
 */
function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
}

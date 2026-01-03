/**
 * useNetworkStatus Hook
 *
 * Detects network connectivity for mobile-friendly error handling:
 * - Tracks online/offline status in real-time
 * - Monitors connection type (wifi, cellular, etc.)
 * - Provides helpers for error messages
 */

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string | null;
  effectiveType: string | null; // 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number | null; // Mbps
  rtt: number | null; // Round-trip time in ms
  saveData: boolean;
}

interface NetworkInfo {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  }
}

/**
 * Hook for monitoring network status
 */
export function useNetworkStatus(): NetworkStatus & {
  checkConnection: () => Promise<boolean>;
  getErrorMessage: (error: Error) => string;
} {
  const [status, setStatus] = useState<NetworkStatus>(() => getNetworkStatus());

  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    const handleConnectionChange = () => {
      setStatus(getNetworkStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener?.('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener?.('change', handleConnectionChange);
      }
    };
  }, []);

  // Actively check connection by pinging a reliable endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to fetch a tiny resource
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Get user-friendly error message based on error type
  const getErrorMessage = useCallback((error: Error): string => {
    if (!status.isOnline) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('failed to fetch') || message.includes('network')) {
      if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
        return 'Your connection is very slow. Please try again on a better network.';
      }
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('timeout') || message.includes('aborted')) {
      return 'Request timed out. Please try again.';
    }

    if (message.includes('cors') || message.includes('blocked')) {
      return 'This feature is not available in your current environment.';
    }

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication error. Please check your API configuration.';
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'Server error. The service may be temporarily unavailable.';
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  }, [status]);

  return {
    ...status,
    checkConnection,
    getErrorMessage,
  };
}

/**
 * Get current network status
 */
function getNetworkStatus(): NetworkStatus {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    isOnline: navigator.onLine,
    connectionType: connection?.type || null,
    effectiveType: connection?.effectiveType || null,
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
    saveData: connection?.saveData || false,
  };
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    !navigator.onLine ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('aborted') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    error instanceof TypeError // Usually indicates CORS/network issue
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    isNetworkError(error) ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('overloaded')
  );
}

/**
 * Wrapper for fetch with timeout and better error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Log API configuration status (for debugging)
 */
export function logApiStatus(): void {
  if (typeof window === 'undefined') return;

  console.group('🔧 PRESENTGENIUS API Status');
  console.log('Environment:', {
    hostname: window.location.hostname,
    isProduction: window.location.hostname !== 'localhost',
    isMobile: window.innerWidth < 640,
    userAgent: navigator.userAgent.slice(0, 50) + '...',
    online: navigator.onLine,
  });

  console.log('API Keys Configured:', {
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    deepseek: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
    minimax: !!import.meta.env.VITE_MINIMAX_API_KEY,
    glm: !!import.meta.env.VITE_GLM_API_KEY,
    supabase: !!import.meta.env.VITE_SUPABASE_URL,
    scraper: !!import.meta.env.VITE_SCRAPER_URL,
  });

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    console.log('Network:', {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink ? `${connection.downlink} Mbps` : 'unknown',
      rtt: connection.rtt ? `${connection.rtt}ms` : 'unknown',
    });
  }

  console.groupEnd();
}

export default useNetworkStatus;

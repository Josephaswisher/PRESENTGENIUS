/**
 * Hooks Index
 *
 * Central export for all custom React hooks
 */

export { useAuth } from './useAuth';
export { useAutoSave } from './useAutoSave';
export {
  useMediaQuery,
  useMatchMedia,
  useTouchDevice,
  useReducedMotion,
  useDarkMode,
  BREAKPOINTS,
} from './useMediaQuery';
export {
  useSidebar,
  useSidebarManager,
  useSidebarBackdrop,
  DEFAULT_CONFIGS,
} from './useSidebar';
export {
  useSwipeGesture,
  useDragToDismiss,
  useEdgeSwipe,
} from './useSwipeGesture';
export {
  useNetworkStatus,
  isNetworkError,
  isRetryableError,
  fetchWithTimeout,
  logApiStatus,
} from './useNetworkStatus';

export type { Breakpoint } from './useMediaQuery';
export type { SidebarId, SidebarPosition } from './useSidebar';
export type { SwipeDirection } from './useSwipeGesture';

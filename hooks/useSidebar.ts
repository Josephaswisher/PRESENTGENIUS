/**
 * useSidebar Hook
 *
 * Centralized sidebar state management for mobile-optimized UX:
 * - Manages multiple sidebar states (left, right, bottom)
 * - Auto-closes sidebars on mobile when navigation occurs
 * - Handles overlay backdrop for mobile
 * - Persists user preferences
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';

export type SidebarPosition = 'left' | 'right' | 'bottom';
export type SidebarId =
  | 'thumbnails'
  | 'workspace'
  | 'templates'
  | 'theme'
  | 'notes'
  | 'outline'
  | 'mobileNav';

interface SidebarConfig {
  id: SidebarId;
  position: SidebarPosition;
  width?: string;
  height?: string;
  persistent?: boolean;      // Keep open on desktop
  mobileFullScreen?: boolean; // Expand to full screen on mobile
}

interface SidebarState {
  isOpen: boolean;
  position: SidebarPosition;
  config: SidebarConfig;
}

interface UseSidebarOptions {
  defaultOpen?: boolean;
  closeOnNavigation?: boolean;
  closeOnOutsideClick?: boolean;
  closeOthersOnOpen?: boolean;
}

// Global sidebar registry
const sidebarRegistry: Map<SidebarId, SidebarConfig> = new Map();

// Default sidebar configurations
const DEFAULT_CONFIGS: Record<SidebarId, SidebarConfig> = {
  thumbnails: {
    id: 'thumbnails',
    position: 'left',
    width: 'w-44 md:w-52',
    persistent: true,
    mobileFullScreen: false,
  },
  workspace: {
    id: 'workspace',
    position: 'left',
    width: 'w-full sm:w-80 md:w-96',
    persistent: true,
    mobileFullScreen: true,
  },
  templates: {
    id: 'templates',
    position: 'right',
    width: 'w-full sm:w-72 md:w-80',
    persistent: false,
    mobileFullScreen: true,
  },
  theme: {
    id: 'theme',
    position: 'right',
    width: 'w-full sm:w-72 md:w-80',
    persistent: false,
    mobileFullScreen: true,
  },
  notes: {
    id: 'notes',
    position: 'bottom',
    height: 'h-48 md:h-64',
    persistent: false,
    mobileFullScreen: false,
  },
  outline: {
    id: 'outline',
    position: 'left',
    width: 'w-full sm:w-80',
    persistent: true,
    mobileFullScreen: true,
  },
  mobileNav: {
    id: 'mobileNav',
    position: 'left',
    width: 'w-72',
    persistent: false,
    mobileFullScreen: false,
  },
};

/**
 * Central hook for managing all sidebars
 */
export function useSidebarManager() {
  const { isMobile, isTablet } = useMediaQuery();
  const [openSidebars, setOpenSidebars] = useState<Set<SidebarId>>(new Set());

  // Check if a sidebar is open
  const isOpen = useCallback((id: SidebarId) => openSidebars.has(id), [openSidebars]);

  // Open a sidebar
  const open = useCallback((id: SidebarId, closeOthers = false) => {
    setOpenSidebars(prev => {
      const next = closeOthers ? new Set<SidebarId>() : new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Close a sidebar
  const close = useCallback((id: SidebarId) => {
    setOpenSidebars(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Toggle a sidebar
  const toggle = useCallback((id: SidebarId, closeOthers = false) => {
    setOpenSidebars(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        const next = closeOthers ? new Set<SidebarId>() : new Set(prev);
        next.add(id);
        return next;
      }
    });
  }, []);

  // Close all sidebars
  const closeAll = useCallback(() => {
    setOpenSidebars(new Set());
  }, []);

  // Close all non-persistent sidebars (for mobile navigation)
  const closeNonPersistent = useCallback(() => {
    setOpenSidebars(prev => {
      const next = new Set<SidebarId>();
      prev.forEach(id => {
        const config = DEFAULT_CONFIGS[id];
        if (config?.persistent) {
          next.add(id);
        }
      });
      return next;
    });
  }, []);

  // Auto-close sidebars on mobile when switching to desktop
  useEffect(() => {
    if (!isMobile && !isTablet) {
      // Close mobile-only sidebars when on desktop
      close('mobileNav');
    }
  }, [isMobile, isTablet, close]);

  // Check if any sidebar is open (for backdrop)
  const hasOpenSidebar = useMemo(() => openSidebars.size > 0, [openSidebars]);

  // Get all open sidebars by position
  const getOpenByPosition = useCallback((position: SidebarPosition) => {
    return Array.from(openSidebars).filter(id =>
      DEFAULT_CONFIGS[id]?.position === position
    );
  }, [openSidebars]);

  return {
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    closeNonPersistent,
    hasOpenSidebar,
    getOpenByPosition,
    isMobile,
    isTablet,
    openSidebars: Array.from(openSidebars),
  };
}

/**
 * Hook for individual sidebar control
 */
export function useSidebar(
  id: SidebarId,
  options: UseSidebarOptions = {}
) {
  const {
    defaultOpen = false,
    closeOnNavigation = true,
    closeOnOutsideClick = true,
    closeOthersOnOpen = false,
  } = options;

  const { isMobile, isTablet } = useMediaQuery();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = DEFAULT_CONFIGS[id];

  // Register sidebar on mount
  useEffect(() => {
    sidebarRegistry.set(id, config);
    return () => {
      sidebarRegistry.delete(id);
    };
  }, [id, config]);

  // Auto-close on mobile navigation
  useEffect(() => {
    if (closeOnNavigation && isMobile && isOpen) {
      const handlePopState = () => setIsOpen(false);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [closeOnNavigation, isMobile, isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Get responsive width/height classes
  const sizeClass = useMemo(() => {
    if (config.position === 'bottom') {
      return config.height || 'h-48';
    }
    return config.width || 'w-80';
  }, [config]);

  // Check if should show as overlay (mobile mode)
  const isOverlay = useMemo(() => {
    return isMobile || (isTablet && !config.persistent);
  }, [isMobile, isTablet, config.persistent]);

  // Check if should be full screen on mobile
  const isFullScreen = useMemo(() => {
    return isMobile && config.mobileFullScreen;
  }, [isMobile, config.mobileFullScreen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    config,
    sizeClass,
    isOverlay,
    isFullScreen,
    isMobile,
    isTablet,
    position: config.position,
  };
}

/**
 * Hook for managing sidebar backdrop/overlay
 */
export function useSidebarBackdrop(isVisible: boolean, onClose: () => void) {
  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  return {
    backdropProps: {
      onClick: onClose,
      className: `fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`,
    },
  };
}

export { DEFAULT_CONFIGS };
export default useSidebar;

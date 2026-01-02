/**
 * ResponsivePanel Component
 *
 * A wrapper component that adapts its behavior based on screen size:
 * - Desktop: Renders as inline panel with specified width
 * - Mobile: Renders as slide-out drawer with swipe support
 * - Tablet: Renders as overlay panel with backdrop
 *
 * This component bridges the gap between desktop sidebar layouts
 * and mobile-friendly drawer patterns.
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSidebar, type SidebarId } from '../../hooks/useSidebar';
import { MobileSidebar } from './MobileSidebar';

type PanelPosition = 'left' | 'right';

interface ResponsivePanelProps {
  id: SidebarId;
  title?: string;
  position?: PanelPosition;
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  collapsedWidth?: string;
  expandedWidth?: string;
  mobileFullScreen?: boolean;
  showToggle?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const ResponsivePanel: React.FC<ResponsivePanelProps> = ({
  id,
  title,
  position = 'left',
  children,
  className = '',
  mobileClassName = '',
  desktopClassName = '',
  defaultOpen = true,
  collapsible = true,
  collapsedWidth = 'w-12',
  expandedWidth = 'w-80',
  mobileFullScreen = false,
  showToggle = true,
  onToggle,
}) => {
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const sidebar = useSidebar(id, { defaultOpen, closeOnNavigation: true });
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  // Sync with sidebar state for mobile
  useEffect(() => {
    if (isMobile || isTablet) {
      setIsExpanded(sidebar.isOpen);
    }
  }, [sidebar.isOpen, isMobile, isTablet]);

  // Handle toggle
  const handleToggle = () => {
    if (isMobile || isTablet) {
      sidebar.toggle();
    } else {
      setIsExpanded(!isExpanded);
    }
    onToggle?.(!isExpanded);
  };

  // Mobile/Tablet: Render as drawer
  if (isMobile || isTablet) {
    return (
      <>
        {/* Toggle button for mobile */}
        {showToggle && !sidebar.isOpen && (
          <button
            onClick={sidebar.open}
            className={`
              fixed z-30 p-2
              bg-zinc-800 hover:bg-zinc-700
              border border-zinc-700
              rounded-lg shadow-lg
              transition-all duration-200
              ${position === 'left' ? 'left-4' : 'right-4'}
              top-20
              sm:hidden
            `}
            aria-label={`Open ${title || 'panel'}`}
          >
            {position === 'left' ? (
              <ChevronRightIcon className="w-5 h-5 text-zinc-300" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-zinc-300" />
            )}
          </button>
        )}

        {/* Drawer */}
        <MobileSidebar
          isOpen={sidebar.isOpen}
          onClose={sidebar.close}
          position={position}
          title={title}
          width={mobileFullScreen ? 'w-full' : expandedWidth}
          className={mobileClassName}
          enableSwipeClose
        >
          {children}
        </MobileSidebar>
      </>
    );
  }

  // Desktop: Render as inline panel
  return (
    <div
      className={`
        relative flex flex-col
        bg-zinc-900 border-zinc-700
        transition-all duration-300 ease-out
        ${position === 'left' ? 'border-r' : 'border-l'}
        ${isExpanded ? expandedWidth : collapsedWidth}
        ${desktopClassName}
        ${className}
      `}
    >
      {/* Toggle button */}
      {collapsible && showToggle && (
        <button
          onClick={handleToggle}
          className={`
            absolute top-1/2 -translate-y-1/2 z-10
            w-6 h-12 flex items-center justify-center
            bg-zinc-800 hover:bg-zinc-700
            border border-zinc-700
            rounded-lg shadow-md
            transition-all duration-200
            ${position === 'left' ? '-right-3' : '-left-3'}
          `}
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {position === 'left' ? (
            isExpanded ? (
              <ChevronLeftIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
            )
          ) : (
            isExpanded ? (
              <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-zinc-400" />
            )
          )}
        </button>
      )}

      {/* Header */}
      {title && isExpanded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white truncate">
            {title}
          </h2>
        </div>
      )}

      {/* Content */}
      <div
        className={`
          flex-1 overflow-hidden
          ${isExpanded ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-200
        `}
      >
        {isExpanded && children}
      </div>

      {/* Collapsed state icon placeholder */}
      {!isExpanded && collapsible && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          {/* Show minimized content indicators here */}
        </div>
      )}
    </div>
  );
};

/**
 * ResponsivePanelGroup - Manages multiple panels together
 */
interface ResponsivePanelGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsivePanelGroup: React.FC<ResponsivePanelGroupProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex h-full ${className}`}>
      {children}
    </div>
  );
};

/**
 * CollapsibleSection - For use within panels
 */
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-zinc-800 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          text-sm font-medium text-zinc-300
          hover:bg-zinc-800/50
          transition-colors
        "
      >
        <span>{title}</span>
        <ChevronRightIcon
          className={`
            w-4 h-4 text-zinc-500
            transition-transform duration-200
            ${isOpen ? 'rotate-90' : ''}
          `}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default ResponsivePanel;

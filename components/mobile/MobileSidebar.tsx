/**
 * MobileSidebar Component
 *
 * A mobile-optimized drawer component with:
 * - Smooth slide-in/out animations
 * - Swipe-to-close gesture support
 * - Backdrop overlay with blur
 * - Support for left, right, and bottom positions
 * - Accessibility features (focus trap, ARIA)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDragToDismiss } from '../../hooks/useSwipeGesture';
import { useSidebarBackdrop } from '../../hooks/useSidebar';

type DrawerPosition = 'left' | 'right' | 'bottom';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  title?: string;
  showHeader?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
  width?: string;
  height?: string;
  zIndex?: number;
  enableSwipeClose?: boolean;
  overlayClassName?: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  position = 'left',
  title,
  showHeader = true,
  showCloseButton = true,
  children,
  className = '',
  width = 'w-80',
  height = 'h-96',
  zIndex = 50,
  enableSwipeClose = true,
  overlayClassName = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { backdropProps } = useSidebarBackdrop(isOpen, onClose);

  // Determine swipe direction based on position
  const swipeDirection = position === 'left' ? 'left' : position === 'right' ? 'right' : 'down';
  const { bind, style: dragStyle, isDragging } = useDragToDismiss(onClose, {
    direction: swipeDirection,
    threshold: 100,
    enabled: enableSwipeClose && isOpen,
  });

  // Bind swipe gesture to drawer
  useEffect(() => {
    if (enableSwipeClose && drawerRef.current) {
      const cleanup = bind(drawerRef.current);
      return cleanup;
    }
  }, [bind, enableSwipeClose, isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Get position-based classes
  const getPositionClasses = useCallback(() => {
    const baseTransition = isDragging ? '' : 'transition-transform duration-300 ease-out';

    switch (position) {
      case 'left':
        return {
          container: `fixed inset-y-0 left-0 ${width} ${baseTransition}`,
          transform: isOpen ? 'translate-x-0' : '-translate-x-full',
          dragIndicator: 'right-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full',
        };
      case 'right':
        return {
          container: `fixed inset-y-0 right-0 ${width} ${baseTransition}`,
          transform: isOpen ? 'translate-x-0' : 'translate-x-full',
          dragIndicator: 'left-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full',
        };
      case 'bottom':
        return {
          container: `fixed inset-x-0 bottom-0 ${height} ${baseTransition} rounded-t-2xl`,
          transform: isOpen ? 'translate-y-0' : 'translate-y-full',
          dragIndicator: 'top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full',
        };
      default:
        return {
          container: `fixed inset-y-0 left-0 ${width} ${baseTransition}`,
          transform: isOpen ? 'translate-x-0' : '-translate-x-full',
          dragIndicator: 'right-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full',
        };
    }
  }, [position, width, height, isOpen, isDragging]);

  const positionClasses = getPositionClasses();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          {...backdropProps}
          className={`${backdropProps.className} ${overlayClassName}`}
          style={{ zIndex: zIndex - 1 }}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sidebar'}
        className={`
          ${positionClasses.container}
          ${positionClasses.transform}
          bg-zinc-900 border-zinc-700 shadow-2xl
          flex flex-col
          ${position === 'left' ? 'border-r' : position === 'right' ? 'border-l' : 'border-t'}
          ${className}
        `}
        style={{
          zIndex,
          ...(isDragging ? dragStyle : {}),
        }}
      >
        {/* Drag Indicator (for swipe hint) */}
        {enableSwipeClose && (
          <div
            className={`
              absolute ${positionClasses.dragIndicator}
              bg-zinc-600
            `}
          />
        )}

        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink-0">
            {title && (
              <h2 className="text-sm font-semibold text-white truncate">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-auto"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * MobileBottomSheet - Specialized bottom drawer
 */
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  className?: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  className = '',
}) => {
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(0);

  const getHeight = () => {
    const snapPoint = snapPoints[currentSnapIndex];
    return `${snapPoint * 100}vh`;
  };

  return (
    <MobileSidebar
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      title={title}
      height={getHeight()}
      className={`rounded-t-3xl ${className}`}
      enableSwipeClose
    >
      {/* Snap point indicator dots */}
      <div className="flex justify-center gap-1.5 py-2">
        {snapPoints.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSnapIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${index === currentSnapIndex ? 'bg-cyan-500' : 'bg-zinc-600'}
            `}
            aria-label={`Snap point ${index + 1}`}
          />
        ))}
      </div>
      {children}
    </MobileSidebar>
  );
};

export default MobileSidebar;

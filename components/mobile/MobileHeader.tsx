/**
 * MobileHeader Component
 *
 * Mobile-optimized header with:
 * - Hamburger menu for navigation
 * - Compact action buttons
 * - Touch-friendly tap targets
 * - Safe area support
 */

import React, { useState } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { MobileSidebar } from './MobileSidebar';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  onPresent?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  showMenuButton?: boolean;
  showActions?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  onMenuClick,
  onPresent,
  onExport,
  onShare,
  showMenuButton = true,
  showActions = true,
  className = '',
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setIsMenuOpen(true);
    }
  };

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          h-14 sm:h-16
          flex items-center justify-between
          px-3 sm:px-6
          bg-zinc-950/95 backdrop-blur-xl
          border-b border-white/5
          pt-safe
          ${className}
        `}
      >
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Back or Menu Button */}
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="
                p-2.5 -ml-1
                text-zinc-400 hover:text-white
                bg-white/5 hover:bg-white/10
                rounded-xl
                transition-all
                active:scale-95
                touch-manipulation
              "
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          ) : showMenuButton ? (
            <button
              onClick={handleMenuClick}
              className="
                p-2.5 -ml-1
                text-zinc-400 hover:text-white
                hover:bg-white/5
                rounded-xl
                transition-all
                active:scale-95
                touch-manipulation
                sm:hidden
              "
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          ) : null}

          {/* Logo (Desktop only) */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-lg">🧬</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-tighter text-sm leading-none">
                PRESENTGENIUS
              </span>
              <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">
                By Dr. Swisher
              </span>
            </div>
          </div>

          {/* Title */}
          {title && (
            <div className="flex flex-col min-w-0 ml-1 sm:ml-4">
              <h1 className="text-sm font-semibold text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[10px] text-zinc-500 truncate">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        {showActions && (
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Present Button (Primary) */}
            {onPresent && (
              <button
                onClick={onPresent}
                className="
                  flex items-center gap-1.5
                  px-3 py-2 sm:px-4 sm:py-2
                  text-xs sm:text-sm font-bold text-white
                  bg-cyan-500 hover:bg-cyan-400
                  rounded-xl
                  transition-all
                  shadow-lg shadow-cyan-500/20
                  active:scale-95
                  touch-manipulation
                "
              >
                <PlayIcon className="w-4 h-4 fill-white" />
                <span className="hidden sm:inline">PRESENT</span>
              </button>
            )}

            {/* More Actions (Mobile) */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="
                  p-2.5
                  text-zinc-400 hover:text-white
                  hover:bg-white/5
                  rounded-xl
                  transition-all
                  active:scale-95
                  touch-manipulation
                "
                aria-label="More actions"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>

              {/* Actions Dropdown */}
              {isActionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsActionsOpen(false)}
                  />
                  <div className="
                    absolute right-0 top-full mt-2 z-50
                    w-48 py-2
                    bg-zinc-800 border border-zinc-700
                    rounded-xl shadow-xl
                  ">
                    {onExport && (
                      <button
                        onClick={() => {
                          onExport();
                          setIsActionsOpen(false);
                        }}
                        className="
                          w-full flex items-center gap-3
                          px-4 py-3
                          text-sm text-zinc-300
                          hover:bg-zinc-700
                          transition-colors
                        "
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Export
                      </button>
                    )}
                    {onShare && (
                      <button
                        onClick={() => {
                          onShare();
                          setIsActionsOpen(false);
                        }}
                        className="
                          w-full flex items-center gap-3
                          px-4 py-3
                          text-sm text-zinc-300
                          hover:bg-zinc-700
                          transition-colors
                        "
                      >
                        <ShareIcon className="w-5 h-5" />
                        Share
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
              {onExport && (
                <button
                  onClick={onExport}
                  className="
                    p-2
                    text-zinc-400 hover:text-white
                    hover:bg-white/5
                    rounded-xl
                    transition-all
                  "
                  title="Export"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="
                    p-2
                    text-zinc-400 hover:text-white
                    hover:bg-white/5
                    rounded-xl
                    transition-all
                  "
                  title="Share"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Custom children */}
            {children}
          </div>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      <MobileSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position="left"
        title="Menu"
        width="w-72"
        enableSwipeClose
      >
        <nav className="py-2">
          <MobileNavItem
            icon="🏠"
            label="Home"
            onClick={() => setIsMenuOpen(false)}
          />
          <MobileNavItem
            icon="📊"
            label="My Presentations"
            onClick={() => setIsMenuOpen(false)}
          />
          <MobileNavItem
            icon="📝"
            label="Templates"
            onClick={() => setIsMenuOpen(false)}
          />
          <MobileNavItem
            icon="⚙️"
            label="Settings"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="my-2 border-t border-zinc-800" />
          <MobileNavItem
            icon="❓"
            label="Help & Support"
            onClick={() => setIsMenuOpen(false)}
          />
        </nav>
      </MobileSidebar>

      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16" />
    </>
  );
};

interface MobileNavItemProps {
  icon: string | React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({
  icon,
  label,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-4
        px-5 py-4
        text-zinc-300 hover:text-white
        hover:bg-zinc-800
        transition-colors
        text-left
      "
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="
          px-2 py-0.5
          bg-cyan-500/20 text-cyan-400
          text-xs font-bold
          rounded-full
        ">
          {badge}
        </span>
      )}
    </button>
  );
};

export default MobileHeader;

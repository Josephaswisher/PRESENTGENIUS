/**
 * Header Component
 *
 * Top navigation bar with:
 * - App branding
 * - Project title (when active)
 * - User menu (auth)
 * - Quick actions
 */

import React from 'react';
import { ArrowLeftIcon, PlayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { UserMenu } from './auth/UserMenu';
import type { Creation } from './CreationHistory';

interface HeaderProps {
  activeCreation: Creation | null;
  onBack: () => void;
  onPresent?: () => void;
  onExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCreation,
  onBack,
  onPresent,
  onExport,
}) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm">
      {/* Left: Back button + Logo */}
      <div className="flex items-center gap-3">
        {activeCreation && (
          <button
            onClick={onBack}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Back to home"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xl">🧬</span>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-sm leading-tight">
              PRESENTGENIUS
            </span>
            <span className="text-[10px] text-zinc-500 leading-tight">
              By Dr. Joey Swisher
            </span>
          </div>
        </div>
      </div>

      {/* Center: Project title */}
      {activeCreation && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-sm font-medium text-zinc-300 truncate max-w-xs">
            {activeCreation.name}
          </h1>
        </div>
      )}

      {/* Right: Actions + User */}
      <div className="flex items-center gap-2">
        {activeCreation && (
          <>
            {onPresent && (
              <button
                onClick={onPresent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Present"
              >
                <PlayIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Present</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Export"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            )}
          </>
        )}

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;

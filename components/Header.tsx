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
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-950/20 backdrop-blur-xl z-[100]">
      {/* Left: Back button + Logo */}
      <div className="flex items-center gap-4">
        {activeCreation && (
          <button
            onClick={onBack}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
            title="Back to home"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
            <span className="text-xl">🧬</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-white tracking-tighter text-base leading-none">
              PRESENTGENIUS
            </span>
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
              By Dr. Swisher
            </span>
          </div>
        </div>
      </div>

      {/* Center: Project title */}
      {activeCreation && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <h1 className="text-xs font-bold text-zinc-300 tracking-wide uppercase truncate max-w-xs">
              {activeCreation.name}
            </h1>
          </div>
        </div>
      )}

      {/* Right: Actions + User */}
      <div className="flex items-center gap-3">
        {activeCreation && (
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            {onPresent && (
              <button
                onClick={onPresent}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
              >
                <PlayIcon className="w-4 h-4 fill-white" />
                <span>PRESENT</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                title="Export"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="p-1 bg-white/5 rounded-2xl border border-white/5">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;

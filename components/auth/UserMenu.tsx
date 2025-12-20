/**
 * UserMenu Component
 *
 * Displays user avatar/info when logged in, or sign-in button when not.
 * Includes dropdown menu for account actions.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  CloudArrowUpIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../stores/app.store';
import { isSupabaseConfigured } from '../../lib/supabase/client';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, signOut, isLoading } = useAuth();
  const { openAuthModal, hasUnsavedChanges, isSaving, lastSaved } = useAppStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
      >
        {isSupabaseConfigured() ? (
          <>
            <CloudArrowUpIcon className="w-4 h-4" />
            Sign in to save
          </>
        ) : (
          <>
            <CloudIcon className="w-4 h-4 text-zinc-500" />
            Local mode
          </>
        )}
      </button>
    );
  }

  // Logged in - show user menu
  const userEmail = user.email || 'User';
  const userInitial = userEmail[0].toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        {/* Save status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {isSaving ? (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="hidden sm:inline">Unsaved</span>
            </>
          ) : lastSaved ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : null}
        </div>

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userEmail}
            className="w-8 h-8 rounded-full object-cover border border-zinc-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-medium">
            {userInitial}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-medium text-zinc-100 truncate">{userEmail}</p>
            <p className="text-xs text-zinc-500">Signed in</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                // TODO: Open settings
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

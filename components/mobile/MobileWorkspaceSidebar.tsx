/**
 * MobileWorkspaceSidebar Component
 *
 * Mobile-optimized workspace sidebar with:
 * - Tab-based navigation (Research, Chat, Questions)
 * - Drawer mode on mobile devices
 * - Swipe gestures to open/close
 * - Seamless integration with desktop layout
 */

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileSidebar } from './MobileSidebar';
import { MobileTabBar } from './MobileBottomNav';

type WorkspaceTab = 'research' | 'chat' | 'questions';

interface WorkspaceTabConfig {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mobileLabel?: string;
}

const WORKSPACE_TABS: WorkspaceTabConfig[] = [
  { id: 'research', label: 'Research', icon: MagnifyingGlassIcon, mobileLabel: 'Research' },
  { id: 'chat', label: 'Chat & Refine', icon: ChatBubbleLeftRightIcon, mobileLabel: 'Chat' },
  { id: 'questions', label: 'Board Questions', icon: QuestionMarkCircleIcon, mobileLabel: 'Q&A' },
];

interface MobileWorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  children?: React.ReactNode;
  researchContent?: React.ReactNode;
  chatContent?: React.ReactNode;
  questionsContent?: React.ReactNode;
  className?: string;
}

export const MobileWorkspaceSidebar: React.FC<MobileWorkspaceSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  children,
  researchContent,
  chatContent,
  questionsContent,
  className = '',
}) => {
  const { isMobile, isTablet, isDesktop } = useMediaQuery();

  // Get content for current tab
  const getTabContent = () => {
    switch (activeTab) {
      case 'research':
        return researchContent;
      case 'chat':
        return chatContent;
      case 'questions':
        return questionsContent;
      default:
        return children;
    }
  };

  const activeTabConfig = WORKSPACE_TABS.find(t => t.id === activeTab);

  // Mobile drawer mode
  if (isMobile || isTablet) {
    return (
      <MobileSidebar
        isOpen={isOpen}
        onClose={onClose}
        position="left"
        title={activeTabConfig?.label}
        width="w-full sm:w-96"
        enableSwipeClose
        showHeader={false}
        className={className}
      >
        <div className="flex flex-col h-full">
          {/* Custom Header with Tabs */}
          <div className="flex-shrink-0 border-b border-zinc-700">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-white">Workspace</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="px-3 pb-3">
              <MobileTabBar
                tabs={WORKSPACE_TABS.map(tab => ({
                  id: tab.id,
                  label: isMobile ? (tab.mobileLabel || tab.label) : tab.label,
                  icon: tab.icon,
                }))}
                activeTab={activeTab}
                onTabChange={(id) => onTabChange(id as WorkspaceTab)}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {getTabContent()}
          </div>
        </div>
      </MobileSidebar>
    );
  }

  // Desktop inline mode
  return (
    <div className={`flex flex-col h-full bg-zinc-900 border-r border-zinc-700 w-80 md:w-96 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-white">Workspace</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="px-3 pb-3">
          <div className="flex bg-zinc-800/50 rounded-xl p-1">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  py-2 px-3 rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {getTabContent()}
      </div>
    </div>
  );
};

/**
 * WorkspaceToggleButton - Floating button to open workspace on mobile
 */
interface WorkspaceToggleButtonProps {
  onClick: () => void;
  badge?: number;
  className?: string;
}

export const WorkspaceToggleButton: React.FC<WorkspaceToggleButtonProps> = ({
  onClick,
  badge,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed right-4 top-20 z-40
        flex items-center gap-2
        px-3 py-2.5
        bg-gradient-to-r from-cyan-500/20 to-purple-500/20
        border border-cyan-500/30
        rounded-xl shadow-lg
        text-cyan-300
        transition-all
        active:scale-95
        touch-manipulation
        backdrop-blur-sm
        sm:hidden
        ${className}
      `}
      aria-label="Open workspace"
    >
      <SparklesIcon className="w-5 h-5" />
      <span className="text-xs font-medium">AI</span>
      {badge !== undefined && badge > 0 && (
        <span className="
          absolute -top-1 -right-1
          min-w-[18px] h-[18px] px-1
          bg-cyan-500 text-white
          text-[10px] font-bold
          rounded-full
          flex items-center justify-center
        ">
          {badge}
        </span>
      )}
    </button>
  );
};

export default MobileWorkspaceSidebar;

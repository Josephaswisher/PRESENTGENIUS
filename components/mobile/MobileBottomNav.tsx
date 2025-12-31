/**
 * MobileBottomNav Component
 *
 * Bottom navigation bar for mobile devices:
 * - Fixed bottom position with safe area support
 * - Haptic-style feedback on tap
 * - Badge support for notifications
 * - Active state indicators
 * - Smooth transitions
 */

import React from 'react';
import {
  HomeIcon,
  RectangleStackIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PlayIcon,
  PlusIcon,
  Bars3Icon,
  DocumentTextIcon,
  PaintBrushIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';

export type NavItemId = 'home' | 'slides' | 'chat' | 'settings' | 'present' | 'add' | 'menu' | 'templates' | 'theme' | 'collaborate';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  isPrimary?: boolean;
}

interface MobileBottomNavProps {
  activeItem?: NavItemId;
  onItemClick: (id: NavItemId) => void;
  items?: NavItem[];
  showLabels?: boolean;
  className?: string;
  variant?: 'default' | 'editor' | 'minimal';
}

// Preset navigation configurations
const NAV_PRESETS: Record<string, NavItem[]> = {
  default: [
    { id: 'home', label: 'Home', icon: HomeIcon, activeIcon: HomeIconSolid },
    { id: 'slides', label: 'Slides', icon: RectangleStackIcon, activeIcon: RectangleStackIconSolid },
    { id: 'add', label: 'Create', icon: PlusIcon, isPrimary: true },
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon, activeIcon: ChatBubbleLeftRightIconSolid },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid },
  ],
  editor: [
    { id: 'slides', label: 'Slides', icon: RectangleStackIcon, activeIcon: RectangleStackIconSolid },
    { id: 'templates', label: 'Templates', icon: DocumentTextIcon, activeIcon: DocumentTextIconSolid },
    { id: 'present', label: 'Present', icon: PlayIcon, isPrimary: true },
    { id: 'theme', label: 'Theme', icon: PaintBrushIcon },
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon, activeIcon: ChatBubbleLeftRightIconSolid },
  ],
  minimal: [
    { id: 'menu', label: 'Menu', icon: Bars3Icon },
    { id: 'add', label: 'Create', icon: PlusIcon, isPrimary: true },
    { id: 'collaborate', label: 'Share', icon: UserGroupIcon },
  ],
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeItem,
  onItemClick,
  items,
  showLabels = true,
  className = '',
  variant = 'default',
}) => {
  const navItems = items || NAV_PRESETS[variant] || NAV_PRESETS.default;

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-zinc-900/95 backdrop-blur-xl
        border-t border-zinc-800
        pb-safe
        sm:hidden
        ${className}
      `}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            showLabel={showLabels}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  showLabel: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
  item,
  isActive,
  showLabel,
  onClick,
}) => {
  const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

  // Primary button (center action)
  if (item.isPrimary) {
    return (
      <button
        onClick={onClick}
        className="relative -mt-6 flex flex-col items-center justify-center"
        aria-label={item.label}
      >
        <div
          className={`
            w-14 h-14 rounded-2xl
            bg-gradient-to-br from-cyan-500 to-cyan-600
            flex items-center justify-center
            shadow-lg shadow-cyan-500/30
            transform active:scale-95 transition-transform
            ring-4 ring-zinc-900
          `}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {showLabel && (
          <span className="text-[10px] font-medium text-cyan-400 mt-1">
            {item.label}
          </span>
        )}
      </button>
    );
  }

  // Regular nav button
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        min-w-[64px] py-2 px-3
        rounded-xl
        transition-all duration-200
        active:scale-95
        ${isActive
          ? 'text-cyan-400'
          : 'text-zinc-500 hover:text-zinc-300'
        }
      `}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${isActive ? 'text-cyan-400' : ''}`} />
        {/* Badge */}
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              min-w-[16px] h-4 px-1
              bg-red-500 text-white
              text-[10px] font-bold
              rounded-full
              flex items-center justify-center
            "
          >
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
        )}
      </div>
      {showLabel && (
        <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-cyan-400' : ''}`}>
          {item.label}
        </span>
      )}
    </button>
  );
};

/**
 * Floating Action Button for mobile
 */
interface MobileFABProps {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  className?: string;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon: Icon = PlusIcon,
  label,
  position = 'bottom-right',
  className = '',
}) => {
  const positionClasses = {
    'bottom-right': 'right-4 bottom-20',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
    'bottom-left': 'left-4 bottom-20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]}
        w-14 h-14 rounded-full
        bg-gradient-to-br from-cyan-500 to-purple-600
        flex items-center justify-center
        shadow-lg shadow-cyan-500/30
        transform active:scale-95 transition-all
        hover:shadow-xl hover:shadow-cyan-500/40
        z-40
        sm:hidden
        ${className}
      `}
      aria-label={label || 'Action'}
    >
      <Icon className="w-6 h-6 text-white" />
    </button>
  );
};

/**
 * Mobile Tab Bar - Alternative horizontal tabs
 */
interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex bg-zinc-800/50 rounded-xl p-1 ${className}`}>
      {tabs.map((tab) => (
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
          {tab.icon && <tab.icon className="w-4 h-4" />}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileBottomNav;

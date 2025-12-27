/**
 * ThemeEditorPanel Component
 * Theme selection and customization for presentations
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  SwatchIcon,
  CheckIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';
import { THEME_PRESETS, THEME_CATEGORIES } from '../../data/themes';
import type { ThemeConfig } from '../../types/slides';

interface ThemeEditorPanelProps {
  className?: string;
}

export const ThemeEditorPanel: React.FC<ThemeEditorPanelProps> = ({
  className = '',
}) => {
  const {
    presentation,
    setTheme,
    updateTheme,
    toggleThemeEditor,
  } = useSlideStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'customize'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentTheme = presentation?.theme;

  // Filter themes by category
  const filteredThemes = THEME_PRESETS.filter((theme) => {
    if (selectedCategory === 'all') return true;
    const category = THEME_CATEGORIES.find((c) => c.themes.includes(theme.id));
    return category?.id === selectedCategory;
  });

  const handleSelectTheme = (theme: ThemeConfig) => {
    setTheme(theme);
  };

  const handleColorChange = (colorKey: string, value: string) => {
    if (!currentTheme) return;
    updateTheme({
      colors: {
        ...currentTheme.colors,
        [colorKey]: value,
      },
    });
  };

  const handleFontChange = (fontKey: string, value: string) => {
    if (!currentTheme) return;
    updateTheme({
      typography: {
        ...currentTheme.typography,
        [fontKey]: value,
      },
    });
  };

  return (
    <div className={`flex flex-col bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <PaintBrushIcon className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">Theme Editor</h3>
        </div>
        <button
          onClick={toggleThemeEditor}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 text-xs font-medium transition-colors
            ${activeTab === 'presets'
              ? 'text-cyan-300 border-b-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200'
            }
          `}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('customize')}
          className={`flex-1 py-2 text-xs font-medium transition-colors
            ${activeTab === 'customize'
              ? 'text-cyan-300 border-b-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200'
            }
          `}
        >
          Customize
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'presets' ? (
          <ThemePresetsView
            themes={filteredThemes}
            currentThemeId={currentTheme?.id}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onSelectTheme={handleSelectTheme}
          />
        ) : (
          <ThemeCustomizeView
            theme={currentTheme}
            onColorChange={handleColorChange}
            onFontChange={handleFontChange}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// THEME PRESETS VIEW
// ============================================================================

interface ThemePresetsViewProps {
  themes: ThemeConfig[];
  currentThemeId?: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onSelectTheme: (theme: ThemeConfig) => void;
}

const ThemePresetsView: React.FC<ThemePresetsViewProps> = ({
  themes,
  currentThemeId,
  selectedCategory,
  onCategoryChange,
  onSelectTheme,
}) => (
  <div className="p-2">
    {/* Category Filter */}
    <div className="flex gap-1 mb-3 flex-wrap">
      <FilterButton
        label="All"
        isActive={selectedCategory === 'all'}
        onClick={() => onCategoryChange('all')}
      />
      {THEME_CATEGORIES.map((cat) => (
        <FilterButton
          key={cat.id}
          label={cat.name}
          isActive={selectedCategory === cat.id}
          onClick={() => onCategoryChange(cat.id)}
        />
      ))}
    </div>

    {/* Theme Grid */}
    <div className="grid grid-cols-2 gap-2">
      {themes.map((theme) => (
        <ThemePreviewCard
          key={theme.id}
          theme={theme}
          isSelected={currentThemeId === theme.id}
          onClick={() => onSelectTheme(theme)}
        />
      ))}
    </div>
  </div>
);

// ============================================================================
// THEME CUSTOMIZE VIEW
// ============================================================================

interface ThemeCustomizeViewProps {
  theme?: ThemeConfig;
  onColorChange: (key: string, value: string) => void;
  onFontChange: (key: string, value: string) => void;
}

const ThemeCustomizeView: React.FC<ThemeCustomizeViewProps> = ({
  theme,
  onColorChange,
  onFontChange,
}) => {
  if (!theme) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        Select a theme preset first
      </div>
    );
  }

  const colorKeys = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'text', label: 'Text' },
    { key: 'textMuted', label: 'Muted Text' },
    { key: 'border', label: 'Border' },
  ];

  const fontOptions = [
    'Inter, system-ui, sans-serif',
    'Roboto, system-ui, sans-serif',
    'Open Sans, system-ui, sans-serif',
    'Poppins, system-ui, sans-serif',
    'Montserrat, system-ui, sans-serif',
    'Merriweather, Georgia, serif',
    'Playfair Display, Georgia, serif',
  ];

  return (
    <div className="p-3 space-y-4">
      {/* Current Theme */}
      <div className="p-2 bg-zinc-800 rounded-lg">
        <span className="text-xs text-zinc-400">Based on:</span>
        <span className="ml-2 text-sm text-zinc-200">{theme.name}</span>
      </div>

      {/* Colors Section */}
      <div>
        <h4 className="text-xs font-medium text-zinc-400 uppercase mb-2">Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          {colorKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={(theme.colors as any)[key]}
                onChange={(e) => onColorChange(key, e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent"
              />
              <span className="text-xs text-zinc-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div>
        <h4 className="text-xs font-medium text-zinc-400 uppercase mb-2">Typography</h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Heading Font</label>
            <select
              value={theme.typography.headingFont}
              onChange={(e) => onFontChange('headingFont', e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 outline-none focus:border-cyan-500"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Body Font</label>
            <select
              value={theme.typography.bodyFont}
              onChange={(e) => onFontChange('bodyFont', e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 outline-none focus:border-cyan-500"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-xs font-medium text-zinc-400 uppercase mb-2">Preview</h4>
        <div
          className="aspect-video rounded-lg p-3 flex flex-col justify-center"
          style={{ background: theme.colors.background }}
        >
          <h3
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Sample Heading
          </h3>
          <p
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.typography.bodyFont,
              fontSize: '0.75rem',
              marginTop: '0.25rem',
            }}
          >
            This is sample body text.
          </p>
          <div className="flex gap-2 mt-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: theme.colors.primary }}
              title="Primary"
            />
            <div
              className="w-4 h-4 rounded"
              style={{ background: theme.colors.secondary }}
              title="Secondary"
            />
            <div
              className="w-4 h-4 rounded"
              style={{ background: theme.colors.accent }}
              title="Accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded text-xs transition-colors
      ${isActive
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'text-zinc-400 hover:bg-zinc-800'
      }
    `}
  >
    {label}
  </button>
);

interface ThemePreviewCardProps {
  theme: ThemeConfig;
  isSelected: boolean;
  onClick: () => void;
}

const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isSelected,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`relative group rounded-lg overflow-hidden border transition-all
      ${isSelected
        ? 'border-cyan-500 ring-2 ring-cyan-500/30'
        : 'border-zinc-700 hover:border-zinc-500'
      }
    `}
  >
    {/* Color Preview */}
    <div className="aspect-video p-2" style={{ background: theme.colors.background }}>
      <div className="flex gap-1 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: theme.colors.primary }}
        />
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: theme.colors.secondary }}
        />
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: theme.colors.accent }}
        />
      </div>
      <div
        className="h-1.5 w-3/4 rounded"
        style={{ background: theme.colors.text, opacity: 0.8 }}
      />
      <div
        className="h-1 w-1/2 rounded mt-1"
        style={{ background: theme.colors.textMuted, opacity: 0.5 }}
      />
    </div>

    {/* Name */}
    <div className="px-2 py-1.5 bg-zinc-800">
      <span className="text-[10px] text-zinc-300">{theme.name}</span>
    </div>

    {/* Selected Indicator */}
    {isSelected && (
      <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
        <CheckIcon className="w-2.5 h-2.5 text-white" />
      </div>
    )}
  </button>
);

export default ThemeEditorPanel;

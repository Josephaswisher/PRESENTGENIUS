/**
 * Creativity Settings Hook
 *
 * Manages creative layout preferences with localStorage persistence
 */

import { useState, useEffect } from 'react';
import type { CreativitySettings, CreativityLevel } from '../types/creative-layouts';

const STORAGE_KEY = 'presentgenius-creativity-settings';

const DEFAULT_SETTINGS: CreativitySettings = {
  level: 'mixed',
  layoutVariety: true,
  autoLayoutSelection: true,
};

export function useCreativity() {
  const [settings, setSettings] = useState<CreativitySettings>(DEFAULT_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load creativity settings:', error);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save creativity settings:', error);
    }
  }, [settings]);

  const updateLevel = (level: CreativityLevel) => {
    setSettings(prev => ({ ...prev, level }));
  };

  const updateLayoutVariety = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, layoutVariety: enabled }));
  };

  const updateAutoSelection = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoLayoutSelection: enabled }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateLevel,
    updateLayoutVariety,
    updateAutoSelection,
    resetToDefaults,
  };
}

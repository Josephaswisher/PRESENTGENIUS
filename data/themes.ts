/**
 * Theme Presets
 * Pre-designed theme configurations for presentations
 */

import type { ThemeConfig } from '../types/slides';

export const THEME_PRESETS: ThemeConfig[] = [
  // ============================================================================
  // PROFESSIONAL THEMES
  // ============================================================================
  {
    id: 'medical-professional',
    name: 'Medical Professional',
    colors: {
      primary: '#0ea5e9',
      secondary: '#6366f1',
      accent: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    colors: {
      primary: '#2563eb',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'Roboto, system-ui, sans-serif',
      bodyFont: 'Roboto, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.75rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2.5rem',
      elementGap: '1.25rem',
      contentPadding: '2rem',
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#a78bfa',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      border: '#e9d5ff',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'Merriweather, Georgia, serif',
      bodyFont: 'Source Sans Pro, system-ui, sans-serif',
      codeFont: 'Source Code Pro, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '3rem',
      elementGap: '1.5rem',
      contentPadding: '2rem',
    },
  },

  // ============================================================================
  // DARK THEMES
  // ============================================================================
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#c4b5fd',
      background: '#0c0a1d',
      surface: '#1a1633',
      text: '#e2e8f0',
      textMuted: '#a1a1aa',
      border: '#2d2a4a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
    typography: {
      headingFont: 'Poppins, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },
  {
    id: 'dark-emerald',
    name: 'Dark Emerald',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#6ee7b7',
      background: '#0f1714',
      surface: '#1a2620',
      text: '#f0fdf4',
      textMuted: '#86efac',
      border: '#2d4a3e',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Montserrat, system-ui, sans-serif',
      bodyFont: 'Open Sans, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },

  // ============================================================================
  // LIGHT THEMES
  // ============================================================================
  {
    id: 'clean-white',
    name: 'Clean White',
    colors: {
      primary: '#3b82f6',
      secondary: '#2563eb',
      accent: '#93c5fd',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.75rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2.5rem',
      elementGap: '1.25rem',
      contentPadding: '2rem',
    },
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    colors: {
      primary: '#d97706',
      secondary: '#b45309',
      accent: '#fbbf24',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#451a03',
      textMuted: '#92400e',
      border: '#fcd34d',
      success: '#16a34a',
      warning: '#ea580c',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Lato, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.75rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2.5rem',
      elementGap: '1.25rem',
      contentPadding: '2rem',
    },
  },

  // ============================================================================
  // SPECIALTY THEMES
  // ============================================================================
  {
    id: 'emergency-medicine',
    name: 'Emergency Medicine',
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#fca5a5',
      background: '#1c1917',
      surface: '#292524',
      text: '#fef2f2',
      textMuted: '#a8a29e',
      border: '#44403c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Bebas Neue, Impact, sans-serif',
      bodyFont: 'Roboto Condensed, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '3.5rem',
        h2: '2.5rem',
        h3: '1.75rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '1.5rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    colors: {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#f9a8d4',
      background: '#fdf2f8',
      surface: '#fce7f3',
      text: '#831843',
      textMuted: '#9d174d',
      border: '#fbcfe8',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Nunito, system-ui, sans-serif',
      bodyFont: 'Nunito, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      baseFontSize: '18px',
      headingSizes: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1.25rem',
      contentPadding: '2rem',
    },
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    colors: {
      primary: '#ef4444',
      secondary: '#b91c1c',
      accent: '#fca5a5',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#fee2e2',
      textMuted: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Raleway, system-ui, sans-serif',
      bodyFont: 'Open Sans, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.75rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },
  {
    id: 'neurology',
    name: 'Neurology',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#67e8f9',
      background: '#042f2e',
      surface: '#134e4a',
      text: '#ccfbf1',
      textMuted: '#5eead4',
      border: '#2dd4bf',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#f43f5e',
    },
    typography: {
      headingFont: 'Josefin Sans, system-ui, sans-serif',
      bodyFont: 'Source Sans Pro, system-ui, sans-serif',
      codeFont: 'Source Code Pro, monospace',
      baseFontSize: '16px',
      headingSizes: {
        h1: '2.75rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
      },
    },
    spacing: {
      slideMargin: '2rem',
      elementGap: '1rem',
      contentPadding: '1.5rem',
    },
  },
];

// Theme category metadata
export const THEME_CATEGORIES = [
  { id: 'professional', name: 'Professional', themes: ['medical-professional', 'corporate-blue', 'academic'] },
  { id: 'dark', name: 'Dark Mode', themes: ['midnight', 'dark-emerald'] },
  { id: 'light', name: 'Light Mode', themes: ['clean-white', 'warm-cream'] },
  { id: 'specialty', name: 'Specialty', themes: ['emergency-medicine', 'pediatrics', 'cardiology', 'neurology'] },
];

export default THEME_PRESETS;

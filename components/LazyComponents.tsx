/**
 * Lazy-loaded components for better initial load performance
 * These components are loaded on-demand when needed
 */
import { lazy } from 'react';

// Lazy load heavy components
export const PresentationMode = lazy(() =>
  import('./PresentationMode').then(m => ({ default: m.PresentationMode }))
);

export const PrintablesPanel = lazy(() =>
  import('./PrintablesPanel').then(m => ({ default: m.PrintablesPanel }))
);

export const SupabaseDataViewer = lazy(() =>
  import('./SupabaseDataViewer').then(m => ({ default: m.SupabaseDataViewer }))
);

export const SettingsPanel = lazy(() =>
  import('./SettingsPanel').then(m => ({ default: m.SettingsPanel }))
);

// Loading fallback component
export const LazyLoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
    <div className="text-white text-sm">{message}</div>
  </div>
);

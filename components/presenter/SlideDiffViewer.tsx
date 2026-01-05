/**
 * Slide Diff Viewer Component
 * Side-by-side comparison of current slide vs previous versions
 * with visual diff highlighting
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { usePresentationHistoryStore, type SlideVersion } from '../../stores/presentation-history.store';

interface SlideDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string;
  slideTitle: string;
  currentHtml: string;
  globalStyles: string;
  onRevertToVersion: (html: string) => void;
}

// Simple diff algorithm for HTML
function computeDiff(oldText: string, newText: string): Array<{ type: 'same' | 'added' | 'removed'; text: string }> {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: Array<{ type: 'same' | 'added' | 'removed'; text: string }> = [];

  // Simple line-by-line diff
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx >= oldLines.length) {
      // Rest are additions
      result.push({ type: 'added', text: newLines[newIdx] });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Rest are removals
      result.push({ type: 'removed', text: oldLines[oldIdx] });
      oldIdx++;
    } else if (oldLines[oldIdx] === newLines[newIdx]) {
      // Same line
      result.push({ type: 'same', text: oldLines[oldIdx] });
      oldIdx++;
      newIdx++;
    } else {
      // Look ahead to find matching line
      let foundOld = -1;
      let foundNew = -1;

      for (let i = oldIdx; i < Math.min(oldIdx + 5, oldLines.length); i++) {
        if (oldLines[i] === newLines[newIdx]) {
          foundOld = i;
          break;
        }
      }

      for (let i = newIdx; i < Math.min(newIdx + 5, newLines.length); i++) {
        if (newLines[i] === oldLines[oldIdx]) {
          foundNew = i;
          break;
        }
      }

      if (foundOld !== -1 && (foundNew === -1 || foundOld - oldIdx <= foundNew - newIdx)) {
        // Remove lines until match
        while (oldIdx < foundOld) {
          result.push({ type: 'removed', text: oldLines[oldIdx] });
          oldIdx++;
        }
      } else if (foundNew !== -1) {
        // Add lines until match
        while (newIdx < foundNew) {
          result.push({ type: 'added', text: newLines[newIdx] });
          newIdx++;
        }
      } else {
        // No match, treat as replacement
        result.push({ type: 'removed', text: oldLines[oldIdx] });
        result.push({ type: 'added', text: newLines[newIdx] });
        oldIdx++;
        newIdx++;
      }
    }
  }

  return result;
}

// Format HTML for display
function formatHtml(html: string): string {
  let formatted = html;
  let indent = 0;
  const result: string[] = [];

  // Split by tags
  const parts = formatted.split(/(<[^>]+>)/g).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      result.push('  '.repeat(indent) + part.trim());
    } else if (part.startsWith('<') && !part.startsWith('<!') && !part.endsWith('/>') && !part.includes('</')) {
      result.push('  '.repeat(indent) + part.trim());
      if (!part.match(/<(img|br|hr|input|meta|link)/i)) {
        indent++;
      }
    } else if (part.trim()) {
      result.push('  '.repeat(indent) + part.trim());
    }
  }

  return result.join('\n');
}

export const SlideDiffViewer: React.FC<SlideDiffViewerProps> = ({
  isOpen,
  onClose,
  slideId,
  slideTitle,
  currentHtml,
  globalStyles,
  onRevertToVersion
}) => {
  const historyStore = usePresentationHistoryStore();
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  // Get version history for this slide
  const slideHistory = historyStore.getSlideHistory(slideId);
  const versions = slideHistory?.versions || [];
  const currentIndex = slideHistory?.currentIndex ?? 0;

  // Get the selected previous version
  const selectedVersion = versions[selectedVersionIndex];
  const previousHtml = selectedVersion?.html || '';

  // Compute diff
  const diff = useMemo(() => {
    const formattedOld = formatHtml(previousHtml);
    const formattedNew = formatHtml(currentHtml);
    return computeDiff(formattedOld, formattedNew);
  }, [previousHtml, currentHtml]);

  // Statistics
  const stats = useMemo(() => {
    const added = diff.filter(d => d.type === 'added').length;
    const removed = diff.filter(d => d.type === 'removed').length;
    const same = diff.filter(d => d.type === 'same').length;
    return { added, removed, same, total: added + removed + same };
  }, [diff]);

  // Create preview HTML
  const createPreviewHtml = useCallback((html: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${globalStyles}</style>
</head>
<body>${html}</body>
</html>`;
  }, [globalStyles]);

  const handleRevert = useCallback(() => {
    if (selectedVersion) {
      onRevertToVersion(selectedVersion.html);
      onClose();
    }
  }, [selectedVersion, onRevertToVersion, onClose]);

  const navigateVersion = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedVersionIndex < versions.length - 1) {
      setSelectedVersionIndex(prev => prev + 1);
    } else if (direction === 'next' && selectedVersionIndex > 0) {
      setSelectedVersionIndex(prev => prev - 1);
    }
  }, [selectedVersionIndex, versions.length]);

  if (!isOpen) return null;

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <ArrowPathIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-white font-semibold">Compare Versions</h3>
              <p className="text-zinc-500 text-sm">{slideTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Version navigation */}
            <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
              <button
                onClick={() => navigateVersion('prev')}
                disabled={selectedVersionIndex >= versions.length - 1}
                className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm min-w-[100px] text-center">
                Version {versions.length - selectedVersionIndex} of {versions.length}
              </span>
              <button
                onClick={() => navigateVersion('next')}
                disabled={selectedVersionIndex <= 0}
                className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${viewMode === 'preview' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${viewMode === 'code' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <CodeBracketIcon className="w-4 h-4" />
                Code Diff
              </button>
            </div>

            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
              <XMarkIcon className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Version info bar */}
        {selectedVersion && (
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-zinc-400">
                Previous: <span className="text-white">{formatTimestamp(selectedVersion.timestamp)}</span>
              </span>
              <span className="text-zinc-400">
                Current: <span className="text-white">{formatTimestamp(Date.now())}</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">+{stats.added} added</span>
              <span className="text-red-400">-{stats.removed} removed</span>
              <span className="text-zinc-500">{stats.same} unchanged</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {versions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <ArrowPathIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No version history available</p>
                <p className="text-sm mt-1">Make some edits to create versions</p>
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            <>
              {/* Previous version preview */}
              <div className="flex-1 flex flex-col border-r border-zinc-700">
                <div className="px-4 py-2 bg-red-500/10 border-b border-zinc-700">
                  <span className="text-red-400 text-sm font-medium">Previous Version</span>
                </div>
                <div className="flex-1 bg-zinc-950">
                  <iframe
                    srcDoc={createPreviewHtml(previousHtml)}
                    className="w-full h-full"
                    title="Previous version"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>

              {/* Current version preview */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-green-500/10 border-b border-zinc-700">
                  <span className="text-green-400 text-sm font-medium">Current Version</span>
                </div>
                <div className="flex-1 bg-zinc-950">
                  <iframe
                    srcDoc={createPreviewHtml(currentHtml)}
                    className="w-full h-full"
                    title="Current version"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Code diff view */
            <div className="flex-1 overflow-auto p-4">
              <div className="font-mono text-sm">
                {diff.map((line, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-0.5 ${
                      line.type === 'added' ? 'bg-green-500/20 text-green-300' :
                      line.type === 'removed' ? 'bg-red-500/20 text-red-300' :
                      'text-zinc-400'
                    }`}
                  >
                    <span className={`inline-block w-6 mr-2 ${
                      line.type === 'added' ? 'text-green-500' :
                      line.type === 'removed' ? 'text-red-500' :
                      'text-zinc-600'
                    }`}>
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre">{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-700">
          <div className="text-zinc-500 text-sm">
            {versions.length} version{versions.length !== 1 ? 's' : ''} in history
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
            {selectedVersion && selectedVersionIndex !== currentIndex && (
              <button
                onClick={handleRevert}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                Revert to This Version
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

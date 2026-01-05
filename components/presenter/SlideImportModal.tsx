/**
 * Slide Import Modal Component
 * - URL fetch input
 * - Drag-and-drop file zone
 * - JSON backup import
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  XMarkIcon,
  LinkIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  fetchHtmlFromUrl,
  importFromFile,
  downloadJsonBackup,
  downloadAsHtml,
  validateDroppedFiles,
  type ImportResult,
  type ImportedSlide
} from '../../utils/slide-import-export';

interface SlideImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSlides: (slides: ImportedSlide[]) => void;
  currentSlides: Array<{ id: string; title: string; rawContent: string }>;
  presentationTitle: string;
  globalStyles: string;
}

type ImportTab = 'url' | 'file' | 'export';

export const SlideImportModal: React.FC<SlideImportModalProps> = ({
  isOpen,
  onClose,
  onImportSlides,
  currentSlides,
  presentationTitle,
  globalStyles
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>('url');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewSlides, setPreviewSlides] = useState<ImportedSlide[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setPreviewSlides(null);
  }, []);

  const handleResult = useCallback((result: ImportResult, source: string) => {
    if (result.success && result.slides) {
      setPreviewSlides(result.slides);
      setSuccess(`Found ${result.slides.length} slide${result.slides.length !== 1 ? 's' : ''} from ${source}`);
      setError(null);
    } else {
      setError(result.error || 'Import failed');
      setSuccess(null);
      setPreviewSlides(null);
    }
  }, []);

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    resetState();
    setIsLoading(true);

    try {
      const result = await fetchHtmlFromUrl(urlInput.trim());
      handleResult(result, 'URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    resetState();

    const file = validateDroppedFiles(e.dataTransfer.files);
    if (!file) {
      setError('Please drop an HTML or JSON file');
      return;
    }

    setIsLoading(true);
    try {
      const result = await importFromFile(file);
      handleResult(result, file.name);
    } finally {
      setIsLoading(false);
    }
  }, [handleResult, resetState]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetState();
    setIsLoading(true);

    try {
      const result = await importFromFile(file);
      handleResult(result, file.name);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleImportPreview = () => {
    if (previewSlides) {
      onImportSlides(previewSlides);
      onClose();
    }
  };

  const handleExportJson = () => {
    downloadJsonBackup(presentationTitle, currentSlides);
    setSuccess('Backup downloaded successfully');
  };

  const handleExportHtml = () => {
    downloadAsHtml(presentationTitle, currentSlides, globalStyles);
    setSuccess('HTML exported successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <CloudArrowDownIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Import / Export Slides</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => { setActiveTab('url'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            From URL
          </button>
          <button
            onClick={() => { setActiveTab('file'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DocumentArrowUpIcon className="w-4 h-4" />
            From File
          </button>
          <button
            onClick={() => { setActiveTab('export'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Enter URL to fetch HTML from</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/slides.html"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
                  />
                  <button
                    onClick={handleUrlFetch}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudArrowDownIcon className="w-4 h-4" />
                    )}
                    Fetch
                  </button>
                </div>
              </div>
              <p className="text-zinc-500 text-sm">
                Tip: You can fetch HTML presentations from any public URL. The content will be parsed to extract slides.
              </p>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                }`}
              >
                <DocumentArrowUpIcon className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <p className="text-white font-medium mb-1">
                  {isDragging ? 'Drop file here' : 'Drag & drop or click to select'}
                </p>
                <p className="text-zinc-500 text-sm">
                  Supports .html, .htm, and .json backup files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.xhtml,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleExportJson}
                  className="flex flex-col items-center gap-3 p-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-all"
                >
                  <DocumentTextIcon className="w-10 h-10 text-purple-400" />
                  <div className="text-center">
                    <p className="text-white font-medium">JSON Backup</p>
                    <p className="text-zinc-500 text-sm mt-1">Full backup with metadata</p>
                  </div>
                </button>
                <button
                  onClick={handleExportHtml}
                  className="flex flex-col items-center gap-3 p-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-all"
                >
                  <ArrowDownTrayIcon className="w-10 h-10 text-cyan-400" />
                  <div className="text-center">
                    <p className="text-white font-medium">HTML Export</p>
                    <p className="text-zinc-500 text-sm mt-1">Standalone HTML file</p>
                  </div>
                </button>
              </div>
              <p className="text-zinc-500 text-sm text-center">
                Export your {currentSlides.length} slide{currentSlides.length !== 1 ? 's' : ''} for backup or sharing
              </p>
            </div>
          )}

          {/* Status messages */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && !previewSlides && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Preview imported slides */}
          {previewSlides && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">{success}</span>
                </div>
              </div>
              <div className="max-h-48 overflow-auto space-y-2">
                {previewSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-white text-sm truncate flex-1">{slide.title}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImportPreview}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                Import {previewSlides.length} Slide{previewSlides.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

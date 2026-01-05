/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Enhanced Live Preview
 * Includes multi-format export dropdown (HTML, PDF, JSON)
 */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, ChevronDownIcon, ClipboardDocumentIcon, PencilSquareIcon, DocumentDuplicateIcon, ChartBarIcon, SparklesIcon, DocumentTextIcon, RectangleStackIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { exportToHTML, exportToPDF, exportToPNG, exportToJSON, copyToClipboard, type ExportProgress } from '../services/export';
import { VisualEditor } from './editor/VisualEditor';
import { CompanionMaterialsPanel } from './materials/CompanionMaterialsPanel';
import { PollingPanel } from './polling/PollingPanel';
import { AIEnhancementPanel } from './ai/AIEnhancementPanel';
import { SlideEditor } from './SlideEditor';
import { GlossaryPanel } from './GlossaryPanel';
import { PresentationMode } from './PresentationMode';
import { getScrollStyles } from '../utils/ios-scroll-fix';
import { KeyConcept } from '../services/content-analyzer';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  onReset: () => void;
  onUpdateHtml?: (html: string) => void; // Callback when HTML is edited
  onPrintables?: () => void; // Open printables panel
  className?: string; // Allow parent to control layout
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const LoadingStep = ({ text, active, completed }: { text: string, active: boolean, completed: boolean }) => (
    <div className={`flex items-center space-x-3 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
        <div className={`w-4 h-4 flex items-center justify-center ${completed ? 'text-green-400' : active ? 'text-blue-400' : 'text-zinc-700'}`}>
            {completed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : active ? (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            ) : (
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
            )}
        </div>
        <span className={`font-mono text-xs tracking-wide uppercase ${active ? 'text-zinc-200' : completed ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{text}</span>
    </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, onReset, onUpdateHtml, onPrintables, className = '' }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportFeedback, setExportFeedback] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [showMaterialsPanel, setShowMaterialsPanel] = useState(false);
    const [showPollingPanel, setShowPollingPanel] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showSlideEditor, setShowSlideEditor] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);
    const [showPresentationMode, setShowPresentationMode] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Extract content structure from HTML data attribute
    const contentStructure = useMemo(() => {
        if (!creation?.html) return null;
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(creation.html, 'text/html');
            const structureAttr = doc.body.getAttribute('data-content-structure');
            if (structureAttr) {
                return JSON.parse(structureAttr.replace(/&apos;/g, "'"));
            }
        } catch (error) {
            console.error('Failed to parse content structure:', error);
        }
        return null;
    }, [creation?.html]);

    const allowPreviewScripts = import.meta.env.VITE_ALLOW_IFRAME_SCRIPTS === 'true';
    const previewSandbox = `${allowPreviewScripts ? 'allow-scripts ' : ''}allow-popups allow-modals`;
    // Handle loading animation steps
    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 2000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    const sanitizedHtml = useMemo(() =>
        creation?.html || '',
      [creation?.html]);

    // Default to Split View when a new creation with an image is loaded
    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show feedback message temporarily
    const showFeedback = (message: string, duration = 2000) => {
        setExportFeedback(message);
        setTimeout(() => setExportFeedback(null), duration);
    };

    // Handle export progress updates
    const handleProgress = (progress: ExportProgress) => {
        setExportProgress(progress);
        if (progress.status === 'success') {
            showFeedback(progress.message, 3000);
            setIsExporting(false);
            setExportProgress(null);
            setShowExportMenu(false);
        } else if (progress.status === 'error') {
            showFeedback(`Error: ${progress.error || progress.message}`, 5000);
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    // Export handlers
    const handleExportHTML = () => {
        if (!creation?.html || isExporting) return;
        try {
            exportToHTML(creation.html, creation.name);
            showFeedback('HTML downloaded!');
            setShowExportMenu(false);
        } catch (error) {
            showFeedback('Failed to export HTML', 3000);
            console.error('HTML export error:', error);
        }
    };

    const handleExportPDF = async () => {
        if (!creation?.html || isExporting) return;
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            await exportToPDF(creation.html, creation.name, handleProgress);
        } catch (error) {
            setIsExporting(false);
            showFeedback('PDF export failed. Try a simpler layout or contact support.', 5000);
            console.error('PDF export error:', error);
        }
    };

    const handleExportPNG = async () => {
        if (!creation?.html || isExporting) return;
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            await exportToPNG(creation.html, creation.name, handleProgress);
        } catch (error) {
            setIsExporting(false);
            showFeedback('PNG export failed. Try a simpler layout or contact support.', 5000);
            console.error('PNG export error:', error);
        }
    };

    const handleExportJSON = () => {
        if (!creation || isExporting) return;
        try {
            exportToJSON(creation.html, creation.name, creation.originalImage, creation.id);
            showFeedback('JSON downloaded!');
            setShowExportMenu(false);
        } catch (error) {
            showFeedback('Failed to export JSON', 3000);
            console.error('JSON export error:', error);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!creation?.html || isExporting) return;
        try {
            const success = await copyToClipboard(creation.html);
            showFeedback(success ? 'Copied to clipboard!' : 'Copy failed');
            setShowExportMenu(false);
        } catch (error) {
            showFeedback('Failed to copy to clipboard', 3000);
            console.error('Clipboard error:', error);
        }
    };

  return (
    <div
      className={`
        flex flex-col overflow-hidden bg-[#0E0E10] shadow-2xl
        ${className}
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider hidden sm:inline">
                {isLoading ? 'System Processing...' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1 w-auto min-w-[140px]">
            {/* Export Progress/Feedback Toast */}
            {(exportFeedback || exportProgress) && (
                <div className={`absolute top-12 right-4 ${
                    exportProgress?.status === 'error' ? 'bg-red-500/90' :
                    exportProgress?.status === 'exporting' ? 'bg-blue-500/90' :
                    'bg-green-500/90'
                } text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-50 flex items-center gap-2`}>
                    {exportProgress?.status === 'exporting' && (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{exportProgress?.message || exportFeedback}</span>
                </div>
            )}

            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button
                            onClick={() => setShowSplitView(!showSplitView)}
                            title={showSplitView ? "Show App Only" : "Compare with Original"}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    {/* AI Enhance Button */}
                    <button
                        onClick={() => setShowAIPanel(true)}
                        title="AI Enhancements"
                        className="flex items-center space-x-1 p-1.5 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-zinc-800 transition-all"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">AI</span>
                    </button>

                    {/* Glossary Button */}
                    {contentStructure?.keyTerms && contentStructure.keyTerms.length > 0 && (
                        <button
                            onClick={() => setShowGlossary(true)}
                            title="Medical Glossary"
                            className={`flex items-center space-x-1 p-1.5 rounded-md transition-all ${showGlossary ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-xs hidden md:inline">Glossary</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold">
                                {contentStructure.keyTerms.length}
                            </span>
                        </button>
                    )}

                    {/* Materials Button */}
                    <button
                        onClick={() => setShowMaterialsPanel(true)}
                        title="Generate Companion Materials"
                        className="flex items-center space-x-1 p-1.5 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-zinc-800 transition-all"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">Materials</span>
                    </button>

                    {/* Polling Button */}
                    <button
                        onClick={() => setShowPollingPanel(true)}
                        title="Live Polling"
                        className="flex items-center space-x-1 p-1.5 rounded-md text-zinc-500 hover:text-green-400 hover:bg-zinc-800 transition-all"
                    >
                        <ChartBarIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">Poll</span>
                    </button>

                    {/* Fullscreen Presentation Button */}
                    <button
                        onClick={() => setShowPresentationMode(true)}
                        title="Fullscreen Presentation (F)"
                        className="flex items-center space-x-1 p-1.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
                    >
                        <PresentationChartBarIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">Present</span>
                    </button>

                    {/* Printables Button */}
                    {onPrintables && (
                      <button
                          onClick={onPrintables}
                          title="Generate Printables (Opus)"
                          className="flex items-center space-x-1 p-1.5 rounded-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                      >
                          <DocumentTextIcon className="w-4 h-4" />
                          <span className="text-xs hidden md:inline">Printables</span>
                      </button>
                    )}

                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            title="Export Options"
                            className={`flex items-center space-x-1 p-1.5 rounded-md transition-all ${showExportMenu ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <ChevronDownIcon className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showExportMenu && !isExporting && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="py-1">
                                    <button
                                        onClick={handleExportHTML}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <CodeBracketIcon className="w-4 h-4 text-blue-400" />
                                        <span>Download HTML</span>
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <DocumentIcon className="w-4 h-4 text-red-400" />
                                        <span>Export as PDF</span>
                                    </button>
                                    <button
                                        onClick={handleExportPNG}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <DocumentIcon className="w-4 h-4 text-purple-400" />
                                        <span>Export as PNG</span>
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <DocumentIcon className="w-4 h-4 text-yellow-400" />
                                        <span>Export JSON</span>
                                    </button>
                                    <div className="border-t border-zinc-700 my-1"></div>
                                    <button
                                        onClick={handleCopyToClipboard}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <ClipboardDocumentIcon className="w-4 h-4 text-green-400" />
                                        <span>Copy to Clipboard</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onReset}
                        title="New Upload"
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-[#09090b] flex flex-col md:flex-row overflow-hidden overscroll-contain">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full">
             {/* Technical Loading State */}
             <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 mb-6 text-blue-500 animate-spin-slow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-zinc-100 font-mono text-lg tracking-tight">Constructing Environment</h3>
                    <p className="text-zinc-500 text-sm mt-2">Interpreting visual data...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading_3s_ease-in-out_infinite] w-1/3"></div>
                </div>

                 {/* Terminal Steps */}
                 <div className="border border-zinc-800 bg-black/50 rounded-lg p-4 space-y-3 font-mono text-sm">
                     <LoadingStep text="Analyzing visual inputs" active={loadingStep === 0} completed={loadingStep > 0} />
                     <LoadingStep text="Identifying UI patterns" active={loadingStep === 1} completed={loadingStep > 1} />
                     <LoadingStep text="Generating functional logic" active={loadingStep === 2} completed={loadingStep > 2} />
                     <LoadingStep text="Compiling preview" active={loadingStep === 3} completed={loadingStep > 3} />
                 </div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0 overflow-hidden">
                    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                        Input Source
                    </div>
                    <div className="w-full h-full p-3 md:p-6 flex items-center justify-center overflow-auto scroll-smooth-touch" style={getScrollStyles({ enableMomentum: true, direction: 'both' })}>
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img
                                src={creation.originalImage}
                                alt="Original Input"
                                className="max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel */}
            <div className={`relative h-full bg-white transition-all duration-500 overflow-hidden ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={sanitizedHtml}
                    className="w-full h-full border-0"
                    sandbox={previewSandbox}
                    style={{
                      touchAction: 'pan-y',
                      ...getScrollStyles({ enableMomentum: true, direction: 'vertical' })
                    }}
                />
            </div>
          </>
        ) : null}
      </div>

      {/* Visual Editor Overlay */}
      {showVisualEditor && creation?.html && (
        <div className="absolute inset-0 z-50 bg-zinc-950">
          <div className="h-full flex flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Visual Editor</span>
                <span className="text-xs text-zinc-500">- {creation.name}</span>
              </div>
              <button
                onClick={() => setShowVisualEditor(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
              <VisualEditor
                html={creation.html}
                onSave={(updatedHtml) => {
                  onUpdateHtml?.(updatedHtml);
                  setShowVisualEditor(false);
                  showFeedback('Changes saved!');
                }}
                onCancel={() => setShowVisualEditor(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Companion Materials Panel */}
      {showMaterialsPanel && creation?.html && (
        <CompanionMaterialsPanel
          html={creation.html}
          title={creation.name}
          onClose={() => setShowMaterialsPanel(false)}
        />
      )}

      {/* Polling Panel */}
      {showPollingPanel && creation?.html && (
        <PollingPanel
          html={creation.html}
          title={creation.name}
          presentationId={creation.id}
          onClose={() => setShowPollingPanel(false)}
        />
      )}

      {/* AI Enhancement Panel */}
      {showAIPanel && creation?.html && (
        <AIEnhancementPanel
          html={creation.html}
          title={creation.name}
          onClose={() => setShowAIPanel(false)}
          onEnhance={(enhancedHtml) => {
            onUpdateHtml?.(enhancedHtml);
            setShowAIPanel(false);
            showFeedback('Content enhanced!');
          }}
        />
      )}

      {/* Glossary Panel */}
      {showGlossary && contentStructure?.keyTerms && (
        <GlossaryPanel
          keyTerms={contentStructure.keyTerms as KeyConcept[]}
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
        />
      )}

      {/* Slide-by-Slide Editor */}
      {showSlideEditor && creation?.html && (
        <div className="absolute inset-0 z-50 bg-zinc-950">
          <div className="h-full flex flex-col">
            {/* Slide Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <RectangleStackIcon className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Slide Editor</span>
                <span className="text-xs text-zinc-500">- {creation.name}</span>
              </div>
              <button
                onClick={() => setShowSlideEditor(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Editor Content */}
            <div className="flex-1 overflow-hidden">
              <SlideEditor
                html={creation.html}
                title={creation.name}
                topic={creation.name}
                onHtmlChange={(updatedHtml) => {
                  onUpdateHtml?.(updatedHtml);
                }}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Presentation Mode */}
      {showPresentationMode && creation?.html && (
        <PresentationMode
          html={creation.html}
          title={creation.name}
          onClose={() => setShowPresentationMode(false)}
        />
      )}
    </div>
  );
};
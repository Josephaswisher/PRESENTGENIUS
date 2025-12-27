/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Enhanced Live Preview
 * Includes multi-format export dropdown (HTML, PDF, JSON)
 */
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, ChevronDownIcon, ClipboardDocumentIcon, PresentationChartBarIcon, PencilSquareIcon, DocumentDuplicateIcon, ChartBarIcon, SparklesIcon, DocumentTextIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { exportToHTML, exportToPDF, exportToJSON, copyToClipboard } from '../services/export';
import { PresentationMode } from './PresentationMode';
import { VisualEditor } from './editor/VisualEditor';
import { CompanionMaterialsPanel } from './materials/CompanionMaterialsPanel';
import { PollingPanel } from './polling/PollingPanel';
import { AIEnhancementPanel } from './ai/AIEnhancementPanel';
import { SlideEditor } from './SlideEditor';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  onReset: () => void;
  onUpdateHtml?: (html: string) => void; // Callback when HTML is edited
  onPresent?: () => void; // Trigger presentation mode
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

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, onReset, onUpdateHtml, onPresent, onPrintables, className = '' }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportFeedback, setExportFeedback] = useState<string | null>(null);
    const [showPresentationMode, setShowPresentationMode] = useState(false);
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [showMaterialsPanel, setShowMaterialsPanel] = useState(false);
    const [showPollingPanel, setShowPollingPanel] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showSlideEditor, setShowSlideEditor] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

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
    const showFeedback = (message: string) => {
        setExportFeedback(message);
        setTimeout(() => setExportFeedback(null), 2000);
    };

    // Export handlers
    const handleExportHTML = () => {
        if (!creation?.html) return;
        exportToHTML(creation.html, creation.name);
        showFeedback('HTML downloaded!');
        setShowExportMenu(false);
    };

    const handleExportPDF = () => {
        if (!creation?.html) return;
        exportToPDF(creation.html, creation.name);
        showFeedback('Print dialog opened...');
        setShowExportMenu(false);
    };

    const handleExportJSON = () => {
        if (!creation) return;
        exportToJSON(creation.html, creation.name, creation.originalImage, creation.id);
        showFeedback('JSON downloaded!');
        setShowExportMenu(false);
    };

    const handleCopyToClipboard = async () => {
        if (!creation?.html) return;
        const success = await copyToClipboard(creation.html);
        showFeedback(success ? 'Copied to clipboard!' : 'Copy failed');
        setShowExportMenu(false);
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
            {/* Export Feedback Toast */}
            {exportFeedback && (
                <div className="absolute top-12 right-4 bg-green-500/90 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-50 animate-pulse">
                    {exportFeedback}
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

                    {/* Edit Button */}
                    <button
                        onClick={() => setShowVisualEditor(true)}
                        title="Edit Content"
                        className={`flex items-center space-x-1 p-1.5 rounded-md transition-all ${showVisualEditor ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800'}`}
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">Edit</span>
                    </button>

                    {/* Slide Editor Button */}
                    <button
                        onClick={() => setShowSlideEditor(true)}
                        title="Slide-by-Slide Editor"
                        className={`flex items-center space-x-1 p-1.5 rounded-md transition-all ${showSlideEditor ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800'}`}
                    >
                        <RectangleStackIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">Slides</span>
                    </button>

                    {/* AI Enhance Button */}
                    <button
                        onClick={() => setShowAIPanel(true)}
                        title="AI Enhancements"
                        className="flex items-center space-x-1 p-1.5 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-zinc-800 transition-all"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">AI</span>
                    </button>

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

                    {/* Present Button */}
                    <button
                        onClick={() => onPresent ? onPresent() : setShowPresentationMode(true)}
                        title="Present (Fullscreen)"
                        className="flex items-center space-x-1 p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
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
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
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
                                        <span>Print to PDF</span>
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
      <div className="relative w-full flex-1 bg-[#09090b] flex overflow-hidden">
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
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0">
                    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                        Input Source
                    </div>
                    <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
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
            <div className={`relative h-full bg-white transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={creation.html}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
            </div>
          </>
        ) : null}
      </div>

      {/* Presentation Mode Overlay */}
      {showPresentationMode && creation?.html && (
        <PresentationMode
          html={creation.html}
          title={creation.name}
          onClose={() => setShowPresentationMode(false)}
        />
      )}

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
    </div>
  );
};
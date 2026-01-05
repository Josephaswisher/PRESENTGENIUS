/**
 * PRESENTGENIUS - Dr. Swisher's Interactive Canvas
 * Unified lecture creation with integrated medical research
 */
import React, { useState, useEffect, useMemo } from 'react';
import { CenteredInput } from './components/CenteredInput';
import { LivePreview } from './components/LivePreview';
import { ChatPanel, ChatMessage } from './components/ChatPanel';
import { CreationHistory, Creation } from './components/CreationHistory';
import { PrintablesPanel } from './components/PrintablesPanel';
import { SupabaseDataViewer } from './components/SupabaseDataViewer';
import { SettingsPanel } from './components/SettingsPanel';
import { BrowserWarning } from './components/BrowserWarning';
import { VersionHistory } from './components/VersionHistory';
import { versionControl } from './services/version-control';
import { FileInput } from './services/gemini';
import { AIProvider, GenerationPhase, GenerationOptions } from './services/ai-provider';
import { generateParallelCourse } from './services/parallel-generation';
import { savePresentation, isSupabaseConfigured, savePromptHistory, deletePresentation, Presentation } from './services/supabase';
import { backupPresentation, restoreGoogleDriveSession, isGoogleDriveConnected } from './services/google-drive';
import { BackgroundEffects } from './components/BackgroundEffects';
import { Header } from './components/Header';
import { GenerationProgress } from './components/GenerationProgress';
import { ToastContainer } from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { InputDialog } from './components/InputDialog';
import { loadHistory, saveHistory, mergeHistory, migrateOldStorage, getStorageStats } from './lib/storage';
import { generateIntelligentTitle } from './services/title-generator';
import HTMLImportAssistant from './components/HTMLImportAssistant';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { error: showError, success: showSuccess, info: showInfo } = useToast();
  const { confirm } = useConfirm();
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState(false);
  const [isArchiveSidebarOpen, setIsArchiveSidebarOpen] = useState(false);

  // HTML Import Assistant state
  const [showHtmlImport, setShowHtmlImport] = useState(false);

  // AI Provider state - simplified to MiniMax only
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('minimax');
  const [selectedModelId, setSelectedModelId] = useState<string>('MiniMax-M2.1');

  // Chat panel resize state
  const [chatPanelWidth, setChatPanelWidth] = useState(512); // Default 32rem = 512px
  const [isResizing, setIsResizing] = useState(false);
  const MIN_CHAT_WIDTH = 320; // 20rem
  const MAX_CHAT_WIDTH = 800; // 50rem

  // Generation progress state
  const [genPhase, setGenPhase] = useState<GenerationPhase>('starting');
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState('');
  const [streamingHtml, setStreamingHtml] = useState('');
  // DON'T sanitize streaming HTML for maximum performance
  // It's coming from our own trusted MiniMax provider
  // Sanitization happens on final HTML only

  // Presentation mode
  const [showPresentation, setShowPresentation] = useState(false);

  // Printables panel
  const [showPrintables, setShowPrintables] = useState(false);

  // Supabase data viewer
  const [showDataViewer, setShowDataViewer] = useState(false);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const allowStreamingScripts = import.meta.env.VITE_ALLOW_IFRAME_SCRIPTS === 'true';
  const streamingSandbox = `${allowStreamingScripts ? 'allow-scripts ' : ''}allow-same-origin`;

  // Load history on mount
  useEffect(() => {
    const initHistory = async () => {
      // Migrate old storage key if exists
      migrateOldStorage();

      // Load from localStorage
      const localHistory = loadHistory();

      if (localHistory.length > 0) {
        setHistory(localHistory);
        console.log(`[App] Loaded ${localHistory.length} presentations from localStorage`);
      }

      // Log storage stats
      const stats = getStorageStats();
      console.log(`[App] Storage: ${stats.itemCount} items, ${Math.round(stats.estimatedSize / 1024)}KB (${Math.round(stats.usagePercent)}%)`);
    };
    initHistory();
    restoreGoogleDriveSession();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      const result = saveHistory(history);
      if (!result.success) {
        console.error('[App] Failed to save history:', result.message);
        // Could show a toast notification here
      } else if (result.message) {
        console.warn('[App] Storage warning:', result.message);
        // Could show a warning toast here
      }
    }
  }, [history]);

  // Reset chat when switching creations
  useEffect(() => {
    if (activeCreation) {
      setChatMessages([{ role: 'assistant', text: "I've generated your presentation. How would you like to refine it?" }]);
    } else {
      setChatMessages([]);
    }
  }, [activeCreation?.id]);

  // Auto-checkpoint for version control
  useEffect(() => {
    if (activeCreation?.id) {
      // Start auto-checkpoint when presentation is active
      versionControl.startAutoCheckpoint(activeCreation.id, () => ({
        slides: activeCreation.html ? [{ content: activeCreation.html }] : [],
        metadata: {
          name: activeCreation.name,
          timestamp: activeCreation.timestamp,
          activityId: activeCreation.activityId,
          learnerLevel: activeCreation.learnerLevel,
        },
      }));

      // Cleanup on unmount or when switching presentations
      return () => {
        versionControl.stopAutoCheckpoint(activeCreation.id);
      };
    }
  }, [activeCreation?.id, activeCreation?.html]);

  // File to base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert file'));
        }
      };
      reader.onerror = reject;
    });
  };

  // Main generation handler
  const handleGenerate = async (
    promptText: string,
    files: File[] = [],
    provider: AIProvider = 'minimax',
    modelId?: string,
    useParallel: boolean = false
  ) => {
    console.log(`[App] handleGenerate called with provider: ${provider}`); // DEBUG
    const options: GenerationOptions = {
      modelId: modelId || 'MiniMax-M2.1',
    };
    setIsGenerating(true);
    setActiveCreation(null);
    setCurrentProvider(provider);
    setGenProgress(0);
    setGenPhase('starting');
    setGenMessage('Initializing...');
    setStreamingHtml(''); // Reset streaming preview

    try {
      const processedFiles: FileInput[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        processedFiles.push({ base64, mimeType: file.type.toLowerCase() });
      }

      // Always use parallel generation (multi-agent pipeline with flexible slide count)
      const html = await generateParallelCourse(
        promptText,
        processedFiles,
        provider,
        (phase, progress, message, error, partialContent) => {
          setGenPhase(phase as GenerationPhase);
          setGenProgress(progress);
          setGenMessage(message || '');
          if (partialContent) setStreamingHtml(partialContent);
        }
      );

      if (html) {
        const previewImage = processedFiles.length > 0
          ? `data:${processedFiles[0].mimeType};base64,${processedFiles[0].base64}`
          : undefined;

        // Generate intelligent title based on presentation content
        setGenMessage('Generating title...');
        let creationName: string;
        try {
          creationName = await generateIntelligentTitle(html, provider);
          console.log('[App] Generated intelligent title:', creationName);
        } catch (error) {
          console.warn('[App] Title generation failed, using fallback:', error);
          // Fallback to original naming logic
          creationName = files.length > 0
            ? files[0].name + (files.length > 1 ? ` +${files.length - 1}` : '')
            : promptText.slice(0, 50) || 'New Presentation';
        }

        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: creationName,
          html: html,
          originalImage: previewImage,
          timestamp: new Date(),
          activityId: options.activityId,
          learnerLevel: options.learnerLevel as any,
        };

        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);

        // Save to Supabase
        if (isSupabaseConfigured()) {
          savePresentation({
            name: creationName,
            html: html,
            prompt: promptText,
            provider: provider,
            original_image: previewImage,
          });
          savePromptHistory({
            prompt: promptText,
            response_preview: html.slice(0, 500),
            provider: provider,
          });
        }

        // Backup to Google Drive
        if (isGoogleDriveConnected()) {
          backupPresentation(creationName, html, promptText);
        }
      }
    } catch (error: any) {
      console.error("Generation failed:", error);

      // Use formatted message if available (from new error handler)
      if (error.formattedMessage) {
        showError(error.formattedMessage);
      } else if (error.validation?.suggestions) {
        // Fallback: format manually if validation is present
        const suggestions = error.validation.suggestions.join('\n');
        showError(`${error.message}\n\nWhat you can try:\n${suggestions}`);
      } else if (error.message && (error.message.includes("API key") || error.message.includes("not configured"))) {
        // Legacy API key error handling
        showError(`${error.message}\n\nPlease check your .env.local file and ensure your API key is properly configured. See .env.example for details.`);
      } else {
        // Generic error
        showError(`Generation failed: ${error.message || "Something went wrong. Please try again."}`);
      }
    } finally {
      setIsGenerating(false);
      setGenProgress(100);
      setGenPhase('complete');
      // Clear streaming preview after a brief delay
      setTimeout(() => setStreamingHtml(''), 1000);
    }
  };

  // Chat refinement handler
  const handleChatRefine = async (message: string, provider: AIProvider, modelId: string) => {
    if (!activeCreation) return;

    console.log('🔵 [Chat Refinement] Starting refinement with parallel generation...');
    console.log('📝 User message:', message);
    console.log('📄 Current HTML length:', activeCreation.html.length);
    console.log('🤖 Provider:', provider);
    console.log('🎯 Model:', modelId);

    setChatMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text: message }]);
    setIsRefining(true);

    try {
      // Build refinement prompt for parallel generation
      const refinementPrompt = `Previous presentation exists for: "${activeCreation.name}"

User's refinement request: "${message}"

Please generate an improved version of the presentation incorporating this feedback while maintaining the overall structure and quality.`;

      console.log('⏳ Regenerating with parallel pipeline...');

      // Re-generate entire presentation with parallel pipeline
      const refinedHtml = await generateParallelCourse(
        refinementPrompt,
        [], // No files for refinement
        provider,
        (phase, progress, msg, error, partialContent) => {
          setGenPhase(phase as GenerationPhase);
          setGenProgress(progress);
          setGenMessage(msg || 'Refining presentation...');
          if (partialContent) setStreamingHtml(partialContent);
        }
      );

      console.log('✅ Refinement complete, length:', refinedHtml.length);

      // Update the presentation with regenerated HTML
      const updatedCreation = { ...activeCreation, html: refinedHtml };
      setActiveCreation(updatedCreation);
      setHistory(prev => prev.map(item => item.id === updatedCreation.id ? updatedCreation : item));

      setChatMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: "✅ I've regenerated the presentation with your requested changes. Check the live preview!"
      }]);

    } catch (error: any) {
      console.error("❌ [Chat Refinement] Refinement failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        validation: error.validation,
        name: error.name
      });

      // Show detailed error to user - use formatted message if available
      let errorMessage: string;

      if (error.formattedMessage) {
        // New error handler provides formatted message
        errorMessage = error.formattedMessage;
      } else if (error.validation?.suggestions) {
        // Format manually if validation is present
        const suggestions = error.validation.suggestions
          .map((s: string, i: number) => `${i + 1}. ${s}`)
          .join('\n');
        errorMessage = `${error.message}\n\nWhat you can try:\n${suggestions}`;
      } else {
        // Fallback to basic message
        errorMessage = error.message || 'Unknown error - check console for details';
      }

      setChatMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `❌ Refinement Error:\n${errorMessage}`
      }]);
    } finally {
      console.log('🏁 [Chat Refinement] Finished (isRefining = false)');
      setIsRefining(false);
      // Clear streaming preview
      setStreamingHtml('');
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleImportHtml = async (formattedHtml: string) => {
    try {
      showInfo('Creating presentation from imported HTML...');

      // Generate intelligent title from the HTML content
      const title = await generateIntelligentTitle(formattedHtml);

      // Create a new creation from the imported HTML
      const newCreation: Creation = {
        id: Date.now().toString(),
        name: title || 'Imported Presentation',
        html: formattedHtml,
        timestamp: Date.now(),
        activityId: 'imported-content',
        learnerLevel: 'general',
      };

      // Add to history
      setHistory(prev => [newCreation, ...prev]);

      // Set as active creation
      setActiveCreation(newCreation);

      // Save to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await savePresentation(newCreation);
          showSuccess('Imported presentation saved to cloud');
        } catch (err) {
          console.error('[App] Failed to save imported presentation to cloud:', err);
        }
      }

      // Backup to Google Drive if connected
      if (isGoogleDriveConnected()) {
        try {
          await backupPresentation(newCreation);
        } catch (err) {
          console.error('[App] Failed to backup imported presentation to Drive:', err);
        }
      }

      showSuccess(`Successfully imported: ${newCreation.name}`);
    } catch (error) {
      console.error('[App] Failed to import HTML:', error);
      showError('Failed to import HTML. Please try again.');
    }
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleDeleteCreation = async (creation: Creation) => {
    // Confirm deletion
    const confirmed = await confirm({
      title: 'Delete Presentation',
      message: `Delete "${creation.name}"? This cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    // Delete from Supabase if configured
    if (isSupabaseConfigured()) {
      const success = await deletePresentation(creation.id);
      if (success) {
        console.log('[App] Deleted presentation from Supabase:', creation.id);
      } else {
        console.error('[App] Failed to delete from Supabase:', creation.id);
        showError('Failed to delete from cloud storage');
        return; // Don't delete locally if cloud delete failed
      }
    }

    // Remove from local state
    setHistory(prev => prev.filter(item => item.id !== creation.id));

    // Clear active creation if it's the one being deleted
    if (activeCreation?.id === creation.id) {
      setActiveCreation(null);
      setChatMessages([]);
    }

    console.log('[App] Deleted presentation from history:', creation.id);
  };

  // Chat panel resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, newWidth));
      setChatPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH]);

  const handleUpdateHtml = (updatedHtml: string) => {
    if (!activeCreation) return;
    const updatedCreation = { ...activeCreation, html: updatedHtml };
    setActiveCreation(updatedCreation);
    setHistory(prev => prev.map(item => item.id === updatedCreation.id ? updatedCreation : item));
  };

  const handleLoadFromSupabase = (presentation: Presentation) => {
    // Convert Supabase Presentation to local Creation type
    const creation: Creation = {
      id: presentation.id,
      name: presentation.name,
      html: presentation.html,
      originalImage: presentation.original_image,
      timestamp: new Date(presentation.created_at),
      activityId: undefined,
      learnerLevel: undefined,
    };

    setActiveCreation(creation);
    setShowDataViewer(false);

    // Merge with local history (no duplicates, keeps most recent)
    setHistory(prev => mergeHistory(prev, [creation]));
  };

  const handleRegenerateAllTitles = async () => {
    if (history.length === 0) {
      showInfo('No presentations to update');
      return;
    }

    const confirmed = await confirm({
      title: 'Regenerate All Titles',
      message: `Update ${history.length} presentation${history.length > 1 ? 's' : ''} with intelligent AI-generated titles?`,
      variant: 'info',
      confirmText: 'Update All',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setIsRegeneratingTitles(true);
    showInfo(`Regenerating titles for ${history.length} presentations...`);

    const updatedHistory: Creation[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < history.length; i++) {
      const item = history[i];

      try {
        console.log(`[TitleMigration] Processing ${i + 1}/${history.length}: ${item.name}`);

        // Generate intelligent title
        const newTitle = await generateIntelligentTitle(item.html, currentProvider);

        // Only update if we got a different, valid title
        if (newTitle && newTitle !== item.name && newTitle.length >= 3) {
          updatedHistory.push({ ...item, name: newTitle });
          successCount++;
          console.log(`[TitleMigration] ✓ Updated: "${item.name}" → "${newTitle}"`);
        } else {
          updatedHistory.push(item);
          console.log(`[TitleMigration] ⊘ Kept original: "${item.name}"`);
        }
      } catch (error) {
        console.error(`[TitleMigration] ✗ Failed for "${item.name}":`, error);
        updatedHistory.push(item); // Keep original on error
        failCount++;
      }

      // Show progress every 3 items
      if ((i + 1) % 3 === 0 || i === history.length - 1) {
        showInfo(`Processing... ${i + 1}/${history.length} titles`);
      }
    }

    // Update history with new titles
    setHistory(updatedHistory);
    setIsRegeneratingTitles(false);

    // Show results
    if (successCount > 0) {
      showSuccess(`✓ Updated ${successCount} title${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    } else if (failCount > 0) {
      showError(`Failed to update titles. Please try again.`);
    } else {
      showInfo('No titles needed updating');
    }

    console.log(`[TitleMigration] Complete: ${successCount} updated, ${failCount} failed, ${history.length - successCount - failCount} unchanged`);
  };

  const isWorkspaceActive = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-50 selection:bg-cyan-500/30 overflow-hidden relative flex flex-col font-['Outfit']">
      <BrowserWarning />
      <BackgroundEffects />

      {!showPresentation && (
        <Header
          activeCreation={activeCreation}
          onBack={handleReset}
          onPresent={() => setShowPresentation(true)}
          onShowDataViewer={() => setShowDataViewer(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowVersionHistory={() => setShowVersionHistory(true)}
          onShowHtmlImport={() => setShowHtmlImport(true)}
          onExport={() => {
            if (!activeCreation) return;
            const blob = new Blob([JSON.stringify(activeCreation)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeCreation.name.replace(/\s+/g, '_')}.json`;
            a.click();
          }}
        />
      )}

      {/* Landing / Centered Input View */}
      <div
        className={`
          absolute inset-0 z-10 flex flex-col overflow-y-auto scroll-smooth-touch
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          snap-y overscroll-contain scrollbar-thin
          ${isWorkspaceActive
            ? 'opacity-0 scale-95 pointer-events-none translate-y-8'
            : 'opacity-100 scale-100 translate-y-0'
          }
        `}
      >
        <CenteredInput onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Left Sidebar Archive */}
        {history.length > 0 && (
          <>
            {/* Overlay */}
            {isArchiveSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={() => setIsArchiveSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div
              className={`fixed top-0 left-0 h-full w-96 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 z-50
                         transform transition-transform duration-300 ease-out flex flex-col
                         ${isArchiveSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Archive ({history.length})
                </h2>
                <button
                  onClick={() => setIsArchiveSidebarOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Close sidebar"
                >
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Regenerate Titles Button */}
              <div className="px-4 pt-3 pb-2">
                <button
                  onClick={handleRegenerateAllTitles}
                  disabled={isRegeneratingTitles || isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20
                           text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50
                           rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerate all titles with AI"
                >
                  {isRegeneratingTitles ? (
                    <>
                      <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Regenerate Titles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scrollable History */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <CreationHistory
                  history={history}
                  onSelect={(creation) => {
                    handleSelectCreation(creation);
                    setIsArchiveSidebarOpen(false); // Close sidebar after selection
                  }}
                  onDelete={handleDeleteCreation}
                />
              </div>
            </div>

            {/* Floating Toggle Button */}
            {!isArchiveSidebarOpen && (
              <button
                onClick={() => setIsArchiveSidebarOpen(true)}
                className="fixed left-4 top-20 z-30 p-3 bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500
                         rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300
                         hover:scale-105 active:scale-95 group"
                title="Open archive"
              >
                <div className="relative">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {/* Notification badge */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {history.length > 99 ? '99+' : history.length}
                  </div>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Workspace View (Preview + Chat Assistant) */}
      <div
        className={`
          fixed inset-0 z-40 flex flex-col md:flex-row bg-zinc-950 pt-16 overflow-hidden
          transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
          ${isWorkspaceActive
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
          }
        `}
      >
        {/* Left: Live Preview */}
        <div className="flex-1 h-full relative min-w-0 md:border-r border-zinc-800 overflow-hidden">
          <LivePreview
            creation={activeCreation}
            isLoading={isGenerating}
            onReset={handleReset}
            onUpdateHtml={handleUpdateHtml}
            onPresent={() => setShowPresentation(true)}
            onPrintables={() => setShowPrintables(true)}
            className="w-full h-full rounded-none border-none"
          />
        </div>

        {/* Right: Chat Assistant (only show after generation completes, hidden on mobile) */}
        {activeCreation && !isGenerating && (
          <div
            className="hidden md:flex flex-shrink-0 h-full flex-col bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden relative"
            style={{ width: `${chatPanelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors ${
                isResizing ? 'bg-cyan-500' : ''
              }`}
              title="Drag to resize chat panel"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-zinc-600 hover:bg-cyan-500 transition-colors" />
            </div>

            <div className="px-4 py-3 border-b border-zinc-800/50">
              <h3 className="text-sm font-semibold text-white">Chat Assistant</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Refine your presentation • Drag edge to resize</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleChatRefine}
                isProcessing={isRefining}
                selectedProvider={currentProvider}
                selectedModelId={selectedModelId}
                onProviderChange={setCurrentProvider}
                onModelChange={setSelectedModelId}
                currentHtmlLength={activeCreation?.html.length || 0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Printables Panel */}
      {activeCreation && (
        <PrintablesPanel
          isOpen={showPrintables}
          onClose={() => setShowPrintables(false)}
          lectureContent={activeCreation.html}
          title={activeCreation.name}
        />
      )}

      {/* Supabase Data Viewer */}
      <SupabaseDataViewer
        isOpen={showDataViewer}
        onClose={() => setShowDataViewer(false)}
        onLoadPresentation={handleLoadFromSupabase}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* HTML Import Assistant */}
      <HTMLImportAssistant
        isOpen={showHtmlImport}
        onClose={() => setShowHtmlImport(false)}
        onImport={handleImportHtml}
      />

      {/* Generation Progress */}
      <GenerationProgress
        isVisible={isGenerating}
        phase={genPhase}
        progress={genProgress}
        message={genMessage}
      />

      {/* Streaming Preview - Live HTML Preview */}
      {isGenerating && streamingHtml && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-white">Live Preview - Streaming Content</h3>
              </div>
              <div className="text-sm text-zinc-400">
                {Math.round(streamingHtml.length / 1024)}KB received
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden p-4">
              <iframe
                srcDoc={streamingHtml}
                className="w-full h-full bg-white rounded-lg"
                sandbox={streamingSandbox}
                title="Streaming Preview"
                key={`stream-${streamingHtml.length}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Dialog Overlays */}
      <ConfirmDialog />
      <InputDialog />

      {/* Version History */}
      {showVersionHistory && activeCreation && (
        <VersionHistory
          presentationId={activeCreation.id}
          currentSnapshot={{
            slides: activeCreation.html ? [{ content: activeCreation.html }] : [],
            metadata: {
              name: activeCreation.name,
              timestamp: activeCreation.timestamp,
              activityId: activeCreation.activityId,
              learnerLevel: activeCreation.learnerLevel,
            },
          }}
          onRestore={(snapshot) => {
            // Restore the presentation from snapshot
            setActiveCreation({
              ...activeCreation,
              html: snapshot.slides?.[0]?.content || activeCreation.html,
              name: snapshot.metadata?.name || activeCreation.name,
            });
            showSuccess('Presentation restored successfully');
            setShowVersionHistory(false);
          }}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
};

export default App;

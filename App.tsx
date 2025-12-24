/**
 * PRESENTGENIUS - Dr. Swisher's Interactive Canvas
 * Unified lecture creation with integrated medical research
 */
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { LivePreview } from './components/LivePreview';
import { ChatPanel, ChatMessage } from './components/ChatPanel';
import { CreationHistory, Creation } from './components/CreationHistory';
import { PresentationMode } from './components/PresentationMode';
import { DrSwisherResearchPanel } from './components/DrSwisherResearchPanel';
import { BoardQuestionsPanel } from './components/BoardQuestionsPanel';
import { PrintablesPanel } from './components/PrintablesPanel';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { FileInput, GenerationOptions } from './services/gemini';
import { generateWithProvider, refineWithProvider, AIProvider, GenerationPhase } from './services/ai-provider';
import { savePresentation, isSupabaseConfigured, savePromptHistory } from './services/supabase';
import { backupPresentation, restoreGoogleDriveSession, isGoogleDriveConnected } from './services/google-drive';
import { GenerationProgress } from './components/GenerationProgress';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // AI Provider state
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');

  // Generation progress state
  const [genPhase, setGenPhase] = useState<GenerationPhase>('starting');
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState('');

  // Presentation mode
  const [showPresentation, setShowPresentation] = useState(false);

  // Sidebar tab in workspace
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'research' | 'questions'>('research');

  // Printables panel
  const [showPrintables, setShowPrintables] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }
    };
    initHistory();
    restoreGoogleDriveSession();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('gemini_app_history', JSON.stringify(history));
      } catch (e) {
        console.warn("Local storage error", e);
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
    options: GenerationOptions = {},
    provider: AIProvider = 'gemini'
  ) => {
    setIsGenerating(true);
    setActiveCreation(null);
    setCurrentProvider(provider);
    setGenProgress(0);
    setGenPhase('starting');
    setGenMessage('Initializing...');

    try {
      const processedFiles: FileInput[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        processedFiles.push({ base64, mimeType: file.type.toLowerCase() });
      }

      const html = await generateWithProvider(
        provider,
        promptText,
        processedFiles,
        options,
        (phase, progress, message) => {
          setGenPhase(phase);
          setGenProgress(progress);
          setGenMessage(message || '');
        }
      );

      if (html) {
        const previewImage = processedFiles.length > 0
          ? `data:${processedFiles[0].mimeType};base64,${processedFiles[0].base64}`
          : undefined;

        const creationName = files.length > 0
          ? files[0].name + (files.length > 1 ? ` +${files.length - 1}` : '')
          : promptText.slice(0, 50) || 'New Presentation';

        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: creationName,
          html: html,
          originalImage: previewImage,
          timestamp: new Date(),
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
      if (error.message && (error.message.includes("VITE_GEMINI_API_KEY") || error.message.includes("API key"))) {
        alert("Missing API Key!\n\nPlease check your .env file and ensure VITE_GEMINI_API_KEY or VITE_ANTHROPIC_API_KEY is set.\n\nSee .env.example for details.");
      } else {
        alert(`Generation failed: ${error.message || "Something went wrong. Please try again."}`);
      }
    } finally {
      setIsGenerating(false);
      setGenProgress(100);
      setGenPhase('complete');
    }
  };

  // Chat refinement handler
  const handleChatRefine = async (message: string) => {
    if (!activeCreation) return;

    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setIsRefining(true);

    try {
      const updatedHtml = await refineWithProvider(currentProvider, activeCreation.html, message);
      const updatedCreation = { ...activeCreation, html: updatedHtml };
      setActiveCreation(updatedCreation);
      setHistory(prev => prev.map(item => item.id === updatedCreation.id ? updatedCreation : item));
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Done! I've updated the presentation." }]);
    } catch (error) {
      console.error("Refinement failed:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, couldn't update. Please try again." }]);
    } finally {
      setIsRefining(false);
    }
  };

  // Canvas generation handler
  const handleCanvasGenerate = async (canvasDoc: any) => {
    const sectionsText = canvasDoc.sections.map((section: any, i: number) => {
      let text = `\n## Section ${i + 1}: ${section.title}\n`;
      text += `Type: ${section.type}, Slides: ${section.slideCount}\n`;
      if (section.keyPoints?.length > 0) {
        text += `Key Points: ${section.keyPoints.join(', ')}\n`;
      }
      if (section.content) {
        text += `Content:\n${section.content}\n`;
      }
      if (section.research) {
        text += `\nResearch:\n${section.research.content?.slice(0, 1000) || ''}\n`;
      }
      if (section.selectedQuestionId && section.followUpQuestions?.length > 0) {
        const selectedQ = section.followUpQuestions.find((q: any) => q.id === section.selectedQuestionId);
        if (selectedQ) {
          text += `\n🎯 TRANSITION: "${selectedQ.question}"\n`;
        }
      }
      return text;
    }).join('\n---\n');

    const fullPrompt = `Create a Socratic-style medical education presentation:

TITLE: ${canvasDoc.topic} - Lecture
TOPIC: ${canvasDoc.topic}
TARGET AUDIENCE: ${canvasDoc.targetAudience}
DURATION: ${canvasDoc.duration} minutes

SECTIONS:
${sectionsText}

INSTRUCTIONS:
1. Use Socratic method - guide discovery with questions
2. Each section should flow naturally to the next
3. Include transition questions prominently
4. Make it interactive and clinically relevant
5. Use the research content for evidence-based accuracy

Generate an engaging, visually polished presentation.`;

    await handleGenerate(fullPrompt, [], {}, currentProvider);
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        if (parsed.html && parsed.name) {
          const importedCreation: Creation = {
            ...parsed,
            timestamp: new Date(parsed.timestamp || Date.now()),
            id: parsed.id || crypto.randomUUID()
          };

          setHistory(prev => {
            const exists = prev.some(c => c.id === importedCreation.id);
            return exists ? prev : [importedCreation, ...prev];
          });
          setActiveCreation(importedCreation);
        } else {
          alert("Invalid file format.");
        }
      } catch (err) {
        alert("Failed to import.");
      }
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isWorkspaceActive = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-blue-500/30 overflow-hidden relative flex flex-col">

      {/* Landing / Interactive Canvas View */}
      <div
        className={`
          absolute inset-0 z-10 flex flex-col overflow-hidden
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isWorkspaceActive
            ? 'opacity-0 scale-95 pointer-events-none translate-y-8'
            : 'opacity-100 scale-100 translate-y-0'
          }
        `}
      >
        {/* Interactive Canvas - Full Screen */}
        <InteractiveCanvas
          onGenerateSlides={handleCanvasGenerate}
          currentProvider={currentProvider}
          onProviderChange={setCurrentProvider}
        />

        {/* History Bar at Bottom */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
          <div className="px-4 py-3">
            <CreationHistory history={history} onSelect={handleSelectCreation} />
          </div>
        </div>
      </div>

      {/* Workspace View (Chat + Preview) */}
      <div
        className={`
          fixed inset-0 z-40 flex bg-zinc-950
          transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
          ${isWorkspaceActive
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full pointer-events-none'
          }
        `}
      >
        {/* Left: Tabbed Sidebar */}
        {activeCreation && (
          <div className="w-80 md:w-96 flex-shrink-0 h-full border-r border-zinc-800 z-50 flex flex-col bg-zinc-950">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-zinc-800 shrink-0">
              <button
                onClick={() => setSidebarTab('research')}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${sidebarTab === 'research'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-zinc-500 hover:text-white'
                  }`}
              >
                🔍 Research
              </button>
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${sidebarTab === 'chat'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-zinc-500 hover:text-white'
                  }`}
              >
                💬 Refine
              </button>
              <button
                onClick={() => setSidebarTab('questions')}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${sidebarTab === 'questions'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                    : 'text-zinc-500 hover:text-white'
                  }`}
              >
                ❓ Board Qs
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'research' && (
                <div className="h-full overflow-y-auto p-3">
                  <DrSwisherResearchPanel
                    compact
                    onInsertContent={(content, citations) => {
                      const citationText = citations.length > 0
                        ? `\n\nSources:\n${citations.slice(0, 3).join('\n')}`
                        : '';
                      handleChatRefine(`Add this research content:\n\n${content}${citationText}`);
                      setSidebarTab('chat');
                    }}
                  />
                </div>
              )}
              {sidebarTab === 'chat' && (
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleChatRefine}
                  isProcessing={isRefining}
                />
              )}
              {sidebarTab === 'questions' && (
                <div className="h-full overflow-y-auto p-3">
                  <BoardQuestionsPanel
                    provider={currentProvider}
                    onInsertQuestions={(questions) => {
                      const qText = questions.map((q, i) =>
                        `Q${i + 1}: ${q.stem}\n${q.options.map(o => `${o.letter}. ${o.text}`).join('\n')}`
                      ).join('\n\n');
                      handleChatRefine(`Add these board-style questions:\n\n${qText}`);
                      setSidebarTab('chat');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Live Preview */}
        <div className="flex-1 h-full relative min-w-0">
          <LivePreview
            creation={activeCreation}
            isLoading={isGenerating}
            onReset={handleReset}
            onPresent={() => setShowPresentation(true)}
            onPrintables={() => setShowPrintables(true)}
            className="w-full h-full rounded-none border-none"
          />
        </div>
      </div>

      {/* Import Button */}
      {!isWorkspaceActive && (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 backdrop-blur rounded-lg
                       text-zinc-400 hover:text-white transition-all text-sm"
            title="Import Artifact"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
        </div>
      )}

      {/* Presentation Mode */}
      {showPresentation && activeCreation && (
        <PresentationMode
          html={activeCreation.html}
          title={activeCreation.name}
          onClose={() => setShowPresentation(false)}
        />
      )}

      {/* Printables Panel */}
      {activeCreation && (
        <PrintablesPanel
          isOpen={showPrintables}
          onClose={() => setShowPrintables(false)}
          lectureContent={activeCreation.html}
          title={activeCreation.name}
        />
      )}

      {/* Generation Progress */}
      <GenerationProgress
        isVisible={isGenerating}
        phase={genPhase}
        progress={genProgress}
        message={genMessage}
      />
    </div>
  );
};

export default App;

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
import { BackgroundEffects } from './components/BackgroundEffects';
import { Header } from './components/Header';
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

    setChatMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text: message }]);
    setIsRefining(true);

    try {
      // Enhanced system prompt for refinement with copilot capabilities
      const systemPrompt = `You are Dr. Swisher's Lecture Copilot. You are refining an interactive medical education presentation.

CURRENT TOPIC: ${activeCreation.name}
AUDIENCE: ${activeCreation.activityId || 'Medical Education'} (Learner Level: ${activeCreation.learnerLevel || 'Residents'})

Your goal is to satisfy the user's request while maintaining medical accuracy and high-quality UI.

INSTRUCTION: "${message}"

CAPABILITIES:
1. **Direct HTML Refinement**: Update the HTML code directly.
2. **Structural Actions**: If the user wants to add/remove sections or significantly change the outline, include an action tag.

AVAILABLE ACTIONS:
- [ACTION:GENERATE_SLIDES] - Use this if the user wants to completely rebuild the presentation or add large amounts of new content from research.
- [ACTION:RESEARCH:topic] - Trigger a research deep-dive for a specific medical topic.

If you update the code, return the full new HTML.
If you use an action, include the [ACTION:...] tag in your response.

ALWAYS maintain the premium Tailwind/medical aesthetic.`;

      const response = await refineWithProvider(currentProvider, activeCreation.html, `${systemPrompt}\n\nUSER INSTRUCTION: ${message}`);

      let cleanHtml = response;
      let action: string | undefined;

      // Robust action parsing
      const actionMatch = response.match(/\[ACTION:(\w+)(?::([\s\S]*?))?\]/);
      if (actionMatch) {
        action = actionMatch[1];
        // Capture everything between [ACTION:... ]
        const fullActionTag = actionMatch[0];
        cleanHtml = response.replace(fullActionTag, '').trim();
      }

      // Final cleanup of the HTML (ensure it doesn't have markdown wrappers)
      const htmlStart = cleanHtml.indexOf('<!DOCTYPE');
      const htmlEnd = cleanHtml.lastIndexOf('</html>');
      if (htmlStart !== -1 && htmlEnd !== -1) {
        cleanHtml = cleanHtml.slice(htmlStart, htmlEnd + 7);
      }

      // If response is just an action or empty text with action, we might not have HTML
      if (cleanHtml.startsWith('<!DOCTYPE') || cleanHtml.includes('<html')) {
        const updatedCreation = { ...activeCreation, html: cleanHtml };
        setActiveCreation(updatedCreation);
        setHistory(prev => prev.map(item => item.id === updatedCreation.id ? updatedCreation : item));

        setChatMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: "I've updated the presentation as requested. You can see the changes in the live preview."
        }]);
      } else if (action === 'GENERATE_SLIDES') {
        // To rebuild, we would ideally need the canvas doc, but we can try to infer or ask the user
        setChatMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: "That's a significant change! I'll need to rebuild the slide deck to accommodate that properly. Would you like me to go ahead and regenerate the outline?"
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: cleanHtml || "I've processed your request."
        }]);
      }

    } catch (error: any) {
      console.error("Refinement failed:", error);
      setChatMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `Sorry, I encountered an error while updating: ${error.message || 'Unknown error'}`
      }]);
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
    <div className="h-[100dvh] bg-zinc-950 text-zinc-50 selection:bg-cyan-500/30 overflow-hidden relative flex flex-col font-['Outfit']">
      <BackgroundEffects />

      {!showPresentation && (
        <Header
          activeCreation={activeCreation}
          onBack={handleReset}
          onPresent={() => setShowPresentation(true)}
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

      {/* Landing / Interactive Canvas View */}
      <div
        className={`
          absolute inset-0 z-10 flex flex-col overflow-hidden pt-16
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
        <div className="flex-shrink-0 border-t border-white/5 bg-zinc-900/40 backdrop-blur-xl">
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

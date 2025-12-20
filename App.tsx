/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea, PlanGenerationConfig } from './components/InputArea';
import { CompactInput, GenerateConfig } from './components/CompactInput';
import { LivePreview } from './components/LivePreview';
import { ChatPanel, ChatMessage } from './components/ChatPanel';
import { CreationHistory, Creation } from './components/CreationHistory';
import { PlanPreviewPanel } from './components/PlanPreviewPanel';
import { PresentationMode } from './components/PresentationMode';
import { ResearchPanel } from './components/ResearchPanel';
import { BoardQuestionsPanel } from './components/BoardQuestionsPanel';
import { SocraticCanvas } from './components/CanvasMode/SocraticCanvas';
import { PrintablesPanel } from './components/PrintablesPanel';
import { LectureBuilder } from './components/LectureBuilder';
import { FileInput, GenerationOptions } from './services/gemini';
import { generateWithProvider, refineWithProvider, AIProvider, GenerationPhase } from './services/ai-provider';
import { generatePlan, GenerationPlan } from './services/plan-generator';
import { savePresentation, isSupabaseConfigured, savePromptHistory } from './services/supabase';
import { backupPresentation, restoreGoogleDriveSession, isGoogleDriveConnected } from './services/google-drive';
import { GenerationProgress } from './components/GenerationProgress';
import { ArrowUpTrayIcon, CloudIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Plan Mode State
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<GenerationPlan | null>(null);
  const [planConfig, setPlanConfig] = useState<PlanGenerationConfig | null>(null);
  
  // AI Provider state (for refinements to use the same provider)
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('auto');
  
  // Generation progress state
  const [genPhase, setGenPhase] = useState<GenerationPhase>('starting');
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState('');
  
  // UI mode - compact (default) or detailed
  const [useCompactMode, setUseCompactMode] = useState(true);
  
  // Presentation mode
  const [showPresentation, setShowPresentation] = useState(false);
  
  // Sidebar tab in workspace
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'research' | 'questions'>('chat');
  
  // Canvas mode (pre-generation planning)
  const [showCanvasMode, setShowCanvasMode] = useState(false);
  
  // Printables panel
  const [showPrintables, setShowPrintables] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else {
        // If no history (new user or cleared), load examples
        try {
           const exampleUrls = [
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/vibecode-blog.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/cassette.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/chess.json'
           ];

           const examples = await Promise.all(exampleUrls.map(async (url) => {
               const res = await fetch(url);
               if (!res.ok) return null;
               const data = await res.json();
               return {
                   ...data,
                   timestamp: new Date(data.timestamp || Date.now()),
                   id: data.id || crypto.randomUUID()
               };
           }));
           
           const validExamples = examples.filter((e): e is Creation => e !== null);
           setHistory(validExamples);
        } catch (e) {
            console.error("Failed to load examples", e);
        }
      }
    };

    initHistory();
    
    // Restore Google Drive session if previously connected
    restoreGoogleDriveSession();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
        try {
            localStorage.setItem('gemini_app_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Local storage full or error saving history", e);
        }
    }
  }, [history]);

  // Reset chat when switching creations
  useEffect(() => {
    if (activeCreation) {
        setChatMessages([{ role: 'assistant', text: "I've generated the initial version. How would you like to refine it?" }]);
    } else {
        setChatMessages([]);
    }
  }, [activeCreation?.id]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, files: File[], options: GenerationOptions = {}, provider: AIProvider = 'auto') => {
    setIsGenerating(true);
    setActiveCreation(null);
    setCurrentProvider(provider);
    setGenProgress(0);
    setGenPhase('starting');
    setGenMessage('Initializing...');

    try {
      const processedFiles: FileInput[] = [];

      // Process all files
      for (const file of files) {
          const base64 = await fileToBase64(file);
          processedFiles.push({
              base64,
              mimeType: file.type.toLowerCase()
          });
      }

      // Use unified provider service with progress callbacks
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
          ? files[0].name + (files.length > 1 ? ` +${files.length-1}` : '') 
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

        // Save to Supabase (non-blocking)
        if (isSupabaseConfigured()) {
          savePresentation({
            name: creationName,
            html: html,
            prompt: promptText,
            provider: provider,
            original_image: previewImage,
          }).then(saved => {
            if (saved) console.log('[Supabase] Presentation saved');
          });

          savePromptHistory({
            prompt: promptText,
            response_preview: html.slice(0, 500),
            provider: provider,
          });
        }

        // Backup to Google Drive (non-blocking)
        if (isGoogleDriveConnected()) {
          backupPresentation(creationName, html, promptText).then(link => {
            if (link) console.log('[Google Drive] Backed up:', link);
          });
        }
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong while bringing your file to life. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenProgress(100);
      setGenPhase('complete');
    }
  };

  const handleChatRefine = async (message: string) => {
      if (!activeCreation) return;

      // Add user message
      setChatMessages(prev => [...prev, { role: 'user', text: message }]);
      setIsRefining(true);

      try {
          // Call API to refine HTML using same provider as generation
          const updatedHtml = await refineWithProvider(currentProvider, activeCreation.html, message);
          
          // Update active creation
          const updatedCreation = { ...activeCreation, html: updatedHtml };
          setActiveCreation(updatedCreation);

          // Update history item
          setHistory(prev => prev.map(item => item.id === updatedCreation.id ? updatedCreation : item));

          setChatMessages(prev => [...prev, { role: 'assistant', text: "I've updated the content based on your request." }]);

      } catch (error) {
          console.error("Refinement failed:", error);
          setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't update the artifact. Please try again." }]);
      } finally {
          setIsRefining(false);
      }
  };

  // Handler for compact input
  const handleCompactGenerate = async (config: GenerateConfig) => {
    await handleGenerate(
      config.prompt,
      config.files,
      { activityId: undefined, learnerLevel: undefined },
      config.provider
    );
  };

  // Handler for Canvas Mode V2 generation (Socratic flow)
  const handleCanvasGenerate = async (canvasDoc: any) => {
    setShowCanvasMode(false);
    
    // Build comprehensive prompt from canvas document with Socratic flow
    const sectionsText = canvasDoc.sections.map((section: any, i: number) => {
      let sectionText = `\n## Section ${i + 1}: ${section.title}\n`;
      sectionText += `Type: ${section.type}, Slides: ${section.slideCount}\n`;
      
      if (section.keyPoints?.length > 0) {
        sectionText += `Key Points: ${section.keyPoints.join(', ')}\n`;
      }
      if (section.content) {
        sectionText += `Content:\n${section.content}\n`;
      }
      
      // Include the selected Socratic question as a transition
      if (section.selectedQuestion && section.followUpQuestions?.length > 0) {
        const selectedQ = section.followUpQuestions.find((q: any) => q.id === section.selectedQuestion);
        if (selectedQ) {
          sectionText += `\n🎯 TRANSITION QUESTION (end this section with): "${selectedQ.question}"\n`;
        }
      }
      
      return sectionText;
    }).join('\n---\n');

    const fullPrompt = `Create a Socratic-style medical education presentation:

TITLE: ${canvasDoc.title || canvasDoc.topic + ' - Lecture'}
TOPIC: ${canvasDoc.topic}
TARGET AUDIENCE: ${canvasDoc.targetAudience}
TOTAL DURATION: ${canvasDoc.totalDuration} minutes

SECTIONS WITH SOCRATIC FLOW:
${sectionsText}

IMPORTANT INSTRUCTIONS:
1. Each section should end with its TRANSITION QUESTION displayed prominently
2. The transition question leads naturally into the next section
3. Create a narrative flow where each question builds curiosity for what's next
4. Use the Socratic method - guide discovery rather than just presenting facts
5. Make it interactive and engaging for the target audience

Generate an interactive, visually engaging presentation with this Socratic question flow.`;

    await handleGenerate(fullPrompt, [], {}, currentProvider);
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
    // Also clear plan mode
    setCurrentPlan(null);
    setPlanConfig(null);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  // Plan Mode Handlers
  const handleCreatePlan = async (config: PlanGenerationConfig) => {
    setIsCreatingPlan(true);
    setPlanConfig(config);

    try {
      const plan = await generatePlan({
        prompt: config.prompt,
        title: config.title,
        selectedFormats: config.selectedFormats,
        selectedSubOptions: config.selectedSubOptions,
        selectedSupplementary: config.selectedSupplementary,
        selectedModifiers: config.selectedModifiers,
        selectedStyle: config.selectedStyle,
        learnerLevel: config.learnerLevel,
        activityType: config.activityType,
      });

      setCurrentPlan(plan);
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Failed to create plan. Please try again.');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handlePlanBack = () => {
    setCurrentPlan(null);
    setPlanConfig(null);
  };

  const handlePlanRegenerate = async (additionalContext: string) => {
    if (!planConfig) return;

    setIsCreatingPlan(true);

    try {
      const updatedPrompt = additionalContext
        ? `${planConfig.prompt}\n\nAdditional context:\n${additionalContext}`
        : planConfig.prompt;

      const plan = await generatePlan({
        ...planConfig,
        prompt: updatedPrompt,
      });

      setCurrentPlan(plan);
      // Update config with additional context
      setPlanConfig(prev => prev ? { ...prev, prompt: updatedPrompt } : null);
    } catch (error) {
      console.error('Failed to regenerate plan:', error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handlePlanGenerate = async (additionalContext: string) => {
    if (!planConfig) return;

    // Build enhanced prompt with plan structure
    let enhancedPrompt = planConfig.prompt;

    if (additionalContext) {
      enhancedPrompt += `\n\nAdditional context:\n${additionalContext}`;
    }

    if (currentPlan) {
      enhancedPrompt += `\n\nFollow this structure:\n${currentPlan.structure.map((s, i) => `${i + 1}. ${s.section}: ${s.description}`).join('\n')}`;
    }

    // Clear plan mode and proceed to generation
    setCurrentPlan(null);

    // Use the existing generation flow
    await handleGenerate(enhancedPrompt, planConfig.files, {
      activityId: planConfig.activityType,
      learnerLevel: planConfig.learnerLevel as any,
    });

    setPlanConfig(null);
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
            
            // Basic validation
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                
                // Add to history if not already there (by ID check)
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });

                // Set as active immediately
                setActiveCreation(importedCreation);
            } else {
                alert("Invalid creation file format.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert("Failed to import creation.");
        }
        // Reset input
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Determine if workspace mode should be active
  const isWorkspaceActive = !!activeCreation || isGenerating;
  // Plan preview mode - shown between input and generation
  const isPlanPreviewActive = !!currentPlan && !isGenerating && !activeCreation;

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-blue-500/30 overflow-hidden relative flex flex-col">
      
      {/* 1. Landing / Upload View */}
      <div 
        className={`
          absolute inset-0 z-10 flex flex-col overflow-y-auto
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isWorkspaceActive 
            ? 'opacity-0 scale-95 pointer-events-none translate-y-8' 
            : 'opacity-100 scale-100 translate-y-0'
          }
        `}
      >
        <div className="flex-1 flex flex-col justify-center items-center w-full py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Compact Hero */}
          <div className="w-full mb-6 md:mb-10">
              <Hero />
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setUseCompactMode(true)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                useCompactMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Quick
            </button>
            <button
              onClick={() => setUseCompactMode(false)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                !useCompactMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Advanced
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <button
              onClick={() => setShowCanvasMode(true)}
              className="px-3 py-1 rounded-lg text-sm transition-all bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                         text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 flex items-center gap-1"
            >
              <span>📋</span> Canvas
            </button>
          </div>

          {/* Input Area */}
          <div className="w-full flex justify-center mb-6">
            {useCompactMode ? (
              <CompactInput
                onGenerate={handleCompactGenerate}
                isGenerating={isGenerating}
                disabled={isWorkspaceActive || isPlanPreviewActive}
              />
            ) : (
              <LectureBuilder
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={isWorkspaceActive || isPlanPreviewActive}
              />
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
            <div className="w-full px-2 md:px-0 max-w-7xl mx-auto">
                <CreationHistory history={history} onSelect={handleSelectCreation} />
            </div>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors pb-2">
              Created by @ammaar
            </a>
        </div>
      </div>

      {/* 2. Workspace View (Chat + Preview) */}
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
          {/* Left: Tabbed Sidebar (Chat / Research / Questions) */}
          {activeCreation && (
            <div className="w-80 md:w-96 flex-shrink-0 h-full border-r border-zinc-800 z-50 flex flex-col bg-zinc-950">
                {/* Sidebar Tabs */}
                <div className="flex border-b border-zinc-800 shrink-0">
                  <button
                    onClick={() => setSidebarTab('chat')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                      sidebarTab === 'chat' 
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => setSidebarTab('research')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                      sidebarTab === 'research' 
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    🔍 Research
                  </button>
                  <button
                    onClick={() => setSidebarTab('questions')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                      sidebarTab === 'questions' 
                        ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    ❓ Board Qs
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {sidebarTab === 'chat' && (
                    <ChatPanel 
                      messages={chatMessages} 
                      onSendMessage={handleChatRefine}
                      isProcessing={isRefining}
                    />
                  )}
                  {sidebarTab === 'research' && (
                    <div className="h-full overflow-y-auto p-3">
                      <ResearchPanel 
                        onInsertContent={(content) => {
                          handleChatRefine(`Add this content to the presentation:\n\n${content}`);
                          setSidebarTab('chat');
                        }}
                      />
                    </div>
                  )}
                  {sidebarTab === 'questions' && (
                    <div className="h-full overflow-y-auto p-3">
                      <BoardQuestionsPanel 
                        provider={currentProvider}
                        onInsertQuestions={(questions) => {
                          const qText = questions.map((q, i) => 
                            `Q${i+1}: ${q.stem}\n${q.options.map(o => `${o.letter}. ${o.text}`).join('\n')}`
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

      {/* 3. Plan Preview Mode (Between input and generation) */}
      <div
        className={`
            fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm
            transition-all duration-500 ease-out
            ${isPlanPreviewActive
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }
        `}
      >
          {currentPlan && (
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto px-4">
              <PlanPreviewPanel
                plan={currentPlan}
                isLoading={isCreatingPlan}
                onBack={handlePlanBack}
                onRegenerate={handlePlanRegenerate}
                onGenerate={handlePlanGenerate}
              />
            </div>
          )}
      </div>

      {/* Import Button (Only on landing) */}
      {!isWorkspaceActive && !isPlanPreviewActive && (
        <div className="fixed bottom-4 right-4 z-50">
            <button 
                onClick={handleImportClick}
                className="flex items-center space-x-2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
                title="Import Artifact"
            >
                <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Upload previous artifact</span>
                <ArrowUpTrayIcon className="w-5 h-5" />
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

      {/* Presentation Mode Overlay */}
      {showPresentation && activeCreation && (
        <PresentationMode
          html={activeCreation.html}
          title={activeCreation.name}
          onClose={() => setShowPresentation(false)}
        />
      )}

      {/* Socratic Canvas Overlay */}
      {showCanvasMode && (
        <SocraticCanvas
          onGenerateSlides={handleCanvasGenerate}
          onClose={() => setShowCanvasMode(false)}
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

      {/* Generation Progress Indicator */}
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
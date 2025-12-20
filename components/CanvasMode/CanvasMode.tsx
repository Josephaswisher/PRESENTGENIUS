/**
 * Canvas Mode - Pre-generation planning and content gathering
 * Build comprehensive outline + research before slide generation
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon,
  PlayIcon,
  BookOpenIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import {
  OutlineSection,
  CanvasDocument,
  AIMessage,
  SectionType,
  SECTION_TEMPLATES,
  ContentSource,
} from './types';
import { searchMedicalEvidence, getLatestGuidelines, getDifferentialDiagnosis } from '../../services/perplexity';
import { generateWithProvider, AIProvider } from '../../services/ai-provider';

interface CanvasModeProps {
  onGenerateSlides: (document: CanvasDocument) => void;
  onClose: () => void;
  provider?: AIProvider;
}

export const CanvasMode: React.FC<CanvasModeProps> = ({
  onGenerateSlides,
  onClose,
  provider = 'gemini',
}) => {
  // Document state
  const [document, setDocument] = useState<CanvasDocument>({
    id: crypto.randomUUID(),
    title: '',
    topic: '',
    targetAudience: 'Medical Residents',
    duration: 30,
    outline: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'planning',
  });

  // UI state
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [showOutlinePanel, setShowOutlinePanel] = useState(true);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Generate initial outline from topic
  const generateOutline = async () => {
    if (!document.topic.trim()) return;
    
    setIsAIWorking(true);
    addSystemMessage(`Generating outline for "${document.topic}"...`);

    try {
      const prompt = `Create a detailed lecture outline for: "${document.topic}"
Target audience: ${document.targetAudience}
Duration: ${document.duration} minutes

Return a JSON array of sections with this structure:
[
  { "title": "Section Title", "type": "objectives|introduction|content|case|quiz|summary", "duration": 5, "keyPoints": ["point1", "point2"] }
]

Include 6-10 sections appropriate for the topic. Include at least one case and one quiz section.
Return ONLY valid JSON array, no markdown.`;

      const response = await generateWithProvider(provider, prompt, [], {});
      const sections = parseOutlineResponse(response);
      
      setDocument(prev => ({
        ...prev,
        outline: sections,
        title: document.topic,
        updatedAt: new Date(),
      }));

      addAssistantMessage(`Created ${sections.length} sections for your lecture. Click any section to add content, or ask me to research specific topics.`);
    } catch (error) {
      addAssistantMessage('Failed to generate outline. Please try again or add sections manually.');
    } finally {
      setIsAIWorking(false);
    }
  };

  // Parse AI response to outline sections
  const parseOutlineResponse = (response: string): OutlineSection[] => {
    try {
      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) return [];
      
      const parsed = JSON.parse(match[0]);
      return parsed.map((item: any, index: number) => ({
        id: `section-${Date.now()}-${index}`,
        title: item.title || 'Untitled Section',
        type: item.type || 'content',
        content: item.keyPoints ? item.keyPoints.map((p: string) => `• ${p}`).join('\n') : '',
        notes: '',
        subsections: [],
        duration: item.duration || 5,
        slideCount: Math.ceil((item.duration || 5) / 2),
        status: item.keyPoints?.length > 0 ? 'draft' : 'empty',
        collapsed: false,
        sources: [],
      }));
    } catch {
      return [];
    }
  };

  // Add section
  const addSection = (type: SectionType, afterId?: string) => {
    const template = SECTION_TEMPLATES.find(t => t.type === type)!;
    const newSection: OutlineSection = {
      id: `section-${Date.now()}`,
      title: template.name,
      type,
      content: '',
      notes: '',
      subsections: [],
      duration: template.defaultDuration,
      slideCount: Math.ceil(template.defaultDuration / 2),
      status: 'empty',
      collapsed: false,
      sources: [],
    };

    setDocument(prev => {
      const outline = [...prev.outline];
      if (afterId) {
        const index = outline.findIndex(s => s.id === afterId);
        outline.splice(index + 1, 0, newSection);
      } else {
        outline.push(newSection);
      }
      return { ...prev, outline, updatedAt: new Date() };
    });

    setSelectedSection(newSection.id);
  };

  // Update section
  const updateSection = (id: string, updates: Partial<OutlineSection>) => {
    setDocument(prev => ({
      ...prev,
      outline: prev.outline.map(s => s.id === id ? { ...s, ...updates } : s),
      updatedAt: new Date(),
    }));
  };

  // Delete section
  const deleteSection = (id: string) => {
    setDocument(prev => ({
      ...prev,
      outline: prev.outline.filter(s => s.id !== id),
      updatedAt: new Date(),
    }));
    if (selectedSection === id) setSelectedSection(null);
  };

  // Move section
  const moveSection = (id: string, direction: 'up' | 'down') => {
    setDocument(prev => {
      const outline = [...prev.outline];
      const index = outline.findIndex(s => s.id === id);
      if (direction === 'up' && index > 0) {
        [outline[index], outline[index - 1]] = [outline[index - 1], outline[index]];
      } else if (direction === 'down' && index < outline.length - 1) {
        [outline[index], outline[index + 1]] = [outline[index + 1], outline[index]];
      }
      return { ...prev, outline, updatedAt: new Date() };
    });
  };

  // Chat helpers
  const addSystemMessage = (content: string) => {
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: new Date(),
    }]);
  };

  const addAssistantMessage = (content: string, sectionId?: string) => {
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      sectionId,
    }]);
  };

  // Handle chat submit
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isAIWorking) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    setIsAIWorking(true);

    try {
      // Check for special commands
      if (userMessage.toLowerCase().startsWith('/research ')) {
        const topic = userMessage.slice(10);
        await handleResearch(topic);
      } else if (userMessage.toLowerCase().startsWith('/guidelines ')) {
        const condition = userMessage.slice(12);
        await handleGuidelines(condition);
      } else if (userMessage.toLowerCase().startsWith('/expand')) {
        await handleExpandSection();
      } else if (userMessage.toLowerCase().startsWith('/case ')) {
        const scenario = userMessage.slice(6);
        await handleGenerateCase(scenario);
      } else {
        // General AI assistance
        await handleGeneralChat(userMessage);
      }
    } catch (error) {
      addAssistantMessage('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsAIWorking(false);
    }
  };

  // Research with Perplexity
  const handleResearch = async (topic: string) => {
    addSystemMessage(`Researching: ${topic}...`);
    try {
      const result = await searchMedicalEvidence(topic);
      addAssistantMessage(`**Research Results: ${topic}**\n\n${result.summary}\n\n**Key Points:**\n${result.keyPoints.map(p => `• ${p}`).join('\n')}`);
      
      // Add to selected section if one is selected
      if (selectedSection) {
        const source: ContentSource = {
          id: crypto.randomUUID(),
          type: 'research',
          title: topic,
          content: result.summary,
          citation: result.citations.join('; '),
          addedAt: new Date(),
        };
        updateSection(selectedSection, {
          sources: [...(document.outline.find(s => s.id === selectedSection)?.sources || []), source],
        });
        addAssistantMessage(`Added research to "${document.outline.find(s => s.id === selectedSection)?.title}"`);
      }
    } catch (error) {
      addAssistantMessage('Research failed. Please check your Perplexity API key.');
    }
  };

  // Get guidelines
  const handleGuidelines = async (condition: string) => {
    addSystemMessage(`Fetching guidelines for: ${condition}...`);
    try {
      const result = await getLatestGuidelines(condition);
      addAssistantMessage(`**Guidelines: ${condition}**\n\n${result.summary}`);
    } catch (error) {
      addAssistantMessage('Failed to fetch guidelines.');
    }
  };

  // Expand selected section
  const handleExpandSection = async () => {
    if (!selectedSection) {
      addAssistantMessage('Please select a section first, then use /expand to add more content.');
      return;
    }

    const section = document.outline.find(s => s.id === selectedSection);
    if (!section) return;

    addSystemMessage(`Expanding "${section.title}"...`);

    const prompt = `Expand this lecture section with detailed content:

Section: ${section.title}
Type: ${section.type}
Current content: ${section.content || 'None'}
Topic context: ${document.topic}
Audience: ${document.targetAudience}

Provide:
1. Detailed bullet points (5-8 points)
2. Key teaching pearls
3. Common misconceptions to address
4. Suggested visuals/diagrams

Format with clear headers and bullet points.`;

    const response = await generateWithProvider(provider, prompt, [], {});
    updateSection(selectedSection, {
      content: section.content + '\n\n' + response,
      status: 'draft',
    });
    addAssistantMessage(`Expanded "${section.title}" with detailed content.`);
  };

  // Generate clinical case
  const handleGenerateCase = async (scenario: string) => {
    addSystemMessage(`Generating clinical case: ${scenario}...`);

    const prompt = `Create a clinical case for medical education:

Scenario: ${scenario}
Topic: ${document.topic}
Audience: ${document.targetAudience}

Provide a realistic case with:
1. Chief Complaint
2. History of Present Illness
3. Past Medical History
4. Physical Exam Findings
5. Initial Labs/Imaging
6. 3 Discussion Questions
7. Teaching Points

Make it clinically accurate and educational.`;

    const response = await generateWithProvider(provider, prompt, [], {});
    
    // Add as new case section or to selected section
    if (selectedSection) {
      updateSection(selectedSection, {
        content: response,
        status: 'draft',
      });
      addAssistantMessage(`Added case to "${document.outline.find(s => s.id === selectedSection)?.title}"`);
    } else {
      addSection('case');
      setTimeout(() => {
        const lastSection = document.outline[document.outline.length - 1];
        if (lastSection) {
          updateSection(lastSection.id, { content: response, title: `Case: ${scenario}`, status: 'draft' });
        }
      }, 100);
      addAssistantMessage(`Created new case section: ${scenario}`);
    }
  };

  // General chat
  const handleGeneralChat = async (message: string) => {
    const context = selectedSection 
      ? `Currently editing section: "${document.outline.find(s => s.id === selectedSection)?.title}"`
      : 'No section selected';

    const prompt = `You are a medical education content assistant helping create a lecture.

Lecture Topic: ${document.topic}
Audience: ${document.targetAudience}
Duration: ${document.duration} minutes
${context}

Current outline:
${document.outline.map((s, i) => `${i + 1}. ${s.title} (${s.type})`).join('\n')}

User request: ${message}

Provide helpful, concise assistance. If suggesting content, format it clearly with bullet points.
Available commands: /research [topic], /guidelines [condition], /expand, /case [scenario]`;

    const response = await generateWithProvider(provider, prompt, [], {});
    addAssistantMessage(response);
  };

  // Calculate totals
  const totalDuration = document.outline.reduce((sum, s) => sum + s.duration, 0);
  const totalSlides = document.outline.reduce((sum, s) => sum + s.slideCount, 0);
  const completeSections = document.outline.filter(s => s.status === 'complete').length;

  const selectedSectionData = document.outline.find(s => s.id === selectedSection);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={document.title || document.topic}
              onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Lecture Title"
              className="bg-transparent text-xl font-bold text-white focus:outline-none"
            />
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
              <span>{totalDuration} min</span>
              <span>•</span>
              <span>{totalSlides} slides</span>
              <span>•</span>
              <span>{completeSections}/{document.outline.length} sections</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={document.targetAudience}
            onChange={(e) => setDocument(prev => ({ ...prev, targetAudience: e.target.value }))}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option>Medical Students</option>
            <option>Medical Residents</option>
            <option>Attending Physicians</option>
            <option>Nursing Staff</option>
            <option>Allied Health</option>
          </select>
          <button
            onClick={() => onGenerateSlides(document)}
            disabled={document.outline.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium
                       flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-4 h-4" />
            Generate Slides
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Outline Panel */}
        <div className={`${showOutlinePanel ? 'w-80' : 'w-0'} flex-shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-900/30 overflow-hidden transition-all`}>
          {/* Topic Input */}
          <div className="p-4 border-b border-zinc-800">
            <label className="text-xs text-zinc-500 mb-1 block">Lecture Topic</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={document.topic}
                onChange={(e) => setDocument(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., COPD Management"
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              />
              <button
                onClick={generateOutline}
                disabled={!document.topic.trim() || isAIWorking}
                className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Outline */}
          <div className="flex-1 overflow-y-auto p-2" ref={outlineRef}>
            {document.outline.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Enter a topic and click ✨ to generate outline</p>
                <p className="text-xs mt-2">Or add sections manually below</p>
              </div>
            ) : (
              <div className="space-y-1">
                {document.outline.map((section, index) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => setDraggedSection(section.id)}
                    onDragEnd={() => setDraggedSection(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedSection && draggedSection !== section.id) {
                        // Reorder logic would go here
                      }
                    }}
                    className={`group rounded-lg border transition-all cursor-pointer ${
                      selectedSection === section.id
                        ? 'bg-cyan-500/10 border-cyan-500/50'
                        : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                    } ${draggedSection === section.id ? 'opacity-50' : ''}`}
                  >
                    <div
                      className="p-3 flex items-start gap-2"
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <span className="text-lg">{SECTION_TEMPLATES.find(t => t.type === section.type)?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{section.title}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            section.status === 'complete' ? 'bg-green-400' :
                            section.status === 'draft' ? 'bg-yellow-400' : 'bg-zinc-600'
                          }`} />
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {section.duration} min • {section.slideCount} slides
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                          disabled={index === 0}
                          className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                          disabled={index === document.outline.length - 1}
                          className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Section */}
          <div className="p-2 border-t border-zinc-800">
            <div className="grid grid-cols-3 gap-1">
              {SECTION_TEMPLATES.slice(0, 6).map((template) => (
                <button
                  key={template.type}
                  onClick={() => addSection(template.type)}
                  className="p-2 text-center text-xs bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg"
                  title={template.name}
                >
                  <span className="text-lg block">{template.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Content Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSectionData ? (
            <>
              {/* Section Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                <input
                  type="text"
                  value={selectedSectionData.title}
                  onChange={(e) => updateSection(selectedSection!, { title: e.target.value })}
                  className="text-xl font-bold bg-transparent focus:outline-none w-full"
                />
                <div className="flex items-center gap-4 mt-2">
                  <select
                    value={selectedSectionData.type}
                    onChange={(e) => updateSection(selectedSection!, { type: e.target.value as SectionType })}
                    className="px-2 py-1 bg-zinc-800 rounded text-xs"
                  >
                    {SECTION_TEMPLATES.map(t => (
                      <option key={t.type} value={t.type}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="number"
                      value={selectedSectionData.duration}
                      onChange={(e) => updateSection(selectedSection!, { 
                        duration: Number(e.target.value),
                        slideCount: Math.ceil(Number(e.target.value) / 2)
                      })}
                      className="w-12 px-2 py-1 bg-zinc-800 rounded text-center"
                      min={1}
                    />
                    <span>min</span>
                  </div>
                  <button
                    onClick={() => updateSection(selectedSection!, { 
                      status: selectedSectionData.status === 'complete' ? 'draft' : 'complete' 
                    })}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      selectedSectionData.status === 'complete'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    <CheckCircleIcon className="w-3 h-3" />
                    {selectedSectionData.status === 'complete' ? 'Complete' : 'Mark Complete'}
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  value={selectedSectionData.content}
                  onChange={(e) => updateSection(selectedSection!, { content: e.target.value })}
                  placeholder="Add content for this section...&#10;&#10;Use the AI chat to:&#10;• /research [topic] - Search medical evidence&#10;• /guidelines [condition] - Get latest guidelines&#10;• /expand - Expand this section with AI&#10;• /case [scenario] - Generate a clinical case"
                  className="w-full h-64 bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 
                             text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none
                             focus:border-cyan-500/50"
                />

                {/* Sources */}
                {selectedSectionData.sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Sources</h4>
                    <div className="space-y-2">
                      {selectedSectionData.sources.map((source) => (
                        <div key={source.id} className="p-3 bg-zinc-800/50 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              source.type === 'research' ? 'bg-cyan-500/20 text-cyan-400' :
                              source.type === 'guideline' ? 'bg-green-500/20 text-green-400' :
                              'bg-zinc-700 text-zinc-400'
                            }`}>
                              {source.type}
                            </span>
                            <span className="font-medium">{source.title}</span>
                          </div>
                          <p className="text-zinc-400 text-xs line-clamp-2">{source.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Speaker Notes</h4>
                  <textarea
                    value={selectedSectionData.notes}
                    onChange={(e) => updateSection(selectedSection!, { notes: e.target.value })}
                    placeholder="Add speaker notes..."
                    className="w-full h-24 bg-zinc-800/30 border border-zinc-700 rounded-lg p-3 
                               text-zinc-300 placeholder-zinc-600 resize-none text-sm focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <Bars3Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a section to edit</p>
                <p className="text-sm mt-1">or generate an outline to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="w-96 flex-shrink-0 border-l border-zinc-800 flex flex-col bg-zinc-900/30">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-medium">AI Assistant</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                <p className="mb-4">I can help you build your lecture!</p>
                <div className="space-y-2 text-left bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400">Try these commands:</p>
                  <p><code className="text-cyan-400">/research</code> COPD treatment</p>
                  <p><code className="text-cyan-400">/guidelines</code> heart failure</p>
                  <p><code className="text-cyan-400">/case</code> chest pain in young athlete</p>
                  <p><code className="text-cyan-400">/expand</code> (expand selected section)</p>
                </div>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.role === 'user' ? 'ml-8' :
                  msg.role === 'system' ? 'mx-4' : 'mr-8'
                }`}
              >
                <div className={`rounded-xl p-3 text-sm ${
                  msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-100' :
                  msg.role === 'system' ? 'bg-zinc-800/50 text-zinc-400 text-center text-xs' :
                  'bg-zinc-800 text-zinc-200'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isAIWorking && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask me anything or use /commands..."
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                           focus:outline-none focus:border-cyan-500"
                disabled={isAIWorking}
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isAIWorking}
                className="p-2 bg-cyan-500 rounded-lg text-white disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setChatInput('/research ')}
                className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white"
              >
                🔍 Research
              </button>
              <button
                onClick={() => setChatInput('/guidelines ')}
                className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white"
              >
                📋 Guidelines
              </button>
              <button
                onClick={() => { setChatInput('/expand'); handleChatSubmit(); }}
                disabled={!selectedSection}
                className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-50"
              >
                ✨ Expand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasMode;

/**
 * Interactive Canvas - Unified Lecture Builder for Dr. Swisher
 * Combines Socratic outline + Multi-source research + AI Chat Assistant
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  LightBulbIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { generateWithProvider, AIProvider } from '../services/ai-provider';
import { searchMedicalEvidence, getLatestGuidelines } from '../services/perplexity';
import { 
  searchUpToDate, 
  searchMKSAP, 
  searchPubMed,
  checkScraperHealth,
  loginUpToDate,
  loginMKSAP,
  formatSearchResults,
  type ScraperStatus,
} from '../services/medical-scrapers';

// Types
type ResearchSource = 'uptodate' | 'mksap' | 'perplexity' | 'pubmed';

interface ResearchResult {
  source: ResearchSource;
  content: string;
  keyPoints: string[];
  citations: string[];
  error?: string;
}

interface SocraticQuestion {
  id: string;
  question: string;
  type: 'why' | 'how' | 'what-if' | 'compare' | 'apply' | 'challenge';
  insight: string;
  nextTitle: string;
}

interface Section {
  id: string;
  title: string;
  type: 'intro' | 'concept' | 'case' | 'mechanism' | 'clinical' | 'summary';
  content: string;
  keyPoints: string[];
  research?: ResearchResult[];
  slideCount: number;
  isExpanded: boolean;
  followUpQuestions: SocraticQuestion[];
  selectedQuestionId?: string;
}

interface CanvasDocument {
  topic: string;
  targetAudience: string;
  duration: number;
  sections: Section[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: 'research' | 'outline' | 'section' | 'modify';
}

interface Props {
  onGenerateSlides: (doc: CanvasDocument) => void;
  currentProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

const AUDIENCES = [
  { id: 'students', label: 'Med Students', icon: '📚' },
  { id: 'residents', label: 'Residents', icon: '🩺' },
  { id: 'fellows', label: 'Fellows', icon: '🔬' },
  { id: 'attendings', label: 'Attendings', icon: '👨‍⚕️' },
];

const SECTION_ICONS: Record<string, string> = {
  intro: '🎯',
  concept: '💡',
  case: '🏥',
  mechanism: '⚙️',
  clinical: '👨‍⚕️',
  summary: '📋',
};

const QUESTION_STYLES: Record<string, { icon: string; color: string }> = {
  why: { icon: '🤔', color: 'purple' },
  how: { icon: '⚙️', color: 'blue' },
  'what-if': { icon: '💭', color: 'green' },
  compare: { icon: '⚖️', color: 'orange' },
  apply: { icon: '🎯', color: 'cyan' },
  challenge: { icon: '🔥', color: 'red' },
};

const RESEARCH_SOURCES = [
  { id: 'uptodate' as ResearchSource, name: 'UpToDate', icon: '📚', color: 'orange' },
  { id: 'mksap' as ResearchSource, name: 'MKSAP 19', icon: '🩺', color: 'blue' },
  { id: 'perplexity' as ResearchSource, name: 'Perplexity', icon: '🔮', color: 'purple' },
  { id: 'pubmed' as ResearchSource, name: 'PubMed', icon: '📄', color: 'green' },
];

const AI_PROVIDERS: { id: AIProvider; name: string; icon: string }[] = [
  { id: 'gemini', name: 'Gemini 3 Flash', icon: '⚡' },
  { id: 'opus', name: 'Claude Opus', icon: '👑' },
  { id: 'claude', name: 'Claude Sonnet', icon: '🎭' },
];

const QUICK_ACTIONS = [
  { label: 'Suggest a topic', prompt: 'Suggest 5 high-yield medical education topics for residents' },
  { label: 'Add a case', prompt: 'Add a clinical case section to illustrate the key concepts' },
  { label: 'More depth', prompt: 'Add more pathophysiology depth to the current outline' },
  { label: 'Board questions', prompt: 'Suggest board-style questions I should include' },
];

export const InteractiveCanvas: React.FC<Props> = ({ 
  onGenerateSlides, 
  currentProvider,
  onProviderChange,
}) => {
  const [doc, setDoc] = useState<CanvasDocument>({
    topic: '',
    targetAudience: 'residents',
    duration: 30,
    sections: [],
  });

  // Loading states
  const [isResearching, setIsResearching] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatingQuestionsFor, setGeneratingQuestionsFor] = useState<string | null>(null);
  const [expandingSection, setExpandingSection] = useState<string | null>(null);
  
  // Research config
  const [selectedSources, setSelectedSources] = useState<ResearchSource[]>(['uptodate', 'perplexity']);
  const [globalResearch, setGlobalResearch] = useState<ResearchResult[]>([]);
  
  // Service status
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Panel collapse states
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi Dr. Swisher! I'm your lecture building assistant. Tell me what topic you'd like to teach, or ask me to help refine your outline. I can research topics, suggest sections, add clinical cases, or help structure your content.",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check scraper on mount
  useEffect(() => {
    checkScraperHealth().then(setScraperStatus);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle research source
  const toggleSource = (source: ResearchSource) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  // Login handlers
  const handleLogin = async (target: 'uptodate' | 'mksap') => {
    setIsLoggingIn(true);
    try {
      const success = target === 'uptodate' ? await loginUpToDate() : await loginMKSAP();
      if (success) {
        const status = await checkScraperHealth();
        setScraperStatus(status);
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
    setIsLoggingIn(false);
  };

  // Chat handler
  const handleChatSubmit = async (message?: string) => {
    const userMessage = message || chatInput.trim();
    if (!userMessage || isChatProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatProcessing(true);

    try {
      // Build context about current state
      const contextParts = [];
      if (doc.topic) contextParts.push(`Current topic: "${doc.topic}"`);
      if (doc.sections.length > 0) {
        contextParts.push(`Current outline (${doc.sections.length} sections):\n${doc.sections.map((s, i) => 
          `${i+1}. ${s.title} (${s.type}) - ${s.keyPoints.join(', ')}`
        ).join('\n')}`);
      }
      if (globalResearch.length > 0) {
        contextParts.push(`Research available from: ${globalResearch.map(r => r.source).join(', ')}`);
      }

      const systemPrompt = `You are Dr. Swisher's lecture building assistant for PRESENTGENIUS. You help create medical education presentations.

CURRENT STATE:
${contextParts.length > 0 ? contextParts.join('\n\n') : 'No lecture started yet.'}
Target Audience: ${doc.targetAudience}
Duration: ${doc.duration} minutes

You can help by:
1. Suggesting lecture topics and structures
2. Recommending sections to add or modify
3. Providing clinical pearls and teaching points
4. Suggesting board-style questions
5. Helping refine content and flow

If the user asks to SET THE TOPIC, respond with: [ACTION:SET_TOPIC:topic name here]
If the user asks to ADD A SECTION, respond with: [ACTION:ADD_SECTION:{"title":"...","type":"concept|case|mechanism|clinical","keyPoints":["..."]}]
If the user asks to RESEARCH, respond with: [ACTION:RESEARCH]
If the user asks to GENERATE OUTLINE, respond with: [ACTION:GENERATE_OUTLINE]

Be concise, practical, and focused on high-yield medical education. Always be helpful and proactive.`;

      const response = await generateWithProvider(currentProvider, userMessage, [], {
        systemPrompt,
      });

      // Parse for actions
      const actionMatch = response.match(/\[ACTION:(\w+)(?::(.+?))?\]/);
      if (actionMatch) {
        const [, action, payload] = actionMatch;
        const cleanResponse = response.replace(/\[ACTION:.+?\]/g, '').trim();

        switch (action) {
          case 'SET_TOPIC':
            if (payload) {
              setDoc(prev => ({ ...prev, topic: payload }));
            }
            break;
          case 'ADD_SECTION':
            if (payload) {
              try {
                const sectionData = JSON.parse(payload);
                const newSection: Section = {
                  id: `section-${Date.now()}`,
                  title: sectionData.title || 'New Section',
                  type: sectionData.type || 'concept',
                  content: '',
                  keyPoints: sectionData.keyPoints || [],
                  slideCount: 4,
                  isExpanded: true,
                  followUpQuestions: [],
                };
                setDoc(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
              } catch (e) {
                console.error('Failed to parse section:', e);
              }
            }
            break;
          case 'RESEARCH':
            researchTopic();
            break;
          case 'GENERATE_OUTLINE':
            generateOutline();
            break;
        }

        if (cleanResponse) {
          setChatMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: cleanResponse,
            timestamp: new Date(),
            action: action.toLowerCase() as any,
          }]);
        }
      } else {
        setChatMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    }
    setIsChatProcessing(false);
  };

  // Research the topic across selected sources
  const researchTopic = async () => {
    if (!doc.topic.trim() || selectedSources.length === 0) return;
    
    setIsResearching(true);
    setGlobalResearch([]);
    
    const promises = selectedSources.map(async (source) => {
      try {
        let result: ResearchResult;
        
        switch (source) {
          case 'uptodate': {
            const res = await searchUpToDate(doc.topic);
            if (res) {
              const formatted = formatSearchResults(res);
              result = { source, content: formatted.summary, keyPoints: formatted.keyPoints, citations: formatted.citations };
            } else {
              throw new Error('No results');
            }
            break;
          }
          case 'mksap': {
            const res = await searchMKSAP(doc.topic);
            if (res) {
              const formatted = formatSearchResults(res);
              result = { source, content: formatted.summary, keyPoints: formatted.keyPoints, citations: formatted.citations };
            } else {
              throw new Error('No results');
            }
            break;
          }
          case 'perplexity': {
            const [evidence, guidelines] = await Promise.all([
              searchMedicalEvidence(doc.topic),
              getLatestGuidelines(doc.topic),
            ]);
            result = {
              source,
              content: `## Evidence\n${evidence.summary}\n\n## Guidelines\n${guidelines.summary}`,
              keyPoints: [...evidence.keyPoints, ...guidelines.keyPoints],
              citations: [...evidence.citations, ...guidelines.citations],
            };
            break;
          }
          case 'pubmed': {
            const res = await searchPubMed(doc.topic);
            if (res) {
              const formatted = formatSearchResults(res);
              result = { source, content: formatted.summary, keyPoints: formatted.keyPoints, citations: formatted.citations };
            } else {
              throw new Error('No results');
            }
            break;
          }
          default:
            throw new Error('Unknown source');
        }
        
        return result!;
      } catch (error) {
        return { source, content: '', keyPoints: [], citations: [], error: String(error) } as ResearchResult;
      }
    });
    
    const allResults = await Promise.all(promises);
    setGlobalResearch(allResults.filter(r => !r.error && r.content));
    setIsResearching(false);
  };

  // Generate outline using AI + research context
  const generateOutline = async () => {
    if (!doc.topic.trim()) return;
    
    setIsGeneratingOutline(true);
    try {
      const researchContext = globalResearch.length > 0 
        ? `\n\nRESEARCH CONTEXT:\n${globalResearch.map(r => 
            `## ${r.source.toUpperCase()}\n${r.content.slice(0, 2000)}\nKey Points: ${r.keyPoints.join(', ')}`
          ).join('\n\n')}`
        : '';

      const prompt = `You are an expert medical educator creating a Socratic-style lecture.

TOPIC: "${doc.topic}"
AUDIENCE: ${doc.targetAudience}
DURATION: ${doc.duration} minutes
${researchContext}

Create a lecture outline with 5-7 sections that builds understanding through guided discovery.

For each section:
1. title: Compelling title (can be a question)
2. type: "intro" | "concept" | "mechanism" | "case" | "clinical" | "summary"
3. keyPoints: 3-4 key learning points
4. slideCount: Number of slides (2-6)

Structure so each section naturally leads to the next.

Return JSON array ONLY:
[{"title": "...", "type": "intro", "keyPoints": ["..."], "slideCount": 3}]`;

      const response = await generateWithProvider(currentProvider, prompt, [], {});
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const outline = JSON.parse(jsonMatch[0]);
        const sections: Section[] = outline.map((s: any, i: number) => ({
          id: `section-${Date.now()}-${i}`,
          title: s.title,
          type: s.type || 'concept',
          content: '',
          keyPoints: s.keyPoints || [],
          research: i === 0 ? globalResearch : undefined,
          slideCount: s.slideCount || 4,
          isExpanded: i === 0,
          followUpQuestions: [],
        }));

        setDoc(prev => ({ ...prev, sections }));
        
        if (sections.length > 0) {
          generateSocraticQuestions(sections[0].id, sections);
        }
      }
    } catch (error) {
      console.error('Outline generation failed:', error);
    }
    setIsGeneratingOutline(false);
  };

  // Generate Socratic questions for a section
  const generateSocraticQuestions = async (sectionId: string, sectionsOverride?: Section[]) => {
    const sections = sectionsOverride || doc.sections;
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const section = sections[sectionIndex];
    if (!section) return;

    setGeneratingQuestionsFor(sectionId);
    try {
      const nextSections = sections.slice(sectionIndex + 1);
      
      const prompt = `You are a master clinical educator using Socratic questioning.

CURRENT SECTION: "${section.title}"
KEY POINTS: ${section.keyPoints.join(', ')}
${section.content ? `CONTENT: ${section.content.slice(0, 500)}` : ''}
UPCOMING: ${nextSections.map(s => s.title).join(' → ') || 'Final section'}

Generate 4-5 powerful Socratic follow-up questions that:
1. Probe deeper into what was taught
2. Challenge assumptions
3. Bridge to clinical application
4. Create curiosity for what's next

For each:
- question: Conversational, thought-provoking
- type: "why" | "how" | "what-if" | "compare" | "apply" | "challenge"
- insight: Why this question is powerful (1 sentence)
- nextTitle: Next slide title if exploring this

Return JSON array ONLY.`;

      const response = await generateWithProvider(currentProvider, prompt, [], {});
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        const formatted: SocraticQuestion[] = questions.map((q: any, i: number) => ({
          id: `q-${sectionId}-${i}`,
          question: q.question,
          type: q.type || 'why',
          insight: q.insight,
          nextTitle: q.nextTitle,
        }));

        setDoc(prev => ({
          ...prev,
          sections: prev.sections.map(s =>
            s.id === sectionId ? { ...s, followUpQuestions: formatted } : s
          ),
        }));
      }
    } catch (error) {
      console.error('Question generation failed:', error);
    }
    setGeneratingQuestionsFor(null);
  };

  // Expand section with research + content
  const expandSection = async (sectionId: string) => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;

    setExpandingSection(sectionId);
    try {
      const sectionResearch = await searchMedicalEvidence(`${doc.topic} ${section.title}`);

      const prompt = `You are an expert medical educator writing lecture content.

TOPIC: ${doc.topic}
SECTION: "${section.title}"
TYPE: ${section.type}
KEY POINTS: ${section.keyPoints.join(', ')}
AUDIENCE: ${doc.targetAudience}

RESEARCH:
${sectionResearch.summary}

Write engaging lecture content (2-3 paragraphs of prose, not bullets).`;

      const response = await generateWithProvider(currentProvider, prompt, [], {});

      setDoc(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                content: response.trim(),
                research: [{
                  source: 'perplexity' as ResearchSource,
                  content: sectionResearch.summary,
                  keyPoints: sectionResearch.keyPoints,
                  citations: sectionResearch.citations,
                }],
              }
            : s
        ),
      }));

      generateSocraticQuestions(sectionId);
    } catch (error) {
      console.error('Section expansion failed:', error);
    }
    setExpandingSection(null);
  };

  // Select question to shape next section
  const selectQuestion = (sectionId: string, question: SocraticQuestion) => {
    const sectionIndex = doc.sections.findIndex(s => s.id === sectionId);

    setDoc(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], selectedQuestionId: question.id };

      if (sectionIndex < newSections.length - 1) {
        newSections[sectionIndex + 1] = { ...newSections[sectionIndex + 1], title: question.nextTitle };
      } else {
        newSections.push({
          id: `section-${Date.now()}`,
          title: question.nextTitle,
          type: 'concept',
          content: '',
          keyPoints: [],
          slideCount: 4,
          isExpanded: true,
          followUpQuestions: [],
        });
      }

      return { ...prev, sections: newSections };
    });
  };

  const toggleSection = (sectionId: string) => {
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      ),
    }));
  };

  const removeSection = (sectionId: string) => {
    setDoc(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
  };

  const totalSlides = doc.sections.reduce((sum, s) => sum + s.slideCount, 0);
  const sectionsWithContent = doc.sections.filter(s => s.content).length;

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <AcademicCapIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PRESENTGENIUS</h1>
              <p className="text-sm text-zinc-500">Interactive Canvas • By Dr. Swisher</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Provider Selector */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
              {AI_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => onProviderChange(p.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    currentProvider === p.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              ))}
            </div>

            {doc.sections.length > 0 && (
              <div className="text-sm text-zinc-500 hidden md:block">
                {sectionsWithContent}/{doc.sections.length} sections • {totalSlides} slides
              </div>
            )}
            
            <button
              onClick={() => onGenerateSlides(doc)}
              disabled={doc.sections.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-sm font-medium
                         text-white flex items-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all"
            >
              <PlayIcon className="w-4 h-4" />
              Generate
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-6 pb-4 border-t border-zinc-800 pt-4 bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-zinc-400">Scraper Service</div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                scraperStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {scraperStatus ? '● Online' : '○ Offline'}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleLogin('uptodate')}
                disabled={isLoggingIn || !scraperStatus}
                className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  scraperStatus?.uptodate_logged_in
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                📚 {scraperStatus?.uptodate_logged_in ? 'UpToDate ✓' : 'Login UpToDate'}
              </button>
              <button
                onClick={() => handleLogin('mksap')}
                disabled={isLoggingIn || !scraperStatus}
                className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  scraperStatus?.mksap_logged_in
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                🩺 {scraperStatus?.mksap_logged_in ? 'MKSAP ✓' : 'Login MKSAP'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Setup & Research */}
        <div className={`${leftPanelCollapsed ? 'w-0 overflow-hidden' : 'w-72'} transition-all duration-300 flex-shrink-0 relative`}>
          <div className={`h-full w-72 border-r border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden ${leftPanelCollapsed ? 'invisible' : 'visible'}`}>
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Topic */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lecture Topic</label>
              <input
                type="text"
                value={doc.topic}
                onChange={(e) => setDoc(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Hypertensive Emergency"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                           placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Audience & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Audience</label>
                <select
                  value={doc.targetAudience}
                  onChange={(e) => setDoc(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs"
                >
                  {AUDIENCES.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Duration</label>
                <select
                  value={doc.duration}
                  onChange={(e) => setDoc(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>

            {/* Research Sources */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Sources</label>
              <div className="flex flex-wrap gap-1.5">
                {RESEARCH_SOURCES.map(source => {
                  const isSelected = selectedSources.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      <span>{source.icon}</span>
                      <span>{source.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={researchTopic}
                disabled={!doc.topic.trim() || isResearching || selectedSources.length === 0}
                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg
                           text-xs font-medium text-cyan-400 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResearching ? (
                  <><ArrowPathIcon className="w-3 h-3 animate-spin" /> Researching...</>
                ) : (
                  <><MagnifyingGlassIcon className="w-3 h-3" /> Research</>
                )}
              </button>

              <button
                onClick={generateOutline}
                disabled={!doc.topic.trim() || isGeneratingOutline}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                           text-xs font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingOutline ? (
                  <><ArrowPathIcon className="w-3 h-3 animate-spin" /> Generating...</>
                ) : (
                  <><SparklesIcon className="w-3 h-3" /> Generate Outline</>
                )}
              </button>
            </div>

            {/* Research Results */}
            {globalResearch.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-400">Research</div>
                {globalResearch.map(r => (
                  <div key={r.source} className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium mb-1">
                      {RESEARCH_SOURCES.find(s => s.id === r.source)?.icon}
                      {RESEARCH_SOURCES.find(s => s.id === r.source)?.name}
                    </div>
                    <div className="text-xs text-zinc-500">{r.keyPoints.length} key points</div>
                  </div>
                ))}
              </div>
            )}

            {/* Section List */}
            {doc.sections.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-400 mb-2">OUTLINE</div>
                <div className="space-y-1">
                  {doc.sections.map((section, i) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2 ${
                        section.isExpanded ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="text-sm">{SECTION_ICONS[section.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{section.title}</div>
                      </div>
                      {section.content && <CheckCircleIcon className="w-3 h-3 text-green-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Left Toggle Button */}
        <button
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="flex-shrink-0 w-6 bg-zinc-800 hover:bg-cyan-500/30 border-x border-zinc-700 flex items-center justify-center transition-colors group"
          title={leftPanelCollapsed ? 'Show Setup Panel' : 'Hide Setup Panel'}
        >
          {leftPanelCollapsed ? (
            <ChevronDoubleRightIcon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
          ) : (
            <ChevronDoubleLeftIcon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
          )}
        </button>

        {/* Center Panel - Sections Editor */}
        <div className="flex-1 overflow-y-auto p-4 min-w-0">
          {doc.sections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <LightBulbIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Build Your Lecture</h2>
                <p className="text-zinc-400 text-sm mb-4">
                  Enter a topic on the left, or chat with the assistant on the right to get started.
                </p>
                <div className="grid grid-cols-2 gap-2 text-left text-xs">
                  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="text-orange-400 font-medium">📚 UpToDate</div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-blue-400 font-medium">🩺 MKSAP 19</div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-purple-400 font-medium">🔮 Perplexity</div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-green-400 font-medium">📄 PubMed</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
              {doc.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-xl border transition-all ${
                    section.isExpanded ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  {/* Section Header */}
                  <div
                    className="p-3 flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="text-xl">{SECTION_ICONS[section.type]}</span>
                    <div className="flex-1">
                      <div className="text-xs text-zinc-500">Section {index + 1}</div>
                      <div className="text-base font-medium text-white">{section.title}</div>
                    </div>
                    <span className="text-xs text-zinc-500">{section.slideCount} slides</span>
                    {section.isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>

                  {/* Expanded Content */}
                  {section.isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Key Points */}
                      <div className="flex flex-wrap gap-1.5">
                        {section.keyPoints.map((point, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
                            {point}
                          </span>
                        ))}
                      </div>

                      {/* Content */}
                      {section.content ? (
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{section.content}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => expandSection(section.id)}
                          disabled={expandingSection === section.id}
                          className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-sm
                                     hover:border-purple-500/50 hover:text-purple-400 flex items-center justify-center gap-2"
                        >
                          {expandingSection === section.id ? (
                            <><ArrowPathIcon className="w-3 h-3 animate-spin" /> Writing...</>
                          ) : (
                            <><SparklesIcon className="w-3 h-3" /> Expand</>
                          )}
                        </button>
                      )}

                      {/* Socratic Questions */}
                      {section.followUpQuestions.length > 0 && (
                        <div className="pt-3 border-t border-zinc-800">
                          <div className="text-xs text-zinc-400 mb-2">Follow-up Questions</div>
                          <div className="space-y-1.5">
                            {section.followUpQuestions.slice(0, 3).map((q) => {
                              const style = QUESTION_STYLES[q.type];
                              const isSelected = section.selectedQuestionId === q.id;
                              return (
                                <button
                                  key={q.id}
                                  onClick={() => selectQuestion(section.id, q)}
                                  className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                                    isSelected
                                      ? 'bg-purple-500/20 border border-purple-500/50'
                                      : 'bg-zinc-800/50 hover:bg-zinc-800'
                                  }`}
                                >
                                  <span className="mr-1">{style.icon}</span>
                                  {q.question}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => generateSocraticQuestions(section.id)}
                          disabled={generatingQuestionsFor === section.id}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          {generatingQuestionsFor === section.id ? (
                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                          ) : (
                            <QuestionMarkCircleIcon className="w-3 h-3" />
                          )}
                          Questions
                        </button>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Section */}
              <button
                onClick={() => {
                  const newSection: Section = {
                    id: `section-${Date.now()}`,
                    title: 'New Section',
                    type: 'concept',
                    content: '',
                    keyPoints: [],
                    slideCount: 4,
                    isExpanded: true,
                    followUpQuestions: [],
                  };
                  setDoc(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
                }}
                className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 text-sm
                           hover:border-cyan-500/50 hover:text-cyan-400 flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add Section
              </button>
            </div>
          )}
        </div>

        {/* Right Toggle Button */}
        <button
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          className="flex-shrink-0 w-6 bg-zinc-800 hover:bg-purple-500/30 border-x border-zinc-700 flex items-center justify-center transition-colors group"
          title={rightPanelCollapsed ? 'Show Chat Panel' : 'Hide Chat Panel'}
        >
          {rightPanelCollapsed ? (
            <ChevronDoubleLeftIcon className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
          ) : (
            <ChevronDoubleRightIcon className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
          )}
        </button>

        {/* Right Panel - Chat Assistant */}
        <div className={`${rightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-80'} transition-all duration-300 flex-shrink-0`}>
          <div className={`h-full w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden ${rightPanelCollapsed ? 'invisible' : 'visible'}`}>
          {/* Chat Header */}
          <div className="flex-shrink-0 p-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Lecture Assistant</div>
                <div className="text-xs text-zinc-500">Ask me anything</div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] p-2.5 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {msg.content}
                  {msg.action && (
                    <div className="mt-1.5 pt-1.5 border-t border-zinc-700/50">
                      <span className="text-xs text-purple-400">✓ Action: {msg.action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatProcessing && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 p-2.5 rounded-xl text-sm flex items-center gap-2">
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-zinc-800">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleChatSubmit(action.prompt)}
                  disabled={isChatProcessing}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="flex-shrink-0 p-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
                placeholder="Ask or instruct..."
                disabled={isChatProcessing}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                           placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleChatSubmit()}
                disabled={!chatInput.trim() || isChatProcessing}
                className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white
                           disabled:opacity-50 hover:shadow-lg transition-all"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCanvas;

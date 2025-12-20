/**
 * Interactive Canvas - Unified Lecture Builder for Dr. Swisher
 * Combines Socratic outline + Multi-source research (UpToDate, MKSAP, Perplexity, PubMed)
 */
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LightBulbIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  BoltIcon,
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
  { id: 'gemini', name: 'Gemini 2.5', icon: '💎' },
  { id: 'opus', name: 'Claude Opus', icon: '👑' },
  { id: 'claude', name: 'Claude Sonnet', icon: '🎭' },
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

  // Check scraper on mount
  useEffect(() => {
    checkScraperHealth().then(setScraperStatus);
  }, []);

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

  // Research the topic across selected sources
  const researchTopic = async () => {
    if (!doc.topic.trim() || selectedSources.length === 0) return;
    
    setIsResearching(true);
    setGlobalResearch([]);
    
    const results: ResearchResult[] = [];
    
    // Research each source in parallel
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
      // Get section-specific research
      const sectionResearch = await searchMedicalEvidence(`${doc.topic} ${section.title}`);

      const prompt = `You are an expert medical educator writing lecture content.

TOPIC: ${doc.topic}
SECTION: "${section.title}"
TYPE: ${section.type}
KEY POINTS: ${section.keyPoints.join(', ')}
AUDIENCE: ${doc.targetAudience}

RESEARCH:
${sectionResearch.summary}

KEY EVIDENCE:
${sectionResearch.keyPoints.join('\n')}

Write engaging lecture content:
1. Explain concepts clearly with clinical relevance
2. Use research for accuracy
3. Include specific examples and numbers
4. Maintain conversational teaching tone
5. Build toward key points

Write 2-3 paragraphs of prose (not bullets).`;

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
            <p className="text-xs text-zinc-600 mt-2">
              Run: <code className="bg-zinc-800 px-1 rounded">python3 studio/scraper/scraper_service.py</code>
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Setup & Research */}
        <div className="w-80 lg:w-96 border-r border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Audience</label>
                <select
                  value={doc.targetAudience}
                  onChange={(e) => setDoc(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-2 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                >
                  {AUDIENCES.map(a => (
                    <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duration</label>
                <select
                  value={doc.duration}
                  onChange={(e) => setDoc(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-2 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
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
              <label className="block text-xs font-medium text-zinc-400 mb-2">Research Sources</label>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_SOURCES.map(source => {
                  const isSelected = selectedSources.includes(source.id);
                  const needsLogin = (source.id === 'uptodate' && !scraperStatus?.uptodate_logged_in) ||
                                    (source.id === 'mksap' && !scraperStatus?.mksap_logged_in);
                  
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/50'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <span>{source.icon}</span>
                      <span>{source.name}</span>
                      {needsLogin && <span className="text-yellow-400">🔐</span>}
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
                className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg
                           text-sm font-medium text-cyan-400 flex items-center justify-center gap-2 
                           disabled:opacity-50 transition-all"
              >
                {isResearching ? (
                  <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Researching {selectedSources.length} sources...</>
                ) : (
                  <><MagnifyingGlassIcon className="w-4 h-4" /> Research Topic</>
                )}
              </button>

              <button
                onClick={generateOutline}
                disabled={!doc.topic.trim() || isGeneratingOutline}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                           text-sm font-medium text-white flex items-center justify-center gap-2
                           disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                {isGeneratingOutline ? (
                  <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><SparklesIcon className="w-4 h-4" /> Generate Outline</>
                )}
              </button>
            </div>

            {/* Research Results */}
            {globalResearch.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-400">Research Complete</div>
                {globalResearch.map(r => (
                  <div key={r.source} className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium mb-2">
                      {RESEARCH_SOURCES.find(s => s.id === r.source)?.icon}
                      {RESEARCH_SOURCES.find(s => s.id === r.source)?.name}
                      <span className="text-zinc-500">• {r.keyPoints.length} points</span>
                    </div>
                    <div className="text-xs text-zinc-400 max-h-24 overflow-y-auto">
                      {r.keyPoints.slice(0, 4).map((point, i) => (
                        <div key={i}>• {point.slice(0, 80)}{point.length > 80 ? '...' : ''}</div>
                      ))}
                    </div>
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
                        section.isExpanded
                          ? 'bg-zinc-800 border border-cyan-500/30'
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>{SECTION_ICONS[section.type] || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500">{i + 1}</div>
                        <div className="text-sm text-white truncate">{section.title}</div>
                      </div>
                      {section.content && <CheckCircleIcon className="w-4 h-4 text-green-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Sections Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {doc.sections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <LightBulbIcon className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Build Your Lecture</h2>
                <p className="text-zinc-400 mb-6">
                  Enter a topic, research with UpToDate/MKSAP/Perplexity, then generate a 
                  Socratic outline with thought-provoking questions.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <div className="text-orange-400 font-medium mb-1">📚 UpToDate</div>
                    <div className="text-zinc-500 text-xs">Clinical decision support</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="text-blue-400 font-medium mb-1">🩺 MKSAP 19</div>
                    <div className="text-zinc-500 text-xs">Board-style content</div>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <div className="text-purple-400 font-medium mb-1">🔮 Perplexity</div>
                    <div className="text-zinc-500 text-xs">AI-powered search</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="text-green-400 font-medium mb-1">📄 PubMed</div>
                    <div className="text-zinc-500 text-xs">Primary literature</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {doc.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-xl border transition-all ${
                    section.isExpanded ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  {/* Section Header */}
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="text-2xl">{SECTION_ICONS[section.type]}</span>
                    <div className="flex-1">
                      <div className="text-xs text-zinc-500">Section {index + 1}</div>
                      <div className="text-lg font-medium text-white">{section.title}</div>
                    </div>
                    <span className="text-xs text-zinc-500">{section.slideCount} slides</span>
                    {section.isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Expanded Content */}
                  {section.isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Key Points */}
                      <div className="flex flex-wrap gap-2">
                        {section.keyPoints.map((point, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                            {point}
                          </span>
                        ))}
                      </div>

                      {/* Content or Expand Button */}
                      {section.content ? (
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{section.content}</p>
                          {section.research && section.research.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-zinc-700 text-xs text-cyan-400">
                              📚 {section.research.reduce((sum, r) => sum + r.citations.length, 0)} citations
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => expandSection(section.id)}
                          disabled={expandingSection === section.id}
                          className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500
                                     hover:border-purple-500/50 hover:text-purple-400 transition-all
                                     flex items-center justify-center gap-2"
                        >
                          {expandingSection === section.id ? (
                            <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Researching & Writing...</>
                          ) : (
                            <><SparklesIcon className="w-4 h-4" /> Expand with AI + Research</>
                          )}
                        </button>
                      )}

                      {/* Socratic Questions */}
                      <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-white">Socratic Follow-Ups</span>
                          </div>
                          <button
                            onClick={() => generateSocraticQuestions(section.id)}
                            disabled={generatingQuestionsFor === section.id}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"
                          >
                            {generatingQuestionsFor === section.id ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              <SparklesIcon className="w-3 h-3" />
                            )}
                            Generate
                          </button>
                        </div>

                        {section.followUpQuestions.length > 0 ? (
                          <div className="space-y-2">
                            {section.followUpQuestions.map((q) => {
                              const style = QUESTION_STYLES[q.type] || QUESTION_STYLES.why;
                              const isSelected = section.selectedQuestionId === q.id;

                              return (
                                <button
                                  key={q.id}
                                  onClick={() => selectQuestion(section.id, q)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    isSelected
                                      ? 'bg-purple-500/20 border-purple-500/50'
                                      : 'bg-zinc-800/50 border-zinc-700 hover:border-purple-500/30'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-lg">{style.icon}</span>
                                    <div className="flex-1">
                                      <p className="text-sm text-white mb-1">"{q.question}"</p>
                                      <p className="text-xs text-zinc-500 italic mb-2">{q.insight}</p>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-zinc-600">→</span>
                                        <span className="text-cyan-400">{q.nextTitle}</span>
                                      </div>
                                    </div>
                                    {isSelected && <CheckCircleIcon className="w-5 h-5 text-purple-400" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-zinc-500 text-sm">
                            {section.content ? 'Generate questions' : 'Expand section first'}
                          </div>
                        )}
                      </div>

                      {/* Remove */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeSection(section.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <TrashIcon className="w-3 h-3" /> Remove
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
                className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500
                           hover:border-cyan-500/50 hover:text-cyan-400 transition-all
                           flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" /> Add Section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveCanvas;

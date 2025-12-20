/**
 * Socratic Canvas - AI-Powered Lecture Builder
 * Perplexity for research + Opus for Socratic content generation
 */
import React, { useState } from 'react';
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
  BeakerIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { generateWithProvider } from '../../services/ai-provider';
import { searchMedicalEvidence, getLatestGuidelines, getDifferentialDiagnosis } from '../../services/perplexity';

// Types
interface ResearchResult {
  type: 'evidence' | 'guidelines' | 'differential';
  content: string;
  keyPoints: string[];
  citations: string[];
}

interface SocraticQuestion {
  id: string;
  question: string;
  type: 'why' | 'how' | 'what-if' | 'compare' | 'apply' | 'challenge';
  insight: string; // Why this question matters
  nextTitle: string;
}

interface Section {
  id: string;
  title: string;
  type: 'intro' | 'concept' | 'case' | 'mechanism' | 'clinical' | 'summary';
  content: string;
  keyPoints: string[];
  research?: ResearchResult;
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
  onClose: () => void;
}

const AUDIENCES = [
  { id: 'students', label: 'Medical Students', icon: '📚' },
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

export const SocraticCanvas: React.FC<Props> = ({ onGenerateSlides, onClose }) => {
  const [doc, setDoc] = useState<CanvasDocument>({
    topic: '',
    targetAudience: 'residents',
    duration: 30,
    sections: [],
  });

  const [isResearching, setIsResearching] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatingQuestionsFor, setGeneratingQuestionsFor] = useState<string | null>(null);
  const [expandingSection, setExpandingSection] = useState<string | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult | null>(null);

  // Step 1: Research the topic with Perplexity
  const researchTopic = async () => {
    if (!doc.topic.trim()) return;
    
    setIsResearching(true);
    try {
      // Get evidence and guidelines in parallel
      const [evidence, guidelines] = await Promise.all([
        searchMedicalEvidence(doc.topic),
        getLatestGuidelines(doc.topic),
      ]);

      const combined: ResearchResult = {
        type: 'evidence',
        content: `## Evidence Summary\n${evidence.summary}\n\n## Current Guidelines\n${guidelines.summary}`,
        keyPoints: [...evidence.keyPoints, ...guidelines.keyPoints],
        citations: [...evidence.citations, ...guidelines.citations],
      };

      setResearchResults(combined);
    } catch (error) {
      console.error('Research failed:', error);
    }
    setIsResearching(false);
  };

  // Step 2: Generate outline using Opus + research
  const generateOutline = async () => {
    if (!doc.topic.trim()) return;
    
    setIsGeneratingOutline(true);
    try {
      const researchContext = researchResults 
        ? `\n\nRESEARCH CONTEXT:\n${researchResults.content}\n\nKEY POINTS:\n${researchResults.keyPoints.join('\n')}`
        : '';

      const prompt = `You are an expert medical educator creating a Socratic-style lecture.

TOPIC: "${doc.topic}"
AUDIENCE: ${doc.targetAudience}
DURATION: ${doc.duration} minutes
${researchContext}

Create a lecture outline with 5-7 sections that builds understanding through guided discovery.

For each section, provide:
1. title: A compelling title (can be a question or statement)
2. type: One of "intro", "concept", "mechanism", "case", "clinical", "summary"
3. keyPoints: 3-4 key learning points
4. slideCount: Number of slides (2-6)

IMPORTANT: Structure the outline so each section naturally raises questions that lead to the next section.

Return as JSON array:
[
  {
    "title": "Why Does Blood Pressure Matter? The Silent Killer",
    "type": "intro",
    "keyPoints": ["Prevalence and impact", "End-organ damage", "Why patients don't feel it"],
    "slideCount": 3
  }
]

Return ONLY valid JSON.`;

      const response = await generateWithProvider('opus', prompt, [], {});
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const outline = JSON.parse(jsonMatch[0]);
        const sections: Section[] = outline.map((s: any, i: number) => ({
          id: `section-${Date.now()}-${i}`,
          title: s.title,
          type: s.type || 'concept',
          content: '',
          keyPoints: s.keyPoints || [],
          research: i === 0 && researchResults ? researchResults : undefined,
          slideCount: s.slideCount || 4,
          isExpanded: i === 0,
          followUpQuestions: [],
        }));

        setDoc(prev => ({ ...prev, sections }));
        
        // Auto-generate questions for first section
        if (sections.length > 0) {
          generateSocraticQuestions(sections[0].id, sections);
        }
      }
    } catch (error) {
      console.error('Outline generation failed:', error);
    }
    setIsGeneratingOutline(false);
  };

  // Step 3: Generate Socratic questions for a section using Opus
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
KEY POINTS COVERED: ${section.keyPoints.join(', ')}
${section.content ? `CONTENT: ${section.content.slice(0, 500)}` : ''}

UPCOMING SECTIONS: ${nextSections.map(s => s.title).join(' → ') || 'This is the final section'}

Generate 4-5 powerful Socratic follow-up questions that:
1. Probe deeper into what was just taught
2. Challenge assumptions or common misconceptions
3. Bridge to clinical application
4. Create curiosity for what comes next

For each question provide:
- question: The Socratic question (conversational, thought-provoking)
- type: "why" | "how" | "what-if" | "compare" | "apply" | "challenge"
- insight: Why this question is powerful (1 sentence)
- nextTitle: What the next slide title would be if exploring this question

Make questions feel like a master clinician teaching at the bedside.

Example:
{
  "question": "So we've established that ACE inhibitors block the RAAS system. But here's the puzzle - why do some patients still have uncontrolled blood pressure despite maximum doses?",
  "type": "challenge",
  "insight": "Forces learners to consider escape mechanisms and alternative pathways",
  "nextTitle": "Beyond RAAS: The Aldosterone Escape"
}

Return as JSON array. ONLY valid JSON.`;

      const response = await generateWithProvider('opus', prompt, [], {});
      
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

  // Expand a section with Opus + Perplexity research
  const expandSection = async (sectionId: string) => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;

    setExpandingSection(sectionId);
    try {
      // Get fresh research for this specific section
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

Write engaging lecture content for this section that:
1. Explains concepts clearly with clinical relevance
2. Uses the research provided for accuracy
3. Includes specific examples and numbers
4. Maintains a conversational, teaching tone
5. Builds toward the key points

Write 2-3 paragraphs of prose (not bullets). This will be spoken during the lecture.`;

      const response = await generateWithProvider('opus', prompt, [], {});

      setDoc(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                content: response.trim(),
                research: {
                  type: 'evidence',
                  content: sectionResearch.summary,
                  keyPoints: sectionResearch.keyPoints,
                  citations: sectionResearch.citations,
                },
              }
            : s
        ),
      }));

      // Generate questions after expanding
      generateSocraticQuestions(sectionId);
    } catch (error) {
      console.error('Section expansion failed:', error);
    }
    setExpandingSection(null);
  };

  // Select a question to shape the next section
  const selectQuestion = (sectionId: string, question: SocraticQuestion) => {
    const sectionIndex = doc.sections.findIndex(s => s.id === sectionId);

    setDoc(prev => {
      const newSections = [...prev.sections];
      
      // Mark question as selected
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        selectedQuestionId: question.id,
      };

      // Update next section title if it exists
      if (sectionIndex < newSections.length - 1) {
        newSections[sectionIndex + 1] = {
          ...newSections[sectionIndex + 1],
          title: question.nextTitle,
        };
      } else {
        // Add new section based on question
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
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const totalSlides = doc.sections.reduce((sum, s) => sum + s.slideCount, 0);
  const sectionsWithContent = doc.sections.filter(s => s.content).length;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl">
              <AcademicCapIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Socratic Canvas</h1>
              <p className="text-sm text-zinc-500">
                <span className="text-cyan-400">Perplexity</span> research + <span className="text-purple-400">Opus</span> content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {doc.sections.length > 0 && (
              <div className="text-sm text-zinc-500">
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
              Generate Slides
            </button>
            
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Setup */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Topic Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Topic</label>
            <input
              type="text"
              value={doc.topic}
              onChange={(e) => setDoc(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Hypertensive Emergency"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
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
                <option value={90}>90 min</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={researchTopic}
              disabled={!doc.topic.trim() || isResearching}
              className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg
                         text-sm font-medium text-cyan-400 flex items-center justify-center gap-2 
                         disabled:opacity-50 transition-all"
            >
              {isResearching ? (
                <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Researching...</>
              ) : (
                <><MagnifyingGlassIcon className="w-4 h-4" /> Research with Perplexity</>
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
                <><SparklesIcon className="w-4 h-4" /> Generate Outline with Opus</>
              )}
            </button>
          </div>

          {/* Research Results */}
          {researchResults && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium mb-2">
                <BookOpenIcon className="w-4 h-4" />
                Research Complete
              </div>
              <div className="text-xs text-zinc-400 max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {researchResults.keyPoints.slice(0, 5).map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {researchResults.citations.length} citations found
              </div>
            </div>
          )}

          {/* Section List */}
          {doc.sections.length > 0 && (
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-400 mb-2">SECTIONS</div>
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

        {/* Right Panel - Sections */}
        <div className="flex-1 overflow-y-auto p-6">
          {doc.sections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                  <LightBulbIcon className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Build Your Lecture</h2>
                <p className="text-zinc-400 mb-6">
                  Enter a topic, research with Perplexity, then let Opus generate a Socratic outline 
                  with thought-provoking questions.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left text-sm">
                  <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <div className="text-cyan-400 font-medium mb-1">🔍 Perplexity</div>
                    <div className="text-zinc-500 text-xs">Evidence, guidelines, citations</div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <div className="text-purple-400 font-medium mb-1">👑 Opus</div>
                    <div className="text-zinc-500 text-xs">Socratic questions, content</div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{section.slideCount} slides</span>
                      {section.isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5 text-zinc-500" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
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

                      {/* Content */}
                      {section.content ? (
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{section.content}</p>
                          {section.research && (
                            <div className="mt-3 pt-3 border-t border-zinc-700">
                              <div className="text-xs text-cyan-400 mb-1">
                                📚 {section.research.citations.length} citations
                              </div>
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
                            <><SparklesIcon className="w-4 h-4" /> Expand with Research + Opus</>
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
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded 
                                       hover:bg-purple-500/30 flex items-center gap-1"
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
                                    {isSelected && (
                                      <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-zinc-500 text-sm">
                            {section.content 
                              ? 'Click Generate to create Socratic follow-up questions'
                              : 'Expand section first to generate questions'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
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

export default SocraticCanvas;

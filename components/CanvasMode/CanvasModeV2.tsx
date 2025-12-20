/**
 * Canvas Mode V2 - Socratic Question-Driven Lecture Builder
 * Each section generates insightful follow-up questions that become next sections
 */
import React, { useState, useCallback } from 'react';
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
  BeakerIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { generateWithProvider, AIProvider } from '../../services/ai-provider';

// Types
interface SocraticQuestion {
  id: string;
  question: string;
  type: 'why' | 'how' | 'what-if' | 'compare' | 'apply' | 'challenge';
  depth: 'surface' | 'analytical' | 'evaluative';
  suggestedTitle: string;
}

interface Section {
  id: string;
  title: string;
  type: 'intro' | 'concept' | 'case' | 'mechanism' | 'clinical' | 'summary';
  content: string;
  keyPoints: string[];
  slideCount: number;
  isExpanded: boolean;
  isComplete: boolean;
  followUpQuestions: SocraticQuestion[];
  selectedQuestion?: string; // ID of question that led to next section
}

interface CanvasDocument {
  title: string;
  topic: string;
  targetAudience: 'students' | 'residents' | 'fellows' | 'attendings';
  totalDuration: number;
  sections: Section[];
}

interface Props {
  onGenerateSlides: (doc: CanvasDocument) => void;
  onClose: () => void;
  provider: AIProvider;
}

const QUESTION_TYPES = {
  why: { icon: '🤔', label: 'Why', color: 'purple' },
  how: { icon: '⚙️', label: 'How', color: 'blue' },
  'what-if': { icon: '💭', label: 'What if', color: 'green' },
  compare: { icon: '⚖️', label: 'Compare', color: 'orange' },
  apply: { icon: '🎯', label: 'Apply', color: 'cyan' },
  challenge: { icon: '🔥', label: 'Challenge', color: 'red' },
};

const SECTION_TYPES = {
  intro: { icon: '🎯', label: 'Introduction' },
  concept: { icon: '💡', label: 'Core Concept' },
  case: { icon: '🏥', label: 'Clinical Case' },
  mechanism: { icon: '⚙️', label: 'Mechanism' },
  clinical: { icon: '👨‍⚕️', label: 'Clinical Pearl' },
  summary: { icon: '📋', label: 'Summary' },
};

export const CanvasModeV2: React.FC<Props> = ({ onGenerateSlides, onClose, provider }) => {
  const [doc, setDoc] = useState<CanvasDocument>({
    title: '',
    topic: '',
    targetAudience: 'residents',
    totalDuration: 30,
    sections: [],
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState<string | null>(null);

  // Generate initial outline from topic
  const generateOutline = async () => {
    if (!doc.topic.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Create a medical education lecture outline for: "${doc.topic}"
Target audience: ${doc.targetAudience}
Duration: ${doc.totalDuration} minutes

Return a JSON array of 4-6 sections. Each section should have:
- title: Clear, engaging section title
- type: One of "intro", "concept", "case", "mechanism", "clinical", "summary"
- keyPoints: Array of 3-4 key learning points (brief phrases)
- slideCount: Suggested number of slides (2-8)

Example format:
[
  {"title": "The Silent Killer: Why Hypertension Matters", "type": "intro", "keyPoints": ["Prevalence statistics", "End-organ damage", "Modifiable risk"], "slideCount": 3},
  {"title": "Pathophysiology: RAAS and Beyond", "type": "mechanism", "keyPoints": ["RAAS pathway", "Endothelial dysfunction", "Sodium handling"], "slideCount": 5}
]

Return ONLY valid JSON array, no other text.`;

      const response = await generateWithProvider(provider, prompt, [], {});
      
      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const sections = JSON.parse(jsonMatch[0]);
        const formattedSections: Section[] = sections.map((s: any, i: number) => ({
          id: `section-${Date.now()}-${i}`,
          title: s.title,
          type: s.type || 'concept',
          content: '',
          keyPoints: s.keyPoints || [],
          slideCount: s.slideCount || 4,
          isExpanded: i === 0,
          isComplete: false,
          followUpQuestions: [],
        }));
        
        setDoc(prev => ({
          ...prev,
          title: `${doc.topic} - Lecture`,
          sections: formattedSections,
        }));
        
        // Auto-generate questions for first section
        if (formattedSections.length > 0) {
          generateQuestionsForSection(formattedSections[0].id, formattedSections);
        }
      }
    } catch (error) {
      console.error('Failed to generate outline:', error);
    }
    setIsGenerating(false);
  };

  // Generate Socratic questions for a section
  const generateQuestionsForSection = async (sectionId: string, sectionsOverride?: Section[]) => {
    const sections = sectionsOverride || doc.sections;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    setGeneratingQuestions(sectionId);
    try {
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      const remainingSections = sections.slice(sectionIndex + 1);
      
      const prompt = `You are designing Socratic questions for a medical education lecture.

Current section: "${section.title}"
Key points covered: ${section.keyPoints.join(', ')}
Remaining sections to cover: ${remainingSections.map(s => s.title).join(', ') || 'This is the final section'}

Generate 4-6 thought-provoking follow-up questions that:
1. Bridge from this section to deeper understanding
2. Challenge assumptions or common misconceptions  
3. Connect to clinical application
4. Prompt critical thinking, not just recall

For each question, provide:
- question: The Socratic question (conversational, engaging)
- type: "why" | "how" | "what-if" | "compare" | "apply" | "challenge"
- depth: "surface" | "analytical" | "evaluative"
- suggestedTitle: What the next slide/section title would be if this question is explored

Return JSON array:
[
  {
    "question": "But wait - if ACE inhibitors block RAAS, why do some patients still have uncontrolled hypertension?",
    "type": "challenge",
    "depth": "analytical", 
    "suggestedTitle": "Beyond RAAS: Alternative Pathways"
  },
  {
    "question": "How would you approach a patient who develops a cough on lisinopril?",
    "type": "apply",
    "depth": "evaluative",
    "suggestedTitle": "ACE Inhibitor Intolerance: The ARB Alternative"
  }
]

Make questions feel like a master clinician teaching at the bedside - curious, probing, leading to insight.
Return ONLY the JSON array.`;

      const response = await generateWithProvider(provider, prompt, [], {});
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        const formattedQuestions: SocraticQuestion[] = questions.map((q: any, i: number) => ({
          id: `q-${sectionId}-${i}`,
          question: q.question,
          type: q.type || 'why',
          depth: q.depth || 'analytical',
          suggestedTitle: q.suggestedTitle,
        }));
        
        setDoc(prev => ({
          ...prev,
          sections: prev.sections.map(s => 
            s.id === sectionId 
              ? { ...s, followUpQuestions: formattedQuestions }
              : s
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
    }
    setGeneratingQuestions(null);
  };

  // Generate content for a section
  const generateSectionContent = async (sectionId: string) => {
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    setGeneratingSection(sectionId);
    try {
      const prompt = `Write detailed lecture content for this medical education section:

Title: "${section.title}"
Type: ${section.type}
Key Points to Cover: ${section.keyPoints.join(', ')}
Target Audience: ${doc.targetAudience}
Slides: ${section.slideCount}

Write engaging, educational content that:
- Explains concepts clearly with clinical relevance
- Includes specific examples, numbers, and evidence
- Uses analogies where helpful
- Highlights high-yield information
- Maintains conversational but professional tone

Format as prose paragraphs (not bullet points). This will be spoken during the lecture.
Aim for ${section.slideCount * 100} words.`;

      const response = await generateWithProvider(provider, prompt, [], {});
      
      setDoc(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId 
            ? { ...s, content: response.trim(), isComplete: true }
            : s
        ),
      }));
      
      // Auto-generate questions after content
      generateQuestionsForSection(sectionId);
      
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
    setGeneratingSection(null);
  };

  // Select a question to create next section
  const selectQuestionForNextSection = (sectionId: string, question: SocraticQuestion) => {
    const sectionIndex = doc.sections.findIndex(s => s.id === sectionId);
    
    // Mark selected question
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, selectedQuestion: question.id }
          : s
      ),
    }));
    
    // Check if there's already a next section
    if (sectionIndex < doc.sections.length - 1) {
      // Update next section's title based on question
      setDoc(prev => ({
        ...prev,
        sections: prev.sections.map((s, i) => 
          i === sectionIndex + 1
            ? { ...s, title: question.suggestedTitle }
            : s
        ),
      }));
    } else {
      // Add new section based on question
      const newSection: Section = {
        id: `section-${Date.now()}`,
        title: question.suggestedTitle,
        type: 'concept',
        content: '',
        keyPoints: [],
        slideCount: 4,
        isExpanded: true,
        isComplete: false,
        followUpQuestions: [],
      };
      
      setDoc(prev => ({
        ...prev,
        sections: [...prev.sections, newSection],
      }));
    }
  };

  // Add manual section
  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: 'concept',
      content: '',
      keyPoints: [],
      slideCount: 4,
      isExpanded: true,
      isComplete: false,
      followUpQuestions: [],
    };
    setDoc(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      ),
    }));
  };

  // Update section
  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  // Calculate totals
  const totalSlides = doc.sections.reduce((sum, s) => sum + s.slideCount, 0);
  const completedSections = doc.sections.filter(s => s.isComplete).length;

  const getDepthColor = (depth: string) => {
    switch (depth) {
      case 'surface': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'analytical': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'evaluative': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <AcademicCapIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Socratic Canvas</h1>
              <p className="text-sm text-zinc-500">Build lectures through guided discovery</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {doc.sections.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-500">
                  {completedSections}/{doc.sections.length} sections
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-500">{totalSlides} slides</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-500">~{Math.round(totalSlides * 1.5)} min</span>
              </div>
            )}
            
            <button
              onClick={() => onGenerateSlides(doc as any)}
              disabled={doc.sections.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-sm font-medium text-white
                         flex items-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              <PlayIcon className="w-4 h-4" />
              Generate Slides
            </button>
            
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Setup & Overview */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Topic</label>
              <input
                type="text"
                value={doc.topic}
                onChange={(e) => setDoc(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Hypertensive Emergency Management"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                           placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Audience</label>
                <select
                  value={doc.targetAudience}
                  onChange={(e) => setDoc(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                             focus:outline-none focus:border-cyan-500"
                >
                  <option value="students">Med Students</option>
                  <option value="residents">Residents</option>
                  <option value="fellows">Fellows</option>
                  <option value="attendings">Attendings</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duration</label>
                <select
                  value={doc.totalDuration}
                  onChange={(e) => setDoc(prev => ({ ...prev, totalDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                             focus:outline-none focus:border-cyan-500"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={generateOutline}
              disabled={!doc.topic.trim() || isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-sm font-medium text-white
                         flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Generate Outline
                </>
              )}
            </button>
          </div>
          
          {/* Section List */}
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400">SECTIONS</span>
              <button
                onClick={addSection}
                className="p-1 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {doc.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    section.isExpanded
                      ? 'bg-zinc-800 border-cyan-500/50'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{SECTION_TYPES[section.type]?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{index + 1}</span>
                        {section.isComplete && (
                          <CheckCircleIcon className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-white truncate">{section.title}</p>
                      <p className="text-xs text-zinc-500">{section.slideCount} slides</p>
                    </div>
                    {section.followUpQuestions.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        {section.followUpQuestions.length}Q
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Section Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {doc.sections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                  <LightBulbIcon className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Start with a Topic</h2>
                <p className="text-zinc-400 mb-4">
                  Enter your lecture topic and generate an outline. Each section will include 
                  Socratic questions that guide the narrative flow.
                </p>
                <div className="p-4 bg-zinc-800/50 rounded-xl text-left">
                  <p className="text-sm text-zinc-300 mb-2">Example topics:</p>
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• Acute Coronary Syndrome Management</li>
                    <li>• Sepsis: Early Recognition & Resuscitation</li>
                    <li>• Diabetic Ketoacidosis Step-by-Step</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {doc.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-xl border transition-all ${
                    section.isExpanded
                      ? 'bg-zinc-900 border-zinc-700'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  {/* Section Header */}
                  <div 
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <button className="text-zinc-500">
                      {section.isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <span className="text-2xl">{SECTION_TYPES[section.type]?.icon}</span>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                          Section {index + 1}
                        </span>
                        {section.isComplete && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" /> Complete
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-lg font-semibold text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={section.slideCount}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateSection(section.id, { slideCount: parseInt(e.target.value) });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                      >
                        {[2,3,4,5,6,7,8,10].map(n => (
                          <option key={n} value={n}>{n} slides</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Section Content */}
                  {section.isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Key Points */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">Key Points</label>
                        <div className="flex flex-wrap gap-2">
                          {section.keyPoints.map((point, i) => (
                            <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-sm text-zinc-300">
                              {point}
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="+ Add point"
                            className="px-2 py-1 bg-transparent text-sm text-zinc-400 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                updateSection(section.id, {
                                  keyPoints: [...section.keyPoints, e.currentTarget.value.trim()]
                                });
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-zinc-400">Content</label>
                          <button
                            onClick={() => generateSectionContent(section.id)}
                            disabled={generatingSection === section.id}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"
                          >
                            {generatingSection === section.id ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              <SparklesIcon className="w-3 h-3" />
                            )}
                            Generate
                          </button>
                        </div>
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          placeholder="Write or generate content for this section..."
                          rows={4}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white
                                     placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>
                      
                      {/* Socratic Questions */}
                      <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-white">Follow-Up Questions</span>
                            <span className="text-xs text-zinc-500">Select one to build the next section</span>
                          </div>
                          <button
                            onClick={() => generateQuestionsForSection(section.id)}
                            disabled={generatingQuestions === section.id}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"
                          >
                            {generatingQuestions === section.id ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : (
                              <SparklesIcon className="w-3 h-3" />
                            )}
                            Generate Questions
                          </button>
                        </div>
                        
                        {section.followUpQuestions.length > 0 ? (
                          <div className="space-y-2">
                            {section.followUpQuestions.map((q) => {
                              const typeInfo = QUESTION_TYPES[q.type];
                              const isSelected = section.selectedQuestion === q.id;
                              
                              return (
                                <button
                                  key={q.id}
                                  onClick={() => selectQuestionForNextSection(section.id, q)}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    isSelected
                                      ? 'bg-purple-500/20 border-purple-500/50'
                                      : 'bg-zinc-800/50 border-zinc-700 hover:border-purple-500/30 hover:bg-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-lg">{typeInfo?.icon}</span>
                                    <div className="flex-1">
                                      <p className="text-sm text-white mb-1">"{q.question}"</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs px-1.5 py-0.5 rounded border ${getDepthColor(q.depth)}`}>
                                          {q.depth}
                                        </span>
                                        <span className="text-xs text-zinc-500">→</span>
                                        <span className="text-xs text-cyan-400">{q.suggestedTitle}</span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircleIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-zinc-500 text-sm">
                            Generate content first, then get Socratic questions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Section Button */}
              <button
                onClick={addSection}
                className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-cyan-400 
                           hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasModeV2;

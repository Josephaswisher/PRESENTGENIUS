/**
 * VibePresenterPro - Power User Input Interface
 * Comprehensive content creation workstation for rapid lecture & web content generation
 */
import React, { useCallback, useState, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  AcademicCapIcon,
  PresentationChartBarIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  ClockIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  BeakerIcon,
  HeartIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ListBulletIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { ActivitySelector } from './ActivitySelector';
import { LearnerLevelSelector } from './LearnerLevelSelector';
import { TemplateQueue, QueuedTemplate } from './TemplateQueue';
import { FormatPicker } from './FormatPicker';
import { Activity, LearnerLevel } from '../data/activities';
import { AIProvider, PROVIDERS, getProviderInfo, GenerationOptions } from '../services/ai-provider';

// Plan generation configuration export
export interface PlanGenerationConfig {
  prompt: string;
  title: string;
  selectedFormats: string[];
  selectedSubOptions: Record<string, string>;
  selectedSupplementary: string[];
  selectedModifiers: string[];
  selectedStyle: string;
  learnerLevel?: string;
  activityType?: string;
  files: File[];
}

interface InputAreaProps {
  onGenerate: (prompt: string, files: File[], options: GenerationOptions, provider?: AIProvider) => void;
  onCreatePlan?: (config: PlanGenerationConfig) => void;
  isGenerating: boolean;
  isCreatingPlan?: boolean;
  disabled?: boolean;
}

type InputMode = 'quick' | 'detailed' | 'template';
// Output configuration with multi-select and nuanced options
interface OutputConfig {
  formats: OutputFormatOption[];
  modifiers: OutputModifier[];
  style: OutputStyle;
}

interface OutputFormatOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  desc: string;
  category: 'primary' | 'supplementary';
  subOptions?: { id: string; label: string; default?: boolean }[];
}

interface OutputModifier {
  id: string;
  label: string;
  desc: string;
}

type OutputStyle = 'clinical' | 'academic' | 'casual' | 'visual' | 'minimalist';

interface PromptTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  prompt: string;
  outputFormat: OutputFormat;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'lecture-standard',
    name: 'Standard Lecture',
    icon: <PresentationChartBarIcon className="w-5 h-5" />,
    category: 'Lectures',
    outputFormat: 'presentation',
    prompt: `Create a comprehensive lecture presentation on [TOPIC].

Structure:
- Title slide with learning objectives
- Background/epidemiology (2-3 slides)
- Pathophysiology/mechanism (2-3 slides)
- Clinical presentation & diagnosis (3-4 slides)
- Treatment/management algorithm (3-4 slides)
- Key takeaways & clinical pearls
- Case-based review questions (3-5 MCQs)

Style: Evidence-based, cite guidelines where applicable, include high-yield board facts.`,
  },
  {
    id: 'case-based',
    name: 'Case-Based Learning',
    icon: <BeakerIcon className="w-5 h-5" />,
    category: 'Interactive',
    outputFormat: 'interactive',
    prompt: `Create an interactive case-based learning module on [TOPIC].

Format:
- Chief complaint & initial presentation
- Progressive case reveal (history → exam → labs → imaging)
- Decision points with branching logic
- Differential diagnosis builder
- Treatment selection with feedback
- Case outcome and teaching points
- Similar case variations for practice

Include realistic clinical details and common pitfalls.`,
  },
  {
    id: 'board-review',
    name: 'Board Review Session',
    icon: <AcademicCapIcon className="w-5 h-5" />,
    category: 'Assessment',
    outputFormat: 'quiz',
    prompt: `Create a high-yield board review session on [TOPIC].

Include:
- 15-20 USMLE/board-style questions
- Mix of first-order and higher-order questions
- Vignette-based clinical scenarios
- Image/lab interpretation questions
- Detailed explanations with teaching points
- Evidence level and guideline citations
- "Classic presentation" patterns
- Common wrong answer explanations`,
  },
  {
    id: 'procedure-guide',
    name: 'Procedure/Skills Guide',
    icon: <ListBulletIcon className="w-5 h-5" />,
    category: 'Clinical',
    outputFormat: 'interactive',
    prompt: `Create a step-by-step procedural guide for [PROCEDURE].

Include:
- Indications and contraindications
- Required equipment checklist
- Patient positioning and preparation
- Anatomical landmarks (with diagrams)
- Step-by-step technique with tips
- Common complications and troubleshooting
- Post-procedure care
- Competency checklist for assessment`,
  },
  {
    id: 'topic-review',
    name: 'Rapid Topic Review',
    icon: <LightBulbIcon className="w-5 h-5" />,
    category: 'Quick Ref',
    outputFormat: 'handout',
    prompt: `Create a concise, high-yield topic review on [TOPIC].

Format as:
- One-page visual summary
- Key definitions and classifications
- Diagnostic criteria (tables)
- Treatment algorithms (flowcharts)
- Drug dosing quick reference
- Red flags and emergencies
- Board buzzwords and associations`,
  },
  {
    id: 'patient-education',
    name: 'Patient Education',
    icon: <HeartIcon className="w-5 h-5" />,
    category: 'Patient Care',
    outputFormat: 'webpage',
    prompt: `Create patient-friendly educational content about [CONDITION].

Include:
- Simple explanation of the condition
- Symptoms to watch for
- Treatment options explained simply
- Lifestyle modifications
- When to seek medical attention
- FAQ section
- Glossary of medical terms

Use 6th-grade reading level, avoid jargon.`,
  },
  {
    id: 'morning-report',
    name: 'Morning Report Case',
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    category: 'Teaching',
    outputFormat: 'presentation',
    prompt: `Create a morning report presentation for [CASE TYPE].

Structure:
- Case presentation (HPI, PMH, meds, exam, labs)
- Pause points for audience discussion
- Differential diagnosis framework
- Diagnostic workup reasoning
- Final diagnosis reveal
- Management discussion
- Learning points and references
- Similar cases to consider`,
  },
  {
    id: 'journal-club',
    name: 'Journal Club Slides',
    icon: <BookOpenIcon className="w-5 h-5" />,
    category: 'Teaching',
    outputFormat: 'presentation',
    prompt: `Create journal club presentation slides for analyzing [STUDY/TOPIC].

Include:
- Background and clinical question
- Study design and methods critique
- PICO framework
- Results summary with key figures
- Statistical analysis discussion
- Strengths and limitations
- Clinical applicability
- Practice-changing implications`,
  },
];

// Primary output formats (can select multiple)
const PRIMARY_FORMATS: OutputFormatOption[] = [
  {
    id: 'slides',
    name: 'Slide Presentation',
    icon: <PresentationChartBarIcon className="w-5 h-5" />,
    desc: 'Traditional slide-by-slide format',
    category: 'primary',
    subOptions: [
      { id: 'slides-standard', label: 'Standard (Title + Content)', default: true },
      { id: 'slides-visual', label: 'Visual Heavy (Image-first)' },
      { id: 'slides-dense', label: 'Dense (Max content per slide)' },
      { id: 'slides-reveal', label: 'Progressive Reveal' },
    ]
  },
  {
    id: 'canvas',
    name: 'Canvas / Freeform',
    icon: <Squares2X2Icon className="w-5 h-5" />,
    desc: 'Infinite canvas with zoomable nodes',
    category: 'primary',
    subOptions: [
      { id: 'canvas-mindmap', label: 'Mind Map Layout', default: true },
      { id: 'canvas-flowchart', label: 'Flowchart/Process' },
      { id: 'canvas-radial', label: 'Radial/Spoke Layout' },
      { id: 'canvas-timeline', label: 'Timeline/Linear Flow' },
    ]
  },
  {
    id: 'interactive',
    name: 'Interactive Module',
    icon: <PlayIcon className="w-5 h-5" />,
    desc: 'Click-through with branching logic',
    category: 'primary',
    subOptions: [
      { id: 'interactive-case', label: 'Case-Based (Clinical Decision)', default: true },
      { id: 'interactive-sim', label: 'Simulation/Scenario' },
      { id: 'interactive-explore', label: 'Exploratory (Non-linear)' },
      { id: 'interactive-guided', label: 'Guided Tour' },
    ]
  },
  {
    id: 'document',
    name: 'Long-Form Document',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    desc: 'Scrollable article or report format',
    category: 'primary',
    subOptions: [
      { id: 'doc-article', label: 'Article/Blog Style', default: true },
      { id: 'doc-textbook', label: 'Textbook Chapter' },
      { id: 'doc-protocol', label: 'Protocol/Guidelines' },
      { id: 'doc-review', label: 'Literature Review' },
    ]
  },
];

// Supplementary outputs (generated alongside primary)
const SUPPLEMENTARY_FORMATS: OutputFormatOption[] = [
  {
    id: 'quiz',
    name: 'Assessment/Quiz',
    icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
    desc: 'MCQs, T/F, matching questions',
    category: 'supplementary',
    subOptions: [
      { id: 'quiz-board', label: 'Board-Style (Vignettes)' },
      { id: 'quiz-rapid', label: 'Rapid Fire (Quick recall)' },
      { id: 'quiz-applied', label: 'Applied/Clinical' },
    ]
  },
  {
    id: 'handout',
    name: 'Quick Reference Card',
    icon: <DocumentIcon className="w-5 h-5" />,
    desc: 'Dense, printable 1-2 page summary',
    category: 'supplementary',
  },
  {
    id: 'flashcards',
    name: 'Flashcard Deck',
    icon: <RectangleStackIcon className="w-5 h-5" />,
    desc: 'Spaced repetition ready',
    category: 'supplementary',
  },
  {
    id: 'speaker-notes',
    name: 'Speaker Notes',
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    desc: 'Talking points and delivery cues',
    category: 'supplementary',
  },
];

// Output modifiers (applicable to all formats)
const OUTPUT_MODIFIERS: OutputModifier[] = [
  { id: 'animated', label: 'Animated Transitions', desc: 'Add motion and transitions' },
  { id: 'print-friendly', label: 'Print Optimized', desc: 'High-contrast, saves ink' },
  { id: 'accessible', label: 'Accessibility First', desc: 'Screen reader friendly, high contrast' },
  { id: 'mobile-first', label: 'Mobile Optimized', desc: 'Touch-friendly, responsive' },
  { id: 'embed-ready', label: 'LMS/Embed Ready', desc: 'SCORM-compatible, iframe-safe' },
  { id: 'gamified', label: 'Gamification', desc: 'Points, progress, badges' },
];

// Visual style presets
const STYLE_PRESETS: { id: OutputStyle; name: string; desc: string; colors: string }[] = [
  { id: 'clinical', name: 'Clinical', desc: 'Professional medical aesthetic', colors: 'bg-blue-600' },
  { id: 'academic', name: 'Academic', desc: 'Scholarly, formal presentation', colors: 'bg-slate-600' },
  { id: 'visual', name: 'Visual/Bold', desc: 'High-impact, image-heavy', colors: 'bg-purple-600' },
  { id: 'minimalist', name: 'Minimalist', desc: 'Clean, whitespace-focused', colors: 'bg-zinc-600' },
  { id: 'casual', name: 'Casual/Fun', desc: 'Friendly, approachable tone', colors: 'bg-amber-600' },
];

export const InputArea: React.FC<InputAreaProps> = ({
  onGenerate,
  onCreatePlan,
  isGenerating,
  isCreatingPlan = false,
  disabled = false,
}) => {
  const { info } = useToast();

  // Core state
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel | null>(null);
  
  // Template Queue state (multi-template mode)
  const [templateQueue, setTemplateQueue] = useState<QueuedTemplate[]>([]);
  const [useQueueMode, setUseQueueMode] = useState(false);
  
  // AI Provider state
  const [aiProvider, setAiProvider] = useState<AIProvider>('openrouter');

  // Enhanced state
  const [inputMode, setInputMode] = useState<InputMode>('detailed');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [title, setTitle] = useState('');
  const [slideCount, setSlideCount] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [includeCitations, setIncludeCitations] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  // Multi-select output configuration
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['slides']));
  const [selectedSubOptions, setSelectedSubOptions] = useState<Record<string, string>>({
    slides: 'slides-standard',
    canvas: 'canvas-mindmap',
    interactive: 'interactive-case',
    document: 'doc-article',
    quiz: 'quiz-board',
  });
  const [selectedSupplementary, setSelectedSupplementary] = useState<Set<string>>(new Set());
  const [selectedModifiers, setSelectedModifiers] = useState<Set<string>>(new Set());
  const [selectedStyle, setSelectedStyle] = useState<OutputStyle>('clinical');
  const [showOutputConfig, setShowOutputConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File handling
  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles = Array.from(newFiles).filter(file =>
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length < newFiles.length) {
      console.warn('Some files were skipped. Only Images and PDFs are supported.');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, isGenerating]);

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
            setFiles(prev => [...prev, file]);
          }
        }
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err);
    }
  };

  // URL import placeholder
  const handleUrlImport = () => {
    if (!urlInput.trim()) return;
    // In production, this would fetch and process the URL
    info(`URL import: ${urlInput}\n\nThis feature would fetch content from the URL and add it as context.`);
    setUrlInput('');
    setShowUrlInput(false);
  };

  // Toggle format selection
  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(formatId)) {
        next.delete(formatId);
      } else {
        next.add(formatId);
      }
      return next;
    });
  };

  const toggleSupplementary = (formatId: string) => {
    setSelectedSupplementary(prev => {
      const next = new Set(prev);
      if (next.has(formatId)) {
        next.delete(formatId);
      } else {
        next.add(formatId);
      }
      return next;
    });
  };

  const toggleModifier = (modifierId: string) => {
    setSelectedModifiers(prev => {
      const next = new Set(prev);
      if (next.has(modifierId)) {
        next.delete(modifierId);
      } else {
        next.add(modifierId);
      }
      return next;
    });
  };

  // Use template
  const applyTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
    // Map template output format to new system
    const formatMap: Record<string, string> = {
      presentation: 'slides',
      interactive: 'interactive',
      webpage: 'document',
      handout: 'handout',
      quiz: 'quiz',
      canvas: 'canvas',
    };
    const mappedFormat = formatMap[template.outputFormat] || 'slides';
    if (['slides', 'canvas', 'interactive', 'document'].includes(mappedFormat)) {
      setSelectedFormats(new Set([mappedFormat]));
    } else {
      setSelectedSupplementary(new Set([mappedFormat]));
    }
    setInputMode('detailed');
    textareaRef.current?.focus();
  };

  // Build final prompt with comprehensive output configuration
  const buildFinalPrompt = (): string => {
    let finalPrompt = prompt;

    // Add title if provided
    if (title.trim()) {
      finalPrompt = `Title: ${title}\n\n${finalPrompt}`;
    }

    // Add template queue instructions if in queue mode
    if (useQueueMode && templateQueue.length > 0) {
      const totalSlides = templateQueue.reduce((sum, item) => sum + item.slideCount, 0);
      const queueInstructions = templateQueue.map((item, index) => {
        return `${index + 1}. ${item.activity.name} (${item.slideCount} slide${item.slideCount > 1 ? 's' : ''}): ${item.activity.description}
   Use this prompt augmentation: ${item.activity.systemPromptAugment.slice(0, 200)}...`;
      }).join('\n\n');

      finalPrompt += `\n\n=== MULTI-TEMPLATE PRESENTATION STRUCTURE ===
Create a cohesive presentation with ${totalSlides} total slides using these activity types in order:

${queueInstructions}

IMPORTANT: 
- Create smooth transitions between different activity types
- Maintain consistent visual theme throughout
- Each section should flow naturally into the next
- Include a title slide at the beginning and summary at the end
`;
    }

    // Build output format instructions
    const formatDescriptions: Record<string, Record<string, string>> = {
      slides: {
        'slides-standard': 'Traditional slide presentation with title and bullet points per slide.',
        'slides-visual': 'Visual-first slides with large images and minimal text.',
        'slides-dense': 'Dense slides maximizing content per slide for comprehensive coverage.',
        'slides-reveal': 'Progressive reveal slides that build up concepts step-by-step.',
      },
      canvas: {
        'canvas-mindmap': 'Freeform canvas with mind map layout - central topic with branching subtopics.',
        'canvas-flowchart': 'Canvas with flowchart/process diagram layout showing step-by-step flow.',
        'canvas-radial': 'Radial/spoke layout with central theme and surrounding connected concepts.',
        'canvas-timeline': 'Timeline-based canvas showing progression or chronological information.',
      },
      interactive: {
        'interactive-case': 'Interactive case-based module with clinical decision points and branching outcomes.',
        'interactive-sim': 'Simulation/scenario-based with realistic situation walkthroughs.',
        'interactive-explore': 'Non-linear exploratory module where users can navigate freely.',
        'interactive-guided': 'Guided tour with step-by-step progression and interactive checkpoints.',
      },
      document: {
        'doc-article': 'Long-form article/blog style with clear headings and flowing narrative.',
        'doc-textbook': 'Textbook chapter format with structured sections and learning objectives.',
        'doc-protocol': 'Clinical protocol/guidelines format with clear steps and decision points.',
        'doc-review': 'Literature review format synthesizing multiple sources and evidence.',
      },
    };

    // Add primary format instructions
    if (selectedFormats.size > 0) {
      const formatParts: string[] = [];
      selectedFormats.forEach(formatId => {
        const subOption = selectedSubOptions[formatId];
        const desc = formatDescriptions[formatId]?.[subOption] || '';
        if (desc) formatParts.push(desc);
      });
      if (formatParts.length > 0) {
        finalPrompt += `\n\nOUTPUT FORMAT:\n${formatParts.join('\n')}`;
      }
    }

    // Add supplementary output instructions
    if (selectedSupplementary.size > 0) {
      const suppParts: string[] = [];
      if (selectedSupplementary.has('quiz')) {
        const quizType = selectedSubOptions['quiz'] || 'quiz-board';
        const quizDesc: Record<string, string> = {
          'quiz-board': 'Include board-style MCQs with clinical vignettes.',
          'quiz-rapid': 'Include rapid-fire recall questions for quick review.',
          'quiz-applied': 'Include applied clinical reasoning questions.',
        };
        suppParts.push(quizDesc[quizType] || 'Include assessment questions.');
      }
      if (selectedSupplementary.has('handout')) {
        suppParts.push('Generate a dense, printable quick reference card (1-2 pages max).');
      }
      if (selectedSupplementary.has('flashcards')) {
        suppParts.push('Create spaced-repetition flashcard content (front/back format).');
      }
      if (selectedSupplementary.has('speaker-notes')) {
        suppParts.push('Include detailed speaker notes with talking points and delivery cues.');
      }
      if (suppParts.length > 0) {
        finalPrompt += `\n\nALSO INCLUDE:\n${suppParts.join('\n')}`;
      }
    }

    // Add style preference
    const styleDesc: Record<OutputStyle, string> = {
      clinical: 'Use professional medical aesthetic with clinical color scheme (blues, whites).',
      academic: 'Use scholarly, formal presentation style appropriate for academic settings.',
      visual: 'Make it visually bold and high-impact with prominent imagery.',
      minimalist: 'Clean, minimalist design with ample whitespace and focused content.',
      casual: 'Friendly, approachable tone with engaging visuals.',
    };
    finalPrompt += `\n\nSTYLE: ${styleDesc[selectedStyle]}`;

    // Add modifiers
    if (selectedModifiers.size > 0) {
      const modParts: string[] = [];
      if (selectedModifiers.has('animated')) modParts.push('Add smooth CSS animations and transitions.');
      if (selectedModifiers.has('print-friendly')) modParts.push('Optimize for printing (high contrast, no dark backgrounds).');
      if (selectedModifiers.has('accessible')) modParts.push('Ensure full accessibility (ARIA labels, high contrast, screen reader support).');
      if (selectedModifiers.has('mobile-first')) modParts.push('Design mobile-first with touch-friendly interactions.');
      if (selectedModifiers.has('embed-ready')) modParts.push('Make it embeddable in LMS/iframe contexts.');
      if (selectedModifiers.has('gamified')) modParts.push('Add gamification elements (progress tracking, points, achievements).');
      if (modParts.length > 0) {
        finalPrompt += `\n\nMODIFIERS:\n${modParts.join('\n')}`;
      }
    }

    // Add constraints
    if (slideCount) {
      finalPrompt += `\n\nTarget approximately ${slideCount} slides/sections.`;
    }
    if (duration) {
      finalPrompt += `\n\nDesign for a ${duration}-minute presentation.`;
    }
    if (includeCitations) {
      finalPrompt += '\n\nInclude evidence citations and guideline references where appropriate.';
    }

    return finalPrompt;
  };

  const handleSubmit = () => {
    const finalPrompt = buildFinalPrompt();
    if (!finalPrompt.trim() && files.length === 0) return;

    onGenerate(finalPrompt, files, {
      activityId: selectedActivity?.id,
      learnerLevel: selectedLevel || undefined,
    }, aiProvider);

    // Clear for next generation
    setPrompt('');
    setFiles([]);
    setTitle('');
    setSelectedTemplate(null);
  };

  const handleCreatePlan = () => {
    if (!onCreatePlan) return;
    if (!prompt.trim() && files.length === 0) return;

    const config: PlanGenerationConfig = {
      prompt: prompt,
      title: title,
      selectedFormats: Array.from(selectedFormats),
      selectedSubOptions: selectedSubOptions,
      selectedSupplementary: Array.from(selectedSupplementary),
      selectedModifiers: Array.from(selectedModifiers),
      selectedStyle: selectedStyle,
      learnerLevel: selectedLevel || undefined,
      activityType: selectedActivity?.id,
      files: files,
    };

    onCreatePlan(config);
  };

  const canSubmit = (prompt.trim() || files.length > 0 || (useQueueMode && templateQueue.length > 0)) && !isGenerating && !isCreatingPlan;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className={`
        relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden
        ${isDragging ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-zinc-700/50 hover:border-zinc-600'}
        ${isGenerating ? 'opacity-80' : ''}
      `}>

        {/* Mode Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'quick', label: 'Quick', icon: <SparklesIcon className="w-4 h-4" /> },
            { id: 'detailed', label: 'Detailed', icon: <DocumentTextIcon className="w-4 h-4" /> },
            { id: 'template', label: 'Templates', icon: <RectangleStackIcon className="w-4 h-4" /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setInputMode(mode.id as InputMode)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                inputMode === mode.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-4">

          {/* Template Mode */}
          {inputMode === 'template' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Select a template to get started quickly:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PROMPT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                      selectedTemplate?.id === template.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      {template.icon}
                    </div>
                    <h4 className="font-medium text-white text-sm">{template.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{template.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick & Detailed Mode Content */}
          {inputMode !== 'template' && (
            <>
              {/* Title Input (Detailed only) */}
              {inputMode === 'detailed' && (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Presentation Title (optional)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              )}

              {/* AI Provider Selection */}
              <div className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <span className="text-sm text-zinc-400">AI Provider:</span>
                <div className="flex gap-2">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setAiProvider(provider.id)}
                      disabled={isGenerating || disabled}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        aiProvider === provider.id
                          ? `bg-gradient-to-r ${provider.color} text-white shadow-lg`
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      } ${(isGenerating || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>{provider.icon}</span>
                      <span>{provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection Mode Toggle */}
              <div className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <span className="text-sm text-zinc-400">Template Mode:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseQueueMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !useQueueMode
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                  >
                    Single Template
                  </button>
                  <button
                    onClick={() => setUseQueueMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      useQueueMode
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                  >
                    <span>Multi-Template Queue</span>
                    {templateQueue.length > 0 && (
                      <span className="bg-cyan-500 text-zinc-900 text-xs px-1.5 rounded-full">
                        {templateQueue.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Single Template Mode: Activity & Level Row */}
              {!useQueueMode && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <ActivitySelector
                      selectedActivity={selectedActivity}
                      onSelectActivity={setSelectedActivity}
                      learnerLevel={selectedLevel || undefined}
                      disabled={isGenerating || disabled}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <LearnerLevelSelector
                      selectedLevel={selectedLevel}
                      onSelectLevel={setSelectedLevel}
                      disabled={isGenerating || disabled}
                    />
                  </div>
                </div>
              )}

              {/* Multi-Template Queue Mode */}
              {useQueueMode && (
                <div className="space-y-3">
                  <div className="flex-shrink-0">
                    <LearnerLevelSelector
                      selectedLevel={selectedLevel}
                      onSelectLevel={setSelectedLevel}
                      disabled={isGenerating || disabled}
                    />
                  </div>
                  <TemplateQueue
                    queue={templateQueue}
                    onUpdateQueue={setTemplateQueue}
                    learnerLevel={selectedLevel || undefined}
                    disabled={isGenerating || disabled}
                  />
                </div>
              )}

              {/* Output Configuration Panel (Detailed only) */}
              {inputMode === 'detailed' && (
                <div className="space-y-4">
                  {/* Output Config Toggle */}
                  <button
                    onClick={() => setShowOutputConfig(!showOutputConfig)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Squares2X2Icon className="w-5 h-5 text-cyan-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">
                          Output Format
                          <span className="ml-2 text-xs text-cyan-400">
                            ({selectedFormats.size} format{selectedFormats.size !== 1 ? 's' : ''} selected)
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          Click to choose presentation format
                        </div>
                      </div>
                    </div>
                    {showOutputConfig ? <ChevronUpIcon className="w-5 h-5 text-zinc-400" /> : <ChevronDownIcon className="w-5 h-5 text-zinc-400" />}
                  </button>

                  {/* Expanded Format Picker */}
                  {showOutputConfig && (
                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <FormatPicker
                        selectedFormats={selectedFormats}
                        onToggleFormat={toggleFormat}
                        selectedSubOptions={selectedSubOptions}
                        onSubOptionChange={(formatId, subId) => setSelectedSubOptions(prev => ({ ...prev, [formatId]: subId }))}
                        disabled={isGenerating || disabled}
                      />

                      {/* Visual Style */}
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          Visual Style
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {STYLE_PRESETS.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setSelectedStyle(style.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                selectedStyle === style.id
                                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white'
                              }`}
                              title={style.desc}
                            >
                              <span className={`w-3 h-3 rounded-full ${style.colors}`}></span>
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Modifiers */}
                      <div className="mt-4">
                        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Output Modifiers
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {OUTPUT_MODIFIERS.map((mod) => (
                            <button
                              key={mod.id}
                              onClick={() => toggleModifier(mod.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                                selectedModifiers.has(mod.id)
                                  ? 'bg-green-600/20 text-green-300 border border-green-500/50'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white'
                              }`}
                              title={mod.desc}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedModifiers.has(mod.id) ? 'bg-green-500 border-green-500' : 'border-zinc-600'
                              }`}>
                                {selectedModifiers.has(mod.id) && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              {mod.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`
                  relative rounded-xl border-2 border-dashed transition-all
                  ${files.length > 0 ? 'border-zinc-700 bg-zinc-800/30' : ''}
                  ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-700 hover:border-zinc-500'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={isGenerating || disabled}
                />

                {files.length === 0 ? (
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      {/* Upload Methods */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-200 transition-colors"
                      >
                        <ArrowUpTrayIcon className="w-5 h-5 text-cyan-400" />
                        Upload Files
                      </button>

                      <button
                        onClick={handlePaste}
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-200 transition-colors"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5 text-purple-400" />
                        Paste Image
                      </button>

                      <button
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-200 transition-colors"
                      >
                        <LinkIcon className="w-5 h-5 text-green-400" />
                        Import URL
                      </button>
                    </div>

                    {/* URL Input */}
                    {showUrlInput && (
                      <div className="mt-4 flex gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com/resource"
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleUrlImport}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm"
                        >
                          Import
                        </button>
                      </div>
                    )}

                    <p className="text-center text-zinc-500 text-sm mt-4">
                      Drop images, PDFs, or lecture notes • Supports multiple files
                    </p>
                  </div>
                ) : (
                  /* File Preview Grid */
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-zinc-400">{files.length} file{files.length !== 1 ? 's' : ''} uploaded</span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        + Add more
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <DocumentIcon className="w-6 h-6 text-red-400" />
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-3 h-3 text-white" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 p-0.5 text-[8px] text-zinc-300 truncate text-center">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Prompt Area */}
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
                  {inputMode === 'quick' ? 'What do you want to create?' : 'Detailed Instructions'}
                </label>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    inputMode === 'quick'
                      ? 'E.g., "Create a lecture on heart failure management for residents"'
                      : `Describe your content in detail. Include:
• Topic and scope
• Key learning objectives
• Specific content to cover
• Cases or examples to include
• Style preferences`
                  }
                  className={`w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none ${
                    inputMode === 'quick' ? 'h-20' : 'h-40'
                  }`}
                />
              </div>

              {/* Advanced Options (Detailed only) */}
              {inputMode === 'detailed' && (
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Advanced Options
                    {showAdvanced ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-800/50 rounded-xl">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Target Slides</label>
                        <input
                          type="number"
                          value={slideCount}
                          onChange={(e) => setSlideCount(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="Auto"
                          min={1}
                          max={100}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Duration (min)</label>
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="Auto"
                          min={5}
                          max={180}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeCitations"
                          checked={includeCitations}
                          onChange={(e) => setIncludeCitations(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-500"
                        />
                        <label htmlFor="includeCitations" className="text-sm text-zinc-300">Add Citations</label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Submit Row - Dual Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500 flex flex-wrap gap-2">
              {files.length > 0 && <span className="text-cyan-400">{files.length} files</span>}
              {files.length > 0 && prompt.length > 0 && <span>•</span>}
              {prompt.length > 0 && <span>{prompt.length} chars</span>}
              {useQueueMode && templateQueue.length > 0 && (
                <span className="text-green-400">
                  • {templateQueue.length} templates ({templateQueue.reduce((s, t) => s + t.slideCount, 0)} slides)
                </span>
              )}
              {selectedFormats.size > 0 && (
                <span className="text-purple-400">
                  • {selectedFormats.size} format{selectedFormats.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Create Plan Button */}
              {onCreatePlan && (
                <button
                  onClick={handleCreatePlan}
                  disabled={!canSubmit}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
                    ${canSubmit
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:border-purple-400'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    }
                  `}
                >
                  {isCreatingPlan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                      Planning...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="w-4 h-4" />
                      Create Plan
                    </>
                  )}
                </button>
              )}

              {/* Quick Generate Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all
                  ${canSubmit
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-900/30 hover:shadow-cyan-500/30 hover:scale-[1.02]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Quick Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs text-zinc-500">
        <span>💡 Tip: Be specific about your audience level and learning objectives</span>
      </div>
    </div>
  );
};

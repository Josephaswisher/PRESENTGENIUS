/**
 * Lecture Types - Core type definitions for PRESENTGENIUS
 */

export interface DurationPreset {
  id: string;
  label: string;
  minutes: number;
  slides: number;
  description: string;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { id: 'lightning', label: 'Lightning Talk', minutes: 5, slides: 5, description: '5 min / 5 slides' },
  { id: 'short', label: 'Short Talk', minutes: 10, slides: 10, description: '10 min / 10 slides' },
  { id: 'conference', label: 'Conference', minutes: 20, slides: 15, description: '20 min / 15 slides' },
  { id: 'lecture', label: 'Lecture', minutes: 45, slides: 30, description: '45 min / 30 slides' },
  { id: 'grand-rounds', label: 'Grand Rounds', minutes: 60, slides: 40, description: '60 min / 40 slides' },
  { id: 'custom', label: 'Custom', minutes: 30, slides: 20, description: 'Custom duration' },
];

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'clinical-blue',
    name: 'Clinical Blue',
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: '#f8fafc',
    text: '#1e293b',
  },
  {
    id: 'surgical-green',
    name: 'Surgical Green',
    primary: '#047857',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#f0fdf4',
    text: '#1e293b',
  },
  {
    id: 'cardio-red',
    name: 'Cardiology Red',
    primary: '#b91c1c',
    secondary: '#ef4444',
    accent: '#f87171',
    background: '#fef2f2',
    text: '#1e293b',
  },
  {
    id: 'neuro-purple',
    name: 'Neurology Purple',
    primary: '#6b21a8',
    secondary: '#a855f7',
    accent: '#c084fc',
    background: '#faf5ff',
    text: '#1e293b',
  },
  {
    id: 'peds-orange',
    name: 'Pediatrics Orange',
    primary: '#c2410c',
    secondary: '#f97316',
    accent: '#fb923c',
    background: '#fff7ed',
    text: '#1e293b',
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    background: '#0f172a',
    text: '#f1f5f9',
  },
];

export interface VisualMetaphor {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const VISUAL_METAPHORS: VisualMetaphor[] = [
  { id: 'none', name: 'Standard', description: 'Clean medical presentation', icon: '📋' },
  { id: 'journey', name: 'Clinical Journey', description: 'Patient pathway metaphor', icon: '🛤️' },
  { id: 'detective', name: 'Medical Detective', description: 'Diagnostic mystery solving', icon: '🔍' },
  { id: 'building', name: 'Building Blocks', description: 'Foundation to mastery', icon: '🧱' },
  { id: 'tree', name: 'Decision Tree', description: 'Branching algorithms', icon: '🌳' },
  { id: 'timeline', name: 'Timeline', description: 'Chronological progression', icon: '📅' },
];

export type PrintableType = 
  | 'notes'
  | 'flashcards'
  | 'worksheet'
  | 'checklist'
  | 'algorithm'
  | 'summary';

export interface PrintableConfig {
  type: PrintableType;
  name: string;
  description: string;
  icon: string;
}

export const PRINTABLE_TYPES: PrintableConfig[] = [
  { type: 'notes', name: 'Speaker Notes', description: 'Detailed presentation notes', icon: '📝' },
  { type: 'flashcards', name: 'Flashcards', description: 'Key concepts for review', icon: '🎴' },
  { type: 'worksheet', name: 'Worksheet', description: 'Practice problems', icon: '📋' },
  { type: 'checklist', name: 'Checklist', description: 'Clinical checklist', icon: '✅' },
  { type: 'algorithm', name: 'Algorithm', description: 'Decision algorithm', icon: '🔀' },
  { type: 'summary', name: 'Summary', description: 'One-page summary', icon: '📄' },
];

export interface LectureTheme {
  colorScheme: ColorScheme;
  metaphor: VisualMetaphor;
  fontFamily: string;
  headerStyle: 'bold' | 'clean' | 'minimal';
}

export interface LectureSettings {
  duration: DurationPreset;
  theme: LectureTheme;
  printables: PrintableType[];
  includeQuiz: boolean;
  includeReferences: boolean;
}

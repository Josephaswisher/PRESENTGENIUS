/**
 * Canvas Mode Types
 */

export interface OutlineSection {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  notes: string;
  subsections: OutlineSection[];
  duration: number; // minutes
  slideCount: number;
  status: 'empty' | 'draft' | 'complete';
  collapsed: boolean;
  sources: ContentSource[];
}

export type SectionType = 
  | 'title'
  | 'objectives'
  | 'introduction'
  | 'content'
  | 'case'
  | 'quiz'
  | 'summary'
  | 'references'
  | 'custom';

export interface ContentSource {
  id: string;
  type: 'research' | 'guideline' | 'manual' | 'ai-generated';
  title: string;
  content: string;
  citation?: string;
  addedAt: Date;
}

export interface CanvasDocument {
  id: string;
  title: string;
  topic: string;
  targetAudience: string;
  duration: number;
  outline: OutlineSection[];
  createdAt: Date;
  updatedAt: Date;
  status: 'planning' | 'drafting' | 'reviewing' | 'complete';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sectionId?: string; // If message is about a specific section
  action?: AIAction;
}

export interface AIAction {
  type: 'add-content' | 'research' | 'expand' | 'rewrite' | 'add-section';
  targetId?: string;
  content?: string;
}

export const SECTION_TEMPLATES: { type: SectionType; name: string; icon: string; defaultDuration: number }[] = [
  { type: 'title', name: 'Title Slide', icon: '🎯', defaultDuration: 1 },
  { type: 'objectives', name: 'Learning Objectives', icon: '📋', defaultDuration: 2 },
  { type: 'introduction', name: 'Introduction', icon: '👋', defaultDuration: 3 },
  { type: 'content', name: 'Content Section', icon: '📝', defaultDuration: 5 },
  { type: 'case', name: 'Clinical Case', icon: '🏥', defaultDuration: 8 },
  { type: 'quiz', name: 'Quiz/Assessment', icon: '❓', defaultDuration: 5 },
  { type: 'summary', name: 'Summary', icon: '📌', defaultDuration: 3 },
  { type: 'references', name: 'References', icon: '📚', defaultDuration: 1 },
  { type: 'custom', name: 'Custom Section', icon: '✨', defaultDuration: 5 },
];

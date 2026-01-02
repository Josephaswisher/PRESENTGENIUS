/**
 * Template System Type Definitions
 * Defines structure for format templates with variable support
 */

import { LearnerLevel } from '../data/activities';

// Supported template variable placeholders
export const TEMPLATE_VARIABLES = ['TOPIC', 'AUDIENCE', 'DURATION', 'LEARNER_LEVEL', 'SPECIALTY'] as const;
export type TemplateVariable = typeof TEMPLATE_VARIABLES[number];

// Template variable context for substitution
export interface VariableContext {
  TOPIC?: string;
  AUDIENCE?: string;
  DURATION?: string;
  LEARNER_LEVEL?: string;
  SPECIALTY?: string;
  [key: string]: string | undefined;
}

// Template categories
export type TemplateCategory =
  | 'assessment'
  | 'interactive'
  | 'gamification'
  | 'diagnostic'
  | 'presentation'
  | 'reference'
  | 'new-formats';

// Template metadata
export interface TemplateMetadata {
  id: string;
  name: string;
  icon: string;
  category: TemplateCategory;
  description: string;
  previewThumbnail?: string;
  supportedVariables: TemplateVariable[];
  learnerLevels: LearnerLevel[];
  estimatedSlides?: number;
  tags?: string[];
}

// Full template definition
export interface Template {
  meta: TemplateMetadata;
  promptAugment: string;
  htmlTemplate?: string; // Optional base HTML template
}

// Format option for UI picker
export interface FormatOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'primary' | 'supplementary' | 'special';
  previewThumbnail?: string;
  subOptions?: FormatSubOption[];
}

export interface FormatSubOption {
  id: string;
  label: string;
  default?: boolean;
}

// Output style presets
export type OutputStyle = 'clinical' | 'academic' | 'visual' | 'minimalist' | 'casual';

export interface StylePreset {
  id: OutputStyle;
  name: string;
  description: string;
  colorClass: string;
}

// Output modifiers
export interface OutputModifier {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

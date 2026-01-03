/**
 * Template Registry
 * Central hub for all format templates with lookup utilities
 */

import { Template, TemplateCategory, VariableContext } from './types';
import { substituteVariables, mergeWithDefaults } from './utils/variable-substitution';

// Import all templates
import boardMcqTemplate from './assessment/board-mcq/prompt';
import infographicTemplate from './new-formats/infographic/prompt';
import journalClubTemplate from './new-formats/journal-club/prompt';
import diagnosisMannequinTemplate from './new-formats/diagnosis-mannequin/prompt';
import chiefComplaintTemplate from './new-formats/chief-complaint-approach/prompt';
import presentationStandardTemplate from './new-formats/presentation-standard/prompt';
import drugDosingTemplate from './interactive/drug-dosing/prompt';

// Template Registry
export const TEMPLATE_REGISTRY: Record<string, Template> = {
  // Assessment Templates
  'board-mcq': boardMcqTemplate,

  // Interactive Templates
  'drug-dosing': drugDosingTemplate,

  // New Format Templates
  'infographic': infographicTemplate,
  'journal-club': journalClubTemplate,
  'diagnosis-mannequin': diagnosisMannequinTemplate,
  'chief-complaint-approach': chiefComplaintTemplate,
  'presentation-standard': presentationStandardTemplate,
};

/**
 * Get a template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATE_REGISTRY[id];
}

/**
 * Get template prompt augment with variables substituted
 */
export function getPromptAugment(id: string, context?: VariableContext): string {
  const template = TEMPLATE_REGISTRY[id];
  if (!template) return '';

  if (context) {
    const mergedContext = mergeWithDefaults(context);
    return substituteVariables(template.promptAugment, mergedContext);
  }

  return template.promptAugment;
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.meta.category === category);
}

/**
 * Get all template IDs
 */
export function getAllTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Get all templates as array
 */
export function getAllTemplates(): Template[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Search templates by tag
 */
export function searchTemplatesByTag(tag: string): Template[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t =>
    t.meta.tags?.includes(tag.toLowerCase())
  );
}

/**
 * Get templates suitable for a learner level
 */
export function getTemplatesForLevel(level: string): Template[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t =>
    t.meta.learnerLevels.includes(level as any)
  );
}

// Re-export types and utilities
export * from './types';
export { substituteVariables, extractVariables, validateVariables } from './utils/variable-substitution';

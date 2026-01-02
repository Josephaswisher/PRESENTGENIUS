/**
 * Template Variable Substitution Utility
 * Handles [TOPIC], [AUDIENCE], [DURATION] placeholder replacement
 */

import { TemplateVariable, TEMPLATE_VARIABLES, VariableContext } from '../types';

/**
 * Substitute template variables with actual values
 * @param template - Template string containing [VARIABLE] placeholders
 * @param context - Object with variable values
 * @returns Template with variables replaced
 */
export function substituteVariables(template: string, context: VariableContext): string {
  let result = template;

  for (const [key, value] of Object.entries(context)) {
    if (value) {
      // Replace [VARIABLE] pattern
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      result = result.replace(regex, value);
    }
  }

  return result;
}

/**
 * Extract variable placeholders from a template string
 * @param template - Template string to analyze
 * @returns Array of variable names found
 */
export function extractVariables(template: string): TemplateVariable[] {
  const matches = template.match(/\[(\w+)\]/g) || [];
  const variables = matches
    .map(m => m.slice(1, -1) as TemplateVariable)
    .filter(v => TEMPLATE_VARIABLES.includes(v));

  // Return unique variables
  return [...new Set(variables)];
}

/**
 * Check if all required variables have values
 * @param template - Template string to check
 * @param context - Variable context
 * @returns Object with validation result and missing variables
 */
export function validateVariables(
  template: string,
  context: VariableContext
): { valid: boolean; missing: TemplateVariable[] } {
  const required = extractVariables(template);
  const missing = required.filter(v => !context[v]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get default values for common variables
 */
export function getDefaultVariables(): Partial<VariableContext> {
  return {
    AUDIENCE: 'medical residents',
    DURATION: '30 minutes',
    LEARNER_LEVEL: 'PGY2-3',
  };
}

/**
 * Merge user context with defaults
 */
export function mergeWithDefaults(context: VariableContext): VariableContext {
  return {
    ...getDefaultVariables(),
    ...context,
  };
}

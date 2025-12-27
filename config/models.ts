/**
 * Centralized AI Model Configuration
 * Update model IDs here when new versions are released
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'anthropic' | 'openrouter';
  description: string;
  maxTokens: number;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

export const AI_MODELS = {
  gemini: {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'google',
    description: 'Fast, cost-effective, excellent for agentic workflows and UI generation',
    maxTokens: 32768,
    inputCostPer1M: 0.50,
    outputCostPer1M: 3.00,
  } as ModelConfig,

  claude: {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'openrouter',
    description: 'Balanced performance and quality for content generation',
    maxTokens: 16000,
  } as ModelConfig,

  opus: {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'openrouter',
    description: 'Premium quality for complex medical education content',
    maxTokens: 16000,
  } as ModelConfig,
} as const;

export type ModelKey = keyof typeof AI_MODELS;

export function getModelId(key: ModelKey): string {
  return AI_MODELS[key].id;
}

export function getModelConfig(key: ModelKey): ModelConfig {
  return AI_MODELS[key];
}

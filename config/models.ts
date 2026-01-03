/**
 * Centralized AI Model Configuration
 * Update model IDs here when new versions are released
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: "google" | "deepseek" | "minimax" | "glm" | "anthropic";
  description: string;
  maxTokens: number;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

// Gemini Models
const GEMINI_FLASH: ModelConfig = {
  id: "gemini-3-flash-preview",
  name: "Gemini 3 Flash",
  provider: "google",
  description: "Near-Pro intelligence at Flash speed with 1M context - 3x faster than 2.5 Pro",
  maxTokens: 1000000,
  inputCostPer1M: 0.5,
  outputCostPer1M: 3.0,
};

const GEMINI_PRO: ModelConfig = {
  id: "gemini-3-pro-preview",
  name: "Gemini 3 Pro",
  provider: "google",
  description: "Most advanced reasoning Gemini model - Superior problem solving with 1M context",
  maxTokens: 1000000,
  inputCostPer1M: 2.5,
  outputCostPer1M: 10.0,
};

export const AI_MODELS = {
  gemini: GEMINI_FLASH,
  geminiPro: GEMINI_PRO,

  deepseek: {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    description: "Most cost-effective model - excellent for medical education",
    maxTokens: 16000,
    inputCostPer1M: 0.3,
    outputCostPer1M: 1.2,
  } as ModelConfig,

  minimax: {
    id: "MiniMax-M2.1",
    name: "MiniMax M2.1",
    provider: "minimax",
    description: "Advanced coding & reasoning model with 200K context",
    maxTokens: 16000,
    inputCostPer1M: 0.3,
    outputCostPer1M: 1.2,
  } as ModelConfig,

  claude: {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description:
      "Extended thinking with 1M context - Streaming, vision, advanced reasoning",
    maxTokens: 1000000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  } as ModelConfig,

  opus: {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    description:
      "Best model for coding, agents, and computer use with 200K context - Industry-leading capability",
    maxTokens: 200000,
    inputCostPer1M: 5.0,
    outputCostPer1M: 25.0,
  } as ModelConfig,
} as const;

export type ModelKey = keyof typeof AI_MODELS;

export function getModelId(key: ModelKey): string {
  return AI_MODELS[key].id;
}

export function getModelConfig(key: ModelKey): ModelConfig {
  return AI_MODELS[key];
}

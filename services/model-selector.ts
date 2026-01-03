/**
 * Smart Model Selection based on content size and requirements
 */
import { OpenRouterModelId, OPENROUTER_MODELS } from './openrouter';

export interface ModelRecommendation {
  modelId: OpenRouterModelId;
  reason: string;
  estimatedCost: number;
  contextUsage: number; // percentage of context used
}

/**
 * Calculate estimated tokens from text
 */
export function estimateTokens(text: string): number {
  // Rule of thumb: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Get model context limits
 */
const MODEL_LIMITS: Record<OpenRouterModelId, number> = {
  'deepseek/deepseek-chat': 64000,
  'deepseek/deepseek-r1': 64000,
  'anthropic/claude-3.5-sonnet': 200000,
  'anthropic/claude-3.5-haiku': 200000,
  'anthropic/claude-opus-4-5': 200000,
  'anthropic/claude-sonnet-4.5': 200000,
  'openai/gpt-4o': 128000,
  'openai/gpt-4o-mini': 128000,
  'openai/o1': 200000,
  'openai/o1-pro': 200000,
  'meta-llama/llama-3.3-70b-instruct': 128000,
  'meta-llama/llama-3.1-405b-instruct': 128000,
  'meta-llama/llama-3.1-8b-instruct': 128000,
  'google/gemini-2.0-flash-001': 1000000,
  'google/gemini-2.5-pro-preview': 2000000,
  'google/gemma-2-27b-it': 8192,
  'qwen/qwen-2.5-72b-instruct': 32000,
  'z-ai/glm-4.7': 200000,
  'minimax/minimax-m2.1': 200000,
};

/**
 * Smart model selection based on content size
 */
export function selectOptimalModel(
  htmlContent: string,
  instruction: string,
  preferences: {
    prioritize?: 'cost' | 'quality' | 'speed';
    maxCostPer1M?: number;
  } = {}
): ModelRecommendation {
  const totalContent = htmlContent + instruction;
  const estimatedInputTokens = estimateTokens(totalContent);
  const estimatedOutputTokens = 16000; // max_tokens setting
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;

  console.log('🤖 [Model Selector] Analyzing content:', {
    htmlLength: htmlContent.length,
    instructionLength: instruction.length,
    estimatedInputTokens,
    estimatedOutputTokens,
    totalTokens
  });

  // Define model tiers by priority
  const modelOptions: Array<{
    modelId: OpenRouterModelId;
    priority: number;
    costScore: number; // lower is cheaper
    qualityScore: number; // higher is better
    speedScore: number; // higher is faster
  }> = [
    // Budget tier (best cost)
    { modelId: 'deepseek/deepseek-chat', priority: 1, costScore: 1, qualityScore: 7, speedScore: 8 },
    { modelId: 'openai/gpt-4o-mini', priority: 2, costScore: 2, qualityScore: 8, speedScore: 9 },
    { modelId: 'anthropic/claude-3.5-haiku', priority: 3, costScore: 3, qualityScore: 8, speedScore: 10 },

    // Quality tier (best quality)
    { modelId: 'anthropic/claude-3.5-sonnet', priority: 4, costScore: 5, qualityScore: 10, speedScore: 7 },
    { modelId: 'openai/gpt-4o', priority: 5, costScore: 6, qualityScore: 9, speedScore: 8 },
    { modelId: 'anthropic/claude-opus-4-5', priority: 6, costScore: 8, qualityScore: 10, speedScore: 6 },

    // Specialized
    { modelId: 'google/gemini-2.0-flash-001', priority: 7, costScore: 4, qualityScore: 8, speedScore: 10 },
    { modelId: 'meta-llama/llama-3.3-70b-instruct', priority: 8, costScore: 2, qualityScore: 7, speedScore: 7 },
  ];

  // Filter models that can handle the content
  const viableModels = modelOptions.filter(option => {
    const limit = MODEL_LIMITS[option.modelId];
    const usage = (totalTokens / limit) * 100;
    return usage < 90; // Keep under 90% to be safe
  });

  if (viableModels.length === 0) {
    // Emergency: Use model with largest context
    console.warn('⚠️ [Model Selector] Content exceeds most model limits! Using Gemini 2.5 Pro (2M context)');
    return {
      modelId: 'google/gemini-2.5-pro-preview',
      reason: 'Content too large for standard models - using 2M context model',
      estimatedCost: 0, // Would need to calculate
      contextUsage: (totalTokens / 2000000) * 100
    };
  }

  // Select based on preference
  let selectedModel: typeof modelOptions[0];

  if (preferences.prioritize === 'cost') {
    selectedModel = viableModels.sort((a, b) => a.costScore - b.costScore)[0];
  } else if (preferences.prioritize === 'speed') {
    selectedModel = viableModels.sort((a, b) => b.speedScore - a.speedScore)[0];
  } else {
    // Default: quality, but use cheaper if content is small
    if (totalTokens < 20000) {
      // Small content: DeepSeek is fine
      selectedModel = viableModels.find(m => m.modelId === 'deepseek/deepseek-chat') || viableModels[0];
    } else {
      // Larger content: prefer quality
      selectedModel = viableModels.sort((a, b) => b.qualityScore - a.qualityScore)[0];
    }
  }

  const limit = MODEL_LIMITS[selectedModel.modelId];
  const contextUsage = (totalTokens / limit) * 100;

  let reason = '';
  if (totalTokens < 20000) {
    reason = 'Small content - using cost-effective model';
  } else if (totalTokens > 50000) {
    reason = 'Large content - using high-context model';
  } else if (preferences.prioritize === 'quality') {
    reason = 'Prioritizing quality for medical content';
  } else {
    reason = 'Optimal balance of cost and quality';
  }

  console.log('✅ [Model Selector] Selected:', {
    model: selectedModel.modelId,
    modelName: OPENROUTER_MODELS[selectedModel.modelId]?.name,
    reason,
    contextUsage: `${contextUsage.toFixed(1)}%`,
    estimatedTokens: totalTokens
  });

  return {
    modelId: selectedModel.modelId,
    reason,
    estimatedCost: 0, // Would calculate based on pricing
    contextUsage
  };
}

/**
 * Check if content will fit in a specific model
 */
export function willFitInModel(
  content: string,
  modelId: OpenRouterModelId,
  safetyMargin = 0.9 // Use only 90% of context to be safe
): { fits: boolean; usage: number; limit: number } {
  const tokens = estimateTokens(content);
  const limit = MODEL_LIMITS[modelId];
  const maxUsable = limit * safetyMargin;
  const fits = tokens <= maxUsable;
  const usage = (tokens / limit) * 100;

  return { fits, usage, limit };
}

/**
 * Suggest model upgrade if content is too large
 */
export function suggestModelUpgrade(
  currentModel: OpenRouterModelId,
  content: string
): { shouldUpgrade: boolean; suggestion?: ModelRecommendation } {
  const check = willFitInModel(content, currentModel);

  if (check.fits) {
    return { shouldUpgrade: false };
  }

  // Content doesn't fit, suggest upgrade
  const suggestion = selectOptimalModel(content, '', { prioritize: 'quality' });

  return {
    shouldUpgrade: true,
    suggestion
  };
}

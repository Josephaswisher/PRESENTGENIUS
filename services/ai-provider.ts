/**
 * Unified AI Provider Service
 * Simplified to MiniMax only for focused development
 */
import { getAdaptivePromptContext } from './knowledge';
import { getCachedResponse, setCachedResponse } from './cache';
import { getSetupInstructions } from './api-key-validation';
import { withRetry } from '../lib/retry';
import { MiniMaxProvider } from './providers/minimax';
import type { FileInput } from './openrouter';

export type AIProvider = 'minimax';

export type GenerationPhase =
  | 'starting'
  | 'validating'
  | 'minimax'
  | 'parallel'
  | 'processing'
  | 'caching'
  | 'complete'
  | 'error';

export interface GenerationOptions {
  modelId?: string;
  activityId?: string;
  learnerLevel?: string;
  useCitations?: boolean;
}

export type ProgressCallback = (
  phase: GenerationPhase,
  progress: number,
  message?: string,
  error?: any,
  partialContent?: string
) => void;

export interface ModelInfo {
  id: string;
  name: string;
  contextLimit: number;
  costTier: 'budget' | 'balanced' | 'premium';
  description: string;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  model: string;
  models?: ModelInfo[];
  icon: string;
  color: string;
  contextLimit?: number;
  endpoint?: string;
}

// Simplified to MiniMax only
const PROVIDERS_LIST: ProviderInfo[] = [
  {
    id: 'minimax',
    name: 'MiniMax M2.1',
    model: 'MiniMax-M2.1',
    models: [
      {
        id: 'MiniMax-M2.1',
        name: 'MiniMax M2.1',
        contextLimit: 200000,
        costTier: 'balanced',
        description: 'Fast with reasoning mode - 200K context',
      },
      {
        id: 'MiniMax-M2.1-lightning',
        name: 'MiniMax M2.1 Lightning',
        contextLimit: 200000,
        costTier: 'budget',
        description: 'Ultra-fast variant',
      },
    ],
    icon: '💨',
    color: 'from-teal-500 to-cyan-500',
    contextLimit: 200000,
    endpoint: 'https://api.minimax.io/v1/text/chatcompletion_v2',
  },
];

export const PROVIDERS: ProviderInfo[] & Record<string, ProviderInfo> = Object.assign(
  [...PROVIDERS_LIST],
  Object.fromEntries(PROVIDERS_LIST.map(p => [p.id, p]))
);

/**
 * Only one provider available - always return minimax
 */
export function selectBestProvider(prompt: string, files: FileInput[]): AIProvider {
  return 'minimax';
}

/**
 * Get provider info by ID
 */
export function getProviderInfo(provider: AIProvider): ProviderInfo {
  return PROVIDERS[provider] || PROVIDERS[0];
}

/**
 * Check if MiniMax API key is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  const env = import.meta.env;
  return Boolean(env.VITE_MINIMAX_API_KEY || env.minimax_api_key);
}


/**
 * Provider status for UI display
 */
export function getProviderStatus(provider: AIProvider): {
  available: boolean;
  status: 'configured' | 'missing_key' | 'invalid_key';
  message: string;
  suggestions?: string[];
} {
  const available = isProviderAvailable(provider);
  const providerInfo = getProviderInfo(provider);

  return {
    available,
    status: available ? 'configured' : 'missing_key',
    message: available
      ? `${providerInfo.name} is ready`
      : `Add VITE_MINIMAX_API_KEY to enable ${providerInfo.name}`,
    suggestions: available ? undefined : [
      'Get your MiniMax API key from https://platform.minimax.io/user-center/api-key',
      'Set VITE_MINIMAX_API_KEY in .env.local',
      'Restart the dev server after updating .env.local',
    ],
  };
}

export function getProviderSetupInstructions(provider: AIProvider): string {
  return getSetupInstructions();
}

/**
 * NOTE: generateWithProvider() and refineWithProvider() have been removed.
 * All generation now uses the parallel pipeline via generateParallelCourse()
 * from services/parallel-generation.ts
 *
 * This ensures:
 * - Consistent containerized output (each slide in isolated iframe)
 * - Flexible slide count (4-50+ based on content)
 * - Multi-agent quality for all generation
 */

/**
 * Simple AI text generation for utility services
 * Use this for: suggestions, questions, titles, etc.
 * For full presentations: use generateParallelCourse()
 */
export async function generateWithProvider(
  provider: AIProvider,
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {},
  onProgress?: ProgressCallback
): Promise<string> {
  // All providers consolidated to MiniMax
  const minimax = new MiniMaxProvider();
  return await minimax.generate(prompt, files, options, onProgress);
}

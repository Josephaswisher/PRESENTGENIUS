/**
 * Unified AI Provider Service
 * Uses OpenRouter for all AI generation (DeepSeek V3 default)
 * Features: Retry, Caching, Progress callbacks
 */
import * as openrouter from './openrouter';
import { withRetry } from '../lib/retry';
import { getCachedResponse, setCachedResponse } from './cache';
import { getAdaptivePromptContext } from './knowledge';

export type AIProvider = 'openrouter';

// Re-export OpenRouter models for UI
export { OPENROUTER_MODELS, type OpenRouterModelId } from './openrouter';

export type GenerationPhase = 'starting' | 'openrouter' | 'caching' | 'complete';

export interface ProgressCallback {
  (phase: GenerationPhase, progress: number, message?: string): void;
}

export interface FileInput {
  base64: string;
  mimeType: string;
}

export interface GenerationOptions {
  activityId?: string;
  learnerLevel?: string;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  model: string;
  icon: string;
  color: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openrouter',
    name: 'DeepSeek V3 (via OpenRouter)',
    model: 'deepseek/deepseek-chat',
    icon: '🔵',
    color: 'from-blue-500 to-indigo-500',
  },
];

/**
 * Get provider info - always returns OpenRouter
 */
export function selectBestProvider(prompt: string, files: FileInput[]): AIProvider {
  return 'openrouter';
}

export function getProviderInfo(provider: AIProvider): ProviderInfo {
  return PROVIDERS[0];
}

export function isProviderAvailable(provider: AIProvider): boolean {
  return !!import.meta.env.VITE_OPENROUTER_API_KEY;
}

/**
 * Main generation function using OpenRouter (DeepSeek V3)
 */
export async function generateWithProvider(
  provider: AIProvider,
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {},
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.('starting', 0, 'Initializing...');

  // Inject adaptive context
  const adaptiveContext = getAdaptivePromptContext();
  const enhancedPrompt = `${prompt}\n${adaptiveContext}`;

  // Check cache first
  if (files.length === 0) {
    const cached = await getCachedResponse(enhancedPrompt, 'openrouter');
    if (cached) {
      onProgress?.('complete', 100, 'Loaded from cache');
      return cached;
    }
  }

  const opts = {
    activityId: options.activityId,
    learnerLevel: options.learnerLevel as any,
  };

  // Generate with OpenRouter (DeepSeek V3)
  onProgress?.('openrouter', 10, 'DeepSeek V3 generating...');
  const result = await withRetry(
    () => openrouter.bringToLife(enhancedPrompt, files, opts),
    {
      maxRetries: 3,
      onRetry: (err, attempt) => {
        console.log(`[OpenRouter] Retry ${attempt}:`, err.message);
        onProgress?.('openrouter', 10 + attempt * 10, `Retrying... (${attempt})`);
      }
    }
  );

  // Cache the result (skip for file-based generations)
  if (files.length === 0) {
    onProgress?.('caching', 95, 'Saving to cache...');
    await setCachedResponse(enhancedPrompt, result, 'openrouter');
  }

  onProgress?.('complete', 100, 'Done');
  return result;
}

export async function refineWithProvider(
  provider: AIProvider,
  currentHtml: string,
  instruction: string
): Promise<string> {
  return openrouter.refineArtifact(currentHtml, instruction);
}

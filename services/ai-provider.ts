/**
 * Unified AI Provider Service
 * Full multi-provider support with Auto-select, Dual AI, and individual providers
 * Restored original implementation with Opus 4.5, Sonnet 4.5, Gemini 3.0 Flash
 */
import { getAdaptivePromptContext } from './knowledge';
import { getCachedResponse, setCachedResponse } from './cache';
import { getSetupInstructions } from './api-key-validation';
import { generateWithOpenRouter, OPENROUTER_MODELS, type OpenRouterModelId, type FileInput } from './openrouter';
import { withRetry } from '../lib/retry';
import { ClaudeProvider } from './providers/claude';
import { GeminiProvider } from './providers/gemini';
import { MiniMaxProvider } from './providers/minimax';
import { GLMProvider } from './providers/glm';

export type AIProvider = 'auto' | 'gemini' | 'claude' | 'opus' | 'openrouter' | 'dual' | 'minimax' | 'glm';

export type GenerationPhase =
  | 'starting'
  | 'validating'
  | 'openrouter'
  | 'claude'
  | 'opus'
  | 'gemini'
  | 'minimax'
  | 'glm'
  | 'citations'
  | 'parallel'
  | 'enhancing'
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

// Provider configurations restored from original implementation
const PROVIDERS_LIST: ProviderInfo[] = [
  {
    id: 'auto',
    name: 'Auto (Smart Select)',
    model: 'auto',
    icon: '🎯',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'gemini',
    name: 'Gemini 3.0 Flash',
    model: 'gemini-3-flash-preview',
    models: [
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3.0 Flash',
        contextLimit: 1000000,
        costTier: 'balanced',
        description: 'Near-Pro intelligence at Flash speed - 3x faster than 2.5 Pro',
      },
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3.0 Pro',
        contextLimit: 1000000,
        costTier: 'premium',
        description: 'Most advanced reasoning Gemini model - Superior problem solving',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextLimit: 1000000,
        costTier: 'balanced',
        description: 'Stable multimodal model',
      },
    ],
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    contextLimit: 1000000,
  },
  {
    id: 'claude',
    name: 'Claude Sonnet 4.5',
    model: 'claude-sonnet-4-5',
    models: [
      {
        id: 'claude-sonnet-4-5',
        name: 'Claude Sonnet 4.5',
        contextLimit: 200000,
        costTier: 'balanced',
        description: 'Fast and capable for most medical education tasks',
      },
    ],
    icon: '🧠',
    color: 'from-orange-500 to-amber-500',
    contextLimit: 200000,
  },
  {
    id: 'opus',
    name: 'Claude Opus 4.5',
    model: 'claude-opus-4-5',
    models: [
      {
        id: 'claude-opus-4-5',
        name: 'Claude Opus 4.5',
        contextLimit: 200000,
        costTier: 'premium',
        description: 'Most capable - best for complex medical content and accuracy',
      },
    ],
    icon: '👑',
    color: 'from-purple-500 to-pink-500',
    contextLimit: 200000,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model)',
    model: 'deepseek/deepseek-chat',
    models: [
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        contextLimit: 64000,
        costTier: 'budget',
        description: 'Budget-friendly reasoning model',
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        contextLimit: 64000,
        costTier: 'balanced',
        description: 'Advanced reasoning capabilities',
      },
      {
        id: 'anthropic/claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4.0',
        contextLimit: 200000,
        costTier: 'premium',
        description: 'Claude via OpenRouter',
      },
    ],
    icon: '🌐',
    color: 'from-indigo-500 to-violet-500',
    contextLimit: 64000,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  },
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
  {
    id: 'glm',
    name: 'GLM-4.7',
    model: 'glm-4.7',
    models: [
      {
        id: 'glm-4.7',
        name: 'GLM-4.7 (Latest)',
        contextLimit: 200000,
        costTier: 'balanced',
        description: 'Enhanced coding & reasoning - Dec 2025',
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        contextLimit: 200000,
        costTier: 'budget',
        description: 'Fast and lightweight',
      },
    ],
    icon: '🟡',
    color: 'from-yellow-500 to-orange-500',
    contextLimit: 200000,
    endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
  },
  {
    id: 'dual',
    name: 'Dual AI (Gemini + Opus 4.5)',
    model: 'dual-gemini-opus',
    icon: '🔥',
    color: 'from-cyan-500 via-purple-500 to-pink-500',
  },
];

export const PROVIDERS: ProviderInfo[] & Record<string, ProviderInfo> = Object.assign(
  [...PROVIDERS_LIST],
  Object.fromEntries(PROVIDERS_LIST.map(p => [p.id, p]))
);

const OPENROUTER_KEY = (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY || (import.meta as any)?.env?.openrouter_api_key;

/**
 * Auto-select the best provider based on task complexity
 * Restored from original implementation
 */
export function selectBestProvider(prompt: string, files: FileInput[]): AIProvider {
  const hasImages = files.some(f => f.mimeType.startsWith('image/'));
  const promptLength = prompt.length;
  const isComplex = promptLength > 500 ||
    prompt.toLowerCase().includes('case study') ||
    prompt.toLowerCase().includes('differential') ||
    prompt.toLowerCase().includes('algorithm');
  const isMedicalDeep = prompt.toLowerCase().includes('board') ||
    prompt.toLowerCase().includes('usmle') ||
    prompt.toLowerCase().includes('evidence-based');

  // Complex medical content with images -> Dual (best quality)
  if (hasImages && isComplex) return 'dual';

  // Deep medical content -> Opus (best accuracy)
  if (isMedicalDeep) return 'opus';

  // Complex but no images -> Opus
  if (isComplex) return 'opus';

  // Simple/fast -> Gemini (fastest)
  return 'gemini';
}

/**
 * Get provider info by ID
 */
export function getProviderInfo(provider: AIProvider): ProviderInfo {
  return PROVIDERS[provider] || PROVIDERS[0];
}

/**
 * Check if provider is available by checking for API key
 * Updated to support all providers including opus, dual, and auto
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  const env = import.meta.env;
  const hasGemini = Boolean(env.VITE_GEMINI_API_KEY || env.API_KEY);
  const hasClaude = Boolean(env.VITE_ANTHROPIC_API_KEY || env.VITE_OPENROUTER_API_KEY);
  const hasOpenRouter = Boolean(env.VITE_OPENROUTER_API_KEY);
  const hasMiniMax = Boolean(env.VITE_MINIMAX_API_KEY || env.minimax_api_key);
  const hasGLM = Boolean(env.VITE_GLM_API_KEY || env.GLM_API_KEY || env.ZAI_API_KEY);

  switch (provider) {
    case 'gemini':
      return hasGemini;
    case 'claude':
    case 'opus':
      return hasClaude;
    case 'openrouter':
      return hasOpenRouter;
    case 'minimax':
      return hasMiniMax;
    case 'glm':
      return hasGLM;
    case 'dual':
      return hasGemini && hasClaude; // Dual needs both
    case 'auto':
      return hasGemini || hasClaude || hasOpenRouter || hasMiniMax || hasGLM; // Auto needs at least one
    default:
      return false;
  }
}

/**
 * Dual-agent generation: Gemini creates structure, Opus enhances content
 * Restored with streaming support for both phases
 */
async function generateWithDualAgents(
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {},
  onProgress?: ProgressCallback
): Promise<string> {
  const opts = {
    activityId: options.activityId,
    learnerLevel: options.learnerLevel as any,
  };

  // Phase 1: Gemini creates the base structure and interactivity (with streaming)
  onProgress?.('gemini', 10, '🏗️ Gemini creating structure...');
  console.log('[Dual AI] Phase 1: Gemini creating structure...');

  const geminiProvider = new GeminiProvider();
  const geminiResult = await withRetry(
    () => geminiProvider.generate(
      `${prompt}\n\nFocus on creating excellent HTML structure, interactive elements, and visual design.`,
      files,
      {
        ...opts,
        modelId: options.modelId,
      },
      (phase, progress, message, error, partialContent) => {
        // Stream Gemini phase partial content
        onProgress?.('gemini', 30, 'Gemini streaming...', undefined, partialContent);
      }
    ),
    { maxRetries: 2, onRetry: (err, attempt) => console.log(`[Gemini] Retry ${attempt}:`, err.message) }
  );

  onProgress?.('gemini', 50, '✓ Gemini structure complete');

  // Phase 2: Opus enhances the medical content and accuracy (with streaming)
  onProgress?.('opus', 55, '👑 Opus enhancing content...');
  console.log('[Dual AI] Phase 2: Opus enhancing content...');

  const opusProvider = new ClaudeProvider();
  const opusEnhanced = await withRetry(
    () => opusProvider.generate(
      `Review and enhance this medical education content:
      1. Improve clinical accuracy and depth
      2. Add evidence-based teaching points
      3. Enhance explanations for better learning
      4. Ensure medical terminology is correct
      5. Keep the HTML structure and interactivity intact

      Return the improved HTML.

      CURRENT HTML:
      ${geminiResult}`,
      [],
      {
        ...opts,
        modelId: 'claude-opus-4-5',
      },
      (phase, progress, message, error, partialContent) => {
        // Stream Opus phase partial content
        onProgress?.('opus', 75, 'Opus streaming...', undefined, partialContent);
      }
    ),
    { maxRetries: 2, onRetry: (err, attempt) => console.log(`[Opus] Retry ${attempt}:`, err.message) }
  );

  onProgress?.('complete', 100, '🔥 Dual AI generation complete');
  return opusEnhanced;
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

  const keyMap: Partial<Record<AIProvider, string>> = {
    openrouter: 'VITE_OPENROUTER_API_KEY',
    claude: 'VITE_ANTHROPIC_API_KEY',
    gemini: 'VITE_GEMINI_API_KEY',
    minimax: 'VITE_MINIMAX_API_KEY',
    glm: 'VITE_GLM_API_KEY',
    opus: 'VITE_ANTHROPIC_API_KEY',
  };

  return {
    available,
    status: available ? 'configured' : 'missing_key',
    message: available
      ? `${providerInfo.name} is ready`
      : `Add ${keyMap[provider]} to enable ${providerInfo.name}`,
    suggestions: available ? undefined : [
      `Get your ${providerInfo.name} API key`,
      `Set ${keyMap[provider]} in .env.local`,
      'Restart the dev server after updating .env.local',
    ],
  };
}

export function getProviderSetupInstructions(provider: AIProvider): string {
  return getSetupInstructions();
}

/**
 * Generate presentation HTML using the selected provider
 * Restored with auto-select and dual AI support
 */
export async function generateWithProvider(
  provider: AIProvider,
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {},
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.('starting', 0, 'Initializing...');

  // Auto-select provider if needed
  let actualProvider = provider;
  if (provider === 'auto') {
    actualProvider = selectBestProvider(prompt, files);
    console.log(`[Auto] Selected provider: ${actualProvider}`);
    onProgress?.('starting', 5, `Auto-selected: ${getProviderInfo(actualProvider).name}`);
  }

  const providerInfo = getProviderInfo(actualProvider);

  // Check if provider is available
  if (!isProviderAvailable(actualProvider)) {
    const message = `${providerInfo.name} API key is not configured. Please check your .env.local file.`;
    onProgress?.('error', 0, message);
    throw new Error(message);
  }

  const adaptiveContext = getAdaptivePromptContext();
  const enhancedPrompt = `${prompt}\n${adaptiveContext}`;

  // Check cache (skip for dual mode and files)
  if (actualProvider !== 'dual' && files.length === 0) {
    onProgress?.('caching', 10, 'Checking cache...');
    const cached = await getCachedResponse(enhancedPrompt, actualProvider);
    if (cached) {
      onProgress?.('complete', 100, 'Loaded from cache');
      return cached;
    }
  }

  let html: string;

  // Route to correct provider
  if (actualProvider === 'dual') {
    // Dual AI mode: Gemini + Opus
    html = await generateWithDualAgents(enhancedPrompt, files, options, onProgress);
  } else {
    const opts = {
      activityId: options.activityId,
      learnerLevel: options.learnerLevel as any,
    };

    const phaseMap: Record<AIProvider, GenerationPhase> = {
      auto: 'starting',
      openrouter: 'openrouter',
      claude: 'claude',
      opus: 'opus',
      gemini: 'gemini',
      minimax: 'minimax',
      glm: 'glm',
      dual: 'enhancing',
    };

    onProgress?.(phaseMap[actualProvider], 25, `Calling ${providerInfo.name}...`);

    switch (actualProvider) {
      case 'claude': {
        const claudeProvider = new ClaudeProvider();
        html = await withRetry(
          () => claudeProvider.generate(
            enhancedPrompt,
            files,
            { ...opts, modelId: options.modelId || 'claude-sonnet-4-5' },
            (phase, progress, message, error, partialContent) => {
              onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
            }
          ),
          { maxRetries: 2 }
        );
        break;
      }

      case 'opus': {
        const opusProvider = new ClaudeProvider();
        html = await withRetry(
          () => opusProvider.generate(
            enhancedPrompt,
            files,
            { ...opts, modelId: options.modelId || 'claude-opus-4-5' },
            (phase, progress, message, error, partialContent) => {
              onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
            }
          ),
          { maxRetries: 2 }
        );
        break;
      }

      case 'gemini': {
        const geminiProvider = new GeminiProvider();
        html = await withRetry(
          () => geminiProvider.generate(
            enhancedPrompt,
            files,
            { ...opts, modelId: options.modelId },
            (phase, progress, message, error, partialContent) => {
              onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
            }
          ),
          { maxRetries: 2 }
        );
        break;
      }

      case 'minimax': {
        const minimaxProvider = new MiniMaxProvider();
        html = await withRetry(
          () => minimaxProvider.generate(
            enhancedPrompt,
            files,
            { ...opts, modelId: options.modelId },
            (phase, progress, message, error, partialContent) => {
              onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
            }
          ),
          { maxRetries: 2 }
        );
        break;
      }

      case 'glm': {
        const glmProvider = new GLMProvider();
        html = await withRetry(
          () => glmProvider.generate(
            enhancedPrompt,
            files,
            { ...opts, modelId: options.modelId },
            (phase, progress, message, error, partialContent) => {
              onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
            }
          ),
          { maxRetries: 2 }
        );
        break;
      }

      case 'openrouter':
      default:
        const modelId = (options.modelId as OpenRouterModelId) || 'deepseek/deepseek-chat';
        html = await withRetry(
          () => generateWithOpenRouter(enhancedPrompt, modelId, files),
          { maxRetries: 2 }
        );
        break;
    }
  }

  // Cache result (skip for dual mode and files)
  if (actualProvider !== 'dual' && files.length === 0) {
    await setCachedResponse(enhancedPrompt, html, actualProvider);
  }

  onProgress?.('complete', 100, 'Generation successful');
  return html;
}

/**
 * Refine an existing presentation using the selected provider
 * Updated to support all providers including opus, auto, and dual
 */
export async function refineWithProvider(
  provider: AIProvider,
  currentHtml: string,
  instruction: string,
  modelId?: string,
  onProgress?: ProgressCallback
): Promise<string> {
  // Auto-select for refinement (default to opus for quality)
  let actualProvider = provider;
  if (provider === 'auto') {
    actualProvider = 'opus'; // Best for refinement quality
    console.log(`[Auto] Selected ${actualProvider} for refinement`);
  }

  const providerInfo = getProviderInfo(actualProvider);

  if (!isProviderAvailable(actualProvider)) {
    throw new Error(`${providerInfo.name} API key is not configured.`);
  }

  onProgress?.('starting', 0, 'Preparing refinement...');

  let result: string;

  // Route to correct provider
  switch (actualProvider) {
    case 'claude': {
      const claudeProvider = new ClaudeProvider();
      result = await withRetry(
        () => claudeProvider.refine(
          currentHtml,
          instruction,
          modelId || 'claude-sonnet-4-5',
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'opus': {
      const opusProvider = new ClaudeProvider();
      result = await withRetry(
        () => opusProvider.refine(
          currentHtml,
          instruction,
          modelId || 'claude-opus-4-5',
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'gemini': {
      const geminiProvider = new GeminiProvider();
      result = await withRetry(
        () => geminiProvider.refine(
          currentHtml,
          instruction,
          modelId,
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'minimax': {
      const minimaxProvider = new MiniMaxProvider();
      result = await withRetry(
        () => minimaxProvider.refine(
          currentHtml,
          instruction,
          modelId || 'MiniMax-M2.1',
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'glm': {
      const glmProvider = new GLMProvider();
      result = await withRetry(
        () => glmProvider.refine(
          currentHtml,
          instruction,
          modelId || 'glm-4.7',
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'dual': {
      // For dual mode refinement, just use Opus directly (highest quality)
      const opusProvider = new ClaudeProvider();
      result = await withRetry(
        () => opusProvider.refine(
          currentHtml,
          instruction,
          'claude-opus-4-5',
          (phase, progress, message, error, partialContent) => {
            onProgress?.(phase as GenerationPhase, progress, message, error, partialContent);
          }
        ),
        { maxRetries: 2 }
      );
      break;
    }

    case 'openrouter':
    default:
      const selectedModel = (modelId as OpenRouterModelId) || 'deepseek/deepseek-chat';
      const refinePrompt = `You are updating an existing medical education presentation.\n\nInstruction: ${instruction}\n\nCurrent HTML:\n${currentHtml}\n\nReturn complete updated HTML.`;
      result = await withRetry(
        () => generateWithOpenRouter(refinePrompt, selectedModel),
        { maxRetries: 2 }
      );
      break;
  }

  onProgress?.('complete', 100, 'Refinement complete');
  return result;
}

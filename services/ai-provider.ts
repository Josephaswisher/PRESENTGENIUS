/**
 * Unified AI Provider Service
 * Abstracts between Gemini and Claude for consistent API
 * Features: Auto-select, Retry, Caching, Progress callbacks
 */
import * as gemini from './gemini';
import * as claude from './claude';
import * as opus from './opus';
import { withRetry } from '../lib/retry';
import { getCachedResponse, setCachedResponse } from './cache';

export type AIProvider = 'gemini' | 'claude' | 'opus' | 'dual' | 'auto';

export type GenerationPhase = 'starting' | 'gemini' | 'opus' | 'claude' | 'enhancing' | 'caching' | 'complete';

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
    id: 'auto',
    name: 'Auto (Smart Select)',
    model: 'auto',
    icon: '🎯',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Pro',
    model: 'gemini-2.5-pro',
    icon: '✨',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'claude',
    name: 'Claude Sonnet 4.5',
    model: 'claude-sonnet-4.5',
    icon: '🧠',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'opus',
    name: 'Claude Opus 4.5',
    model: 'claude-opus-4.5',
    icon: '👑',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'dual',
    name: 'Dual AI (Gemini + Opus 4.5)',
    model: 'dual-gemini-opus',
    icon: '🔥',
    color: 'from-cyan-500 via-purple-500 to-pink-500',
  },
];

/**
 * Auto-select the best provider based on task complexity
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

export function getProviderInfo(provider: AIProvider): ProviderInfo {
  return PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];
}

export function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === 'gemini') {
    return !!import.meta.env.VITE_GEMINI_API_KEY || !!import.meta.env.API_KEY;
  }
  if (provider === 'claude') {
    return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  }
  return false;
}

/**
 * Dual-agent generation: Gemini creates structure, Opus enhances content
 * Now with progress callbacks and retry logic
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

  // Phase 1: Gemini creates the base structure and interactivity
  onProgress?.('gemini', 10, 'Gemini creating structure...');
  console.log('[Dual AI] Phase 1: Gemini creating structure...');
  
  const geminiResult = await withRetry(
    () => gemini.bringToLife(
      `${prompt}\n\nFocus on creating excellent HTML structure, interactive elements, and visual design.`,
      files,
      opts
    ),
    { maxRetries: 2, onRetry: (err, attempt) => console.log(`[Gemini] Retry ${attempt}:`, err.message) }
  );

  onProgress?.('gemini', 50, 'Structure complete');

  // Phase 2: Opus enhances the medical content and accuracy
  onProgress?.('opus', 55, 'Opus enhancing content...');
  console.log('[Dual AI] Phase 2: Opus enhancing content...');
  
  const opusEnhanced = await withRetry(
    () => opus.refineArtifact(
      geminiResult,
      `Review and enhance this medical education content:
      1. Improve clinical accuracy and depth
      2. Add evidence-based teaching points
      3. Enhance explanations for better learning
      4. Ensure medical terminology is correct
      5. Keep the HTML structure and interactivity intact
      
      Return the improved HTML.`
    ),
    { maxRetries: 2, onRetry: (err, attempt) => console.log(`[Opus] Retry ${attempt}:`, err.message) }
  );

  onProgress?.('complete', 100, 'Generation complete');
  return opusEnhanced;
}

/**
 * Main generation function with caching, retry, and auto-select
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

  // Check cache first (skip for dual mode as it's multi-step)
  if (actualProvider !== 'dual' && files.length === 0) {
    const cached = await getCachedResponse(prompt, actualProvider);
    if (cached) {
      onProgress?.('complete', 100, 'Loaded from cache');
      return cached;
    }
  }

  const opts = {
    activityId: options.activityId,
    learnerLevel: options.learnerLevel as any,
  };

  let result: string;

  switch (actualProvider) {
    case 'dual':
      result = await generateWithDualAgents(prompt, files, options, onProgress);
      break;
    case 'opus':
      onProgress?.('opus', 10, 'Opus generating...');
      result = await withRetry(
        () => opus.bringToLife(prompt, files, opts),
        { maxRetries: 3, onRetry: (err, attempt) => {
          console.log(`[Opus] Retry ${attempt}:`, err.message);
          onProgress?.('opus', 10 + attempt * 5, `Retrying... (${attempt})`);
        }}
      );
      break;
    case 'claude':
      onProgress?.('claude', 10, 'Claude generating...');
      result = await withRetry(
        () => claude.bringToLife(prompt, files, opts),
        { maxRetries: 3 }
      );
      break;
    case 'gemini':
    default:
      onProgress?.('gemini', 10, 'Gemini generating...');
      result = await withRetry(
        () => gemini.bringToLife(prompt, files, opts),
        { maxRetries: 3 }
      );
      break;
  }

  // Cache the result (skip for file-based generations)
  if (files.length === 0 && actualProvider !== 'dual') {
    onProgress?.('caching', 95, 'Saving to cache...');
    await setCachedResponse(prompt, result, actualProvider);
  }

  onProgress?.('complete', 100, 'Done');
  return result;
}

export async function refineWithProvider(
  provider: AIProvider,
  currentHtml: string,
  instruction: string
): Promise<string> {
  switch (provider) {
    case 'dual':
      // For dual mode refinements, use Opus for content quality
      return opus.refineArtifact(currentHtml, instruction);
    case 'opus':
      return opus.refineArtifact(currentHtml, instruction);
    case 'claude':
      return claude.refineArtifact(currentHtml, instruction);
    case 'gemini':
    default:
      return gemini.refineArtifact(currentHtml, instruction);
  }
}

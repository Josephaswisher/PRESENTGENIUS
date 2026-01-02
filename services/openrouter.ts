/**
 * OpenRouter AI Service
 * Provides access to multiple AI models through a unified API
 * Supports: GPT-4, Claude, Llama, Mistral, and many more
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: { prompt: number; completion: number };
}

// Popular models available through OpenRouter (Updated Jan 2025)
export const OPENROUTER_MODELS = {
  // OpenAI
  'openai/gpt-4o': { name: 'GPT-4o', icon: '🟢', tier: 'premium' },
  'openai/gpt-4o-mini': { name: 'GPT-4o Mini', icon: '🟢', tier: 'fast' },
  'openai/o1': { name: 'o1', icon: '🟢', tier: 'premium' },
  'openai/o1-mini': { name: 'o1 Mini', icon: '🟢', tier: 'standard' },

  // Anthropic Claude 4 (Latest)
  'anthropic/claude-opus-4-20250514': { name: 'Claude Opus 4', icon: '🟠', tier: 'premium' },
  'anthropic/claude-sonnet-4-20250514': { name: 'Claude Sonnet 4', icon: '🟠', tier: 'premium' },
  'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', icon: '🟠', tier: 'standard' },
  'anthropic/claude-3.5-haiku': { name: 'Claude 3.5 Haiku', icon: '🟠', tier: 'fast' },

  // Meta Llama
  'meta-llama/llama-3.3-70b-instruct': { name: 'Llama 3.3 70B', icon: '🦙', tier: 'standard' },
  'meta-llama/llama-3.1-405b-instruct': { name: 'Llama 3.1 405B', icon: '🦙', tier: 'premium' },
  'meta-llama/llama-3.1-8b-instruct': { name: 'Llama 3.1 8B', icon: '🦙', tier: 'fast' },

  // Google
  'google/gemini-2.0-flash-001': { name: 'Gemini 2.0 Flash', icon: '💎', tier: 'premium' },
  'google/gemini-2.5-pro-preview': { name: 'Gemini 2.5 Pro', icon: '💎', tier: 'premium' },
  'google/gemma-2-27b-it': { name: 'Gemma 2 27B', icon: '💎', tier: 'standard' },

  // DeepSeek
  'deepseek/deepseek-r1': { name: 'DeepSeek R1', icon: '🔵', tier: 'premium' },
  'deepseek/deepseek-chat': { name: 'DeepSeek Chat', icon: '🔵', tier: 'fast' },

  // Qwen
  'qwen/qwen-2.5-72b-instruct': { name: 'Qwen 2.5 72B', icon: '🟣', tier: 'standard' },
} as const;

export type OpenRouterModelId = keyof typeof OPENROUTER_MODELS;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface FileInput {
  base64: string;
  mimeType: string;
}

interface GenerationOptions {
  activityId?: string;
  learnerLevel?: string;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('VITE_OPENROUTER_API_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Generate content using OpenRouter API
 */
export async function generateWithOpenRouter(
  prompt: string,
  modelId: OpenRouterModelId = 'anthropic/claude-sonnet-4-20250514',
  files: FileInput[] = [],
  options: GenerationOptions = {}
): Promise<string> {
  const apiKey = getApiKey();

  // Build messages array
  const messages: any[] = [];

  // Add system message for medical education context
  const systemMessage = `You are an expert medical educator creating interactive HTML presentations.
Your output should be a complete, self-contained HTML document with embedded CSS and JavaScript.
Use Tailwind CSS via CDN for styling. Make the content visually engaging and interactive.
Focus on clarity, medical accuracy, and educational value.
${options.learnerLevel ? `Target audience: ${options.learnerLevel}` : ''}
${options.activityId ? `Activity type: ${options.activityId}` : ''}`;

  messages.push({ role: 'system', content: systemMessage });

  // Handle images if provided (for vision-capable models)
  if (files.length > 0) {
    const content: any[] = [{ type: 'text', text: prompt }];

    for (const file of files) {
      if (file.mimeType.startsWith('image/')) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimeType};base64,${file.base64}`,
          },
        });
      }
    }

    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'PresentGenius Medical Education',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 16000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extract HTML if wrapped in code blocks
  const htmlMatch = content.match(/```html\n?([\s\S]*?)```/) ||
    content.match(/<!DOCTYPE[\s\S]*<\/html>/i);

  return htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;
}

/**
 * Refine existing content using OpenRouter
 */
export async function refineWithOpenRouter(
  currentHtml: string,
  instruction: string,
  modelId: OpenRouterModelId = 'anthropic/claude-sonnet-4-20250514'
): Promise<string> {
  const apiKey = getApiKey();

  const messages = [
    {
      role: 'system',
      content: `You are an expert at refining HTML medical education content.
Modify the provided HTML according to the user's instructions.
Maintain the existing structure and styling unless specifically asked to change it.
Return the complete modified HTML document.`,
    },
    {
      role: 'user',
      content: `Current HTML:\n\n${currentHtml}\n\n---\n\nInstructions: ${instruction}\n\nReturn the updated HTML:`,
    },
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'PresentGenius Medical Education',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 16000,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extract HTML
  const htmlMatch = content.match(/```html\n?([\s\S]*?)```/) ||
    content.match(/<!DOCTYPE[\s\S]*<\/html>/i);

  return htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;
}

/**
 * Wrapper for bringToLife compatibility
 */
export async function bringToLife(
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions & { model?: OpenRouterModelId } = {}
): Promise<string> {
  const model = options.model || 'anthropic/claude-sonnet-4-20250514';
  return generateWithOpenRouter(prompt, model, files, options);
}

/**
 * Wrapper for refineArtifact compatibility
 */
export async function refineArtifact(
  currentHtml: string,
  instruction: string,
  model: OpenRouterModelId = 'anthropic/claude-sonnet-4-20250514'
): Promise<string> {
  return refineWithOpenRouter(currentHtml, instruction, model);
}

/**
 * Get list of available models
 */
export function getAvailableModels(): { id: OpenRouterModelId; name: string; icon: string; tier: string }[] {
  return Object.entries(OPENROUTER_MODELS).map(([id, info]) => ({
    id: id as OpenRouterModelId,
    ...info,
  }));
}

/**
 * Check if OpenRouter is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!import.meta.env.VITE_OPENROUTER_API_KEY;
}

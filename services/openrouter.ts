/**
 * OpenRouter Service
 * Provides default DeepSeek models via OpenRouter gateway
 */
import { classifyOpenRouterError } from './api-key-validation';

export type OpenRouterModelTier = 'fast' | 'standard' | 'premium';

export interface OpenRouterModel {
  id: string;
  name: string;
  tier: OpenRouterModelTier;
  description?: string;
  maxTokens?: number;
}

export interface FileInput {
  base64: string;
  mimeType: string;
}

export const OPENROUTER_MODELS: Record<string, OpenRouterModel> = {
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    tier: 'fast',
    description: 'Default medical educator model via OpenRouter',
    maxTokens: 64000,
  },
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    tier: 'premium',
    description: 'Reasoning-focused model',
    maxTokens: 64000,
  },
  'anthropic/claude-sonnet-4-20250514': {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4.0',
    tier: 'standard',
    description: 'Anthropic Claude Sonnet via OpenRouter',
    maxTokens: 200000,
  },
};

export type OpenRouterModelId = keyof typeof OPENROUTER_MODELS;

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL_ID: OpenRouterModelId = 'deepseek/deepseek-chat';

function buildSystemPrompt(): string {
  return [
    'You are an expert medical educator and presentation designer.',
    'Create concise, evidence-based HTML presentations with modern layouts.',
    'Always ensure content is safe for educational use and avoids PHI.'
  ].join(' ');
}

function buildRequestBody(prompt: string, model: OpenRouterModelId): any {
  return {
    model,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
  };
}

export async function generateWithOpenRouter(
  prompt: string,
  modelId: OpenRouterModelId = DEFAULT_MODEL_ID,
  _files: FileInput[] = []
): Promise<string> {
  const body = buildRequestBody(prompt, modelId);
  const apiKey = (import.meta as any)?.env?.VITE_OPENROUTER_API_KEY || (import.meta as any)?.env?.openrouter_api_key;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Title': 'PresentGenius Medical Education',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => undefined);
      const message = errorPayload?.error?.message || response.statusText || 'Unknown error';
      throw new Error(`OpenRouter API error: ${message}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      return content;
    }
    throw new Error('OpenRouter API error: Invalid response format');
  } catch (error: any) {
    if (error?.message?.includes('OpenRouter API error')) {
      throw error;
    }
    const classified = classifyOpenRouterError(error);
    console.error('Failed to generate with OpenRouter:', classified.message);
    throw new Error(classified.message);
  }
}

export default {
  OPENROUTER_MODELS,
  generateWithOpenRouter,
};

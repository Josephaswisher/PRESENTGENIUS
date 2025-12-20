/**
 * Claude Opus 4 Service - Premium AI for high-quality content
 * Uses OpenRouter as proxy to avoid CORS issues
 */
import { LearnerLevel, getActivityById, getLearnerLevelById } from '../data/activities';

// Use OpenRouter for Claude to avoid CORS issues
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPUS_MODEL = 'anthropic/claude-sonnet-4'; // OpenRouter model name

const getApiKey = () => {
  // Prefer OpenRouter (no CORS issues), fallback to Anthropic
  return import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY;
};

const useOpenRouter = () => {
  return !!import.meta.env.VITE_OPENROUTER_API_KEY;
};

export interface FileInput {
  base64: string;
  mimeType: string;
}

export interface GenerationOptions {
  activityId?: string;
  learnerLevel?: LearnerLevel;
}

/**
 * Generate content with Opus via OpenRouter - same interface as other providers
 */
export async function bringToLife(
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key available (VITE_OPENROUTER_API_KEY or VITE_ANTHROPIC_API_KEY)');
  }

  const { activityId, learnerLevel } = options;

  let activityContext = '';
  if (activityId) {
    const activity = getActivityById(activityId);
    if (activity) {
      activityContext = `\n\nACTIVITY TYPE: ${activity.name}\n`;
    }
  }

  let levelContext = '';
  if (learnerLevel) {
    const level = getLearnerLevelById(learnerLevel);
    if (level) {
      levelContext = `\nTARGET AUDIENCE: ${level.name}\n`;
    }
  }

  const systemPrompt = `You are an expert Medical Education Technologist creating premium educational content.
Your output should be publication-quality, clinically accurate, and pedagogically sound.
Focus on clarity, visual hierarchy, and actionable learning points.`;

  const finalPrompt = `${activityContext}${levelContext}\n\n${prompt}`;

  // Build message content with images if present
  const userContent: any[] = [];
  
  for (const file of files) {
    if (file.mimeType.startsWith('image/')) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${file.mimeType};base64,${file.base64}`,
        },
      });
    }
  }
  userContent.push({ type: 'text', text: finalPrompt });

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PRESENTGENIUS Medical Education',
      },
      body: JSON.stringify({
        model: OPUS_MODEL,
        max_tokens: 16000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent.length === 1 ? finalPrompt : userContent },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return text || '<!-- Failed to generate content -->';
  } catch (error) {
    console.error('Opus Generation Error:', error);
    throw error;
  }
}

/**
 * Refine content with Opus via OpenRouter
 */
export async function refineArtifact(currentHtml: string, instruction: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key available');
  }

  const prompt = `Refine this educational content:

CURRENT CONTENT:
${currentHtml}

INSTRUCTION:
${instruction}

Maintain quality and accuracy. Return only the updated content.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PRESENTGENIUS Medical Education',
      },
      body: JSON.stringify({
        model: OPUS_MODEL,
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return text || currentHtml;
  } catch (error) {
    console.error('Opus Refinement Error:', error);
    throw error;
  }
}

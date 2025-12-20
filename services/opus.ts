/**
 * Claude Opus 4 Service - Premium AI for high-quality content
 * Used for printables, detailed study materials, and complex content
 */
import Anthropic from '@anthropic-ai/sdk';
import { LearnerLevel, getActivityById, getLearnerLevelById } from '../data/activities';

const OPUS_MODEL = 'claude-opus-4-5-20250514';

const getClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
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
 * Generate content with Opus - same interface as other providers
 */
export async function bringToLife(
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {}
): Promise<string> {
  const client = getClient();
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

  const content: Anthropic.MessageParam['content'] = [];
  
  for (const file of files) {
    if (file.mimeType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: file.base64,
        },
      });
    }
  }

  content.push({ type: 'text', text: finalPrompt });

  try {
    const response = await client.messages.create({
      model: OPUS_MODEL,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    });

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }

    return text || '<!-- Failed to generate content -->';
  } catch (error) {
    console.error('Opus Generation Error:', error);
    throw error;
  }
}

/**
 * Refine content with Opus
 */
export async function refineArtifact(currentHtml: string, instruction: string): Promise<string> {
  const client = getClient();

  const prompt = `Refine this educational content:

CURRENT CONTENT:
${currentHtml}

INSTRUCTION:
${instruction}

Maintain quality and accuracy. Return only the updated content.`;

  try {
    const response = await client.messages.create({
      model: OPUS_MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }

    return text || currentHtml;
  } catch (error) {
    console.error('Opus Refinement Error:', error);
    throw error;
  }
}

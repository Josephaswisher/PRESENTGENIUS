/**
 * Claude AI Service for PresentGenius
 * Supports activity-specific prompts and learner level calibration
 */
import Anthropic from '@anthropic-ai/sdk';
import { LearnerLevel, getActivityById, getLearnerLevelById } from '../data/activities';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const getClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not set. Add it to your .env.local file.');
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
};

const BASE_SYSTEM_INSTRUCTION = `You are an expert Medical Education Technologist and Clinical Educator (MD/Dev).
Your goal is to take user uploaded files—which might be handwritten clinical notes, anatomy textbook photos, ECG strips, whiteboard diagrams of metabolic pathways, or PDF guidelines—and instantly generate a fully functional, interactive, single-page HTML/JS/CSS educational application.

TARGET AUDIENCE: Medical Residents, Med Students, and Attending Physicians.

CORE DIRECTIVES:
1. **Analyze & Educationalize**: Look at the input(s).
    - **Clinical Cases/Notes**: Turn them into "Interactive Case Studies" (text-adventure style). Present the patient history, then ask for Differential Diagnosis, then reveal labs, then ask for Treatment.
    - **Anatomy/Diagrams**: Create "Click-to-Identify" quizzes or interactive labeling tools.
    - **Guidelines/Algorithms**: Turn flowcharts into interactive "Decision Support Tools" or "Risk Calculators" (e.g., Wells Score, CHA2DS2-VASc).
    - **Lectures/Text**: Turn dense text into an "Interactive Presentation" (like a slide deck with embedded quizzes).

2. **NO EXTERNAL IMAGES**:
    - **CRITICAL**: Do NOT use <img src="..."> with external URLs.
    - **INSTEAD**: Use **CSS shapes**, **inline SVGs**, **Emojis**, or **CSS gradients**.

3. **Make it Interactive**: The output MUST be active learning.
    - Use "Reveal Answers" buttons.
    - Use Drag-and-Drop for matching drugs to mechanisms.
    - Use multiple-choice questions with immediate feedback.

4. **Self-Contained & Professional**:
    - The output must be a single HTML file with embedded CSS (<style>) and JavaScript (<script>).
    - Use **Tailwind CSS** via CDN: <script src="https://cdn.tailwindcss.com/3.4.17"></script>
    - **Design Aesthetic**: Clean, modern, medical-grade UI.

    MEDICAL COLOR SYSTEM:
    - Critical/Urgent: bg-red-500/20 border-red-400 text-red-300
    - Warning/Caution: bg-yellow-500/20 border-yellow-400 text-yellow-300
    - Normal/Stable: bg-green-500/20 border-green-400 text-green-300
    - Information: bg-blue-500/20 border-blue-400 text-blue-300
    - Dashboard backgrounds: bg-gradient-to-br from-slate-900 to-slate-800

    - **Responsive**: Must look good on mobile and desktop.

5. **Medical Accuracy**: Ensure the medical logic presented is sound.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown code blocks. Start immediately with <!DOCTYPE html>.`;

function buildSystemInstruction(activityId?: string, learnerLevel?: LearnerLevel): string {
  let instruction = BASE_SYSTEM_INSTRUCTION;

  if (activityId) {
    const activity = getActivityById(activityId);
    if (activity) {
      instruction += `\n\n=== SPECIFIC ACTIVITY TYPE: ${activity.name} ===\n${activity.systemPromptAugment}`;
    }
  }

  if (learnerLevel) {
    const level = getLearnerLevelById(learnerLevel);
    if (level) {
      instruction += `\n\n=== TARGET LEARNER LEVEL ===\n${level.promptModifier}`;
    }
  }

  return instruction;
}

export interface FileInput {
  base64: string;
  mimeType: string;
}

export interface GenerationOptions {
  activityId?: string;
  learnerLevel?: LearnerLevel;
}

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
      activityContext = `\n\nACTIVITY TYPE REQUESTED: ${activity.name} (${activity.icon})\n`;
    }
  }

  let levelContext = '';
  if (learnerLevel) {
    const level = getLearnerLevelById(learnerLevel);
    if (level) {
      levelContext = `\nTARGET AUDIENCE: ${level.name}\n`;
    }
  }

  const finalPrompt = files.length > 0
    ? `Analyze these ${files.length} medical document(s)/image(s).${activityContext}${levelContext}\n\nUSER CONTEXT: "${prompt}"\n\nDetect the clinical topic. Build a fully interactive educational web app based on this material. IMPORTANT: Do NOT use external image URLs. Recreate visuals using CSS/SVG/Emojis.`
    : `${activityContext}${levelContext}\n\n${prompt || "Create a medical education demo (e.g., an interactive cardiology case study)."}`;

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

  const systemInstruction = buildSystemInstruction(activityId, learnerLevel);

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      system: systemInstruction,
      messages: [{ role: 'user', content }],
    });

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }

    if (!text) {
      return '<!-- Failed to generate content -->';
    }

    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return text;
  } catch (error) {
    console.error('Claude Generation Error:', error);
    throw error;
  }
}

export async function refineArtifact(currentHtml: string, instruction: string): Promise<string> {
  const client = getClient();

  const prompt = `You are refining an existing HTML medical education artifact.
        
CURRENT HTML:
${currentHtml}

USER INSTRUCTION:
${instruction}

TASK:
Update the HTML code to satisfy the user's instruction. 
- Keep the existing functionality unless asked to change it.
- Maintain the high-quality Tailwind styling.
- Ensure the result is still a valid, self-contained HTML file.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown.`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }

    if (!text) return currentHtml;

    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return text;
  } catch (error) {
    console.error('Claude Refinement Error:', error);
    throw error;
  }
}

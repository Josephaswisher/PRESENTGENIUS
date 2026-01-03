/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VibePresenterPro - Enhanced Gemini Service
 * Supports activity-specific prompts and learner level calibration
 */
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Activity, LearnerLevel, getActivityById, getLearnerLevelById } from '../data/activities';
import { getModelId } from '../config/models';

// Use centralized model configuration
const GEMINI_MODEL = getModelId('gemini');

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
  if (!key) {
    throw new Error('VITE_GEMINI_API_KEY is not set');
  }
  return key;
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

// Base system instruction - enhanced for VibePresenterPro
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
    - If you see an organ (heart, lungs), represent it with a 🫀 emoji or a simplified SVG path.
    - If you see an ECG, draw the line using SVG <polyline>.

3. **Make it Interactive**: The output MUST be active learning.
    - Use "Reveal Answers" buttons.
    - Use Drag-and-Drop for matching drugs to mechanisms.
    - Use multiple-choice questions with immediate feedback.

4. **Self-Contained & Professional**:
    - The output must be a single HTML file with embedded CSS (<style>) and JavaScript (<script>).
    - **Tailwind CSS**: Include compiled Tailwind styles in <style> tags or link to the compiled CSS file.
    - Do NOT use cdn.tailwindcss.com in production - it should only be used in development.
    - **Design Aesthetic**: Clean, modern, medical-grade UI. Use consistent color palettes.

    MEDICAL COLOR SYSTEM:
    - Critical/Urgent: bg-red-500/20 border-red-400 text-red-300
    - Warning/Caution: bg-yellow-500/20 border-yellow-400 text-yellow-300
    - Normal/Stable: bg-green-500/20 border-green-400 text-green-300
    - Information: bg-blue-500/20 border-blue-400 text-blue-300
    - Dashboard backgrounds: bg-gradient-to-br from-slate-900 to-slate-800

    TYPOGRAPHY SCALE:
    - Title: text-5xl to text-7xl
    - Section headers: text-3xl to text-5xl
    - Body text: text-xl to text-2xl
    - Supporting: text-lg to text-xl

    - **Responsive**: Must look good on mobile and desktop.

5. **Medical Accuracy**: While the code is the priority, ensure the medical logic presented in the interactive element is sound (or acknowledges it is a simulation).

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown code blocks (\`\`\`html ... \`\`\`). Start immediately with <!DOCTYPE html>.`;

/**
 * Build the complete system instruction with activity and learner level augmentations
 */
function buildSystemInstruction(activityId?: string, learnerLevel?: LearnerLevel): string {
  let instruction = BASE_SYSTEM_INSTRUCTION;

  // Add activity-specific instructions
  if (activityId) {
    const activity = getActivityById(activityId);
    if (activity) {
      instruction += `\n\n=== SPECIFIC ACTIVITY TYPE: ${activity.name} ===\n${activity.systemPromptAugment}`;
    }
  }

  // Add learner level calibration
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

/**
 * Generation options for enhanced control
 */
export interface GenerationOptions {
  activityId?: string;
  learnerLevel?: LearnerLevel;
  modelId?: string;
  onProgress?: (partialContent: string) => void;
}

/**
 * Generate an interactive medical education artifact with streaming support
 * @param prompt User's context/instructions
 * @param files Uploaded files (images, PDFs)
 * @param options Activity type, learner level, and progress callback
 */
export async function bringToLife(
  prompt: string,
  files: FileInput[] = [],
  options: GenerationOptions = {}
): Promise<string> {
  const parts: any[] = [];
  const { activityId, learnerLevel } = options;

  // Build activity-specific prompt
  let activityContext = '';
  if (activityId) {
    const activity = getActivityById(activityId);
    if (activity) {
      activityContext = `\n\nACTIVITY TYPE REQUESTED: ${activity.name} (${activity.icon})\n`;
    }
  }

  // Build learner level context
  let levelContext = '';
  if (learnerLevel) {
    const level = getLearnerLevelById(learnerLevel);
    if (level) {
      levelContext = `\nTARGET AUDIENCE: ${level.name}\n`;
    }
  }

  const finalPrompt = files.length > 0
    ? `Analyze these ${files.length} medical document(s)/image(s).${activityContext}${levelContext}\n\nUSER CONTEXT: "${prompt}"\n\nDetect the clinical topic. Build a fully interactive educational web app based on this material. IMPORTANT: Do NOT use external image URLs. Recreate visuals using CSS/SVG/Emojis. Style it professionally with the medical color system.`
    : `${activityContext}${levelContext}\n\n${prompt || "Create a medical education demo (e.g., an interactive cardiology case study)."}`;

  parts.push({ text: finalPrompt });

  // Add all files to the request
  files.forEach(file => {
    parts.push({
      inlineData: {
        data: file.base64,
        mimeType: file.mimeType,
      },
    });
  });

  // Build system instruction with activity/level augmentations
  const systemInstruction = buildSystemInstruction(activityId, learnerLevel);

  try {
    // Use streaming if callback provided, otherwise use standard generation
    if (options.onProgress) {
      let accumulatedText = '';

      const stream = await getAI().models.streamGenerateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
        },
      });

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        accumulatedText += chunkText;
        options.onProgress(accumulatedText);
      }

      let text = accumulatedText || "<!-- Failed to generate content -->";
      text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
      return text;
    } else {
      // Non-streaming fallback
      const response: GenerateContentResponse = await getAI().models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
        },
      });

      let text = response.text || "<!-- Failed to generate content -->";
      text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
      return text;
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function refineArtifact(currentHtml: string, instruction: string): Promise<string> {
  const parts = [{
    text: `You are refining an existing HTML medical education artifact.

CURRENT HTML:
${currentHtml}

USER INSTRUCTION:
${instruction}

TASK:
Update the HTML code to satisfy the user's instruction.
- Keep the existing functionality unless asked to change it.
- **Maintain the high-quality Tailwind styling.**
- Ensure the result is still a valid, self-contained HTML file.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown.`
  }];

  try {
    const response: GenerateContentResponse = await getAI().models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts },
      config: {
        temperature: 0.2,
      },
    });

    let text = response.text || currentHtml;
    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return text;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw error;
  }
}

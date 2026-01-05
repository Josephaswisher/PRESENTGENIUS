/**
 * Plan Generator Service
 * Creates structured generation plans from user prompts before full content generation.
 * Uses a lightweight Gemini call to analyze the request and produce an outline.
 */

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
  if (!key) {
    throw new Error("VITE_GEMINI_API_KEY is not set");
  }
  return key;
};

const ai = new GoogleGenAI({
  apiKey: getApiKey(),
});

export interface GenerationPlan {
  summary: string;
  outputs: {
    format: string;
    variant: string;
    estimatedCount: string;
  }[];
  structure: {
    section: string;
    description: string;
    estimatedItems?: number;
  }[];
  keyTopics: string[];
  suggestedAdditions?: string[];
  estimatedTime?: string;
  learnerLevel?: string;
}

export interface PlanGeneratorInput {
  prompt: string;
  title?: string;
  selectedFormats: string[];
  selectedSubOptions: Record<string, string>;
  selectedSupplementary: string[];
  selectedModifiers: string[];
  selectedStyle: string;
  learnerLevel?: string;
  activityType?: string;
}

const PLAN_SYSTEM_PROMPT = `You are a medical education content planning assistant. Your job is to analyze a content request and create a detailed structured plan for what will be generated.

You must respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief 1-2 sentence summary of what will be created",
  "outputs": [
    {
      "format": "Primary format name",
      "variant": "Specific variant/style",
      "estimatedCount": "~X slides/sections/items"
    }
  ],
  "structure": [
    {
      "section": "Section title",
      "description": "Brief description of this section's content",
      "estimatedItems": 2
    }
  ],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "suggestedAdditions": ["Optional enhancement 1", "Optional enhancement 2"],
  "estimatedTime": "X-Y minutes to present",
  "learnerLevel": "Target audience level"
}

Guidelines:
- Analyze the prompt to identify key medical topics and learning objectives
- Structure the content logically for medical education
- Include appropriate depth for the specified learner level
- Suggest enhancements that would improve educational value
- Be specific about section content, not vague
- Estimate realistic counts for slides/sections`;

/**
 * Generate a structured plan from user input
 */
export async function generatePlan(
  input: PlanGeneratorInput,
): Promise<GenerationPlan> {
  const {
    prompt,
    title,
    selectedFormats,
    selectedSubOptions,
    selectedSupplementary,
    selectedModifiers,
    selectedStyle,
    learnerLevel,
    activityType,
  } = input;

  // Build context for the planner
  const formatDescriptions = selectedFormats
    .map((f) => {
      const variant = selectedSubOptions[f] || "default";
      return `${f} (${variant})`;
    })
    .join(", ");

  const supplementaryList =
    selectedSupplementary.length > 0
      ? `Additional outputs: ${selectedSupplementary.join(", ")}`
      : "";

  const modifiersList =
    selectedModifiers.length > 0
      ? `Style modifiers: ${selectedModifiers.join(", ")}`
      : "";

  const planPrompt = `
Create a detailed generation plan for the following content request:

${title ? `TITLE: ${title}` : ""}
PROMPT: ${prompt}

OUTPUT FORMATS: ${formatDescriptions}
${supplementaryList}
${modifiersList}
VISUAL STYLE: ${selectedStyle}
${learnerLevel ? `LEARNER LEVEL: ${learnerLevel}` : ""}
${activityType ? `ACTIVITY TYPE: ${activityType}` : ""}

Analyze this request and create a structured plan showing exactly what content sections will be generated.
Remember: Respond with ONLY valid JSON, no markdown or explanations.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: planPrompt,
      config: {
        systemInstruction: PLAN_SYSTEM_PROMPT,
        temperature: 0.3, // Lower temperature for more consistent structured output
        maxOutputTokens: 1500,
      },
    });

    const text = response.text || "";

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const plan: GenerationPlan = JSON.parse(jsonText);

    // Validate required fields
    if (!plan.summary || !plan.structure || !Array.isArray(plan.structure)) {
      throw new Error("Invalid plan structure");
    }

    return plan;
  } catch (error) {
    console.error("Plan generation failed:", error);

    // Return a fallback plan based on input
    return createFallbackPlan(input);
  }
}

/**
 * Create a fallback plan when AI generation fails
 */
function createFallbackPlan(input: PlanGeneratorInput): GenerationPlan {
  const {
    prompt,
    selectedFormats,
    selectedSupplementary,
    selectedStyle,
    learnerLevel,
  } = input;

  // Extract potential topics from the prompt
  const words = prompt.split(/\s+/).filter((w) => w.length > 4);
  const keyTopics = words.slice(0, 5);

  const outputs = selectedFormats.map((format) => ({
    format: format,
    variant: input.selectedSubOptions[format] || "standard",
    estimatedCount:
      format === "slides"
        ? "~10-15 slides"
        : format === "canvas"
          ? "1 canvas"
          : "~5-10 sections",
  }));

  if (selectedSupplementary.length > 0) {
    selectedSupplementary.forEach((supp) => {
      outputs.push({
        format: supp,
        variant: "standard",
        estimatedCount:
          supp === "quiz"
            ? "5 questions"
            : supp === "flashcards"
              ? "10-15 cards"
              : "1-2 pages",
      });
    });
  }

  return {
    summary: `Educational content on the requested topic with ${selectedFormats.join(" and ")} format.`,
    outputs,
    structure: [
      {
        section: "Introduction & Objectives",
        description: "Learning objectives and overview",
        estimatedItems: 2,
      },
      {
        section: "Core Content",
        description: "Main educational material",
        estimatedItems: 5,
      },
      {
        section: "Clinical Applications",
        description: "Practical applications and examples",
        estimatedItems: 3,
      },
      {
        section: "Summary & Key Points",
        description: "Review and takeaways",
        estimatedItems: 2,
      },
    ],
    keyTopics,
    suggestedAdditions: [
      "Add clinical cases",
      "Include recent guidelines",
      "Add visual diagrams",
    ],
    estimatedTime: "15-20 minutes",
    learnerLevel: learnerLevel || "Resident",
  };
}

/**
 * Quick validation of a plan before proceeding
 */
export function validatePlan(plan: GenerationPlan): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!plan.summary || plan.summary.length < 10) {
    issues.push("Summary is too brief");
  }

  if (!plan.structure || plan.structure.length === 0) {
    issues.push("No content structure defined");
  }

  if (!plan.outputs || plan.outputs.length === 0) {
    issues.push("No output formats specified");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

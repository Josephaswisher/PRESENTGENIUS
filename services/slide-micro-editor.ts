/**
 * Slide Micro-Editor Service
 * Precision HTML edits using MiniMax M2.1
 * Supports surgical changes without full regeneration
 */

import { MiniMaxProvider } from './providers';

export interface MicroEditRequest {
  html: string;              // Current slide HTML
  command: string;            // Natural language edit command
  slideNumber?: number;       // Optional slide number (if editing specific slide in multi-slide doc)
  context?: string;           // Optional context about the presentation
}

export interface MicroEditResult {
  success: boolean;
  html: string;               // Updated HTML
  changeDescription: string;  // What was changed
  error?: string;
}

/**
 * Apply a micro-edit to slide HTML using AI
 */
export async function applyMicroEdit(request: MicroEditRequest): Promise<MicroEditResult> {
  const { html, command, slideNumber, context } = request;

  console.log(`[Micro-Edit] Processing: "${command}"`);

  try {
    // Extract the specific slide if slideNumber is provided
    const { targetHtml, prefix, suffix } = extractTargetSection(html, slideNumber);

    // Build the micro-edit prompt
    const prompt = buildMicroEditPrompt(targetHtml, command, context);

    // Call MiniMax for intelligent editing
    const provider = new MiniMaxProvider();
    const response = await provider.generate(
      prompt,
      [],
      { modelId: 'MiniMax-M2.1' }
    );

    // Extract the edited HTML from response
    const editedHtml = extractEditedHtml(response);

    // Reconstruct full HTML if we extracted a section
    const finalHtml = prefix + editedHtml + suffix;

    // Generate change description
    const changeDescription = extractChangeDescription(response);

    console.log(`✅ [Micro-Edit] Successfully applied: ${changeDescription}`);

    return {
      success: true,
      html: finalHtml,
      changeDescription,
    };
  } catch (error: any) {
    console.error('❌ [Micro-Edit] Failed:', error.message);
    return {
      success: false,
      html: html, // Return original HTML on failure
      changeDescription: 'Edit failed',
      error: error.message,
    };
  }
}

/**
 * Extract the target section for editing (single slide vs full document)
 */
function extractTargetSection(
  html: string,
  slideNumber?: number
): { targetHtml: string; prefix: string; suffix: string } {
  if (!slideNumber) {
    // Edit the entire HTML
    return { targetHtml: html, prefix: '', suffix: '' };
  }

  // Extract specific slide
  const slidePattern = new RegExp(
    `(<div class="slide"[^>]*data-slide-index="${slideNumber - 1}"[^>]*>)([\\s\\S]*?)(<\\/div>\\s*(?:<div class="slide"|<\\/main>))`,
    'i'
  );

  const match = html.match(slidePattern);
  if (match) {
    const slideStart = match.index!;
    const slideContent = match[1] + match[2];
    const slideEnd = slideStart + slideContent.length;

    return {
      targetHtml: slideContent + '</div>',
      prefix: html.substring(0, slideStart),
      suffix: html.substring(slideEnd),
    };
  }

  // Fallback: edit entire HTML
  console.warn(`[Micro-Edit] Could not isolate slide ${slideNumber}, editing full document`);
  return { targetHtml: html, prefix: '', suffix: '' };
}

/**
 * Build the micro-edit prompt for MiniMax
 */
function buildMicroEditPrompt(html: string, command: string, context?: string): string {
  // Analyze the command to determine edit type
  const editType = detectEditType(command);

  const prompt = `You are a PRECISION HTML EDITOR. Apply ONLY the requested change to the HTML.

${context ? `CONTEXT: ${context}\n` : ''}
USER COMMAND: "${command}"

EDIT TYPE: ${editType}

CURRENT HTML:
\`\`\`html
${html}
\`\`\`

INSTRUCTIONS:
1. Apply ONLY the specific change requested - do NOT rewrite or regenerate unrelated content
2. Preserve all existing structure, classes, IDs, and JavaScript
3. Maintain Tailwind CSS classes and responsive design
4. If deleting content, remove cleanly without breaking structure
5. If changing colors/styles, modify only the specified elements
6. If adding content, integrate seamlessly with existing markup

OUTPUT FORMAT:
First line: Brief description of what you changed (e.g., "Deleted third bullet point")
Then output the COMPLETE modified HTML (including all unchanged parts)

Example:
Changed background color to blue on section
\`\`\`html
<section class="bg-blue-500">
  [rest of HTML...]
</section>
\`\`\`

RESPOND NOW:`;

  return prompt;
}

/**
 * Detect the type of edit being requested
 */
function detectEditType(command: string): string {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
    return 'DELETION';
  } else if (lowerCommand.includes('change color') || lowerCommand.includes('background')) {
    return 'STYLE_CHANGE';
  } else if (lowerCommand.includes('add') || lowerCommand.includes('insert')) {
    return 'ADDITION';
  } else if (lowerCommand.includes('replace') || lowerCommand.includes('swap')) {
    return 'REPLACEMENT';
  } else if (lowerCommand.includes('move') || lowerCommand.includes('reorder')) {
    return 'REORDERING';
  } else if (lowerCommand.includes('text') || lowerCommand.includes('wording')) {
    return 'TEXT_EDIT';
  }

  return 'GENERAL_EDIT';
}

/**
 * Extract the edited HTML from the AI response
 */
function extractEditedHtml(response: string): string {
  // Try to extract HTML from code blocks
  const htmlBlockMatch = response.match(/```html\s*([\s\S]*?)\s*```/i);
  if (htmlBlockMatch) {
    return htmlBlockMatch[1].trim();
  }

  // Try to extract HTML without code blocks (direct <section> or <div>)
  const directHtmlMatch = response.match(/(<(?:section|div)[^>]*>[\s\S]*<\/(?:section|div)>)/i);
  if (directHtmlMatch) {
    return directHtmlMatch[1].trim();
  }

  // Fallback: return everything after the first newline (skip description)
  const lines = response.split('\n');
  if (lines.length > 1) {
    return lines.slice(1).join('\n').trim();
  }

  throw new Error('Could not extract HTML from AI response');
}

/**
 * Extract the change description from the AI response
 */
function extractChangeDescription(response: string): string {
  // First line should be the description
  const firstLine = response.split('\n')[0];

  // Remove code block markers if present
  const cleanedLine = firstLine.replace(/```[\w]*/, '').trim();

  // If it's a reasonable length description, use it
  if (cleanedLine.length > 0 && cleanedLine.length < 150) {
    return cleanedLine;
  }

  return 'HTML modified';
}

/**
 * Batch micro-edits - apply multiple edits sequentially
 */
export async function applyBatchMicroEdits(
  html: string,
  commands: string[],
  context?: string
): Promise<MicroEditResult> {
  let currentHtml = html;
  const changes: string[] = [];

  for (let i = 0; i < commands.length; i++) {
    console.log(`[Micro-Edit] Applying edit ${i + 1}/${commands.length}: "${commands[i]}"`);

    const result = await applyMicroEdit({
      html: currentHtml,
      command: commands[i],
      context,
    });

    if (result.success) {
      currentHtml = result.html;
      changes.push(result.changeDescription);
    } else {
      console.warn(`[Micro-Edit] Edit ${i + 1} failed, continuing...`);
      changes.push(`Failed: ${commands[i]}`);
    }

    // Small delay between edits to avoid rate limiting
    if (i < commands.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    success: true,
    html: currentHtml,
    changeDescription: `Applied ${changes.length} changes:\n${changes.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
  };
}

/**
 * Preview a micro-edit without applying it (dry run)
 */
export async function previewMicroEdit(request: MicroEditRequest): Promise<{
  willChange: string;
  affectedElements: string[];
}> {
  const { command } = request;

  // Simple heuristic analysis of what might change
  const editType = detectEditType(command);

  const affectedElements: string[] = [];

  if (command.toLowerCase().includes('bullet')) {
    affectedElements.push('li', 'ul');
  }
  if (command.toLowerCase().includes('heading') || command.toLowerCase().includes('title')) {
    affectedElements.push('h1', 'h2', 'h3');
  }
  if (command.toLowerCase().includes('background')) {
    affectedElements.push('section', 'div');
  }
  if (command.toLowerCase().includes('image')) {
    affectedElements.push('img');
  }

  return {
    willChange: editType,
    affectedElements,
  };
}

/**
 * Common micro-edit shortcuts
 */
export const COMMON_EDITS = {
  deleteBullet: (bulletIndex: number) => `Delete bullet point ${bulletIndex}`,
  changeBackground: (color: string, slideNum?: number) =>
    `Change background color to ${color}${slideNum ? ` on slide ${slideNum}` : ''}`,
  changeTextColor: (color: string, element: string) =>
    `Change text color to ${color} on ${element}`,
  addBullet: (text: string, position?: 'start' | 'end') =>
    `Add bullet point "${text}"${position ? ` at the ${position}` : ''}`,
  replaceText: (oldText: string, newText: string) =>
    `Replace "${oldText}" with "${newText}"`,
  deleteElement: (selector: string) =>
    `Delete the ${selector}`,
  changeFont: (element: string, fontSize: string) =>
    `Change font size to ${fontSize} on ${element}`,
};

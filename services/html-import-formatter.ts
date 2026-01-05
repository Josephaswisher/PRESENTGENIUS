/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HTML Import Formatter Service
 * AI-powered formatting of imported HTML into presentation slides
 * Handles parsing, separation, and proper slide structuring
 */

import { generateWithProvider } from './ai-provider';

interface SlideSection {
  title: string;
  content: string;
  type: 'title' | 'content' | 'quiz' | 'case' | 'diagram' | 'summary';
}

/**
 * Format imported HTML into properly structured presentation slides
 * Automatically detects sections, creates proper slide boundaries, and applies styling
 */
export async function formatImportedHtml(
  rawHtml: string,
  onProgress?: (message: string) => void
): Promise<string> {
  onProgress?.('Analyzing HTML structure and content...');

  // Create the AI prompt for formatting
  const prompt = `You are an expert at converting raw HTML into beautifully formatted presentation slides for medical education.

INPUT HTML:
${rawHtml}

TASK:
Analyze the HTML content and convert it into a properly structured presentation with separate slides. Each slide should be:
1. Wrapped in a <section> tag with a unique slide-{number} ID
2. Properly styled for medical education presentations
3. Separated by clear topic/concept boundaries
4. Formatted with proper headings, content, and visual hierarchy

REQUIREMENTS:
- Detect natural section breaks (headings, topic changes, etc.)
- Create ONE slide per major concept or topic
- Each slide should have:
  * A clear heading (h1 or h2)
  * Well-structured content (paragraphs, lists, etc.)
  * Proper spacing and readability
- Apply dark mode styling (background: #0f172a to #1e293b gradient)
- Use cyan (#22d3ee) and blue (#60a5fa) accent colors
- Include appropriate padding and margins
- Make text readable: white/light gray on dark background

SLIDE TYPES TO DETECT:
- Title slides (main presentation title)
- Content slides (explanations, concepts)
- Quiz/question slides (MCQ, true/false)
- Case study slides (patient scenarios)
- Diagram/illustration slides (visual content)
- Summary/takeaway slides (key points)

OUTPUT FORMAT:
Return ONLY the complete HTML with multiple <section> tags, each representing one slide.
Each section must be self-contained with all necessary styles inline or in a <style> block.

Example structure:
<style>
/* Global presentation styles */
section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 4rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}
h1 { font-size: 3rem; color: #22d3ee; margin-bottom: 1rem; }
h2 { font-size: 2.25rem; color: #60a5fa; margin-bottom: 0.75rem; }
p { font-size: 1.25rem; line-height: 1.75; color: #cbd5e1; }
</style>

<section id="slide-1">
  <h1>First Topic</h1>
  <p>Content here...</p>
</section>

<section id="slide-2">
  <h2>Second Topic</h2>
  <ul>
    <li>Point 1</li>
    <li>Point 2</li>
  </ul>
</section>

NOW FORMAT THE HTML INTO PRESENTATION SLIDES:`;

  try {
    onProgress?.('AI is formatting and separating content into slides...');

    // Use MiniMax to format the HTML
    const formattedHtml = await generateWithProvider(prompt, [], {
      temperature: 0.3, // Lower temperature for more consistent formatting
      maxTokens: 16000,
      stream: false
    });

    onProgress?.('Post-processing and validating slides...');

    // Post-process to ensure proper structure
    const processed = postProcessFormattedHtml(formattedHtml);

    // Validate that we have proper sections
    const slideCount = (processed.match(/<section/g) || []).length;
    if (slideCount === 0) {
      throw new Error('AI failed to create proper slide sections. Please try again or manually format the HTML.');
    }

    onProgress?.(`✓ Successfully created ${slideCount} presentation slide${slideCount > 1 ? 's' : ''}!`);

    return processed;
  } catch (error) {
    console.error('[html-import-formatter] Error:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to format HTML: ${error.message}`
        : 'Failed to format HTML. Please check your API key and try again.'
    );
  }
}

/**
 * Post-process the AI-generated HTML to ensure proper structure
 * Each slide gets its own isolated container for independent rendering
 */
function postProcessFormattedHtml(html: string): string {
  // Remove any markdown code blocks if AI included them
  let processed = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');

  // Ensure each section has an ID
  let slideCount = 0;
  processed = processed.replace(/<section(?![^>]*\sid=)/g, () => {
    slideCount++;
    return `<section id="slide-${slideCount}"`;
  });

  // Extract existing sections for isolated container wrapping
  const parser = new DOMParser();
  const tempDoc = parser.parseFromString(processed, 'text/html');
  const sections = tempDoc.querySelectorAll('section');

  // Default styles for isolated containers
  const isolatedStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      overflow: auto;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
    }
    section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 4rem;
    }
    h1 { font-size: 3rem; font-weight: 700; color: #22d3ee; margin-bottom: 1rem; }
    h2 { font-size: 2.25rem; font-weight: 600; color: #60a5fa; margin-bottom: 0.75rem; }
    h3 { font-size: 1.5rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.5rem; }
    p { font-size: 1.25rem; line-height: 1.75; color: #cbd5e1; margin-bottom: 1rem; }
    ul, ol { padding-left: 2rem; margin-bottom: 1rem; }
    li { font-size: 1.125rem; line-height: 1.75; color: #cbd5e1; margin-bottom: 0.5rem; }
    .quiz-option {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 1rem;
      margin: 0.5rem 0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quiz-option:hover {
      background: rgba(255,255,255,0.2);
      border-color: #22d3ee;
    }
    code {
      background: #1e293b;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #1e293b;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
  `;

  // If we found sections, add data attributes for isolated container metadata
  if (sections.length > 0) {
    sections.forEach((section, index) => {
      // Add container metadata
      section.setAttribute('data-slide-container', 'true');
      section.setAttribute('data-slide-index', String(index));

      // Extract title for container
      const heading = section.querySelector('h1, h2, h3');
      const title = heading?.textContent?.trim() || `Slide ${index + 1}`;
      section.setAttribute('data-slide-title', title);

      // Ensure section has proper ID
      if (!section.id) {
        section.id = `slide-${index + 1}`;
      }
    });

    processed = tempDoc.body.innerHTML;
  }

  // Ensure we have a style tag (add default if missing)
  if (!processed.includes('<style>')) {
    const defaultStyles = `<style>${isolatedStyles}</style>`;
    processed = defaultStyles + processed;
  }

  // Ensure proper HTML structure
  if (!processed.includes('<html')) {
    processed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Imported Presentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${processed}
</body>
</html>`;
  }

  return processed;
}

/**
 * Create an isolated HTML document for a single slide
 * Used for iframe-based preview with full style isolation
 */
export function createIsolatedSlideHtml(sectionHtml: string, title: string = 'Slide'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      overflow: auto;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
    }
    section, .slide-section {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 4rem;
    }
    h1 { font-size: 3rem; font-weight: 700; color: #22d3ee; margin-bottom: 1rem; }
    h2 { font-size: 2.25rem; font-weight: 600; color: #60a5fa; margin-bottom: 0.75rem; }
    h3 { font-size: 1.5rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.5rem; }
    p { font-size: 1.25rem; line-height: 1.75; color: #cbd5e1; margin-bottom: 1rem; }
    ul, ol { padding-left: 2rem; margin-bottom: 1rem; }
    li { font-size: 1.125rem; line-height: 1.75; color: #cbd5e1; margin-bottom: 0.5rem; }
    .quiz-option {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 1rem;
      margin: 0.5rem 0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quiz-option:hover { background: rgba(255,255,255,0.2); border-color: #22d3ee; }
    code { background: #1e293b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: monospace; }
    pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
    img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  </style>
</head>
<body>
${sectionHtml}
</body>
</html>`;
}

/**
 * Analyze HTML to detect slide boundaries without AI
 * (Fallback method if AI is unavailable)
 */
export function detectSlideBoundaries(html: string): SlideSection[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const slides: SlideSection[] = [];

  // Look for existing sections
  const existingSections = doc.querySelectorAll('section');
  if (existingSections.length > 0) {
    existingSections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3');
      slides.push({
        title: heading?.textContent || `Slide ${index + 1}`,
        content: section.innerHTML,
        type: detectSlideType(section.innerHTML)
      });
    });
    return slides;
  }

  // Look for major headings as slide boundaries
  const headings = doc.querySelectorAll('h1, h2');
  if (headings.length > 0) {
    headings.forEach((heading, index) => {
      // Get content until next heading
      let content = '';
      let currentNode = heading.nextElementSibling;
      while (currentNode && !currentNode.matches('h1, h2')) {
        content += currentNode.outerHTML;
        currentNode = currentNode.nextElementSibling;
      }

      slides.push({
        title: heading.textContent || `Slide ${index + 1}`,
        content: heading.outerHTML + content,
        type: detectSlideType(content)
      });
    });
    return slides;
  }

  // Fallback: create single slide
  slides.push({
    title: 'Imported Content',
    content: doc.body.innerHTML,
    type: 'content'
  });

  return slides;
}

/**
 * Detect the type of slide based on content
 */
function detectSlideType(content: string): SlideSection['type'] {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('quiz') || lowerContent.includes('question') || lowerContent.includes('a)') || lowerContent.includes('b)')) {
    return 'quiz';
  }
  if (lowerContent.includes('case') || lowerContent.includes('patient') || lowerContent.includes('year old')) {
    return 'case';
  }
  if (lowerContent.includes('diagram') || lowerContent.includes('<svg') || lowerContent.includes('chart')) {
    return 'diagram';
  }
  if (lowerContent.includes('summary') || lowerContent.includes('key points') || lowerContent.includes('takeaway')) {
    return 'summary';
  }
  if (content.startsWith('<h1')) {
    return 'title';
  }

  return 'content';
}

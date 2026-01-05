/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Slide Refinement Service
 * Fast, targeted slide-by-slide refinement without regenerating entire presentation
 * Each slide is treated as an isolated container with self-contained HTML
 */

import { MiniMaxProvider } from './providers';
import type { AIProvider } from './ai-provider';

export interface SlideContainer {
  id: string;
  index: number;
  html: string;
  title: string;
  modified: boolean;
}

export interface RefinementResult {
  slides: SlideContainer[];
  fullHtml: string;
  modifiedSlideIds: string[];
  timing: {
    parseMs: number;
    aiMs: number;
    assembleMs: number;
    totalMs: number;
  };
}

/**
 * Parse HTML into isolated slide containers
 * Each slide becomes a self-contained HTML document
 */
export function parseIntoSlideContainers(html: string): SlideContainer[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract global styles
  const styleElements = doc.querySelectorAll('style');
  const globalStyles = Array.from(styleElements).map(s => s.outerHTML).join('\n');

  // Find all slide sections
  const sections = doc.querySelectorAll('section, .slide, [data-slide-index]');

  if (sections.length === 0) {
    // If no sections found, treat entire body as one slide
    return [{
      id: 'slide-1',
      index: 0,
      html: wrapInIsolatedContainer(doc.body.innerHTML, globalStyles, 'Slide 1'),
      title: 'Slide 1',
      modified: false
    }];
  }

  return Array.from(sections).map((section, index) => {
    const id = section.id || `slide-${index + 1}`;
    const heading = section.querySelector('h1, h2, h3');
    const title = heading?.textContent?.trim() || `Slide ${index + 1}`;

    return {
      id,
      index,
      html: wrapInIsolatedContainer(section.outerHTML, globalStyles, title),
      title,
      modified: false
    };
  });
}

/**
 * Wrap slide content in an isolated HTML container
 * This ensures each slide is self-contained with its own styles
 */
function wrapInIsolatedContainer(content: string, globalStyles: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${globalStyles}
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
    section, .slide, .slide-section {
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
    img { max-width: 100%; height: auto; border-radius: 0.5rem; }
    code { background: #1e293b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-family: monospace; }
    pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
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
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * Extract raw section content from isolated container
 */
export function extractSlideContent(isolatedHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(isolatedHtml, 'text/html');

  // Try to find the section/slide content
  const section = doc.querySelector('section, .slide, .slide-section');
  if (section) {
    return section.outerHTML;
  }

  // Fallback to body content
  return doc.body.innerHTML;
}

/**
 * Analyze user's refinement request to identify which slides need changes
 */
function analyzeRefinementScope(
  request: string,
  slides: SlideContainer[]
): { targetSlideIds: string[]; isGlobal: boolean; refinementType: 'content' | 'style' | 'structure' } {
  const lowerRequest = request.toLowerCase();

  // Check for global changes
  const globalTriggers = ['all slides', 'every slide', 'throughout', 'entire presentation', 'whole presentation'];
  const isGlobal = globalTriggers.some(t => lowerRequest.includes(t));

  // Check for specific slide references
  const slideNumberMatch = lowerRequest.match(/slide\s*(\d+)/gi);
  const targetSlideIds: string[] = [];

  if (slideNumberMatch) {
    slideNumberMatch.forEach(match => {
      const num = parseInt(match.replace(/\D/g, ''), 10);
      if (num > 0 && num <= slides.length) {
        targetSlideIds.push(`slide-${num}`);
      }
    });
  }

  // Check for slide title references
  slides.forEach(slide => {
    if (lowerRequest.includes(slide.title.toLowerCase())) {
      if (!targetSlideIds.includes(slide.id)) {
        targetSlideIds.push(slide.id);
      }
    }
  });

  // Determine refinement type
  let refinementType: 'content' | 'style' | 'structure' = 'content';

  const styleTriggers = ['color', 'style', 'font', 'background', 'theme', 'design', 'look'];
  const structureTriggers = ['add slide', 'remove slide', 'reorder', 'move', 'split', 'merge'];

  if (styleTriggers.some(t => lowerRequest.includes(t))) {
    refinementType = 'style';
  } else if (structureTriggers.some(t => lowerRequest.includes(t))) {
    refinementType = 'structure';
  }

  return {
    targetSlideIds: targetSlideIds.length > 0 ? targetSlideIds : (isGlobal ? slides.map(s => s.id) : []),
    isGlobal,
    refinementType
  };
}

/**
 * Refine a single slide with AI
 */
async function refineSlide(
  slide: SlideContainer,
  request: string,
  context: { title: string; topic: string; totalSlides: number },
  onProgress?: (message: string) => void
): Promise<SlideContainer> {
  const provider = new MiniMaxProvider();

  onProgress?.(`Refining slide ${slide.index + 1}: ${slide.title}...`);

  const slideContent = extractSlideContent(slide.html);

  const prompt = `You are a presentation slide editor. Modify this slide based on the user's request.

CONTEXT:
- Presentation: ${context.title}
- Topic: ${context.topic}
- This is slide ${slide.index + 1} of ${context.totalSlides}
- Slide title: ${slide.title}

CURRENT SLIDE HTML:
${slideContent}

USER'S REQUEST:
${request}

REQUIREMENTS:
1. Return ONLY the modified <section> HTML
2. Preserve the slide structure and ID
3. Keep Tailwind CSS classes
4. Apply the requested changes precisely
5. Maintain medical education styling (dark theme, cyan/blue accents)
6. Do NOT include DOCTYPE, html, head, or body tags

Return the modified <section> element:`;

  try {
    const response = await provider.generate(prompt, [], {
      temperature: 0.3,
      maxTokens: 8000,
    });

    // Extract section from response
    const sectionMatch = response.match(/<section[\s\S]*?<\/section>/i);
    const newContent = sectionMatch ? sectionMatch[0] : response;

    // Re-wrap in isolated container
    const parser = new DOMParser();
    const originalDoc = parser.parseFromString(slide.html, 'text/html');
    const styleElements = originalDoc.querySelectorAll('style');
    const globalStyles = Array.from(styleElements).map(s => s.outerHTML).join('\n');

    return {
      ...slide,
      html: wrapInIsolatedContainer(newContent, globalStyles, slide.title),
      modified: true
    };
  } catch (error) {
    console.error(`[SlideRefinement] Error refining slide ${slide.id}:`, error);
    throw error;
  }
}

/**
 * Reassemble slides into full presentation HTML
 */
function assemblePresentation(slides: SlideContainer[], originalHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHtml, 'text/html');

  // Extract styles and scripts from original
  const headContent = doc.head.innerHTML;
  const title = doc.title || 'Presentation';

  // Extract raw section content from each slide
  const slideSections = slides.map(slide => extractSlideContent(slide.html)).join('\n\n');

  // Find original nav and script elements
  const nav = doc.querySelector('nav');
  const navHtml = nav ? nav.outerHTML : '';

  // Preserve original scripts
  const bodyScripts = Array.from(doc.body.querySelectorAll('script'))
    .map(s => s.outerHTML)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}
</head>
<body class="bg-slate-950 text-white">
${navHtml}

<main id="slide-container">
${slideSections}
</main>

${bodyScripts}
</body>
</html>`;
}

/**
 * Main refinement function - Fast, targeted slide refinement
 */
export async function refinePresentation(
  html: string,
  request: string,
  context: { title: string; topic: string },
  onProgress?: (message: string) => void
): Promise<RefinementResult> {
  const startTime = performance.now();

  onProgress?.('Parsing slides...');
  const parseStart = performance.now();
  const slides = parseIntoSlideContainers(html);
  const parseMs = performance.now() - parseStart;

  onProgress?.(`Found ${slides.length} slides. Analyzing request...`);

  // Analyze which slides need refinement
  const { targetSlideIds, isGlobal, refinementType } = analyzeRefinementScope(request, slides);

  // If no specific targets identified, use heuristics
  let slidesToRefine: SlideContainer[];
  if (targetSlideIds.length === 0) {
    // Default: refine first 3 slides or all if less
    slidesToRefine = slides.slice(0, Math.min(3, slides.length));
    onProgress?.(`No specific slides mentioned. Refining first ${slidesToRefine.length} slides...`);
  } else {
    slidesToRefine = slides.filter(s => targetSlideIds.includes(s.id));
    onProgress?.(`Refining ${slidesToRefine.length} targeted slides...`);
  }

  const aiStart = performance.now();

  // Refine slides in parallel for speed
  const refinementPromises = slidesToRefine.map(slide =>
    refineSlide(slide, request, { ...context, totalSlides: slides.length }, onProgress)
  );

  const refinedSlides = await Promise.all(refinementPromises);
  const aiMs = performance.now() - aiStart;

  // Merge refined slides back into full set
  const assembleStart = performance.now();
  const mergedSlides = slides.map(slide => {
    const refined = refinedSlides.find(r => r.id === slide.id);
    return refined || slide;
  });

  // Reassemble full presentation
  const fullHtml = assemblePresentation(mergedSlides, html);
  const assembleMs = performance.now() - assembleStart;

  const totalMs = performance.now() - startTime;

  onProgress?.(`Refinement complete! ${refinedSlides.length} slides updated in ${(totalMs / 1000).toFixed(1)}s`);

  return {
    slides: mergedSlides,
    fullHtml,
    modifiedSlideIds: refinedSlides.map(s => s.id),
    timing: {
      parseMs,
      aiMs,
      assembleMs,
      totalMs
    }
  };
}

/**
 * Quick refinement for single slide
 */
export async function refineSingleSlide(
  slideHtml: string,
  request: string,
  slideIndex: number,
  context: { title: string; topic: string },
  onProgress?: (message: string) => void
): Promise<string> {
  const slide: SlideContainer = {
    id: `slide-${slideIndex + 1}`,
    index: slideIndex,
    html: slideHtml,
    title: `Slide ${slideIndex + 1}`,
    modified: false
  };

  const refined = await refineSlide(slide, request, { ...context, totalSlides: 1 }, onProgress);
  return refined.html;
}

/**
 * Generate a new slide to insert
 */
export async function generateNewSlide(
  request: string,
  context: { title: string; topic: string; insertAfterIndex: number; totalSlides: number },
  onProgress?: (message: string) => void
): Promise<SlideContainer> {
  const provider = new MiniMaxProvider();

  onProgress?.('Generating new slide...');

  const prompt = `You are a medical education slide creator. Generate a new slide based on the user's request.

CONTEXT:
- Presentation: ${context.title}
- Topic: ${context.topic}
- This will be inserted after slide ${context.insertAfterIndex + 1}
- Total slides after insertion: ${context.totalSlides + 1}

USER'S REQUEST:
${request}

REQUIREMENTS:
1. Create a single <section> element with a unique ID
2. Use Tailwind CSS classes
3. Include appropriate heading (h1 or h2)
4. Make it visually consistent with medical education presentations
5. Dark theme with cyan (#22d3ee) and blue (#60a5fa) accents
6. Include relevant interactive elements if appropriate

Return ONLY the <section> element:`;

  const response = await provider.generate(prompt, [], {
    temperature: 0.5,
    maxTokens: 6000,
  });

  // Extract section
  const sectionMatch = response.match(/<section[\s\S]*?<\/section>/i);
  const content = sectionMatch ? sectionMatch[0] : response;

  // Extract title from content
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const heading = doc.querySelector('h1, h2, h3');
  const title = heading?.textContent?.trim() || `New Slide`;

  const newId = `slide-${context.insertAfterIndex + 2}`;

  return {
    id: newId,
    index: context.insertAfterIndex + 1,
    html: wrapInIsolatedContainer(content, '', title),
    title,
    modified: true
  };
}

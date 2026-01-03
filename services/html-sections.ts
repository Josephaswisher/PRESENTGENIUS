/**
 * HTML Section Parser for Selective Refinement
 * Allows refining individual sections/slides instead of entire presentation
 */

export interface HTMLSection {
  id: string;
  type: 'slide' | 'section' | 'custom';
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Parse HTML into discrete sections based on common slide/section patterns
 */
export function parseHTMLSections(html: string): HTMLSection[] {
  const sections: HTMLSection[] = [];

  // Pattern 1: Look for slides (common in presentation HTML)
  const slideRegex = /<(?:div|section)\s+[^>]*class="[^"]*slide[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/gi;
  let match: RegExpExecArray | null;
  let slideIndex = 1;

  while ((match = slideRegex.exec(html)) !== null) {
    const slideContent = match[0];
    const innerContent = match[1];

    // Extract title from h1, h2, or h3
    const titleMatch = innerContent.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
      : `Slide ${slideIndex}`;

    sections.push({
      id: `slide-${slideIndex}`,
      type: 'slide',
      title,
      content: slideContent,
      startIndex: match.index,
      endIndex: match.index + slideContent.length
    });
    slideIndex++;
  }

  // Pattern 2: Look for sections (semantic HTML)
  if (sections.length === 0) {
    const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi;
    let sectionIndex = 1;

    while ((match = sectionRegex.exec(html)) !== null) {
      const sectionContent = match[0];
      const innerContent = match[1];

      const titleMatch = innerContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
        : `Section ${sectionIndex}`;

      sections.push({
        id: `section-${sectionIndex}`,
        type: 'section',
        title,
        content: sectionContent,
        startIndex: match.index,
        endIndex: match.index + sectionContent.length
      });
      sectionIndex++;
    }
  }

  // Pattern 3: Fallback - split by major headings
  if (sections.length === 0) {
    const headingRegex = /<h1[^>]*>.*?<\/h1>/gi;
    const headings: Array<{ index: number; title: string }> = [];

    while ((match = headingRegex.exec(html)) !== null) {
      const titleMatch = match[0].match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled';
      headings.push({ index: match.index, title });
    }

    headings.forEach((heading, idx) => {
      const startIndex = heading.index;
      const endIndex = idx < headings.length - 1
        ? headings[idx + 1].index
        : html.length;

      sections.push({
        id: `heading-${idx + 1}`,
        type: 'custom',
        title: heading.title,
        content: html.substring(startIndex, endIndex),
        startIndex,
        endIndex
      });
    });
  }

  return sections;
}

/**
 * Replace a specific section in the HTML with new content
 */
export function replaceSectionInHTML(
  originalHtml: string,
  section: HTMLSection,
  newSectionContent: string
): string {
  const before = originalHtml.substring(0, section.startIndex);
  const after = originalHtml.substring(section.endIndex);
  return before + newSectionContent + after;
}

/**
 * Extract just the section content for refinement (reduces payload size)
 */
export function extractSectionForRefinement(section: HTMLSection): string {
  return section.content;
}

/**
 * Create a minimal HTML document with just one section (for refinement context)
 */
export function createMinimalHTMLForSection(
  fullHtml: string,
  section: HTMLSection
): string {
  // Extract head section (styles, scripts)
  const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headSection = headMatch ? headMatch[0] : '<head><meta charset="UTF-8"></head>';

  // Extract opening tags
  const htmlOpenMatch = fullHtml.match(/^<!DOCTYPE[^>]*>[\s]*<html[^>]*>/i);
  const htmlOpen = htmlOpenMatch ? htmlOpenMatch[0] : '<!DOCTYPE html><html>';

  const bodyOpenMatch = fullHtml.match(/<body[^>]*>/i);
  const bodyOpen = bodyOpenMatch ? bodyOpenMatch[0] : '<body>';

  return `${htmlOpen}${headSection}${bodyOpen}${section.content}</body></html>`;
}

/**
 * Get section summary for UI display
 */
export function getSectionSummary(sections: HTMLSection[]): Array<{
  id: string;
  title: string;
  type: string;
  size: string;
}> {
  return sections.map(section => ({
    id: section.id,
    title: section.title,
    type: section.type,
    size: `${Math.round(section.content.length / 1024)}KB`
  }));
}

/**
 * Smart section selection based on user query
 * Suggests which sections might be relevant for a refinement request
 */
export function suggestRelevantSections(
  sections: HTMLSection[],
  userQuery: string
): HTMLSection[] {
  const query = userQuery.toLowerCase();
  const keywords = query.split(/\s+/).filter(w => w.length > 3);

  const scored = sections.map(section => {
    const titleLower = section.title.toLowerCase();
    const contentLower = section.content.toLowerCase();

    let score = 0;

    // Exact title match
    if (titleLower.includes(query)) score += 10;

    // Keyword matches in title
    keywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 5;
      if (contentLower.includes(keyword)) score += 1;
    });

    return { section, score };
  });

  // Return sections with score > 0, sorted by score
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.section);
}

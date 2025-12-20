/**
 * Content Extractor Service
 * Parses HTML artifacts to extract structured content for companion materials
 */

export interface ExtractedContent {
  title: string;
  sections: Section[];
  keyTerms: KeyTerm[];
  clinicalPearls: string[];
  quizQuestions: QuizQuestion[];
  objectives: string[];
  summary: string;
  references: string[];
}

export interface Section {
  id: string;
  heading: string;
  level: number;
  content: string;
  bulletPoints: string[];
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

/**
 * Extract structured content from HTML artifact
 */
export function extractContent(html: string, title: string): ExtractedContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  return {
    title: extractTitle(doc) || title,
    sections: extractSections(doc),
    keyTerms: extractKeyTerms(doc),
    clinicalPearls: extractClinicalPearls(doc),
    quizQuestions: extractQuizQuestions(doc),
    objectives: extractObjectives(doc),
    summary: extractSummary(doc),
    references: extractReferences(doc),
  };
}

/**
 * Extract title from document
 */
function extractTitle(doc: Document): string {
  // Try various common title selectors
  const titleElement =
    doc.querySelector('h1') ||
    doc.querySelector('[class*="title"]') ||
    doc.querySelector('header h1, header h2') ||
    doc.querySelector('.hero h1, .hero h2');

  return titleElement?.textContent?.trim() || '';
}

/**
 * Extract sections with headings and content
 */
function extractSections(doc: Document): Section[] {
  const sections: Section[] = [];
  const headings = doc.querySelectorAll('h1, h2, h3, h4');

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);
    const headingText = heading.textContent?.trim() || '';

    // Skip empty or navigation headings
    if (!headingText || headingText.length < 2) return;

    // Get content until next heading
    const content: string[] = [];
    const bulletPoints: string[] = [];
    let sibling = heading.nextElementSibling;

    while (sibling && !['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
      // Extract bullet points from lists
      if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
        sibling.querySelectorAll('li').forEach(li => {
          const text = li.textContent?.trim();
          if (text) bulletPoints.push(text);
        });
      } else {
        const text = sibling.textContent?.trim();
        if (text && text.length > 10) {
          content.push(text);
        }
      }
      sibling = sibling.nextElementSibling;
    }

    sections.push({
      id: `section-${index}`,
      heading: headingText,
      level,
      content: content.join('\n\n'),
      bulletPoints,
    });
  });

  return sections;
}

/**
 * Extract key terms and definitions
 */
function extractKeyTerms(doc: Document): KeyTerm[] {
  const keyTerms: KeyTerm[] = [];

  // Look for definition lists
  const dlElements = doc.querySelectorAll('dl');
  dlElements.forEach(dl => {
    const terms = dl.querySelectorAll('dt');
    const definitions = dl.querySelectorAll('dd');
    terms.forEach((dt, i) => {
      const term = dt.textContent?.trim();
      const definition = definitions[i]?.textContent?.trim();
      if (term && definition) {
        keyTerms.push({ term, definition });
      }
    });
  });

  // Look for bold terms followed by definitions (common pattern)
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach(p => {
    const strong = p.querySelector('strong, b');
    if (strong) {
      const term = strong.textContent?.trim();
      const fullText = p.textContent?.trim() || '';
      const definition = fullText.replace(term || '', '').replace(/^[:\-–—]\s*/, '').trim();
      if (term && definition && definition.length > 10) {
        keyTerms.push({ term, definition });
      }
    }
  });

  // Look for glossary sections
  const glossarySection = doc.querySelector('[class*="glossary"], [class*="terms"], [id*="glossary"]');
  if (glossarySection) {
    const items = glossarySection.querySelectorAll('li, div');
    items.forEach(item => {
      const text = item.textContent?.trim() || '';
      const colonIndex = text.indexOf(':');
      const dashIndex = text.indexOf(' - ');
      const separator = colonIndex > 0 ? colonIndex : dashIndex;

      if (separator > 0) {
        const term = text.substring(0, separator).trim();
        const definition = text.substring(separator + 1).trim();
        if (term && definition) {
          keyTerms.push({ term, definition });
        }
      }
    });
  }

  return keyTerms;
}

/**
 * Extract clinical pearls (high-yield takeaways)
 */
function extractClinicalPearls(doc: Document): string[] {
  const pearls: string[] = [];

  // Look for pearl sections by class or content
  const pearlContainers = doc.querySelectorAll(
    '[class*="pearl"], [class*="tip"], [class*="highlight"], [class*="key-point"], [class*="takeaway"], [class*="important"]'
  );

  pearlContainers.forEach(container => {
    const text = container.textContent?.trim();
    if (text && text.length > 20 && text.length < 500) {
      pearls.push(text);
    }
  });

  // Look for elements with pearl/tip emoji or icons
  const allElements = doc.querySelectorAll('p, li, div');
  allElements.forEach(el => {
    const text = el.textContent?.trim() || '';
    if (
      (text.includes('💡') ||
       text.includes('⭐') ||
       text.includes('🔑') ||
       text.includes('📌') ||
       text.toLowerCase().includes('pearl:') ||
       text.toLowerCase().includes('key point:') ||
       text.toLowerCase().includes('remember:') ||
       text.toLowerCase().includes('tip:')) &&
      text.length > 20 &&
      text.length < 500
    ) {
      // Clean up the text
      const cleaned = text
        .replace(/[💡⭐🔑📌]/g, '')
        .replace(/^(pearl|key point|remember|tip):\s*/i, '')
        .trim();
      if (cleaned && !pearls.includes(cleaned)) {
        pearls.push(cleaned);
      }
    }
  });

  return pearls;
}

/**
 * Extract quiz questions from the content
 */
function extractQuizQuestions(doc: Document): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Look for quiz containers
  const quizContainers = doc.querySelectorAll(
    '[class*="quiz"], [class*="question"], [class*="mcq"], [data-type="quiz"]'
  );

  quizContainers.forEach(container => {
    // Find question text
    const questionEl = container.querySelector(
      '[class*="question-text"], h3, h4, p:first-of-type, .question'
    );
    const questionText = questionEl?.textContent?.trim();

    if (!questionText) return;

    // Find options
    const optionEls = container.querySelectorAll(
      '[class*="option"], [class*="choice"], li, button[data-option]'
    );
    const options: string[] = [];
    let correctAnswer = -1;

    optionEls.forEach((opt, i) => {
      const optText = opt.textContent?.trim();
      if (optText) {
        options.push(optText);
        // Check if this is marked as correct
        if (
          opt.classList.contains('correct') ||
          (opt as HTMLElement).dataset?.correct === 'true' ||
          opt.getAttribute('data-correct') === 'true'
        ) {
          correctAnswer = i;
        }
      }
    });

    // Find explanation
    const explanationEl = container.querySelector(
      '[class*="explanation"], [class*="rationale"], .feedback'
    );
    const explanation = explanationEl?.textContent?.trim() || '';

    if (questionText && options.length >= 2) {
      questions.push({
        question: questionText,
        options,
        correctAnswer,
        explanation,
      });
    }
  });

  return questions;
}

/**
 * Extract learning objectives
 */
function extractObjectives(doc: Document): string[] {
  const objectives: string[] = [];

  // Look for objectives section
  const objectivesContainer = doc.querySelector(
    '[class*="objective"], [class*="learning-goal"], [id*="objective"]'
  );

  if (objectivesContainer) {
    const items = objectivesContainer.querySelectorAll('li');
    items.forEach(item => {
      const text = item.textContent?.trim();
      if (text) objectives.push(text);
    });
  }

  // Also look for numbered objectives in headers
  const headers = doc.querySelectorAll('h2, h3');
  headers.forEach(header => {
    const text = header.textContent?.trim() || '';
    if (text.toLowerCase().includes('objective') || text.toLowerCase().includes('learning goal')) {
      const list = header.nextElementSibling;
      if (list?.tagName === 'UL' || list?.tagName === 'OL') {
        list.querySelectorAll('li').forEach(li => {
          const itemText = li.textContent?.trim();
          if (itemText) objectives.push(itemText);
        });
      }
    }
  });

  return objectives;
}

/**
 * Extract summary content
 */
function extractSummary(doc: Document): string {
  // Look for summary section
  const summaryContainer = doc.querySelector(
    '[class*="summary"], [class*="conclusion"], [id*="summary"], footer'
  );

  if (summaryContainer) {
    return summaryContainer.textContent?.trim() || '';
  }

  // Look for last section that might be a summary
  const sections = doc.querySelectorAll('section, article, .content');
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const heading = lastSection.querySelector('h2, h3');
    const headingText = heading?.textContent?.toLowerCase() || '';

    if (headingText.includes('summary') || headingText.includes('conclusion') || headingText.includes('takeaway')) {
      return lastSection.textContent?.trim() || '';
    }
  }

  return '';
}

/**
 * Extract references and citations
 */
function extractReferences(doc: Document): string[] {
  const references: string[] = [];

  // Look for references section
  const refsContainer = doc.querySelector(
    '[class*="reference"], [class*="citation"], [class*="source"], [id*="reference"]'
  );

  if (refsContainer) {
    const items = refsContainer.querySelectorAll('li, p, div');
    items.forEach(item => {
      const text = item.textContent?.trim();
      if (text && text.length > 10) {
        references.push(text);
      }
    });
  }

  // Also look for inline citations
  const citations = doc.querySelectorAll('[class*="cite"], sup a, .footnote');
  citations.forEach(cite => {
    const text = cite.textContent?.trim();
    if (text) references.push(text);
  });

  return references;
}

/**
 * Generate a plain text outline from extracted content
 */
export function generateOutline(content: ExtractedContent): string {
  const lines: string[] = [];

  lines.push(`# ${content.title}`);
  lines.push('');

  if (content.objectives.length > 0) {
    lines.push('## Learning Objectives');
    content.objectives.forEach((obj, i) => {
      lines.push(`${i + 1}. ${obj}`);
    });
    lines.push('');
  }

  content.sections.forEach(section => {
    const prefix = '#'.repeat(Math.min(section.level + 1, 4));
    lines.push(`${prefix} ${section.heading}`);

    if (section.bulletPoints.length > 0) {
      section.bulletPoints.forEach(point => {
        lines.push(`  • ${point}`);
      });
    }
    lines.push('');
  });

  if (content.clinicalPearls.length > 0) {
    lines.push('## Clinical Pearls');
    content.clinicalPearls.forEach((pearl, i) => {
      lines.push(`💡 ${pearl}`);
    });
    lines.push('');
  }

  if (content.keyTerms.length > 0) {
    lines.push('## Key Terms');
    content.keyTerms.forEach(({ term, definition }) => {
      lines.push(`**${term}**: ${definition}`);
    });
    lines.push('');
  }

  if (content.summary) {
    lines.push('## Summary');
    lines.push(content.summary);
    lines.push('');
  }

  if (content.references.length > 0) {
    lines.push('## References');
    content.references.forEach((ref, i) => {
      lines.push(`${i + 1}. ${ref}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate study questions from extracted content
 */
export function generateStudyQuestions(content: ExtractedContent): string[] {
  const questions: string[] = [];

  // Convert quiz questions to study format
  content.quizQuestions.forEach(q => {
    questions.push(q.question);
  });

  // Generate questions from key terms
  content.keyTerms.forEach(({ term }) => {
    questions.push(`Define: ${term}`);
  });

  // Generate questions from section headings
  content.sections.forEach(section => {
    if (section.level <= 2 && section.heading.length > 5) {
      questions.push(`Explain the key concepts related to: ${section.heading}`);
    }
  });

  return questions;
}

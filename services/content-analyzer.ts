/**
 * Smart Content Analyzer - Auto-detects and highlights learning objectives,
 * clinical cases, and key medical concepts
 *
 * Features:
 * - Learning objective detection
 * - Clinical case identification
 * - Medical terminology extraction
 * - Automatic glossary generation
 * - Hover tooltips for definitions
 * - Table of contents from structure
 */

export interface LearningObjective {
  text: string;
  slideIndex: number;
  confidence: number;
}

export interface ClinicalCase {
  patient: {
    age?: string;
    gender?: string;
    demographics?: string;
  };
  chiefComplaint?: string;
  symptoms: string[];
  diagnosis?: string;
  slideIndex: number;
  fullText: string;
}

export interface KeyConcept {
  term: string;
  definition?: string;
  category: 'disease' | 'drug' | 'procedure' | 'anatomy' | 'symptom' | 'test' | 'general';
  firstMentionSlideIndex: number;
  occurrences: number[];
}

export interface ContentStructure {
  sections: {
    title: string;
    level: number; // h1=1, h2=2, h3=3
    slideIndex: number;
  }[];
  learningObjectives: LearningObjective[];
  clinicalCases: ClinicalCase[];
  keyTerms: KeyConcept[];
}

/**
 * Pattern matchers for learning objectives
 */
const OBJECTIVE_PATTERNS = [
  /(?:by the end|after (?:this|completing)|upon completion).*?(?:you will|learners will|students will|participants will).*?(?:be able to|understand|learn|identify|describe|explain)/gi,
  /(?:learning )?objectives?:\s*[\r\n]+/gi,
  /(?:you will|we will).*?(?:learn|understand|explore|discover|master|examine)/gi,
  /(?:goals?|aims?):\s*[\r\n]+/gi,
  /(?:understand|learn|identify|describe|explain|analyze|evaluate|apply).*?(?:pathophysiology|mechanism|treatment|diagnosis|management|approach)/gi,
];

/**
 * Patterns for clinical case detection
 */
const CASE_PATTERNS = {
  patientDemographics: /(?:patient|pt|case).*?(\d{1,3})[\s-]?(?:year[\s-]?old|y[\./]?o|yr).*?(?:male|female|man|woman|boy|girl|M|F)/gi,
  chiefComplaint: /(?:chief complaint|cc|presenting with|presents with|complains of):\s*([^\.]+)/gi,
  symptoms: /(?:symptoms?|signs?|findings?).*?(?:include|:)\s*([^\.]+)/gi,
  diagnosis: /(?:diagnosis|dx|impression|assessment):\s*([^\.]+)/gi,
};

/**
 * Medical terminology categories with common patterns
 */
const MEDICAL_TERMS: Record<string, RegExp[]> = {
  disease: [
    /(?:acute|chronic)\s+\w+(?:itis|osis|emia|pathy|trophy)/gi,
    /(?:myocardial infarction|stroke|diabetes|hypertension|pneumonia|sepsis|cancer|carcinoma|sarcoma)/gi,
    /(?:COPD|CHF|ARDS|MI|CVA|TIA|DVT|PE)/gi,
  ],
  drug: [
    /\w+(?:cillin|mycin|cycline|prazole|sartan|olol|dipine|statin|parin)/gi,
    /(?:aspirin|morphine|epinephrine|dopamine|insulin|warfarin|heparin)/gi,
  ],
  procedure: [
    /(?:angioplasty|catheterization|intubation|resuscitation|surgery|biopsy)/gi,
    /(?:CT|MRI|X-ray|ultrasound|echocardiography|ECG|EKG)/gi,
  ],
  anatomy: [
    /(?:heart|lung|kidney|liver|brain|artery|vein|ventricle|atrium)/gi,
    /(?:cardiac|pulmonary|renal|hepatic|cerebral|vascular)/gi,
  ],
  symptom: [
    /(?:pain|dyspnea|fever|nausea|vomiting|diarrhea|headache|dizziness)/gi,
    /(?:chest pain|shortness of breath|abdominal pain|tachycardia|bradycardia)/gi,
  ],
  test: [
    /(?:troponin|creatinine|glucose|hemoglobin|platelet|WBC|BNP)/gi,
    /(?:complete blood count|CBC|metabolic panel|liver function|renal function)/gi,
  ],
};

/**
 * Parse HTML to extract text content by slide
 */
function parseHTMLToSlides(html: string): { index: number; content: string; heading?: string }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all h1 and h2 elements (slide boundaries)
  const headings = Array.from(doc.querySelectorAll('h1, h2'));
  const slides: { index: number; content: string; heading?: string }[] = [];

  headings.forEach((heading, index) => {
    const slideContent: string[] = [heading.textContent || ''];
    let nextElement = heading.nextElementSibling;

    // Collect content until next heading
    while (nextElement && !['H1', 'H2'].includes(nextElement.tagName)) {
      if (nextElement.textContent) {
        slideContent.push(nextElement.textContent);
      }
      nextElement = nextElement.nextElementSibling;
    }

    slides.push({
      index,
      content: slideContent.join('\n'),
      heading: heading.textContent || undefined,
    });
  });

  // If no headings found, treat entire document as one slide
  if (slides.length === 0) {
    slides.push({
      index: 0,
      content: doc.body.textContent || '',
    });
  }

  return slides;
}

/**
 * Detect learning objectives in content
 */
function detectLearningObjectives(slides: { index: number; content: string }[]): LearningObjective[] {
  const objectives: LearningObjective[] = [];

  slides.forEach((slide) => {
    OBJECTIVE_PATTERNS.forEach((pattern) => {
      const matches = slide.content.matchAll(pattern);
      for (const match of matches) {
        objectives.push({
          text: match[0].trim(),
          slideIndex: slide.index,
          confidence: calculateObjectiveConfidence(match[0]),
        });
      }
    });

    // Also look for bullet points after "Objectives:" heading
    const objectivesSection = slide.content.match(/objectives?:\s*([\s\S]*?)(?:\n\n|$)/i);
    if (objectivesSection) {
      const bullets = objectivesSection[1].match(/[-•*]\s*(.+)/g);
      if (bullets) {
        bullets.forEach((bullet) => {
          objectives.push({
            text: bullet.replace(/^[-•*]\s*/, '').trim(),
            slideIndex: slide.index,
            confidence: 0.9,
          });
        });
      }
    }
  });

  return objectives;
}

/**
 * Calculate confidence score for objective detection
 */
function calculateObjectiveConfidence(text: string): number {
  let confidence = 0.5;

  // Increase confidence for specific keywords
  if (/by the end|upon completion/i.test(text)) confidence += 0.3;
  if (/you will|learners will|students will/i.test(text)) confidence += 0.2;
  if (/understand|learn|identify|describe|explain/i.test(text)) confidence += 0.2;
  if (/objectives?:/i.test(text)) confidence += 0.3;

  return Math.min(confidence, 1.0);
}

/**
 * Detect clinical cases in content
 */
function detectClinicalCases(slides: { index: number; content: string }[]): ClinicalCase[] {
  const cases: ClinicalCase[] = [];

  slides.forEach((slide) => {
    // Look for patient demographics
    const demoMatch = slide.content.match(CASE_PATTERNS.patientDemographics);
    if (!demoMatch) return;

    // Extract case details
    const ccMatches = Array.from(slide.content.matchAll(CASE_PATTERNS.chiefComplaint));
    const sympMatches = Array.from(slide.content.matchAll(CASE_PATTERNS.symptoms));
    const dxMatches = Array.from(slide.content.matchAll(CASE_PATTERNS.diagnosis));

    // Parse demographics
    const demoText = demoMatch[0];
    const ageMatch = demoText.match(/(\d{1,3})[\s-]?(?:year[\s-]?old|y[\./]?o|yr)/i);
    const genderMatch = demoText.match(/(?:male|female|man|woman|boy|girl|M|F)/i);

    const clinicalCase: ClinicalCase = {
      patient: {
        age: ageMatch ? ageMatch[1] : undefined,
        gender: genderMatch ? genderMatch[0] : undefined,
        demographics: demoText,
      },
      chiefComplaint: ccMatches[0] ? ccMatches[0][1].trim() : undefined,
      symptoms: sympMatches.map((m) => m[1].trim()),
      diagnosis: dxMatches[0] ? dxMatches[0][1].trim() : undefined,
      slideIndex: slide.index,
      fullText: slide.content,
    };

    cases.push(clinicalCase);
  });

  return cases;
}

/**
 * Extract medical terminology and key concepts
 */
function extractKeyTerms(slides: { index: number; content: string }[]): KeyConcept[] {
  const termMap = new Map<string, KeyConcept>();

  slides.forEach((slide) => {
    // Search for each category of medical terms
    Object.entries(MEDICAL_TERMS).forEach(([category, patterns]) => {
      patterns.forEach((pattern) => {
        const matches = Array.from(slide.content.matchAll(pattern));
        matches.forEach((match) => {
          const term = match[0].toLowerCase().trim();

          if (termMap.has(term)) {
            const existing = termMap.get(term)!;
            existing.occurrences.push(slide.index);
          } else {
            termMap.set(term, {
              term: match[0], // Keep original casing
              category: category as any,
              firstMentionSlideIndex: slide.index,
              occurrences: [slide.index],
            });
          }
        });
      });
    });

    // Also extract capitalized medical terms (likely acronyms or proper names)
    const acronyms = slide.content.match(/\b[A-Z]{2,10}\b/g);
    if (acronyms) {
      acronyms.forEach((acronym) => {
        if (termMap.has(acronym.toLowerCase())) {
          const existing = termMap.get(acronym.toLowerCase())!;
          existing.occurrences.push(slide.index);
        } else {
          termMap.set(acronym.toLowerCase(), {
            term: acronym,
            category: 'general',
            firstMentionSlideIndex: slide.index,
            occurrences: [slide.index],
          });
        }
      });
    }
  });

  // Sort by frequency and return top terms
  return Array.from(termMap.values())
    .sort((a, b) => b.occurrences.length - a.occurrences.length);
}

/**
 * Main analysis function
 */
export function analyzeContent(html: string): ContentStructure {
  const slides = parseHTMLToSlides(html);

  return {
    sections: slides.map((slide) => ({
      title: slide.heading || `Slide ${slide.index + 1}`,
      level: 1, // Could be enhanced to detect h1 vs h2
      slideIndex: slide.index,
    })),
    learningObjectives: detectLearningObjectives(slides),
    clinicalCases: detectClinicalCases(slides),
    keyTerms: extractKeyTerms(slides),
  };
}

/**
 * Generate enhanced HTML with semantic markup
 */
export function enhanceHTMLWithAnalysis(html: string, structure: ContentStructure): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Highlight learning objectives
  structure.learningObjectives.forEach((objective) => {
    highlightTextInDOM(doc, objective.text, 'learning-objective');
  });

  // 2. Wrap clinical cases in semantic markup
  structure.clinicalCases.forEach((clinicalCase) => {
    wrapClinicalCase(doc, clinicalCase);
  });

  // 3. Add tooltips to key terms on first mention
  const processedTerms = new Set<string>();
  structure.keyTerms.forEach((concept) => {
    if (!processedTerms.has(concept.term.toLowerCase())) {
      addTooltipToFirstMention(doc, concept);
      processedTerms.add(concept.term.toLowerCase());
    }
  });

  // 4. Inject CSS for highlighting
  const style = doc.createElement('style');
  style.textContent = `
    /* Learning Objective Highlighting */
    .learning-objective {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.5rem;
      font-weight: 600;
      position: relative;
    }

    .learning-objective::before {
      content: "🎯 Learning Objective";
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #3b82f6;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }

    /* Clinical Case Highlighting */
    .clinical-case {
      background: rgba(34, 197, 94, 0.1);
      border: 2px solid rgba(34, 197, 94, 0.3);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }

    .clinical-case-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1.125rem;
      color: #16a34a;
      margin-bottom: 1rem;
    }

    .clinical-case-header::before {
      content: "👤";
      font-size: 1.5rem;
    }

    .patient-demographics {
      background: rgba(255, 255, 255, 0.5);
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .chief-complaint {
      margin: 0.75rem 0;
    }

    .chief-complaint strong {
      color: #dc2626;
    }

    /* Key Term Tooltips */
    .medical-term {
      position: relative;
      cursor: help;
      border-bottom: 2px dotted #6366f1;
      font-weight: 500;
    }

    .medical-term:hover {
      color: #6366f1;
    }

    .medical-term-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      z-index: 1000;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      margin-bottom: 0.5rem;
    }

    .medical-term-tooltip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1e293b;
    }

    .medical-term:hover .medical-term-tooltip {
      opacity: 1;
    }

    /* Category badges */
    .term-category {
      display: inline-block;
      background: rgba(99, 102, 241, 0.2);
      color: #6366f1;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-left: 0.5rem;
      text-transform: uppercase;
      font-weight: 600;
    }
  `;

  const head = doc.querySelector('head');
  if (head) {
    head.appendChild(style);
  }

  return doc.documentElement.outerHTML;
}

/**
 * Highlight specific text in DOM
 */
function highlightTextInDOM(doc: Document, text: string, className: string): void {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodesToReplace: { node: Text; index: number }[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const index = node.textContent?.indexOf(text);
    if (index !== undefined && index >= 0) {
      nodesToReplace.push({ node, index });
    }
  }

  nodesToReplace.forEach(({ node, index }) => {
    const span = doc.createElement('div');
    span.className = className;

    const before = node.textContent!.substring(0, index);
    const highlighted = node.textContent!.substring(index, index + text.length);
    const after = node.textContent!.substring(index + text.length);

    span.textContent = highlighted;

    const parent = node.parentNode!;
    if (before) parent.insertBefore(doc.createTextNode(before), node);
    parent.insertBefore(span, node);
    if (after) parent.insertBefore(doc.createTextNode(after), node);
    parent.removeChild(node);
  });
}

/**
 * Wrap clinical case in semantic markup
 */
function wrapClinicalCase(doc: Document, clinicalCase: ClinicalCase): void {
  // Find the section containing the case
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent?.includes(clinicalCase.patient.demographics || '')) {
      const section = findParentSection(node);
      if (section) {
        section.classList.add('clinical-case');

        // Add header
        const header = doc.createElement('div');
        header.className = 'clinical-case-header';
        header.textContent = 'Clinical Case';
        section.insertBefore(header, section.firstChild);
      }
      break;
    }
  }
}

/**
 * Find parent section element
 */
function findParentSection(node: Node): Element | null {
  let current = node.parentElement;
  while (current) {
    if (['SECTION', 'ARTICLE', 'DIV'].includes(current.tagName)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Add tooltip to first mention of key term
 */
function addTooltipToFirstMention(doc: Document, concept: KeyConcept): void {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  let found = false;

  while ((node = walker.nextNode() as Text | null) && !found) {
    const index = node.textContent?.toLowerCase().indexOf(concept.term.toLowerCase());
    if (index !== undefined && index >= 0) {
      const span = doc.createElement('span');
      span.className = 'medical-term';

      const tooltip = doc.createElement('span');
      tooltip.className = 'medical-term-tooltip';
      tooltip.innerHTML = `
        ${concept.definition || concept.term}
        <span class="term-category">${concept.category}</span>
      `;

      const before = node.textContent!.substring(0, index);
      const term = node.textContent!.substring(index, index + concept.term.length);
      const after = node.textContent!.substring(index + concept.term.length);

      span.textContent = term;
      span.appendChild(tooltip);

      const parent = node.parentNode!;
      if (before) parent.insertBefore(doc.createTextNode(before), node);
      parent.insertBefore(span, node);
      if (after) parent.insertBefore(doc.createTextNode(after), node);
      parent.removeChild(node);

      found = true;
    }
  }
}

/**
 * Generate table of contents from structure
 */
export function generateTableOfContents(structure: ContentStructure): string {
  return `
    <nav class="table-of-contents" style="
      position: fixed;
      right: 2rem;
      top: 50%;
      transform: translateY(-50%);
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      max-width: 250px;
      z-index: 100;
    ">
      <h3 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem; color: #64748b;">
        Contents
      </h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${structure.sections.map((section, idx) => `
          <li style="margin-bottom: 0.5rem;">
            <a href="#slide-${section.slideIndex}" style="
              display: block;
              color: #475569;
              text-decoration: none;
              padding: 0.5rem;
              border-radius: 0.375rem;
              transition: all 0.2s;
              font-size: 0.875rem;
              ${section.level === 1 ? 'font-weight: 600;' : 'padding-left: 1.5rem;'}
            " onmouseover="this.style.background='#f1f5f9'; this.style.color='#3b82f6';"
               onmouseout="this.style.background='transparent'; this.style.color='#475569';">
              ${section.title}
            </a>
          </li>
        `).join('')}
      </ul>

      ${structure.learningObjectives.length > 0 ? `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #3b82f6; margin-bottom: 0.5rem;">
            🎯 ${structure.learningObjectives.length} Learning Objectives
          </div>
        </div>
      ` : ''}

      ${structure.clinicalCases.length > 0 ? `
        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #16a34a; margin-bottom: 0.5rem;">
            👤 ${structure.clinicalCases.length} Clinical Cases
          </div>
        </div>
      ` : ''}

      ${structure.keyTerms.length > 0 ? `
        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #6366f1; margin-bottom: 0.5rem;">
            📖 ${structure.keyTerms.slice(0, 10).length} Key Terms
          </div>
        </div>
      ` : ''}
    </nav>
  `;
}

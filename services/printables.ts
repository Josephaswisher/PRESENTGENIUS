/**
 * Printables Service - High-quality educational materials generation
 * Uses Claude Opus 4 for premium content quality
 */
import { generateWithProvider } from './ai-provider';

export type PrintableType = 
  | 'one-page-handout'
  | 'study-guide'
  | 'follow-along'
  | 'fast-facts'
  | 'board-questions';

export interface PrintableRequest {
  type: PrintableType;
  lectureContent: string;
  title: string;
  topic: string;
  audience: string;
  duration: number;
  slideCount: number;
}

export interface PrintableResult {
  type: PrintableType;
  html: string;
  title: string;
}

const PRINTABLE_PROMPTS: Record<PrintableType, (req: PrintableRequest) => string> = {
  'one-page-handout': (req) => `Create a ONE-PAGE HANDOUT for this lecture:

LECTURE: ${req.title}
TOPIC: ${req.topic}
AUDIENCE: ${req.audience}

CONTENT TO SUMMARIZE:
${req.lectureContent.slice(0, 8000)}

FORMAT REQUIREMENTS:
Create a single-page, print-ready HTML document with:

1. HEADER
   - Title prominently displayed
   - Topic and target audience
   - Date placeholder and QR code placeholder area

2. KEY TAKEAWAYS BOX (top right, highlighted)
   - 3-5 most critical points in a colored box
   - Use bullet points, bold key terms

3. MAIN CONTENT (2-column layout)
   - Left column: Core concepts, definitions
   - Right column: Clinical pearls, practical tips

4. QUICK REFERENCE TABLE
   - Relevant criteria, doses, or algorithms
   - Clean borders, alternating row colors

5. CLINICAL PEARL CALLOUT
   - One "Don't forget!" or "High-yield" box
   - Visually distinct (border, background)

6. FOOTER
   - "Created with PresentGenius" 
   - Space for notes

STYLING:
- Use Tailwind CSS
- Professional medical aesthetic
- Print-friendly (no dark backgrounds)
- Maximum information density while maintaining readability
- Use medical color coding: red=critical, yellow=caution, green=normal, blue=info

Return ONLY the HTML. Start with <!DOCTYPE html>.`,

  'study-guide': (req) => `Create a COMPREHENSIVE STUDY GUIDE for this lecture:

LECTURE: ${req.title}
TOPIC: ${req.topic}
AUDIENCE: ${req.audience}
DURATION: ${req.duration} minutes

CONTENT:
${req.lectureContent.slice(0, 10000)}

FORMAT REQUIREMENTS:
Create a 2-4 page study guide HTML document with:

1. COVER/HEADER
   - Title, topic, date
   - Learning objectives (3-5 checkboxes)
   - Pre-requisite knowledge reminder

2. SECTION SUMMARIES
   - Match the lecture structure
   - Each section with:
     * Header with icon
     * Key concepts in prose
     * Important terms in bold with definitions
     * "Remember" callout boxes

3. HIGH-YIELD BOXES
   - Yellow/orange highlighted boxes
   - Board-relevant facts
   - Common exam questions

4. CLINICAL PEARLS
   - Speech bubble or quote style
   - Real-world application tips
   - "In practice..." insights

5. VISUAL AIDS SECTION
   - Placeholder boxes for diagrams
   - Algorithm flowcharts where relevant
   - Comparison tables

6. SELF-ASSESSMENT
   - 5-8 review questions per major section
   - Mix of recall and application
   - Answer key at the end

7. ANNOTATED BIBLIOGRAPHY
   - Key references cited
   - "For further reading" section

8. NOTES SECTION
   - Lined area for personal notes

STYLING:
- Clean, academic aesthetic
- Print-friendly white background
- Clear visual hierarchy
- Professional typography
- Generous margins for annotations

Return ONLY the HTML. Start with <!DOCTYPE html>.`,

  'follow-along': (req) => `Create a FOLLOW-ALONG GUIDE for this lecture:

LECTURE: ${req.title}
TOPIC: ${req.topic}  
SLIDES: ${req.slideCount} slides over ${req.duration} minutes

CONTENT:
${req.lectureContent.slice(0, 8000)}

FORMAT REQUIREMENTS:
Create a worksheet-style HTML document where students fill in blanks during the lecture:

1. HEADER
   - Title, date, presenter placeholder
   - "Follow along and fill in the blanks!"

2. FOR EACH MAJOR SECTION:
   - Section number and title
   - 3-5 fill-in-the-blank statements
   - Key terms with blanks: "The main treatment for ___ is ___"
   - Strategic blanks (important concepts, not random words)

3. DRAWING/DIAGRAM BOXES
   - Empty boxes with prompts: "Sketch the algorithm here"
   - "Label this diagram" placeholders
   - Space for student drawings

4. PAUSE & REFLECT PROMPTS
   - "What would you do if...?" scenarios
   - Quick application questions
   - 2-3 lines for answers

5. CHECKPOINT QUIZZES
   - After each major section
   - 2-3 quick MCQs
   - Immediate self-check

6. SUMMARY BOX (end)
   - "Today I learned..." 
   - "Questions I still have..."
   - "Key takeaway..."

7. KEY TERMS GLOSSARY
   - Terms on left, blank definitions on right

STYLING:
- Worksheet aesthetic with lines/boxes
- Plenty of white space for writing
- Clear section dividers
- Print-friendly
- Numbered to match slides

Return ONLY the HTML. Start with <!DOCTYPE html>.`,

  'fast-facts': (req) => `Create a FAST FACTS POCKET CARD for this lecture:

LECTURE: ${req.title}
TOPIC: ${req.topic}

CONTENT:
${req.lectureContent.slice(0, 6000)}

FORMAT REQUIREMENTS:
Create a compact, badge-sized (3x5 or 4x6) reference card HTML:

1. FRONT SIDE
   - Topic title (bold, large)
   - Diagnostic criteria OR key algorithm
   - Critical values in boxes
   - Color-coded by urgency

2. BACK SIDE  
   - Treatment quick reference
   - Drug doses in table format
   - "Don't Miss" warnings
   - Quick differential list

3. DESIGN ELEMENTS
   - Maximum information density
   - Abbreviations where standard
   - Icons for quick scanning
   - Borders for lamination

4. MUST INCLUDE
   - Emergency/critical values highlighted in RED
   - First-line treatments in GREEN
   - Contraindications in YELLOW
   - Dosing for common medications

STYLING:
- Credit card proportions (aspect ratio)
- Very compact typography (10-11px base)
- High contrast for readability
- Print on cardstock-ready
- Clear front/back division

Return ONLY the HTML with both sides. Start with <!DOCTYPE html>.`,

  'board-questions': (req) => `Create a BOARD-STYLE PRACTICE QUESTIONS sheet for this lecture:

LECTURE: ${req.title}
TOPIC: ${req.topic}
AUDIENCE: ${req.audience}

CONTENT:
${req.lectureContent.slice(0, 8000)}

FORMAT REQUIREMENTS:
Create 8-10 USMLE-style questions with a separate answer key:

1. QUESTION FORMAT (for each)
   - Clinical vignette (3-5 sentences)
   - Relevant history, exam, labs
   - Clear question stem
   - 5 answer choices (A-E)
   - Single best answer format

2. QUESTION TYPES (mix of):
   - Diagnosis questions
   - Next best step in management
   - Mechanism of action
   - Most likely finding
   - Best initial test

3. DIFFICULTY MIX
   - 30% straightforward
   - 50% moderate complexity
   - 20% challenging

4. ANSWER KEY (separate section)
   - Correct answer clearly marked
   - Detailed explanation (2-3 sentences)
   - Why correct answer is right
   - Why each wrong answer is wrong
   - Teaching point / Pearl
   - Related high-yield fact

5. FORMATTING
   - Clear question numbering
   - Professional NBME-style layout
   - Adequate spacing
   - Answer key on separate "page" (page break)

STYLING:
- Clean, exam-like aesthetic
- Clear typography
- Generous spacing
- Print-friendly
- Page numbers

Return ONLY the HTML. Start with <!DOCTYPE html>.`,
};

/**
 * Generate a high-quality printable using Opus
 */
export async function generatePrintable(request: PrintableRequest): Promise<PrintableResult> {
  const promptGenerator = PRINTABLE_PROMPTS[request.type];
  if (!promptGenerator) {
    throw new Error(`Unknown printable type: ${request.type}`);
  }

  const prompt = promptGenerator(request);
  
  // Use Opus for premium quality
  const html = await generateWithProvider('opus', prompt, [], {});
  
  // Clean up any markdown artifacts
  const cleanedHtml = html
    .replace(/^```html\s*/g, '')
    .replace(/^```\s*/g, '')
    .replace(/```$/g, '')
    .trim();

  return {
    type: request.type,
    html: cleanedHtml,
    title: `${request.title} - ${getTypeLabel(request.type)}`,
  };
}

/**
 * Generate all selected printables
 */
export async function generateAllPrintables(
  types: PrintableType[],
  lectureContent: string,
  title: string,
  topic: string,
  audience: string,
  duration: number,
  slideCount: number
): Promise<PrintableResult[]> {
  const results: PrintableResult[] = [];

  for (const type of types) {
    try {
      const result = await generatePrintable({
        type,
        lectureContent,
        title,
        topic,
        audience,
        duration,
        slideCount,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate ${type}:`, error);
    }
  }

  return results;
}

function getTypeLabel(type: PrintableType): string {
  const labels: Record<PrintableType, string> = {
    'one-page-handout': 'One-Page Handout',
    'study-guide': 'Study Guide',
    'follow-along': 'Follow-Along Guide',
    'fast-facts': 'Fast Facts Card',
    'board-questions': 'Board Questions',
  };
  return labels[type] || type;
}

/**
 * Export printable to downloadable format
 */
export function downloadPrintable(result: PrintableResult): void {
  const blob = new Blob([result.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

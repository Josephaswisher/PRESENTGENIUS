/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enhanced Student Study Guide Generator
 * Creates comprehensive, print-ready study materials from presentations
 * Uses MiniMax for fast generation with slide-by-slide processing
 */

import { MiniMaxProvider } from './providers';
import { parseIntoSlideContainers, type SlideContainer } from './slide-refinement';

export interface StudyGuideSection {
  slideId: string;
  title: string;
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
  clinicalPearls: string[];
  reviewQuestions: Array<{
    question: string;
    answer: string;
    difficulty: 'basic' | 'intermediate' | 'advanced';
  }>;
  notesArea: boolean;
}

export interface StudyGuideConfig {
  title: string;
  topic: string;
  audience: 'medical-student' | 'resident' | 'attending' | 'nurse' | 'general';
  includeAnswerKey: boolean;
  includeCornellNotes: boolean;
  includeSpacedRepetition: boolean;
  includeQuickReference: boolean;
}

export interface StudyGuideResult {
  html: string;
  sections: StudyGuideSection[];
  metadata: {
    totalSlides: number;
    totalTerms: number;
    totalQuestions: number;
    generationTimeMs: number;
  };
}

/**
 * Extract text content from HTML slide for analysis
 */
function extractSlideText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Get text content
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}

/**
 * Generate study guide section for a single slide using MiniMax
 */
async function generateSlideSection(
  slide: SlideContainer,
  config: StudyGuideConfig,
  slideIndex: number,
  totalSlides: number
): Promise<StudyGuideSection> {
  const provider = new MiniMaxProvider();
  const slideText = extractSlideText(slide.html);

  const prompt = `Analyze this slide content and generate study guide material.

SLIDE ${slideIndex + 1} of ${totalSlides}: "${slide.title}"
TOPIC: ${config.topic}
AUDIENCE: ${config.audience}

SLIDE CONTENT:
${slideText.slice(0, 3000)}

Generate a JSON object with this structure:
{
  "summary": "2-3 sentence summary of key concepts",
  "keyTerms": [
    {"term": "Medical Term", "definition": "Clear, concise definition"}
  ],
  "clinicalPearls": [
    "Practical insight or tip for clinical practice"
  ],
  "reviewQuestions": [
    {
      "question": "Review question text?",
      "answer": "Complete answer with explanation",
      "difficulty": "basic|intermediate|advanced"
    }
  ]
}

REQUIREMENTS:
- Extract 2-5 key terms with clear definitions
- Include 1-3 clinical pearls (practical tips)
- Generate 2-4 review questions at varying difficulty levels
- Focus on high-yield, board-relevant content
- Use language appropriate for ${config.audience}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await provider.generate(prompt, [], {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      slideId: slide.id,
      title: slide.title,
      summary: data.summary || 'Content summary not available.',
      keyTerms: Array.isArray(data.keyTerms) ? data.keyTerms : [],
      clinicalPearls: Array.isArray(data.clinicalPearls) ? data.clinicalPearls : [],
      reviewQuestions: Array.isArray(data.reviewQuestions) ? data.reviewQuestions : [],
      notesArea: config.includeCornellNotes,
    };
  } catch (error) {
    console.error(`[StudyGuide] Error processing slide ${slideIndex + 1}:`, error);

    // Return minimal section on error
    return {
      slideId: slide.id,
      title: slide.title,
      summary: `Review slide ${slideIndex + 1}: ${slide.title}`,
      keyTerms: [],
      clinicalPearls: [],
      reviewQuestions: [],
      notesArea: config.includeCornellNotes,
    };
  }
}

/**
 * Generate complete HTML study guide
 */
function generateStudyGuideHtml(
  sections: StudyGuideSection[],
  config: StudyGuideConfig
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Collect all terms and questions for reference sections
  const allTerms = sections.flatMap(s => s.keyTerms);
  const allQuestions = sections.flatMap(s => s.reviewQuestions);
  const allPearls = sections.flatMap(s => s.clinicalPearls);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - Student Study Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: letter;
      margin: 0.75in;
    }

    @media print {
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
      body { font-size: 11pt; }
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }

    /* Cover Page */
    .cover {
      text-align: center;
      padding: 2rem 0 3rem;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 2rem;
    }

    .cover h1 {
      font-family: 'Merriweather', serif;
      font-size: 2rem;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }

    .cover .subtitle {
      font-size: 1.25rem;
      color: #4b5563;
      margin-bottom: 1rem;
    }

    .cover .meta {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Learning Objectives */
    .objectives {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
    }

    .objectives h2 {
      font-size: 1rem;
      color: #1e40af;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .objectives ul {
      list-style: none;
      padding: 0;
    }

    .objectives li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .objectives li::before {
      content: "□";
      color: #2563eb;
      font-weight: bold;
    }

    /* Section Styling */
    .section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .section-number {
      background: #2563eb;
      color: white;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .section-title {
      font-family: 'Merriweather', serif;
      font-size: 1.25rem;
      color: #1f2937;
    }

    .summary {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      border: 1px solid #e5e7eb;
    }

    /* Key Terms */
    .key-terms {
      margin: 1rem 0;
    }

    .key-terms h3 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .term-grid {
      display: grid;
      gap: 0.5rem;
    }

    .term-item {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px dashed #e5e7eb;
      font-size: 0.9rem;
    }

    .term-name {
      font-weight: 600;
      color: #1e40af;
    }

    .term-def {
      color: #4b5563;
    }

    /* Clinical Pearls */
    .clinical-pearl {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 0.75rem 1rem;
      margin: 0.75rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
      font-size: 0.9rem;
    }

    .clinical-pearl::before {
      content: "💡 Clinical Pearl: ";
      font-weight: 600;
      color: #92400e;
    }

    /* High Yield Box */
    .high-yield {
      background: #fef2f2;
      border: 2px solid #ef4444;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }

    .high-yield h4 {
      color: #dc2626;
      font-size: 0.875rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .high-yield h4::before {
      content: "⚡";
    }

    /* Review Questions */
    .review-questions {
      margin: 1.5rem 0;
    }

    .review-questions h3 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .question {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f3f4f6;
      border-radius: 0.5rem;
    }

    .question-text {
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .question-difficulty {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-left: 0.5rem;
    }

    .difficulty-basic { background: #d1fae5; color: #065f46; }
    .difficulty-intermediate { background: #fef3c7; color: #92400e; }
    .difficulty-advanced { background: #fee2e2; color: #991b1b; }

    .question-answer {
      font-size: 0.875rem;
      color: #4b5563;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
      margin-top: 0.5rem;
    }

    .answer-hidden {
      background: repeating-linear-gradient(
        90deg,
        #e5e7eb,
        #e5e7eb 2px,
        transparent 2px,
        transparent 4px
      );
      color: transparent;
      user-select: none;
    }

    /* Cornell Notes Section */
    .cornell-notes {
      display: grid;
      grid-template-columns: 2in 1fr;
      gap: 0;
      border: 2px solid #1f2937;
      margin: 1rem 0;
      min-height: 3in;
    }

    .cornell-cue {
      background: #f3f4f6;
      border-right: 2px solid #1f2937;
      padding: 0.75rem;
    }

    .cornell-cue h4 {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .cornell-notes-area {
      padding: 0.75rem;
      background: repeating-linear-gradient(
        transparent,
        transparent 1.5rem,
        #e5e7eb 1.5rem,
        #e5e7eb calc(1.5rem + 1px)
      );
    }

    .cornell-summary {
      grid-column: 1 / -1;
      border-top: 2px solid #1f2937;
      padding: 0.75rem;
      background: #fef3c7;
    }

    .cornell-summary h4 {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 0.25rem;
    }

    /* Quick Reference Card */
    .quick-reference {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }

    .quick-reference h3 {
      color: #166534;
      font-size: 1rem;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .quick-reference h3::before {
      content: "📋";
    }

    /* Glossary */
    .glossary {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 3px solid #1f2937;
    }

    .glossary h2 {
      font-family: 'Merriweather', serif;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .glossary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem 2rem;
    }

    .glossary-item {
      display: flex;
      gap: 0.5rem;
      padding: 0.375rem 0;
      border-bottom: 1px dotted #d1d5db;
      font-size: 0.85rem;
    }

    .glossary-term {
      font-weight: 600;
      color: #1e40af;
      white-space: nowrap;
    }

    /* Spaced Repetition Tracker */
    .spaced-rep {
      background: #faf5ff;
      border: 1px solid #c4b5fd;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }

    .spaced-rep h3 {
      color: #6d28d9;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .spaced-rep-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
      text-align: center;
      font-size: 0.75rem;
    }

    .spaced-rep-box {
      border: 1px solid #c4b5fd;
      padding: 0.5rem 0.25rem;
      border-radius: 0.25rem;
    }

    .spaced-rep-box span {
      display: block;
      font-weight: 600;
      color: #6d28d9;
    }

    /* Footer */
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.75rem;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <!-- Cover Section -->
  <div class="cover">
    <h1>${config.title}</h1>
    <div class="subtitle">Student Study Guide</div>
    <div class="meta">
      <div>${config.topic}</div>
      <div>Generated: ${currentDate}</div>
      <div>Audience: ${config.audience.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
    </div>
  </div>

  <!-- Learning Objectives -->
  <div class="objectives">
    <h2>🎯 Learning Objectives</h2>
    <ul>
      ${sections.slice(0, 5).map(s => `<li>Understand and explain: ${s.title}</li>`).join('\n      ')}
    </ul>
  </div>

  ${config.includeSpacedRepetition ? `
  <!-- Spaced Repetition Tracker -->
  <div class="spaced-rep">
    <h3>📅 Spaced Repetition Review Tracker</h3>
    <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.75rem;">
      Review this material on these dates for optimal retention:
    </p>
    <div class="spaced-rep-grid">
      <div class="spaced-rep-box"><span>Day 1</span>Today</div>
      <div class="spaced-rep-box"><span>Day 3</span>___/___</div>
      <div class="spaced-rep-box"><span>Day 7</span>___/___</div>
      <div class="spaced-rep-box"><span>Day 14</span>___/___</div>
      <div class="spaced-rep-box"><span>Day 30</span>___/___</div>
    </div>
  </div>
  ` : ''}

  <!-- Main Content Sections -->
  ${sections.map((section, index) => `
  <div class="section ${index > 0 && index % 3 === 0 ? 'page-break' : ''}">
    <div class="section-header">
      <div class="section-number">${index + 1}</div>
      <h2 class="section-title">${section.title}</h2>
    </div>

    <div class="summary">
      ${section.summary}
    </div>

    ${section.keyTerms.length > 0 ? `
    <div class="key-terms">
      <h3>📚 Key Terms</h3>
      <div class="term-grid">
        ${section.keyTerms.map(t => `
        <div class="term-item">
          <span class="term-name">${t.term}</span>
          <span class="term-def">${t.definition}</span>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${section.clinicalPearls.length > 0 ? section.clinicalPearls.map(pearl => `
    <div class="clinical-pearl">${pearl}</div>
    `).join('') : ''}

    ${section.reviewQuestions.length > 0 ? `
    <div class="review-questions">
      <h3>✅ Review Questions</h3>
      ${section.reviewQuestions.map((q, qi) => `
      <div class="question">
        <div class="question-text">
          ${qi + 1}. ${q.question}
          <span class="question-difficulty difficulty-${q.difficulty}">${q.difficulty}</span>
        </div>
        <div class="question-answer ${config.includeAnswerKey ? '' : 'answer-hidden'}">
          ${config.includeAnswerKey ? `<strong>Answer:</strong> ${q.answer}` : 'Answer hidden - check answer key'}
        </div>
      </div>
      `).join('')}
    </div>
    ` : ''}

    ${config.includeCornellNotes ? `
    <div class="cornell-notes">
      <div class="cornell-cue">
        <h4>Cues / Questions</h4>
      </div>
      <div class="cornell-notes-area"></div>
      <div class="cornell-summary">
        <h4>Summary</h4>
      </div>
    </div>
    ` : ''}
  </div>
  `).join('')}

  ${config.includeQuickReference && allPearls.length > 0 ? `
  <!-- Quick Reference -->
  <div class="quick-reference page-break">
    <h3>Quick Reference: Clinical Pearls</h3>
    <ul style="font-size: 0.9rem; padding-left: 1.25rem;">
      ${allPearls.slice(0, 10).map(p => `<li style="margin-bottom: 0.5rem;">${p}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${allTerms.length > 0 ? `
  <!-- Glossary -->
  <div class="glossary page-break">
    <h2>📖 Glossary</h2>
    <div class="glossary-grid">
      ${allTerms.map(t => `
      <div class="glossary-item">
        <span class="glossary-term">${t.term}:</span>
        <span>${t.definition}</span>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${!config.includeAnswerKey && allQuestions.length > 0 ? `
  <!-- Answer Key -->
  <div class="page-break" style="margin-top: 2rem;">
    <h2 style="font-family: 'Merriweather', serif; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #1f2937;">
      📝 Answer Key
    </h2>
    ${allQuestions.map((q, i) => `
    <div style="margin-bottom: 0.75rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.25rem; font-size: 0.85rem;">
      <strong>${i + 1}.</strong> ${q.answer}
    </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <p>Generated with PresentGenius | ${config.title} | ${currentDate}</p>
    <p style="margin-top: 0.25rem;">For educational purposes only. Verify clinical information with current guidelines.</p>
  </div>
</body>
</html>`;
}

/**
 * Main function: Generate comprehensive student study guide
 */
export async function generateStudentStudyGuide(
  presentationHtml: string,
  config: StudyGuideConfig,
  onProgress?: (message: string, progress: number) => void
): Promise<StudyGuideResult> {
  const startTime = performance.now();

  onProgress?.('Parsing presentation slides...', 5);

  // Parse HTML into slide containers
  const slides = parseIntoSlideContainers(presentationHtml);

  if (slides.length === 0) {
    throw new Error('No slides found in presentation');
  }

  onProgress?.(`Found ${slides.length} slides. Generating study guide sections...`, 10);

  // Process slides in parallel batches for speed
  const batchSize = 3;
  const sections: StudyGuideSection[] = [];

  for (let i = 0; i < slides.length; i += batchSize) {
    const batch = slides.slice(i, i + batchSize);
    const batchProgress = 10 + ((i / slides.length) * 70);

    onProgress?.(
      `Processing slides ${i + 1}-${Math.min(i + batchSize, slides.length)} of ${slides.length}...`,
      batchProgress
    );

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((slide, batchIndex) =>
        generateSlideSection(slide, config, i + batchIndex, slides.length)
      )
    );

    sections.push(...batchResults);
  }

  onProgress?.('Generating final study guide HTML...', 85);

  // Generate the complete HTML document
  const html = generateStudyGuideHtml(sections, config);

  const generationTimeMs = performance.now() - startTime;

  onProgress?.('Study guide complete!', 100);

  return {
    html,
    sections,
    metadata: {
      totalSlides: slides.length,
      totalTerms: sections.reduce((sum, s) => sum + s.keyTerms.length, 0),
      totalQuestions: sections.reduce((sum, s) => sum + s.reviewQuestions.length, 0),
      generationTimeMs,
    },
  };
}

/**
 * Quick study guide generation with minimal AI calls
 * Uses template-based approach for faster results
 */
export async function generateQuickStudyGuide(
  presentationHtml: string,
  config: StudyGuideConfig
): Promise<string> {
  const slides = parseIntoSlideContainers(presentationHtml);

  // Create simple sections without AI processing
  const sections: StudyGuideSection[] = slides.map((slide, index) => ({
    slideId: slide.id,
    title: slide.title,
    summary: `Review the content from slide ${index + 1}: ${slide.title}`,
    keyTerms: [],
    clinicalPearls: [],
    reviewQuestions: [],
    notesArea: config.includeCornellNotes,
  }));

  return generateStudyGuideHtml(sections, config);
}

/**
 * Standard Presentation Template
 * Traditional slide deck format
 */

import { Template } from '../../types';

export const PRESENTATION_STANDARD_PROMPT_AUGMENT = `
CREATE A STANDARD MEDICAL PRESENTATION about [TOPIC] for [AUDIENCE].

SLIDE STRUCTURE (Target: 15-20 slides):

1. TITLE SLIDE
   - Topic title
   - Presenter name placeholder
   - Date and institution
   - Learning objectives (3-5 bullets)

2. OUTLINE SLIDE
   - Overview of presentation sections
   - Estimated time for each section

3. BACKGROUND/INTRODUCTION (2-3 slides)
   - Why this topic matters
   - Epidemiology and prevalence
   - Current state of knowledge

4. PATHOPHYSIOLOGY/MECHANISM (2-3 slides)
   - Key concepts explained
   - Visual diagrams (using CSS/SVG)
   - Simplified flowcharts

5. CLINICAL PRESENTATION (2-3 slides)
   - Signs and symptoms
   - Classic presentation patterns
   - Atypical presentations

6. DIAGNOSIS (2-3 slides)
   - Diagnostic criteria
   - Workup algorithm
   - Key tests and interpretation

7. MANAGEMENT (3-4 slides)
   - Treatment options
   - Medication dosing
   - Guidelines summary
   - Special populations

8. COMPLICATIONS/PROGNOSIS (1-2 slides)
   - What can go wrong
   - Monitoring and follow-up

9. CLINICAL PEARLS (1 slide)
   - High-yield takeaways
   - Board buzzwords
   - Common pitfalls

10. CASES/QUESTIONS (2-3 slides)
    - Interactive case examples
    - Self-assessment questions

11. SUMMARY/CONCLUSIONS (1 slide)
    - Key points recap
    - Take-home messages

12. REFERENCES (1 slide)
    - Key citations
    - Guideline sources

SLIDE DESIGN:
- One main idea per slide
- 6x6 rule: Max 6 bullets, 6 words each
- Visual > Text whenever possible
- Consistent header/footer
- Slide numbers
- Progress indicator

INTERACTIVITY:
- Click to reveal bullet points
- Navigate with arrow keys or swipe
- Presenter notes panel (toggleable)
- Timer display
- "Jump to slide" menu

VISUAL STYLE:
- Clean, professional aesthetic
- Consistent color scheme (medical teal/blue)
- High-contrast text
- Subtle slide transitions
- Dark mode optimized

TARGET DURATION: [DURATION]
`;

export const template: Template = {
  meta: {
    id: 'presentation-standard',
    name: 'Standard Presentation',
    icon: '📽️',
    category: 'new-formats',
    description: 'Traditional slide deck with progressive reveal',
    previewThumbnail: '/templates/new-formats/presentation-standard/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    estimatedSlides: 18,
    tags: ['presentation', 'slides', 'lecture', 'traditional'],
  },
  promptAugment: PRESENTATION_STANDARD_PROMPT_AUGMENT,
};

export default template;

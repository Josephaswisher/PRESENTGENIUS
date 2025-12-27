/**
 * Journal Club Template
 * PICO framework with critical appraisal
 */

import { Template } from '../../types';

export const JOURNAL_CLUB_PROMPT_AUGMENT = `
CREATE A JOURNAL CLUB PRESENTATION about [TOPIC] for [AUDIENCE].

STRUCTURE (Following PICO Framework):
1. BACKGROUND SLIDE
   - Clinical context and why this matters
   - Knowledge gap being addressed
   - Study citation and publication details

2. PICO BREAKDOWN
   - Population: Who was studied?
   - Intervention: What was done?
   - Comparison: What was the control?
   - Outcome: What was measured?

3. METHODS CRITIQUE
   - Study design (RCT, cohort, meta-analysis, etc.)
   - Randomization and blinding
   - Sample size and power calculation
   - Primary and secondary endpoints
   - Statistical methods used

4. RESULTS SUMMARY
   - Primary outcome with effect size
   - Secondary outcomes
   - Subgroup analyses
   - NNT/NNH if applicable
   - Key figures/tables (recreate as simple visualizations)

5. CRITICAL APPRAISAL
   - Internal validity concerns
   - External validity/generalizability
   - Strengths of the study
   - Limitations and biases
   - Funding source and conflicts

6. CLINICAL APPLICATION
   - Does this change practice?
   - Which patients would benefit?
   - What are the barriers to implementation?
   - Cost considerations

7. BOTTOM LINE
   - One-sentence summary
   - Level of evidence
   - Practice recommendation

INTERACTIVITY:
- Collapsible sections for each part
- Hover tooltips for statistical terms
- "Show Formula" buttons for calculations
- Discussion prompts for each section

STYLE:
- Academic/scholarly aesthetic
- Clean typography with clear hierarchy
- Subtle animations for reveals
- Print-friendly layout option

TARGET DURATION: [DURATION]
`;

export const template: Template = {
  meta: {
    id: 'journal-club',
    name: 'Journal Club Presentation',
    icon: '📚',
    category: 'new-formats',
    description: 'PICO framework with critical appraisal and discussion points',
    previewThumbnail: '/templates/new-formats/journal-club/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['PGY2-3', 'Fellow'],
    estimatedSlides: 8,
    tags: ['research', 'evidence-based', 'academic', 'critical-appraisal'],
  },
  promptAugment: JOURNAL_CLUB_PROMPT_AUGMENT,
};

export default template;

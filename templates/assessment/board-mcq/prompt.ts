/**
 * Board-Style MCQ Template
 * USMLE/COMLEX format with clinical vignette and 5 options
 */

import { Template } from '../../types';

export const BOARD_MCQ_PROMPT_AUGMENT = `
Generate a board-style multiple choice question about [TOPIC] for [AUDIENCE].

STRUCTURE:
1. Clinical vignette (2-3 paragraphs with patient presentation, vitals, lab/imaging findings)
2. A clear question stem asking for the "most appropriate next step" or "most likely diagnosis"
3. Five answer options (A-E) with one clearly correct answer
4. Detailed explanation revealing:
   - Why the correct answer is right
   - Why each distractor is wrong
   - A clinical pearl or high-yield takeaway
   - Relevant guideline citations

STYLE:
- Use realistic clinical scenarios
- Include specific numbers (vitals, lab values)
- Make distractors plausible but clearly distinguishable
- Include a timer display and navigation buttons
- Add "Flag for Review" functionality
- Use the dark medical theme with indigo accents

INTERACTIVITY:
- Click to select an option (highlight with ring)
- Submit button reveals the answer
- Correct answer shows green, wrong shows red
- Explanation panel slides in from bottom

TARGET DURATION: [DURATION]
`;

export const template: Template = {
  meta: {
    id: 'board-mcq',
    name: 'Board-Style MCQ',
    icon: '🅰️',
    category: 'assessment',
    description: 'USMLE-format vignette with 5 options and explanations',
    previewThumbnail: '/templates/assessment/board-mcq/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    estimatedSlides: 1,
    tags: ['board-prep', 'assessment', 'mcq', 'usmle'],
  },
  promptAugment: BOARD_MCQ_PROMPT_AUGMENT,
};

export default template;

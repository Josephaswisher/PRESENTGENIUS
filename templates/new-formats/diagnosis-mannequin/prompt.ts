/**
 * Diagnosis Mannequin Template
 * Interactive body diagram with clickable regions
 */

import { Template } from '../../types';

export const DIAGNOSIS_MANNEQUIN_PROMPT_AUGMENT = `
CREATE AN INTERACTIVE DIAGNOSIS MANNEQUIN for [TOPIC] targeting [AUDIENCE].

CONCEPT:
An interactive human body diagram where learners can click on anatomical regions to reveal:
- Physical exam findings
- Associated symptoms
- Differential diagnoses
- Red flag signs

TEMPLATE STRUCTURE:

1. BODY OUTLINE
   - Simple SVG silhouette of human body (anterior view)
   - Major regions clearly demarcated with hover effects
   - Clickable zones for: Head/Neck, Chest, Abdomen, Back, Extremities

2. REGIONAL PANELS (appear on click)
   Each region contains:
   - Inspection findings
   - Palpation findings
   - Percussion/Auscultation (if applicable)
   - Associated symptoms
   - Differential diagnosis list
   - Red flags to watch for

3. FINDINGS LEGEND
   - Color-coded severity indicators
   - Normal vs. Abnormal toggle
   - "Show All" mode

4. CASE MODE
   - Present a clinical scenario
   - Learner clicks regions to gather exam findings
   - Build differential based on findings
   - Reveal diagnosis at end

INTERACTIVITY:
- Hover: Region highlights with subtle glow
- Click: Opens side panel with detailed findings
- Toggle: Switch between normal and abnormal exam
- Progress: Track which regions have been examined
- Quiz Mode: "Find the abnormal finding" challenges

VISUAL DESIGN:
- Clean anatomical SVG (no external images)
- Color-coded hotspots:
  - Blue: Information available
  - Green: Normal finding
  - Yellow: Abnormal finding
  - Red: Critical finding
- Smooth panel transitions
- Mobile-responsive touch targets

SVG BODY REPRESENTATION:
Use simplified CSS/SVG shapes - DO NOT use external images:
- Head: Circle
- Torso: Rounded rectangle
- Arms/Legs: Rounded rectangles
- Joints: Small circles

TARGET DURATION: [DURATION]
`;

export const template: Template = {
  meta: {
    id: 'diagnosis-mannequin',
    name: 'Diagnosis Mannequin',
    icon: '🧍',
    category: 'new-formats',
    description: 'Interactive body diagram with clickable exam regions',
    previewThumbnail: '/templates/new-formats/diagnosis-mannequin/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    estimatedSlides: 1,
    tags: ['physical-exam', 'interactive', 'anatomy', 'clinical-skills'],
  },
  promptAugment: DIAGNOSIS_MANNEQUIN_PROMPT_AUGMENT,
};

export default template;

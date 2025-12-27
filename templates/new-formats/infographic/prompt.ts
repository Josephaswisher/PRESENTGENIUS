/**
 * Medical Infographic Template
 * Single-page visual summary with key statistics and icons
 */

import { Template } from '../../types';

export const INFOGRAPHIC_PROMPT_AUGMENT = `
CREATE A MEDICAL INFOGRAPHIC about [TOPIC] for [AUDIENCE].

TEMPLATE STRUCTURE:
- Title: Large, attention-grabbing headline
- Key Statistics: 3-5 impactful numbers with icons/emojis
- Visual Flow: Top-to-bottom or left-to-right progression
- Sections: Definition, Epidemiology, Risk Factors, Clinical Features, Management
- Call to Action: Key takeaway or clinical pearl at bottom

DESIGN REQUIREMENTS:
- Single-page, poster-style layout (vertical orientation preferred)
- Heavy use of icons and visual elements (CSS shapes, SVG, Emoji)
- Minimal text - favor bullet points and numbers
- High contrast for readability
- Color-coded sections by importance:
  - Red: Critical/Emergency
  - Yellow: Warning/Caution
  - Green: Management/Treatment
  - Blue: Information/Diagnosis
- Mobile-friendly scaling
- Print-optimized (white background option)

VISUAL ELEMENTS TO INCLUDE:
- Icon badges for each section header
- Progress bars or meters for statistics
- Color-coded severity indicators
- Arrow flows between related concepts
- Bordered highlight boxes for key facts

LAYOUT STRUCTURE:
1. Header section (20%): Title + Key stat
2. Body sections (60%): 3-4 content blocks
3. Footer (20%): Summary + References

TARGET DURATION: Quick reference ([DURATION] read time)
OUTPUT: Self-contained HTML with embedded Tailwind styles.
`;

export const template: Template = {
  meta: {
    id: 'infographic',
    name: 'Medical Infographic',
    icon: '📊',
    category: 'new-formats',
    description: 'Visual single-page summary with key statistics and icons',
    previewThumbnail: '/templates/new-formats/infographic/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    estimatedSlides: 1,
    tags: ['visual', 'quick-reference', 'printable', 'infographic'],
  },
  promptAugment: INFOGRAPHIC_PROMPT_AUGMENT,
};

export default template;

/**
 * Chief Complaint Approach Template
 * Algorithmic symptom workup
 */

import { Template } from '../../types';

export const CHIEF_COMPLAINT_PROMPT_AUGMENT = `
CREATE A CHIEF COMPLAINT APPROACH ALGORITHM for [TOPIC] targeting [AUDIENCE].

CONCEPT:
A systematic, algorithmic approach to evaluating a presenting symptom/complaint.
Think: "How would you work up [CHIEF COMPLAINT] in the ED/clinic?"

TEMPLATE STRUCTURE:

1. CHIEF COMPLAINT HEADER
   - Symptom name with emoji icon
   - "Approach to: [Symptom]"
   - Estimated encounter time

2. INITIAL ASSESSMENT (TRIAGE)
   - Vital sign considerations
   - Immediate red flags requiring emergent action
   - Stability assessment

3. HISTORY FRAMEWORK
   - OPQRST or similar mnemonic
   - Key questions to ask
   - Associated symptoms checklist
   - Risk factor assessment

4. PHYSICAL EXAM FOCUS
   - Targeted exam components
   - Signs to look for
   - Maneuvers and their interpretation

5. DIFFERENTIAL DIAGNOSIS
   - Must-Not-Miss diagnoses (in red)
   - Common diagnoses (in green)
   - Less likely but important (in yellow)
   - Organized by system or mechanism

6. DIAGNOSTIC WORKUP
   - First-line tests
   - Second-line tests (based on findings)
   - Imaging decision tree
   - When to consult

7. DISPOSITION DECISION
   - Admit criteria
   - Observation criteria
   - Safe discharge criteria
   - Follow-up recommendations

INTERACTIVITY:
- Expandable sections with + / - toggles
- Clickable differential items that reveal details
- "Red Flag Alert" popups
- Flowchart navigation
- Print-friendly checklist mode

VISUAL DESIGN:
- Clean algorithm/flowchart aesthetic
- Clear decision branch points
- Color-coded urgency levels
- Icon badges for each section
- Mobile-optimized accordion layout

FLOW REPRESENTATION:
Use CSS flexbox/grid for algorithm steps:
┌─────────────────┐
│  Chief Complaint │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Stable?        │──No──► Resuscitate
└────────┬────────┘
        Yes
         ▼
┌─────────────────┐
│  History/Exam   │
└────────┬────────┘
         ▼
    [Differential]
         ▼
    [Workup]
         ▼
    [Disposition]

TARGET DURATION: [DURATION]
`;

export const template: Template = {
  meta: {
    id: 'chief-complaint-approach',
    name: 'Chief Complaint Approach',
    icon: '🩺',
    category: 'new-formats',
    description: 'Algorithmic symptom workup with differential and management',
    previewThumbnail: '/templates/new-formats/chief-complaint-approach/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    estimatedSlides: 1,
    tags: ['algorithm', 'differential', 'workup', 'emergency', 'clinical-reasoning'],
  },
  promptAugment: CHIEF_COMPLAINT_PROMPT_AUGMENT,
};

export default template;

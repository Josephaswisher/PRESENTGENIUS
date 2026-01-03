/**
 * Interactive Drug Dosing Calculator Template
 * Real-time dosing calculator with weight-based, renal adjustment, and pediatric dosing
 */

import { Template } from '../../types';

export const DRUG_DOSING_PROMPT_AUGMENT = `
Generate an interactive real-time drug dosing calculator about [TOPIC] for [AUDIENCE].

STRUCTURE:
1. Medication selection dropdown (minimum 8 common medications)
2. Patient parameter sliders:
   - Weight (kg) with real-time updates
   - Age group toggle (Pediatric vs Adult)
   - Creatinine clearance (CrCl) for renal dosing
   - Age slider (for pediatric calculations when needed)
3. Real-time calculated dose display with:
   - Recommended dose based on weight and parameters
   - Dosing frequency (Q6H, Q8H, Q12H, etc.)
   - Maximum daily dose with safety limits
   - Route of administration (PO, IV, SubQ, etc.)
4. Visual therapeutic window indicator showing safe/borderline/toxic zones
5. Dynamic safety warnings that appear when dose exceeds limits
6. Clinical considerations section with:
   - Medication indications
   - Contraindications and warnings
   - Monitoring parameters required

MEDICATIONS TO INCLUDE (minimum 8):
- Acetaminophen (Tylenol) - pain/fever
- Amoxicillin - bacterial infections
- Vancomycin - MRSA and serious gram-positive infections
- Gentamicin - gram-negative infections
- Warfarin (Coumadin) - anticoagulation
- Enoxaparin (Lovenox) - DVT/PE prevention and treatment
- Morphine - pain management
- Digoxin - heart failure and atrial fibrillation

DOSING PARAMETERS FOR EACH MEDICATION:
- Pediatric dose (mg/kg/dose)
- Adult dose (mg/dose or mg/kg for weight-based drugs)
- Dosing frequency with standard intervals
- Maximum daily dose (separate for pediatric and adult)
- Renal adjustment requirements (yes/no)
- Safe therapeutic range limits
- Borderline dose threshold
- Toxic dose threshold

INTERACTIVE FEATURES:
- Smooth slider interactions with instant recalculation
- Real-time number displays that update as sliders move
- Toggle between pediatric and adult calculation modes
- Medication dropdown that changes all parameters instantly
- Visual indicator arrow that moves along therapeutic window
- Print/export button to generate dosing reference card
- Hover states and transitions on all interactive elements

VISUAL ELEMENTS:
- Gradient background indicator showing safe (green) → borderline (yellow) → toxic (red) zones
- Moving arrow/indicator showing where current calculated dose falls in the range
- Color-coded safety badges (green ✓ SAFE, yellow ⚠ BORDERLINE, red 🚨 TOXIC)
- Animated slider thumbs with purple/pink gradient and glow effects
- Real-time updating numbers with smooth transitions
- Large, readable dose displays (3xl font for main dose)

SAFETY FEATURES:
- Automatic warning alerts when calculated dose exceeds safe maximum
- Prominent red warning box with pulsing alert icon for toxic doses
- Renal adjustment notifications when CrCl is low (<30 or <60 mL/min)
- Clear text explaining why dose was adjusted
- Different calculations automatically applied for pediatric vs adult patients
- Maximum dose limits strictly enforced with visual feedback
- Visual red zone highlighting in therapeutic window for dangerous doses

CALCULATION LOGIC:
- Weight-based dosing: dose = mg/kg × weight
- Renal adjustments:
  - CrCl <30 mL/min: reduce dose by 50%
  - CrCl 30-60 mL/min: reduce dose by 25%
- Frequency multipliers for daily dose calculation:
  - Q6H = 4 doses/day
  - Q8H = 3 doses/day
  - Q12H = 2 doses/day
  - Q24H = 1 dose/day
- Safety assessment: compare daily dose vs maximum daily dose
- Therapeutic window position: (daily dose / borderline max) × 100%

CLINICAL INFORMATION TO INCLUDE:
For each medication provide:
- Primary indications with specific conditions
- Key contraindications and warnings
- Required monitoring parameters (labs, vitals, clinical signs)
- Route of administration options
- Special considerations (pregnancy, liver disease, etc.)

RESPONSIVE DESIGN:
- Grid layout: 1 column on mobile, 3 columns on desktop
- Left panel (1 column): medication selection and patient parameters
- Right panel (2 columns): calculated results, therapeutic window, clinical info
- Sliders work smoothly on both mouse and touch devices
- Large touch targets for mobile usability
- Readable font sizes on all screen sizes

STYLE REQUIREMENTS:
- Purple/pink gradient medical theme throughout
- Dark slate background (slate-900 with purple tints)
- Glassmorphism cards with backdrop blur
- Smooth transitions on all state changes (300ms duration)
- Glowing slider thumbs with box-shadow effects
- Professional clinical appearance suitable for medical education
- Clean, modern aesthetic with clear visual hierarchy

EDUCATIONAL VALUE:
- Demonstrates relationship between patient weight and medication dose
- Shows real-world impact of renal function on dosing
- Highlights differences between pediatric and adult dosing
- Emphasizes importance of staying within safe therapeutic ranges
- Teaches maximum dose limits and toxic thresholds
- Provides clinical context with indications and monitoring
- Reinforces pharmacokinetic and pharmacodynamic principles

PRINT FUNCTIONALITY:
- Print button generates a dosing reference card
- Card includes: patient parameters, calculated dose, frequency, max dose
- Clinical information and safety warnings included
- Formatted for standard printer output
- Uses @media print CSS for optimized layout

TARGET DURATION: [DURATION]
COMPLEXITY LEVEL: Interactive calculator suitable for [AUDIENCE]

EXAMPLE MEDICATIONS DATABASE STRUCTURE:
{
  acetaminophen: {
    name: 'Acetaminophen (Tylenol)',
    route: 'Oral',
    pediatricDose: 15,     // mg/kg/dose
    adultDose: 1000,       // mg/dose
    frequency: 'Q6H',
    maxDailyPediatric: 75, // mg/kg/day
    maxDailyAdult: 4000,   // mg/day
    renalAdjust: false,
    indication: 'Pain relief and fever reduction',
    contraindications: 'Severe hepatic impairment, hypersensitivity',
    monitoring: 'LFTs with chronic use, pain/fever assessment',
    safeMax: 4000,
    borderlineMax: 6000
  }
  // ... more medications
}

MUST IMPLEMENT:
- All JavaScript must be inline and fully functional
- Real-time recalculation on every slider movement
- Accurate dosing formulas with proper rounding
- Renal adjustment logic that activates automatically
- Visual feedback for all safety zones
- Smooth animations and transitions
- Mobile-responsive touch-friendly controls
- Professional medical accuracy in all dosing information
`;

export const template: Template = {
  meta: {
    id: 'drug-dosing',
    name: 'Drug Dosing Calculator',
    icon: '💊',
    category: 'interactive',
    description: 'Real-time interactive medication dosing calculator with weight-based calculations, renal adjustments, and safety warnings',
    previewThumbnail: '/templates/interactive/drug-dosing/preview.svg',
    supportedVariables: ['TOPIC', 'AUDIENCE', 'DURATION'],
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow', 'Attending'],
    estimatedSlides: 1,
    tags: ['pharmacology', 'dosing', 'interactive', 'calculator', 'safety', 'pediatrics', 'renal'],
  },
  promptAugment: DRUG_DOSING_PROMPT_AUGMENT,
};

export default template;

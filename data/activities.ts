/**
 * VibePresenterPro Activity Library
 * Dr. Joseph Swisher's GME/UME Activity Framework v3.2
 * 50+ Interactive Activities for Medical Education
 */

// Import template prompt augmentations
import { BOARD_MCQ_PROMPT_AUGMENT } from '../templates/board-mcq';
import { CLINICAL_TF_PROMPT_AUGMENT } from '../templates/clinical-tf';
import { DECISION_TREE_PROMPT_AUGMENT } from '../templates/decision-tree';
import { JEOPARDY_PROMPT_AUGMENT } from '../templates/jeopardy';
import { VISUAL_DIAGNOSIS_PROMPT_AUGMENT } from '../templates/visual-diagnosis';

export type LearnerLevel = 'MS3-4' | 'PGY1' | 'PGY2-3' | 'Fellow';
export type ActivityTier = 'core' | 'gamification' | 'diagnostic' | 'simulation' | 'metacognition' | 'team' | 'narrative' | 'creative';

export interface Activity {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: ActivityTier;
  learnerLevels: LearnerLevel[];
  systemPromptAugment: string;
}

// ============================================================
// TIER 1: CORE CLINICAL REASONING ACTIVITIES
// ============================================================

export const ACTIVITIES: Activity[] = [
  // --- CORE CLINICAL REASONING ---
  {
    id: 'board-mcq',
    name: 'Board-Style MCQ',
    icon: '🅰️',
    description: 'USMLE-format vignette with 5 options and explanations',
    tier: 'core',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: BOARD_MCQ_PROMPT_AUGMENT
  },
  {
    id: 'clinical-tf',
    name: 'Clinical True/False',
    icon: '✅❌',
    description: 'Myth-busting statements with nuance reveal',
    tier: 'core',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: CLINICAL_TF_PROMPT_AUGMENT
  },
  {
    id: 'diagnosis-match',
    name: 'Diagnosis-Management Match',
    icon: '🔗',
    description: 'Match clinical scenarios to appropriate management',
    tier: 'core',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A DIAGNOSIS-MANAGEMENT MATCHING EXERCISE:

TEMPLATE STRUCTURE:
- Prompt: "Match each clinical scenario with the MOST appropriate initial management"
- Scenarios: 4-5 vignettes with subtle differentiating features (left column)
- Management Options: 5-6 options including distractors that look similar (right column)
- Key Differentiators: What feature in each vignette drives the management choice

DESIGN:
- Two-column layout with drag-and-drop OR click-select matching
- Left: scenario cards with case details (numbered)
- Right: management options (lettered)
- On reveal: show connection lines with the KEY DIFFERENTIATING FEATURE highlighted
- Include scenarios that look similar but require different management
- Add one 'trick' scenario where the obvious match is wrong
`
  },
  {
    id: 'multi-step-case',
    name: 'Multi-Step Case Decision',
    icon: '🏥',
    description: 'Branching clinical decisions with consequences',
    tier: 'core',
    learnerLevels: ['PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: DECISION_TREE_PROMPT_AUGMENT
  },
  {
    id: 'visual-diagnosis',
    name: 'Visual Diagnosis Challenge',
    icon: '🖼️',
    description: 'Image-based diagnosis with annotated reveals',
    tier: 'core',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: VISUAL_DIAGNOSIS_PROMPT_AUGMENT
  },
  {
    id: 'practice-poll',
    name: 'Practice Pattern Poll',
    icon: '📊',
    description: 'Gray-zone scenarios where practice varies',
    tier: 'core',
    learnerLevels: ['PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A PRACTICE PATTERN POLL:

TEMPLATE STRUCTURE:
- Scenario: Gray-zone clinical situation with legitimate debate
- Question: "How would YOU manage this patient?"
- Options: 3-4 defensible approaches
- Evidence For Each: What supports each approach
- Discussion Points: Why practice varies, how to decide

DESIGN:
- Present scenario prominently
- Anonymous polling style - show percentage bars for each option
- No right/wrong judgment initially
- After selection, show distribution (simulated) and discuss evidence for each approach
- Normalize that intelligent clinicians disagree
- Choose genuinely controversial topics: antibiotic duration debates, imaging thresholds, goals-of-care triggers
`
  },

  // --- GAMIFICATION & COMPETITION ---
  {
    id: 'board-jeopardy',
    name: 'Board Review Jeopardy',
    icon: '🏆',
    description: '5x5 grid with category-based clinical questions',
    tier: 'gamification',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: JEOPARDY_PROMPT_AUGMENT
  },
  {
    id: 'lightning-round',
    name: 'Lightning Round Drill',
    icon: '⚡',
    description: '15-20 rapid-fire questions with timer',
    tier: 'gamification',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A LIGHTNING ROUND DRILL:

TEMPLATE STRUCTURE:
- Format: 15-20 rapid questions, 10-15 seconds each
- Content: Quick clinical decisions: 'Next step? First-line? When to worry?'
- Pressure: Timer visible, points for speed AND accuracy
- Review: Rapid debrief of commonly missed questions at end

DESIGN:
- Full-screen question display
- Prominent countdown timer (circular or bar)
- 4 answer options as large tap-friendly buttons
- Immediate feedback (green flash/red flash)
- Running score and streak counter
- Question counter (Q 5/20)
- Speed bonus for fast correct answers
`
  },
  {
    id: 'pathway-race',
    name: 'Clinical Pathway Race',
    icon: '🏃',
    description: 'Team competition navigating clinical pathways',
    tier: 'gamification',
    learnerLevels: ['PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A CLINICAL PATHWAY RACE:

TEMPLATE STRUCTURE:
- Setup: Two teams (or solo), same case presented
- Competition: Navigate clinical pathway correctly and quickly
- Questions: Sequential clinical decision points
- Checkpoints: Key decision points where wrong answer costs time penalty

DESIGN:
- Split screen or single player mode
- Pathway visualization showing progress
- Decision nodes with multiple options
- Time penalty for wrong choices (shown visually)
- Final score based on time + correct decisions
- Leaderboard display at end
`
  },

  // --- DIAGNOSTIC REASONING ---
  {
    id: 'build-differential',
    name: 'Build the Differential',
    icon: '🧩',
    description: 'Sort diagnoses into must-not-miss, likely, and unlikely',
    tier: 'diagnostic',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A BUILD-THE-DIFFERENTIAL EXERCISE:

TEMPLATE STRUCTURE:
- Presentation: Chief complaint + key history/exam features
- Diagnosis Pool: 10-12 conditions including must-not-miss, common, and zebras
- Categories: Must-Not-Miss | Most Likely | Less Likely | Unlikely
- Key Teaching: What features make diagnoses more/less likely

DESIGN:
- Three-column layout for categories
- Drag-and-drop diagnoses into appropriate columns
- Diagnosis cards show condition name
- On reveal: show optimal sorting with explanations
- Highlight which clinical features drove likelihood
- Color code: Red (must-not-miss), Green (most likely), Yellow (less likely), Gray (unlikely)
`
  },
  {
    id: 'illness-script',
    name: 'Illness Script Comparison',
    icon: '📋',
    description: 'Match patient features to diagnosis scripts',
    tier: 'diagnostic',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE AN ILLNESS SCRIPT COMPARISON:

TEMPLATE STRUCTURE:
- Patient Features: Demographics, presentation, timeline, exam, labs
- Candidate Diagnoses: 3-4 conditions to compare
- Script Elements: Epidemiology, pathophys, time course, key features for each
- Best Match: Which script best fits this patient and why

DESIGN:
- Patient summary card at top
- Comparison table with diagnosis columns
- Script elements as rows (epidemiology, onset, key features, labs, etc.)
- Highlight matching/mismatching features
- Interactive selection of best match with reasoning
`
  },
  {
    id: 'progressive-disclosure',
    name: 'Progressive Case Disclosure',
    icon: '🔬',
    description: 'Reveal case data in stages',
    tier: 'diagnostic',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A PROGRESSIVE CASE DISCLOSURE:

TEMPLATE STRUCTURE:
- Initial Info: Chief complaint, vitals only
- History Stage: Add HPI, PMH, meds, social
- Exam Stage: Physical exam findings
- Labs Stage: Initial laboratory data
- Imaging Stage: Imaging results
- Diagnosis: Final answer

DESIGN:
- Accordion-style reveal with "Next" buttons
- Each stage has a differential input before revealing more
- Track how differential changes with new information
- Final reveal shows correct diagnosis and optimal reasoning path
- "Pause and think" prompts at each stage
`
  },

  // --- CLINICAL SIMULATION ---
  {
    id: 'rapid-response',
    name: 'Rapid Response / Code Sim',
    icon: '🚨',
    description: 'Acute decompensation with prioritized actions',
    tier: 'simulation',
    learnerLevels: ['PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A RAPID RESPONSE SIMULATION:

TEMPLATE STRUCTURE:
- Setup: Patient acutely decompensating - vitals, presentation
- Question: "What is your FIRST action?" then sequence of priorities
- Correct Sequence: Prioritized ACLS/rapid response approach
- Team Roles: If team-based: assign leader, airway, access, recorder
- Debrief: What was done well, what to improve

DESIGN:
- Critical vitals display (flashing if abnormal)
- Action buttons: Airway, Breathing, Circulation, Drugs, Defibrillator
- Real-time response to choices (vitals change)
- Timer running
- ACLS algorithm reference available
- Red/critical color scheme
`
  },
  {
    id: 'order-set-builder',
    name: 'Admission Order Set Builder',
    icon: '📋',
    description: 'Build appropriate admission orders',
    tier: 'simulation',
    learnerLevels: ['PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE AN ADMISSION ORDER SET BUILDER:

TEMPLATE STRUCTURE:
- Admission Diagnosis: Condition requiring admission
- Order Categories: Diet, Activity, Nursing, Labs, Meds, Consults, etc.
- Order Options: Correct orders mixed with unnecessary/wrong options
- Must-Have Orders: Critical elements that must be included
- Avoid Orders: Contraindicated or unnecessary for this patient

DESIGN:
- Order entry interface (checkboxes/selections)
- Categories as tabs or sections
- Drag to reorder priorities
- Submit to check against optimal order set
- Highlight missing critical orders, unnecessary orders, contraindicated orders
`
  },
  {
    id: 'sbar-handoff',
    name: 'SBAR Handoff Builder',
    icon: '📞',
    description: 'Practice sign-out communication',
    tier: 'simulation',
    learnerLevels: ['PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE AN SBAR HANDOFF EXERCISE:

TEMPLATE STRUCTURE:
- Patient Data: Scattered information from the day - events, labs, plans
- SBAR Structure: Situation, Background, Assessment, Recommendation
- Critical Elements: What MUST be communicated for safe handoff
- Contingencies: If-then statements for overnight

DESIGN:
- Scattered "notes" from the day that user must organize
- SBAR template to fill in
- Drag-and-drop or type entries
- Check against ideal handoff
- Highlight missing critical information
- Include "what if" contingency planning
`
  },

  // --- METACOGNITION & CONFIDENCE ---
  {
    id: 'confidence-calibration',
    name: 'Confidence Calibration',
    icon: '📏',
    description: 'Rate confidence and track calibration',
    tier: 'metacognition',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A CONFIDENCE CALIBRATION EXERCISE:

TEMPLATE STRUCTURE:
- Question: Clinical knowledge or decision question
- Answer Input: User's response (MCQ or free text)
- Confidence Rating: 0-100% slider BEFORE seeing answer
- Calibration Feedback: Show correlation between confidence and accuracy

DESIGN:
- Question with answer options
- Prominent confidence slider (0-100%)
- Must set confidence before submitting
- Track cumulative calibration across questions
- Show calibration curve at end (overconfident/underconfident/well-calibrated)
- "Knowing what you don't know is wisdom"
`
  },
  {
    id: 'idk-option',
    name: 'The "I Don\'t Know" Option',
    icon: '🤷',
    description: 'Explicit uncertainty acknowledgment',
    tier: 'metacognition',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE AN "I DON'T KNOW YET" EXERCISE:

TEMPLATE STRUCTURE:
- Question: Knowledge question with clear answer
- Options: A, B, C, D, and explicit "I Don't Know Yet"
- Scoring: Correct: +2, IDK: 0, Wrong: -1
- Message: Knowing your limits is wisdom, not weakness

DESIGN:
- Standard MCQ layout
- "I Don't Know Yet" as a prominent fifth option (different color)
- Scoring explanation visible
- Track when IDK is chosen vs wrong guesses
- Reinforce that IDK is better than wrong guess
- Show cumulative score emphasizing penalty for wrong vs IDK
`
  },
  {
    id: 'pre-post-growth',
    name: 'Pre/Post Growth Assessment',
    icon: '📈',
    description: 'Measure learning with before/after comparison',
    tier: 'metacognition',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A PRE/POST GROWTH ASSESSMENT:

TEMPLATE STRUCTURE:
- Questions: 5-10 questions assessed BEFORE AND AFTER content
- Pre-Test: Baseline assessment - not graded, just measurement
- Post-Test: Same questions after learning
- Growth Display: Visual comparison of improvement

DESIGN:
- Pre-test phase with questions (no feedback yet)
- Content/learning section in middle
- Post-test with same questions
- Side-by-side comparison showing improvement
- Growth percentage and visual bar charts
- Celebrate improvement
`
  },

  // --- TEAM-BASED LEARNING ---
  {
    id: 'think-pair-share',
    name: 'Think-Pair-Share',
    icon: '🤔',
    description: 'Individual reflection then discussion',
    tier: 'team',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A THINK-PAIR-SHARE ACTIVITY:

TEMPLATE STRUCTURE:
- Prompt: Open-ended clinical question requiring reasoning
- Think (1-2 min): Individual reflection - 'What's your approach?'
- Pair (2-3 min): Discuss with neighbor - compare approaches
- Share: Pairs report key insights to group

DESIGN:
- Phase 1: Individual response input with timer
- Phase 2: "Discussion prompt" screen with timer
- Phase 3: Group sharing/reveal of key insights
- Timer visible for each phase
- Discussion prompts to guide pair conversation
`
  },
  {
    id: 'devils-advocate',
    name: 'Devil\'s Advocate',
    icon: '😈',
    description: 'Argue the opposite position',
    tier: 'team',
    learnerLevels: ['PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A DEVIL'S ADVOCATE EXERCISE:

TEMPLATE STRUCTURE:
- Position A: One clinical approach (presented first)
- Position B: Alternative approach
- Task: "Argue for the position you DIDN'T initially choose"
- Synthesis: When each approach is appropriate

DESIGN:
- Present two positions clearly
- User selects their initial preference
- Challenge: "Now defend the OTHER position"
- Text input for their counter-argument
- Reveal: Discussion of when each is appropriate
- Encourage seeing both sides of clinical debates
`
  },
  {
    id: 'perspective-shift',
    name: 'Perspective Shift',
    icon: '👀',
    description: 'View case from multiple stakeholder perspectives',
    tier: 'team',
    learnerLevels: ['PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A PERSPECTIVE SHIFT EXERCISE:

TEMPLATE STRUCTURE:
- Scenario: Clinical situation with multiple stakeholders
- Perspectives: Patient, family, nurse, attending, consultant, social work
- Task: Articulate each stakeholder's concerns/priorities
- Integration: How understanding all views changes approach

DESIGN:
- Central scenario card
- Stakeholder avatars/icons around it
- Click each to consider their perspective
- Input field for each perspective's concerns
- Reveal: How comprehensive care integrates all views
- Empathy-building through role consideration
`
  },

  // --- NARRATIVE & STORYTELLING ---
  {
    id: 'choose-adventure',
    name: 'Choose Your Own Adventure Case',
    icon: '🛤️',
    description: 'Branching narrative with outcomes',
    tier: 'narrative',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A CHOOSE YOUR OWN ADVENTURE CASE:

TEMPLATE STRUCTURE:
- Opening: Patient presents - initial scenario
- Branch Points: 3-5 decision points throughout case
- Pathways: Different outcomes based on choices
- Optimal Path: Best sequence with reasoning
- Learning from Suboptimal: Teaching points from wrong turns

DESIGN:
- Story-style narrative presentation
- Clear choice buttons at each decision point
- Visual pathway map showing where you are
- Multiple endings (good, okay, poor outcomes)
- Ability to "go back" and try different path
- Debrief showing all pathways and optimal route
`
  },
  {
    id: 'bounce-back',
    name: 'The Bounce-Back',
    icon: '😢',
    description: 'Learn from complications and returns',
    tier: 'narrative',
    learnerLevels: ['PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A BOUNCE-BACK CASE ANALYSIS:

TEMPLATE STRUCTURE:
- Initial Visit: First encounter - patient discharged
- Return Visit: Patient returns, worse
- Analysis: "What did we miss? What could have been different?"
- System & Individual: Both cognitive and process factors

DESIGN:
- Timeline showing initial visit → discharge → return
- Interactive analysis of each decision point
- Identify what was missed (hindsight analysis)
- Distinguish cognitive errors vs system issues
- Non-punitive tone - learning from complications
- "What would you do differently?" reflection
`
  },
  {
    id: 'detective-mode',
    name: 'Detective Mode',
    icon: '🔍',
    description: 'Diagnose with minimum necessary workup',
    tier: 'narrative',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A DETECTIVE MODE DIAGNOSIS GAME:

TEMPLATE STRUCTURE:
- Starting Info: Minimal initial data (chief complaint, vitals)
- Available Clues: Tests/history elements available to 'unlock'
- Goal: Diagnose with minimum necessary workup
- Efficiency Score: Points deducted for unnecessary tests

DESIGN:
- "Clue board" with clickable tests/history items
- Each test "costs" points
- Reveal information when clicked
- Running cost tracker
- Final score based on correct diagnosis with fewest tests
- Optimal path revealed at end
- Teaches efficient diagnostic reasoning
`
  },

  // --- CREATIVE & ADVANCED ---
  {
    id: 'headline-writing',
    name: 'Headline Writing',
    icon: '📰',
    description: 'Risk communication through worst-case framing',
    tier: 'creative',
    learnerLevels: ['PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A HEADLINE WRITING EXERCISE:

TEMPLATE STRUCTURE:
- Scenario: High-risk clinical situation
- Task: "Write the headline if this goes wrong"
- Examples: Powerful headlines that capture the risk
- Discussion: How do we prevent this headline?

DESIGN:
- Present high-stakes scenario
- Text input for user's "headline"
- Show example powerful headlines
- Discuss what actions prevent bad outcomes
- Risk communication training through dramatic framing
- Professional liability awareness
`
  },
  {
    id: 'teach-back',
    name: 'Teach-Back Challenge',
    icon: '🎤',
    description: 'Explain complex concepts simply',
    tier: 'creative',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A TEACH-BACK CHALLENGE:

TEMPLATE STRUCTURE:
- Concept: Complex medical concept
- Audience: "Explain to a patient" or "Explain to a medical student"
- Constraints: Time limit, no jargon, must include key point X
- Evaluation: Was it clear, accurate, appropriate?

DESIGN:
- Present the concept to explain
- Target audience shown
- Text/voice input for explanation
- Timer for constraint
- Checklist of key elements to include
- Feedback on clarity and completeness
- Example model explanation shown after
`
  },
  {
    id: 'consult-text',
    name: 'Consult Text Challenge',
    icon: '📱',
    description: 'Efficient consultation communication',
    tier: 'creative',
    learnerLevels: ['PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A CONSULT TEXT CHALLENGE:

TEMPLATE STRUCTURE:
- Case: Patient requiring subspecialty consultation
- Constraint: 280 character limit - like real pager/text
- Must Include: Patient ID, urgency, specific question, relevant data
- Model Consult: Example of efficient, complete consult text

DESIGN:
- Case details panel
- Character-limited text input (280 chars)
- Live character counter
- Checklist: urgency, one-liner, specific question, key data
- Submit and compare to model consult
- Feedback on what was missing or could be more concise
`
  },

  // --- ADDITIONAL CORE ACTIVITIES ---
  {
    id: 'spot-mimic',
    name: 'Spot the Mimic',
    icon: '🎭',
    description: 'Identify the imposter diagnosis among similar presentations',
    tier: 'diagnostic',
    learnerLevels: ['MS3-4', 'PGY1', 'PGY2-3'],
    systemPromptAugment: `
CREATE A SPOT THE MIMIC EXERCISE:

TEMPLATE STRUCTURE:
- Target Diagnosis: The condition being discussed
- Case Presentations: 4-5 vignettes - most are target, ONE is a mimic
- The Imposter: Which case is actually something else
- Distinguishing Features: Red flags that identify the mimic

DESIGN:
- Present the target diagnosis being tested
- Show 4-5 case cards
- User selects which one is the "imposter"
- Reveal with explanation of distinguishing features
- Teaches pattern recognition AND pattern-breaking
`
  },
  {
    id: 'same-different',
    name: 'Same or Different?',
    icon: '⚖️',
    description: 'Compare similar cases for management differences',
    tier: 'diagnostic',
    learnerLevels: ['PGY1', 'PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A SAME OR DIFFERENT EXERCISE:

TEMPLATE STRUCTURE:
- Case A: Clinical scenario
- Case B: Similar-appearing scenario with subtle difference
- Question: "Same management or different?"
- Key Differentiator: The feature that changes management

DESIGN:
- Side-by-side case comparison
- Highlight subtle differences
- SAME / DIFFERENT buttons
- Reveal the key differentiating feature
- Explain why management changes (or doesn't)
- Tests nuanced clinical decision-making
`
  },
  {
    id: 'unifying-diagnosis',
    name: 'Find the Unifying Diagnosis',
    icon: '👯',
    description: 'Link different presentations to one condition',
    tier: 'diagnostic',
    learnerLevels: ['PGY2-3', 'Fellow'],
    systemPromptAugment: `
CREATE A UNIFYING DIAGNOSIS PUZZLE:

TEMPLATE STRUCTURE:
- Cases: 3-4 different presentations - different chief complaints
- Common Thread: Unifying diagnosis or mechanism
- Classic Feature: What links them together

DESIGN:
- Present multiple seemingly unrelated cases
- "What do these have in common?" prompt
- Input field for unifying diagnosis
- Reveal the connection and underlying pathophysiology
- Teaches pattern recognition across presentations
- System-based thinking
`
  },
];

// ============================================================
// LEARNER LEVEL DEFINITIONS
// ============================================================

export const LEARNER_LEVELS: { id: LearnerLevel; name: string; description: string; promptModifier: string }[] = [
  {
    id: 'MS3-4',
    name: 'Medical Student (MS3-4)',
    description: 'Clinical clerkship years, foundational clinical reasoning',
    promptModifier: `
CALIBRATE FOR MS3-4 LEVEL:
- Scaffold reasoning steps explicitly
- Include "next best step" questions
- Test pattern recognition with classic presentations
- Provide more context in vignettes
- Focus on common conditions and classic presentations
- Include educational explanations with answers
`
  },
  {
    id: 'PGY1',
    name: 'Intern (PGY1)',
    description: 'First year resident, acute management focus',
    promptModifier: `
CALIBRATE FOR PGY1/INTERN LEVEL:
- Emphasize acute management and triage
- Include "It's 2am, what do you do first?" scenarios
- Focus on order entry, escalation triggers, when to call for help
- Include cognitive load under stress
- Test prioritization and time management
- Practical ward scenarios
`
  },
  {
    id: 'PGY2-3',
    name: 'Senior Resident (PGY2-3)',
    description: 'Gray-zone cases and supervisory decisions',
    promptModifier: `
CALIBRATE FOR PGY2-3/SENIOR LEVEL:
- Gray-zone cases where "it depends"
- Add supervisory decision points
- Include teach-back moments
- Test nuanced clinical judgment
- Multiple reasonable approaches to discuss
- Leadership and team communication
`
  },
  {
    id: 'Fellow',
    name: 'Fellow',
    description: 'Literature critique, evidence assessment, rare presentations',
    promptModifier: `
CALIBRATE FOR FELLOW LEVEL:
- Literature critique and guideline debates
- Rare presentations and zebras
- Evidence strength assessment
- "What does the latest evidence say?" questions
- Conflicting trial data analysis
- Subspecialty depth
`
  }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find(a => a.id === id);
}

export function getActivitiesByTier(tier: ActivityTier): Activity[] {
  return ACTIVITIES.filter(a => a.tier === tier);
}

export function getActivitiesForLevel(level: LearnerLevel): Activity[] {
  return ACTIVITIES.filter(a => a.learnerLevels.includes(level));
}

export function getLearnerLevelById(id: LearnerLevel) {
  return LEARNER_LEVELS.find(l => l.id === id);
}

// Activity tiers for UI organization
export const ACTIVITY_TIERS: { id: ActivityTier; name: string; icon: string; description: string }[] = [
  { id: 'core', name: 'Core Clinical Reasoning', icon: '🎯', description: 'Foundation activities for clinical decision-making' },
  { id: 'gamification', name: 'Gamification & Competition', icon: '🏆', description: 'High-energy review and team competitions' },
  { id: 'diagnostic', name: 'Diagnostic Reasoning', icon: '🔬', description: 'Build diagnostic thinking patterns' },
  { id: 'simulation', name: 'Clinical Simulation', icon: '🚨', description: 'Real-world workflows and emergencies' },
  { id: 'metacognition', name: 'Confidence & Metacognition', icon: '🧠', description: 'Calibrate confidence and self-assessment' },
  { id: 'team', name: 'Team-Based Learning', icon: '👥', description: 'Discussion, debate, and collaboration' },
  { id: 'narrative', name: 'Case Narrative', icon: '📖', description: 'Storytelling and memorable cases' },
  { id: 'creative', name: 'Creative & Advanced', icon: '💡', description: 'Novel approaches and communication skills' },
];

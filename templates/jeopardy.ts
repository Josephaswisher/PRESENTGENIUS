/**
 * Jeopardy Template - Board Review Jeopardy Format
 */

export const JEOPARDY_PROMPT_AUGMENT = `
CREATE A BOARD REVIEW JEOPARDY GAME:

TEMPLATE STRUCTURE:
- Grid: 5 categories x 5 questions (increasing difficulty)
- Categories: Diverse clinical topics relevant to specialty
- Point Values: 100, 200, 300, 400, 500 per column
- Format: Answer given, question must be asked

DESIGN:
- Classic Jeopardy grid layout
- Click to reveal question
- Timer for response (30 seconds)
- Running score tracker
- Daily Double randomly placed
- Final Jeopardy with wager option

CATEGORIES TO INCLUDE:
- Pathophysiology
- Pharmacology  
- Clinical Presentation
- Diagnostic Workup
- Management/Treatment

QUESTION DIFFICULTY:
- 100: Basic recall, definitions
- 200: Clinical application
- 300: Pattern recognition
- 400: Complex scenarios
- 500: Board-style vignettes
`;

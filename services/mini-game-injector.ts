/**
 * Mini-Game Injector Service
 * Automatically detects medical content and injects appropriate mini-games into presentations
 */

import { MINI_GAMES } from '../templates/mini-games';

export interface MiniGameDetectionResult {
  shouldInject: boolean;
  gameType: 'organ-placement' | 'symptom-matching' | 'drug-mechanism' | null;
  confidence: number;
  detectedTerms: string[];
}

/**
 * Analyze HTML content to detect which mini-game(s) would be appropriate
 */
export function detectMiniGameOpportunities(htmlContent: string): MiniGameDetectionResult[] {
  const results: MiniGameDetectionResult[] = [];
  const lowerContent = htmlContent.toLowerCase();

  // Organ Placement Detection
  const organTerms = [
    'heart', 'lung', 'liver', 'kidney', 'stomach', 'brain', 'pancreas', 'spleen',
    'anatomy', 'organ', 'body system', 'physiology', 'anatomical', 'cardiovascular',
    'respiratory', 'digestive', 'nervous system', 'gastrointestinal'
  ];
  const organMatches = organTerms.filter(term => lowerContent.includes(term));
  if (organMatches.length >= 2) {
    results.push({
      shouldInject: true,
      gameType: 'organ-placement',
      confidence: Math.min(organMatches.length / 5, 1),
      detectedTerms: organMatches
    });
  }

  // Symptom Matching Detection
  const symptomTerms = [
    'symptom', 'diagnosis', 'clinical presentation', 'patient presents', 'chief complaint',
    'differential diagnosis', 'signs and symptoms', 'vital signs', 'physical exam',
    'diagnostic criteria', 'clinical features', 'manifestation', 'complication'
  ];
  const symptomMatches = symptomTerms.filter(term => lowerContent.includes(term));
  if (symptomMatches.length >= 2) {
    results.push({
      shouldInject: true,
      gameType: 'symptom-matching',
      confidence: Math.min(symptomMatches.length / 5, 1),
      detectedTerms: symptomMatches
    });
  }

  // Drug Mechanism Detection
  const drugTerms = [
    'drug', 'medication', 'pharmacology', 'mechanism of action', 'therapeutic',
    'antibiotic', 'antihypertensive', 'analgesic', 'inhibitor', 'receptor',
    'pharmacokinetics', 'pharmacodynamics', 'adverse effect', 'contraindication',
    'dosage', 'prescription'
  ];
  const drugMatches = drugTerms.filter(term => lowerContent.includes(term));
  if (drugMatches.length >= 2) {
    results.push({
      shouldInject: true,
      gameType: 'drug-mechanism',
      confidence: Math.min(drugMatches.length / 5, 1),
      detectedTerms: drugMatches
    });
  }

  return results;
}

/**
 * Extract medical content from HTML to auto-generate game content
 */
export function extractMedicalContent(htmlContent: string, gameType: string): any {
  // This would use AI or parsing to extract specific content
  // For now, return a structure indicating what content was found
  const lowerContent = htmlContent.toLowerCase();

  if (gameType === 'organ-placement') {
    // Extract organ names and their locations mentioned in content
    const organMentions = {
      heart: lowerContent.includes('heart'),
      lungs: lowerContent.includes('lung'),
      liver: lowerContent.includes('liver'),
      kidneys: lowerContent.includes('kidney'),
      stomach: lowerContent.includes('stomach'),
      brain: lowerContent.includes('brain')
    };
    return { type: 'organ-placement', organs: organMentions };
  }

  if (gameType === 'symptom-matching') {
    // Would extract symptoms and diagnoses from content
    return { type: 'symptom-matching', symptoms: [], diagnoses: [] };
  }

  if (gameType === 'drug-mechanism') {
    // Would extract drug names and mechanisms from content
    return { type: 'drug-mechanism', drugs: [], mechanisms: [] };
  }

  return null;
}

/**
 * Inject mini-games into HTML presentation
 * Adds games as new slides at strategic positions
 */
export function injectMiniGames(
  htmlContent: string,
  options: {
    autoDetect?: boolean;
    specificGames?: Array<'organ-placement' | 'symptom-matching' | 'drug-mechanism'>;
    insertPosition?: 'end' | 'middle' | 'after-content';
  } = {}
): string {
  const { autoDetect = true, specificGames = [], insertPosition = 'end' } = options;

  let gamesToInject: string[] = [];

  // Auto-detect which games to inject
  if (autoDetect) {
    const detections = detectMiniGameOpportunities(htmlContent);
    const highConfidenceGames = detections
      .filter(d => d.confidence > 0.4)
      .sort((a, b) => b.confidence - a.confidence);

    for (const detection of highConfidenceGames) {
      if (detection.gameType === 'organ-placement') {
        gamesToInject.push(MINI_GAMES.ORGAN_PLACEMENT);
        console.log(`[Mini-Game Injector] Adding Organ Placement game (confidence: ${detection.confidence})`);
      } else if (detection.gameType === 'symptom-matching') {
        gamesToInject.push(MINI_GAMES.SYMPTOM_MATCHING);
        console.log(`[Mini-Game Injector] Adding Symptom Matching game (confidence: ${detection.confidence})`);
      } else if (detection.gameType === 'drug-mechanism') {
        gamesToInject.push(MINI_GAMES.DRUG_MECHANISM);
        console.log(`[Mini-Game Injector] Adding Drug Mechanism game (confidence: ${detection.confidence})`);
      }
    }
  }

  // Add specific games if requested
  for (const gameType of specificGames) {
    if (gameType === 'organ-placement') {
      gamesToInject.push(MINI_GAMES.ORGAN_PLACEMENT);
    } else if (gameType === 'symptom-matching') {
      gamesToInject.push(MINI_GAMES.SYMPTOM_MATCHING);
    } else if (gameType === 'drug-mechanism') {
      gamesToInject.push(MINI_GAMES.DRUG_MECHANISM);
    }
  }

  // No games to inject
  if (gamesToInject.length === 0) {
    console.log('[Mini-Game Injector] No mini-games detected or requested');
    return htmlContent;
  }

  // Find insertion point
  let modifiedHtml = htmlContent;
  const bodyCloseTag = '</body>';
  const bodyCloseIndex = modifiedHtml.lastIndexOf(bodyCloseTag);

  if (bodyCloseIndex === -1) {
    console.warn('[Mini-Game Injector] Could not find </body> tag, appending games to end');
    modifiedHtml += '\n' + gamesToInject.join('\n\n');
  } else {
    // Insert games before closing body tag
    const gamesHtml = '\n\n<!-- ========== INTERACTIVE MINI-GAMES ========== -->\n\n' +
                     gamesToInject.join('\n\n') +
                     '\n\n<!-- ========== END MINI-GAMES ========== -->\n\n';

    modifiedHtml = modifiedHtml.slice(0, bodyCloseIndex) +
                  gamesHtml +
                  modifiedHtml.slice(bodyCloseIndex);
  }

  console.log(`[Mini-Game Injector] Successfully injected ${gamesToInject.length} mini-game(s)`);
  return modifiedHtml;
}

/**
 * Get prompt augmentation for Claude to generate mini-games
 */
export function getMiniGamePromptAugment(detectedGames: MiniGameDetectionResult[]): string {
  if (detectedGames.length === 0) return '';

  const gameDescriptions = detectedGames
    .filter(d => d.shouldInject && d.confidence > 0.4)
    .map(d => {
      if (d.gameType === 'organ-placement') {
        return `- ORGAN PLACEMENT GAME: Interactive body diagram where learners drag organs (${d.detectedTerms.join(', ')}) to correct anatomical positions`;
      } else if (d.gameType === 'symptom-matching') {
        return `- SYMPTOM MATCHING GAME: Match clinical presentations to diagnoses (detected terms: ${d.detectedTerms.join(', ')})`;
      } else if (d.gameType === 'drug-mechanism') {
        return `- DRUG MECHANISM GAME: Match medications to their mechanisms of action (detected terms: ${d.detectedTerms.join(', ')})`;
      }
      return '';
    })
    .filter(d => d.length > 0);

  if (gameDescriptions.length === 0) return '';

  return `

INTERACTIVE MINI-GAMES DETECTED:
The content analysis suggests including the following interactive mini-games:

${gameDescriptions.join('\n')}

Please include these mini-games as dedicated slides using HTML5 drag-and-drop API with:
- Draggable items with ondragstart handlers
- Drop zones with ondrop and ondragover handlers
- Visual feedback (green for correct, red for incorrect)
- Score tracking and confetti celebration on completion
- Dark medical theme with vibrant gradients
- Full inline JavaScript (no external dependencies)
`;
}

/**
 * Validate that mini-game HTML is properly formed and functional
 */
export function validateMiniGameHtml(gameHtml: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required drag-drop attributes
  if (!gameHtml.includes('draggable="true"')) {
    errors.push('Missing draggable="true" attribute on game items');
  }
  if (!gameHtml.includes('ondragstart')) {
    errors.push('Missing ondragstart event handler');
  }
  if (!gameHtml.includes('ondrop')) {
    errors.push('Missing ondrop event handler');
  }
  if (!gameHtml.includes('ondragover')) {
    errors.push('Missing ondragover event handler');
  }

  // Check for score tracking
  if (!gameHtml.includes('score') && !gameHtml.includes('Score')) {
    warnings.push('No score tracking element found');
  }

  // Check for completion modal
  if (!gameHtml.includes('modal') && !gameHtml.includes('complete')) {
    warnings.push('No completion modal found');
  }

  // Check for confetti function
  if (!gameHtml.includes('confetti') && !gameHtml.includes('Confetti')) {
    warnings.push('No confetti celebration found');
  }

  // Check for inline JavaScript
  if (!gameHtml.includes('<script>')) {
    errors.push('Missing inline JavaScript - mini-game will not be functional');
  }

  // Check for visual feedback
  if (!gameHtml.includes('bg-green') && !gameHtml.includes('border-green')) {
    warnings.push('Missing green visual feedback for correct answers');
  }
  if (!gameHtml.includes('bg-red') && !gameHtml.includes('border-red')) {
    warnings.push('Missing red visual feedback for incorrect answers');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export detection function for use in other services
export { detectMiniGameOpportunities as detectGames };

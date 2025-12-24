/**
 * Knowledge State Tracking Service
 * Tracks user mastery of concepts to enable adaptive AI personalization.
 */

export interface KnowledgeState {
  concepts: Record<string, number>; // concept -> mastery score (0-100)
  recentTopics: string[];
  preferredDifficulty: 'novice' | 'intermediate' | 'expert';
}

const STORAGE_KEY = 'presentgenius_knowledge_state';

export const getKnowledgeState = (): KnowledgeState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load knowledge state', e);
  }
  return {
    concepts: {},
    recentTopics: [],
    preferredDifficulty: 'intermediate',
  };
};

export const updateKnowledgeState = (state: Partial<KnowledgeState>) => {
  const current = getKnowledgeState();
  const updated = { ...current, ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const trackConceptMastery = (concept: string, score: number) => {
  const state = getKnowledgeState();
  const currentScore = state.concepts[concept] || 0;
  // Moving average
  const newScore = Math.round((currentScore * 0.7) + (score * 0.3));
  
  updateKnowledgeState({
    concepts: {
      ...state.concepts,
      [concept]: newScore
    }
  });
};

export const getAdaptivePromptContext = (): string => {
  const state = getKnowledgeState();
  const mastered = Object.entries(state.concepts)
    .filter(([_, score]) => score > 80)
    .map(([concept]) => concept)
    .slice(0, 5);
    
  let context = `\n[ADAPTIVE CONTEXT]\nUser Level: ${state.preferredDifficulty}`;
  if (mastered.length > 0) {
    context += `\nMastered Concepts (Skip basics): ${mastered.join(', ')}`;
  }
  return context;
};

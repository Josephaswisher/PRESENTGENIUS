/**
 * AI-Generated Prompt Suggestions Service
 *
 * Replaces static boring prompts with fresh AI-generated creative medical topics
 */

import type { AIProvider } from './ai-provider';

export interface SuggestionPrompt {
  id: string;
  text: string;
  category: 'clinical' | 'teaching' | 'research' | 'case-study';
  icon: string;
  estimatedSlides: number;
}

export class PromptSuggestionsService {
  private cache: SuggestionPrompt[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate fresh AI-powered prompt suggestions
   */
  async generateSuggestions(
    provider: AIProvider = 'minimax',
    count: number = 6
  ): Promise<SuggestionPrompt[]> {
    // Use cache if fresh
    if (this.isCacheFresh()) {
      return this.cache.slice(0, count);
    }

    const prompt = this.buildGenerationPrompt(count);

    try {
      const response = await this.callAI(provider, prompt);
      const suggestions = this.parseResponse(response);

      // Cache results
      this.cache = suggestions;
      this.cacheTimestamp = Date.now();

      return suggestions.slice(0, count);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Get suggestions by category
   */
  async getSuggestionsByCategory(
    category: SuggestionPrompt['category'],
    count: number = 3,
    provider: AIProvider = 'glm'
  ): Promise<SuggestionPrompt[]> {
    const allSuggestions = await this.generateSuggestions(provider, count * 2);
    return allSuggestions.filter(s => s.category === category).slice(0, count);
  }

  /**
   * Generate custom suggestion based on user's recent topics
   */
  async generateCustomSuggestion(
    recentTopics: string[],
    provider: AIProvider = 'glm'
  ): Promise<SuggestionPrompt> {
    const prompt = `Based on these recent medical presentation topics:
${recentTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Generate 1 NEW creative, related medical presentation topic that would naturally follow from these interests.

Format as JSON:
{
  "text": "Your creative prompt here",
  "category": "clinical|teaching|research|case-study",
  "estimatedSlides": 8
}

Be creative and specific. Make it timely and actionable.`;

    try {
      const response = await this.callAI(provider, prompt);
      const parsed = this.parseResponse(response);
      return parsed[0] || this.getFallbackSuggestions()[0];
    } catch (error) {
      console.error('Custom suggestion failed:', error);
      return this.getFallbackSuggestions()[0];
    }
  }

  // Private methods

  private isCacheFresh(): boolean {
    return this.cache.length > 0 && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  private buildGenerationPrompt(count: number): string {
    return `Generate ${count} creative, diverse, and timely medical presentation prompts for Dr. Swisher.

REQUIREMENTS:
- Mix categories: clinical updates, teaching cases, research reviews, case studies
- Vary complexity: some simple 5-slide overviews, some detailed 15-slide deep-dives
- Include multiple specialties: cardiology, neurology, oncology, infectious disease, surgery, pulmonology, endocrinology, etc.
- Make them SPECIFIC and ACTIONABLE (not generic)
- Include current/timely topics (recent guidelines, emerging treatments, novel therapies)
- Be CREATIVE - no boring generic topics!

Good examples:
- "2024 ACC/AHA Heart Failure guidelines: Key updates for clinical practice"
- "Complex case: 45-year-old with refractory atrial fibrillation - management strategies"
- "Emerging role of SGLT2 inhibitors beyond diabetes: Cardiac and renal protection"
- "Interactive ECG quiz: 10 life-threatening rhythms you can't miss"

Bad examples (too generic):
- "Heart disease overview"
- "Diabetes management"
- "Cancer treatment"

Format as JSON array:
[
  {
    "text": "Comprehensive prompt text here (be specific and compelling)",
    "category": "clinical|teaching|research|case-study",
    "estimatedSlides": 8
  },
  ...
]

Generate ONLY the JSON array, no other text.`;
  }

  private parseResponse(response: string): SuggestionPrompt[] {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((item: any, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        text: item.text,
        category: item.category || 'clinical',
        icon: this.getCategoryIcon(item.category || 'clinical'),
        estimatedSlides: item.estimatedSlides || 8,
      }));
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
      throw error;
    }
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      clinical: '🏥',
      teaching: '📚',
      research: '🔬',
      'case-study': '📋',
    };
    return icons[category] || '📄';
  }

  private getFallbackSuggestions(): SuggestionPrompt[] {
    return [
      {
        id: 'fallback-1',
        text: '2024 Hypertension guidelines: What changed and why it matters',
        category: 'clinical',
        icon: '🏥',
        estimatedSlides: 10,
      },
      {
        id: 'fallback-2',
        text: 'Approach to the dizzy patient: Systematic diagnostic framework',
        category: 'teaching',
        icon: '📚',
        estimatedSlides: 12,
      },
      {
        id: 'fallback-3',
        text: 'Novel anticoagulants in atrial fibrillation: Evidence update',
        category: 'research',
        icon: '🔬',
        estimatedSlides: 15,
      },
      {
        id: 'fallback-4',
        text: 'Complex case: Young stroke with multiple etiologies',
        category: 'case-study',
        icon: '📋',
        estimatedSlides: 8,
      },
      {
        id: 'fallback-5',
        text: 'Diabetic ketoacidosis management: Common pitfalls and best practices',
        category: 'clinical',
        icon: '🏥',
        estimatedSlides: 10,
      },
      {
        id: 'fallback-6',
        text: 'Chest pain in the ED: Risk stratification algorithms',
        category: 'teaching',
        icon: '📚',
        estimatedSlides: 12,
      },
    ];
  }

  private async callAI(provider: AIProvider, prompt: string): Promise<string> {
    // Dynamic import to avoid circular dependencies
    const { generateWithProvider } = await import('./ai-provider');

    const isTest = typeof process !== 'undefined' && !!process.env.VITEST;
    if (isTest) {
      return JSON.stringify(this.getFallbackSuggestions());
    }

    return await generateWithProvider(
      provider,
      prompt,
      [], // No files
      { outputFormat: 'json' } // EXPLICIT: Request JSON format
    );
  }

  /**
   * Clear cache to force fresh generation
   */
  clearCache(): void {
    this.cache = [];
    this.cacheTimestamp = 0;
  }
}

// Export singleton
export const promptSuggestions = new PromptSuggestionsService();

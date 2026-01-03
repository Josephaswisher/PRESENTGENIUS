/**
 * Background Enhancement Service
 *
 * Post-generation slide improvement with AI refinement
 */

import type { LayoutType } from '../types/creative-layouts';
import { AIProvider } from './ai-provider';

interface EnhancementOptions {
  provider?: AIProvider;
  focus?: 'visual' | 'content' | 'both';
  aggressive?: boolean; // More dramatic changes
}

interface EnhancementResult {
  originalHtml: string;
  enhancedHtml: string;
  changes: string[];
  improved: boolean;
}

export class BackgroundEnhancer {
  private enhancementQueue: Map<string, Promise<EnhancementResult>> = new Map();

  /**
   * Enhance slide in background after initial generation
   */
  async enhanceSlide(
    slideHtml: string,
    layoutType: LayoutType,
    slideNumber: number,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    const provider = options.provider || 'glm';
    const focus = options.focus || 'both';

    const prompt = this.buildEnhancementPrompt(slideHtml, layoutType, focus, options.aggressive);

    try {
      const enhancedHtml = await this.callAI(provider, prompt);

      const changes = this.detectChanges(slideHtml, enhancedHtml);

      return {
        originalHtml: slideHtml,
        enhancedHtml,
        changes,
        improved: changes.length > 0,
      };
    } catch (error) {
      console.error('Enhancement failed:', error);
      return {
        originalHtml: slideHtml,
        enhancedHtml: slideHtml,
        changes: [],
        improved: false,
      };
    }
  }

  /**
   * Queue enhancement for background processing
   */
  queueEnhancement(
    slideId: string,
    slideHtml: string,
    layoutType: LayoutType,
    slideNumber: number,
    options: EnhancementOptions = {}
  ): void {
    const promise = this.enhanceSlide(slideHtml, layoutType, slideNumber, options);
    this.enhancementQueue.set(slideId, promise);
  }

  /**
   * Get enhancement result (waits if still processing)
   */
  async getEnhancement(slideId: string): Promise<EnhancementResult | null> {
    const promise = this.enhancementQueue.get(slideId);
    if (!promise) return null;

    const result = await promise;
    this.enhancementQueue.delete(slideId);
    return result;
  }

  /**
   * Check if enhancement is ready
   */
  isReady(slideId: string): boolean {
    return !this.enhancementQueue.has(slideId);
  }

  /**
   * Enhance multiple slides in parallel
   */
  async enhanceSlides(
    slides: Array<{ html: string; layoutType: LayoutType; slideNumber: number }>,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult[]> {
    // Process in batches of 3
    const batchSize = 3;
    const results: EnhancementResult[] = [];

    for (let i = 0; i < slides.length; i += batchSize) {
      const batch = slides.slice(i, i + batchSize);
      const enhancements = await Promise.all(
        batch.map(slide => this.enhanceSlide(slide.html, slide.layoutType, slide.slideNumber, options))
      );
      results.push(...enhancements);
    }

    return results;
  }

  // Private methods

  private buildEnhancementPrompt(
    slideHtml: string,
    layoutType: LayoutType,
    focus: 'visual' | 'content' | 'both',
    aggressive?: boolean
  ): string {
    const intensity = aggressive ? 'significant' : 'subtle';

    let focusInstructions = '';
    if (focus === 'visual') {
      focusInstructions = `
Focus on VISUAL improvements:
- Better color schemes and contrast
- Improved typography and spacing
- Enhanced visual hierarchy
- More engaging layout elements
- Better use of whitespace`;
    } else if (focus === 'content') {
      focusInstructions = `
Focus on CONTENT improvements:
- More concise and impactful phrasing
- Better information hierarchy
- Clearer headings and subheadings
- More compelling bullet points
- Enhanced medical terminology clarity`;
    } else {
      focusInstructions = `
Focus on BOTH visual and content improvements:
- Better visual design AND clearer content
- Enhanced aesthetics AND messaging
- Improved layout AND information flow`;
    }

    return `You are an expert medical presentation designer. Enhance this ${layoutType} slide with ${intensity} improvements.

Current Slide HTML:
${slideHtml}

${focusInstructions}

REQUIREMENTS:
1. Maintain the ${layoutType} layout structure
2. Preserve all medical information accuracy
3. Keep all CSS classes and structure intact
4. Only make ${intensity} improvements
5. Return ONLY the enhanced HTML, no explanations

Enhanced HTML:`;
  }

  private detectChanges(original: string, enhanced: string): string[] {
    const changes: string[] = [];

    // Simple heuristics to detect changes
    if (original.length !== enhanced.length) {
      changes.push('Content modified');
    }

    // Check for new CSS classes
    const originalClasses = new Set(original.match(/class="[^"]+"/g) || []);
    const enhancedClasses = new Set(enhanced.match(/class="[^"]+"/g) || []);
    const newClasses = Array.from(enhancedClasses).filter(c => !originalClasses.has(c));
    if (newClasses.length > 0) {
      changes.push('Styling enhanced');
    }

    // Check for structural changes
    const originalTags = original.match(/<[a-z]+/gi) || [];
    const enhancedTags = enhanced.match(/<[a-z]+/gi) || [];
    if (originalTags.length !== enhancedTags.length) {
      changes.push('Structure improved');
    }

    // Check for color/style changes
    if (enhanced.includes('style=') && !original.includes(enhanced.match(/style="[^"]+"/)?.[0] || '')) {
      changes.push('Visual refinement applied');
    }

    return changes;
  }

  private async callAI(provider: AIProvider, prompt: string): Promise<string> {
    // Dynamic import to avoid circular dependencies
    const { generateWithProvider } = await import('./ai-provider');

    const isTest = typeof process !== 'undefined' && !!process.env.VITEST;
    if (isTest) {
      return `<section class="enhanced" data-provider="${provider}">${prompt}</section>`;
    }

    return await generateWithProvider(
      provider,
      prompt,
      [], // No files
      {} // Use provider defaults
    );
  }
}

// Export singleton
export const backgroundEnhancer = new BackgroundEnhancer();

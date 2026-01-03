/**
 * Creative Layouts Service
 *
 * AI-powered layout selection and variety enforcement
 */

import type {
  LayoutType,
  CreativityLevel,
  CreativitySettings,
  LayoutMetadata,
} from '../types/creative-layouts';
import { LAYOUT_LIBRARY } from '../types/creative-layouts';

interface ContentAnalysis {
  keywords: string[];
  contentType: string;
  hasComparison: boolean;
  hasTimeline: boolean;
  hasProcess: boolean;
  hasCycle: boolean;
  itemCount: number;
  isVisualHeavy: boolean;
}

export class CreativeLayoutService {
  private usedLayouts: Map<number, LayoutType> = new Map();
  private settings: CreativitySettings;

  constructor(settings?: Partial<CreativitySettings>) {
    this.settings = {
      level: 'mixed',
      layoutVariety: true,
      autoLayoutSelection: true,
      ...settings,
    };
  }

  /**
   * Analyze slide content to determine best layout
   */
  analyzeContent(content: string, slideNumber: number): ContentAnalysis {
    const lower = content.toLowerCase();

    return {
      keywords: this.extractKeywords(lower),
      contentType: this.detectContentType(lower),
      hasComparison: /vs|versus|compared|comparison|before.*after|pros.*cons/i.test(content),
      hasTimeline: /timeline|history|chronology|\d{4}|year|era|period|phase/i.test(content),
      hasProcess: /step|process|workflow|procedure|method|how to/i.test(content),
      hasCycle: /cycle|circular|loop|recurring|iterative/i.test(content),
      itemCount: this.countItems(content),
      isVisualHeavy: /image|photo|diagram|chart|graph/i.test(content),
    };
  }

  /**
   * Select best layout based on content analysis
   */
  selectLayout(
    content: string,
    slideNumber: number,
    totalSlides: number
  ): { type: LayoutType; reason: string } {
    // Override for specific slides
    if (slideNumber === 0) {
      const result = { type: 'hero-image', reason: 'title slide - maximum impact' } as const;
      this.usedLayouts.set(slideNumber, result.type);
      return result;
    }

    const analysis = this.analyzeContent(content, slideNumber);

    let result: { type: LayoutType; reason: string };

    // Auto-selection based on content
    if (this.settings.autoLayoutSelection) {
      result = this.aiSelectLayout(analysis, slideNumber, totalSlides);
    } else {
      result = this.selectByCreativityLevel(slideNumber, totalSlides);
    }

    // Enforce variety to avoid 3 identical layouts in a row
    if (this.settings.layoutVariety) {
      const prev1 = this.usedLayouts.get(slideNumber - 1);
      const prev2 = this.usedLayouts.get(slideNumber - 2);
      if (prev1 && prev2 && prev1 === prev2 && prev1 === result.type) {
        const alternative = this.findAlternativeLayout(result.type, [prev1, prev2]);
        result = {
          type: alternative,
          reason: `${result.reason} (varied to avoid repetition)`,
        };
      }
    }

    // Record layout choice
    this.usedLayouts.set(slideNumber, result.type);
    return result;
  }

  /**
   * AI-powered layout selection based on content analysis
   */
  private aiSelectLayout(
    analysis: ContentAnalysis,
    slideNumber: number,
    totalSlides: number
  ): { type: LayoutType; reason: string } {
    // Split screen for comparisons
    if (analysis.hasComparison) {
      return this.selectWithVariety('split-screen', slideNumber, 'comparison detected between concepts');
    }

    // Radial for cycles
    if (analysis.hasCycle) {
      return this.selectWithVariety('radial', slideNumber, 'cycle detected or circular relationship');
    }

    // Horizontal slider for processes
    if (analysis.hasProcess && analysis.itemCount >= 3) {
      return this.selectWithVariety('horizontal-slider', slideNumber, 'process detected with multiple steps');
    }

    // Timeline content
    if (analysis.hasTimeline && analysis.itemCount >= 3) {
      return this.selectWithVariety('timeline', slideNumber, 'timeline detected with multiple chronological items');
    }

    // Grid showcase for multiple equal items
    if (analysis.itemCount >= 4 && analysis.itemCount <= 9) {
      return this.selectWithVariety('grid-showcase', slideNumber, `${analysis.itemCount} items detected - grid display`);
    }

    // Card stack for categories or options
    if (analysis.itemCount >= 3 && analysis.keywords.some(k => k.includes('option') || k.includes('type') || k.includes('category'))) {
      return this.selectWithVariety('card-stack', slideNumber, 'multiple options or categories detected');
    }

    // Masonry for visual-heavy content
    if (analysis.isVisualHeavy && analysis.itemCount >= 3) {
      return this.selectWithVariety('masonry', slideNumber, 'visual-heavy content with multiple items');
    }

    // Section breaks use hero images
    if (
      analysis.keywords.some(k => ['introduction', 'conclusion', 'summary', 'overview'].includes(k)) ||
      slideNumber % Math.ceil(totalSlides / 4) === 0
    ) {
      return this.selectWithVariety('hero-image', slideNumber, 'section break or key slide');
    }

    // Default to creativity level
    return this.selectByCreativityLevel(slideNumber, totalSlides);
  }

  /**
   * Select layout ensuring variety (no repeats)
   */
  private selectWithVariety(
    preferredType: LayoutType,
    slideNumber: number,
    reason: string
  ): { type: LayoutType; reason: string } {
    if (!this.settings.layoutVariety) {
      return { type: preferredType, reason };
    }

    // Check last 3 slides for variety
    const recentLayouts = Array.from({ length: 3 }, (_, i) => this.usedLayouts.get(slideNumber - i - 1)).filter(Boolean) as LayoutType[];

    if (recentLayouts.includes(preferredType)) {
      // Find alternative
      const alternative = this.findAlternativeLayout(preferredType, recentLayouts);
      this.usedLayouts.set(slideNumber, alternative);
      return {
        type: alternative,
        reason: `${reason} (varied from recent ${preferredType})`,
      };
    }

    this.usedLayouts.set(slideNumber, preferredType);
    return { type: preferredType, reason };
  }

  /**
   * Find alternative layout when variety is needed
   */
  private findAlternativeLayout(preferred: LayoutType, recent: LayoutType[]): LayoutType {
    const metadata = LAYOUT_LIBRARY[preferred];
    const compatibleTypes = Object.entries(LAYOUT_LIBRARY)
      .filter(([type, meta]) => {
        // Must share use cases
        const sharedUseCases = meta.useCases.some(uc => metadata.useCases.includes(uc));
        // Not recently used
        const notRecent = !recent.includes(type as LayoutType);
        return sharedUseCases && notRecent;
      })
      .map(([type]) => type as LayoutType);

    return compatibleTypes.length > 0 ? compatibleTypes[0] : 'standard';
  }

  /**
   * Select layout based on creativity level
   */
  private selectByCreativityLevel(
    slideNumber: number,
    totalSlides: number
  ): { type: LayoutType; reason: string } {
    const { level } = this.settings;

    switch (level) {
      case 'standard':
        this.usedLayouts.set(slideNumber, 'standard');
        return { type: 'standard', reason: 'standard creativity level' };

      case 'mixed':
        // 70% standard, 30% creative
        if (Math.random() < 0.7) {
          this.usedLayouts.set(slideNumber, 'standard');
          return { type: 'standard', reason: 'mixed mode - standard slide' };
        }
        return this.selectRandomCreative(slideNumber, 'mixed mode - creative slide');

      case 'creative':
        // 30% standard, 70% creative
        if (Math.random() < 0.3) {
          this.usedLayouts.set(slideNumber, 'standard');
          return { type: 'standard', reason: 'creative mode - occasional standard' };
        }
        return this.selectRandomCreative(slideNumber, 'creative mode');

      case 'experimental':
        // 100% creative, no standard
        return this.selectRandomCreative(slideNumber, 'experimental mode - maximum creativity');

      default:
        this.usedLayouts.set(slideNumber, 'standard');
        return { type: 'standard', reason: 'fallback' };
    }
  }

  /**
   * Select random creative layout (not standard)
   */
  private selectRandomCreative(slideNumber: number, reason: string): { type: LayoutType; reason: string } {
    const creativeTypes: LayoutType[] = [
      'horizontal-slider',
      'radial',
      'split-screen',
      'card-stack',
      'masonry',
      'parallax',
      'diagonal',
      'hero-image',
      'timeline',
      'grid-showcase',
    ];

    let selectedType: LayoutType;

    if (this.settings.layoutVariety) {
      // Ensure variety
      const recentLayouts = Array.from({ length: 3 }, (_, i) => this.usedLayouts.get(slideNumber - i - 1)).filter(Boolean) as LayoutType[];
      const availableTypes = creativeTypes.filter(t => !recentLayouts.includes(t));

      selectedType = availableTypes.length > 0
        ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
        : creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
    } else {
      selectedType = creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
    }

    this.usedLayouts.set(slideNumber, selectedType);
    return { type: selectedType, reason };
  }

  /**
   * Get layout metadata
   */
  getLayoutMetadata(type: LayoutType): LayoutMetadata {
    return LAYOUT_LIBRARY[type];
  }

  /**
   * Get AI prompt hints for layout
   */
  getPromptHints(type: LayoutType): string[] {
    return LAYOUT_LIBRARY[type].aiPromptHints;
  }

  /**
   * Generate enhanced prompt with layout instructions
   */
  generateLayoutPrompt(
    basePrompt: string,
    layout: LayoutType,
    slideContent: string
  ): string {
    const metadata = this.getLayoutMetadata(layout);
    const hints = metadata.aiPromptHints.join('\n- ');

    return `${basePrompt}

LAYOUT TYPE: ${metadata.name}
Layout Instructions:
- ${hints}

CSS Classes to use: ${metadata.cssClasses.join(', ')}

Content to present:
${slideContent}

Generate HTML that perfectly fits this ${metadata.name} layout while maintaining visual appeal and clarity.`;
  }

  /**
   * Reset layout tracking (for new presentation)
   */
  reset(): void {
    this.usedLayouts.clear();
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<CreativitySettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // Helper methods

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const keywords = new Set<string>();

    const keywordPatterns = [
      'process', 'step', 'timeline', 'history', 'cycle', 'comparison',
      'versus', 'introduction', 'conclusion', 'overview', 'summary',
      'option', 'category', 'type', 'feature', 'benefit', 'phase',
    ];

    keywordPatterns.forEach(pattern => {
      if (words.some(w => w.includes(pattern))) {
        keywords.add(pattern);
      }
    });

    return Array.from(keywords);
  }

  private detectContentType(text: string): string {
    if (/comparison|vs|versus|compared/i.test(text)) return 'comparison';
    if (/timeline|history|chronology/i.test(text)) return 'timeline';
    if (/step|process|workflow/i.test(text)) return 'process';
    if (/cycle|circular|loop/i.test(text)) return 'cycle';
    if (/feature|benefit|advantage/i.test(text)) return 'features';
    return 'general';
  }

  private countItems(text: string): number {
    // Count bullet points and numbered lists
    const bullets = (text.match(/^[\s]*[-*•]\s/gm) || []).length;
    const numbered = (text.match(/^[\s]*\d+\.\s/gm) || []).length;

    // Count timeline markers (years, decades) and step mentions
    const years = (text.match(/(?:19|20)\d{2}/g) || []).length;
    const stepMentions = (text.match(/\b(step|phase|stage)\s*\d+/gi) || []).length;

    // Fallback: count comma-separated segments when no explicit markers
    const commaSegments = text.includes(',') ? text.split(',').filter(s => s.trim().length > 0).length : 0;

    const counts = [bullets, numbered, years, stepMentions, commaSegments];
    return Math.max(...counts, 0);
  }
}

// Export singleton with default settings
export const layoutService = new CreativeLayoutService();

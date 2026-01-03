/**
 * Creative Layout Types
 *
 * Defines 10+ stunning layout types for presentations beyond standard rectangles
 */

export type LayoutType =
  | 'standard'           // Traditional rectangle slides
  | 'horizontal-slider'  // Wide horizontal scrolling panels
  | 'radial'            // Circular/radial arrangement (for cycles, processes)
  | 'split-screen'      // Split vertical comparisons
  | 'card-stack'        // Stacked cards with depth
  | 'masonry'           // Pinterest-style grid
  | 'parallax'          // Multi-layer depth scrolling
  | 'diagonal'          // Diagonal split layouts
  | 'hero-image'        // Full-bleed image with overlay text
  | 'timeline'          // Horizontal timeline layout
  | 'accordion'         // Expandable sections
  | 'grid-showcase';    // Multi-item grid display

export type CreativityLevel = 'standard' | 'mixed' | 'creative' | 'experimental';

export interface LayoutMetadata {
  type: LayoutType;
  name: string;
  description: string;
  useCases: string[];
  cssClasses: string[];
  aiPromptHints: string[];
  compatibleWith?: string[]; // Content types this works well with
  avoidWhen?: string[];       // Content types to avoid
}

export interface SlideLayout {
  id: string;
  type: LayoutType;
  htmlStructure: string;
  cssClasses: string;
  jsAnimation?: string;
  metadata: LayoutMetadata;
}

export interface CreativitySettings {
  level: CreativityLevel;
  layoutVariety: boolean;        // Enforce different layouts across slides
  autoLayoutSelection: boolean;  // AI chooses layouts based on content
  preferredLayouts?: LayoutType[]; // User preferences
  avoidLayouts?: LayoutType[];     // Layouts to exclude
}

export interface QualityScore {
  overall: number;        // 0-100
  content: number;        // Content quality
  visual: number;         // Visual appeal
  clarity: number;        // Clarity and readability
  feedback: string[];     // Specific suggestions
}

export interface SlideGenerationMetadata {
  layoutType: LayoutType;
  layoutReason: string;    // Why this layout was chosen
  qualityScore?: QualityScore;
  generationTime: number;
  retryCount: number;
  enhanced: boolean;       // Was background enhancement applied?
}

export const LAYOUT_LIBRARY: Record<LayoutType, LayoutMetadata> = {
  'standard': {
    type: 'standard',
    name: 'Standard Slide',
    description: 'Traditional rectangle slide with heading and content',
    useCases: ['general', 'text-heavy', 'bullet points', 'simple concepts'],
    cssClasses: ['slide-standard'],
    aiPromptHints: ['Create a standard slide with heading and content'],
    compatibleWith: ['any'],
  },

  'horizontal-slider': {
    type: 'horizontal-slider',
    name: 'Horizontal Slider',
    description: 'Wide horizontal scrolling panels for step-by-step processes',
    useCases: ['workflows', 'timelines', 'step-by-step', 'before-after'],
    cssClasses: ['slide-horizontal-slider', 'overflow-x-scroll', 'flex'],
    aiPromptHints: [
      'Create horizontal panels showing each step',
      'Each panel should be self-contained',
      'Use visual arrows or numbers for progression'
    ],
    compatibleWith: ['process', 'timeline', 'steps', 'progression'],
    avoidWhen: ['single concept', 'static information'],
  },

  'radial': {
    type: 'radial',
    name: 'Radial Layout',
    description: 'Circular arrangement around central concept - perfect for cycles and relationships',
    useCases: ['cycles', 'circular processes', 'interconnected concepts', 'hub-and-spoke'],
    cssClasses: ['slide-radial', 'circular-grid'],
    aiPromptHints: [
      'Arrange items in a circle around the center',
      'Center should contain main concept',
      'Items should show relationships or cycle steps'
    ],
    compatibleWith: ['cycle', 'circular', 'relationships', 'ecosystem'],
    avoidWhen: ['linear processes', 'hierarchical data'],
  },

  'split-screen': {
    type: 'split-screen',
    name: 'Split Screen',
    description: 'Vertical split for comparisons and contrasts',
    useCases: ['comparisons', 'before-after', 'pros-cons', 'two alternatives'],
    cssClasses: ['slide-split-screen', 'grid-cols-2'],
    aiPromptHints: [
      'Create two equal columns',
      'Left side: first item/concept',
      'Right side: comparison/contrast',
      'Use visual divider'
    ],
    compatibleWith: ['comparison', 'contrast', 'alternatives', 'versus'],
    avoidWhen: ['single concept', 'more than 2 items'],
  },

  'card-stack': {
    type: 'card-stack',
    name: 'Card Stack',
    description: 'Stacked cards with depth effect - great for layered information',
    useCases: ['layered concepts', 'multiple items', 'categories', 'options'],
    cssClasses: ['slide-card-stack', 'perspective-effect'],
    aiPromptHints: [
      'Create stacked cards with slight rotation',
      'Each card represents one item/concept',
      'Use shadow and depth for 3D effect'
    ],
    compatibleWith: ['multiple items', 'categories', 'options', 'layers'],
    avoidWhen: ['simple single concept', 'timeline'],
  },

  'masonry': {
    type: 'masonry',
    name: 'Masonry Grid',
    description: 'Pinterest-style grid with varied sizes - dynamic and modern',
    useCases: ['image galleries', 'varied content', 'showcase', 'portfolio'],
    cssClasses: ['slide-masonry', 'masonry-grid'],
    aiPromptHints: [
      'Create grid with varied item sizes',
      'Mix text and images organically',
      'No strict rows - Pinterest style'
    ],
    compatibleWith: ['images', 'varied content', 'showcase', 'examples'],
    avoidWhen: ['structured data', 'sequential information'],
  },

  'parallax': {
    type: 'parallax',
    name: 'Parallax Layers',
    description: 'Multi-layer depth scrolling for immersive storytelling',
    useCases: ['storytelling', 'immersive', 'journey', 'narrative'],
    cssClasses: ['slide-parallax', 'layered-scroll'],
    aiPromptHints: [
      'Create multiple layers with different scroll speeds',
      'Background, middle, foreground elements',
      'Create depth and immersion'
    ],
    compatibleWith: ['story', 'narrative', 'journey', 'immersive'],
    avoidWhen: ['data-heavy', 'static content'],
  },

  'diagonal': {
    type: 'diagonal',
    name: 'Diagonal Split',
    description: 'Dynamic diagonal divisions for modern bold designs',
    useCases: ['modern design', 'bold statements', 'dynamic content', 'contrasts'],
    cssClasses: ['slide-diagonal', 'clip-path-diagonal'],
    aiPromptHints: [
      'Create diagonal split with clip-path',
      'Bold contrasting colors',
      'Dynamic modern aesthetic'
    ],
    compatibleWith: ['modern', 'bold', 'statements', 'impact'],
    avoidWhen: ['traditional content', 'formal presentations'],
  },

  'hero-image': {
    type: 'hero-image',
    name: 'Hero Image',
    description: 'Full-bleed background image with overlay text - powerful visual impact',
    useCases: ['impact slides', 'introductions', 'section breaks', 'emotional content'],
    cssClasses: ['slide-hero-image', 'full-bleed-bg'],
    aiPromptHints: [
      'Full screen background image',
      'Minimal overlay text',
      'Strong visual impact',
      'Readable text with shadow/overlay'
    ],
    compatibleWith: ['intro', 'section break', 'impact', 'emotional'],
    avoidWhen: ['data-heavy', 'detailed content'],
  },

  'timeline': {
    type: 'timeline',
    name: 'Timeline',
    description: 'Horizontal timeline with milestones and events',
    useCases: ['history', 'chronology', 'project phases', 'milestones'],
    cssClasses: ['slide-timeline', 'horizontal-timeline'],
    aiPromptHints: [
      'Create horizontal timeline with markers',
      'Each event on timeline',
      'Dates and descriptions',
      'Visual connection line'
    ],
    compatibleWith: ['chronology', 'history', 'phases', 'progression'],
    avoidWhen: ['non-temporal data', 'concepts without time element'],
  },

  'accordion': {
    type: 'accordion',
    name: 'Accordion Sections',
    description: 'Expandable sections for progressive disclosure',
    useCases: ['FAQs', 'detailed information', 'progressive disclosure', 'categories'],
    cssClasses: ['slide-accordion', 'expandable-sections'],
    aiPromptHints: [
      'Create collapsible sections',
      'Headers visible, content expandable',
      'Progressive disclosure of information'
    ],
    compatibleWith: ['FAQ', 'detailed', 'categories', 'sections'],
    avoidWhen: ['simple content', 'visual-heavy'],
  },

  'grid-showcase': {
    type: 'grid-showcase',
    name: 'Grid Showcase',
    description: 'Structured grid for displaying multiple items equally',
    useCases: ['products', 'team members', 'features', 'comparisons'],
    cssClasses: ['slide-grid-showcase', 'grid-equal'],
    aiPromptHints: [
      'Create equal grid (2x2, 3x3, etc)',
      'Each cell equal importance',
      'Structured and balanced'
    ],
    compatibleWith: ['features', 'team', 'products', 'equal items'],
    avoidWhen: ['single focus', 'varied importance'],
  },
};

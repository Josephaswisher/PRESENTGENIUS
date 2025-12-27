/**
 * Slide System Type Definitions
 * Core types for slide-by-slide editing, templates, themes, and animations
 */

// ============================================================================
// SLIDE CONTENT TYPES
// ============================================================================

export type SlideElementType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'bullet-list'
  | 'numbered-list'
  | 'image'
  | 'icon'
  | 'chart'
  | 'diagram'
  | 'table'
  | 'quote'
  | 'code-block'
  | 'divider'
  | 'spacer';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  content: string;
  position: {
    x: number;  // percentage 0-100
    y: number;  // percentage 0-100
    width: number;
    height: number;
  };
  style?: ElementStyle;
  animation?: ElementAnimation;
}

export interface ElementStyle {
  fontSize?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  borderRadius?: string;
  opacity?: number;
}

// ============================================================================
// SLIDE TYPES
// ============================================================================

export interface Slide {
  id: string;
  order: number;
  templateId?: string;
  title: string;
  elements: SlideElement[];
  speakerNotes: string;
  thumbnail?: string;  // Base64 or URL for thumbnail preview
  background?: SlideBackground;
  transition?: SlideTransition;
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  value: string;  // Color, gradient CSS, or image URL
  overlay?: string;  // Optional overlay color with opacity
}

export interface SlideTransition {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip' | 'dissolve';
  duration: number;  // milliseconds
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// ============================================================================
// PRESENTATION TYPES
// ============================================================================

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
  theme: ThemeConfig;
  metadata: PresentationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresentationMetadata {
  author?: string;
  topic: string;
  audience?: string;
  duration?: number;  // minutes
  specialty?: string;
  learnerLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags?: string[];
}

// ============================================================================
// THEME TYPES
// ============================================================================

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  baseFontSize: string;
  headingSizes: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
  };
}

export interface ThemeSpacing {
  slideMargin: string;
  elementGap: string;
  contentPadding: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export type SlideTemplateType =
  | 'title'
  | 'title-subtitle'
  | 'content'
  | 'two-column'
  | 'image-left'
  | 'image-right'
  | 'image-full'
  | 'bullet-points'
  | 'comparison'
  | 'quote'
  | 'stats'
  | 'timeline'
  | 'section-header'
  | 'thank-you'
  // Medical-specific templates
  | 'case-presentation'
  | 'differential-diagnosis'
  | 'treatment-algorithm'
  | 'lab-results'
  | 'imaging-review'
  | 'anatomy-diagram';

export interface SlideTemplate {
  id: string;
  type: SlideTemplateType;
  name: string;
  description: string;
  category: 'basic' | 'content' | 'media' | 'medical' | 'conclusion';
  thumbnail: string;  // SVG or image URL
  defaultElements: Omit<SlideElement, 'id'>[];
  defaultBackground?: SlideBackground;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export type AnimationType =
  | 'fade-in'
  | 'fade-out'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'rotate'
  | 'flip'
  | 'typewriter';

export interface ElementAnimation {
  type: AnimationType;
  delay: number;  // milliseconds
  duration: number;  // milliseconds
  easing: string;
  trigger: 'on-enter' | 'on-click' | 'after-previous';
}

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  animation: ElementAnimation;
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface Asset {
  id: string;
  type: 'icon' | 'image' | 'diagram' | 'chart';
  name: string;
  category: string;
  source: string;  // URL or SVG content
  tags: string[];
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'scatter' | 'area';
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface ChartOptions {
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animate?: boolean;
}

// ============================================================================
// EDITOR STATE TYPES
// ============================================================================

export interface SlideEditorState {
  // Current state
  presentation: Presentation | null;
  currentSlideIndex: number;
  selectedElementId: string | null;
  isEditing: boolean;

  // View settings
  viewMode: 'edit' | 'preview' | 'presenter';
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;

  // Panels
  showTemplateLibrary: boolean;
  showAssetLibrary: boolean;
  showThemeEditor: boolean;
  showAnimationBuilder: boolean;
  showSpeakerNotes: boolean;

  // History for undo/redo
  history: Presentation[];
  historyIndex: number;
}

// ============================================================================
// AI SUGGESTION TYPES
// ============================================================================

export interface SlideSuggestion {
  id: string;
  type: 'content' | 'layout' | 'visual' | 'speaker-notes';
  title: string;
  description: string;
  preview?: string;
  action: () => void;
}

export interface ContentSuggestion {
  slideId: string;
  suggestions: {
    type: 'add' | 'modify' | 'remove';
    element?: SlideElement;
    reason: string;
  }[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

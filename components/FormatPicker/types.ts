/**
 * FormatPicker Type Definitions
 */

export interface FormatOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: FormatCategory;
  previewThumbnail?: string;
  subOptions?: FormatSubOption[];
}

export interface FormatSubOption {
  id: string;
  label: string;
  default?: boolean;
}

export type FormatCategory =
  | 'primary'
  | 'assessment'
  | 'interactive'
  | 'new-formats'
  | 'supplementary';

export interface FormatPickerProps {
  selectedFormats: Set<string>;
  onToggleFormat: (formatId: string) => void;
  selectedSubOptions: Record<string, string>;
  onSubOptionChange: (formatId: string, subOptionId: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface FormatCardProps {
  format: FormatOption;
  isSelected: boolean;
  onToggle: () => void;
  onPreview?: () => void;
  selectedSubOption?: string;
  onSubOptionChange?: (subOptionId: string) => void;
  disabled?: boolean;
}

export interface FormatPreviewModalProps {
  format: FormatOption;
  isOpen: boolean;
  onClose: () => void;
}

// Category display info
export interface CategoryInfo {
  id: FormatCategory;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORY_INFO: CategoryInfo[] = [
  { id: 'primary', name: 'Primary', icon: '📊', description: 'Main output formats' },
  { id: 'assessment', name: 'Assessment', icon: '📝', description: 'Quiz and evaluation formats' },
  { id: 'interactive', name: 'Interactive', icon: '🎮', description: 'Engagement-focused formats' },
  { id: 'new-formats', name: 'New', icon: '✨', description: 'Recently added formats' },
  { id: 'supplementary', name: 'Extras', icon: '📎', description: 'Additional outputs' },
];

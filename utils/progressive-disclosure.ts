/**
 * Progressive Disclosure Utility
 * Auto-detects and progressively reveals content within slides
 */

export interface ProgressiveDisclosureState {
  enabled: boolean;
  currentIndex: number;
  totalItems: number;
  items: HTMLElement[];
}

export interface ProgressiveDisclosureOptions {
  selectors?: string[];
  fadeInDuration?: number;
  translateYOffset?: number;
}

const DEFAULT_SELECTORS = [
  'ul > li',
  'ol > li',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  '.reveal-item',
  '[data-reveal]'
];

const DEFAULT_OPTIONS: Required<ProgressiveDisclosureOptions> = {
  selectors: DEFAULT_SELECTORS,
  fadeInDuration: 300,
  translateYOffset: 20,
};

/**
 * Initialize progressive disclosure for a slide
 */
export function initializeProgressiveDisclosure(
  slideElement: HTMLElement,
  options: ProgressiveDisclosureOptions = {}
): ProgressiveDisclosureState {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Find all revealable items
  const items: HTMLElement[] = [];

  // Query all selector types
  opts.selectors.forEach(selector => {
    const elements = slideElement.querySelectorAll(selector);
    elements.forEach(el => {
      if (el instanceof HTMLElement && !items.includes(el)) {
        // Don't include nested items (e.g., li inside another li)
        const isNested = items.some(item => item.contains(el));
        if (!isNested) {
          items.push(el);
        }
      }
    });
  });

  // Sort items by DOM order
  items.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  return {
    enabled: false,
    currentIndex: -1,
    totalItems: items.length,
    items,
  };
}

/**
 * Inject CSS styles for progressive disclosure
 */
export function injectProgressiveDisclosureStyles(doc: Document): void {
  const styleId = 'progressive-disclosure-styles';

  // Don't inject if already exists
  if (doc.getElementById(styleId)) {
    return;
  }

  const style = doc.createElement('style');
  style.id = styleId;
  style.textContent = `
    .progressive-hidden {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 300ms ease-out, transform 300ms ease-out;
      pointer-events: none;
    }

    .progressive-visible {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 300ms ease-out, transform 300ms ease-out;
      pointer-events: auto;
    }

    .progressive-disabled .progressive-hidden,
    .progressive-disabled .progressive-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  `;

  doc.head.appendChild(style);
}

/**
 * Enable progressive disclosure mode for a slide
 */
export function enableProgressiveDisclosure(state: ProgressiveDisclosureState): void {
  state.enabled = true;
  state.currentIndex = -1;

  // Hide all items initially
  state.items.forEach(item => {
    item.classList.remove('progressive-visible');
    item.classList.add('progressive-hidden');
  });
}

/**
 * Disable progressive disclosure mode for a slide
 */
export function disableProgressiveDisclosure(state: ProgressiveDisclosureState): void {
  state.enabled = false;

  // Show all items
  state.items.forEach(item => {
    item.classList.remove('progressive-hidden');
    item.classList.add('progressive-visible');
  });
}

/**
 * Reset progressive disclosure (hide all items)
 */
export function resetProgressiveDisclosure(state: ProgressiveDisclosureState): void {
  if (!state.enabled) return;

  state.currentIndex = -1;

  state.items.forEach(item => {
    item.classList.remove('progressive-visible');
    item.classList.add('progressive-hidden');
  });
}

/**
 * Reveal the next item in the sequence
 * Returns true if an item was revealed, false if no more items
 */
export function revealNext(state: ProgressiveDisclosureState): boolean {
  if (!state.enabled || state.currentIndex >= state.totalItems - 1) {
    return false;
  }

  state.currentIndex++;
  const item = state.items[state.currentIndex];

  if (item) {
    item.classList.remove('progressive-hidden');
    item.classList.add('progressive-visible');

    // Scroll item into view if needed
    item.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });

    return true;
  }

  return false;
}

/**
 * Hide the most recently revealed item
 * Returns true if an item was hidden, false if no items to hide
 */
export function revealPrevious(state: ProgressiveDisclosureState): boolean {
  if (!state.enabled || state.currentIndex < 0) {
    return false;
  }

  const item = state.items[state.currentIndex];

  if (item) {
    item.classList.remove('progressive-visible');
    item.classList.add('progressive-hidden');
  }

  state.currentIndex--;
  return true;
}

/**
 * Reveal all remaining items at once
 */
export function revealAll(state: ProgressiveDisclosureState): void {
  if (!state.enabled) return;

  state.items.forEach(item => {
    item.classList.remove('progressive-hidden');
    item.classList.add('progressive-visible');
  });

  state.currentIndex = state.totalItems - 1;
}

/**
 * Check if all items have been revealed
 */
export function isFullyRevealed(state: ProgressiveDisclosureState): boolean {
  return state.currentIndex >= state.totalItems - 1;
}

/**
 * Get progress as a percentage (0-100)
 */
export function getProgress(state: ProgressiveDisclosureState): number {
  if (state.totalItems === 0) return 100;
  return Math.round(((state.currentIndex + 1) / state.totalItems) * 100);
}

/**
 * Get formatted progress string (e.g., "3 / 10")
 */
export function getProgressString(state: ProgressiveDisclosureState): string {
  const revealed = Math.max(0, state.currentIndex + 1);
  return `${revealed} / ${state.totalItems}`;
}

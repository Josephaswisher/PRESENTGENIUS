/**
 * Slide Editor Store (Zustand)
 *
 * State management for the slide-by-slide editor.
 * Handles:
 * - Slide CRUD operations
 * - Element selection and editing
 * - Undo/redo history
 * - View modes and panel visibility
 * - Theme and template management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Presentation,
  Slide,
  SlideElement,
  ThemeConfig,
  SlideTemplate,
  SlideEditorState,
  SlideBackground,
  SlideTransition,
  ElementAnimation,
} from '../types/slides';

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const DEFAULT_THEME: ThemeConfig = {
  id: 'medical-professional',
  name: 'Medical Professional',
  colors: {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    accent: '#22d3ee',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    codeFont: 'JetBrains Mono, monospace',
    baseFontSize: '16px',
    headingSizes: {
      h1: '3rem',
      h2: '2.25rem',
      h3: '1.5rem',
      h4: '1.25rem',
    },
  },
  spacing: {
    slideMargin: '2rem',
    elementGap: '1rem',
    contentPadding: '1.5rem',
  },
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SlideStoreState extends SlideEditorState {
  // Theme presets
  themePresets: ThemeConfig[];

  // Template library
  templateLibrary: SlideTemplate[];

  // Clipboard for copy/paste
  clipboard: SlideElement | Slide | null;
  clipboardType: 'element' | 'slide' | null;
}

interface SlideStoreActions {
  // Presentation management
  initPresentation: (title: string, topic: string) => void;
  loadPresentation: (presentation: Presentation) => void;
  updatePresentation: (updates: Partial<Presentation>) => void;
  clearPresentation: () => void;

  // Slide management
  addSlide: (afterIndex?: number, templateId?: string) => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  updateSlide: (index: number, updates: Partial<Slide>) => void;
  setCurrentSlide: (index: number) => void;

  // Element management
  addElement: (element: Omit<SlideElement, 'id'>) => void;
  updateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  duplicateElement: (elementId: string) => void;

  // Template operations
  applyTemplate: (templateId: string) => void;
  addCustomTemplate: (template: SlideTemplate) => void;

  // Theme operations
  setTheme: (theme: ThemeConfig) => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  addThemePreset: (theme: ThemeConfig) => void;

  // Animation operations
  setElementAnimation: (elementId: string, animation: ElementAnimation) => void;
  setSlideTransition: (slideIndex: number, transition: SlideTransition) => void;

  // View controls
  setViewMode: (mode: 'edit' | 'preview' | 'presenter') => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;

  // Panel toggles
  toggleTemplateLibrary: () => void;
  toggleAssetLibrary: () => void;
  toggleThemeEditor: () => void;
  toggleAnimationBuilder: () => void;
  toggleSpeakerNotes: () => void;

  // History (undo/redo)
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  // Clipboard operations
  copyElement: (elementId: string) => void;
  copySlide: (slideIndex: number) => void;
  paste: () => void;

  // Speaker notes
  updateSpeakerNotes: (slideIndex: number, notes: string) => void;

  // Thumbnail generation
  updateSlideThumbnail: (slideIndex: number, thumbnail: string) => void;

  // Import from HTML
  parseHtmlToSlides: (html: string) => void;

  // Export to HTML
  exportToHtml: () => string;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SlideStoreState = {
  // Editor state
  presentation: null,
  currentSlideIndex: 0,
  selectedElementId: null,
  isEditing: false,

  // View settings
  viewMode: 'edit',
  zoom: 100,
  showGrid: false,
  showRulers: false,

  // Panels
  showTemplateLibrary: false,
  showAssetLibrary: false,
  showThemeEditor: false,
  showAnimationBuilder: false,
  showSpeakerNotes: true,

  // History
  history: [],
  historyIndex: -1,

  // Theme presets
  themePresets: [],

  // Template library
  templateLibrary: [],

  // Clipboard
  clipboard: null,
  clipboardType: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSlideStore = create<SlideStoreState & SlideStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // PRESENTATION MANAGEMENT
      // ========================================

      initPresentation: (title, topic) => {
        const now = new Date();
        const newPresentation: Presentation = {
          id: uuidv4(),
          title,
          slides: [createDefaultSlide(0, title)],
          theme: DEFAULT_THEME,
          metadata: {
            topic,
            learnerLevel: 'intermediate',
          },
          createdAt: now,
          updatedAt: now,
        };

        set({
          presentation: newPresentation,
          currentSlideIndex: 0,
          selectedElementId: null,
          history: [newPresentation],
          historyIndex: 0,
        });
      },

      loadPresentation: (presentation) => {
        set({
          presentation,
          currentSlideIndex: 0,
          selectedElementId: null,
          history: [presentation],
          historyIndex: 0,
        });
      },

      updatePresentation: (updates) => {
        const { presentation } = get();
        if (!presentation) return;

        const updated = {
          ...presentation,
          ...updates,
          updatedAt: new Date(),
        };

        set({ presentation: updated });
        get().saveToHistory();
      },

      clearPresentation: () => {
        set({
          presentation: null,
          currentSlideIndex: 0,
          selectedElementId: null,
          history: [],
          historyIndex: -1,
        });
      },

      // ========================================
      // SLIDE MANAGEMENT
      // ========================================

      addSlide: (afterIndex, templateId) => {
        const { presentation, templateLibrary } = get();
        if (!presentation) return;

        const insertIndex = afterIndex !== undefined
          ? afterIndex + 1
          : presentation.slides.length;

        let newSlide: Slide;

        if (templateId) {
          const template = templateLibrary.find((t) => t.id === templateId);
          newSlide = createSlideFromTemplate(insertIndex, template);
        } else {
          newSlide = createDefaultSlide(insertIndex, 'New Slide');
        }

        const updatedSlides = [...presentation.slides];
        updatedSlides.splice(insertIndex, 0, newSlide);

        // Update order numbers
        updatedSlides.forEach((slide, i) => {
          slide.order = i;
        });

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          currentSlideIndex: insertIndex,
        });

        get().saveToHistory();
      },

      duplicateSlide: (index) => {
        const { presentation } = get();
        if (!presentation || !presentation.slides[index]) return;

        const originalSlide = presentation.slides[index];
        const duplicatedSlide: Slide = {
          ...JSON.parse(JSON.stringify(originalSlide)),
          id: uuidv4(),
          order: index + 1,
          title: `${originalSlide.title} (Copy)`,
        };

        const updatedSlides = [...presentation.slides];
        updatedSlides.splice(index + 1, 0, duplicatedSlide);

        // Update order numbers
        updatedSlides.forEach((slide, i) => {
          slide.order = i;
        });

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          currentSlideIndex: index + 1,
        });

        get().saveToHistory();
      },

      deleteSlide: (index) => {
        const { presentation, currentSlideIndex } = get();
        if (!presentation || presentation.slides.length <= 1) return;

        const updatedSlides = presentation.slides.filter((_, i) => i !== index);

        // Update order numbers
        updatedSlides.forEach((slide, i) => {
          slide.order = i;
        });

        // Adjust current slide index if needed
        let newIndex = currentSlideIndex;
        if (currentSlideIndex >= updatedSlides.length) {
          newIndex = updatedSlides.length - 1;
        } else if (currentSlideIndex > index) {
          newIndex = currentSlideIndex - 1;
        }

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          currentSlideIndex: newIndex,
          selectedElementId: null,
        });

        get().saveToHistory();
      },

      reorderSlides: (fromIndex, toIndex) => {
        const { presentation } = get();
        if (!presentation) return;

        const slides = [...presentation.slides];
        const [removed] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, removed);

        // Update order numbers
        slides.forEach((slide, i) => {
          slide.order = i;
        });

        set({
          presentation: {
            ...presentation,
            slides,
            updatedAt: new Date(),
          },
          currentSlideIndex: toIndex,
        });

        get().saveToHistory();
      },

      updateSlide: (index, updates) => {
        const { presentation } = get();
        if (!presentation || !presentation.slides[index]) return;

        const updatedSlides = [...presentation.slides];
        updatedSlides[index] = {
          ...updatedSlides[index],
          ...updates,
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
        });

        get().saveToHistory();
      },

      setCurrentSlide: (index) => {
        const { presentation } = get();
        if (!presentation) return;

        const validIndex = Math.max(
          0,
          Math.min(index, presentation.slides.length - 1)
        );

        set({
          currentSlideIndex: validIndex,
          selectedElementId: null,
        });
      },

      // ========================================
      // ELEMENT MANAGEMENT
      // ========================================

      addElement: (element) => {
        const { presentation, currentSlideIndex } = get();
        if (!presentation) return;

        const newElement: SlideElement = {
          ...element,
          id: uuidv4(),
        };

        const updatedSlides = [...presentation.slides];
        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          elements: [...updatedSlides[currentSlideIndex].elements, newElement],
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          selectedElementId: newElement.id,
        });

        get().saveToHistory();
      },

      updateElement: (elementId, updates) => {
        const { presentation, currentSlideIndex } = get();
        if (!presentation) return;

        const updatedSlides = [...presentation.slides];
        const elements = updatedSlides[currentSlideIndex].elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        );

        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          elements,
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
        });
      },

      deleteElement: (elementId) => {
        const { presentation, currentSlideIndex, selectedElementId } = get();
        if (!presentation) return;

        const updatedSlides = [...presentation.slides];
        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          elements: updatedSlides[currentSlideIndex].elements.filter(
            (el) => el.id !== elementId
          ),
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          selectedElementId:
            selectedElementId === elementId ? null : selectedElementId,
        });

        get().saveToHistory();
      },

      selectElement: (elementId) => {
        set({ selectedElementId: elementId });
      },

      duplicateElement: (elementId) => {
        const { presentation, currentSlideIndex } = get();
        if (!presentation) return;

        const element = presentation.slides[currentSlideIndex].elements.find(
          (el) => el.id === elementId
        );

        if (!element) return;

        const duplicated: SlideElement = {
          ...JSON.parse(JSON.stringify(element)),
          id: uuidv4(),
          position: {
            ...element.position,
            x: element.position.x + 2,
            y: element.position.y + 2,
          },
        };

        const updatedSlides = [...presentation.slides];
        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          elements: [...updatedSlides[currentSlideIndex].elements, duplicated],
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
          selectedElementId: duplicated.id,
        });

        get().saveToHistory();
      },

      // ========================================
      // TEMPLATE OPERATIONS
      // ========================================

      applyTemplate: (templateId) => {
        const { presentation, currentSlideIndex, templateLibrary } = get();
        if (!presentation) return;

        const template = templateLibrary.find((t) => t.id === templateId);
        if (!template) return;

        const currentSlide = presentation.slides[currentSlideIndex];
        const elements: SlideElement[] = template.defaultElements.map((el) => ({
          ...el,
          id: uuidv4(),
        }));

        const updatedSlides = [...presentation.slides];
        updatedSlides[currentSlideIndex] = {
          ...currentSlide,
          templateId,
          elements,
          background: template.defaultBackground || currentSlide.background,
        };

        set({
          presentation: {
            ...presentation,
            slides: updatedSlides,
            updatedAt: new Date(),
          },
        });

        get().saveToHistory();
      },

      addCustomTemplate: (template) => {
        set((state) => ({
          templateLibrary: [...state.templateLibrary, template],
        }));
      },

      // ========================================
      // THEME OPERATIONS
      // ========================================

      setTheme: (theme) => {
        const { presentation } = get();
        if (!presentation) return;

        set({
          presentation: {
            ...presentation,
            theme,
            updatedAt: new Date(),
          },
        });

        get().saveToHistory();
      },

      updateTheme: (updates) => {
        const { presentation } = get();
        if (!presentation) return;

        set({
          presentation: {
            ...presentation,
            theme: {
              ...presentation.theme,
              ...updates,
            },
            updatedAt: new Date(),
          },
        });
      },

      addThemePreset: (theme) => {
        set((state) => ({
          themePresets: [...state.themePresets, theme],
        }));
      },

      // ========================================
      // ANIMATION OPERATIONS
      // ========================================

      setElementAnimation: (elementId, animation) => {
        get().updateElement(elementId, { animation });
      },

      setSlideTransition: (slideIndex, transition) => {
        get().updateSlide(slideIndex, { transition });
      },

      // ========================================
      // VIEW CONTROLS
      // ========================================

      setViewMode: (viewMode) => set({ viewMode }),

      setZoom: (zoom) =>
        set({ zoom: Math.max(25, Math.min(200, zoom)) }),

      toggleGrid: () =>
        set((state) => ({ showGrid: !state.showGrid })),

      toggleRulers: () =>
        set((state) => ({ showRulers: !state.showRulers })),

      // ========================================
      // PANEL TOGGLES
      // ========================================

      toggleTemplateLibrary: () =>
        set((state) => ({ showTemplateLibrary: !state.showTemplateLibrary })),

      toggleAssetLibrary: () =>
        set((state) => ({ showAssetLibrary: !state.showAssetLibrary })),

      toggleThemeEditor: () =>
        set((state) => ({ showThemeEditor: !state.showThemeEditor })),

      toggleAnimationBuilder: () =>
        set((state) => ({ showAnimationBuilder: !state.showAnimationBuilder })),

      toggleSpeakerNotes: () =>
        set((state) => ({ showSpeakerNotes: !state.showSpeakerNotes })),

      // ========================================
      // HISTORY (UNDO/REDO)
      // ========================================

      saveToHistory: () => {
        const { presentation, history, historyIndex } = get();
        if (!presentation) return;

        // Remove any redo history after current index
        const newHistory = history.slice(0, historyIndex + 1);

        // Add current state (deep clone)
        newHistory.push(JSON.parse(JSON.stringify(presentation)));

        // Limit history size
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        set({
          presentation: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        set({
          presentation: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
        });
      },

      // ========================================
      // CLIPBOARD OPERATIONS
      // ========================================

      copyElement: (elementId) => {
        const { presentation, currentSlideIndex } = get();
        if (!presentation) return;

        const element = presentation.slides[currentSlideIndex].elements.find(
          (el) => el.id === elementId
        );

        if (element) {
          set({
            clipboard: JSON.parse(JSON.stringify(element)),
            clipboardType: 'element',
          });
        }
      },

      copySlide: (slideIndex) => {
        const { presentation } = get();
        if (!presentation) return;

        const slide = presentation.slides[slideIndex];
        if (slide) {
          set({
            clipboard: JSON.parse(JSON.stringify(slide)),
            clipboardType: 'slide',
          });
        }
      },

      paste: () => {
        const { clipboard, clipboardType } = get();
        if (!clipboard || !clipboardType) return;

        if (clipboardType === 'element') {
          get().addElement({
            ...(clipboard as SlideElement),
            position: {
              ...(clipboard as SlideElement).position,
              x: (clipboard as SlideElement).position.x + 2,
              y: (clipboard as SlideElement).position.y + 2,
            },
          });
        } else if (clipboardType === 'slide') {
          const { presentation } = get();
          if (!presentation) return;

          get().addSlide(presentation.slides.length - 1);
          const newIndex = presentation.slides.length;
          get().updateSlide(newIndex, {
            ...(clipboard as Slide),
            id: uuidv4(),
            order: newIndex,
          });
        }
      },

      // ========================================
      // SPEAKER NOTES
      // ========================================

      updateSpeakerNotes: (slideIndex, notes) => {
        get().updateSlide(slideIndex, { speakerNotes: notes });
      },

      // ========================================
      // THUMBNAIL GENERATION
      // ========================================

      updateSlideThumbnail: (slideIndex, thumbnail) => {
        get().updateSlide(slideIndex, { thumbnail });
      },

      // ========================================
      // HTML IMPORT/EXPORT
      // ========================================

      parseHtmlToSlides: (html) => {
        // Parse HTML content and convert to slide structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find slide sections (implementation depends on HTML structure)
        const slideElements = doc.querySelectorAll('.slide, section, [data-slide]');

        if (slideElements.length === 0) {
          // If no explicit slides, create one slide with the entire content
          const bodyContent = doc.body;
          const elements = parseElementsFromHtml(bodyContent);

          const now = new Date();
          const slide: Slide = {
            id: uuidv4(),
            order: 0,
            title: doc.querySelector('h1, h2')?.textContent || 'Imported Slide',
            elements,
            speakerNotes: '',
          };

          set({
            presentation: {
              id: uuidv4(),
              title: doc.querySelector('title')?.textContent || 'Imported Presentation',
              slides: [slide],
              theme: DEFAULT_THEME,
              metadata: { topic: 'Imported' },
              createdAt: now,
              updatedAt: now,
            },
            currentSlideIndex: 0,
          });
          return;
        }

        const slides: Slide[] = Array.from(slideElements).map((el, i) => {
          const title = el.querySelector('h1, h2, .title')?.textContent || `Slide ${i + 1}`;
          const elements = parseElementsFromHtml(el as HTMLElement);

          return {
            id: uuidv4(),
            order: i,
            title,
            elements,
            speakerNotes: '',
          };
        });

        const now = new Date();
        set({
          presentation: {
            id: uuidv4(),
            title: doc.querySelector('title')?.textContent || 'Imported Presentation',
            slides,
            theme: DEFAULT_THEME,
            metadata: { topic: 'Imported' },
            createdAt: now,
            updatedAt: now,
          },
          currentSlideIndex: 0,
        });
      },

      exportToHtml: () => {
        const { presentation } = get();
        if (!presentation) return '';

        // Generate HTML from slides
        // This would need to match the expected output format
        const slidesHtml = presentation.slides
          .map(
            (slide) => `
          <section class="slide" data-slide-id="${slide.id}">
            <h2>${slide.title}</h2>
            ${slide.elements.map((el) => elementToHtml(el)).join('\n')}
          </section>
        `
          )
          .join('\n');

        return `
<!DOCTYPE html>
<html>
<head>
  <title>${presentation.title}</title>
  <style>
    :root {
      --primary: ${presentation.theme.colors.primary};
      --background: ${presentation.theme.colors.background};
      --text: ${presentation.theme.colors.text};
    }
    body {
      font-family: ${presentation.theme.typography.bodyFont};
      background: var(--background);
      color: var(--text);
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>
        `.trim();
      },
    }),
    {
      name: 'slide-editor-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        themePresets: state.themePresets,
        templateLibrary: state.templateLibrary,
        zoom: state.zoom,
        showGrid: state.showGrid,
        showRulers: state.showRulers,
        showSpeakerNotes: state.showSpeakerNotes,
      }),
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createDefaultSlide(order: number, title: string): Slide {
  return {
    id: uuidv4(),
    order,
    title,
    elements: [
      {
        id: uuidv4(),
        type: 'heading',
        content: title,
        position: { x: 5, y: 10, width: 90, height: 15 },
        style: {
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
    ],
    speakerNotes: '',
  };
}

function createSlideFromTemplate(
  order: number,
  template?: SlideTemplate
): Slide {
  if (!template) {
    return createDefaultSlide(order, 'New Slide');
  }

  return {
    id: uuidv4(),
    order,
    templateId: template.id,
    title: template.name,
    elements: template.defaultElements.map((el) => ({
      ...el,
      id: uuidv4(),
    })),
    speakerNotes: '',
    background: template.defaultBackground,
  };
}

/**
 * Parse HTML elements into SlideElement objects
 * Extracts content from HTML and creates slide elements with default positioning
 */
function parseElementsFromHtml(container: HTMLElement): SlideElement[] {
  const elements: SlideElement[] = [];
  let currentY = 10; // Start position percentage

  // Get all child elements in order
  const children = Array.from(container.children);

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();
    const textContent = child.textContent?.trim() || '';

    if (!textContent) continue; // Skip empty elements

    let element: Omit<SlideElement, 'id'> | null = null;

    switch (tagName) {
      case 'h1':
        element = {
          type: 'heading',
          content: textContent,
          position: { x: 5, y: currentY, width: 90, height: 12 },
          style: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: child.className.includes('center') ? 'center' : 'left',
          },
        };
        currentY += 15;
        break;

      case 'h2':
        element = {
          type: 'subheading',
          content: textContent,
          position: { x: 5, y: currentY, width: 90, height: 10 },
          style: {
            fontSize: '1.875rem',
            fontWeight: 'semibold',
            textAlign: child.className.includes('center') ? 'center' : 'left',
          },
        };
        currentY += 12;
        break;

      case 'h3':
        element = {
          type: 'subheading',
          content: textContent,
          position: { x: 5, y: currentY, width: 90, height: 8 },
          style: {
            fontSize: '1.5rem',
            fontWeight: 'semibold',
          },
        };
        currentY += 10;
        break;

      case 'p':
        element = {
          type: 'paragraph',
          content: textContent,
          position: { x: 5, y: currentY, width: 90, height: 8 },
          style: {
            fontSize: '1rem',
          },
        };
        currentY += 10;
        break;

      case 'ul':
        // Extract list items
        const listItems = Array.from(child.querySelectorAll('li'))
          .map((li) => li.textContent?.trim())
          .filter(Boolean)
          .join('\n');

        if (listItems) {
          element = {
            type: 'bullet-list',
            content: listItems,
            position: { x: 5, y: currentY, width: 90, height: 15 },
            style: {
              fontSize: '1rem',
            },
          };
          currentY += 18;
        }
        break;

      case 'ol':
        // Extract numbered list items
        const numberedItems = Array.from(child.querySelectorAll('li'))
          .map((li) => li.textContent?.trim())
          .filter(Boolean)
          .join('\n');

        if (numberedItems) {
          element = {
            type: 'numbered-list',
            content: numberedItems,
            position: { x: 5, y: currentY, width: 90, height: 15 },
            style: {
              fontSize: '1rem',
            },
          };
          currentY += 18;
        }
        break;

      case 'img':
        const imgSrc = child.getAttribute('src');
        if (imgSrc) {
          element = {
            type: 'image',
            content: imgSrc,
            position: { x: 10, y: currentY, width: 80, height: 30 },
          };
          currentY += 35;
        }
        break;

      case 'blockquote':
        element = {
          type: 'quote',
          content: textContent,
          position: { x: 10, y: currentY, width: 80, height: 12 },
          style: {
            fontSize: '1.25rem',
            fontWeight: 'medium',
            textAlign: 'center',
          },
        };
        currentY += 15;
        break;

      case 'pre':
      case 'code':
        element = {
          type: 'code-block',
          content: textContent,
          position: { x: 5, y: currentY, width: 90, height: 15 },
          style: {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
          },
        };
        currentY += 18;
        break;

      case 'hr':
        element = {
          type: 'divider',
          content: '',
          position: { x: 10, y: currentY, width: 80, height: 2 },
        };
        currentY += 5;
        break;

      default:
        // For sections and divs, recursively parse children
        if (tagName === 'section' || tagName === 'div') {
          const childElements = parseElementsFromHtml(child as HTMLElement);
          elements.push(...childElements);
        }
    }

    if (element) {
      elements.push({
        ...element,
        id: uuidv4(),
      });
    }
  }

  return elements;
}

function elementToHtml(element: SlideElement): string {
  switch (element.type) {
    case 'heading':
      return `<h1 style="font-size: ${element.style?.fontSize || '2rem'}">${element.content}</h1>`;
    case 'subheading':
      return `<h2>${element.content}</h2>`;
    case 'paragraph':
      return `<p>${element.content}</p>`;
    case 'bullet-list':
      return `<ul>${element.content
        .split('\n')
        .map((item) => `<li>${item}</li>`)
        .join('')}</ul>`;
    case 'image':
      return `<img src="${element.content}" alt="" />`;
    default:
      return `<div>${element.content}</div>`;
  }
}

export default useSlideStore;

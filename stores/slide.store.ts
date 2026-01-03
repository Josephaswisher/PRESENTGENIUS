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

        const newHistory = history.slice(0, historyIndex + 1);

        const serialize = (payload: Presentation) => {
          const { createdAt, updatedAt, ...rest } = payload;
          return JSON.stringify(rest);
        };

        const lastSnapshot = newHistory.length > 0 ? serialize(newHistory[newHistory.length - 1]) : null;
        const currentSnapshot = serialize(presentation);

        if (lastSnapshot === currentSnapshot) {
          return;
        }

        newHistory.push(JSON.parse(JSON.stringify(presentation)));

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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Try multiple strategies to find slide sections
        let slideElements: HTMLElement[] = [];
        const explicitSlides = doc.querySelectorAll('[data-slide-id], .slide, [data-slide]');
        if (explicitSlides.length > 0) {
          slideElements = Array.from(explicitSlides) as HTMLElement[];
        }

        if (slideElements.length === 0) {
          const articles = doc.querySelectorAll('article, section');
          if (articles.length > 0) {
            slideElements = Array.from(articles) as HTMLElement[];
          }
        }

        if (slideElements.length === 0) {
          const potentialSlides = Array.from(doc.querySelectorAll('div')).filter((div) => {
            const directHeading = Array.from(div.children).some(
              (child) => child.tagName === 'H1' || child.tagName === 'H2'
            );
            const hasContent = (div.textContent?.trim().length || 0) > 50;
            return directHeading && hasContent;
          });
          if (potentialSlides.length > 0) {
            slideElements = potentialSlides as HTMLElement[];
          }
        }

        if (slideElements.length === 0) {
          const headings = doc.querySelectorAll('h1, h2');
          if (headings.length > 1) {
            slideElements = [] as HTMLElement[];
            headings.forEach((heading) => {
              const wrapper = doc.createElement('section');
              wrapper.appendChild(heading.cloneNode(true));
              let sibling = heading.nextElementSibling;
              while (sibling && !['H1', 'H2'].includes(sibling.tagName)) {
                wrapper.appendChild(sibling.cloneNode(true));
                sibling = sibling.nextElementSibling;
              }
              slideElements.push(wrapper as HTMLElement);
            });
          }
        }

        if (slideElements.length === 0) {
          const bodyContent = doc.body;
          const elements = parseElementsFromHtml(bodyContent as HTMLElement);
          const now = new Date();
          const slide: Slide = {
            id: uuidv4(),
            order: 0,
            title: doc.querySelector('h1, h2')?.textContent || 'Imported Slide',
            elements,
            speakerNotes: '',
            background: parseSlideBackground(bodyContent as HTMLElement),
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

        const slides: Slide[] = slideElements.map((el, i) => {
          const title = el.getAttribute('data-title') || el.querySelector('h1, h2, .title')?.textContent || `Slide ${i + 1}`;
          const elements = parseElementsFromHtml(el);

          return {
            id: uuidv4(),
            order: i,
            title,
            elements,
            speakerNotes: el.querySelector('aside.notes')?.textContent?.trim() || '',
            background: parseSlideBackground(el),
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

        const theme = presentation.theme || DEFAULT_THEME;
        const baseStyles = `
:root {
  --primary: ${theme.colors.primary};
  --secondary: ${theme.colors.secondary};
  --accent: ${theme.colors.accent};
  --background: ${theme.colors.background};
  --text: ${theme.colors.text};
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  background: var(--background);
  color: var(--text);
  font-family: ${theme.typography.bodyFont};
}
.slide {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: ${theme.spacing?.contentPadding || '2rem'};
  overflow: hidden;
}
.slide-element {
  position: absolute;
  word-break: break-word;
}
.slide img { max-width: 100%; max-height: 100%; }
`; 

        const slidesHtml = presentation.slides
          .map((slide) => {
            const backgroundStyle = getSlideBackgroundStyle(slide);
            const elementsHtml = slide.elements.map((el) => elementToHtml(el, theme)).join('\n');
            const notes = slide.speakerNotes
              ? `<aside class="notes">${escapeHtml(slide.speakerNotes)}</aside>`
              : '';

            return `
  <section class="slide" data-slide-id="${slide.id}" data-slide-index="${slide.order}"${backgroundStyle ? ` style="${backgroundStyle}"` : ''}>
    ${elementsHtml}
    ${notes}
  </section>`;
          })
          .join('\n');

        return `<!DOCTYPE html>
<html>
<head>
  <title>${presentation.title}</title>
  <style>${baseStyles}</style>
</head>
<body>
${slidesHtml}
</body>
</html>`;
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

function parseSlideBackground(container: HTMLElement): SlideBackground | undefined {
  const bgData = (container.getAttribute('data-background') || '').trim();
  const styleBackground = container.style.background || container.style.backgroundImage || '';
  const backgroundValue = bgData || styleBackground;

  if (!backgroundValue) return undefined;

  if (backgroundValue.includes('gradient')) {
    return { type: 'gradient', value: backgroundValue };
  }

  if (backgroundValue.includes('url(')) {
    return { type: 'image', value: backgroundValue };
  }

  return { type: 'solid', value: backgroundValue } as SlideBackground;
}

function parseElementsFromHtml(container: HTMLElement): SlideElement[] {
  const elements: SlideElement[] = [];
  let currentY = 10; // fallback positioning

  // Prefer structured data attributes if present
  const structured = Array.from(
    container.querySelectorAll('[data-element-id], .slide-element')
  ) as HTMLElement[];

  if (structured.length > 0) {
    structured.forEach((node) => {
      const type = (node.dataset.elementType as SlideElement['type']) || 'paragraph';
      const posData = node.dataset.pos?.split(',').map((v) => parseFloat(v)) || [];
      const position = posData.length === 4
        ? { x: posData[0], y: posData[1], width: posData[2], height: posData[3] }
        : {
            x: parseFloat(node.style.left) || 0,
            y: parseFloat(node.style.top) || 0,
            width: parseFloat(node.style.width) || 90,
            height: parseFloat(node.style.height) || 10,
          };

      const style = {
        fontSize: node.style.fontSize || undefined,
        fontWeight: (node.style.fontWeight as ElementStyle['fontWeight']) || undefined,
        fontFamily: node.style.fontFamily || undefined,
        color: node.style.color || undefined,
        backgroundColor: node.style.backgroundColor || undefined,
        textAlign: (node.style.textAlign as ElementStyle['textAlign']) || undefined,
        padding: node.style.padding || undefined,
        borderRadius: node.style.borderRadius || undefined,
        opacity: node.style.opacity ? Number(node.style.opacity) : undefined,
      };

      let content = '';
      if (type === 'bullet-list' || type === 'numbered-list') {
        const items = Array.from(node.querySelectorAll('li')).map((li) => li.textContent?.trim()).filter(Boolean) as string[];
        content = items.join('\n');
      } else if (type === 'image') {
        const img = node.querySelector('img');
        content = img?.getAttribute('src') || node.getAttribute('data-src') || '';
      } else if (type === 'code-block') {
        const code = node.querySelector('code');
        content = code?.textContent || node.textContent || '';
      } else {
        content = node.textContent?.trim() || '';
      }

      elements.push({
        id: node.dataset.elementId || uuidv4(),
        type,
        content,
        position,
        style,
      });
    });

    return elements;
  }

  // Fallback parsing for generic HTML
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
            textAlign: (child as HTMLElement).style.textAlign as any || 'left',
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
            textAlign: (child as HTMLElement).style.textAlign as any || 'left',
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

      case 'ul': {
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
      }

      case 'ol': {
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
      }

      case 'img': {
        const imgSrc = (child as HTMLImageElement).getAttribute('src');
        if (imgSrc) {
          element = {
            type: 'image',
            content: imgSrc,
            position: { x: 10, y: currentY, width: 80, height: 30 },
          };
          currentY += 35;
        }
        break;
      }

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

function elementToHtml(element: SlideElement, theme: ThemeConfig): string {
  const { position, style = {} } = element;
  const baseStyle = [
    `left: ${position.x}%`,
    `top: ${position.y}%`,
    `width: ${position.width}%`,
    `height: ${position.height}%`,
    `font-size: ${style.fontSize || '1rem'}`,
    style.fontWeight ? `font-weight: ${style.fontWeight}` : '',
    style.fontFamily ? `font-family: ${style.fontFamily}` : '',
    style.color ? `color: ${style.color}` : '',
    style.backgroundColor ? `background: ${style.backgroundColor}` : '',
    style.textAlign ? `text-align: ${style.textAlign}` : '',
    style.padding ? `padding: ${style.padding}` : '',
    style.borderRadius ? `border-radius: ${style.borderRadius}` : '',
    style.opacity !== undefined ? `opacity: ${style.opacity}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const attrs = `class="slide-element" data-element-id="${element.id}" data-element-type="${element.type}" data-pos="${position.x},${position.y},${position.width},${position.height}" style="${baseStyle}"`;

  switch (element.type) {
    case 'heading':
      return `<div ${attrs}><h1 class="m-0">${escapeHtml(element.content)}</h1></div>`;
    case 'subheading':
      return `<div ${attrs}><h2 class="m-0">${escapeHtml(element.content)}</h2></div>`;
    case 'paragraph':
      return `<div ${attrs}><p class="m-0 whitespace-pre-wrap">${escapeHtml(element.content).replace(/\n/g, '<br />')}</p></div>`;
    case 'bullet-list':
      return `<div ${attrs}><ul class="m-0 pl-5 space-y-1">${element.content
        .split('\n')
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul></div>`;
    case 'numbered-list':
      return `<div ${attrs}><ol class="m-0 pl-5 space-y-1">${element.content
        .split('\n')
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ol></div>`;
    case 'image':
      return `<div ${attrs}><img src="${escapeHtml(element.content)}" alt="" class="w-full h-full object-cover rounded" /></div>`;
    case 'quote':
      return `<div ${attrs}><blockquote class="m-0 italic border-l-4" style="border-color: ${theme.colors.accent}; padding-left: 1rem;">${escapeHtml(element.content)}</blockquote></div>`;
    case 'divider':
      return `<div ${attrs}><hr class="border-t border-current" /></div>`;
    case 'code-block':
      return `<div ${attrs}><pre class="m-0 p-3 bg-zinc-900 rounded font-mono text-sm overflow-x-auto"><code>${escapeHtml(element.content)}</code></pre></div>`;
    default:
      return `<div ${attrs}>${escapeHtml(element.content)}</div>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSlideBackgroundStyle(slide: Slide): string {
  const background = slide.background;
  if (!background) return `background: ${DEFAULT_THEME.colors.background};`;

  switch (background.type) {
    case 'gradient':
      return `background: ${background.value};`;
    case 'image':
      return `background: ${background.value}; background-size: cover; background-position: center;`;
    case 'pattern':
      return `background: ${background.value};`;
    case 'solid':
    default:
      return `background: ${background.value};`;
  }
}

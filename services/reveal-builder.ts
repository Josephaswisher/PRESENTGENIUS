/**
 * VibePresenterPro - Reveal.js Presentation Builder
 * Converts generated artifacts into professional Reveal.js presentations
 */

export interface SlideContent {
  id: string;
  title?: string;
  html: string;
  notes?: string;
  background?: string;
  transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom' | 'none';
}

export interface PresentationConfig {
  title: string;
  author?: string;
  theme?: 'medical-dark' | 'medical-light' | 'board-review' | 'clinical';
  transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom' | 'none';
  showProgress?: boolean;
  showSlideNumber?: boolean;
  autoSlide?: number;
  loop?: boolean;
}

// Medical education color themes
const THEMES = {
  'medical-dark': {
    background: '#0a0a0f',
    primary: '#06b6d4', // cyan
    secondary: '#8b5cf6', // violet
    text: '#f4f4f5',
    muted: '#71717a',
    accent: '#22d3ee',
    critical: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
  },
  'medical-light': {
    background: '#ffffff',
    primary: '#0891b2',
    secondary: '#7c3aed',
    text: '#18181b',
    muted: '#52525b',
    accent: '#06b6d4',
    critical: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
  },
  'board-review': {
    background: '#1e1b4b', // indigo-950
    primary: '#818cf8', // indigo-400
    secondary: '#f472b6', // pink-400
    text: '#e0e7ff',
    muted: '#a5b4fc',
    accent: '#c4b5fd',
    critical: '#f87171',
    warning: '#fbbf24',
    success: '#4ade80',
  },
  'clinical': {
    background: '#042f2e', // teal-950
    primary: '#2dd4bf', // teal-400
    secondary: '#38bdf8', // sky-400
    text: '#f0fdfa',
    muted: '#5eead4',
    accent: '#67e8f9',
    critical: '#fb7185',
    warning: '#fcd34d',
    success: '#86efac',
  },
};

/**
 * Generate CSS for the selected theme
 */
function generateThemeCSS(themeName: keyof typeof THEMES): string {
  const theme = THEMES[themeName];

  return `
    :root {
      --r-background-color: ${theme.background};
      --r-main-font: 'Inter', system-ui, sans-serif;
      --r-main-font-size: 42px;
      --r-main-color: ${theme.text};
      --r-heading-font: 'Inter', system-ui, sans-serif;
      --r-heading-color: ${theme.primary};
      --r-heading-letter-spacing: -0.02em;
      --r-heading-text-transform: none;
      --r-heading1-size: 2.5em;
      --r-heading2-size: 1.8em;
      --r-heading3-size: 1.3em;
      --r-link-color: ${theme.accent};
      --r-link-color-hover: ${theme.primary};
      --r-selection-background-color: ${theme.secondary};
      --r-selection-color: #fff;

      /* Medical-specific */
      --med-critical: ${theme.critical};
      --med-warning: ${theme.warning};
      --med-success: ${theme.success};
      --med-muted: ${theme.muted};
    }

    .reveal {
      font-family: var(--r-main-font);
    }

    .reveal h1, .reveal h2, .reveal h3 {
      font-weight: 700;
      margin-bottom: 0.5em;
    }

    .reveal .slides section {
      padding: 40px;
    }

    /* Medical badges */
    .reveal .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.65em;
      font-weight: 600;
      margin: 0 4px;
    }

    .reveal .badge-critical {
      background: rgba(239, 68, 68, 0.2);
      color: ${theme.critical};
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .reveal .badge-warning {
      background: rgba(245, 158, 11, 0.2);
      color: ${theme.warning};
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .reveal .badge-success {
      background: rgba(34, 197, 94, 0.2);
      color: ${theme.success};
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .reveal .badge-info {
      background: rgba(6, 182, 212, 0.2);
      color: ${theme.primary};
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    /* Clinical pearls box */
    .reveal .clinical-pearl {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
      border-left: 4px solid ${theme.primary};
      padding: 20px 24px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
      text-align: left;
    }

    .reveal .clinical-pearl::before {
      content: '💡';
      font-size: 1.2em;
      margin-right: 8px;
    }

    /* Quiz options */
    .reveal .quiz-option {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      margin: 12px 0;
      border-radius: 12px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .reveal .quiz-option:hover {
      background: rgba(6, 182, 212, 0.1);
      border-color: ${theme.primary};
    }

    .reveal .quiz-option.correct {
      background: rgba(34, 197, 94, 0.15);
      border-color: ${theme.success};
    }

    .reveal .quiz-option.incorrect {
      background: rgba(239, 68, 68, 0.15);
      border-color: ${theme.critical};
    }

    /* Two-column layout */
    .reveal .columns {
      display: flex;
      gap: 40px;
    }

    .reveal .column {
      flex: 1;
    }

    /* Speaker notes styling */
    .reveal .speaker-notes {
      font-size: 0.8em;
      color: var(--med-muted);
    }

    /* Progress bar */
    .reveal .progress {
      height: 4px;
      background: ${theme.primary};
    }

    /* Slide number */
    .reveal .slide-number {
      font-size: 14px;
      color: var(--med-muted);
    }

    /* Fragment animations */
    .reveal .fragment.highlight-critical {
      opacity: 1;
    }

    .reveal .fragment.highlight-critical.visible {
      color: ${theme.critical};
      font-weight: 600;
    }
  `;
}

/**
 * Build a complete Reveal.js presentation HTML
 */
export function buildPresentation(
  slides: SlideContent[],
  config: PresentationConfig
): string {
  const theme = config.theme || 'medical-dark';
  const themeCSS = generateThemeCSS(theme);

  const slidesHTML = slides.map((slide) => {
    const bgAttr = slide.background ? `data-background="${slide.background}"` : '';
    const transAttr = slide.transition ? `data-transition="${slide.transition}"` : '';
    const notesHTML = slide.notes ? `<aside class="notes">${slide.notes}</aside>` : '';

    return `
      <section ${bgAttr} ${transAttr}>
        ${slide.title ? `<h2>${slide.title}</h2>` : ''}
        ${slide.html}
        ${notesHTML}
      </section>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>

  <!-- Reveal.js CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/black.css">

  <!-- Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">

  <!-- Custom Medical Theme -->
  <style>
    ${themeCSS}
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHTML}
    </div>
  </div>

  <!-- Reveal.js -->
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      slideNumber: ${config.showSlideNumber !== false},
      progress: ${config.showProgress !== false},
      transition: '${config.transition || 'slide'}',
      ${config.autoSlide ? `autoSlide: ${config.autoSlide},` : ''}
      ${config.loop ? 'loop: true,' : ''}

      // Medical presentation optimizations
      width: 1920,
      height: 1080,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 2.0,

      // Keyboard shortcuts
      keyboard: {
        // 'Q' for quiz reveal
        81: function() {
          document.querySelectorAll('.quiz-option').forEach(el => {
            el.classList.add('revealed');
          });
        }
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Convert a single HTML artifact into slides
 * Splits on <hr>, <section>, or ### headers
 */
export function artifactToSlides(html: string, title: string): SlideContent[] {
  const slides: SlideContent[] = [];

  // Add title slide
  slides.push({
    id: 'title',
    html: `
      <h1>${title}</h1>
      <p style="color: var(--med-muted); font-size: 0.6em; margin-top: 2em;">
        Created with VibePresenterPro
      </p>
    `,
  });

  // Split content by common separators
  // Try <hr> first, then look for section breaks
  let sections = html.split(/<hr\s*\/?>/gi);

  if (sections.length === 1) {
    // Try splitting by h2 headers
    sections = html.split(/(?=<h2)/gi).filter(s => s.trim());
  }

  if (sections.length === 1) {
    // No natural breaks, use the whole content
    slides.push({
      id: 'content-1',
      html: html,
    });
  } else {
    sections.forEach((section, i) => {
      if (section.trim()) {
        // Extract title from first h2/h3 if present
        const titleMatch = section.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
        const sectionTitle = titleMatch ? titleMatch[1] : undefined;

        slides.push({
          id: `content-${i + 1}`,
          title: sectionTitle,
          html: section.replace(/<h[23][^>]*>[^<]+<\/h[23]>/i, ''), // Remove extracted title
        });
      }
    });
  }

  return slides;
}

/**
 * Create a quiz slide from question data
 */
export function createQuizSlide(
  question: string,
  options: { label: string; text: string; correct?: boolean }[],
  explanation?: string
): SlideContent {
  const optionsHTML = options.map((opt) => `
    <div class="quiz-option ${opt.correct ? 'correct' : ''}" data-correct="${opt.correct || false}">
      <strong>${opt.label}.</strong> ${opt.text}
    </div>
  `).join('');

  const explanationHTML = explanation ? `
    <div class="fragment clinical-pearl" style="margin-top: 30px;">
      ${explanation}
    </div>
  ` : '';

  return {
    id: `quiz-${Date.now()}`,
    html: `
      <div style="text-align: left;">
        <p style="font-size: 0.9em; margin-bottom: 30px;">${question}</p>
        ${optionsHTML}
        ${explanationHTML}
      </div>
    `,
  };
}

/**
 * Create a clinical pearl slide
 */
export function createPearlSlide(
  title: string,
  pearls: string[]
): SlideContent {
  const pearlsHTML = pearls.map((pearl, i) => `
    <div class="fragment fade-up" style="margin: 16px 0;">
      <span class="badge badge-info">${i + 1}</span>
      ${pearl}
    </div>
  `).join('');

  return {
    id: `pearls-${Date.now()}`,
    title: `💡 ${title}`,
    html: `
      <div style="text-align: left; font-size: 0.85em;">
        ${pearlsHTML}
      </div>
    `,
  };
}

/**
 * Create a comparison/differential slide
 */
export function createComparisonSlide(
  title: string,
  items: { name: string; features: string[] }[]
): SlideContent {
  const columnsHTML = items.map((item) => `
    <div class="column" style="background: rgba(255,255,255,0.03); padding: 24px; border-radius: 12px;">
      <h3 style="font-size: 0.8em; margin-bottom: 20px;">${item.name}</h3>
      <ul style="font-size: 0.6em; text-align: left; list-style: none; padding: 0;">
        ${item.features.map(f => `<li style="margin: 8px 0;">• ${f}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return {
    id: `comparison-${Date.now()}`,
    title,
    html: `<div class="columns">${columnsHTML}</div>`,
  };
}

/**
 * Export presentation as standalone HTML file
 */
export function exportPresentationHTML(
  slides: SlideContent[],
  config: PresentationConfig
): void {
  const html = buildPresentation(slides, config);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open presentation in new window for presenting
 */
export function openPresentation(
  slides: SlideContent[],
  config: PresentationConfig
): Window | null {
  const html = buildPresentation(slides, config);
  const win = window.open('', '_blank');

  if (win) {
    win.document.write(html);
    win.document.close();
  }

  return win;
}

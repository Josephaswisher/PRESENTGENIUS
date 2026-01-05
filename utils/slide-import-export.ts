/**
 * Slide Import/Export Utilities
 * - URL fetch for importing HTML from web
 * - File drag-and-drop handling
 * - JSON import/export for full presentation backup
 */

export interface ImportedSlide {
  id: string;
  title: string;
  html: string;
}

export interface PresentationBackup {
  version: string;
  exportedAt: number;
  title: string;
  slides: Array<{
    id: string;
    title: string;
    html: string;
  }>;
  metadata?: {
    totalSlides: number;
    createdBy?: string;
  };
}

export interface ImportResult {
  success: boolean;
  slides?: ImportedSlide[];
  error?: string;
  source?: 'url' | 'file' | 'json';
}

/**
 * Fetch HTML content from a URL
 */
export async function fetchHtmlFromUrl(url: string): Promise<ImportResult> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { success: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }

    // Use a CORS proxy for cross-origin requests
    // In production, you'd use your own proxy server
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,*/*'
      }
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch: ${response.status} ${response.statusText}` };
    }

    const html = await response.text();
    const slides = parseHtmlToSlides(html);

    if (slides.length === 0) {
      return { success: false, error: 'No slide content found in the fetched HTML' };
    }

    return { success: true, slides, source: 'url' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to fetch URL: ${message}` };
  }
}

/**
 * Parse HTML content and extract slides
 */
export function parseHtmlToSlides(html: string): ImportedSlide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const slides: ImportedSlide[] = [];

  // Try different slide selectors
  let sections = doc.querySelectorAll('section.slide-section, section[id^="slide-"]');
  if (sections.length === 0) sections = doc.querySelectorAll('section');
  if (sections.length === 0) sections = doc.querySelectorAll('.slide');
  if (sections.length === 0) sections = doc.querySelectorAll('article');

  if (sections.length > 0) {
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3');
      slides.push({
        id: `imported-${Date.now()}-${index}`,
        title: heading?.textContent?.trim() || `Slide ${index + 1}`,
        html: section.outerHTML
      });
    });
  } else {
    // Treat the entire body as one slide
    const bodyContent = doc.body.innerHTML.trim();
    if (bodyContent) {
      const heading = doc.querySelector('h1, h2, h3');
      slides.push({
        id: `imported-${Date.now()}-0`,
        title: heading?.textContent?.trim() || 'Imported Slide',
        html: `<section class="slide-section">${bodyContent}</section>`
      });
    }
  }

  return slides;
}

/**
 * Handle file drop or selection for HTML files
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    // Validate file type
    const validTypes = ['text/html', 'application/xhtml+xml', 'text/plain'];
    const validExtensions = ['.html', '.htm', '.xhtml'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      return { success: false, error: 'Please select an HTML file (.html, .htm)' };
    }

    const content = await file.text();

    // Check if it's a JSON backup file
    if (file.name.endsWith('.json') || content.trim().startsWith('{')) {
      try {
        const backup = JSON.parse(content) as PresentationBackup;
        if (backup.version && backup.slides) {
          return {
            success: true,
            slides: backup.slides.map(s => ({
              id: `imported-${Date.now()}-${s.id}`,
              title: s.title,
              html: s.html
            })),
            source: 'json'
          };
        }
      } catch {
        // Not a valid JSON backup, continue as HTML
      }
    }

    const slides = parseHtmlToSlides(content);

    if (slides.length === 0) {
      return { success: false, error: 'No slide content found in the file' };
    }

    return { success: true, slides, source: 'file' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to read file: ${message}` };
  }
}

/**
 * Import from JSON backup
 */
export function importFromJson(jsonContent: string): ImportResult {
  try {
    const backup = JSON.parse(jsonContent) as PresentationBackup;

    if (!backup.version || !backup.slides || !Array.isArray(backup.slides)) {
      return { success: false, error: 'Invalid backup format' };
    }

    const slides = backup.slides.map((s, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      title: s.title || `Slide ${idx + 1}`,
      html: s.html
    }));

    return { success: true, slides, source: 'json' };
  } catch (error) {
    return { success: false, error: 'Invalid JSON format' };
  }
}

/**
 * Export presentation to JSON backup
 */
export function exportToJson(
  title: string,
  slides: Array<{ id: string; title: string; rawContent: string }>
): string {
  const backup: PresentationBackup = {
    version: '1.0',
    exportedAt: Date.now(),
    title,
    slides: slides.map(s => ({
      id: s.id,
      title: s.title,
      html: s.rawContent
    })),
    metadata: {
      totalSlides: slides.length,
      createdBy: 'PresentGenius'
    }
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Download JSON backup file
 */
export function downloadJsonBackup(
  title: string,
  slides: Array<{ id: string; title: string; rawContent: string }>
): void {
  const json = exportToJson(title, slides);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download as HTML file
 */
export function downloadAsHtml(
  title: string,
  slides: Array<{ rawContent: string }>,
  globalStyles: string
): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${globalStyles}</style>
</head>
<body>
${slides.map(s => s.rawContent).join('\n\n')}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate dropped files for import
 */
export function validateDroppedFiles(files: FileList): File | null {
  if (files.length === 0) return null;

  const file = files[0];
  const validExtensions = ['.html', '.htm', '.xhtml', '.json'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

  if (validExtensions.includes(extension)) {
    return file;
  }

  return null;
}

/**
 * VibePresenterPro - Export Service
 * Handles exporting artifacts to HTML, PDF, PNG, and JSON formats
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { sanitizeHtmlContent } from '../utils/sanitization';

export type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export interface ExportProgress {
  status: ExportStatus;
  message: string;
  error?: string;
}

/**
 * Export HTML content as a standalone .html file
 */
export function exportToHTML(html: string, filename: string): void {
  try {
    const safeHtml = sanitizeHtmlContent(html, { stripForms: true });

    // Wrap the HTML in a complete document structure if not already
    let fullHtml = safeHtml;
    if (!safeHtml.trim().toLowerCase().startsWith('<!doctype')) {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(filename)}</title>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
${safeHtml}
</body>
</html>`;
    }

    // Create blob and download
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(filename)}.html`;

    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();

    // Clean up: delay removal to ensure click is processed
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to export HTML:', error);
    throw new Error('Failed to export HTML file');
  }
}

/**
 * Export HTML content as PDF using html2canvas and jsPDF
 * This generates a high-quality PDF directly without print dialog
 */
export async function exportToPDF(
  html: string,
  filename: string,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const container = document.createElement('div');

  try {
    onProgress?.({ status: 'exporting', message: 'Preparing content for PDF export...' });

    // Create a hidden container for rendering with better quality settings
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1200px;
      background: white;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;

    // Extract body content if full HTML document
    const sanitized = sanitizeHtmlContent(html, { stripForms: true });
    const bodyContent = sanitized.trim().toLowerCase().startsWith('<!doctype')
      ? extractBody(sanitized)
      : sanitized;

    container.innerHTML = bodyContent;
    document.body.appendChild(container);

    // Wait for images and fonts to load
    await Promise.all([
      ...Array.from(container.querySelectorAll('img')).map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
        });
      }),
      document.fonts?.ready || Promise.resolve()
    ]);

    onProgress?.({ status: 'exporting', message: 'Rendering content to canvas...' });

    // High-quality canvas rendering
    const canvas = await html2canvas(container, {
      scale: 2.5, // Increased from 2 for better quality
      useCORS: true, // Enable cross-origin images
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      removeContainer: false,
      windowWidth: 1200,
      windowHeight: container.scrollHeight,
    });

    onProgress?.({ status: 'exporting', message: 'Generating PDF file...' });

    // Create PDF with proper sizing
    const imgData = canvas.toDataURL('image/png', 1.0); // Max quality
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin);

    // Add additional pages if content is long
    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft) + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`${sanitizeFilename(filename)}.pdf`);

    onProgress?.({ status: 'success', message: 'PDF exported successfully!' });
  } catch (error) {
    console.error('Failed to export PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress?.({ status: 'error', message: 'PDF export failed', error: errorMessage });
    throw new Error(`Failed to export PDF: ${errorMessage}`);
  } finally {
    // Clean up the container
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Export HTML content as PNG image
 * High-resolution screenshot of the rendered content
 */
export async function exportToPNG(
  html: string,
  filename: string,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const container = document.createElement('div');

  try {
    onProgress?.({ status: 'exporting', message: 'Preparing content for PNG export...' });

    // Create a hidden container for rendering with high quality
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1920px;
      background: white;
      padding: 60px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;

    // Extract body content if full HTML document
    const sanitized = sanitizeHtmlContent(html, { stripForms: true });
    const bodyContent = sanitized.trim().toLowerCase().startsWith('<!doctype')
      ? extractBody(sanitized)
      : sanitized;

    container.innerHTML = bodyContent;
    document.body.appendChild(container);

    // Wait for images and fonts to load
    await Promise.all([
      ...Array.from(container.querySelectorAll('img')).map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }),
      document.fonts?.ready || Promise.resolve()
    ]);

    onProgress?.({ status: 'exporting', message: 'Rendering high-resolution image...' });

    // Very high-quality canvas rendering for PNG
    const canvas = await html2canvas(container, {
      scale: 3, // Higher resolution for PNG
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      removeContainer: false,
      windowWidth: 1920,
      windowHeight: container.scrollHeight,
    });

    onProgress?.({ status: 'exporting', message: 'Creating PNG file...' });

    // Convert canvas to blob and download
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create PNG blob'));
            return;
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${sanitizeFilename(filename)}.png`;

          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onProgress?.({ status: 'success', message: 'PNG exported successfully!' });
            resolve();
          }, 100);
        },
        'image/png',
        1.0 // Maximum quality
      );
    });
  } catch (error) {
    console.error('Failed to export PNG:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress?.({ status: 'error', message: 'PNG export failed', error: errorMessage });
    throw new Error(`Failed to export PNG: ${errorMessage}`);
  } finally {
    // Clean up the container
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Export creation data as JSON (includes HTML and metadata)
 */
export function exportToJSON(
  html: string,
  name: string,
  originalImage?: string,
  id?: string
): void {
  try {
    const creation = {
      id: id || crypto.randomUUID(),
      name,
      html: sanitizeHtmlContent(html, { stripForms: true }),
      originalImage,
      timestamp: new Date().toISOString(),
      version: '2.0', // VibePresenterPro version
    };

    const json = JSON.stringify(creation, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(name)}_artifact.json`;

    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();

    // Clean up: delay removal to ensure click is processed
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw new Error('Failed to export JSON file');
  }
}

/**
 * Copy HTML to clipboard with fallback for older browsers
 */
export async function copyToClipboard(html: string): Promise<boolean> {
  try {
    // Check if clipboard API is available
    if (!navigator?.clipboard?.writeText) {
      // Fallback for older browsers
      return fallbackCopyToClipboard(html);
    }

    await navigator.clipboard.writeText(html);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard via Clipboard API:', error);
    // Try fallback method
    return fallbackCopyToClipboard(html);
  }
}

/**
 * Fallback clipboard method for older browsers
 */
function fallbackCopyToClipboard(html: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = html;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // Focus and select the text
    textArea.focus();
    textArea.select();

    // Try to copy
    const success = document.execCommand('copy');

    // Clean up
    document.body.removeChild(textArea);

    if (!success) {
      throw new Error('document.execCommand copy command failed');
    }

    return true;
  } catch (error) {
    console.error('Fallback copy to clipboard failed:', error);
    return false;
  }
}

/**
 * Generate embed code for iframe embedding
 */
export function generateEmbedCode(html: string, width = '100%', height = '600px'): string {
  const sanitized = sanitizeHtmlContent(html, { stripForms: true });
  const encodedHtml = encodeHtmlToBase64(sanitized);

  return `<iframe
  src="data:text/html;base64,${encodedHtml}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  sandbox="allow-popups allow-modals"
></iframe>`;
}


/**
 * Generate a shareable data URL
 */
export function generateDataUrl(html: string): string {
  const sanitized = sanitizeHtmlContent(html, { stripForms: true });
  const encodedHtml = encodeHtmlToBase64(sanitized);
  return `data:text/html;base64,${encodedHtml}`;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Sanitize filename for safe saving
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100) || 'artifact';
}

/**
 * Escape HTML special characters to prevent injection attacks
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Encode HTML to base64 safely without deprecated unescape()
 */
function encodeHtmlToBase64(html: string): string {
  try {
    // Use TextEncoder for proper Unicode support
    const encoded = new TextEncoder().encode(html);
    const binaryString = Array.from(encoded)
      .map(byte => String.fromCharCode(byte))
      .join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Failed to encode HTML to base64:', error);
    // Fallback for older browsers
    try {
      return btoa(encodeURIComponent(html).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch (fallbackError) {
      console.error('Base64 encoding fallback failed:', fallbackError);
      throw new Error('Failed to encode HTML to base64');
    }
  }
}

/**
 * Extract body content from full HTML document
 */
function extractBody(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

/**
 * Check if browser supports required export features
 */
export function checkExportSupport(): {
  html: boolean;
  pdf: boolean;
  png: boolean;
  clipboard: boolean;
} {
  const hasCanvas = typeof document !== 'undefined' && typeof document.createElement === 'function';
  const testCanvas = hasCanvas ? document.createElement('canvas') : null;

  return {
    html: typeof window !== 'undefined' && typeof Blob !== 'undefined',
    pdf: hasCanvas && typeof testCanvas?.toDataURL === 'function',
    png: hasCanvas && typeof testCanvas?.toBlob === 'function',
    clipboard: typeof navigator !== 'undefined' && (typeof navigator.clipboard !== 'undefined' || typeof document.execCommand !== 'undefined'),
  };
}

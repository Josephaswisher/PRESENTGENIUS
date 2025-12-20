/**
 * VibePresenterPro - Export Service
 * Handles exporting artifacts to HTML, PDF, and JSON formats
 */

/**
 * Export HTML content as a standalone .html file
 */
export function exportToHTML(html: string, filename: string): void {
  // Wrap the HTML in a complete document structure if not already
  let fullHtml = html;
  if (!html.trim().toLowerCase().startsWith('<!doctype')) {
    fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
</head>
<body>
${html}
</body>
</html>`;
  }

  // Create blob and download
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export HTML content as PDF using browser's print functionality
 * This opens a print dialog with the content
 */
export function exportToPDF(html: string, filename: string): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }

  // Build print-friendly HTML
  const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - Print</title>
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
    <style>
        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
        }
        @page {
            margin: 0.5in;
        }
    </style>
</head>
<body>
${html.trim().toLowerCase().startsWith('<!doctype') ? extractBody(html) : html}
<script>
    window.onload = function() {
        setTimeout(function() {
            window.print();
            setTimeout(function() {
                window.close();
            }, 1000);
        }, 500);
    };
</script>
</body>
</html>`;

  printWindow.document.write(printHtml);
  printWindow.document.close();
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
  const creation = {
    id: id || crypto.randomUUID(),
    name,
    html,
    originalImage,
    timestamp: new Date().toISOString(),
    version: '2.0', // VibePresenterPro version
  };

  const json = JSON.stringify(creation, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(name)}_artifact.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy HTML to clipboard
 */
export async function copyToClipboard(html: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate embed code for iframe embedding
 */
export function generateEmbedCode(html: string, width = '100%', height = '600px'): string {
  // Encode HTML as base64 for srcdoc
  const encodedHtml = btoa(unescape(encodeURIComponent(html)));

  return `<iframe
  src="data:text/html;base64,${encodedHtml}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  sandbox="allow-scripts allow-forms"
></iframe>`;
}

/**
 * Generate a shareable data URL
 */
export function generateDataUrl(html: string): string {
  const encodedHtml = btoa(unescape(encodeURIComponent(html)));
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
  clipboard: boolean;
} {
  return {
    html: true, // Always supported via blob download
    pdf: typeof window !== 'undefined' && typeof window.print === 'function',
    clipboard: typeof navigator !== 'undefined' && typeof navigator.clipboard !== 'undefined',
  };
}

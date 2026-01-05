/**
 * HTML Validator Utility
 *
 * Provides:
 * - HTML syntax validation
 * - Auto-fix for common issues
 * - Warning detection for problematic scripts
 * - Safe HTML sanitization
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixedHtml?: string;
  canAutoFix: boolean;
}

export interface ValidationError {
  type: 'syntax' | 'unclosed_tag' | 'mismatched_tag' | 'invalid_attribute' | 'empty_content';
  message: string;
  line?: number;
  column?: number;
  tag?: string;
}

export interface ValidationWarning {
  type: 'script' | 'external_resource' | 'inline_style' | 'potential_xss' | 'large_content';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

// Tags that should be self-closing or don't need closing
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Potentially dangerous attributes
const DANGEROUS_ATTRS = new Set([
  'onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur',
  'onsubmit', 'onreset', 'onselect', 'onchange', 'onkeydown', 'onkeyup'
]);

/**
 * Validate HTML string and return detailed results
 */
export function validateHtml(html: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let canAutoFix = true;

  // Check for empty content
  if (!html || html.trim().length === 0) {
    errors.push({
      type: 'empty_content',
      message: 'HTML content is empty'
    });
    return { isValid: false, errors, warnings, canAutoFix: false };
  }

  // Check for very large content
  if (html.length > 500000) {
    warnings.push({
      type: 'large_content',
      message: 'HTML content is very large (>500KB), may affect performance',
      severity: 'medium',
      suggestion: 'Consider splitting into multiple slides'
    });
  }

  // Parse with DOMParser to check for syntax errors
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Check for parser errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    errors.push({
      type: 'syntax',
      message: parserError.textContent || 'HTML parsing error'
    });
    canAutoFix = false;
  }

  // Check for unclosed tags using regex (supplementary check)
  const tagStack: { tag: string; line: number }[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  const lines = html.split('\n');
  let charIndex = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let match;
    const lineTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;

    while ((match = lineTagRegex.exec(line)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      // Skip void elements and self-closing tags
      if (VOID_ELEMENTS.has(tagName) || fullTag.endsWith('/>')) {
        continue;
      }

      if (fullTag.startsWith('</')) {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push({
            type: 'mismatched_tag',
            message: `Unexpected closing tag </${tagName}>`,
            line: lineNum + 1,
            tag: tagName
          });
        } else {
          const lastOpen = tagStack.pop();
          if (lastOpen && lastOpen.tag !== tagName) {
            errors.push({
              type: 'mismatched_tag',
              message: `Mismatched tags: expected </${lastOpen.tag}> but found </${tagName}>`,
              line: lineNum + 1,
              tag: tagName
            });
            // Try to recover by putting it back if it might match something earlier
            tagStack.push(lastOpen);
          }
        }
      } else {
        // Opening tag
        tagStack.push({ tag: tagName, line: lineNum + 1 });
      }
    }
  }

  // Report unclosed tags
  for (const unclosed of tagStack) {
    errors.push({
      type: 'unclosed_tag',
      message: `Unclosed tag <${unclosed.tag}>`,
      line: unclosed.line,
      tag: unclosed.tag
    });
  }

  // Check for dangerous scripts
  const scriptTags = doc.querySelectorAll('script');
  if (scriptTags.length > 0) {
    warnings.push({
      type: 'script',
      message: `Found ${scriptTags.length} script tag(s) - will be sandboxed in iframe`,
      severity: 'low',
      suggestion: 'Scripts run in isolated iframe and cannot access parent page'
    });
  }

  // Check for external resources
  const externalResources = doc.querySelectorAll('[src^="http"], [href^="http"]');
  if (externalResources.length > 0) {
    warnings.push({
      type: 'external_resource',
      message: `Found ${externalResources.length} external resource(s)`,
      severity: 'low',
      suggestion: 'External resources may not load if offline'
    });
  }

  // Check for potentially dangerous event handlers
  const allElements = doc.querySelectorAll('*');
  let dangerousAttrsFound = 0;

  allElements.forEach(el => {
    for (const attr of el.attributes) {
      if (DANGEROUS_ATTRS.has(attr.name.toLowerCase())) {
        dangerousAttrsFound++;
      }
    }
  });

  if (dangerousAttrsFound > 0) {
    warnings.push({
      type: 'potential_xss',
      message: `Found ${dangerousAttrsFound} inline event handler(s)`,
      severity: 'medium',
      suggestion: 'Inline event handlers are allowed but run in sandboxed iframe'
    });
  }

  // Check for inline styles (just informational)
  const inlineStyles = doc.querySelectorAll('[style]');
  if (inlineStyles.length > 10) {
    warnings.push({
      type: 'inline_style',
      message: `Found ${inlineStyles.length} inline style attributes`,
      severity: 'low',
      suggestion: 'Consider using a <style> block for better organization'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canAutoFix: canAutoFix && errors.length > 0
  };
}

/**
 * Attempt to auto-fix common HTML issues
 */
export function autoFixHtml(html: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = html;

  // Fix unclosed tags by parsing and serializing
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Get the body content (this auto-closes tags)
    const bodyContent = doc.body.innerHTML;

    if (bodyContent !== html) {
      // Check if it was wrapped in extra elements
      if (html.includes('<html') || html.includes('<body')) {
        fixed = doc.documentElement.outerHTML;
      } else {
        fixed = bodyContent;
      }
      changes.push('Auto-closed unclosed tags');
    }
  } catch (e) {
    // If parsing fails, try manual fixes
  }

  // Fix common typos
  const typoFixes: [RegExp, string, string][] = [
    [/<br>/gi, '<br/>', 'Converted <br> to <br/>'],
    [/<hr>/gi, '<hr/>', 'Converted <hr> to <hr/>'],
    [/<img([^>]*)(?<!\/)>/gi, '<img$1/>', 'Self-closed <img> tags'],
    [/<input([^>]*)(?<!\/)>/gi, '<input$1/>', 'Self-closed <input> tags'],
  ];

  for (const [pattern, replacement, description] of typoFixes) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes.push(description);
    }
  }

  // Remove any null characters
  if (fixed.includes('\0')) {
    fixed = fixed.replace(/\0/g, '');
    changes.push('Removed null characters');
  }

  // Normalize whitespace in tags
  fixed = fixed.replace(/<(\w+)\s+>/g, '<$1>');
  if (fixed !== html) {
    changes.push('Normalized whitespace in tags');
  }

  return { fixed, changes };
}

/**
 * Sanitize HTML for safe display (basic)
 */
export function sanitizeHtml(html: string): string {
  // Use DOMParser to parse and re-serialize
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script tags (optional - since we sandbox anyway)
  // doc.querySelectorAll('script').forEach(el => el.remove());

  return doc.body.innerHTML;
}

/**
 * Check if HTML is likely a complete slide vs a fragment
 */
export function isCompleteSlide(html: string): boolean {
  const lower = html.toLowerCase().trim();
  return (
    lower.startsWith('<section') ||
    lower.startsWith('<div class="slide') ||
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html')
  );
}

/**
 * Wrap content in a section if needed
 */
export function wrapInSection(html: string, id?: string): string {
  if (isCompleteSlide(html)) {
    return html;
  }

  const sectionId = id || `slide-${Date.now()}`;
  return `<section class="slide-section" id="${sectionId}">\n${html}\n</section>`;
}

/**
 * Extract text content from HTML for preview/search
 */
export function extractTextContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Get a summary of HTML content
 */
export function getHtmlSummary(html: string): {
  charCount: number;
  wordCount: number;
  elementCount: number;
  hasScripts: boolean;
  hasStyles: boolean;
  hasImages: boolean;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';

  return {
    charCount: html.length,
    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    elementCount: doc.body.querySelectorAll('*').length,
    hasScripts: doc.querySelectorAll('script').length > 0,
    hasStyles: doc.querySelectorAll('style').length > 0 || doc.querySelectorAll('[style]').length > 0,
    hasImages: doc.querySelectorAll('img').length > 0
  };
}

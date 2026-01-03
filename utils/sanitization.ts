const BLOCKED_PROTOCOLS = [/^javascript:/i, /^data:/i, /^vbscript:/i];

export interface SanitizeOptions {
  stripForms?: boolean;
  removeIframes?: boolean;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (BLOCKED_PROTOCOLS.some((re) => re.test(trimmed))) return null;

  try {
    const parsed = new URL(trimmed, 'https://localhost');
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function isBlockedUrl(url: string | null): boolean {
  if (!url) return false;
  return BLOCKED_PROTOCOLS.some((re) => re.test(url.trim()));
}

export function sanitizeHtmlContent(html: string, options: SanitizeOptions = {}): string {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const blockedSelectors = ['script', 'object', 'embed'];
    if (options.removeIframes !== false) {
      blockedSelectors.push('iframe');
    }
    doc.querySelectorAll(blockedSelectors.join(',')).forEach((el) => el.remove());

    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }

        if ((name === 'src' || name === 'href' || name === 'action') && isBlockedUrl(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });

      if (options.stripForms && el.tagName.toLowerCase() === 'form') {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) {
          fragment.appendChild(el.firstChild);
        }
        el.replaceWith(fragment);
      }
    });

    const serialized = html.trim().toLowerCase().startsWith('<!doctype')
      ? doc.documentElement.outerHTML
      : doc.body.innerHTML;

    return serialized;
  } catch (error) {
    console.warn('[sanitize] Failed to sanitize HTML', error);
    return html;
  }
}

export function redactSensitive(text: string): string {
  if (!text) return '';
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[redacted-id]')
    .replace(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[redacted-phone]')
    .replace(/\b\d{8,}\b/g, '[redacted-number]');
}

export function clampText(text: string, maxLength: number): string {
  if (!text) return '';
  const length = Math.max(0, Math.min(maxLength, Number.MAX_SAFE_INTEGER));
  if (!length) return '';
  return text.length > length ? text.slice(0, length) : text;
}

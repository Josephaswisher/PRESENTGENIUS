/**
 * TipTap Editor Configuration
 *
 * Core configuration for the visual editor with:
 * - Rich text formatting (bold, italic, headings, lists)
 * - Code blocks for embedded scripts
 * - Image support
 * - Links
 * - Text alignment
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

export const getEditorExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-zinc-800 rounded-lg p-4 font-mono text-sm overflow-x-auto',
      },
    },
  }),
  Placeholder.configure({
    placeholder: placeholder || 'Start editing...',
    emptyEditorClass: 'is-editor-empty',
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Color,
  TextStyle,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-400 hover:text-blue-300 underline cursor-pointer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg max-w-full',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
];

/**
 * Editor toolbar configuration
 */
export interface ToolbarButton {
  id: string;
  icon: string;
  label: string;
  action: string;
  isActive?: string;
}

export const toolbarConfig: ToolbarButton[] = [
  { id: 'bold', icon: 'B', label: 'Bold', action: 'toggleBold', isActive: 'bold' },
  { id: 'italic', icon: 'I', label: 'Italic', action: 'toggleItalic', isActive: 'italic' },
  { id: 'strike', icon: 'S', label: 'Strikethrough', action: 'toggleStrike', isActive: 'strike' },
  { id: 'code', icon: '<>', label: 'Code', action: 'toggleCode', isActive: 'code' },
  { id: 'h1', icon: 'H1', label: 'Heading 1', action: 'toggleHeading-1', isActive: 'heading-1' },
  { id: 'h2', icon: 'H2', label: 'Heading 2', action: 'toggleHeading-2', isActive: 'heading-2' },
  { id: 'h3', icon: 'H3', label: 'Heading 3', action: 'toggleHeading-3', isActive: 'heading-3' },
  { id: 'bulletList', icon: '•', label: 'Bullet List', action: 'toggleBulletList', isActive: 'bulletList' },
  { id: 'orderedList', icon: '1.', label: 'Ordered List', action: 'toggleOrderedList', isActive: 'orderedList' },
  { id: 'blockquote', icon: '"', label: 'Quote', action: 'toggleBlockquote', isActive: 'blockquote' },
  { id: 'codeBlock', icon: '{}', label: 'Code Block', action: 'toggleCodeBlock', isActive: 'codeBlock' },
  { id: 'alignLeft', icon: '←', label: 'Align Left', action: 'setTextAlign-left' },
  { id: 'alignCenter', icon: '↔', label: 'Align Center', action: 'setTextAlign-center' },
  { id: 'alignRight', icon: '→', label: 'Align Right', action: 'setTextAlign-right' },
];

/**
 * Convert HTML string to TipTap-compatible content
 * Extracts editable content from embedded HTML artifacts
 */
export function htmlToEditorContent(html: string): string {
  // If it's a full HTML document, extract the body content
  if (html.includes('<body')) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }
  return html;
}

/**
 * Convert editor content back to full HTML document
 * Re-wraps content with the original document structure
 */
export function editorContentToHtml(
  content: string,
  originalHtml: string
): string {
  // If original was a full HTML document, wrap the content back
  if (originalHtml.includes('<html')) {
    // Extract head section
    const headMatch = originalHtml.match(/<head[^>]*>[\s\S]*<\/head>/i);
    const head = headMatch ? headMatch[0] : '<head><meta charset="UTF-8"></head>';

    // Extract any scripts from original
    const scriptMatches = originalHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
    const scripts = scriptMatches.join('\n');

    // Extract style tags from original
    const styleMatches = originalHtml.match(/<style[\s\S]*?<\/style>/gi) || [];
    const styles = styleMatches.join('\n');

    return `<!DOCTYPE html>
<html lang="en" class="dark">
${head}
<body class="bg-zinc-950 text-white min-h-screen">
${content}
${scripts}
</body>
</html>`;
  }

  return content;
}

/**
 * Parse HTML into editable blocks for block editing mode
 */
export interface EditorBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'image' | 'quiz' | 'custom';
  content: string;
  attributes?: Record<string, string>;
}

export function htmlToBlocks(html: string): EditorBlock[] {
  const blocks: EditorBlock[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let blockId = 0;

  function processNode(node: Element): EditorBlock | null {
    const id = `block-${++blockId}`;
    const tagName = node.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        return {
          id,
          type: 'heading',
          content: node.innerHTML,
          attributes: { level: tagName.replace('h', '') },
        };
      case 'p':
        return {
          id,
          type: 'paragraph',
          content: node.innerHTML,
        };
      case 'ul':
      case 'ol':
        return {
          id,
          type: 'list',
          content: node.innerHTML,
          attributes: { ordered: tagName === 'ol' ? 'true' : 'false' },
        };
      case 'pre':
      case 'code':
        return {
          id,
          type: 'code',
          content: node.textContent || '',
        };
      case 'img':
        return {
          id,
          type: 'image',
          content: '',
          attributes: {
            src: node.getAttribute('src') || '',
            alt: node.getAttribute('alt') || '',
          },
        };
      case 'div':
      case 'section':
        // Check for quiz or interactive elements
        const htmlNode = node as HTMLElement;
        if (node.classList.contains('quiz') || htmlNode.dataset?.type === 'quiz') {
          return {
            id,
            type: 'quiz',
            content: node.innerHTML,
          };
        }
        // Fall through to custom
        return {
          id,
          type: 'custom',
          content: node.outerHTML,
        };
      default:
        return null;
    }
  }

  // Process direct children of body
  Array.from(body.children).forEach(child => {
    const block = processNode(child);
    if (block) {
      blocks.push(block);
    }
  });

  return blocks;
}

/**
 * Convert blocks back to HTML
 */
export function blocksToHtml(blocks: EditorBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        const level = block.attributes?.level || '2';
        return `<h${level}>${block.content}</h${level}>`;
      case 'paragraph':
        return `<p>${block.content}</p>`;
      case 'list':
        const tag = block.attributes?.ordered === 'true' ? 'ol' : 'ul';
        return `<${tag}>${block.content}</${tag}>`;
      case 'code':
        return `<pre><code>${block.content}</code></pre>`;
      case 'image':
        return `<img src="${block.attributes?.src}" alt="${block.attributes?.alt}" />`;
      case 'quiz':
      case 'custom':
        return block.content;
      default:
        return '';
    }
  }).join('\n');
}

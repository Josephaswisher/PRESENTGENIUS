/**
 * Visual Editor Component
 *
 * Main editing interface with three modes:
 * 1. Preview Mode - Read-only viewing
 * 2. Visual Mode - WYSIWYG editing with TipTap
 * 3. Code Mode - Raw HTML editing
 *
 * Integrates with the artifact preview system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getEditorExtensions, htmlToEditorContent, editorContentToHtml } from '../../lib/editor/tiptap-config';
import { EditorToolbar } from './EditorToolbar';

export type EditorMode = 'preview' | 'visual' | 'code';

interface VisualEditorProps {
  html: string;
  onSave: (html: string) => void;
  onCancel?: () => void;
  autoSave?: boolean;
}

export function VisualEditor({ html, onSave, onCancel, autoSave = true }: VisualEditorProps) {
  const [mode, setMode] = useState<EditorMode>('preview');
  const [rawHtml, setRawHtml] = useState(html);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalHtml] = useState(html);

  // Extract editable content from full HTML
  const editableContent = htmlToEditorContent(html);

  // TipTap editor instance
  const editor = useEditor({
    extensions: getEditorExtensions('Click to edit content...'),
    content: editableContent,
    editable: mode === 'visual',
    onUpdate: ({ editor }) => {
      setHasChanges(true);
      if (autoSave) {
        // Debounced auto-save will be handled by parent
      }
    },
  });

  // Update editor editable state when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(mode === 'visual');
    }
  }, [mode, editor]);

  // Handle mode switching
  const handleModeChange = useCallback((newMode: EditorMode) => {
    if (mode === 'visual' && newMode !== 'visual' && editor) {
      // Save content from visual editor to raw HTML
      const content = editor.getHTML();
      const fullHtml = editorContentToHtml(content, originalHtml);
      setRawHtml(fullHtml);
    } else if (mode === 'code' && newMode !== 'code') {
      // Update editor with changes from code mode
      if (editor) {
        const content = htmlToEditorContent(rawHtml);
        editor.commands.setContent(content);
      }
    }
    setMode(newMode);
  }, [mode, editor, originalHtml, rawHtml]);

  // Handle save
  const handleSave = useCallback(() => {
    let finalHtml = rawHtml;

    if (mode === 'visual' && editor) {
      const content = editor.getHTML();
      finalHtml = editorContentToHtml(content, originalHtml);
    }

    onSave(finalHtml);
    setHasChanges(false);
  }, [mode, editor, rawHtml, originalHtml, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (editor) {
      editor.commands.setContent(editableContent);
    }
    setRawHtml(html);
    setHasChanges(false);
    setMode('preview');
    onCancel?.();
  }, [editor, editableContent, html, onCancel]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Header with mode switcher */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1">
          {/* Mode tabs */}
          <ModeTab
            active={mode === 'preview'}
            onClick={() => handleModeChange('preview')}
            icon="👁️"
            label="Preview"
          />
          <ModeTab
            active={mode === 'visual'}
            onClick={() => handleModeChange('visual')}
            icon="✏️"
            label="Visual"
          />
          <ModeTab
            active={mode === 'code'}
            onClick={() => handleModeChange('code')}
            icon="<>"
            label="Code"
          />
        </div>

        {/* Save/Cancel buttons */}
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-yellow-400 mr-2">
              Unsaved changes
            </span>
          )}
          {mode !== 'preview' && (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${hasChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar (only in visual mode) */}
      {mode === 'visual' && (
        <EditorToolbar editor={editor} />
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {mode === 'preview' && (
          <PreviewMode html={rawHtml} />
        )}

        {mode === 'visual' && (
          <div className="p-4">
            <EditorContent
              editor={editor}
              className="
                prose prose-invert prose-zinc max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded
                prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700
                prose-blockquote:border-blue-500 prose-blockquote:text-zinc-400
                prose-li:text-zinc-300
                min-h-[400px] focus:outline-none
              "
            />
          </div>
        )}

        {mode === 'code' && (
          <CodeMode
            html={rawHtml}
            onChange={(newHtml) => {
              setRawHtml(newHtml);
              setHasChanges(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Mode tab button
function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
        ${active
          ? 'bg-zinc-800 text-white border border-zinc-700'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Preview mode - renders HTML in iframe
function PreviewMode({ html }: { html: string }) {
  return (
    <div className="w-full h-full bg-zinc-900">
      <iframe
        srcDoc={html}
        className="w-full h-full min-h-[500px] border-0"
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

// Code mode - raw HTML editing
function CodeMode({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="p-4 h-full">
      <textarea
        value={html}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full h-full min-h-[500px] p-4
          bg-zinc-900 text-zinc-300 font-mono text-sm
          border border-zinc-700 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          resize-none
        "
        spellCheck={false}
        placeholder="Edit raw HTML..."
      />
    </div>
  );
}

export default VisualEditor;

/**
 * Visual Editor Component - Enhanced Block-Based Slide Builder
 *
 * Features:
 * - Block-based slide editing (Notion-style)
 * - Inline AI assistance
 * - Real-time preview
 * - Version history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  EyeIcon, 
  CodeBracketIcon, 
  ClockIcon, 
  ArrowUturnLeftIcon, 
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  QueueListIcon 
} from '@heroicons/react/24/outline';
import { MiniMaxProvider } from '../../services/providers/minimax';
import type { AIProvider } from '../../services/ai-provider';

export type EditorMode = 'preview' | 'blocks' | 'code';

interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'code' | 'image';
  content: string;
}

interface Slide {
  id: string;
  blocks: Block[];
  notes?: string;
}

interface Version {
  id: string;
  timestamp: Date;
  html: string;
  summary: string;
}

interface VisualEditorProps {
  html: string;
  onSave: (html: string) => void;
  onCancel?: () => void;
  autoSave?: boolean;
}

export function VisualEditor({ html, onSave, onCancel }: VisualEditorProps) {
  const [mode, setMode] = useState<EditorMode>('blocks');
  const [rawHtml, setRawHtml] = useState(html);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [history, setHistory] = useState<Version[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Initialize slides from HTML
  useEffect(() => {
    const parsed = parseHtmlToSlides(html);
    setSlides(parsed);
    addToHistory(html, 'Initial load');
  }, []);

  const addToHistory = (content: string, summary: string) => {
    setHistory(prev => [
      { id: crypto.randomUUID(), timestamp: new Date(), html: content, summary },
      ...prev.slice(0, 9) // Keep last 10
    ]);
  };

  // Convert slides back to HTML
  const generateHtml = useCallback(() => {
    return slides.map(slide => `
      <section class="slide">
        ${slide.blocks.map(block => {
          if (block.type === 'heading') return `<h2>${block.content}</h2>`;
          if (block.type === 'bullet') return `<ul><li>${block.content}</li></ul>`;
          if (block.type === 'code') return `<pre><code>${block.content}</code></pre>`;
          if (block.type === 'image') return `<img src="${block.content}" alt="Slide image" />`;
          return `<p>${block.content}</p>`;
        }).join('\n')}
        ${slide.notes ? `<aside class="notes">${slide.notes}</aside>` : ''}
      </section>
    `).join('\n<hr>\n');
  }, [slides]);

  // Handle save
  const handleSave = () => {
    const finalHtml = mode === 'code' ? rawHtml : generateHtml();
    onSave(finalHtml);
    addToHistory(finalHtml, 'Manual save');
  };

  // Handle mode switch
  const handleModeSwitch = (newMode: EditorMode) => {
    if (mode === 'blocks' && newMode !== 'blocks') {
      setRawHtml(generateHtml());
    } else if (mode === 'code' && newMode === 'blocks') {
      setSlides(parseHtmlToSlides(rawHtml));
    }
    setMode(newMode);
  };

  // AI Assistance
  const previewHtml = useMemo(() =>
    rawHtml || generateHtml(),
    [rawHtml, generateHtml]
  );

  const handleAiAssist = async (instruction: string, slideId: string) => {
    setIsAiGenerating(true);
    try {
      const slide = slides.find(s => s.id === slideId);
      if (!slide) return;

      const currentContent = slide.blocks.map(b => b.content).join('\n');
      const prompt = `Improve this slide content based on instruction: "${instruction}".
      
      Current Content:
      ${currentContent}
      
      Return ONLY valid JSON array of blocks: [{"type": "heading|paragraph|bullet", "content": "..."}]`;

      // Use MiniMax for inline AI assistance
      const provider = new MiniMaxProvider();
      const response = await provider.generate(prompt, [], {});
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const newBlocks: Block[] = parsed.map((b: any) => ({
          id: crypto.randomUUID(),
          type: (['heading', 'paragraph', 'bullet', 'code', 'image'].includes(b.type) ? b.type : 'paragraph') as Block['type'],
          content: b.content || ''
        }));
        
        setSlides(prev => prev.map(s => 
          s.id === slideId ? { ...s, blocks: newBlocks } : s
        ));
      }
    } catch (e) {
      console.error('AI Assist failed', e);
    }
    setIsAiGenerating(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => handleModeSwitch('blocks')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              mode === 'blocks' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QueueListIcon className="w-4 h-4" /> Slides
          </button>
          <button
            onClick={() => handleModeSwitch('code')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              mode === 'code' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CodeBracketIcon className="w-4 h-4" /> Code
          </button>
          <button
            onClick={() => handleModeSwitch('preview')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              mode === 'preview' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Version History"
          >
            <ClockIcon className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-zinc-800" />
          <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-white">Cancel</button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Slide List Sidebar */}
        {mode === 'blocks' && (
          <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col overflow-y-auto">
            <div className="p-2 space-y-1">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideIndex(i)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all group relative ${
                    activeSlideIndex === i 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Slide {i + 1}</span>
                  </div>
                  <div className="truncate font-medium">
                    {slide.blocks.find(b => b.type === 'heading')?.content || 'Untitled Slide'}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSlides([...slides, { id: crypto.randomUUID(), blocks: [{ id: crypto.randomUUID(), type: 'heading', content: 'New Slide' }] }])}
                className="w-full py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-sm hover:border-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2 mt-2"
              >
                <PlusIcon className="w-4 h-4" /> Add Slide
              </button>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
          {mode === 'blocks' && slides[activeSlideIndex] && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Slide Editor */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 min-h-[500px] shadow-2xl relative group">
                {/* AI Assist Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAiAssist('Make this slide more concise and impactful', slides[activeSlideIndex].id)}
                    disabled={isAiGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs hover:bg-purple-500/30 transition-colors"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    {isAiGenerating ? 'Improving...' : 'AI Enhance'}
                  </button>
                </div>

                <div className="space-y-4">
                  {slides[activeSlideIndex].blocks.map((block, blockIndex) => (
                    <div key={block.id} className="group/block relative">
                      <div className="absolute -left-8 top-1 opacity-0 group-hover/block:opacity-100 flex flex-col gap-1">
                        <button 
                          onClick={() => {
                            const newBlocks = [...slides[activeSlideIndex].blocks];
                            newBlocks.splice(blockIndex, 1);
                            setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                          }}
                          className="p-1 text-zinc-600 hover:text-red-400"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {block.type === 'heading' && (
                        <input
                          value={block.content}
                          onChange={(e) => {
                            const newBlocks = [...slides[activeSlideIndex].blocks];
                            newBlocks[blockIndex].content = e.target.value;
                            setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                          }}
                          className="w-full bg-transparent text-3xl font-bold text-white border-none focus:ring-0 placeholder:text-zinc-700"
                          placeholder="Slide Title"
                        />
                      )}
                      
                      {block.type === 'paragraph' && (
                        <textarea
                          value={block.content}
                          onChange={(e) => {
                            const newBlocks = [...slides[activeSlideIndex].blocks];
                            newBlocks[blockIndex].content = e.target.value;
                            setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                          }}
                          rows={3}
                          className="w-full bg-transparent text-zinc-300 text-lg border-none focus:ring-0 resize-none placeholder:text-zinc-700"
                          placeholder="Type content..."
                        />
                      )}

                      {block.type === 'bullet' && (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1.5">•</span>
                          <input
                            value={block.content}
                            onChange={(e) => {
                              const newBlocks = [...slides[activeSlideIndex].blocks];
                              newBlocks[blockIndex].content = e.target.value;
                              setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                            }}
                            className="w-full bg-transparent text-zinc-300 text-lg border-none focus:ring-0 placeholder:text-zinc-700"
                            placeholder="Bullet point"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Block Menu */}
                  <div className="pt-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const newBlocks: Block[] = [...slides[activeSlideIndex].blocks, { id: crypto.randomUUID(), type: 'paragraph', content: '' }];
                        setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                      }}
                      className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white"
                    >
                      + Text
                    </button>
                    <button
                      onClick={() => {
                        const newBlocks: Block[] = [...slides[activeSlideIndex].blocks, { id: crypto.randomUUID(), type: 'bullet', content: '' }];
                        setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, blocks: newBlocks } : s));
                      }}
                      className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white"
                    >
                      + Bullet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'code' && (
            <textarea
              value={rawHtml}
              onChange={(e) => {
                setRawHtml(e.target.value);
                // Don't parse on every keystroke - only parse when switching modes
              }}
              className="w-full h-full bg-zinc-900 text-zinc-300 font-mono text-sm p-4 rounded-xl border border-zinc-800 focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          )}

          {mode === 'preview' && (
            <div className="w-full h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <iframe
                srcDoc={previewHtml} // Show sanitized preview
                className="w-full h-full border-0"
                sandbox={previewSandbox}
              />
            </div>
          )}
        </div>

        {/* Version History Sidebar */}
        {showHistory && (
          <div className="w-64 border-l border-zinc-800 bg-zinc-900/50 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Version History</h3>
            <div className="space-y-3">
              {history.map((version) => (
                <div key={version.id} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-white">{version.summary}</span>
                    <span className="text-[10px] text-zinc-500">{version.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setRawHtml(version.html);
                      setSlides(parseHtmlToSlides(version.html));
                      setMode('blocks');
                    }}
                    className="mt-2 w-full py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded flex items-center justify-center gap-1"
                  >
                    <ArrowUturnLeftIcon className="w-3 h-3" /> Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: Parse HTML to blocks (Enhanced to preserve formatting)
function parseHtmlToSlides(html: string): Slide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const slides: Slide[] = [];

  // Try finding sections first (if generated by our app)
  const sections = doc.querySelectorAll('section');
  if (sections.length > 0) {
    sections.forEach(section => {
      const blocks: Block[] = [];

      // Parse section children, preserving HTML
      Array.from(section.children).forEach(node => {
        const tagName = node.tagName;
        const innerHTML = node.innerHTML || '';
        const textContent = node.textContent || '';

        if (!textContent.trim()) return; // Skip empty elements

        if (tagName === 'H1' || tagName === 'H2') {
          // Preserve HTML formatting in headings
          blocks.push({
            id: crypto.randomUUID(),
            type: 'heading',
            content: innerHTML || textContent
          });
        } else if (tagName === 'P') {
          // Preserve HTML formatting in paragraphs
          blocks.push({
            id: crypto.randomUUID(),
            type: 'paragraph',
            content: innerHTML || textContent
          });
        } else if (tagName === 'UL' || tagName === 'OL') {
          // Preserve HTML for each list item
          (node as HTMLElement).querySelectorAll('li').forEach(li => {
            blocks.push({
              id: crypto.randomUUID(),
              type: 'bullet',
              content: li.innerHTML || li.textContent || ''
            });
          });
        } else if (tagName === 'PRE' || tagName === 'CODE') {
          // Preserve code blocks
          blocks.push({
            id: crypto.randomUUID(),
            type: 'code',
            content: textContent
          });
        } else if (tagName === 'IMG') {
          // Preserve images
          const src = node.getAttribute('src');
          if (src) {
            blocks.push({
              id: crypto.randomUUID(),
              type: 'image',
              content: src
            });
          }
        } else {
          // For any other element, preserve the full HTML
          blocks.push({
            id: crypto.randomUUID(),
            type: 'paragraph',
            content: innerHTML || textContent
          });
        }
      });

      if (blocks.length > 0) {
        slides.push({ id: crypto.randomUUID(), blocks });
      }
    });
  } else {
    // Fallback: Create one slide with all content preserved
    const blocks: Block[] = [];

    Array.from(doc.body.children).forEach(node => {
      const tagName = node.tagName;
      const innerHTML = node.innerHTML || '';
      const textContent = node.textContent || '';

      if (!textContent.trim()) return;

      if (tagName === 'H1' || tagName === 'H2') {
        blocks.push({ id: crypto.randomUUID(), type: 'heading', content: innerHTML || textContent });
      } else if (tagName === 'UL' || tagName === 'OL') {
        (node as HTMLElement).querySelectorAll('li').forEach(li => {
          blocks.push({ id: crypto.randomUUID(), type: 'bullet', content: li.innerHTML || li.textContent || '' });
        });
      } else {
        blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: innerHTML || textContent });
      }
    });

    if (blocks.length === 0) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'heading',
        content: doc.querySelector('h1, h2')?.innerHTML || 'Imported Content'
      });
    }

    slides.push({ id: crypto.randomUUID(), blocks });
  }

  return slides;
}

export default VisualEditor;

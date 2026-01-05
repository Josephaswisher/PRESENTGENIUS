/**
 * Slide Template Library Component
 * Browse, search, and insert slide templates
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  TrashIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BeakerIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  PhotoIcon,
  CpuChipIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import {
  useSlideTemplatesStore,
  type SlideTemplate,
  type TemplateCategory,
  CATEGORY_LABELS
} from '../../stores/slide-templates.store';

interface SlideTemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (html: string) => void;
  onSaveAsTemplate?: (html: string, name: string) => void;
  currentSlideHtml?: string;
}

const CATEGORY_ICONS: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  'title': DocumentTextIcon,
  'content': Squares2X2Icon,
  'quiz': QuestionMarkCircleIcon,
  'case-study': BeakerIcon,
  'diagram': CpuChipIcon,
  'comparison': ArrowsRightLeftIcon,
  'timeline': ClockIcon,
  'list': ListBulletIcon,
  'image': PhotoIcon,
  'custom': FolderIcon
};

export const SlideTemplateLibrary: React.FC<SlideTemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveAsTemplate,
  currentSlideHtml
}) => {
  const { templates, addTemplate, removeTemplate, searchTemplates, getTemplatesByCategory, getAllCategories } = useSlideTemplatesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<TemplateCategory>('custom');
  const [newTemplateTags, setNewTemplateTags] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<SlideTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (searchQuery) {
      result = searchTemplates(searchQuery);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    return result;
  }, [templates, searchQuery, selectedCategory, searchTemplates]);

  // Group templates by category for display
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, SlideTemplate[]> = {};

    filteredTemplates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });

    return groups;
  }, [filteredTemplates]);

  const handleSelectTemplate = useCallback((template: SlideTemplate) => {
    onSelectTemplate(template.html);
    onClose();
  }, [onSelectTemplate, onClose]);

  const handleSaveCurrentSlide = useCallback(() => {
    if (!currentSlideHtml || !newTemplateName.trim()) return;

    addTemplate({
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      description: `Custom template created from slide`,
      html: currentSlideHtml,
      tags: newTemplateTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setShowSaveModal(false);
    setNewTemplateName('');
    setNewTemplateTags('');
  }, [currentSlideHtml, newTemplateName, newTemplateCategory, newTemplateTags, addTemplate]);

  const handleDeleteTemplate = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeTemplate(id);
  }, [removeTemplate]);

  // Create isolated HTML for preview
  const createPreviewHtml = useCallback((html: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Inter', sans-serif; }
    section { min-height: 100vh; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Template Library</h3>
            <span className="text-zinc-500 text-sm">({filteredTemplates.length} templates)</span>
          </div>
          <div className="flex items-center gap-2">
            {currentSlideHtml && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Save Current as Template
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-zinc-700 flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <BookmarkIcon className="w-12 h-12 mb-3 opacity-50" />
              <p>No templates found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-cyan-400 text-sm hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
                const Icon = CATEGORY_ICONS[category as TemplateCategory] || FolderIcon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <h4 className="text-zinc-400 font-medium text-sm uppercase tracking-wide">
                        {CATEGORY_LABELS[category as TemplateCategory] || category}
                      </h4>
                      <span className="text-zinc-600 text-xs">({categoryTemplates.length})</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categoryTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="group relative bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer"
                          onClick={() => handleSelectTemplate(template)}
                          onMouseEnter={() => setPreviewTemplate(template)}
                          onMouseLeave={() => setPreviewTemplate(null)}
                        >
                          {/* Thumbnail Preview */}
                          <div className="aspect-video bg-zinc-900 overflow-hidden">
                            <iframe
                              srcDoc={createPreviewHtml(template.html)}
                              className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none"
                              title={template.name}
                              sandbox="allow-same-origin"
                            />
                          </div>

                          {/* Info */}
                          <div className="p-3">
                            <h5 className="text-white font-medium text-sm truncate">{template.name}</h5>
                            <p className="text-zinc-500 text-xs truncate mt-0.5">{template.description}</p>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTemplate(template);
                              }}
                              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Use Template
                            </button>
                            {!template.isBuiltIn && (
                              <button
                                onClick={(e) => handleDeleteTemplate(e, template.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                title="Delete template"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Tags */}
                          {template.tags.length > 0 && (
                            <div className="absolute top-2 left-2 flex gap-1">
                              {template.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-black/50 text-zinc-400 text-[10px] rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Custom badge */}
                          {!template.isBuiltIn && (
                            <div className="absolute top-2 right-2">
                              <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-400 text-[10px] rounded">
                                Custom
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Panel (appears on hover) */}
        {previewTemplate && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-zinc-950 border-l border-zinc-700 p-4 flex flex-col pointer-events-none">
            <h4 className="text-white font-semibold mb-2">{previewTemplate.name}</h4>
            <p className="text-zinc-400 text-sm mb-4">{previewTemplate.description}</p>
            <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
              <iframe
                srcDoc={createPreviewHtml(previewTemplate.html)}
                className="w-full h-full"
                title="Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save as Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Save as Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-1">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as TemplateCategory)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTemplateTags}
                  onChange={(e) => setNewTemplateTags(e.target.value)}
                  placeholder="custom, medical, quiz"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentSlide}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

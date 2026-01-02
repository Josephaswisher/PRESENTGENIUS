/**
 * TemplateLibraryPanel Component
 * Browse and apply slide templates
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';
import { SLIDE_TEMPLATES, TEMPLATE_CATEGORIES } from '../../data/slideTemplates';
import type { SlideTemplate } from '../../types/slides';

interface TemplateLibraryPanelProps {
  className?: string;
}

export const TemplateLibraryPanel: React.FC<TemplateLibraryPanelProps> = ({
  className = '',
}) => {
  const { applyTemplate, toggleTemplateLibrary, addSlide } = useSlideStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<SlideTemplate | null>(null);

  // Filter templates
  const filteredTemplates = SLIDE_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId);
  };

  const handleAddNewSlideWithTemplate = (templateId: string) => {
    addSlide(undefined, templateId);
  };

  return (
    <div className={`flex flex-col bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-200">Templates</h3>
        <button
          onClick={toggleTemplateLibrary}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-zinc-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg
                       text-sm text-zinc-200 placeholder:text-zinc-500
                       focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b border-zinc-800 overflow-x-auto">
        <CategoryTab
          label="All"
          isActive={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        {TEMPLATE_CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat.id}
            label={cat.name}
            icon={cat.icon}
            isActive={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onApply={() => handleApplyTemplate(template.id)}
              onAddNew={() => handleAddNewSlideWithTemplate(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No templates found
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => {
            handleApplyTemplate(previewTemplate.id);
            setPreviewTemplate(null);
          }}
          onAddNew={() => {
            handleAddNewSlideWithTemplate(previewTemplate.id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// CATEGORY TAB COMPONENT
// ============================================================================

interface CategoryTabProps {
  label: string;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`
      flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap
      ${isActive
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }
    `}
  >
    {icon && <span className="mr-1">{icon}</span>}
    {label}
  </button>
);

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: SlideTemplate;
  onApply: () => void;
  onAddNew: () => void;
  onPreview: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onApply,
  onAddNew,
  onPreview,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group relative rounded-lg overflow-hidden border border-zinc-700
                 hover:border-zinc-500 cursor-pointer transition-all"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onPreview}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-800 relative">
        {/* Template preview would render here */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">{getCategoryIcon(template.category)}</span>
        </div>

        {/* Hover Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 rounded text-xs font-medium text-white transition-colors"
            >
              Apply
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNew();
              }}
              className="px-2 py-1 bg-zinc-600 hover:bg-zinc-500 rounded text-xs font-medium text-white transition-colors"
            >
              + New Slide
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-zinc-800">
        <h4 className="text-xs font-medium text-zinc-200 truncate">{template.name}</h4>
        <p className="text-[10px] text-zinc-500 truncate">{template.description}</p>
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE PREVIEW MODAL
// ============================================================================

interface TemplatePreviewModalProps {
  template: SlideTemplate;
  onClose: () => void;
  onApply: () => void;
  onAddNew: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onApply,
  onAddNew,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{template.name}</h3>
          <p className="text-sm text-zinc-400">{template.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Preview */}
      <div className="p-6 bg-zinc-800">
        <div
          className="aspect-video bg-zinc-700 rounded-lg flex items-center justify-center"
          style={{
            background: template.defaultBackground?.value || '#1e293b',
          }}
        >
          <span className="text-4xl">{getCategoryIcon(template.category)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-4 border-t border-zinc-700">
        <button
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 hover:bg-cyan-400
                     rounded-lg font-medium text-white transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          Apply to Current Slide
        </button>
        <button
          onClick={onAddNew}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-zinc-200 transition-colors"
        >
          Add as New Slide
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'basic':
      return '📄';
    case 'content':
      return '📝';
    case 'media':
      return '🖼️';
    case 'medical':
      return '🏥';
    case 'conclusion':
      return '✅';
    default:
      return '📊';
  }
}

export default TemplateLibraryPanel;

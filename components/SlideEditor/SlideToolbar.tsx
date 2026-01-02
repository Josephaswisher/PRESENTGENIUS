/**
 * SlideToolbar Component
 * Editing controls for the slide editor
 */

import React from 'react';
import {
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  EyeIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  Squares2X2Icon,
  PlayIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ViewColumnsIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';

interface SlideToolbarProps {
  className?: string;
  onAddElement?: (type: string) => void;
}

export const SlideToolbar: React.FC<SlideToolbarProps> = ({
  className = '',
  onAddElement,
}) => {
  const {
    presentation,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    showGrid,
    toggleGrid,
    showRulers,
    toggleRulers,
    undo,
    redo,
    history,
    historyIndex,
    toggleTemplateLibrary,
    toggleAssetLibrary,
    toggleThemeEditor,
    toggleAnimationBuilder,
    toggleSpeakerNotes,
    showTemplateLibrary,
    showAssetLibrary,
    showThemeEditor,
    showAnimationBuilder,
    showSpeakerNotes,
    addElement,
  } = useSlideStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleAddElement = (type: string) => {
    const defaultPositions: Record<string, any> = {
      heading: { x: 5, y: 10, width: 90, height: 15 },
      paragraph: { x: 5, y: 30, width: 90, height: 40 },
      'bullet-list': { x: 5, y: 30, width: 90, height: 50 },
      image: { x: 20, y: 20, width: 60, height: 60 },
      chart: { x: 10, y: 20, width: 80, height: 60 },
    };

    addElement({
      type: type as any,
      content: type === 'image' ? '/placeholder-image.svg' : `New ${type}`,
      position: defaultPositions[type] || { x: 10, y: 10, width: 80, height: 30 },
    });

    onAddElement?.(type);
  };

  return (
    <div className={`flex items-center gap-1 px-3 py-2 bg-zinc-900 border-b border-zinc-700 ${className}`}>
      {/* Left: Add Elements */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<DocumentTextIcon className="w-4 h-4" />}
          label="Add Text"
          onClick={() => handleAddElement('paragraph')}
        />
        <ToolbarButton
          icon={<PhotoIcon className="w-4 h-4" />}
          label="Add Image"
          onClick={() => handleAddElement('image')}
        />
        <ToolbarButton
          icon={<ChartBarIcon className="w-4 h-4" />}
          label="Add Chart"
          onClick={() => handleAddElement('chart')}
        />
        <ToolbarButton
          icon={<Squares2X2Icon className="w-4 h-4" />}
          label="Templates"
          onClick={toggleTemplateLibrary}
          isActive={showTemplateLibrary}
        />
      </div>

      <div className="w-px h-6 bg-zinc-700 mx-2" />

      {/* History */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ArrowUturnLeftIcon className="w-4 h-4" />}
          label="Undo"
          onClick={undo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<ArrowUturnRightIcon className="w-4 h-4" />}
          label="Redo"
          onClick={redo}
          disabled={!canRedo}
        />
      </div>

      <div className="w-px h-6 bg-zinc-700 mx-2" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<MagnifyingGlassMinusIcon className="w-4 h-4" />}
          label="Zoom Out"
          onClick={() => setZoom(zoom - 10)}
          disabled={zoom <= 25}
        />
        <span className="text-xs text-zinc-400 w-12 text-center">{zoom}%</span>
        <ToolbarButton
          icon={<MagnifyingGlassPlusIcon className="w-4 h-4" />}
          label="Zoom In"
          onClick={() => setZoom(zoom + 10)}
          disabled={zoom >= 200}
        />
        <ToolbarButton
          icon={<ViewColumnsIcon className="w-4 h-4" />}
          label="Toggle Grid"
          onClick={toggleGrid}
          isActive={showGrid}
        />
      </div>

      <div className="flex-1" />

      {/* Right: Panels & Actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<PaintBrushIcon className="w-4 h-4" />}
          label="Themes"
          onClick={toggleThemeEditor}
          isActive={showThemeEditor}
        />
        <ToolbarButton
          icon={<SparklesIcon className="w-4 h-4" />}
          label="AI Suggestions"
          onClick={toggleAnimationBuilder}
          isActive={showAnimationBuilder}
        />
        <ToolbarButton
          icon={<SpeakerWaveIcon className="w-4 h-4" />}
          label="Speaker Notes"
          onClick={toggleSpeakerNotes}
          isActive={showSpeakerNotes}
        />
        <ToolbarButton
          icon={<PhotoIcon className="w-4 h-4" />}
          label="Assets"
          onClick={toggleAssetLibrary}
          isActive={showAssetLibrary}
        />
      </div>

      <div className="w-px h-6 bg-zinc-700 mx-2" />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
        <ViewModeButton
          label="Edit"
          isActive={viewMode === 'edit'}
          onClick={() => setViewMode('edit')}
        />
        <ViewModeButton
          label="Preview"
          isActive={viewMode === 'preview'}
          onClick={() => setViewMode('preview')}
        />
        <ViewModeButton
          label="Present"
          icon={<PlayIcon className="w-3 h-3" />}
          isActive={viewMode === 'presenter'}
          onClick={() => setViewMode('presenter')}
        />
      </div>
    </div>
  );
};

// ============================================================================
// TOOLBAR BUTTON COMPONENT
// ============================================================================

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  isActive = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`
      p-1.5 rounded-md transition-colors
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-700'}
      ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400'}
    `}
  >
    {icon}
  </button>
);

// ============================================================================
// VIEW MODE BUTTON COMPONENT
// ============================================================================

interface ViewModeButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const ViewModeButton: React.FC<ViewModeButtonProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors
      ${isActive
        ? 'bg-cyan-500 text-white'
        : 'text-zinc-400 hover:text-zinc-200'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

export default SlideToolbar;

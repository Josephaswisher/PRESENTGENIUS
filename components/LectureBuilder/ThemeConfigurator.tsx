/**
 * Theme Configurator - Set lecture theme, visual metaphor, and color scheme
 */
import React, { useState } from 'react';
import {
  PaintBrushIcon,
  SparklesIcon,
  SwatchIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import {
  LectureTheme,
  ColorScheme,
  COLOR_SCHEMES,
  VISUAL_METAPHORS,
  MetaphorMapping,
} from '../../types/lecture';

interface ThemeConfiguratorProps {
  theme: Partial<LectureTheme>;
  onUpdateTheme: (theme: Partial<LectureTheme>) => void;
  disabled?: boolean;
}

export const ThemeConfigurator: React.FC<ThemeConfiguratorProps> = ({
  theme,
  onUpdateTheme,
  disabled,
}) => {
  const [showMetaphorPicker, setShowMetaphorPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customMappings, setCustomMappings] = useState<MetaphorMapping[]>(
    theme.metaphorMappings || []
  );

  const selectedScheme = COLOR_SCHEMES.find(s => s.id === theme.colorScheme?.id) || COLOR_SCHEMES[0];
  const selectedMetaphor = VISUAL_METAPHORS.find(m => m.id === theme.visualMetaphor) || VISUAL_METAPHORS[VISUAL_METAPHORS.length - 1];

  const handleTitleChange = (title: string) => {
    onUpdateTheme({ ...theme, title });
  };

  const handleMetaphorSelect = (metaphorId: string) => {
    onUpdateTheme({ ...theme, visualMetaphor: metaphorId });
    setShowMetaphorPicker(false);
  };

  const handleColorSchemeSelect = (scheme: ColorScheme) => {
    onUpdateTheme({ ...theme, colorScheme: scheme });
    setShowColorPicker(false);
  };

  const addMetaphorMapping = () => {
    const newMapping: MetaphorMapping = { concept: '', metaphor: '' };
    const updatedMappings = [...customMappings, newMapping];
    setCustomMappings(updatedMappings);
    onUpdateTheme({ ...theme, metaphorMappings: updatedMappings });
  };

  const updateMapping = (index: number, field: keyof MetaphorMapping, value: string) => {
    const updated = [...customMappings];
    updated[index] = { ...updated[index], [field]: value };
    setCustomMappings(updated);
    onUpdateTheme({ ...theme, metaphorMappings: updated });
  };

  const removeMapping = (index: number) => {
    const updated = customMappings.filter((_, i) => i !== index);
    setCustomMappings(updated);
    onUpdateTheme({ ...theme, metaphorMappings: updated });
  };

  return (
    <div className="space-y-4">
      {/* Lecture Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <LightBulbIcon className="w-4 h-4 inline mr-2" />
          Lecture Topic
        </label>
        <input
          type="text"
          value={theme.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., COPD Management in the Hospitalized Patient"
          disabled={disabled}
          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl 
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                     focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
      </div>

      {/* Visual Metaphor */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <SparklesIcon className="w-4 h-4 inline mr-2" />
          Visual Metaphor (Optional)
        </label>
        <button
          onClick={() => setShowMetaphorPicker(!showMetaphorPicker)}
          disabled={disabled}
          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl
                     text-left flex items-center justify-between hover:border-zinc-600
                     transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">{selectedMetaphor.icon}</span>
            <span>
              <span className="text-white">{selectedMetaphor.name}</span>
              {selectedMetaphor.bestFor.length > 0 && selectedMetaphor.id !== 'none' && (
                <span className="text-zinc-500 text-sm ml-2">
                  Best for: {selectedMetaphor.bestFor.slice(0, 2).join(', ')}
                </span>
              )}
            </span>
          </span>
          <SwatchIcon className="w-5 h-5 text-zinc-400" />
        </button>

        {showMetaphorPicker && (
          <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                          shadow-2xl max-h-80 overflow-y-auto">
            {VISUAL_METAPHORS.map((metaphor) => (
              <button
                key={metaphor.id}
                onClick={() => handleMetaphorSelect(metaphor.id)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/80 
                           transition-colors text-left border-b border-zinc-800 last:border-0
                           ${metaphor.id === selectedMetaphor.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : ''}`}
              >
                <span className="text-2xl">{metaphor.icon}</span>
                <div>
                  <div className="text-white font-medium">{metaphor.name}</div>
                  {metaphor.bestFor.length > 0 && metaphor.id !== 'none' && (
                    <div className="text-zinc-500 text-xs">
                      {metaphor.bestFor.join(' • ')}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metaphor Mappings (if metaphor selected) */}
      {theme.visualMetaphor && theme.visualMetaphor !== 'none' && (
        <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-300 font-medium">Metaphor Mappings</span>
            <button
              onClick={addMetaphorMapping}
              disabled={disabled}
              className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg
                         hover:bg-cyan-500/30 transition-colors"
            >
              + Add Mapping
            </button>
          </div>
          
          {customMappings.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">
              Map medical concepts to your metaphor (e.g., "bronchodilation" → "balloon inflation")
            </p>
          ) : (
            <div className="space-y-2">
              {customMappings.map((mapping, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={mapping.concept}
                    onChange={(e) => updateMapping(index, 'concept', e.target.value)}
                    placeholder="Medical concept"
                    className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg
                               text-sm text-white placeholder-zinc-500 focus:outline-none
                               focus:border-cyan-500"
                  />
                  <span className="text-zinc-500">→</span>
                  <input
                    type="text"
                    value={mapping.metaphor}
                    onChange={(e) => updateMapping(index, 'metaphor', e.target.value)}
                    placeholder="Metaphor equivalent"
                    className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg
                               text-sm text-white placeholder-zinc-500 focus:outline-none
                               focus:border-cyan-500"
                  />
                  <button
                    onClick={() => removeMapping(index)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Color Scheme */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <PaintBrushIcon className="w-4 h-4 inline mr-2" />
          Color Scheme
        </label>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          disabled={disabled}
          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl
                     text-left flex items-center justify-between hover:border-zinc-600
                     transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-3">
            <div className="flex gap-1">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedScheme.primary }} 
              />
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedScheme.secondary }} 
              />
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedScheme.accent }} 
              />
            </div>
            <span className="text-white">{selectedScheme.name}</span>
          </span>
        </button>

        {showColorPicker && (
          <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                          shadow-2xl overflow-hidden">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => handleColorSchemeSelect(scheme)}
                className={`w-full px-4 py-3 flex items-center gap-4 hover:bg-zinc-800/80 
                           transition-colors text-left border-b border-zinc-800 last:border-0
                           ${scheme.id === selectedScheme.id ? 'bg-cyan-500/10' : ''}`}
              >
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-zinc-600" 
                    style={{ backgroundColor: scheme.primary }} 
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-zinc-600" 
                    style={{ backgroundColor: scheme.secondary }} 
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-zinc-600" 
                    style={{ backgroundColor: scheme.accent }} 
                  />
                </div>
                <div>
                  <div className="text-white font-medium">{scheme.name}</div>
                  <div 
                    className="w-32 h-2 rounded mt-1"
                    style={{ 
                      background: `linear-gradient(to right, ${scheme.primary}, ${scheme.secondary}, ${scheme.accent})` 
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Preview */}
      {theme.title && (
        <div 
          className="rounded-xl p-4 border transition-all"
          style={{ 
            backgroundColor: selectedScheme.surface,
            borderColor: selectedScheme.primary + '40',
          }}
        >
          <div className="text-xs text-zinc-400 mb-2">Preview</div>
          <h3 
            className="text-lg font-bold mb-1"
            style={{ color: selectedScheme.primary }}
          >
            {selectedMetaphor.icon} {theme.title}
          </h3>
          <p style={{ color: selectedScheme.textMuted }} className="text-sm">
            {theme.visualMetaphor && theme.visualMetaphor !== 'none' 
              ? `Using "${selectedMetaphor.name}" metaphor throughout`
              : 'Standard clinical presentation'}
          </p>
        </div>
      )}
    </div>
  );
};

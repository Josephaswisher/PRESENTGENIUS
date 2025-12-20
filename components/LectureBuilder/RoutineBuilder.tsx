/**
 * Routine Builder - Visual timeline editor for slide animations
 */
import React, { useState } from 'react';
import {
  PlayIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  RoutineTemplate,
  RoutineStep,
  ROUTINE_TEMPLATES,
  AnimationEffect,
  AnimationTrigger,
} from '../../types/lecture';

interface RoutineBuilderProps {
  onApplyRoutine: (steps: RoutineStep[]) => void;
  disabled?: boolean;
}

const ANIMATION_EFFECTS: { value: AnimationEffect; label: string; icon: string }[] = [
  { value: 'fadeIn', label: 'Fade In', icon: '✨' },
  { value: 'fadeOut', label: 'Fade Out', icon: '💨' },
  { value: 'slideInLeft', label: 'Slide Left', icon: '⬅️' },
  { value: 'slideInRight', label: 'Slide Right', icon: '➡️' },
  { value: 'slideInUp', label: 'Slide Up', icon: '⬆️' },
  { value: 'slideInDown', label: 'Slide Down', icon: '⬇️' },
  { value: 'zoomIn', label: 'Zoom In', icon: '🔍' },
  { value: 'typewriter', label: 'Typewriter', icon: '⌨️' },
  { value: 'highlight', label: 'Highlight', icon: '🌟' },
  { value: 'draw', label: 'Draw Path', icon: '✏️' },
  { value: 'pulse', label: 'Pulse', icon: '💓' },
  { value: 'strikethrough', label: 'Strike', icon: '❌' },
  { value: 'bounce', label: 'Bounce', icon: '🏀' },
];

const TRIGGERS: { value: AnimationTrigger; label: string; icon: string }[] = [
  { value: 'onLoad', label: 'On Load', icon: '🚀' },
  { value: 'onClick', label: 'On Click', icon: '👆' },
  { value: 'withPrevious', label: 'With Previous', icon: '⏩' },
  { value: 'afterPrevious', label: 'After Previous', icon: '⏭️' },
  { value: 'onTimer', label: 'After Delay', icon: '⏱️' },
];

export const RoutineBuilder: React.FC<RoutineBuilderProps> = ({
  onApplyRoutine,
  disabled,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(null);
  const [customSteps, setCustomSteps] = useState<RoutineStep[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [previewStep, setPreviewStep] = useState<number | null>(null);

  const activeSteps = isCustomMode ? customSteps : (selectedTemplate?.steps || []);

  const selectTemplate = (template: RoutineTemplate) => {
    setSelectedTemplate(template);
    setCustomSteps([...template.steps]);
    setIsCustomMode(false);
  };

  const addStep = () => {
    const newStep: RoutineStep = {
      id: `step-${Date.now()}`,
      description: 'New animation',
      trigger: 'onClick',
      effect: 'fadeIn',
      delay: 0,
      duration: 500,
    };
    setCustomSteps([...customSteps, newStep]);
    setIsCustomMode(true);
  };

  const removeStep = (index: number) => {
    setCustomSteps(customSteps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<RoutineStep>) => {
    setCustomSteps(customSteps.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
    setIsCustomMode(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customSteps.length) return;
    
    const newSteps = [...customSteps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setCustomSteps(newSteps);
    setIsCustomMode(true);
  };

  const applyRoutine = () => {
    onApplyRoutine(activeSteps);
  };

  return (
    <div className="space-y-4">
      {/* Template Presets */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          🎬 Animation Routines
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ROUTINE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => selectTemplate(template)}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTemplate?.id === template.id && !isCustomMode
                  ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50'
                  : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{template.icon}</span>
                <span className="text-sm font-medium text-white">{template.name}</span>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Editor */}
      {(selectedTemplate || customSteps.length > 0) && (
        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-300">
              {isCustomMode ? 'Custom Routine' : selectedTemplate?.name}
            </span>
            <button
              onClick={addStep}
              disabled={disabled}
              className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg
                         hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
            >
              <PlusIcon className="w-3 h-3" />
              Add Step
            </button>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(isCustomMode ? customSteps : selectedTemplate?.steps || []).map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  previewStep === index 
                    ? 'bg-cyan-500/10 border-cyan-500/30' 
                    : 'bg-zinc-900/50 border-zinc-700/30'
                }`}
                onMouseEnter={() => setPreviewStep(index)}
                onMouseLeave={() => setPreviewStep(null)}
              >
                {/* Step Number */}
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                  {index + 1}
                </div>

                {/* Trigger */}
                <select
                  value={step.trigger}
                  onChange={(e) => updateStep(index, { trigger: e.target.value as AnimationTrigger })}
                  disabled={disabled}
                  className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white w-24"
                >
                  {TRIGGERS.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>

                {/* Effect */}
                <select
                  value={step.effect}
                  onChange={(e) => updateStep(index, { effect: e.target.value as AnimationEffect })}
                  disabled={disabled}
                  className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white flex-1"
                >
                  {ANIMATION_EFFECTS.map(e => (
                    <option key={e.value} value={e.value}>{e.icon} {e.label}</option>
                  ))}
                </select>

                {/* Duration */}
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-zinc-500" />
                  <input
                    type="number"
                    value={step.duration}
                    onChange={(e) => updateStep(index, { duration: Number(e.target.value) })}
                    disabled={disabled}
                    className="w-14 px-1 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white text-center"
                    min={100}
                    max={5000}
                    step={100}
                  />
                  <span className="text-xs text-zinc-500">ms</span>
                </div>

                {/* Reorder */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0 || disabled}
                    className="text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUpIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === customSteps.length - 1 || disabled}
                    className="text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeStep(index)}
                  disabled={disabled}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyRoutine}
              disabled={disabled || activeSteps.length === 0}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 
                         text-white rounded-lg font-medium text-sm flex items-center 
                         justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 
                         transition-all disabled:opacity-50"
            >
              <PlayIcon className="w-4 h-4" />
              Apply Routine
            </button>
          </div>
        </div>
      )}

      {/* Quick Preview */}
      {previewStep !== null && activeSteps[previewStep] && (
        <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
          <div className="text-xs text-zinc-400 mb-1">Preview</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {TRIGGERS.find(t => t.value === activeSteps[previewStep].trigger)?.icon}
            </span>
            <span className="text-sm text-white">
              {activeSteps[previewStep].description || 
                `${ANIMATION_EFFECTS.find(e => e.value === activeSteps[previewStep].effect)?.label} animation`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineBuilder;

/**
 * PlanPreviewPanel
 * Displays a structured generation plan for user review before full content generation.
 * Allows adding more context, regenerating the plan, or proceeding to generation.
 */

import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  AcademicCapIcon,
  LightBulbIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { GenerationPlan } from '../services/plan-generator';

interface PlanPreviewPanelProps {
  plan: GenerationPlan;
  isLoading?: boolean;
  onBack: () => void;
  onRegenerate: (additionalContext: string) => void;
  onGenerate: (additionalContext: string) => void;
}

export const PlanPreviewPanel: React.FC<PlanPreviewPanelProps> = ({
  plan,
  isLoading = false,
  onBack,
  onRegenerate,
  onGenerate,
}) => {
  const [additionalContext, setAdditionalContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const handleGenerate = () => {
    onGenerate(additionalContext);
  };

  const handleRegenerate = () => {
    onRegenerate(additionalContext);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-700/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generation Plan</h2>
              <p className="text-xs text-zinc-500">Review before generating content</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Edit
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Card */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-2">Summary</h3>
            <p className="text-white text-lg">{plan.summary}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mt-4">
              {plan.estimatedTime && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <ClockIcon className="w-4 h-4 text-cyan-400" />
                  {plan.estimatedTime}
                </div>
              )}
              {plan.learnerLevel && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <AcademicCapIcon className="w-4 h-4 text-green-400" />
                  {plan.learnerLevel}
                </div>
              )}
            </div>
          </div>

          {/* Output Formats */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
              Output Formats
            </h3>
            <div className="flex flex-wrap gap-2">
              {plan.outputs.map((output, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                >
                  <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300">
                    {output.format}
                    <span className="text-cyan-500 ml-1">({output.variant})</span>
                  </span>
                  <span className="text-xs text-cyan-600">{output.estimatedCount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Structure Preview */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Content Structure
            </h3>
            <div className="space-y-2">
              {plan.structure.map((section, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded text-purple-400 text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{section.section}</h4>
                    <p className="text-sm text-zinc-500 mt-0.5">{section.description}</p>
                  </div>
                  {section.estimatedItems && (
                    <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">
                      ~{section.estimatedItems} items
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Topics */}
          {plan.keyTopics && plan.keyTopics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Key Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.keyTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm text-amber-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Additions */}
          {plan.suggestedAdditions && plan.suggestedAdditions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-4 h-4 text-yellow-400" />
                Suggested Enhancements
              </h3>
              <div className="space-y-1">
                {plan.suggestedAdditions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors"
                    onClick={() => {
                      setAdditionalContext(prev =>
                        prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`
                      );
                      setShowContextInput(true);
                    }}
                  >
                    <PlusIcon className="w-4 h-4 text-green-500" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Context Input */}
          <div>
            {!showContextInput ? (
              <button
                onClick={() => setShowContextInput(true)}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add more context or refinements
              </button>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-400">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add more details, specific requirements, or click suggestions above..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Edit
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate Plan
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Content
                  <ChevronRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

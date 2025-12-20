/**
 * Companion Materials Panel
 * UI for generating and downloading PDF handouts, study guides, and reference cards
 */
import React, { useState } from 'react';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { extractContent, generateOutline, type ExtractedContent } from '../../services/content-extractor';
import { generatePDF, downloadPDF, type PDFType, type PDFOptions } from '../../services/pdf-generator';

interface CompanionMaterialsPanelProps {
  html: string;
  title: string;
  onClose: () => void;
}

interface MaterialOption {
  id: PDFType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MATERIAL_OPTIONS: MaterialOption[] = [
  {
    id: 'handout',
    name: 'Printable Handout',
    description: 'Key points and clinical pearls in a clean, printable format',
    icon: <DocumentTextIcon className="w-6 h-6" />,
    color: 'cyan',
  },
  {
    id: 'study-guide',
    name: 'Study Guide',
    description: 'Comprehensive guide with sections, key terms, and review questions',
    icon: <AcademicCapIcon className="w-6 h-6" />,
    color: 'indigo',
  },
  {
    id: 'reference-card',
    name: 'Quick Reference',
    description: 'Dense, pocket-sized reference card with essential information',
    icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'emerald',
  },
  {
    id: 'quiz-only',
    name: 'Assessment Only',
    description: 'Quiz questions extracted for testing purposes',
    icon: <QuestionMarkCircleIcon className="w-6 h-6" />,
    color: 'amber',
  },
  {
    id: 'full',
    name: 'Complete Materials',
    description: 'Everything combined: content, terms, questions, and references',
    icon: <DocumentArrowDownIcon className="w-6 h-6" />,
    color: 'purple',
  },
];

export function CompanionMaterialsPanel({ html, title, onClose }: CompanionMaterialsPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<PDFType>>(new Set(['handout']));
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [generating, setGenerating] = useState<PDFType | null>(null);
  const [generated, setGenerated] = useState<Set<PDFType>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract content on first render
  React.useEffect(() => {
    try {
      const content = extractContent(html, title);
      setExtractedContent(content);
    } catch (err) {
      setError('Failed to extract content from the presentation.');
      console.error('Content extraction error:', err);
    }
  }, [html, title]);

  const toggleSelection = (type: PDFType) => {
    const newSelection = new Set(selectedTypes);
    if (newSelection.has(type)) {
      newSelection.delete(type);
    } else {
      newSelection.add(type);
    }
    setSelectedTypes(newSelection);
  };

  const generateSingle = async (type: PDFType) => {
    if (!extractedContent) return;

    setGenerating(type);
    setError(null);

    try {
      const options: PDFOptions = {
        type,
        title,
        includeAnswers,
        author: 'VibePresenterPro',
      };

      const blob = await generatePDF(extractedContent, options);
      const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${type}.pdf`;
      downloadPDF(blob, filename);

      setGenerated(prev => new Set([...prev, type]));
    } catch (err) {
      setError(`Failed to generate ${type} PDF.`);
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    for (const type of selectedTypes) {
      await generateSingle(type);
    }
  };

  const copyOutline = () => {
    if (!extractedContent) return;
    const outline = generateOutline(extractedContent);
    navigator.clipboard.writeText(outline);
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; selectedBg: string }> = {
      cyan: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        text: 'text-cyan-400',
        selectedBg: 'bg-cyan-600',
      },
      indigo: {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        text: 'text-indigo-400',
        selectedBg: 'bg-indigo-600',
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        selectedBg: 'bg-emerald-600',
      },
      amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        selectedBg: 'bg-amber-600',
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        selectedBg: 'bg-purple-600',
      },
    };

    const c = colors[color] || colors.cyan;
    return selected
      ? `${c.selectedBg} border-transparent text-white`
      : `${c.bg} ${c.border} ${c.text} hover:border-opacity-60`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Generate Companion Materials</h2>
            <p className="text-sm text-zinc-400">Create downloadable PDFs from your presentation</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-800/50">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                Include answer key for quizzes
              </label>
              <button
                onClick={copyOutline}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Copy text outline
              </button>
            </div>
          </div>
        )}

        {/* Content Preview */}
        {extractedContent && (
          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-800/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Content Detected</p>
            <div className="flex flex-wrap gap-2">
              {extractedContent.sections.length > 0 && (
                <span className="px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300">
                  {extractedContent.sections.length} sections
                </span>
              )}
              {extractedContent.keyTerms.length > 0 && (
                <span className="px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300">
                  {extractedContent.keyTerms.length} key terms
                </span>
              )}
              {extractedContent.clinicalPearls.length > 0 && (
                <span className="px-2 py-1 bg-cyan-600/30 rounded text-xs text-cyan-300">
                  {extractedContent.clinicalPearls.length} clinical pearls
                </span>
              )}
              {extractedContent.quizQuestions.length > 0 && (
                <span className="px-2 py-1 bg-amber-600/30 rounded text-xs text-amber-300">
                  {extractedContent.quizQuestions.length} quiz questions
                </span>
              )}
              {extractedContent.objectives.length > 0 && (
                <span className="px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300">
                  {extractedContent.objectives.length} objectives
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Material Options */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-3">
            {MATERIAL_OPTIONS.map((option) => {
              const isSelected = selectedTypes.has(option.id);
              const isGenerating = generating === option.id;
              const isGenerated = generated.has(option.id);

              return (
                <div
                  key={option.id}
                  className={`relative rounded-lg border-2 transition-all cursor-pointer ${getColorClasses(
                    option.color,
                    isSelected
                  )}`}
                  onClick={() => toggleSelection(option.id)}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white border-white'
                          : 'border-current'
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3 h-3 text-zinc-900" />}
                    </div>

                    {/* Icon */}
                    <div className={isSelected ? 'text-white' : ''}>
                      {option.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <h3 className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                        {option.name}
                      </h3>
                      <p className={`text-sm ${isSelected ? 'text-white/70' : 'text-zinc-500'}`}>
                        {option.description}
                      </p>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSingle(option.id);
                      }}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isGenerated
                          ? 'bg-green-500/20 text-green-400'
                          : isGenerating
                          ? 'bg-zinc-700 text-zinc-400'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isGenerating ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : isGenerated ? (
                        <span className="flex items-center gap-1">
                          <CheckIcon className="w-4 h-4" />
                          Done
                        </span>
                      ) : (
                        'Download'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {selectedTypes.size} material{selectedTypes.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateAll}
                disabled={selectedTypes.size === 0 || generating !== null}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Generate Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanionMaterialsPanel;

/**
 * Printables Panel - Generate high-quality educational materials with Opus
 */
import React, { useState } from 'react';
import {
  DocumentTextIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  EyeIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  PrintableType,
  PrintableResult,
  generatePrintable,
  downloadPrintable,
} from '../services/printables';
import {
  generateStudentStudyGuide,
  generateQuickStudyGuide,
  type StudyGuideConfig,
} from '../services/student-study-guide';

interface PrintablesPanelProps {
  lectureContent: string;
  title: string;
  topic?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PrintableOption {
  type: PrintableType;
  name: string;
  description: string;
  icon: React.ReactNode;
  pages: string;
  color: string;
}

type ExtendedPrintableType = PrintableType | 'enhanced-study-guide';

interface PrintableOption {
  type: ExtendedPrintableType;
  name: string;
  description: string;
  icon: React.ReactNode;
  pages: string;
  color: string;
  isEnhanced?: boolean;
}

const PRINTABLE_OPTIONS: PrintableOption[] = [
  {
    type: 'enhanced-study-guide',
    name: 'Enhanced Study Guide',
    description: 'AI-powered study guide with key terms, clinical pearls, Cornell notes, and spaced repetition',
    icon: <AcademicCapIcon className="w-6 h-6" />,
    pages: '4-8 pages',
    color: 'indigo',
    isEnhanced: true,
  },
  {
    type: 'one-page-handout',
    name: 'One-Page Handout',
    description: 'Key points, tables, clinical pearls - all on one page',
    icon: <DocumentTextIcon className="w-6 h-6" />,
    pages: '1 page',
    color: 'cyan',
  },
  {
    type: 'study-guide',
    name: 'Basic Study Guide',
    description: 'Comprehensive notes with objectives, summaries, and self-assessment',
    icon: <BookOpenIcon className="w-6 h-6" />,
    pages: '2-4 pages',
    color: 'purple',
  },
  {
    type: 'follow-along',
    name: 'Follow-Along Guide',
    description: 'Fill-in-the-blank worksheet for active learning during lecture',
    icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
    pages: '2-3 pages',
    color: 'green',
  },
  {
    type: 'fast-facts',
    name: 'Fast Facts Card',
    description: 'Pocket-sized reference with critical values and quick algorithms',
    icon: <CreditCardIcon className="w-6 h-6" />,
    pages: 'Badge size',
    color: 'orange',
  },
  {
    type: 'board-questions',
    name: 'Board Questions',
    description: '8-10 USMLE-style questions with detailed explanations',
    icon: <QuestionMarkCircleIcon className="w-6 h-6" />,
    pages: '3-4 pages',
    color: 'pink',
  },
];

export const PrintablesPanel: React.FC<PrintablesPanelProps> = ({
  lectureContent,
  title,
  topic,
  isOpen,
  onClose,
}) => {
  const [selected, setSelected] = useState<Set<ExtendedPrintableType>>(new Set());
  const [generating, setGenerating] = useState<ExtendedPrintableType | null>(null);
  const [results, setResults] = useState<PrintableResult[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [showStudyGuideConfig, setShowStudyGuideConfig] = useState(false);
  const [studyGuideConfig, setStudyGuideConfig] = useState<StudyGuideConfig>({
    title: title,
    topic: topic || title,
    audience: 'medical-student',
    includeAnswerKey: true,
    includeCornellNotes: true,
    includeSpacedRepetition: true,
    includeQuickReference: true,
  });

  const toggleSelection = (type: ExtendedPrintableType) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const generateSelected = async () => {
    if (selected.size === 0) return;
    
    setError(null);
    const types = Array.from(selected);
    
    for (const type of types) {
      setGenerating(type);
      try {
        const result = await generatePrintable({
          type,
          lectureContent,
          title,
          topic: topic || title,
          audience: 'Medical Residents',
          duration: 30,
          slideCount: 25,
        });
        setResults(prev => [...prev.filter(r => r.type !== type), result]);
      } catch (err) {
        setError(`Failed to generate ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    setGenerating(null);
  };

  const generateSingle = async (type: ExtendedPrintableType) => {
    setGenerating(type);
    setError(null);
    setGenerationProgress('');

    try {
      if (type === 'enhanced-study-guide') {
        // Use the enhanced study guide generator
        const studyGuideResult = await generateStudentStudyGuide(
          lectureContent,
          {
            ...studyGuideConfig,
            title,
            topic: topic || title,
          },
          (message, progress) => {
            setGenerationProgress(`${message} (${progress}%)`);
          }
        );

        const result: PrintableResult = {
          type: 'study-guide', // Use compatible type
          html: studyGuideResult.html,
          title: `${title} - Enhanced Study Guide`,
        };

        setResults(prev => [...prev.filter(r => r.title !== result.title), result]);
      } else {
        // Use standard printable generator
        const result = await generatePrintable({
          type: type as PrintableType,
          lectureContent,
          title,
          topic: topic || title,
          audience: 'Medical Residents',
          duration: 30,
          slideCount: 25,
        });
        setResults(prev => [...prev.filter(r => r.type !== type), result]);
      }
    } catch (err) {
      setError(`Failed to generate: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setGenerating(null);
    setGenerationProgress('');
  };

  const getResult = (type: ExtendedPrintableType) => {
    if (type === 'enhanced-study-guide') {
      return results.find(r => r.title?.includes('Enhanced Study Guide'));
    }
    return results.find(r => r.type === type);
  };

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Generate Printables</h2>
              <p className="text-sm text-zinc-500">Powered by Claude Opus 👑</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Source Info */}
          <div className="mb-4 p-3 bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-400">Generating from:</div>
            <div className="font-medium text-white">{title}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {lectureContent.length.toLocaleString()} characters of content
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Printable Options */}
          <div className="grid gap-3">
            {PRINTABLE_OPTIONS.map((option) => {
              const result = getResult(option.type);
              const isGenerating = generating === option.type;
              const isSelected = selected.has(option.type);
              const colors = colorClasses[option.color];

              return (
                <div
                  key={option.type}
                  className={`rounded-xl border transition-all ${
                    result
                      ? `${colors.bg} ${colors.border}`
                      : isSelected
                      ? 'bg-zinc-800 border-cyan-500/50'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelection(option.type)}
                      disabled={isGenerating}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected || result
                          ? `${colors.border} ${colors.bg}`
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      {(isSelected || result) && (
                        <CheckCircleIcon className={`w-4 h-4 ${colors.text}`} />
                      )}
                    </button>

                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                      {option.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{option.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-zinc-400">
                          {option.pages}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">{option.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isGenerating ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            Generating...
                          </div>
                          {generationProgress && (
                            <span className="text-xs text-zinc-500">{generationProgress}</span>
                          )}
                        </div>
                      ) : result ? (
                        <>
                          <button
                            onClick={() => setPreviewHtml(result.html)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadPrintable(result)}
                            className={`p-2 ${colors.text} hover:bg-zinc-700 rounded-lg`}
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {option.isEnhanced && (
                            <button
                              onClick={() => setShowStudyGuideConfig(true)}
                              className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700 rounded-lg"
                              title="Configure study guide options"
                            >
                              <Cog6ToothIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => generateSingle(option.type)}
                            className={`px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-1 ${
                              option.isEnhanced
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                                : 'bg-zinc-700 hover:bg-zinc-600'
                            }`}
                          >
                            <SparklesIcon className="w-3 h-3" />
                            {option.isEnhanced ? 'Generate Enhanced' : 'Generate'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            {selected.size > 0 && `${selected.size} selected`}
            {results.length > 0 && ` • ${results.length} generated`}
          </div>
          <div className="flex gap-2">
            {results.length > 0 && (
              <button
                onClick={() => results.forEach(downloadPrintable)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download All
              </button>
            )}
            <button
              onClick={generateSelected}
              disabled={selected.size === 0 || generating !== null}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-sm font-medium text-white 
                         flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                         hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <SparklesIcon className="w-4 h-4" />
              Generate Selected
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 bg-zinc-100 border-b">
              <span className="font-medium text-zinc-700">Preview</span>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-1 text-zinc-500 hover:text-zinc-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full"
              title="Printable Preview"
            />
          </div>
        </div>
      )}

      {/* Study Guide Configuration Modal */}
      {showStudyGuideConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <AcademicCapIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Study Guide Options</h3>
                  <p className="text-xs text-zinc-500">Customize your study guide</p>
                </div>
              </div>
              <button
                onClick={() => setShowStudyGuideConfig(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Audience Selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Target Audience
                </label>
                <select
                  value={studyGuideConfig.audience}
                  onChange={(e) => setStudyGuideConfig(prev => ({
                    ...prev,
                    audience: e.target.value as StudyGuideConfig['audience']
                  }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="medical-student">Medical Student</option>
                  <option value="resident">Resident</option>
                  <option value="attending">Attending Physician</option>
                  <option value="nurse">Nursing Professional</option>
                  <option value="general">General Healthcare</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={studyGuideConfig.includeCornellNotes}
                    onChange={(e) => setStudyGuideConfig(prev => ({
                      ...prev,
                      includeCornellNotes: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-sm text-white group-hover:text-indigo-300">Cornell Notes Sections</span>
                    <p className="text-xs text-zinc-500">Add cue/notes/summary boxes for each section</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={studyGuideConfig.includeSpacedRepetition}
                    onChange={(e) => setStudyGuideConfig(prev => ({
                      ...prev,
                      includeSpacedRepetition: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-sm text-white group-hover:text-indigo-300">Spaced Repetition Tracker</span>
                    <p className="text-xs text-zinc-500">Include review schedule for optimal retention</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={studyGuideConfig.includeQuickReference}
                    onChange={(e) => setStudyGuideConfig(prev => ({
                      ...prev,
                      includeQuickReference: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-sm text-white group-hover:text-indigo-300">Quick Reference Section</span>
                    <p className="text-xs text-zinc-500">Consolidated clinical pearls at the end</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={studyGuideConfig.includeAnswerKey}
                    onChange={(e) => setStudyGuideConfig(prev => ({
                      ...prev,
                      includeAnswerKey: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-sm text-white group-hover:text-indigo-300">Show Answer Key Inline</span>
                    <p className="text-xs text-zinc-500">Display answers with questions (uncheck for separate key)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setShowStudyGuideConfig(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowStudyGuideConfig(false);
                  generateSingle('enhanced-study-guide');
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-medium text-white flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                Generate Study Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintablesPanel;

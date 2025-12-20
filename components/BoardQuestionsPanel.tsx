/**
 * Board Questions Panel - Generate and display board-style questions
 */
import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  BoardQuestion,
  generateBoardQuestions,
  QuestionGenerationConfig,
  formatQuestionForDisplay,
  formatExplanation,
} from '../services/board-questions';
import { AIProvider } from '../services/ai-provider';

interface BoardQuestionsPanelProps {
  topic?: string;
  onInsertQuestions?: (questions: BoardQuestion[]) => void;
  provider?: AIProvider;
}

export const BoardQuestionsPanel: React.FC<BoardQuestionsPanelProps> = ({
  topic: initialTopic = '',
  onInsertQuestions,
  provider = 'gemini',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [style, setStyle] = useState<QuestionGenerationConfig['style']>('usmle-step2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<BoardQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setQuestions([]);
    setRevealedAnswers(new Set());
    setSelectedAnswers({});

    try {
      const newQuestions = await generateBoardQuestions({
        topic,
        count,
        difficulty,
        style,
        includeExplanations: true,
        provider,
      });
      setQuestions(newQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAnswer = (questionId: string) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const selectAnswer = (questionId: string, letter: string) => {
    if (revealedAnswers.has(questionId)) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: letter }));
  };

  const copyQuestion = (question: BoardQuestion) => {
    const text = formatQuestionForDisplay(question) + '\n\n' + formatExplanation(question);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-white">Board Questions</span>
        </div>

        {/* Topic Input */}
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (e.g., Acute coronary syndrome)"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                     text-white text-sm placeholder-zinc-500 focus:outline-none
                     focus:border-purple-500 mb-2"
        />

        {/* Options Row */}
        <div className="flex flex-wrap gap-2 mb-2">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
          >
            <option value={1}>1 Q</option>
            <option value={3}>3 Qs</option>
            <option value={5}>5 Qs</option>
            <option value={10}>10 Qs</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as typeof style)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
          >
            <option value="usmle-step1">Step 1</option>
            <option value="usmle-step2">Step 2</option>
            <option value="usmle-step3">Step 3</option>
            <option value="shelf">Shelf</option>
            <option value="board-certification">Boards</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2
                      transition-all ${
                        isGenerating || !topic.trim()
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              Generate Questions
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {questions.map((question, index) => {
            const isExpanded = expandedQuestion === question.id;
            const isRevealed = revealedAnswers.has(question.id);
            const userAnswer = selectedAnswers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div
                key={question.id}
                className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden"
              >
                {/* Question Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-zinc-800/80"
                  onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                          Q{index + 1}
                        </span>
                        <span className="text-xs text-zinc-500">{question.difficulty}</span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">
                        {question.stem.slice(0, 150)}...
                      </p>
                    </div>
                    {isRevealed && (
                      <div className={`flex-shrink-0 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <XCircleIcon className="w-5 h-5" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Full Stem */}
                    <p className="text-sm text-zinc-300">{question.stem}</p>

                    {/* Options */}
                    <div className="space-y-1">
                      {question.options.map((option) => {
                        const isSelected = userAnswer === option.letter;
                        const showCorrect = isRevealed && option.isCorrect;
                        const showWrong = isRevealed && isSelected && !option.isCorrect;

                        return (
                          <button
                            key={option.letter}
                            onClick={() => selectAnswer(question.id, option.letter)}
                            disabled={isRevealed}
                            className={`w-full p-2 rounded-lg text-left text-sm flex items-start gap-2
                                        transition-all ${
                                          showCorrect
                                            ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                            : showWrong
                                            ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                                            : isSelected
                                            ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                                            : 'bg-zinc-700/30 border border-transparent hover:bg-zinc-700/50 text-zinc-300'
                                        }`}
                          >
                            <span className="font-medium">{option.letter}.</span>
                            <span className="flex-1">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Reveal/Hide Answer */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAnswer(question.id)}
                        className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg
                                   text-xs text-zinc-300 flex items-center justify-center gap-1"
                      >
                        {isRevealed ? (
                          <>
                            <EyeSlashIcon className="w-3 h-3" /> Hide Answer
                          </>
                        ) : (
                          <>
                            <EyeIcon className="w-3 h-3" /> Show Answer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => copyQuestion(question)}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg
                                   text-xs text-zinc-300 flex items-center gap-1"
                      >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Explanation (when revealed) */}
                    {isRevealed && (
                      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                        <div className="text-xs text-zinc-400 mb-1">Explanation</div>
                        <p className="text-sm text-zinc-300">{question.explanation}</p>
                        
                        {question.teachingPoints.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-zinc-400 mb-1">Teaching Points</div>
                            <ul className="text-xs text-cyan-400 space-y-0.5">
                              {question.teachingPoints.map((point, i) => (
                                <li key={i}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Insert All Button */}
          {onInsertQuestions && (
            <button
              onClick={() => onInsertQuestions(questions)}
              className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30
                         rounded-lg text-purple-400 text-sm font-medium"
            >
              Insert All Questions into Lecture
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardQuestionsPanel;

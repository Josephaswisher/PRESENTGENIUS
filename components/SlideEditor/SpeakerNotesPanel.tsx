/**
 * SpeakerNotesPanel Component
 * Editor for slide speaker notes with teleprompter preview
 */

import React, { useState } from 'react';
import {
  MicrophoneIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useSlideStore } from '../../stores/slide.store';

interface SpeakerNotesPanelProps {
  className?: string;
}

export const SpeakerNotesPanel: React.FC<SpeakerNotesPanelProps> = ({
  className = '',
}) => {
  const {
    presentation,
    currentSlideIndex,
    updateSpeakerNotes,
  } = useSlideStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const currentSlide = presentation?.slides[currentSlideIndex];
  const notes = currentSlide?.speakerNotes || '';

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSpeakerNotes(currentSlideIndex, e.target.value);
  };

  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    // TODO: Call AI service to generate speaker notes based on slide content
    setTimeout(() => {
      const generatedNotes = `Key points to cover:

1. Introduce the main concept
2. Explain the significance
3. Provide examples or evidence
4. Summarize key takeaways

Remember to:
- Make eye contact with the audience
- Pace yourself - aim for 1-2 minutes per slide
- Ask if there are any questions`;

      updateSpeakerNotes(currentSlideIndex, generatedNotes);
      setIsGenerating(false);
    }, 1500);
  };

  // Estimate speaking time (roughly 150 words per minute)
  const wordCount = notes.split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.ceil(wordCount / 150);

  if (!presentation || !currentSlide) return null;

  return (
    <div className={`flex flex-col bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <MicrophoneIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">
            Speaker Notes - Slide {currentSlideIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Word/Time estimate */}
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <ClockIcon className="w-3 h-3" />
            <span>~{estimatedMinutes} min</span>
            <span className="text-zinc-600">|</span>
            <span>{wordCount} words</span>
          </div>

          {/* AI Generate Button */}
          <button
            onClick={handleGenerateNotes}
            disabled={isGenerating}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors
              ${isGenerating
                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              }
            `}
          >
            <SparklesIcon className={`w-3 h-3 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </button>

          {/* Teleprompter Toggle */}
          <button
            onClick={() => setShowTeleprompter(!showTeleprompter)}
            className={`
              p-1 rounded transition-colors
              ${showTeleprompter
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-400 hover:bg-zinc-700'
              }
            `}
            title="Teleprompter View"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Editor */}
      <div className="flex-1 p-2">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add speaker notes for this slide... Press AI Generate for suggestions."
          className="w-full h-full bg-zinc-800 text-zinc-200 text-sm rounded-lg p-3
                     border border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500
                     resize-none outline-none placeholder:text-zinc-500"
        />
      </div>

      {/* Teleprompter Modal */}
      {showTeleprompter && (
        <TeleprompterView
          notes={notes}
          slideTitle={currentSlide.title}
          onClose={() => setShowTeleprompter(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// TELEPROMPTER VIEW COMPONENT
// ============================================================================

interface TeleprompterViewProps {
  notes: string;
  slideTitle: string;
  onClose: () => void;
}

const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  notes,
  slideTitle,
  onClose,
}) => {
  const [fontSize, setFontSize] = useState(24);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  React.useEffect(() => {
    if (!isScrolling) return;

    const scrollContainer = document.getElementById('teleprompter-content');
    if (!scrollContainer) return;

    const interval = setInterval(() => {
      scrollContainer.scrollTop += scrollSpeed;
    }, 50);

    return () => clearInterval(interval);
  }, [isScrolling, scrollSpeed]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-white">{slideTitle}</h2>
          <p className="text-sm text-zinc-400">Teleprompter Mode</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Font Size Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(16, fontSize - 2))}
              className="px-2 py-1 bg-zinc-800 rounded text-zinc-300 hover:bg-zinc-700"
            >
              A-
            </button>
            <span className="text-zinc-400 text-sm w-12 text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(48, fontSize + 2))}
              className="px-2 py-1 bg-zinc-800 rounded text-zinc-300 hover:bg-zinc-700"
            >
              A+
            </button>
          </div>

          {/* Scroll Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScrolling(!isScrolling)}
              className={`
                px-3 py-1.5 rounded font-medium transition-colors
                ${isScrolling
                  ? 'bg-red-500 text-white'
                  : 'bg-green-500 text-white'
                }
              `}
            >
              {isScrolling ? 'Pause' : 'Auto-scroll'}
            </button>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        id="teleprompter-content"
        className="flex-1 overflow-y-auto px-8 py-12"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-white whitespace-pre-wrap leading-relaxed">
            {notes || 'No speaker notes for this slide.'}
          </div>
          {/* Spacer at bottom for scrolling */}
          <div className="h-96" />
        </div>
      </div>
    </div>
  );
};

export default SpeakerNotesPanel;

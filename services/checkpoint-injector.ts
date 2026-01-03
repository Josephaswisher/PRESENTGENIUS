/**
 * Checkpoint Injector
 * Automatically injects knowledge checkpoint slides every 3 slides
 * Uses board-questions.ts for question generation
 */

import { generateQuestionsFromContent, BoardQuestion } from './board-questions';
import { AIProvider } from './ai-provider';

export interface CheckpointConfig {
  interval: number; // Number of slides between checkpoints (default: 3)
  provider?: AIProvider;
  includeActiveRecall?: boolean;
  includeElaborative?: boolean;
}

/**
 * Extract text content from HTML section
 */
function extractTextFromSection(sectionHtml: string): string {
  // Remove script tags and their content
  const withoutScripts = sectionHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  const withoutStyles = withoutScripts.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags but keep text content
  const textOnly = withoutStyles.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace
  return textOnly.replace(/\s+/g, ' ').trim();
}

/**
 * Extract sections from HTML document
 */
function extractSections(html: string): string[] {
  const sections: string[] = [];

  // Match <section> tags
  const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let match;

  while ((match = sectionRegex.exec(html)) !== null) {
    sections.push(match[0]);
  }

  // If no sections found, try splitting by H1/H2 headings
  if (sections.length === 0) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      const headingSplit = bodyContent.split(/(?=<h[12][^>]*>)/i);

      headingSplit.forEach(chunk => {
        if (chunk.trim()) {
          sections.push(`<section class="slide-section">${chunk}</section>`);
        }
      });
    }
  }

  return sections;
}

/**
 * Create checkpoint slide HTML from question data
 */
function createCheckpointSlideHTML(
  question: BoardQuestion,
  slideNumber: number,
  previousSlideTexts: string[]
): string {
  // Active recall prompts
  const recallPrompts = [
    "Without looking back, what were the 3 key points from the previous slides?",
    "Can you summarize the main concepts in your own words?",
    "What are the most important takeaways you should remember?"
  ];

  // Elaborative prompts based on content
  const elaborativePrompts = [
    `Why does ${extractKeyPhrase(previousSlideTexts[0])}?`,
    `How does ${extractKeyPhrase(previousSlideTexts[1])} relate to ${extractKeyPhrase(previousSlideTexts[2])}?`,
    `What would happen if ${extractKeyPhrase(previousSlideTexts[0])} changed?`
  ];

  return `
<section class="checkpoint-slide min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 font-sans">
  <!-- Header -->
  <div class="max-w-4xl mx-auto mb-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-yellow-300 text-sm font-bold uppercase tracking-wider animate-pulse">
          🧠 Knowledge Checkpoint
        </span>
        <span class="text-slate-400 text-sm">After Slide ${slideNumber}</span>
      </div>
      <div class="text-slate-400 text-sm">
        📊 Active Learning
      </div>
    </div>
  </div>

  <!-- Active Recall Section -->
  <div class="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur border border-blue-500/30 rounded-2xl p-6">
    <div class="flex items-start gap-3 mb-4">
      <span class="text-3xl">🤔</span>
      <div class="flex-1">
        <h3 class="text-cyan-300 font-bold text-xl mb-3">Active Recall</h3>
        <div class="space-y-3">
          ${recallPrompts.map(prompt => `
            <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <p class="text-slate-200 text-lg">${prompt}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Clinical Application Question -->
  <div class="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">

    <!-- Question Header -->
    <div class="p-6 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-slate-700/50">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-2xl">💡</span>
        <h4 class="text-purple-300 font-bold text-lg">Apply Your Knowledge</h4>
      </div>
      <p class="text-slate-300 text-sm">Based on what you just learned...</p>
    </div>

    <!-- Clinical Vignette -->
    <div class="p-6 border-b border-slate-700/50">
      <p class="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">${question.stem}</p>
    </div>

    <!-- Answer Options -->
    <div class="p-6 space-y-3" id="checkpoint-options-${slideNumber}">
      ${question.options.map(option => `
        <button
          onclick="selectCheckpointOption(this, ${option.isCorrect}, '${slideNumber}')"
          class="checkpoint-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group"
        >
          <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">
            ${option.letter}
          </span>
          <span class="text-slate-200">${option.text}</span>
        </button>
      `).join('')}
    </div>

    <!-- Explanation (Hidden initially) -->
    <div id="checkpoint-explanation-${slideNumber}" class="hidden p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-t border-emerald-500/20">
      <div class="flex items-start gap-3">
        <span class="text-2xl">✅</span>
        <div>
          <h4 class="text-emerald-400 font-bold text-lg mb-2">Correct Answer: ${question.correctAnswer}</h4>
          <p class="text-slate-300 leading-relaxed">${question.explanation}</p>

          ${question.teachingPoints.length > 0 ? `
            <div class="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h5 class="text-cyan-400 font-semibold mb-2">💡 Key Teaching Points</h5>
              <ul class="space-y-2">
                ${question.teachingPoints.map(point => `
                  <li class="text-slate-300 text-sm flex items-start gap-2">
                    <span class="text-cyan-400 mt-1">•</span>
                    <span>${point}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="mt-4 space-y-2">
            <h5 class="text-red-400 font-semibold text-sm">Why other options are incorrect:</h5>
            ${question.options.filter(opt => !opt.isCorrect && opt.whyWrong).map(opt => `
              <div class="text-slate-400 text-sm">
                <strong>${opt.letter}.</strong> ${opt.whyWrong}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Elaborative Questions -->
  <div class="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-orange-500/10 to-pink-500/10 backdrop-blur border border-orange-500/30 rounded-2xl p-6">
    <div class="flex items-start gap-3">
      <span class="text-3xl">🔍</span>
      <div class="flex-1">
        <h3 class="text-orange-300 font-bold text-xl mb-3">Deeper Understanding</h3>
        <div class="space-y-3">
          ${elaborativePrompts.slice(0, 2).map(prompt => `
            <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <p class="text-slate-200">${prompt}</p>
            </div>
          `).join('')}
        </div>
        <p class="text-slate-400 text-sm mt-4 italic">Think about these questions before moving on...</p>
      </div>
    </div>
  </div>

  <!-- Navigation Hint -->
  <div class="max-w-4xl mx-auto mt-6 text-center">
    <button
      onclick="revealCheckpointAnswer('${slideNumber}')"
      id="checkpoint-submit-${slideNumber}"
      class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg"
    >
      Submit Answer
    </button>
  </div>
</section>

<script>
(function() {
  const checkpointState = window.checkpointState || {};
  window.checkpointState = checkpointState;

  window.selectCheckpointOption = function(element, isCorrect, slideNum) {
    const container = element.closest('[id^="checkpoint-options"]');
    if (!container) return;

    // Remove previous selection
    container.querySelectorAll('.checkpoint-option').forEach(opt => {
      opt.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/20');
    });

    // Mark current selection
    element.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/20');
    checkpointState['selected_' + slideNum] = {
      element,
      isCorrect
    };
  };

  window.revealCheckpointAnswer = function(slideNum) {
    const state = checkpointState['selected_' + slideNum];

    if (!state) {
      showCheckpointToast('Please select an answer first', 'error');
      return;
    }

    // Show explanation
    const explanation = document.getElementById('checkpoint-explanation-' + slideNum);
    if (explanation) {
      explanation.classList.remove('hidden');
      explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Mark correct/incorrect
    const container = document.getElementById('checkpoint-options-' + slideNum);
    if (container) {
      container.querySelectorAll('.checkpoint-option').forEach(opt => {
        const letter = opt.querySelector('span:first-child').textContent.trim();
        const isCorrectOption = opt.querySelector('span:first-child').textContent === '${question.correctAnswer}';

        if (isCorrectOption) {
          opt.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-500/20');
          opt.querySelector('span:first-child').classList.add('bg-emerald-500', 'text-white');
        } else if (opt.classList.contains('ring-indigo-500')) {
          opt.classList.remove('ring-indigo-500');
          opt.classList.add('ring-2', 'ring-red-500', 'bg-red-500/20');
          opt.querySelector('span:first-child').classList.remove('bg-slate-600');
          opt.querySelector('span:first-child').classList.add('bg-red-500', 'text-white');
        }

        opt.onclick = null;
      });
    }

    // Update submit button
    const submitBtn = document.getElementById('checkpoint-submit-' + slideNum);
    if (submitBtn) {
      submitBtn.textContent = state.isCorrect ? '✅ Correct!' : '❌ Review Explanation';
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Show feedback toast
    if (state.isCorrect) {
      showCheckpointToast('Excellent! You got it right! 🎉', 'success');
    } else {
      showCheckpointToast('Review the explanation to understand why', 'info');
    }
  };

  window.showCheckpointToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                    type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                    'bg-blue-500/10 border-blue-500/30';
    const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';

    toast.className = \`fixed top-4 right-4 z-[9999] flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg shadow-black/20 max-w-md \${bgColor}\`;
    toast.innerHTML = \`
      <span class="text-2xl">\${icon}</span>
      <div class="flex-1 text-sm text-slate-100 leading-relaxed">\${message}</div>
    \`;
    toast.style.animation = 'slideInRight 0.3s ease-out';

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Add animation styles
  if (!document.getElementById('checkpoint-animations')) {
    const style = document.createElement('style');
    style.id = 'checkpoint-animations';
    style.textContent = \`
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    \`;
    document.head.appendChild(style);
  }
})();
</script>
`;
}

/**
 * Helper to extract a key phrase from text
 */
function extractKeyPhrase(text: string): string {
  if (!text) return 'the concept';

  // Try to find a medical term or key phrase
  const words = text.split(/\s+/);

  // Look for capitalized medical terms
  const medicalTerms = words.filter(w => /^[A-Z][a-z]+/.test(w) && w.length > 4);
  if (medicalTerms.length > 0) {
    return medicalTerms[0].toLowerCase();
  }

  // Otherwise return first meaningful phrase
  const meaningful = words.slice(0, 5).join(' ');
  return meaningful.length > 50 ? meaningful.slice(0, 50) + '...' : meaningful;
}

/**
 * Inject checkpoint slides into HTML presentation
 */
export async function injectCheckpointSlides(
  html: string,
  config: CheckpointConfig = { interval: 3 }
): Promise<string> {
  const { interval = 3, provider = 'gemini' } = config;

  console.log('🧠 [Checkpoint Injector] Starting checkpoint injection...');

  // Extract sections from the HTML
  const sections = extractSections(html);
  console.log(`📊 [Checkpoint Injector] Found ${sections.length} sections`);

  if (sections.length < interval) {
    console.log(`⚠️ [Checkpoint Injector] Not enough slides (${sections.length}) to inject checkpoints`);
    return html;
  }

  // Build new sections array with checkpoints injected
  const newSections: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    // Add the original slide
    newSections.push(sections[i]);

    // Check if we should add a checkpoint after this slide
    const slideNumber = i + 1;
    const shouldAddCheckpoint = slideNumber % interval === 0 && i < sections.length - 1;

    if (shouldAddCheckpoint) {
      console.log(`✨ [Checkpoint Injector] Adding checkpoint after slide ${slideNumber}`);

      // Get content from previous 3 slides
      const startIndex = Math.max(0, i - interval + 1);
      const previousSlides = sections.slice(startIndex, i + 1);

      // Extract text content from previous slides
      const previousTexts = previousSlides.map(extractTextFromSection);
      const combinedContent = previousTexts.join('\n\n');

      try {
        // Generate question from content
        console.log(`🤖 [Checkpoint Injector] Generating question for slides ${startIndex + 1}-${slideNumber}...`);
        const questions = await generateQuestionsFromContent(combinedContent, 1, provider);

        if (questions.length > 0) {
          const checkpointSlide = createCheckpointSlideHTML(
            questions[0],
            slideNumber,
            previousTexts
          );
          newSections.push(checkpointSlide);
          console.log(`✅ [Checkpoint Injector] Checkpoint slide created after slide ${slideNumber}`);
        } else {
          console.warn(`⚠️ [Checkpoint Injector] No questions generated for checkpoint ${slideNumber}`);
        }
      } catch (error) {
        console.error(`❌ [Checkpoint Injector] Failed to generate checkpoint for slide ${slideNumber}:`, error);
        // Continue processing other checkpoints even if one fails
      }
    }
  }

  // Reconstruct HTML with new sections
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    console.warn('⚠️ [Checkpoint Injector] Could not find body tag, returning original HTML');
    return html;
  }

  const newBodyContent = newSections.join('\n\n');
  const newHtml = html.replace(
    /<body[^>]*>[\s\S]*?<\/body>/i,
    `<body class="presentation-with-checkpoints">\n${newBodyContent}\n</body>`
  );

  console.log(`✅ [Checkpoint Injector] Injection complete. Added ${Math.floor(sections.length / interval)} checkpoint slides`);

  return newHtml;
}

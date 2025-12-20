/**
 * VibePresenterPro - Board-Style MCQ Template
 * USMLE/COMLEX format with clinical vignette and 5 options
 */

export const BOARD_MCQ_TEMPLATE = `
<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-sans">
  <!-- Header -->
  <div class="max-w-4xl mx-auto mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
          Board Review
        </span>
        <span class="text-slate-400 text-sm">Question 1 of 5</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-500 text-sm">⏱️ 1:30</span>
        <button class="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
          Flag for Review
        </button>
      </div>
    </div>
  </div>

  <!-- Question Card -->
  <div class="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">

    <!-- Clinical Vignette -->
    <div class="p-6 border-b border-slate-700/50">
      <p class="text-slate-200 text-lg leading-relaxed">
        A 58-year-old man with a history of hypertension and type 2 diabetes presents to the emergency department with crushing substernal chest pain radiating to his left arm for the past 45 minutes. He is diaphoretic and appears anxious. His blood pressure is 160/95 mmHg, heart rate 98 bpm, and oxygen saturation 94% on room air.
      </p>
      <p class="text-slate-200 text-lg leading-relaxed mt-4">
        ECG shows ST-segment elevation in leads V1-V4. Initial troponin I is 0.8 ng/mL (normal <0.04 ng/mL).
      </p>
      <p class="text-slate-300 text-lg font-medium mt-6">
        Which of the following is the most appropriate next step in management?
      </p>
    </div>

    <!-- Answer Options -->
    <div class="p-6 space-y-3" id="quiz-options">
      <button onclick="selectOption(this, false)" class="quiz-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group">
        <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">A</span>
        <span class="text-slate-200">Order a stress echocardiogram</span>
      </button>

      <button onclick="selectOption(this, false)" class="quiz-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group">
        <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">B</span>
        <span class="text-slate-200">Administer aspirin, heparin, and arrange for emergent cardiac catheterization</span>
      </button>

      <button onclick="selectOption(this, false)" class="quiz-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group">
        <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">C</span>
        <span class="text-slate-200">Start IV metoprolol and observe in the cardiac care unit</span>
      </button>

      <button onclick="selectOption(this, false)" class="quiz-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group">
        <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">D</span>
        <span class="text-slate-200">Obtain a CT coronary angiogram</span>
      </button>

      <button onclick="selectOption(this, false)" class="quiz-option w-full flex items-start gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 rounded-xl text-left transition-all group">
        <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-600/50 group-hover:bg-slate-600 rounded-lg text-slate-300 font-bold">E</span>
        <span class="text-slate-200">Discharge with outpatient cardiology follow-up</span>
      </button>
    </div>

    <!-- Explanation (Hidden initially) -->
    <div id="explanation" class="hidden p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-t border-emerald-500/20">
      <div class="flex items-start gap-3">
        <span class="text-2xl">✅</span>
        <div>
          <h4 class="text-emerald-400 font-bold text-lg mb-2">Correct Answer: B</h4>
          <p class="text-slate-300 leading-relaxed">
            This patient is presenting with an <strong>ST-elevation myocardial infarction (STEMI)</strong>. The classic presentation includes crushing chest pain, ECG changes (ST elevation in contiguous leads), and elevated troponin.
          </p>
          <p class="text-slate-300 leading-relaxed mt-3">
            The standard of care for STEMI is <strong>emergent reperfusion therapy</strong>. Primary PCI (percutaneous coronary intervention) via cardiac catheterization is preferred if door-to-balloon time can be achieved within 90 minutes.
          </p>

          <div class="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h5 class="text-cyan-400 font-semibold mb-2">💡 Clinical Pearl</h5>
            <p class="text-slate-400 text-sm">
              Remember the STEMI treatment mnemonic: <strong>MONA-B</strong> (Morphine, Oxygen if needed, Nitroglycerin, Aspirin, Beta-blocker) + emergent reperfusion.
            </p>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">ACC/AHA 2023</span>
            <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">High-Yield</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <div class="max-w-4xl mx-auto mt-6 flex items-center justify-between">
    <button class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
      ← Previous
    </button>
    <button onclick="revealAnswer()" id="submit-btn" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors">
      Submit Answer
    </button>
    <button class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
      Next →
    </button>
  </div>
</div>

<script>
  let selectedOption = null;
  const correctAnswer = 'B';

  function selectOption(element, isCorrect) {
    // Remove previous selection
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/20');
    });

    // Mark current selection
    element.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/20');
    selectedOption = element.querySelector('span:first-child').textContent;
  }

  function revealAnswer() {
    if (!selectedOption) {
      alert('Please select an answer first');
      return;
    }

    // Show explanation
    document.getElementById('explanation').classList.remove('hidden');

    // Mark correct/incorrect
    document.querySelectorAll('.quiz-option').forEach(opt => {
      const letter = opt.querySelector('span:first-child').textContent;
      if (letter === correctAnswer) {
        opt.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-500/20');
        opt.querySelector('span:first-child').classList.add('bg-emerald-500', 'text-white');
      } else if (letter === selectedOption && letter !== correctAnswer) {
        opt.classList.add('ring-2', 'ring-red-500', 'bg-red-500/20');
        opt.querySelector('span:first-child').classList.add('bg-red-500', 'text-white');
      }
      opt.onclick = null; // Disable further clicks
    });

    // Update submit button
    document.getElementById('submit-btn').textContent = 'Answered';
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('submit-btn').classList.add('opacity-50', 'cursor-not-allowed');

    // Scroll to explanation
    document.getElementById('explanation').scrollIntoView({ behavior: 'smooth' });
  }
</script>
`;

export const BOARD_MCQ_PROMPT_AUGMENT = `
Generate a board-style multiple choice question following this exact format:

STRUCTURE:
1. Clinical vignette (2-3 paragraphs with patient presentation, vitals, lab/imaging findings)
2. A clear question stem asking for the "most appropriate next step" or "most likely diagnosis"
3. Five answer options (A-E) with one clearly correct answer
4. Detailed explanation revealing:
   - Why the correct answer is right
   - Why each distractor is wrong
   - A clinical pearl or high-yield takeaway
   - Relevant guideline citations

STYLE:
- Use realistic clinical scenarios
- Include specific numbers (vitals, lab values)
- Make distractors plausible but clearly distinguishable
- Include a timer display and navigation buttons
- Add "Flag for Review" functionality
- Use the dark medical theme with indigo accents

INTERACTIVITY:
- Click to select an option (highlight with ring)
- Submit button reveals the answer
- Correct answer shows green, wrong shows red
- Explanation panel slides in from bottom
`;

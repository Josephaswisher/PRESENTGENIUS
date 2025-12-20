/**
 * VibePresenterPro - Clinical True/False Template
 * Myth-busting format with nuance reveal
 */

export const CLINICAL_TF_TEMPLATE = `
<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6 font-sans">
  <!-- Header -->
  <div class="max-w-3xl mx-auto mb-8 text-center">
    <span class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-bold uppercase tracking-wider mb-4">
      <span>🎯</span> Clinical Myth Buster
    </span>
    <h1 class="text-3xl font-bold text-white mb-2">Cardiology Controversies</h1>
    <p class="text-slate-400">Test your knowledge on common clinical misconceptions</p>
  </div>

  <!-- Statement Cards -->
  <div class="max-w-3xl mx-auto space-y-4">

    <!-- Statement 1 -->
    <div class="tf-card bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden" data-answer="false">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <span class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-xl text-slate-400 text-lg font-bold">1</span>
          <div class="flex-1">
            <p class="text-slate-200 text-lg leading-relaxed">
              Beta-blockers are contraindicated in patients with heart failure with reduced ejection fraction (HFrEF).
            </p>
          </div>
        </div>

        <!-- True/False Buttons -->
        <div class="flex items-center gap-3 mt-6 ml-14">
          <button onclick="selectTF(this, 'true')" class="tf-btn flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-semibold transition-all">
            ✓ True
          </button>
          <button onclick="selectTF(this, 'false')" class="tf-btn flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 font-semibold transition-all">
            ✗ False
          </button>
        </div>

        <!-- Explanation (Hidden) -->
        <div class="explanation hidden mt-6 ml-14 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">🔬</span>
            <div>
              <h4 class="text-cyan-400 font-bold mb-2">FALSE - This is a Common Myth!</h4>
              <p class="text-slate-300 text-sm leading-relaxed">
                Beta-blockers are actually <strong>first-line therapy</strong> for HFrEF. While they were historically avoided, landmark trials (CIBIS-II, MERIT-HF, COPERNICUS) demonstrated significant mortality benefit.
              </p>
              <div class="mt-3 p-3 bg-slate-800/50 rounded-lg">
                <p class="text-yellow-300 text-xs font-medium">⚠️ Key Nuance:</p>
                <p class="text-slate-400 text-xs mt-1">
                  Start low and go slow ("start low, go slow"). Initiate when patient is euvolemic and titrate gradually. The three evidence-based beta-blockers are: carvedilol, metoprolol succinate, and bisoprolol.
                </p>
              </div>
              <div class="mt-3 flex gap-2">
                <span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">ACC/AHA Class I</span>
                <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">GDMT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statement 2 -->
    <div class="tf-card bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden" data-answer="true">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <span class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-xl text-slate-400 text-lg font-bold">2</span>
          <div class="flex-1">
            <p class="text-slate-200 text-lg leading-relaxed">
              Diastolic blood pressure below 60 mmHg in patients with coronary artery disease may worsen outcomes.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-6 ml-14">
          <button onclick="selectTF(this, 'true')" class="tf-btn flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-semibold transition-all">
            ✓ True
          </button>
          <button onclick="selectTF(this, 'false')" class="tf-btn flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 font-semibold transition-all">
            ✗ False
          </button>
        </div>

        <div class="explanation hidden mt-6 ml-14 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">✅</span>
            <div>
              <h4 class="text-emerald-400 font-bold mb-2">TRUE - The J-Curve Phenomenon</h4>
              <p class="text-slate-300 text-sm leading-relaxed">
                The "J-curve" hypothesis suggests that excessively low DBP may reduce coronary perfusion, which occurs primarily during diastole. Multiple studies have shown increased CV events when DBP drops below 60-70 mmHg in CAD patients.
              </p>
              <div class="mt-3 p-3 bg-slate-800/50 rounded-lg">
                <p class="text-cyan-300 text-xs font-medium">💡 Clinical Pearl:</p>
                <p class="text-slate-400 text-xs mt-1">
                  In elderly patients with wide pulse pressure (isolated systolic hypertension), be cautious about aggressive BP lowering. Target SBP reduction while monitoring DBP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statement 3 -->
    <div class="tf-card bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden" data-answer="false">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <span class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-xl text-slate-400 text-lg font-bold">3</span>
          <div class="flex-1">
            <p class="text-slate-200 text-lg leading-relaxed">
              Aspirin should be routinely given for primary prevention of cardiovascular disease in all adults over 50.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-6 ml-14">
          <button onclick="selectTF(this, 'true')" class="tf-btn flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-semibold transition-all">
            ✓ True
          </button>
          <button onclick="selectTF(this, 'false')" class="tf-btn flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 font-semibold transition-all">
            ✗ False
          </button>
        </div>

        <div class="explanation hidden mt-6 ml-14 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">🔬</span>
            <div>
              <h4 class="text-cyan-400 font-bold mb-2">FALSE - Guidelines Have Changed!</h4>
              <p class="text-slate-300 text-sm leading-relaxed">
                The USPSTF and ACC/AHA now recommend <strong>against</strong> routine aspirin for primary prevention, especially in adults ≥60 years. The ASPREE, ARRIVE, and ASCEND trials showed bleeding risks often outweigh benefits.
              </p>
              <div class="mt-3 p-3 bg-slate-800/50 rounded-lg">
                <p class="text-yellow-300 text-xs font-medium">⚠️ When to Consider:</p>
                <p class="text-slate-400 text-xs mt-1">
                  May still consider in select patients aged 40-59 with ≥10% 10-year ASCVD risk who are not at increased bleeding risk. Shared decision-making is key.
                </p>
              </div>
              <div class="mt-3 flex gap-2">
                <span class="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">USPSTF 2022</span>
                <span class="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">Practice Change</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Progress & Submit -->
  <div class="max-w-3xl mx-auto mt-8 flex items-center justify-between">
    <div class="text-slate-400 text-sm">
      <span id="answered-count">0</span> of 3 answered
    </div>
    <button onclick="revealAllAnswers()" class="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors">
      Reveal All Answers
    </button>
  </div>
</div>

<script>
  let answeredCount = 0;

  function selectTF(button, choice) {
    const card = button.closest('.tf-card');
    if (card.classList.contains('answered')) return;

    const correctAnswer = card.dataset.answer;
    const isCorrect = choice === correctAnswer;

    // Mark as answered
    card.classList.add('answered');
    answeredCount++;
    document.getElementById('answered-count').textContent = answeredCount;

    // Disable buttons
    card.querySelectorAll('.tf-btn').forEach(btn => {
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.onclick = null;
    });

    // Highlight selected button
    if (isCorrect) {
      button.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-500/30');
    } else {
      button.classList.add('ring-2', 'ring-red-400', 'bg-red-500/30');
      // Also highlight correct answer
      const correctBtn = card.querySelector(\`.tf-btn:nth-child(\${correctAnswer === 'true' ? 1 : 2})\`);
      correctBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-500/30');
    }

    // Show explanation
    card.querySelector('.explanation').classList.remove('hidden');
  }

  function revealAllAnswers() {
    document.querySelectorAll('.tf-card:not(.answered)').forEach(card => {
      const correctAnswer = card.dataset.answer;
      const correctBtn = card.querySelector(\`.tf-btn:nth-child(\${correctAnswer === 'true' ? 1 : 2})\`);

      card.classList.add('answered');
      card.querySelectorAll('.tf-btn').forEach(btn => {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.onclick = null;
      });

      correctBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-500/30');
      card.querySelector('.explanation').classList.remove('hidden');
    });

    document.getElementById('answered-count').textContent = document.querySelectorAll('.tf-card').length;
  }
</script>
`;

export const CLINICAL_TF_PROMPT_AUGMENT = `
Generate a clinical True/False myth-buster exercise following this format:

STRUCTURE:
1. Header with topic title and brief description
2. 3-5 clinical statements that are common misconceptions or controversial topics
3. Each statement has:
   - Clear clinical claim
   - True/False buttons
   - Hidden explanation panel with:
     - Correct answer (TRUE or FALSE)
     - Why it's true/false with evidence
     - Key nuances or exceptions
     - Clinical pearls
     - Guideline references

STYLE:
- Focus on "myths" that learners often get wrong
- Include recent guideline changes
- Highlight "gray zone" areas with nuanced explanations
- Use purple/indigo accent colors for the myth-buster theme
- Include warning callouts for practice changes

INTERACTIVITY:
- Click True or False to answer
- Immediate feedback with color coding
- Explanation reveals automatically
- "Reveal All" button for review mode
- Progress counter
`;

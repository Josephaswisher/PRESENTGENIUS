/**
 * VibePresenterPro - Decision Tree Template
 * Branching clinical decisions with multi-step case
 */

export const DECISION_TREE_TEMPLATE = `
<div class="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 p-6 font-sans">
  <!-- Header -->
  <div class="max-w-4xl mx-auto mb-6">
    <div class="flex items-center justify-between">
      <div>
        <span class="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
          <span>🌳</span> Clinical Decision Tree
        </span>
        <h1 class="text-2xl font-bold text-white">Acute Chest Pain Management</h1>
      </div>
      <button onclick="resetCase()" class="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
        🔄 Restart Case
      </button>
    </div>
  </div>

  <!-- Decision Tree Container -->
  <div class="max-w-4xl mx-auto">

    <!-- Step 1: Initial Presentation -->
    <div id="step-1" class="decision-step active">
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-700/50">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-8 h-8 flex items-center justify-center bg-teal-500/20 rounded-full text-teal-400 font-bold text-sm">1</span>
            <span class="text-teal-400 font-semibold">Initial Assessment</span>
          </div>
          <p class="text-slate-200 leading-relaxed">
            A 52-year-old male presents to the ED with substernal chest pressure that started 2 hours ago while at rest. He describes it as "heavy" and rates it 7/10.
          </p>
          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div class="bg-slate-700/30 p-3 rounded-lg">
              <span class="text-slate-400">Vitals:</span>
              <p class="text-slate-200">BP 148/92, HR 88, RR 18, SpO2 96%</p>
            </div>
            <div class="bg-slate-700/30 p-3 rounded-lg">
              <span class="text-slate-400">History:</span>
              <p class="text-slate-200">HTN, DM2, Former smoker</p>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-800/30">
          <p class="text-slate-300 font-medium mb-4">What is your first priority?</p>
          <div class="space-y-3">
            <button onclick="selectDecision(1, 'ecg', 2)" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-teal-500/10 border border-slate-600/50 hover:border-teal-500/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">📊 Obtain 12-lead ECG immediately</span>
              <p class="text-slate-400 text-sm mt-1">STEMI must be identified within 10 minutes</p>
            </button>
            <button onclick="selectDecision(1, 'history', 'wrong')" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">📋 Complete detailed history first</span>
              <p class="text-slate-400 text-sm mt-1">Gather more information before testing</p>
            </button>
            <button onclick="selectDecision(1, 'troponin', 'wrong')" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">🧪 Order stat troponin only</span>
              <p class="text-slate-400 text-sm mt-1">Wait for lab results to guide management</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: ECG Results -->
    <div id="step-2" class="decision-step hidden mt-4">
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-700/50">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-8 h-8 flex items-center justify-center bg-teal-500/20 rounded-full text-teal-400 font-bold text-sm">2</span>
            <span class="text-teal-400 font-semibold">ECG Results</span>
          </div>
          <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div class="flex items-center gap-2 text-red-400 font-semibold mb-2">
              <span>⚠️</span> ECG Findings
            </div>
            <p class="text-slate-200">
              ST elevations in leads V1-V4 (2-3mm), reciprocal ST depression in leads II, III, aVF
            </p>
          </div>
        </div>
        <div class="p-6 bg-slate-800/30">
          <p class="text-slate-300 font-medium mb-4">This is an anterior STEMI. What is the next step?</p>
          <div class="space-y-3">
            <button onclick="selectDecision(2, 'cath', 3)" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-teal-500/10 border border-slate-600/50 hover:border-teal-500/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">🏥 Activate cath lab for emergent PCI</span>
              <p class="text-slate-400 text-sm mt-1">Door-to-balloon time <90 minutes</p>
            </button>
            <button onclick="selectDecision(2, 'lytics', 'alt')" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">💉 Administer fibrinolytics</span>
              <p class="text-slate-400 text-sm mt-1">Give thrombolytics immediately</p>
            </button>
            <button onclick="selectDecision(2, 'wait', 'wrong')" class="decision-btn w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 transition-all">
              <span class="font-semibold">⏳ Wait for troponin results</span>
              <p class="text-slate-400 text-sm mt-1">Confirm with biomarkers first</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Adjunctive Therapy -->
    <div id="step-3" class="decision-step hidden mt-4">
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-6 border-b border-slate-700/50">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-8 h-8 flex items-center justify-center bg-teal-500/20 rounded-full text-teal-400 font-bold text-sm">3</span>
            <span class="text-teal-400 font-semibold">Adjunctive Therapy</span>
          </div>
          <p class="text-slate-200">
            The cath lab is activated. While preparing for PCI, which medications should be administered?
          </p>
        </div>
        <div class="p-6 bg-slate-800/30">
          <p class="text-slate-300 font-medium mb-4">Select all that apply:</p>
          <div class="space-y-3">
            <label class="multi-check flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
              <input type="checkbox" class="w-5 h-5 rounded border-slate-500 text-teal-500 focus:ring-teal-500">
              <div>
                <span class="text-slate-200 font-medium">Aspirin 325mg (chewed)</span>
                <p class="text-slate-400 text-sm">Antiplatelet therapy</p>
              </div>
            </label>
            <label class="multi-check flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
              <input type="checkbox" class="w-5 h-5 rounded border-slate-500 text-teal-500 focus:ring-teal-500">
              <div>
                <span class="text-slate-200 font-medium">Heparin (unfractionated or LMWH)</span>
                <p class="text-slate-400 text-sm">Anticoagulation</p>
              </div>
            </label>
            <label class="multi-check flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
              <input type="checkbox" class="w-5 h-5 rounded border-slate-500 text-teal-500 focus:ring-teal-500">
              <div>
                <span class="text-slate-200 font-medium">P2Y12 inhibitor (ticagrelor or clopidogrel)</span>
                <p class="text-slate-400 text-sm">Dual antiplatelet therapy</p>
              </div>
            </label>
            <label class="multi-check flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
              <input type="checkbox" class="w-5 h-5 rounded border-slate-500 text-teal-500 focus:ring-teal-500">
              <div>
                <span class="text-slate-200 font-medium">Sublingual nitroglycerin</span>
                <p class="text-slate-400 text-sm">If BP permits and no RV infarct</p>
              </div>
            </label>
          </div>
          <button onclick="submitMeds()" class="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl transition-colors">
            Submit & Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Outcome -->
    <div id="outcome" class="decision-step hidden mt-4">
      <div class="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">🎉</span>
          <h3 class="text-2xl font-bold text-emerald-400">Excellent Clinical Decision Making!</h3>
        </div>
        <p class="text-slate-200 mb-4">
          The patient underwent successful primary PCI with stent placement to the LAD. Door-to-balloon time was 72 minutes. Peak troponin was 15 ng/mL. Echo showed anteroseptal hypokinesis with EF 45%.
        </p>
        <div class="bg-slate-800/50 rounded-xl p-4 mt-4">
          <h4 class="text-cyan-400 font-semibold mb-2">💡 Key Learning Points</h4>
          <ul class="text-slate-300 text-sm space-y-2">
            <li>• ECG within 10 minutes is critical for STEMI detection</li>
            <li>• Primary PCI is preferred over fibrinolytics when available within 120 minutes</li>
            <li>• DAPT (aspirin + P2Y12 inhibitor) is standard of care</li>
            <li>• Don't delay reperfusion waiting for biomarkers</li>
          </ul>
        </div>
        <div class="mt-4 flex gap-2 flex-wrap">
          <span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">ACC/AHA 2023 STEMI Guidelines</span>
          <span class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Time-Critical</span>
        </div>
      </div>
    </div>

    <!-- Wrong Answer Feedback -->
    <div id="wrong-feedback" class="decision-step hidden mt-4">
      <div class="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">⚠️</span>
          <h3 class="text-xl font-bold text-red-400">Not the Best Choice</h3>
        </div>
        <p id="wrong-explanation" class="text-slate-300 mb-4"></p>
        <button onclick="goBack()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          ← Go Back
        </button>
      </div>
    </div>

  </div>

  <!-- Progress Indicator -->
  <div class="max-w-4xl mx-auto mt-8">
    <div class="flex items-center gap-2">
      <div id="prog-1" class="flex-1 h-2 bg-teal-500 rounded-full"></div>
      <div id="prog-2" class="flex-1 h-2 bg-slate-700 rounded-full"></div>
      <div id="prog-3" class="flex-1 h-2 bg-slate-700 rounded-full"></div>
      <div id="prog-4" class="flex-1 h-2 bg-slate-700 rounded-full"></div>
    </div>
  </div>
</div>

<script>
  let currentStep = 1;
  let previousStep = 1;

  const wrongExplanations = {
    'history': 'While history is important, a 12-lead ECG must be obtained within 10 minutes of arrival for any patient with suspected ACS. The ECG determines the immediate treatment pathway.',
    'troponin': 'Troponin takes time to rise and should never delay ECG or reperfusion therapy in STEMI. Treatment is based on ECG, not biomarkers.',
    'wait': 'Never wait for troponin results in a STEMI! Time is myocardium. Every minute of delay increases infarct size and mortality.',
    'lytics': 'Fibrinolytics can be considered, but primary PCI is preferred when door-to-balloon time <90 minutes is achievable. This is a PCI-capable hospital.'
  };

  function selectDecision(step, choice, nextStep) {
    if (nextStep === 'wrong' || nextStep === 'alt') {
      previousStep = step;
      document.getElementById(\`step-\${step}\`).classList.add('hidden');
      document.getElementById('wrong-feedback').classList.remove('hidden');
      document.getElementById('wrong-explanation').textContent = wrongExplanations[choice];
      return;
    }

    // Mark current step as complete
    document.getElementById(\`step-\${step}\`).classList.add('hidden');
    document.getElementById(\`prog-\${step}\`).classList.add('bg-teal-500');
    document.getElementById(\`prog-\${step}\`).classList.remove('bg-slate-700');

    // Show next step
    document.getElementById(\`step-\${nextStep}\`).classList.remove('hidden');
    currentStep = nextStep;
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = \`fixed top-4 right-4 z-[9999] flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg shadow-black/20 animate-in slide-in-from-right-full max-w-md \${
      type === 'error' ? 'border-red-500/30 bg-red-500/10' :
      type === 'success' ? 'border-green-500/30 bg-green-500/10' :
      'border-blue-500/30 bg-blue-500/10'
    }\`;
    toast.innerHTML = \`
      <span class="text-2xl">\${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <div class="flex-1 text-sm text-slate-100 leading-relaxed">\${message}</div>
    \`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function submitMeds() {
    const checkboxes = document.querySelectorAll('#step-3 input[type="checkbox"]:checked');
    if (checkboxes.length >= 3) {
      document.getElementById('step-3').classList.add('hidden');
      document.getElementById('prog-3').classList.add('bg-teal-500');
      document.getElementById('prog-3').classList.remove('bg-slate-700');
      document.getElementById('prog-4').classList.add('bg-teal-500');
      document.getElementById('prog-4').classList.remove('bg-slate-700');
      document.getElementById('outcome').classList.remove('hidden');
    } else {
      showToast('Select at least 3 appropriate medications', 'error');
    }
  }

  function goBack() {
    document.getElementById('wrong-feedback').classList.add('hidden');
    document.getElementById(\`step-\${previousStep}\`).classList.remove('hidden');
  }

  function resetCase() {
    document.querySelectorAll('.decision-step').forEach(el => el.classList.add('hidden'));
    document.getElementById('step-1').classList.remove('hidden');
    document.querySelectorAll('[id^="prog-"]').forEach(el => {
      el.classList.remove('bg-teal-500');
      el.classList.add('bg-slate-700');
    });
    document.getElementById('prog-1').classList.add('bg-teal-500');
    document.getElementById('prog-1').classList.remove('bg-slate-700');
    currentStep = 1;
  }
</script>
`;

export const DECISION_TREE_PROMPT_AUGMENT = `
Generate an interactive clinical decision tree following this format:

STRUCTURE:
1. 3-5 sequential decision points
2. Each step has:
   - Clinical scenario with new information
   - 2-3 management options
   - One correct path, others lead to feedback
3. Progress indicator showing advancement
4. Final outcome with learning points

STYLE:
- Branching narrative like a "choose your own adventure"
- Wrong answers provide educational feedback
- Include vitals, labs, imaging at each step
- Use teal/cyan theme for clinical decisions
- Show patient evolution through the case

INTERACTIVITY:
- Click to choose management option
- Wrong answers explain why and allow retry
- Multi-select checkboxes for combination therapy
- Restart button to try again
- Progress bar updates with each correct decision
`;

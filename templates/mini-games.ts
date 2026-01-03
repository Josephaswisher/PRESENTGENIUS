/**
 * Medical Mini-Games Template System
 * Interactive drag-and-drop games for medical education
 * Includes: Organ placement, Symptom matching, Drug mechanism matching
 */

import { Template } from './types';

// ==================== GAME TYPE 1: ORGAN PLACEMENT ====================
export const ORGAN_PLACEMENT_GAME = `
<div class="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <!-- Game Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">Organ Placement Challenge</h1>
      <p class="text-blue-200 text-lg">Drag organs to their correct positions on the body diagram</p>
      <div class="mt-4 flex items-center justify-center gap-6">
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="organ-score">Score: 0/6</span>
        </div>
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="organ-timer">Time: 0s</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <!-- Organ Bank (Left Side) -->
      <div class="col-span-4 space-y-4">
        <h3 class="text-2xl font-bold text-white mb-4">Organ Bank</h3>

        <div id="heart" draggable="true" ondragstart="dragStart(event)" data-organ="heart"
             class="organ-item bg-gradient-to-r from-red-500 to-pink-600 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">❤️</span>
            <div>
              <h4 class="text-white font-bold text-lg">Heart</h4>
              <p class="text-white/80 text-sm">Pumps blood throughout body</p>
            </div>
          </div>
        </div>

        <div id="lungs" draggable="true" ondragstart="dragStart(event)" data-organ="lungs"
             class="organ-item bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">🫁</span>
            <div>
              <h4 class="text-white font-bold text-lg">Lungs</h4>
              <p class="text-white/80 text-sm">Gas exchange organ</p>
            </div>
          </div>
        </div>

        <div id="liver" draggable="true" ondragstart="dragStart(event)" data-organ="liver"
             class="organ-item bg-gradient-to-r from-amber-600 to-orange-700 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">🍖</span>
            <div>
              <h4 class="text-white font-bold text-lg">Liver</h4>
              <p class="text-white/80 text-sm">Metabolic powerhouse</p>
            </div>
          </div>
        </div>

        <div id="stomach" draggable="true" ondragstart="dragStart(event)" data-organ="stomach"
             class="organ-item bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">🫃</span>
            <div>
              <h4 class="text-white font-bold text-lg">Stomach</h4>
              <p class="text-white/80 text-sm">Digests food</p>
            </div>
          </div>
        </div>

        <div id="kidneys" draggable="true" ondragstart="dragStart(event)" data-organ="kidneys"
             class="organ-item bg-gradient-to-r from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">🫘</span>
            <div>
              <h4 class="text-white font-bold text-lg">Kidneys</h4>
              <p class="text-white/80 text-sm">Filters blood</p>
            </div>
          </div>
        </div>

        <div id="brain" draggable="true" ondragstart="dragStart(event)" data-organ="brain"
             class="organ-item bg-gradient-to-r from-pink-500 to-rose-600 p-4 rounded-xl shadow-lg cursor-move hover:scale-105 transition-all border-2 border-transparent hover:border-white">
          <div class="flex items-center gap-3">
            <span class="text-5xl">🧠</span>
            <div>
              <h4 class="text-white font-bold text-lg">Brain</h4>
              <p class="text-white/80 text-sm">Control center</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Body Diagram (Right Side) -->
      <div class="col-span-8">
        <div class="relative bg-white/5 backdrop-blur border-2 border-white/20 rounded-3xl p-8" style="height: 800px;">
          <h3 class="text-2xl font-bold text-white mb-4 text-center">Human Body Diagram</h3>

          <!-- SVG Body Outline -->
          <svg viewBox="0 0 400 700" class="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
            <ellipse cx="200" cy="80" rx="60" ry="70" fill="white" stroke="white" stroke-width="2"/>
            <rect x="150" y="140" width="100" height="180" rx="20" fill="white" stroke="white" stroke-width="2"/>
            <rect x="140" y="150" width="30" height="150" rx="15" fill="white"/>
            <rect x="230" y="150" width="30" height="150" rx="15" fill="white"/>
            <rect x="160" y="310" width="30" height="200" rx="15" fill="white"/>
            <rect x="210" y="310" width="30" height="200" rx="15" fill="white"/>
          </svg>

          <!-- Drop Zones -->
          <div id="drop-brain" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="brain"
               class="drop-zone absolute top-12 left-1/2 -translate-x-1/2 w-32 h-32 border-4 border-dashed border-pink-400/50 rounded-full flex items-center justify-center text-pink-300 font-bold text-sm hover:bg-pink-500/10 transition-all">
            Brain
          </div>

          <div id="drop-lungs" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="lungs"
               class="drop-zone absolute top-40 left-1/2 -translate-x-1/2 w-40 h-28 border-4 border-dashed border-cyan-400/50 rounded-xl flex items-center justify-center text-cyan-300 font-bold text-sm hover:bg-cyan-500/10 transition-all">
            Lungs
          </div>

          <div id="drop-heart" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="heart"
               class="drop-zone absolute top-44 left-1/2 -translate-x-1/2 translate-x-8 w-24 h-24 border-4 border-dashed border-red-400/50 rounded-full flex items-center justify-center text-red-300 font-bold text-sm hover:bg-red-500/10 transition-all">
            Heart
          </div>

          <div id="drop-liver" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="liver"
               class="drop-zone absolute top-64 right-1/2 translate-x-12 w-32 h-24 border-4 border-dashed border-orange-400/50 rounded-xl flex items-center justify-center text-orange-300 font-bold text-sm hover:bg-orange-500/10 transition-all">
            Liver
          </div>

          <div id="drop-stomach" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="stomach"
               class="drop-zone absolute top-72 left-1/2 -translate-x-8 w-28 h-20 border-4 border-dashed border-green-400/50 rounded-xl flex items-center justify-center text-green-300 font-bold text-sm hover:bg-green-500/10 transition-all">
            Stomach
          </div>

          <div id="drop-kidneys" ondrop="drop(event)" ondragover="allowDrop(event)" data-correct="kidneys"
               class="drop-zone absolute top-80 left-1/2 -translate-x-1/2 w-36 h-16 border-4 border-dashed border-purple-400/50 rounded-xl flex items-center justify-center text-purple-300 font-bold text-sm hover:bg-purple-500/10 transition-all">
            Kidneys
          </div>
        </div>

        <!-- Reset Button -->
        <button onclick="resetOrganGame()" class="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg">
          Reset Game
        </button>
      </div>
    </div>

    <!-- Completion Modal -->
    <div id="organ-complete-modal" class="fixed inset-0 bg-black/80 backdrop-blur hidden items-center justify-center z-50" style="display: none;">
      <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 max-w-md text-center shadow-2xl relative overflow-hidden">
        <div id="confetti-container" class="absolute inset-0 pointer-events-none"></div>
        <div class="relative z-10">
          <div class="text-8xl mb-4">🏆</div>
          <h2 class="text-4xl font-bold text-white mb-4">Perfect Score!</h2>
          <p class="text-white text-xl mb-2">You correctly placed all organs!</p>
          <p class="text-white/90 text-lg mb-6" id="final-time">Time: 0s</p>
          <button onclick="closeOrganModal()" class="px-8 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  let organScore = 0;
  let organStartTime = Date.now();
  let organTimerInterval;
  const totalOrgans = 6;

  // Start timer
  organTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - organStartTime) / 1000);
    document.getElementById('organ-timer').textContent = 'Time: ' + elapsed + 's';
  }, 1000);

  function dragStart(event) {
    event.dataTransfer.setData('organ', event.target.dataset.organ);
    event.target.style.opacity = '0.5';
  }

  function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('scale-105', 'bg-white/10');
  }

  function drop(event) {
    event.preventDefault();
    const organName = event.dataTransfer.getData('organ');
    const correctOrgan = event.currentTarget.dataset.correct;
    const dropZone = event.currentTarget;

    dropZone.classList.remove('scale-105', 'bg-white/10');

    // Reset opacity of dragged item
    const draggedElement = document.querySelector('[data-organ="' + organName + '"]');
    if (draggedElement) draggedElement.style.opacity = '1';

    if (organName === correctOrgan) {
      // Correct placement
      dropZone.innerHTML = draggedElement.innerHTML;
      dropZone.classList.remove('border-dashed');
      dropZone.classList.add('border-solid', 'bg-green-500/30', 'border-green-400', 'animate-pulse');
      setTimeout(() => dropZone.classList.remove('animate-pulse'), 500);

      // Remove from organ bank
      draggedElement.style.display = 'none';

      // Update score
      organScore++;
      document.getElementById('organ-score').textContent = 'Score: ' + organScore + '/' + totalOrgans;

      // Check for completion
      if (organScore === totalOrgans) {
        setTimeout(showOrganCompletion, 500);
      }
    } else {
      // Incorrect placement
      dropZone.classList.add('animate-shake', 'bg-red-500/30', 'border-red-500');
      setTimeout(() => {
        dropZone.classList.remove('animate-shake', 'bg-red-500/30', 'border-red-500');
      }, 600);
    }
  }

  function showOrganCompletion() {
    clearInterval(organTimerInterval);
    const elapsed = Math.floor((Date.now() - organStartTime) / 1000);
    document.getElementById('final-time').textContent = 'Time: ' + elapsed + 's';

    const modal = document.getElementById('organ-complete-modal');
    modal.style.display = 'flex';

    // Confetti animation
    createConfetti();
  }

  function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#ff69b4'];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startX = Math.random() * 100;
      const endX = startX + (Math.random() * 40 - 20);
      const duration = Math.random() * 2 + 1;
      const delay = Math.random() * 0.5;

      confetti.style.cssText = \`
        position: absolute;
        width: \${size}px;
        height: \${size}px;
        background: \${color};
        top: -20px;
        left: \${startX}%;
        border-radius: 50%;
        animation: confetti-fall \${duration}s ease-in \${delay}s forwards;
        transform: rotate(\${Math.random() * 360}deg);
      \`;

      container.appendChild(confetti);
    }
  }

  function closeOrganModal() {
    document.getElementById('organ-complete-modal').style.display = 'none';
  }

  function resetOrganGame() {
    organScore = 0;
    organStartTime = Date.now();
    document.getElementById('organ-score').textContent = 'Score: 0/' + totalOrgans;

    // Reset all organ items
    document.querySelectorAll('.organ-item').forEach(item => {
      item.style.display = 'flex';
      item.style.opacity = '1';
    });

    // Reset all drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
      const correctOrgan = zone.dataset.correct;
      zone.innerHTML = correctOrgan.charAt(0).toUpperCase() + correctOrgan.slice(1);
      zone.classList.remove('border-solid', 'bg-green-500/30', 'border-green-400');
      zone.classList.add('border-dashed');
    });
  }

  // Add CSS animation for shake and confetti
  if (!document.getElementById('organ-game-styles')) {
    const style = document.createElement('style');
    style.id = 'organ-game-styles';
    style.textContent = \`
      @keyframes animate-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
      @keyframes confetti-fall {
        to {
          transform: translateY(120vh) rotate(720deg);
          opacity: 0;
        }
      }
    \`;
    document.head.appendChild(style);
  }
</script>
`;

// ==================== GAME TYPE 2: SYMPTOM MATCHING ====================
export const SYMPTOM_MATCHING_GAME = `
<div class="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <!-- Game Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">Symptom Matching Challenge</h1>
      <p class="text-purple-200 text-lg">Match symptoms to their corresponding diagnoses</p>
      <div class="mt-4 flex items-center justify-center gap-6">
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="symptom-score">Score: 0/5</span>
        </div>
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="symptom-attempts">Attempts: 0</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-8">
      <!-- Symptoms (Left) -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white mb-6">Clinical Presentations</h3>

        <div draggable="true" ondragstart="symptomDragStart(event)" data-symptom="mi"
             class="symptom-card bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur border-2 border-red-400/50 p-6 rounded-xl cursor-move hover:scale-105 hover:border-red-400 transition-all shadow-lg">
          <div class="flex items-start gap-4">
            <span class="text-4xl">💔</span>
            <div>
              <h4 class="text-white font-bold text-lg mb-2">Crushing Chest Pain</h4>
              <ul class="text-white/80 text-sm space-y-1">
                <li>• Substernal chest pain radiating to left arm</li>
                <li>• Diaphoresis and nausea</li>
                <li>• ST-elevation on ECG</li>
                <li>• Elevated troponin</li>
              </ul>
            </div>
          </div>
        </div>

        <div draggable="true" ondragstart="symptomDragStart(event)" data-symptom="stroke"
             class="symptom-card bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur border-2 border-orange-400/50 p-6 rounded-xl cursor-move hover:scale-105 hover:border-orange-400 transition-all shadow-lg">
          <div class="flex items-start gap-4">
            <span class="text-4xl">🧠</span>
            <div>
              <h4 class="text-white font-bold text-lg mb-2">Sudden Neurological Deficit</h4>
              <ul class="text-white/80 text-sm space-y-1">
                <li>• Right-sided facial droop</li>
                <li>• Slurred speech</li>
                <li>• Right arm weakness</li>
                <li>• Onset 2 hours ago</li>
              </ul>
            </div>
          </div>
        </div>

        <div draggable="true" ondragstart="symptomDragStart(event)" data-symptom="pneumonia"
             class="symptom-card bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur border-2 border-cyan-400/50 p-6 rounded-xl cursor-move hover:scale-105 hover:border-cyan-400 transition-all shadow-lg">
          <div class="flex items-start gap-4">
            <span class="text-4xl">🫁</span>
            <div>
              <h4 class="text-white font-bold text-lg mb-2">Respiratory Infection</h4>
              <ul class="text-white/80 text-sm space-y-1">
                <li>• Productive cough with rust-colored sputum</li>
                <li>• Fever (102°F) and chills</li>
                <li>• Pleuritic chest pain</li>
                <li>• Consolidation on chest X-ray</li>
              </ul>
            </div>
          </div>
        </div>

        <div draggable="true" ondragstart="symptomDragStart(event)" data-symptom="appendicitis"
             class="symptom-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur border-2 border-green-400/50 p-6 rounded-xl cursor-move hover:scale-105 hover:border-green-400 transition-all shadow-lg">
          <div class="flex items-start gap-4">
            <span class="text-4xl">🤢</span>
            <div>
              <h4 class="text-white font-bold text-lg mb-2">Acute Abdominal Pain</h4>
              <ul class="text-white/80 text-sm space-y-1">
                <li>• Periumbilical pain migrating to RLQ</li>
                <li>• Anorexia and low-grade fever</li>
                <li>• Positive McBurney's sign</li>
                <li>• Rebound tenderness</li>
              </ul>
            </div>
          </div>
        </div>

        <div draggable="true" ondragstart="symptomDragStart(event)" data-symptom="uti"
             class="symptom-card bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur border-2 border-purple-400/50 p-6 rounded-xl cursor-move hover:scale-105 hover:border-purple-400 transition-all shadow-lg">
          <div class="flex items-start gap-4">
            <span class="text-4xl">💧</span>
            <div>
              <h4 class="text-white font-bold text-lg mb-2">Urinary Symptoms</h4>
              <ul class="text-white/80 text-sm space-y-1">
                <li>• Dysuria and urgency</li>
                <li>• Frequency and suprapubic pain</li>
                <li>• Cloudy, malodorous urine</li>
                <li>• Positive nitrites and leukocyte esterase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Diagnoses (Right) -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white mb-6">Match to Diagnosis</h3>

        <div ondrop="symptomDrop(event)" ondragover="allowDrop(event)" data-diagnosis="mi"
             class="diagnosis-zone min-h-32 border-4 border-dashed border-red-400/50 rounded-xl p-6 hover:bg-red-500/10 transition-all">
          <h4 class="text-red-300 font-bold text-xl mb-2">🫀 Acute Myocardial Infarction (MI)</h4>
          <p class="text-white/60 text-sm">ST-elevation MI requiring immediate reperfusion therapy</p>
        </div>

        <div ondrop="symptomDrop(event)" ondragover="allowDrop(event)" data-diagnosis="stroke"
             class="diagnosis-zone min-h-32 border-4 border-dashed border-orange-400/50 rounded-xl p-6 hover:bg-orange-500/10 transition-all">
          <h4 class="text-orange-300 font-bold text-xl mb-2">🧠 Acute Ischemic Stroke</h4>
          <p class="text-white/60 text-sm">Cerebrovascular accident requiring thrombolytic therapy</p>
        </div>

        <div ondrop="symptomDrop(event)" ondragover="allowDrop(event)" data-diagnosis="pneumonia"
             class="diagnosis-zone min-h-32 border-4 border-dashed border-cyan-400/50 rounded-xl p-6 hover:bg-cyan-500/10 transition-all">
          <h4 class="text-cyan-300 font-bold text-xl mb-2">🫁 Community-Acquired Pneumonia</h4>
          <p class="text-white/60 text-sm">Bacterial pneumonia requiring antibiotic therapy</p>
        </div>

        <div ondrop="symptomDrop(event)" ondragover="allowDrop(event)" data-diagnosis="appendicitis"
             class="diagnosis-zone min-h-32 border-4 border-dashed border-green-400/50 rounded-xl p-6 hover:bg-green-500/10 transition-all">
          <h4 class="text-green-300 font-bold text-xl mb-2">🏥 Acute Appendicitis</h4>
          <p class="text-white/60 text-sm">Surgical emergency requiring appendectomy</p>
        </div>

        <div ondrop="symptomDrop(event)" ondragover="allowDrop(event)" data-diagnosis="uti"
             class="diagnosis-zone min-h-32 border-4 border-dashed border-purple-400/50 rounded-xl p-6 hover:bg-purple-500/10 transition-all">
          <h4 class="text-purple-300 font-bold text-xl mb-2">💧 Urinary Tract Infection</h4>
          <p class="text-white/60 text-sm">Bacterial cystitis requiring antibiotic treatment</p>
        </div>
      </div>
    </div>

    <!-- Reset Button -->
    <div class="mt-8 text-center">
      <button onclick="resetSymptomGame()" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg">
        Reset Game
      </button>
    </div>

    <!-- Completion Modal -->
    <div id="symptom-complete-modal" class="fixed inset-0 bg-black/80 backdrop-blur hidden items-center justify-center z-50" style="display: none;">
      <div class="bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl p-12 max-w-md text-center shadow-2xl relative overflow-hidden">
        <div id="symptom-confetti" class="absolute inset-0 pointer-events-none"></div>
        <div class="relative z-10">
          <div class="text-8xl mb-4">🎉</div>
          <h2 class="text-4xl font-bold text-white mb-4">Excellent Diagnosis!</h2>
          <p class="text-white text-xl mb-2">You matched all symptoms correctly!</p>
          <p class="text-white/90 text-lg mb-6" id="symptom-final-attempts">Attempts: 0</p>
          <button onclick="closeSymptomModal()" class="px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  let symptomScore = 0;
  let symptomAttempts = 0;
  const totalSymptoms = 5;

  function symptomDragStart(event) {
    event.dataTransfer.setData('symptom', event.target.dataset.symptom);
    event.target.style.opacity = '0.5';
  }

  function symptomDrop(event) {
    event.preventDefault();
    const symptomId = event.dataTransfer.getData('symptom');
    const diagnosisId = event.currentTarget.dataset.diagnosis;
    const dropZone = event.currentTarget;

    dropZone.classList.remove('scale-105', 'bg-white/10');
    symptomAttempts++;
    document.getElementById('symptom-attempts').textContent = 'Attempts: ' + symptomAttempts;

    const draggedCard = document.querySelector('[data-symptom="' + symptomId + '"]');
    if (draggedCard) draggedCard.style.opacity = '1';

    if (symptomId === diagnosisId) {
      // Correct match
      dropZone.classList.remove('border-dashed');
      dropZone.classList.add('border-solid', 'bg-green-500/30', 'border-green-400', 'animate-pulse');
      setTimeout(() => dropZone.classList.remove('animate-pulse'), 500);

      // Add checkmark
      if (!dropZone.querySelector('.checkmark')) {
        const check = document.createElement('div');
        check.className = 'checkmark text-6xl absolute top-2 right-2';
        check.textContent = '✅';
        dropZone.style.position = 'relative';
        dropZone.appendChild(check);
      }

      // Hide symptom card
      if (draggedCard) draggedCard.style.display = 'none';

      // Update score
      symptomScore++;
      document.getElementById('symptom-score').textContent = 'Score: ' + symptomScore + '/' + totalSymptoms;

      // Check completion
      if (symptomScore === totalSymptoms) {
        setTimeout(showSymptomCompletion, 500);
      }
    } else {
      // Incorrect match
      dropZone.classList.add('animate-shake', 'bg-red-500/30', 'border-red-500');
      setTimeout(() => {
        dropZone.classList.remove('animate-shake', 'bg-red-500/30', 'border-red-500');
      }, 600);
    }
  }

  function showSymptomCompletion() {
    document.getElementById('symptom-final-attempts').textContent = 'Attempts: ' + symptomAttempts;
    const modal = document.getElementById('symptom-complete-modal');
    modal.style.display = 'flex';
    createSymptomConfetti();
  }

  function createSymptomConfetti() {
    const container = document.getElementById('symptom-confetti');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < 80; i++) {
      const confetti = document.createElement('div');
      const size = Math.random() * 8 + 6;
      confetti.style.cssText = \`
        position: absolute;
        width: \${size}px;
        height: \${size}px;
        background: \${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 50%;
        border-radius: 50%;
        animation: confetti-burst \${1.5 + Math.random()}s ease-out forwards;
        transform: translate(\${Math.random() * 300 - 150}px, \${Math.random() * 200 - 100}px);
      \`;
      container.appendChild(confetti);
    }
  }

  function closeSymptomModal() {
    document.getElementById('symptom-complete-modal').style.display = 'none';
  }

  function resetSymptomGame() {
    symptomScore = 0;
    symptomAttempts = 0;
    document.getElementById('symptom-score').textContent = 'Score: 0/' + totalSymptoms;
    document.getElementById('symptom-attempts').textContent = 'Attempts: 0';

    // Reset symptom cards
    document.querySelectorAll('.symptom-card').forEach(card => {
      card.style.display = 'flex';
      card.style.opacity = '1';
    });

    // Reset diagnosis zones
    document.querySelectorAll('.diagnosis-zone').forEach(zone => {
      zone.classList.remove('border-solid', 'bg-green-500/30', 'border-green-400');
      zone.classList.add('border-dashed');
      const checkmark = zone.querySelector('.checkmark');
      if (checkmark) checkmark.remove();
    });
  }

  // Add animation styles
  if (!document.getElementById('symptom-game-styles')) {
    const style = document.createElement('style');
    style.id = 'symptom-game-styles';
    style.textContent = \`
      @keyframes animate-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
      @keyframes confetti-burst {
        to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    \`;
    document.head.appendChild(style);
  }
</script>
`;

// ==================== GAME TYPE 3: DRUG MECHANISM MATCHING ====================
export const DRUG_MECHANISM_GAME = `
<div class="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <!-- Game Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">Drug Mechanism Challenge</h1>
      <p class="text-teal-200 text-lg">Match medications to their mechanisms of action</p>
      <div class="mt-4 flex items-center justify-center gap-6">
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="drug-score">Score: 0/6</span>
        </div>
        <div class="px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
          <span class="text-white font-bold text-xl" id="drug-streak">Streak: 0</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-8">
      <!-- Medications (Left) -->
      <div class="space-y-3">
        <h3 class="text-2xl font-bold text-white mb-6">Medications</h3>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="aspirin"
             class="drug-card bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur border-2 border-red-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-red-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Aspirin</h4>
              <p class="text-white/60 text-sm">Acetylsalicylic acid</p>
            </div>
            <span class="text-3xl">🩸</span>
          </div>
        </div>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="metformin"
             class="drug-card bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur border-2 border-blue-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-blue-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Metformin</h4>
              <p class="text-white/60 text-sm">First-line diabetes medication</p>
            </div>
            <span class="text-3xl">🍬</span>
          </div>
        </div>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="lisinopril"
             class="drug-card bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur border-2 border-purple-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-purple-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Lisinopril</h4>
              <p class="text-white/60 text-sm">ACE inhibitor</p>
            </div>
            <span class="text-3xl">💓</span>
          </div>
        </div>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="omeprazole"
             class="drug-card bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur border-2 border-orange-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-orange-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Omeprazole</h4>
              <p class="text-white/60 text-sm">Proton pump inhibitor</p>
            </div>
            <span class="text-3xl">🫃</span>
          </div>
        </div>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="albuterol"
             class="drug-card bg-gradient-to-r from-cyan-500/20 to-teal-500/20 backdrop-blur border-2 border-cyan-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-cyan-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Albuterol</h4>
              <p class="text-white/60 text-sm">Rescue inhaler</p>
            </div>
            <span class="text-3xl">🫁</span>
          </div>
        </div>

        <div draggable="true" ondragstart="drugDragStart(event)" data-drug="atorvastatin"
             class="drug-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur border-2 border-green-400/50 p-5 rounded-xl cursor-move hover:scale-105 hover:border-green-400 transition-all shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-bold text-xl">💊 Atorvastatin</h4>
              <p class="text-white/60 text-sm">Lipitor - HMG-CoA inhibitor</p>
            </div>
            <span class="text-3xl">🧬</span>
          </div>
        </div>
      </div>

      <!-- Mechanisms (Right) -->
      <div class="space-y-3">
        <h3 class="text-2xl font-bold text-white mb-6">Mechanisms of Action</h3>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="aspirin"
             class="mechanism-zone min-h-28 border-4 border-dashed border-red-400/50 rounded-xl p-5 hover:bg-red-500/10 transition-all">
          <h4 class="text-red-300 font-bold text-lg mb-1">Irreversible COX Inhibition</h4>
          <p class="text-white/60 text-sm">Blocks platelet aggregation by inhibiting thromboxane A2 synthesis</p>
        </div>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="metformin"
             class="mechanism-zone min-h-28 border-4 border-dashed border-blue-400/50 rounded-xl p-5 hover:bg-blue-500/10 transition-all">
          <h4 class="text-blue-300 font-bold text-lg mb-1">Decreased Hepatic Gluconeogenesis</h4>
          <p class="text-white/60 text-sm">Reduces glucose production in liver and increases insulin sensitivity</p>
        </div>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="lisinopril"
             class="mechanism-zone min-h-28 border-4 border-dashed border-purple-400/50 rounded-xl p-5 hover:bg-purple-500/10 transition-all">
          <h4 class="text-purple-300 font-bold text-lg mb-1">ACE Inhibition</h4>
          <p class="text-white/60 text-sm">Blocks conversion of angiotensin I to II, reducing blood pressure</p>
        </div>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="omeprazole"
             class="mechanism-zone min-h-28 border-4 border-dashed border-orange-400/50 rounded-xl p-5 hover:bg-orange-500/10 transition-all">
          <h4 class="text-orange-300 font-bold text-lg mb-1">Proton Pump Inhibition</h4>
          <p class="text-white/60 text-sm">Irreversibly blocks H+/K+ ATPase in gastric parietal cells</p>
        </div>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="albuterol"
             class="mechanism-zone min-h-28 border-4 border-dashed border-cyan-400/50 rounded-xl p-5 hover:bg-cyan-500/10 transition-all">
          <h4 class="text-cyan-300 font-bold text-lg mb-1">Beta-2 Agonist</h4>
          <p class="text-white/60 text-sm">Activates beta-2 receptors causing bronchial smooth muscle relaxation</p>
        </div>

        <div ondrop="drugDrop(event)" ondragover="allowDrop(event)" data-mechanism="atorvastatin"
             class="mechanism-zone min-h-28 border-4 border-dashed border-green-400/50 rounded-xl p-5 hover:bg-green-500/10 transition-all">
          <h4 class="text-green-300 font-bold text-lg mb-1">HMG-CoA Reductase Inhibition</h4>
          <p class="text-white/60 text-sm">Blocks rate-limiting step of cholesterol synthesis in liver</p>
        </div>
      </div>
    </div>

    <!-- Reset Button -->
    <div class="mt-8 text-center">
      <button onclick="resetDrugGame()" class="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg">
        Reset Game
      </button>
    </div>

    <!-- Completion Modal -->
    <div id="drug-complete-modal" class="fixed inset-0 bg-black/80 backdrop-blur hidden items-center justify-center z-50" style="display: none;">
      <div class="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-12 max-w-md text-center shadow-2xl relative overflow-hidden">
        <div id="drug-confetti" class="absolute inset-0 pointer-events-none"></div>
        <div class="relative z-10">
          <div class="text-8xl mb-4">🎓</div>
          <h2 class="text-4xl font-bold text-white mb-4">Pharmacology Master!</h2>
          <p class="text-white text-xl mb-2">Perfect understanding of drug mechanisms!</p>
          <p class="text-white/90 text-lg mb-6" id="drug-final-streak">Streak: 0</p>
          <button onclick="closeDrugModal()" class="px-8 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-all shadow-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  let drugScore = 0;
  let drugStreak = 0;
  const totalDrugs = 6;

  function drugDragStart(event) {
    event.dataTransfer.setData('drug', event.target.dataset.drug);
    event.target.style.opacity = '0.5';
  }

  function drugDrop(event) {
    event.preventDefault();
    const drugId = event.dataTransfer.getData('drug');
    const mechanismId = event.currentTarget.dataset.mechanism;
    const dropZone = event.currentTarget;

    dropZone.classList.remove('scale-105', 'bg-white/10');

    const draggedCard = document.querySelector('[data-drug="' + drugId + '"]');
    if (draggedCard) draggedCard.style.opacity = '1';

    if (drugId === mechanismId) {
      // Correct match
      dropZone.classList.remove('border-dashed');
      dropZone.classList.add('border-solid', 'bg-green-500/30', 'border-green-400', 'animate-pulse');
      setTimeout(() => dropZone.classList.remove('animate-pulse'), 500);

      // Add drug name to mechanism
      if (!dropZone.querySelector('.matched-drug')) {
        const drugName = document.createElement('div');
        drugName.className = 'matched-drug mt-3 px-4 py-2 bg-green-500/50 rounded-lg border border-green-400';
        drugName.innerHTML = '<span class="text-white font-bold">' + draggedCard.querySelector('h4').textContent + '</span>';
        dropZone.appendChild(drugName);
      }

      // Hide drug card
      if (draggedCard) draggedCard.style.display = 'none';

      // Update score and streak
      drugScore++;
      drugStreak++;
      document.getElementById('drug-score').textContent = 'Score: ' + drugScore + '/' + totalDrugs;
      document.getElementById('drug-streak').textContent = 'Streak: ' + drugStreak;

      // Check completion
      if (drugScore === totalDrugs) {
        setTimeout(showDrugCompletion, 500);
      }
    } else {
      // Incorrect match - break streak
      drugStreak = 0;
      document.getElementById('drug-streak').textContent = 'Streak: 0';
      dropZone.classList.add('animate-shake', 'bg-red-500/30', 'border-red-500');
      setTimeout(() => {
        dropZone.classList.remove('animate-shake', 'bg-red-500/30', 'border-red-500');
      }, 600);
    }
  }

  function showDrugCompletion() {
    document.getElementById('drug-final-streak').textContent = 'Final Streak: ' + drugStreak;
    const modal = document.getElementById('drug-complete-modal');
    modal.style.display = 'flex';
    createDrugConfetti();
  }

  function createDrugConfetti() {
    const container = document.getElementById('drug-confetti');
    const emojis = ['💊', '💉', '🧬', '⚕️', '🔬', '🧪'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.style.cssText = \`
        position: absolute;
        font-size: \${Math.random() * 20 + 20}px;
        left: \${Math.random() * 100}%;
        top: -50px;
        animation: drug-confetti-fall \${Math.random() * 2 + 2}s ease-in forwards;
        animation-delay: \${Math.random() * 0.5}s;
      \`;
      confetti.textContent = emoji;
      container.appendChild(confetti);
    }
  }

  function closeDrugModal() {
    document.getElementById('drug-complete-modal').style.display = 'none';
  }

  function resetDrugGame() {
    drugScore = 0;
    drugStreak = 0;
    document.getElementById('drug-score').textContent = 'Score: 0/' + totalDrugs;
    document.getElementById('drug-streak').textContent = 'Streak: 0';

    // Reset drug cards
    document.querySelectorAll('.drug-card').forEach(card => {
      card.style.display = 'flex';
      card.style.opacity = '1';
    });

    // Reset mechanism zones
    document.querySelectorAll('.mechanism-zone').forEach(zone => {
      zone.classList.remove('border-solid', 'bg-green-500/30', 'border-green-400');
      zone.classList.add('border-dashed');
      const matched = zone.querySelector('.matched-drug');
      if (matched) matched.remove();
    });
  }

  // Add animation styles
  if (!document.getElementById('drug-game-styles')) {
    const style = document.createElement('style');
    style.id = 'drug-game-styles';
    style.textContent = \`
      @keyframes animate-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
      @keyframes drug-confetti-fall {
        to { transform: translateY(120vh) rotate(360deg); opacity: 0; }
      }
    \`;
    document.head.appendChild(style);
  }
</script>
`;

// ==================== TEMPLATE METADATA ====================
export const MINI_GAMES_TEMPLATE: Template = {
  meta: {
    id: 'mini-games',
    name: 'Medical Mini-Games',
    icon: '🎮',
    category: 'gamification',
    description: 'Interactive drag-and-drop games: organ placement, symptom matching, and drug mechanisms',
    supportedVariables: ['TOPIC', 'LEARNER_LEVEL', 'SPECIALTY'],
    learnerLevels: ['medical-student', 'resident', 'continuing-education'],
    estimatedSlides: 3,
    tags: ['interactive', 'drag-drop', 'gamification', 'assessment', 'anatomy', 'pharmacology'],
  },
  promptAugment: `
Generate interactive medical mini-games using HTML5 drag-and-drop API. Choose from three game types based on the presentation content:

GAME TYPE 1: ORGAN PLACEMENT
- Use when: Content covers anatomy, physiology, or body systems
- Drag organs (heart, lungs, liver, stomach, kidneys, brain) to correct positions on body diagram
- Visual feedback: Green border + pulse animation for correct, red shake for incorrect
- Score tracking: "Score: X/6"
- Timer: Shows elapsed time
- Completion: Confetti celebration modal

GAME TYPE 2: SYMPTOM MATCHING
- Use when: Content covers clinical presentations, diagnoses, or pathophysiology
- Match clinical presentations (symptoms, vitals, lab findings) to diagnoses
- Visual feedback: Green glow + checkmark for correct, red shake for incorrect
- Score tracking: "Score: X/Y" and "Attempts: X"
- Completion: Confetti burst with attempt count

GAME TYPE 3: DRUG MECHANISM MATCHING
- Use when: Content covers pharmacology, medications, or therapeutics
- Match drugs to their mechanisms of action
- Visual feedback: Green highlight + drug name overlay for correct, red shake for incorrect
- Score tracking: "Score: X/Y" and "Streak: X" (breaks on wrong answer)
- Completion: Medical emoji confetti (💊💉🧬⚕️)

IMPLEMENTATION REQUIREMENTS:
✓ All JavaScript must be inline and fully functional
✓ Use HTML5 drag/drop API (ondragstart, ondrop, ondragover)
✓ Tailwind CSS for all styling (gradient backgrounds, shadows, animations)
✓ Visual feedback on ALL interactions (hover, drag, drop)
✓ Score/progress tracking displayed prominently
✓ Confetti animation on game completion
✓ Reset button to play again
✓ Responsive grid layouts (grid-cols-2, grid-cols-12)
✓ Dark medical theme with vibrant accent colors
✓ Smooth transitions and animations (transition-all, animate-pulse, animate-shake)

COLOR SCHEMES BY GAME TYPE:
- Organ Placement: Blue/Indigo/Purple gradients (from-blue-900 via-indigo-900 to-purple-900)
- Symptom Matching: Purple/Violet gradients (from-purple-900 via-violet-900 to-indigo-900)
- Drug Mechanism: Teal/Cyan gradients (from-emerald-900 via-teal-900 to-cyan-900)

AUTO-GENERATION RULES:
1. Detect medical terms in presentation content
2. If anatomy/organs mentioned → Generate Organ Placement game
3. If symptoms/diagnoses mentioned → Generate Symptom Matching game
4. If drugs/medications mentioned → Generate Drug Mechanism game
5. Can include multiple game types in one presentation

INTERACTIVE FEATURES:
- Drag items with cursor change (cursor-move)
- Drop zones highlight on hover (hover:bg-{color}/10)
- Correct placement: border-solid, bg-green-500/30, animate-pulse
- Incorrect placement: animate-shake, bg-red-500/30
- Completion modal: full-screen overlay with confetti
- Reset functionality restores initial state

ACCESSIBILITY:
- High contrast colors (white text on dark backgrounds)
- Large touch targets (min-h-28, p-4)
- Clear visual hierarchy (text-4xl headers, text-lg descriptions)
- Descriptive labels on all interactive elements

Generate games that are:
- Medically accurate
- Educationally valuable
- Visually engaging
- Immediately playable
- Satisfying to complete
`,
  htmlTemplate: undefined, // Games are generated dynamically based on content
};

// Export individual game templates for direct use
export const MINI_GAMES = {
  ORGAN_PLACEMENT: ORGAN_PLACEMENT_GAME,
  SYMPTOM_MATCHING: SYMPTOM_MATCHING_GAME,
  DRUG_MECHANISM: DRUG_MECHANISM_GAME,
};

export default MINI_GAMES_TEMPLATE;

/**
 * VibePresenterPro - Real-Time Drug Dosing Calculator
 * Interactive dosing calculator with weight-based, renal adjustment, and pediatric dosing
 * Includes safety warnings and therapeutic window visualization
 */

export const DRUG_DOSING_TEMPLATE = `
<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6 font-sans">
  <!-- Header -->
  <div class="max-w-5xl mx-auto mb-6">
    <div class="flex items-center justify-between">
      <div>
        <span class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <span>💊</span> Drug Dosing Calculator
        </span>
        <h1 class="text-3xl font-bold text-white">Real-Time Medication Dosing</h1>
      </div>
      <button onclick="printDosingCard()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
        <span>🖨️</span> Print Card
      </button>
    </div>
  </div>

  <!-- Main Calculator Container -->
  <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Left Panel: Input Controls -->
    <div class="lg:col-span-1 space-y-6">

      <!-- Medication Selection -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>💊</span> Select Medication
        </h3>
        <select id="medication" onchange="updateDosing()" class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option value="acetaminophen">Acetaminophen (Tylenol)</option>
          <option value="amoxicillin">Amoxicillin</option>
          <option value="vancomycin">Vancomycin</option>
          <option value="gentamicin">Gentamicin</option>
          <option value="warfarin">Warfarin</option>
          <option value="enoxaparin">Enoxaparin (Lovenox)</option>
          <option value="morphine">Morphine</option>
          <option value="digoxin">Digoxin</option>
        </select>
      </div>

      <!-- Patient Parameters -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>👤</span> Patient Parameters
        </h3>

        <!-- Age Group -->
        <div class="mb-4">
          <label class="text-slate-300 text-sm font-medium mb-2 block">Age Group</label>
          <div class="flex gap-2">
            <button onclick="setAgeGroup('pediatric')" id="btn-pediatric" class="age-btn flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-sm transition-all">
              Pediatric
            </button>
            <button onclick="setAgeGroup('adult')" id="btn-adult" class="age-btn active flex-1 px-3 py-2 bg-purple-600 border border-purple-500 rounded-lg text-white text-sm transition-all">
              Adult
            </button>
          </div>
        </div>

        <!-- Weight Slider -->
        <div class="mb-4">
          <label class="text-slate-300 text-sm font-medium mb-2 block flex items-center justify-between">
            <span>Weight (kg)</span>
            <span id="weight-display" class="text-purple-400 font-bold text-lg">70</span>
          </label>
          <input type="range" id="weight" min="3" max="150" value="70" step="0.5"
                 oninput="updateDosing()"
                 class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider">
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>3 kg</span>
            <span>150 kg</span>
          </div>
        </div>

        <!-- Age Input (for pediatrics) -->
        <div class="mb-4" id="age-input-container" style="display: none;">
          <label class="text-slate-300 text-sm font-medium mb-2 block flex items-center justify-between">
            <span>Age (years)</span>
            <span id="age-display" class="text-purple-400 font-bold">8</span>
          </label>
          <input type="range" id="age" min="0" max="18" value="8" step="0.5"
                 oninput="updateDosing()"
                 class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider">
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 yr</span>
            <span>18 yr</span>
          </div>
        </div>

        <!-- Creatinine Clearance Slider (for renal dosing) -->
        <div class="mb-4">
          <label class="text-slate-300 text-sm font-medium mb-2 block flex items-center justify-between">
            <span>CrCl (mL/min)</span>
            <span id="crcl-display" class="text-purple-400 font-bold text-lg">90</span>
          </label>
          <input type="range" id="crcl" min="5" max="120" value="90" step="5"
                 oninput="updateDosing()"
                 class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider">
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>5 (ESRD)</span>
            <span>120 (Normal)</span>
          </div>
        </div>

      </div>

    </div>

    <!-- Right Panel: Dosing Results & Visualization -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Calculated Dose Card -->
      <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-white font-bold text-2xl mb-1" id="drug-name">Acetaminophen</h2>
            <p class="text-slate-400 text-sm" id="drug-route">Oral</p>
          </div>
          <div id="safety-badge" class="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-bold text-lg">
            ✓ SAFE
          </div>
        </div>

        <!-- Calculated Dose -->
        <div class="bg-slate-800/50 rounded-xl p-6 mb-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-slate-400 text-sm mb-1">Recommended Dose</p>
              <p class="text-white font-bold text-3xl" id="calculated-dose">1000 mg</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm mb-1">Frequency</p>
              <p class="text-white font-bold text-2xl" id="frequency">Q6H</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm mb-1">Max Daily Dose</p>
              <p class="text-purple-400 font-bold text-xl" id="max-dose">4000 mg</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm mb-1">Route</p>
              <p class="text-white font-semibold text-xl" id="route-display">PO</p>
            </div>
          </div>
        </div>

        <!-- Dosing Adjustments -->
        <div id="adjustment-notice" class="hidden bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div class="flex items-start gap-2">
            <span class="text-xl">⚠️</span>
            <div class="flex-1">
              <p class="text-yellow-400 font-semibold mb-1">Renal Adjustment Required</p>
              <p class="text-slate-300 text-sm" id="adjustment-text">Dose reduced by 50% due to CrCl <30 mL/min</p>
            </div>
          </div>
        </div>

        <!-- Warning Zone -->
        <div id="warning-zone" class="hidden bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
          <div class="flex items-start gap-2">
            <span class="text-2xl animate-pulse">🚨</span>
            <div class="flex-1">
              <p class="text-red-400 font-bold text-lg mb-1">TOXIC DOSE ALERT</p>
              <p class="text-slate-200" id="warning-text">Calculated dose exceeds safe therapeutic range!</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Therapeutic Window Visualization -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>📊</span> Therapeutic Window
        </h3>

        <!-- Visual Range Indicator -->
        <div class="relative h-20 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20 rounded-xl overflow-hidden mb-4">
          <!-- Zone Labels -->
          <div class="absolute inset-0 flex">
            <div class="flex-1 flex items-center justify-center text-green-400 text-xs font-bold">
              SAFE
            </div>
            <div class="flex-1 flex items-center justify-center text-yellow-400 text-xs font-bold">
              BORDERLINE
            </div>
            <div class="flex-1 flex items-center justify-center text-red-400 text-xs font-bold">
              TOXIC
            </div>
          </div>

          <!-- Dose Indicator Arrow -->
          <div id="dose-indicator" class="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-300" style="left: 25%;">
            <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
          </div>
        </div>

        <!-- Range Details -->
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p class="text-green-400 font-semibold mb-1">Safe Range</p>
            <p class="text-slate-300" id="safe-range">0-4000 mg/day</p>
          </div>
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p class="text-yellow-400 font-semibold mb-1">Borderline</p>
            <p class="text-slate-300" id="borderline-range">4000-6000 mg/day</p>
          </div>
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-400 font-semibold mb-1">Toxic</p>
            <p class="text-slate-300" id="toxic-range">>6000 mg/day</p>
          </div>
        </div>
      </div>

      <!-- Clinical Considerations -->
      <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>📋</span> Clinical Considerations
        </h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-blue-400 text-lg">ℹ️</span>
            <div>
              <p class="text-slate-300 text-sm" id="indication">
                <strong class="text-white">Indication:</strong> Pain relief, antipyretic
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-yellow-400 text-lg">⚠️</span>
            <div>
              <p class="text-slate-300 text-sm" id="contraindications">
                <strong class="text-white">Contraindications:</strong> Severe hepatic impairment, hypersensitivity
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-purple-400 text-lg">🧪</span>
            <div>
              <p class="text-slate-300 text-sm" id="monitoring">
                <strong class="text-white">Monitoring:</strong> LFTs if chronic use, assess pain control
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Footer Info -->
  <div class="max-w-5xl mx-auto mt-6">
    <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <p class="text-blue-300 text-sm">
        <strong>Disclaimer:</strong> This calculator provides general dosing guidelines. Always verify with institutional protocols, drug references, and clinical judgment. Individual patient factors may require dose modifications.
      </p>
    </div>
  </div>

</div>

<style>
  /* Custom slider styling */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    cursor: pointer;
    border-radius: 50%;
    border: none;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }

  .age-btn.active {
    background: linear-gradient(135deg, #9333ea, #a855f7) !important;
    border-color: #a855f7 !important;
    color: white !important;
  }

  @media print {
    body * {
      visibility: hidden;
    }
    .print-card, .print-card * {
      visibility: visible;
    }
    .print-card {
      position: absolute;
      left: 0;
      top: 0;
    }
  }
</style>

<script>
  // Drug database with dosing parameters
  const drugDatabase = {
    acetaminophen: {
      name: 'Acetaminophen (Tylenol)',
      route: 'Oral',
      pediatricDose: 15, // mg/kg/dose
      adultDose: 1000, // mg/dose
      frequency: 'Q6H',
      maxDailyPediatric: 75, // mg/kg/day
      maxDailyAdult: 4000, // mg/day
      renalAdjust: false,
      indication: 'Pain relief, antipyretic (fever reduction)',
      contraindications: 'Severe hepatic impairment, hypersensitivity to acetaminophen',
      monitoring: 'Monitor LFTs with chronic use, assess pain/fever control',
      safeMax: 4000,
      borderlineMax: 6000
    },
    amoxicillin: {
      name: 'Amoxicillin',
      route: 'Oral',
      pediatricDose: 25, // mg/kg/dose
      adultDose: 500, // mg/dose
      frequency: 'Q8H',
      maxDailyPediatric: 90, // mg/kg/day
      maxDailyAdult: 3000, // mg/day
      renalAdjust: true,
      indication: 'Bacterial infections (otitis media, sinusitis, pneumonia, UTI)',
      contraindications: 'Penicillin allergy, history of severe hypersensitivity',
      monitoring: 'Monitor for allergic reactions, assess infection response',
      safeMax: 3000,
      borderlineMax: 4000
    },
    vancomycin: {
      name: 'Vancomycin',
      route: 'IV',
      pediatricDose: 15, // mg/kg/dose
      adultDose: 15, // mg/kg/dose (weight-based for adults too)
      frequency: 'Q12H',
      maxDailyPediatric: 60, // mg/kg/day
      maxDailyAdult: 4000, // mg/day
      renalAdjust: true,
      indication: 'MRSA infections, C. difficile colitis (oral), severe gram-positive infections',
      contraindications: 'Hypersensitivity to vancomycin',
      monitoring: 'Trough levels (10-20 mcg/mL), SCr, BUN, CBC, auditory function',
      safeMax: 4000,
      borderlineMax: 5000
    },
    gentamicin: {
      name: 'Gentamicin',
      route: 'IV/IM',
      pediatricDose: 2.5, // mg/kg/dose
      adultDose: 5, // mg/kg/day (once daily)
      frequency: 'Q24H',
      maxDailyPediatric: 7.5, // mg/kg/day
      maxDailyAdult: 7, // mg/kg/day
      renalAdjust: true,
      indication: 'Gram-negative infections, synergy for endocarditis',
      contraindications: 'Hypersensitivity to aminoglycosides, myasthenia gravis',
      monitoring: 'Peak/trough levels, SCr, BUN, hearing tests, I&Os',
      safeMax: 500, // for 70kg adult
      borderlineMax: 600
    },
    warfarin: {
      name: 'Warfarin (Coumadin)',
      route: 'Oral',
      pediatricDose: 0.1, // mg/kg/dose (rarely used in peds)
      adultDose: 5, // mg/dose (typical starting)
      frequency: 'Daily',
      maxDailyPediatric: 0.3,
      maxDailyAdult: 10, // mg/day (typical max)
      renalAdjust: false,
      indication: 'Anticoagulation (DVT, PE, AFib, mechanical valves)',
      contraindications: 'Active bleeding, pregnancy, severe liver disease',
      monitoring: 'INR (target 2-3 for most indications), bleeding signs, CBC',
      safeMax: 10,
      borderlineMax: 15
    },
    enoxaparin: {
      name: 'Enoxaparin (Lovenox)',
      route: 'SubQ',
      pediatricDose: 1, // mg/kg/dose
      adultDose: 1, // mg/kg/dose (treatment dose)
      frequency: 'Q12H',
      maxDailyPediatric: 2,
      maxDailyAdult: 180, // mg (for 90kg patient)
      renalAdjust: true,
      indication: 'DVT/PE treatment and prophylaxis, ACS, bridge therapy',
      contraindications: 'Active major bleeding, severe thrombocytopenia, hypersensitivity',
      monitoring: 'CBC (platelets), SCr, anti-Xa levels if needed, bleeding signs',
      safeMax: 180,
      borderlineMax: 200
    },
    morphine: {
      name: 'Morphine',
      route: 'IV/PO',
      pediatricDose: 0.1, // mg/kg/dose IV
      adultDose: 4, // mg IV (2-10mg range)
      frequency: 'Q4H PRN',
      maxDailyPediatric: 0.6, // mg/kg/day
      maxDailyAdult: 200, // mg/day
      renalAdjust: true,
      indication: 'Moderate to severe pain, acute MI, pulmonary edema',
      contraindications: 'Respiratory depression, acute asthma, GI obstruction',
      monitoring: 'Pain score, respiratory rate, sedation level, blood pressure',
      safeMax: 200,
      borderlineMax: 300
    },
    digoxin: {
      name: 'Digoxin',
      route: 'Oral/IV',
      pediatricDose: 0.01, // mg/kg/day (divided)
      adultDose: 0.25, // mg/day
      frequency: 'Daily',
      maxDailyPediatric: 0.015,
      maxDailyAdult: 0.5, // mg/day
      renalAdjust: true,
      indication: 'Heart failure, atrial fibrillation rate control',
      contraindications: 'Ventricular fibrillation, AV block, digoxin toxicity',
      monitoring: 'Digoxin level (0.5-2 ng/mL), K+, Mg2+, SCr, ECG, HR',
      safeMax: 0.5,
      borderlineMax: 0.75
    }
  };

  let currentAgeGroup = 'adult';
  let currentMed = 'acetaminophen';

  function setAgeGroup(group) {
    currentAgeGroup = group;

    // Update button styles
    document.querySelectorAll('.age-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(\`btn-\${group}\`).classList.add('active');

    // Show/hide age input
    document.getElementById('age-input-container').style.display = group === 'pediatric' ? 'block' : 'none';

    // Adjust weight slider max for pediatric
    const weightSlider = document.getElementById('weight');
    if (group === 'pediatric') {
      weightSlider.max = 80;
      if (parseFloat(weightSlider.value) > 80) {
        weightSlider.value = 30;
      }
    } else {
      weightSlider.max = 150;
    }

    updateDosing();
  }

  function updateDosing() {
    const med = document.getElementById('medication').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const crcl = parseFloat(document.getElementById('crcl').value);
    const age = parseFloat(document.getElementById('age').value);

    currentMed = med;

    // Update displays
    document.getElementById('weight-display').textContent = weight;
    document.getElementById('crcl-display').textContent = crcl;
    document.getElementById('age-display').textContent = age;

    const drug = drugDatabase[med];

    // Calculate dose
    let dose, maxDaily;
    if (currentAgeGroup === 'pediatric') {
      dose = drug.pediatricDose * weight;
      maxDaily = drug.maxDailyPediatric * weight;
    } else {
      // Some drugs are weight-based for adults (vancomycin, gentamicin, enoxaparin)
      if (['vancomycin', 'gentamicin', 'enoxaparin'].includes(med)) {
        dose = drug.adultDose * weight;
      } else {
        dose = drug.adultDose;
      }
      maxDaily = drug.maxDailyAdult;
    }

    // Apply renal adjustment
    let adjustmentText = '';
    let showAdjustment = false;
    if (drug.renalAdjust) {
      if (crcl < 30) {
        dose = dose * 0.5;
        adjustmentText = 'Dose reduced by 50% due to CrCl <30 mL/min';
        showAdjustment = true;
      } else if (crcl < 60) {
        dose = dose * 0.75;
        adjustmentText = 'Dose reduced by 25% due to CrCl <60 mL/min';
        showAdjustment = true;
      }
    }

    // Round dose
    dose = Math.round(dose * 10) / 10;

    // Update UI
    document.getElementById('drug-name').textContent = drug.name;
    document.getElementById('drug-route').textContent = drug.route;
    document.getElementById('calculated-dose').textContent = \`\${dose} mg\`;
    document.getElementById('frequency').textContent = drug.frequency;
    document.getElementById('max-dose').textContent = \`\${Math.round(maxDaily)} mg/day\`;
    document.getElementById('route-display').textContent = drug.route.split('/')[0];

    // Clinical info
    document.getElementById('indication').innerHTML = \`<strong class="text-white">Indication:</strong> \${drug.indication}\`;
    document.getElementById('contraindications').innerHTML = \`<strong class="text-white">Contraindications:</strong> \${drug.contraindications}\`;
    document.getElementById('monitoring').innerHTML = \`<strong class="text-white">Monitoring:</strong> \${drug.monitoring}\`;

    // Adjustment notice
    if (showAdjustment) {
      document.getElementById('adjustment-notice').classList.remove('hidden');
      document.getElementById('adjustment-text').textContent = adjustmentText;
    } else {
      document.getElementById('adjustment-notice').classList.add('hidden');
    }

    // Safety assessment
    const frequencyMultiplier = drug.frequency.includes('Q6H') ? 4 :
                                drug.frequency.includes('Q8H') ? 3 :
                                drug.frequency.includes('Q12H') ? 2 : 1;
    const dailyDose = dose * frequencyMultiplier;

    let safetyStatus = 'safe';
    let safetyText = '✓ SAFE';
    let safetyColor = 'green';

    if (dailyDose > drug.borderlineMax) {
      safetyStatus = 'toxic';
      safetyText = '🚨 TOXIC';
      safetyColor = 'red';
    } else if (dailyDose > drug.safeMax) {
      safetyStatus = 'borderline';
      safetyText = '⚠ BORDERLINE';
      safetyColor = 'yellow';
    }

    // Update safety badge
    const badge = document.getElementById('safety-badge');
    badge.className = \`px-4 py-2 border rounded-xl font-bold text-lg bg-\${safetyColor}-500/20 border-\${safetyColor}-500/50 text-\${safetyColor}-400\`;
    badge.textContent = safetyText;

    // Show/hide warning
    if (safetyStatus === 'toxic') {
      document.getElementById('warning-zone').classList.remove('hidden');
      document.getElementById('warning-text').textContent =
        \`Calculated daily dose (\${Math.round(dailyDose)} mg/day) exceeds safe maximum (\${drug.safeMax} mg/day). Consider dose reduction or alternative therapy.\`;
    } else {
      document.getElementById('warning-zone').classList.add('hidden');
    }

    // Update therapeutic window visualization
    const percentage = Math.min((dailyDose / drug.borderlineMax) * 100, 100);
    document.getElementById('dose-indicator').style.left = \`\${percentage}%\`;

    // Update range labels
    document.getElementById('safe-range').textContent = \`0-\${drug.safeMax} mg/day\`;
    document.getElementById('borderline-range').textContent = \`\${drug.safeMax}-\${drug.borderlineMax} mg/day\`;
    document.getElementById('toxic-range').textContent = \`>\${drug.borderlineMax} mg/day\`;
  }

  function printDosingCard() {
    window.print();
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = \`fixed top-4 right-4 z-[9999] flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg shadow-black/20 max-w-md \${
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

  // Initialize on load
  updateDosing();
</script>
`;

export const DRUG_DOSING_PROMPT_AUGMENT = `
Generate a real-time drug dosing calculator following this interactive format:

STRUCTURE:
1. Medication selection dropdown (8+ common drugs)
2. Patient parameter sliders:
   - Weight (kg) with real-time updates
   - Age group toggle (Pediatric vs Adult)
   - Creatinine clearance (CrCl) for renal dosing
   - Age slider (for pediatric calculations)
3. Real-time calculated dose display with:
   - Recommended dose
   - Frequency
   - Maximum daily dose
   - Route of administration
4. Visual therapeutic window indicator showing safe/borderline/toxic zones
5. Safety warnings that appear when dose exceeds limits
6. Clinical considerations (indications, contraindications, monitoring)

FEATURES:
- Weight-based dosing formulas (mg/kg)
- Automatic renal dose adjustment based on CrCl
- Pediatric vs adult dosing calculations
- Real-time visual feedback with color-coded zones (green/yellow/red)
- Interactive sliders that update calculations instantly
- Safety alerts for toxic doses
- Print/export functionality for dosing card

MEDICATIONS TO INCLUDE (minimum 8):
- Acetaminophen (pain/fever)
- Antibiotics (amoxicillin, vancomycin, gentamicin)
- Anticoagulants (warfarin, enoxaparin)
- Analgesics (morphine)
- Cardiac drugs (digoxin)

DOSING PARAMETERS FOR EACH DRUG:
- Pediatric dose (mg/kg/dose)
- Adult dose (mg/dose or mg/kg)
- Frequency (Q6H, Q8H, Q12H, etc.)
- Maximum daily dose (pediatric and adult)
- Whether renal adjustment is needed
- Safe therapeutic range
- Toxic dose threshold

VISUAL ELEMENTS:
- Gradient background indicator showing safe → borderline → toxic zones
- Moving arrow/indicator showing where current dose falls
- Color-coded badges (green = safe, yellow = borderline, red = toxic)
- Animated slider thumbs with glow effects
- Real-time number updates as sliders move

SAFETY FEATURES:
- Automatic warning when dose exceeds safe maximum
- Renal adjustment alerts when CrCl is low
- Different calculations for pediatric vs adult
- Maximum dose limits enforced
- Visual red zone for toxic doses

INTERACTIVITY:
- Smooth slider interactions with instant recalculation
- Toggle between pediatric and adult modes
- Medication dropdown changes all parameters
- Print button to generate dosing card
- Hover states on all interactive elements

STYLE:
- Purple/pink gradient medical theme
- Dark background with bright accents
- Large, readable dose numbers
- Clear visual hierarchy
- Professional clinical appearance
- Mobile-responsive sliders and controls

EDUCATIONAL VALUE:
- Shows relationship between weight and dose
- Demonstrates renal dosing adjustments
- Highlights toxic dose warnings
- Includes clinical pearls for each medication
- Real-world dosing scenarios
`;

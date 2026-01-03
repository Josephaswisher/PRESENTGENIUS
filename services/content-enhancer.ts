/**
 * Content Enhancement Service
 *
 * Analyzes slide content and generates contextual enhancements:
 * - Clinical Pearls: Tips, mnemonics, quick facts
 * - Warnings: Critical safety info, contraindications, black box warnings
 * - Evidence: Study citations, statistics, guideline recommendations
 */

import { generateWithProvider, AIProvider } from './ai-provider';
import type { ContentEnhancement, EnhancementType } from '../components/ContentEnhancementLayer';

interface DetectionResult {
  hasEnhancements: boolean;
  suggestedTypes: EnhancementType[];
  context: string;
}

/**
 * Detect if content warrants enhancements
 */
export function detectEnhancementOpportunities(htmlContent: string): DetectionResult {
  const text = htmlContent.replace(/<[^>]*>/g, ' ').toLowerCase();
  const suggestedTypes: EnhancementType[] = [];

  // Detection patterns
  const warningKeywords = [
    'contraindication', 'adverse', 'toxicity', 'black box', 'warning',
    'caution', 'avoid', 'do not', 'emergency', 'critical', 'life-threatening',
    'danger', 'fatal', 'severe', 'serious', 'anaphylaxis'
  ];

  const pearlKeywords = [
    'remember', 'tip', 'mnemonic', 'pearl', 'key point', 'clinical tip',
    'bedside', 'practical', 'quick', 'rule of thumb', 'classic',
    'hallmark', 'pathognomonic', 'diagnostic'
  ];

  const evidenceKeywords = [
    'study', 'trial', 'evidence', 'guideline', 'recommendation', 'meta-analysis',
    'randomized', 'rct', 'statistics', 'mortality', 'efficacy', 'outcome',
    'percentage', 'risk', 'benefit', 'p value', 'significant'
  ];

  // Check for drug/medication content (high priority for warnings)
  const drugPatterns = /\b(mg|mcg|dose|dosing|medication|drug|therapy|treatment|prescription)\b/gi;
  const hasDrugContent = drugPatterns.test(text);

  // Check for procedure/intervention content (warrants warnings)
  const procedurePatterns = /\b(procedure|surgery|intervention|operation|catheter|intubation)\b/gi;
  const hasProcedureContent = procedurePatterns.test(text);

  // Detect warnings
  if (warningKeywords.some(kw => text.includes(kw)) || hasDrugContent || hasProcedureContent) {
    suggestedTypes.push('warning');
  }

  // Detect clinical pearls
  if (pearlKeywords.some(kw => text.includes(kw))) {
    suggestedTypes.push('pearl');
  }

  // Detect evidence
  if (evidenceKeywords.some(kw => text.includes(kw))) {
    suggestedTypes.push('evidence');
  }

  // Always suggest at least one pearl for educational content
  if (suggestedTypes.length === 0 && text.length > 200) {
    suggestedTypes.push('pearl');
  }

  return {
    hasEnhancements: suggestedTypes.length > 0,
    suggestedTypes,
    context: text.slice(0, 1000),
  };
}

/**
 * Auto-position enhancements based on content layout
 */
export function autoPositionEnhancements(
  enhancements: ContentEnhancement[],
  slideWidth: number = 100,
  slideHeight: number = 100
): ContentEnhancement[] {
  const positions = [
    { x: 5, y: 10 },    // Top left
    { x: 70, y: 10 },   // Top right
    { x: 5, y: 70 },    // Bottom left
    { x: 70, y: 70 },   // Bottom right
    { x: 35, y: 5 },    // Top center
    { x: 35, y: 85 },   // Bottom center
  ];

  return enhancements.map((enhancement, index) => ({
    ...enhancement,
    position: positions[index % positions.length] || { x: 10, y: 10 + (index * 15) },
  }));
}

/**
 * Generate clinical pearls using AI
 */
export async function generateClinicalPearls(
  content: string,
  topic: string,
  provider: AIProvider = 'gemini'
): Promise<ContentEnhancement[]> {
  const prompt = `You are a master medical educator creating clinical pearls for a presentation.

SLIDE TOPIC: ${topic}
SLIDE CONTENT:
${content.slice(0, 2000)}

Generate 2-3 high-yield clinical pearls that would help learners remember and apply this content.

Clinical pearls should be:
- Memorable (use mnemonics when appropriate)
- Practical bedside tips
- Pattern recognition shortcuts
- Quick diagnostic/treatment reminders
- "Things I wish I knew as a resident"

Return ONLY a JSON array with this structure:
[
  {
    "title": "Brief catchy title (optional, can be empty string)",
    "content": "The pearl content (1-2 sentences max)",
    "citation": "Source if applicable (optional, can be empty string)"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

  try {
    const response = await generateWithProvider(provider, prompt, [], {});
    const jsonMatch = response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      return [];
    }

    const pearls = JSON.parse(jsonMatch[0]);

    return pearls.map((pearl: any, index: number) => ({
      id: `pearl-${Date.now()}-${index}`,
      type: 'pearl' as EnhancementType,
      title: pearl.title || '',
      content: pearl.content,
      citation: pearl.citation || undefined,
      position: { x: 0, y: 0 }, // Will be auto-positioned later
      isVisible: true,
    }));
  } catch (error) {
    console.error('Failed to generate clinical pearls:', error);
    return [];
  }
}

/**
 * Generate warnings using AI
 */
export async function generateWarnings(
  content: string,
  topic: string,
  provider: AIProvider = 'gemini'
): Promise<ContentEnhancement[]> {
  const prompt = `You are a patient safety expert creating critical warnings for a medical presentation.

SLIDE TOPIC: ${topic}
SLIDE CONTENT:
${content.slice(0, 2000)}

Generate 1-2 critical safety warnings, contraindications, or important cautions related to this content.

Warnings should focus on:
- Black box warnings for medications
- Absolute/relative contraindications
- Life-threatening complications
- Common serious errors to avoid
- Critical safety considerations

Return ONLY a JSON array with this structure:
[
  {
    "title": "Warning type (e.g., 'Contraindication', 'Black Box Warning')",
    "content": "The warning content (1-2 sentences max)",
    "citation": "Source/guideline if applicable (optional, can be empty string)"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text. If no critical warnings apply, return an empty array [].`;

  try {
    const response = await generateWithProvider(provider, prompt, [], {});
    const jsonMatch = response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      return [];
    }

    const warnings = JSON.parse(jsonMatch[0]);

    return warnings.map((warning: any, index: number) => ({
      id: `warning-${Date.now()}-${index}`,
      type: 'warning' as EnhancementType,
      title: warning.title,
      content: warning.content,
      citation: warning.citation || undefined,
      position: { x: 0, y: 0 }, // Will be auto-positioned later
      isVisible: true,
    }));
  } catch (error) {
    console.error('Failed to generate warnings:', error);
    return [];
  }
}

/**
 * Generate evidence-based enhancements using AI
 */
export async function generateEvidence(
  content: string,
  topic: string,
  provider: AIProvider = 'gemini'
): Promise<ContentEnhancement[]> {
  const prompt = `You are a medical librarian creating evidence-based annotations for a presentation.

SLIDE TOPIC: ${topic}
SLIDE CONTENT:
${content.slice(0, 2000)}

Generate 1-2 key evidence-based facts or statistics that support this content.

Evidence should include:
- Landmark trial results
- Important statistics (mortality, efficacy, etc.)
- Guideline recommendations (ACC/AHA, ADA, etc.)
- Meta-analysis findings
- Level of evidence

Return ONLY a JSON array with this structure:
[
  {
    "title": "Study/guideline name or key statistic",
    "content": "The evidence summary (1-2 sentences max)",
    "citation": "Full citation or source"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text. Citations are REQUIRED for evidence.`;

  try {
    const response = await generateWithProvider(provider, prompt, [], {});
    const jsonMatch = response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      return [];
    }

    const evidence = JSON.parse(jsonMatch[0]);

    return evidence.map((ev: any, index: number) => ({
      id: `evidence-${Date.now()}-${index}`,
      type: 'evidence' as EnhancementType,
      title: ev.title,
      content: ev.content,
      citation: ev.citation,
      position: { x: 0, y: 0 }, // Will be auto-positioned later
      isVisible: true,
    }));
  } catch (error) {
    console.error('Failed to generate evidence:', error);
    return [];
  }
}

/**
 * Generate all enhancements for slide content
 */
export async function generateEnhancementsForSlide(
  slideHtml: string,
  topic: string,
  provider: AIProvider = 'gemini'
): Promise<ContentEnhancement[]> {
  const detection = detectEnhancementOpportunities(slideHtml);

  if (!detection.hasEnhancements) {
    return [];
  }

  const allEnhancements: ContentEnhancement[] = [];

  // Generate each type in parallel
  const promises: Promise<ContentEnhancement[]>[] = [];

  if (detection.suggestedTypes.includes('pearl')) {
    promises.push(generateClinicalPearls(slideHtml, topic, provider));
  }

  if (detection.suggestedTypes.includes('warning')) {
    promises.push(generateWarnings(slideHtml, topic, provider));
  }

  if (detection.suggestedTypes.includes('evidence')) {
    promises.push(generateEvidence(slideHtml, topic, provider));
  }

  try {
    const results = await Promise.all(promises);
    results.forEach(enhancements => allEnhancements.push(...enhancements));

    // Auto-position the enhancements
    return autoPositionEnhancements(allEnhancements);
  } catch (error) {
    console.error('Failed to generate enhancements:', error);
    return [];
  }
}

/**
 * Inject enhancement layer HTML into a slide
 */
export function injectEnhancementLayerHTML(
  slideHtml: string,
  enhancements: ContentEnhancement[]
): string {
  if (enhancements.length === 0) {
    return slideHtml;
  }

  // Generate enhancement HTML
  const enhancementHTML = enhancements.map(enhancement => {
    const config = {
      pearl: {
        emoji: '💎',
        color: 'cyan',
        bgColor: 'rgba(6, 182, 212, 0.1)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        label: 'Clinical Pearl',
      },
      warning: {
        emoji: '⚠️',
        color: 'yellow',
        bgColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: 'rgba(234, 179, 8, 0.3)',
        label: 'Warning',
      },
      evidence: {
        emoji: '📊',
        color: 'purple',
        bgColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        label: 'Evidence',
      },
    };

    const c = config[enhancement.type];

    return `
<div class="enhancement-card ${enhancement.isVisible ? '' : 'hidden'}"
     data-enhancement-id="${enhancement.id}"
     data-type="${enhancement.type}"
     style="
       position: absolute;
       left: ${enhancement.position.x}%;
       top: ${enhancement.position.y}%;
       max-width: 320px;
       min-width: 240px;
       background: ${c.bgColor};
       backdrop-filter: blur(12px);
       border: 2px solid ${c.borderColor};
       border-radius: 12px;
       box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
       cursor: grab;
       z-index: 100;
     "
     draggable="true">
  <div style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  ">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 1.25rem;">${c.emoji}</span>
      <span style="font-size: 0.875rem; font-weight: 700; color: var(--${c.color}-400, #fff);">
        ${c.label}
      </span>
    </div>
    <button class="enhancement-close" data-close="${enhancement.id}" style="
      padding: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.2rem;
      line-height: 1;
    ">×</button>
  </div>
  <div style="padding: 16px;">
    ${enhancement.title ? `<h4 style="font-weight: 600; color: white; font-size: 0.875rem; margin: 0 0 8px 0; line-height: 1.4;">${enhancement.title}</h4>` : ''}
    <p style="color: rgba(255, 255, 255, 0.9); font-size: 0.875rem; margin: 0; line-height: 1.5;">
      ${enhancement.content}
    </p>
    ${enhancement.citation ? `<p style="color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; font-style: italic; margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">${enhancement.citation}</p>` : ''}
  </div>
</div>`;
  }).join('\n');

  // Add toggle controls
  const toggleControlsHTML = `
<div class="enhancement-controls" style="
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 200;
">
  <button class="enhancement-toggle" data-toggle="pearl" style="
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 2px solid rgba(6, 182, 212, 0.5);
    background: rgba(6, 182, 212, 0.1);
    color: rgb(6, 182, 212);
    cursor: pointer;
  ">💎 Pearls</button>
  <button class="enhancement-toggle" data-toggle="warning" style="
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 2px solid rgba(234, 179, 8, 0.5);
    background: rgba(234, 179, 8, 0.1);
    color: rgb(234, 179, 8);
    cursor: pointer;
  ">⚠️ Warnings</button>
  <button class="enhancement-toggle" data-toggle="evidence" style="
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 2px solid rgba(168, 85, 247, 0.5);
    background: rgba(168, 85, 247, 0.1);
    color: rgb(168, 85, 247);
    cursor: pointer;
  ">📊 Evidence</button>
</div>`;

  // Add JavaScript for interactivity
  const enhancementScript = `
<script>
(function() {
  // Drag and drop
  let draggedCard = null;
  let offsetX = 0;
  let offsetY = 0;

  document.querySelectorAll('.enhancement-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = e.target;
      const rect = draggedCard.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      draggedCard.style.opacity = '0.5';
    });

    card.addEventListener('dragend', (e) => {
      if (!draggedCard) return;

      const x = ((e.clientX - offsetX) / window.innerWidth) * 100;
      const y = ((e.clientY - offsetY) / window.innerHeight) * 100;

      draggedCard.style.left = Math.max(0, Math.min(100, x)) + '%';
      draggedCard.style.top = Math.max(0, Math.min(100, y)) + '%';
      draggedCard.style.opacity = '1';

      // Save position to localStorage
      const id = draggedCard.getAttribute('data-enhancement-id');
      const positions = JSON.parse(localStorage.getItem('enhancement-positions') || '{}');
      positions[id] = { x: parseFloat(draggedCard.style.left), y: parseFloat(draggedCard.style.top) };
      localStorage.setItem('enhancement-positions', JSON.stringify(positions));

      draggedCard = null;
    });
  });

  // Close buttons
  document.querySelectorAll('.enhancement-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-close');
      const card = document.querySelector(\`[data-enhancement-id="\${id}"]\`);
      if (card) {
        card.style.display = 'none';

        // Save visibility to localStorage
        const visibility = JSON.parse(localStorage.getItem('enhancement-visibility') || '{}');
        visibility[id] = false;
        localStorage.setItem('enhancement-visibility', JSON.stringify(visibility));
      }
    });
  });

  // Toggle buttons
  document.querySelectorAll('.enhancement-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-toggle');
      const cards = document.querySelectorAll(\`.enhancement-card[data-type="\${type}"]\`);
      const anyVisible = Array.from(cards).some(c => c.style.display !== 'none');

      cards.forEach(card => {
        card.style.display = anyVisible ? 'none' : 'block';

        // Save visibility
        const id = card.getAttribute('data-enhancement-id');
        const visibility = JSON.parse(localStorage.getItem('enhancement-visibility') || '{}');
        visibility[id] = !anyVisible;
        localStorage.setItem('enhancement-visibility', JSON.stringify(visibility));
      });
    });
  });

  // Load saved positions and visibility
  const positions = JSON.parse(localStorage.getItem('enhancement-positions') || '{}');
  const visibility = JSON.parse(localStorage.getItem('enhancement-visibility') || '{}');

  document.querySelectorAll('.enhancement-card').forEach(card => {
    const id = card.getAttribute('data-enhancement-id');
    if (positions[id]) {
      card.style.left = positions[id].x + '%';
      card.style.top = positions[id].y + '%';
    }
    if (visibility[id] === false) {
      card.style.display = 'none';
    }
  });
})();
</script>`;

  // Inject into slide HTML (before closing body tag)
  const injected = slideHtml.replace(
    '</body>',
    `${toggleControlsHTML}\n${enhancementHTML}\n${enhancementScript}\n</body>`
  );

  return injected;
}

export default {
  detectEnhancementOpportunities,
  generateEnhancementsForSlide,
  generateClinicalPearls,
  generateWarnings,
  generateEvidence,
  autoPositionEnhancements,
  injectEnhancementLayerHTML,
};

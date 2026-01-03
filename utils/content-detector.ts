/**
 * Content-aware background detector for presentation slides
 * Analyzes slide content and returns appropriate background styles
 */

export type ContentType = 'code' | 'medical-diagram' | 'clinical-case' | 'data-viz' | 'text-heavy' | 'default';

export interface ContentAnalysis {
  type: ContentType;
  backgroundStyle: string;
  confidence: number;
}

/**
 * Detects content type and generates appropriate background style
 */
export function detectContentTypeAndBackground(slideElement: Element): string {
  if (!slideElement) return getDefaultBackground();

  const textContent = slideElement.textContent?.toLowerCase() || '';
  const htmlContent = slideElement.innerHTML.toLowerCase();

  // Code detection: Look for <pre>, <code> tags
  const hasCodeBlocks = slideElement.querySelectorAll('pre, code').length > 0;
  if (hasCodeBlocks || htmlContent.includes('class="code"') || htmlContent.includes('class="language-')) {
    return getCodeBackground();
  }

  // Medical diagrams: Look for images with medical keywords or medical terms
  const medicalKeywords = [
    'anatomy', 'medical', 'clinical', 'diagnosis', 'patient', 'treatment',
    'surgery', 'cardiac', 'brain', 'organ', 'mri', 'ct scan', 'x-ray',
    'pathology', 'radiology', 'physiological', 'anatomical'
  ];
  const hasMedicalContent = medicalKeywords.some(keyword => textContent.includes(keyword));
  const hasImages = slideElement.querySelectorAll('img').length > 0;

  if (hasMedicalContent && hasImages) {
    return getMedicalDiagramBackground();
  }

  // Clinical case: Look for patient, diagnosis keywords
  const clinicalKeywords = [
    'patient', 'diagnosis', 'symptoms', 'prognosis', 'case study',
    'chief complaint', 'history of present illness', 'physical examination',
    'laboratory', 'differential diagnosis'
  ];
  const hasClinicalContent = clinicalKeywords.some(keyword => textContent.includes(keyword));

  if (hasClinicalContent) {
    return getClinicalCaseBackground();
  }

  // Data visualization: Look for charts, tables, graphs
  const hasDataViz = slideElement.querySelectorAll('table, canvas, svg, .chart, .graph').length > 0;
  const dataKeywords = ['data', 'chart', 'graph', 'statistics', 'analysis', 'metrics', 'results', 'percentage', 'comparison'];
  const hasDataKeywords = dataKeywords.some(keyword => textContent.includes(keyword));

  if (hasDataViz || hasDataKeywords) {
    return getDataVizBackground();
  }

  // Text-heavy: Multiple paragraphs (more than 3 paragraphs or long text)
  const paragraphs = slideElement.querySelectorAll('p');
  const isTextHeavy = paragraphs.length > 3 || textContent.length > 500;

  if (isTextHeavy) {
    return getTextHeavyBackground();
  }

  // Default: Clean, minimal background
  return getDefaultBackground();
}

/**
 * Background styles for different content types
 */

function getCodeBackground(): string {
  return `
    background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
    position: relative;
  `;
}

function getMedicalDiagramBackground(): string {
  return `
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    position: relative;
  `;
}

function getClinicalCaseBackground(): string {
  return `
    background: linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #075985 100%);
    position: relative;
  `;
}

function getDataVizBackground(): string {
  return `
    background: linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%);
    position: relative;
  `;
}

function getTextHeavyBackground(): string {
  return `
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    position: relative;
  `;
}

function getDefaultBackground(): string {
  return `
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a24 50%, #2a2a3a 100%);
    position: relative;
  `;
}

/**
 * Applies CSS background style string to an HTML element
 */
export function applyBackgroundStyle(element: HTMLElement, backgroundStyle: string): void {
  const styleContent = backgroundStyle.trim();
  const cssProps = styleContent.split(';').filter(s => s.trim());

  cssProps.forEach(prop => {
    const [key, value] = prop.split(':').map(s => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      (element.style as any)[camelKey] = value;
    }
  });
}

/**
 * Analyzes content and returns detailed analysis
 */
export function analyzeContent(slideElement: Element): ContentAnalysis {
  if (!slideElement) {
    return {
      type: 'default',
      backgroundStyle: getDefaultBackground(),
      confidence: 1.0
    };
  }

  const textContent = slideElement.textContent?.toLowerCase() || '';
  const htmlContent = slideElement.innerHTML.toLowerCase();

  // Code detection
  const codeScore = slideElement.querySelectorAll('pre, code').length * 0.5;
  if (codeScore > 0.5) {
    return {
      type: 'code',
      backgroundStyle: getCodeBackground(),
      confidence: Math.min(codeScore, 1.0)
    };
  }

  // Medical diagrams
  const medicalKeywords = ['anatomy', 'medical', 'clinical', 'diagnosis', 'patient', 'treatment', 'surgery'];
  const medicalScore = medicalKeywords.filter(k => textContent.includes(k)).length / medicalKeywords.length;
  const hasImages = slideElement.querySelectorAll('img').length > 0;

  if (medicalScore > 0.2 && hasImages) {
    return {
      type: 'medical-diagram',
      backgroundStyle: getMedicalDiagramBackground(),
      confidence: medicalScore
    };
  }

  // Clinical case
  const clinicalKeywords = ['patient', 'diagnosis', 'symptoms', 'prognosis', 'case study'];
  const clinicalScore = clinicalKeywords.filter(k => textContent.includes(k)).length / clinicalKeywords.length;

  if (clinicalScore > 0.3) {
    return {
      type: 'clinical-case',
      backgroundStyle: getClinicalCaseBackground(),
      confidence: clinicalScore
    };
  }

  // Data visualization
  const hasDataViz = slideElement.querySelectorAll('table, canvas, svg, .chart, .graph').length > 0;
  const dataKeywords = ['data', 'chart', 'graph', 'statistics', 'analysis', 'metrics', 'results'];
  const dataScore = dataKeywords.filter(k => textContent.includes(k)).length / dataKeywords.length;

  if (hasDataViz || dataScore > 0.3) {
    return {
      type: 'data-viz',
      backgroundStyle: getDataVizBackground(),
      confidence: Math.max(hasDataViz ? 0.8 : 0, dataScore)
    };
  }

  // Text-heavy
  const paragraphs = slideElement.querySelectorAll('p');
  const isTextHeavy = paragraphs.length > 3 || textContent.length > 500;

  if (isTextHeavy) {
    return {
      type: 'text-heavy',
      backgroundStyle: getTextHeavyBackground(),
      confidence: Math.min(textContent.length / 1000, 1.0)
    };
  }

  return {
    type: 'default',
    backgroundStyle: getDefaultBackground(),
    confidence: 1.0
  };
}

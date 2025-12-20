/**
 * Perplexity AI Service - Medical Research Integration
 * Provides evidence-based search, guideline lookup, and fact-checking
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const getApiKey = () => {
  const key = import.meta.env.VITE_PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error('VITE_PERPLEXITY_API_KEY not set');
  }
  return key;
};

export interface PerplexityResponse {
  content: string;
  citations: string[];
  model: string;
}

export interface MedicalSearchResult {
  summary: string;
  keyPoints: string[];
  citations: string[];
  guidelines?: string[];
  lastUpdated?: string;
}

/**
 * Search for medical evidence on a topic
 */
export async function searchMedicalEvidence(topic: string): Promise<MedicalSearchResult> {
  const systemPrompt = `You are a medical research assistant. Provide evidence-based information with citations.
Focus on:
- Current clinical guidelines (ACC/AHA, IDSA, etc.)
- Recent high-quality studies (RCTs, meta-analyses)
- UpToDate-level accuracy
Format your response with clear sections and bullet points.`;

  const userPrompt = `Provide a comprehensive, evidence-based summary of: "${topic}"

Include:
1. Key clinical points (3-5 bullets)
2. Current guideline recommendations
3. Recent evidence updates
4. Common pitfalls or pearls

Cite your sources.`;

  const response = await callPerplexity(systemPrompt, userPrompt);
  
  return {
    summary: response.content,
    keyPoints: extractBulletPoints(response.content),
    citations: response.citations,
  };
}

/**
 * Get latest guidelines for a condition
 */
export async function getLatestGuidelines(condition: string): Promise<MedicalSearchResult> {
  const systemPrompt = `You are a clinical guidelines expert. Focus only on official society guidelines and recommendations.`;

  const userPrompt = `What are the current clinical practice guidelines for: "${condition}"?

Include:
1. Issuing organization (e.g., ACC/AHA, IDSA, ATS)
2. Year of most recent update
3. Key recommendations (with class/level of evidence if available)
4. Any notable changes from previous versions

Cite the specific guideline documents.`;

  const response = await callPerplexity(systemPrompt, userPrompt);
  
  return {
    summary: response.content,
    keyPoints: extractBulletPoints(response.content),
    citations: response.citations,
    guidelines: extractGuidelines(response.content),
  };
}

/**
 * Fact-check a medical claim
 */
export async function factCheckClaim(claim: string): Promise<{
  isAccurate: boolean;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  citations: string[];
}> {
  const systemPrompt = `You are a medical fact-checker. Evaluate claims against current evidence.
Be precise about certainty levels and cite sources.`;

  const userPrompt = `Evaluate this medical claim: "${claim}"

Provide:
1. Is this claim accurate? (Yes/No/Partially)
2. Confidence level (High/Medium/Low)
3. Brief explanation with evidence
4. Any important nuances or caveats`;

  const response = await callPerplexity(systemPrompt, userPrompt);
  
  const content = response.content.toLowerCase();
  const isAccurate = content.includes('yes') || content.includes('accurate') || content.includes('correct');
  const confidence = content.includes('high confidence') ? 'high' 
    : content.includes('low confidence') ? 'low' 
    : 'medium';

  return {
    isAccurate,
    confidence,
    explanation: response.content,
    citations: response.citations,
  };
}

/**
 * Get differential diagnosis suggestions
 */
export async function getDifferentialDiagnosis(presentation: string): Promise<{
  differentials: { diagnosis: string; likelihood: string; keyFeatures: string[] }[];
  mustNotMiss: string[];
  workup: string[];
  citations: string[];
}> {
  const systemPrompt = `You are an expert diagnostician. Provide systematic differential diagnoses.`;

  const userPrompt = `Generate a differential diagnosis for: "${presentation}"

Format:
1. Top 5 differentials with likelihood (most likely to less likely)
2. "Must not miss" diagnoses (even if less likely)
3. Recommended initial workup
4. Key distinguishing features for each`;

  const response = await callPerplexity(systemPrompt, userPrompt);
  
  return {
    differentials: extractDifferentials(response.content),
    mustNotMiss: extractMustNotMiss(response.content),
    workup: extractWorkup(response.content),
    citations: response.citations,
  };
}

/**
 * Get drug information
 */
export async function getDrugInfo(drugName: string): Promise<{
  mechanism: string;
  indications: string[];
  dosing: string;
  sideEffects: string[];
  interactions: string[];
  pearls: string[];
  citations: string[];
}> {
  const systemPrompt = `You are a clinical pharmacology expert. Provide practical, high-yield drug information.`;

  const userPrompt = `Provide clinical drug information for: "${drugName}"

Include:
1. Mechanism of action (simple explanation)
2. Common indications
3. Typical dosing (adult)
4. Important side effects
5. Key drug interactions
6. Clinical pearls`;

  const response = await callPerplexity(systemPrompt, userPrompt);
  
  return {
    mechanism: extractSection(response.content, 'mechanism'),
    indications: extractBulletPoints(extractSection(response.content, 'indication')),
    dosing: extractSection(response.content, 'dosing') || extractSection(response.content, 'dose'),
    sideEffects: extractBulletPoints(extractSection(response.content, 'side effect')),
    interactions: extractBulletPoints(extractSection(response.content, 'interaction')),
    pearls: extractBulletPoints(extractSection(response.content, 'pearl')),
    citations: response.citations,
  };
}

// Core API call
async function callPerplexity(systemPrompt: string, userPrompt: string): Promise<PerplexityResponse> {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      return_citations: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    citations: data.citations || [],
    model: data.model,
  };
}

// Helper functions
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .filter(line => line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map(line => line.replace(/^[-•*\d.]\s+/, '').trim())
    .filter(line => line.length > 0);
}

function extractGuidelines(text: string): string[] {
  const guidelinePatterns = [
    /\b(ACC|AHA|ESC|IDSA|ATS|ACCP|GOLD|GINA|JNC|KDIGO|NICE)\b[^.]*guidelines?[^.]*/gi,
    /\b\d{4}\s+[A-Z]+\/[A-Z]+\s+guidelines?\b[^.]*/gi,
  ];
  
  const guidelines: string[] = [];
  for (const pattern of guidelinePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      guidelines.push(...matches);
    }
  }
  return [...new Set(guidelines)];
}

function extractSection(text: string, keyword: string): string {
  const lines = text.split('\n');
  let inSection = false;
  let sectionContent: string[] = [];
  
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword)) {
      inSection = true;
      const afterKeyword = line.split(/:/)[1];
      if (afterKeyword) sectionContent.push(afterKeyword.trim());
    } else if (inSection) {
      if (line.match(/^[A-Z#\d]/)) {
        break; // New section started
      }
      sectionContent.push(line.trim());
    }
  }
  
  return sectionContent.join(' ').trim();
}

function extractDifferentials(text: string): { diagnosis: string; likelihood: string; keyFeatures: string[] }[] {
  // Simplified extraction - would need more sophisticated parsing for production
  const lines = text.split('\n').filter(l => l.trim());
  const differentials: { diagnosis: string; likelihood: string; keyFeatures: string[] }[] = [];
  
  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      const parts = line.replace(/^\d+\.\s*/, '').split(/[-–:]/);
      if (parts.length > 0) {
        differentials.push({
          diagnosis: parts[0].trim(),
          likelihood: parts[1]?.trim() || 'Unknown',
          keyFeatures: parts.slice(2).map(p => p.trim()).filter(p => p),
        });
      }
    }
  }
  
  return differentials.slice(0, 5);
}

function extractMustNotMiss(text: string): string[] {
  const section = extractSection(text, 'must not miss');
  return extractBulletPoints(section);
}

function extractWorkup(text: string): string[] {
  const section = extractSection(text, 'workup') || extractSection(text, 'evaluation');
  return extractBulletPoints(section);
}

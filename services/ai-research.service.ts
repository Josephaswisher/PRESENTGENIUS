/**
 * AI Research Service
 * Integrates Perplexity for medical research and evidence-based content enhancement
 * Note: Perplexity is accessed via MCP tools in Claude Code environment
 */

import { escapeHtml, sanitizeUrl } from '../utils/sanitization';

export interface ResearchResult {
  query: string;
  summary: string;
  sources: ResearchSource[];
  evidenceLevel?: EvidenceLevel;
  timestamp: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  type: 'guideline' | 'pubmed' | 'uptodate' | 'review' | 'other';
}

export type EvidenceLevel = 'A' | 'B' | 'C' | 'D' | 'expert';

export interface EvidenceBadge {
  level: EvidenceLevel;
  description: string;
  color: string;
  sources: string[];
}

// Evidence level descriptions (following standard medical evidence grading)
export const EVIDENCE_LEVELS: Record<EvidenceLevel, { description: string; color: string }> = {
  'A': {
    description: 'High-quality evidence from well-designed RCTs or meta-analyses',
    color: 'green',
  },
  'B': {
    description: 'Moderate-quality evidence from well-designed cohort or case-control studies',
    color: 'blue',
  },
  'C': {
    description: 'Low-quality evidence from observational studies or case series',
    color: 'yellow',
  },
  'D': {
    description: 'Very low-quality evidence or conflicting results',
    color: 'orange',
  },
  'expert': {
    description: 'Expert opinion or consensus without research evidence',
    color: 'gray',
  },
};

/**
 * Format a research query for medical content
 */
export function formatMedicalQuery(topic: string, context?: string): string {
  const baseQuery = topic.trim();
  const year = new Date().getFullYear();

  // Add current year and medical context
  let query = `${baseQuery} medical guidelines ${year}`;

  if (context) {
    query = `${context}: ${query}`;
  }

  return query;
}

/**
 * Format guideline search query
 */
export function formatGuidelineQuery(topic: string): string {
  const year = new Date().getFullYear();
  return `${topic} clinical practice guidelines ${year} ACC AHA IDSA recommendations`;
}

/**
 * Format PubMed search query
 */
export function formatPubMedQuery(topic: string): string {
  return `${topic} systematic review meta-analysis recent evidence`;
}

/**
 * Parse research result to extract sources and evidence level
 */
export function parseResearchResult(
  rawResponse: string,
  query: string
): ResearchResult {
  const sources: ResearchSource[] = [];
  let evidenceLevel: EvidenceLevel = 'expert';

  // Extract URLs and source information from response
  const urlRegex = /https?:\/\/[^\s\]"<>]+/g;
  const urls = rawResponse.match(urlRegex) || [];

  urls.forEach((url) => {
    let type: ResearchSource['type'] = 'other';

    if (url.includes('pubmed') || url.includes('ncbi.nlm.nih.gov')) {
      type = 'pubmed';
    } else if (url.includes('uptodate')) {
      type = 'uptodate';
    } else if (
      url.includes('acc.org') ||
      url.includes('heart.org') ||
      url.includes('idsociety.org') ||
      url.includes('who.int') ||
      url.includes('cdc.gov')
    ) {
      type = 'guideline';
    } else if (url.includes('cochrane')) {
      type = 'review';
    }

    sources.push({
      title: extractTitleFromUrl(url),
      url,
      snippet: '',
      type,
    });
  });

  // Determine evidence level based on source types
  if (sources.some((s) => s.type === 'guideline' || s.type === 'review')) {
    evidenceLevel = 'A';
  } else if (sources.some((s) => s.type === 'pubmed')) {
    evidenceLevel = 'B';
  } else if (sources.some((s) => s.type === 'uptodate')) {
    evidenceLevel = 'B';
  } else if (sources.length > 0) {
    evidenceLevel = 'C';
  }

  return {
    query,
    summary: rawResponse,
    sources: sources.slice(0, 10), // Limit to 10 sources
    evidenceLevel,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract a readable title from a URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    // Extract meaningful path parts
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    // Clean up the last part for display
    const title = lastPart
      .replace(/[-_]/g, ' ')
      .replace(/\.(html|htm|php|aspx?)$/i, '')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return title || hostname;
  } catch {
    return url;
  }
}

/**
 * Create an evidence badge from research result
 */
export function createEvidenceBadge(result: ResearchResult): EvidenceBadge {
  const level = result.evidenceLevel || 'expert';
  const levelInfo = EVIDENCE_LEVELS[level];

  return {
    level,
    description: levelInfo.description,
    color: levelInfo.color,
    sources: result.sources.map((s) => s.title),
  };
}

/**
 * Format citation in AMA style
 */
export function formatAMACitation(source: ResearchSource, index: number): string {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(source.title || 'Source');
  const safeUrl = sanitizeUrl(source.url) || '';

  switch (source.type) {
    case 'pubmed':
      return `${index}. PubMed: ${safeTitle}. Accessed ${year}. ${safeUrl}`.trim();
    case 'guideline':
      return `${index}. ${safeTitle}. Clinical Practice Guideline. ${year}. ${safeUrl}`.trim();
    case 'uptodate':
      return `${index}. UpToDate: ${safeTitle}. Accessed ${year}. ${safeUrl}`.trim();
    default:
      return `${index}. ${safeTitle}. ${safeUrl}`.trim();
  }
}

/**
 * Generate HTML for evidence badge
 */
export function generateEvidenceBadgeHTML(badge: EvidenceBadge): string {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500/20 border-green-400 text-green-300',
    blue: 'bg-blue-500/20 border-blue-400 text-blue-300',
    yellow: 'bg-yellow-500/20 border-yellow-400 text-yellow-300',
    orange: 'bg-orange-500/20 border-orange-400 text-orange-300',
    gray: 'bg-gray-500/20 border-gray-400 text-gray-300',
  };

  const classes = colorMap[badge.color] || colorMap.gray;

  return `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${classes}" title="${badge.description}">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Level ${badge.level}
    </span>
  `;
}

/**
 * Generate citations section HTML
 */
export function generateCitationsHTML(sources: ResearchSource[]): string {
  if (sources.length === 0) return '';

  const citations = sources.map((s, i) => formatAMACitation(s, i + 1)).join('\n');

  return `
    <div class="mt-8 pt-4 border-t border-zinc-700">
      <h4 class="text-sm font-semibold text-zinc-300 mb-2">References</h4>
      <ol class="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
        ${sources.map((s, i) => `<li><a href="${s.url}" target="_blank" class="hover:text-cyan-400 transition-colors">${s.title}</a></li>`).join('\n')}
      </ol>
    </div>
  `;
}

/**
 * Store research results locally
 */
export function cacheResearchResult(result: ResearchResult): void {
  const cacheKey = 'vibe-research-cache';
  const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  // Use query as key, store for 24 hours
  cache[result.query] = {
    ...result,
    cachedAt: Date.now(),
  };

  // Clean old entries (older than 24 hours)
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(cache).forEach((key) => {
    if (cache[key].cachedAt < dayAgo) {
      delete cache[key];
    }
  });

  localStorage.setItem(cacheKey, JSON.stringify(cache));
}

/**
 * Get cached research result
 */
export function getCachedResearch(query: string): ResearchResult | null {
  const cacheKey = 'vibe-research-cache';
  const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  const cached = cache[query];
  if (!cached) return null;

  // Check if cache is still valid (24 hours)
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (cached.cachedAt < dayAgo) return null;

  return cached;
}

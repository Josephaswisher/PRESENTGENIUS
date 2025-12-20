/**
 * VibePresenterPro - Research Service
 * Integrates with the Medical Scraper backend for evidence-based content
 *
 * Services available:
 * - Perplexity AI (medical-focused search with citations)
 * - PubMed (free, no API key required)
 * - Exa/Tavily (optional, requires API keys)
 * - UpToDate (requires login credentials)
 * - MKSAP 19 (requires login credentials)
 */

const SCRAPER_BASE_URL = 'http://localhost:8765';

export interface Citation {
  id: string;
  title: string;
  authors?: string[];
  source: string;
  year?: number;
  url?: string;
  pmid?: string;
  snippet?: string;
}

export interface SearchResponse {
  provider: string;
  query: string;
  content: string;
  citations: Citation[];
  timestamp: number;
}

export interface HealthStatus {
  status: string;
  playwright_available: boolean;
  scraping_libs_available: boolean;
  uptodate_logged_in: boolean;
  mksap_logged_in: boolean;
}

// ============================================================
// Health & Status
// ============================================================

export async function checkScraperHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Scraper service not available:', error);
    return null;
  }
}

// ============================================================
// Search Functions
// ============================================================

/**
 * Search using Perplexity AI with medical focus
 * Supports models: sonar-pro, sonar-reasoning-pro, sonar-deep-research
 */
export async function searchPerplexity(
  query: string,
  model: 'sonar-pro' | 'sonar-reasoning-pro' | 'sonar-deep-research' = 'sonar-pro',
  maxResults: number = 5
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/perplexity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      perplexity_model: model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search PubMed (free, no API key required)
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/pubmed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search using Exa neural search
 */
export async function searchExa(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/exa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`Exa search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search using Tavily
 */
export async function searchTavily(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/tavily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Aggregate search across multiple providers
 * Returns combined results from all available sources
 */
export async function searchAggregate(
  query: string,
  maxResults: number = 5,
  model: 'sonar-pro' | 'sonar-reasoning-pro' | 'sonar-deep-research' = 'sonar-pro'
): Promise<{
  query: string;
  sources: Record<string, SearchResponse>;
  errors: Record<string, string>;
  combined_content: string;
  all_citations: Citation[];
  timestamp: number;
}> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/aggregate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      perplexity_model: model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Aggregate search failed: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================
// UpToDate/MKSAP (Authenticated)
// ============================================================

/**
 * Login to UpToDate
 */
export async function loginUpToDate(
  username: string,
  password: string
): Promise<boolean> {
  const response = await fetch(`${SCRAPER_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      target: 'uptodate',
    }),
  });

  return response.ok;
}

/**
 * Login to MKSAP 19
 */
export async function loginMKSAP(
  username: string,
  password: string
): Promise<boolean> {
  const response = await fetch(`${SCRAPER_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      target: 'mksap',
    }),
  });

  return response.ok;
}

/**
 * Search UpToDate (requires prior login)
 */
export async function searchUpToDate(
  query: string,
  maxResults: number = 5
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/uptodate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`UpToDate search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search MKSAP 19 (requires prior login)
 */
export async function searchMKSAP(
  query: string,
  maxResults: number = 5
): Promise<SearchResponse> {
  const response = await fetch(`${SCRAPER_BASE_URL}/search/mksap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`MKSAP search failed: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================
// URL Scraping
// ============================================================

/**
 * Scrape a URL and convert to markdown
 */
export async function scrapeUrl(
  url: string,
  useLogin: boolean = false
): Promise<{
  title: string;
  content: string;
  citations: Citation[];
  url: string;
}> {
  const response = await fetch(`${SCRAPER_BASE_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      use_login: useLogin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scraping failed: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Format citations as markdown
 */
export function formatCitationsAsMarkdown(citations: Citation[]): string {
  return citations.map((c, i) => {
    const authors = c.authors?.join(', ') || '';
    const year = c.year ? ` (${c.year})` : '';
    const url = c.url ? ` [Link](${c.url})` : '';
    const pmid = c.pmid ? ` PMID: ${c.pmid}` : '';

    return `${i + 1}. **${c.title}**${year}\n   ${authors}${pmid}${url}`;
  }).join('\n\n');
}

/**
 * Format citations as HTML badges
 */
export function formatCitationsAsHTML(citations: Citation[]): string {
  return citations.map((c) => {
    const source = c.source || 'Source';
    const year = c.year ? ` ${c.year}` : '';
    const href = c.url || '#';

    return `<a href="${href}" target="_blank" rel="noopener"
      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/50 hover:bg-blue-800/40 transition-colors">
      📚 ${source}${year}
    </a>`;
  }).join(' ');
}

/**
 * Generate evidence grade badges
 */
export function getEvidenceGradeBadge(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const colors = {
    A: 'bg-green-900/30 text-green-300 border-green-800/50',
    B: 'bg-blue-900/30 text-blue-300 border-blue-800/50',
    C: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/50',
    D: 'bg-orange-900/30 text-orange-300 border-orange-800/50',
    E: 'bg-red-900/30 text-red-300 border-red-800/50',
  };

  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors[grade]} border">
    Level ${grade}
  </span>`;
}

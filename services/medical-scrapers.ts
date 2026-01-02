/**
 * Medical Scrapers Service - UpToDate & MKSAP Integration
 * Connects to the local Python scraper service for authenticated medical content
 */

const SCRAPER_BASE_URL = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:8765';

// Credentials - MUST be set via environment variables
// Never hardcode credentials in source code
const UPTODATE_CREDENTIALS = {
  username: import.meta.env.VITE_UPTODATE_USERNAME || '',
  password: import.meta.env.VITE_UPTODATE_PASSWORD || '',
};

const MKSAP_CREDENTIALS = {
  username: import.meta.env.VITE_MKSAP_USERNAME || '',
  password: import.meta.env.VITE_MKSAP_PASSWORD || '',
};

// Check if credentials are configured
export const hasUpToDateCredentials = (): boolean =>
  !!(UPTODATE_CREDENTIALS.username && UPTODATE_CREDENTIALS.password);
export const hasMKSAPCredentials = (): boolean =>
  !!(MKSAP_CREDENTIALS.username && MKSAP_CREDENTIALS.password);

export interface ScraperCitation {
  id: string;
  title: string;
  authors?: string[];
  source: string;
  year?: number;
  url?: string;
  pmid?: string;
  snippet?: string;
  evidenceScore?: number; // 0-100
  type?: 'guideline' | 'review' | 'trial' | 'other';
}

/**
 * Calculate evidence score based on source and recency
 */
export function calculateEvidenceScore(citation: ScraperCitation): number {
  let score = 50; // Base score

  // Source reputation
  const highImpact = ['nejm', 'lancet', 'jama', 'bmj', 'nature', 'science', 'uptodate', 'cochrane'];
  if (highImpact.some(s => citation.source.toLowerCase().includes(s))) {
    score += 30;
  }

  // Recency
  const currentYear = new Date().getFullYear();
  if (citation.year) {
    if (citation.year >= currentYear - 2) score += 20;
    else if (citation.year >= currentYear - 5) score += 10;
    else if (citation.year < currentYear - 10) score -= 10;
  }

  // Type
  if (citation.type === 'guideline') score += 15;
  if (citation.type === 'review') score += 10;

  return Math.min(100, Math.max(0, score));
}

export interface CitationGroup {
  id: string;
  citations: ScraperCitation[];
  primaryCitation: ScraperCitation;
}

/**
 * Deduplicate and group citations
 */
export function groupCitations(citations: ScraperCitation[]): CitationGroup[] {
  const groups: Record<string, ScraperCitation[]> = {};
  
  citations.forEach(c => {
    // Simple dedupe key based on title similarity
    const key = c.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  return Object.values(groups).map(group => {
    // Select highest evidence score as primary
    const primary = group.reduce((prev, curr) => 
      (calculateEvidenceScore(curr) > calculateEvidenceScore(prev)) ? curr : prev
    );
    return {
      id: primary.id,
      citations: group,
      primaryCitation: primary
    };
  });
}

/**
 * Check for guideline updates (Mock)
 */
export async function checkGuidelineUpdates(topic: string): Promise<ScraperCitation[]> {
  // In a real app, this would query a dedicated guideline API or filter PubMed for "Practice Guideline" [Publication Type]
  return [
    {
      id: `guideline-${Date.now()}`,
      title: `2025 Clinical Practice Guideline for ${topic}`,
      source: 'JAMA',
      year: 2025,
      type: 'guideline',
      evidenceScore: 95
    }
  ];
}

export interface ScraperSearchResponse {
  provider: string;
  query: string;
  content: string;
  citations: ScraperCitation[];
  timestamp: number;
}

export interface ScraperStatus {
  status: string;
  playwright_available: boolean;
  scraping_libs_available: boolean;
  uptodate_logged_in: boolean;
  mksap_logged_in: boolean;
}

let uptodateLoggedIn = false;
let mksapLoggedIn = false;

/**
 * Check if scraper service is running
 */
export async function checkScraperHealth(): Promise<ScraperStatus | null> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) return null;
    
    const status = await response.json();
    uptodateLoggedIn = status.uptodate_logged_in;
    mksapLoggedIn = status.mksap_logged_in;
    return status;
  } catch {
    return null;
  }
}

/**
 * Login to UpToDate
 */
export async function loginUpToDate(
  username?: string,
  password?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username || UPTODATE_CREDENTIALS.username,
        password: password || UPTODATE_CREDENTIALS.password,
        target: 'uptodate',
      }),
    });
    
    if (response.ok) {
      uptodateLoggedIn = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Login to MKSAP 19
 */
export async function loginMKSAP(
  username?: string,
  password?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username || MKSAP_CREDENTIALS.username,
        password: password || MKSAP_CREDENTIALS.password,
        target: 'mksap',
      }),
    });
    
    if (response.ok) {
      mksapLoggedIn = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Search UpToDate for medical content
 */
export async function searchUpToDate(
  query: string,
  maxResults: number = 5
): Promise<ScraperSearchResponse | null> {
  // Auto-login if not logged in
  if (!uptodateLoggedIn) {
    const success = await loginUpToDate();
    if (!success) {
      console.warn('UpToDate login failed - trying search anyway');
    }
  }
  
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/search/uptodate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`UpToDate search failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('UpToDate search error:', error);
    return null;
  }
}

/**
 * Search MKSAP 19 for board-style content
 */
export async function searchMKSAP(
  query: string,
  maxResults: number = 5
): Promise<ScraperSearchResponse | null> {
  // Auto-login if not logged in
  if (!mksapLoggedIn) {
    const success = await loginMKSAP();
    if (!success) {
      console.warn('MKSAP login failed - trying search anyway');
    }
  }
  
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/search/mksap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`MKSAP search failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('MKSAP search error:', error);
    return null;
  }
}

/**
 * Aggregate search across multiple providers
 */
export async function aggregateSearch(
  query: string,
  maxResults: number = 5,
  perplexityModel: string = 'sonar-pro'
): Promise<{
  sources: Record<string, ScraperSearchResponse>;
  errors: Record<string, string>;
  combined_content: string;
  all_citations: ScraperCitation[];
}> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/search/aggregate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        perplexity_model: perplexityModel,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Aggregate search failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Aggregate search error:', error);
    return {
      sources: {},
      errors: { aggregate: String(error) },
      combined_content: '',
      all_citations: [],
    };
  }
}

/**
 * Scrape a specific URL
 */
export async function scrapeUrl(url: string): Promise<{
  title: string;
  content: string;
  citations: ScraperCitation[];
  url: string;
} | null> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, use_login: true }),
    });
    
    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
}

/**
 * Search PubMed (no auth required)
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 10
): Promise<ScraperSearchResponse | null> {
  try {
    const response = await fetch(`${SCRAPER_BASE_URL}/search/pubmed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`PubMed search failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('PubMed search error:', error);
    return null;
  }
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: ScraperSearchResponse,
  maxLength: number = 5000
): {
  summary: string;
  keyPoints: string[];
  citations: string[];
} {
  const content = results.content.slice(0, maxLength);
  
  // Extract bullet points
  const lines = content.split('\n');
  const keyPoints = lines
    .filter(line => line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map(line => line.replace(/^[-•*\d.]\s+/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 10);
  
  // Format citations
  const citations = results.citations.map(c => 
    c.url ? `${c.title} - ${c.source} (${c.url})` : `${c.title} - ${c.source}`
  );
  
  return {
    summary: content,
    keyPoints,
    citations,
  };
}

/**
 * Get login status
 */
export function getLoginStatus(): { uptodate: boolean; mksap: boolean } {
  return {
    uptodate: uptodateLoggedIn,
    mksap: mksapLoggedIn,
  };
}

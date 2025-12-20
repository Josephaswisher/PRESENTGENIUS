/**
 * Medical Scrapers Service - UpToDate & MKSAP Integration
 * Connects to the local Python scraper service for authenticated medical content
 */

const SCRAPER_BASE_URL = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:8765';

// Credentials (should be env vars in production)
const UPTODATE_CREDENTIALS = {
  username: import.meta.env.VITE_UPTODATE_USERNAME || 'shikshasharma',
  password: import.meta.env.VITE_UPTODATE_PASSWORD || 'Jammu145!',
};

const MKSAP_CREDENTIALS = {
  username: import.meta.env.VITE_MKSAP_USERNAME || '',
  password: import.meta.env.VITE_MKSAP_PASSWORD || '',
};

export interface ScraperCitation {
  id: string;
  title: string;
  authors?: string[];
  source: string;
  year?: number;
  url?: string;
  pmid?: string;
  snippet?: string;
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

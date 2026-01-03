/**
 * Perplexity Citation Service
 * Enhances content from any AI provider with evidence-based citations
 * Uses Perplexity's web search to find medical literature and add references
 */

export interface CitationSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface CitationSearchResult {
  citations: CitationSource[];
  suggestedCitations: string; // Formatted text suggestions for where to add citations
}

/**
 * Search for citations related to a topic using Perplexity
 */
export async function searchCitations(
  topic: string,
  context?: string
): Promise<CitationSearchResult> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn('[Perplexity Citations] API key not configured, skipping citations');
    return { citations: [], suggestedCitations: '' };
  }

  try {
    const searchPrompt = buildSearchPrompt(topic, context);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a medical research assistant. Find relevant, high-quality medical sources for the given topic.',
          },
          {
            role: 'user',
            content: searchPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        search_domain_filter: [
          'pubmed.ncbi.nlm.nih.gov',
          'uptodate.com',
          'nejm.org',
          'thelancet.com',
          'jamanetwork.com',
          'cdc.gov',
          'who.int',
          'nih.gov',
        ],
        return_citations: true,
        return_images: false,
      }),
    });

    if (!response.ok) {
      console.error('[Perplexity Citations] API error:', response.status);
      return { citations: [], suggestedCitations: '' };
    }

    const data = await response.json();
    const citations = data.citations || [];
    const suggestedCitations = data.choices?.[0]?.message?.content || '';

    return {
      citations,
      suggestedCitations,
    };
  } catch (error) {
    console.error('[Perplexity Citations] Search failed:', error);
    return { citations: [], suggestedCitations: '' };
  }
}

/**
 * Add citations to HTML content
 */
export function addCitationsToHTML(
  html: string,
  citations: CitationSource[]
): string {
  if (!citations || citations.length === 0) {
    return html;
  }

  // Check if HTML already has a references section
  if (html.includes('id="references"') || html.includes('class="references"')) {
    console.log('[Perplexity Citations] HTML already has references section');
    return html;
  }

  // Build references section
  const referencesHtml = buildReferencesSection(citations);

  // Insert before closing body tag, or append if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${referencesHtml}</body>`);
  } else if (html.includes('</html>')) {
    return html.replace('</html>', `${referencesHtml}</html>`);
  } else {
    return html + referencesHtml;
  }
}

/**
 * Extract topics from HTML content for citation search
 */
export function extractTopicsFromHTML(html: string): string[] {
  const topics: string[] = [];

  // Extract main headings (h1, h2)
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/gi);
  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/gi);

  if (h1Match) {
    h1Match.forEach((heading) => {
      const text = heading.replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 3) {
        topics.push(text);
      }
    });
  }

  if (h2Match) {
    h2Match.forEach((heading) => {
      const text = heading.replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 3) {
        topics.push(text);
      }
    });
  }

  // Limit to first 5 topics to avoid overwhelming Perplexity
  return topics.slice(0, 5);
}

/**
 * Main function: Enhance content with citations
 */
export async function enhanceWithCitations(
  html: string,
  prompt?: string,
  onProgress?: (message: string) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log('[Perplexity Citations] No API key configured, returning original HTML');
    return html;
  }

  try {
    onProgress?.('Searching for medical citations...');

    // Extract main topics from HTML
    const topics = extractTopicsFromHTML(html);

    if (topics.length === 0) {
      console.log('[Perplexity Citations] No topics found in HTML');
      return html;
    }

    // Search for citations on the main topic
    const mainTopic = prompt || topics[0];
    const context = topics.join(', ');

    onProgress?.(`Finding evidence for: ${mainTopic}...`);

    const result = await searchCitations(mainTopic, context);

    if (result.citations.length === 0) {
      console.log('[Perplexity Citations] No citations found');
      onProgress?.('No citations found');
      return html;
    }

    onProgress?.(`Adding ${result.citations.length} citations...`);

    // Add citations to HTML
    const enhancedHtml = addCitationsToHTML(html, result.citations);

    onProgress?.(`Citations added successfully (${result.citations.length} sources)`);

    return enhancedHtml;
  } catch (error) {
    console.error('[Perplexity Citations] Enhancement failed:', error);
    return html; // Return original HTML on error
  }
}

/**
 * Helper: Build search prompt for Perplexity
 */
function buildSearchPrompt(topic: string, context?: string): string {
  let prompt = `Find 5-8 high-quality medical sources for the topic: "${topic}"\n\n`;

  if (context) {
    prompt += `Related topics: ${context}\n\n`;
  }

  prompt += `Requirements:
- Focus on peer-reviewed medical journals (NEJM, Lancet, JAMA, BMJ)
- Include clinical guidelines from authoritative sources (CDC, WHO, NIH)
- Prefer recent publications (last 5 years) unless topic requires classic studies
- Include systematic reviews or meta-analyses when available
- Ensure sources are from reputable medical institutions

Provide a brief summary of key findings from these sources that would be relevant for a medical education presentation.`;

  return prompt;
}

/**
 * Helper: Build HTML references section
 */
function buildReferencesSection(citations: CitationSource[]): string {
  let html = '\n<!-- REFERENCES SECTION ADDED BY PERPLEXITY -->\n';
  html += '<section id="references" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e5e7eb;">\n';
  html += '  <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">References</h2>\n';
  html += '  <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">Evidence-based sources provided by Perplexity AI</p>\n';
  html += '  <ol class="references" style="font-size: 0.875rem; line-height: 1.75; padding-left: 1.5rem; color: #374151;">\n';

  citations.forEach((citation, index) => {
    html += '    <li style="margin-bottom: 1rem;">\n';
    html += `      <a href="${citation.url || '#'}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-weight: 500; hover:underline;">\n`;
    html += `        ${citation.title || `Source ${index + 1}`}\n`;
    html += '      </a>\n';

    if (citation.snippet) {
      html += `      <p style="margin-top: 0.25rem; color: #6b7280; font-size: 0.8125rem;">${citation.snippet}</p>\n`;
    }

    html += '    </li>\n';
  });

  html += '  </ol>\n';
  html += '  <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 1.5rem; font-style: italic;">Citations generated using Perplexity AI web search. Verify accuracy before use.</p>\n';
  html += '</section>\n';

  return html;
}

/**
 * Validate Perplexity API key is configured
 */
export function isPerplexityConfigured(): boolean {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  return !!(apiKey && apiKey.startsWith('pplx-'));
}

/**
 * Get citation statistics from HTML
 */
export function getCitationStats(html: string): {
  hasCitations: boolean;
  citationCount: number;
} {
  const hasCitations = html.includes('id="references"') || html.includes('class="references"');

  if (!hasCitations) {
    return { hasCitations: false, citationCount: 0 };
  }

  // Count <li> elements in references section
  const referencesMatch = html.match(/<section[^>]*id="references"[^>]*>([\s\S]*?)<\/section>/i);

  if (!referencesMatch) {
    return { hasCitations: true, citationCount: 0 };
  }

  const referencesContent = referencesMatch[1];
  const liMatches = referencesContent.match(/<li[^>]*>/gi);
  const citationCount = liMatches ? liMatches.length : 0;

  return { hasCitations: true, citationCount };
}

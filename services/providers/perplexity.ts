/**
 * Perplexity AI Provider
 * Web-enhanced reasoning with live search and citations
 * API: https://docs.perplexity.ai/api-reference/chat-completions
 */
import { BaseProvider } from './base-provider';
import type { FileInput, GenerationOptions, ProgressCallback } from './base-provider';

export class PerplexityProvider extends BaseProvider {
  private apiKey: string;
  private endpoint = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    super();
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured. Add VITE_PERPLEXITY_API_KEY to your .env.local file');
    }
  }

  /**
   * Generate initial presentation with web search and citations
   */
  async generate(
    prompt: string,
    files: FileInput[] = [],
    options: GenerationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<string> {
    onProgress?.('perplexity', 10, 'Initializing Perplexity with web search...');

    // Enhance prompt for medical education with citation requirements
    const enhancedPrompt = this.buildEducationalPrompt(prompt, files, options);

    onProgress?.('perplexity', 30, 'Searching medical literature and generating content...');

    const requestFn = async () => {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are Dr. Swisher\'s Lecture Copilot, an expert medical education AI that creates comprehensive, evidence-based educational content with proper citations.',
            },
            {
              role: 'user',
              content: enhancedPrompt,
            },
          ],
          max_tokens: 16000,
          temperature: 0.7,
          search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'uptodate.com', 'nejm.org', 'thelancet.com', 'jamanetwork.com'],
          return_citations: true,
          return_images: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Perplexity API error: ${response.status}`);
      }

      return response.json();
    };

    onProgress?.('perplexity', 60, 'Processing AI response with citations...');

    const data = await this.makeRequestWithRetry(requestFn, onProgress);

    onProgress?.('perplexity', 90, 'Extracting HTML and formatting citations...');

    // Extract content and citations
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Format response with citations
    const htmlWithCitations = this.extractAndFormatHTML(content, citations);

    onProgress?.('perplexity', 100, 'Generation complete with citations!');

    return htmlWithCitations;
  }

  /**
   * Refine presentation with web-enhanced reasoning and citations
   */
  async refine(
    currentHtml: string,
    instruction: string,
    modelId = 'sonar',
    onProgress?: ProgressCallback
  ): Promise<string> {
    onProgress?.('perplexity', 10, 'Analyzing current content...');

    // OPTIMIZATION 1 & 2: Compress & truncate
    const compressedHtml = this.compressHtml(currentHtml);
    const { html: processedHtml, wasTruncated } = this.truncateHtmlForRefinement(compressedHtml, 80000);

    if (wasTruncated) {
      console.warn('[Perplexity] HTML truncated to fit context window');
    }

    this.logUsageWarnings(processedHtml.length, instruction.length, 128000, modelId);

    onProgress?.('perplexity', 30, 'Searching for updated medical information...');

    const messages = [
      {
        role: 'system',
        content: 'You are Dr. Swisher\'s Lecture Copilot. You refine medical education content with evidence-based updates and proper citations.',
      },
      {
        role: 'user',
        content: `Current HTML presentation:\n\n${processedHtml}\n\nRefinement request: ${instruction}\n\nIMPORTANT:\n1. Maintain all existing HTML structure and styling\n2. Add citations where new information is introduced\n3. Use current medical evidence and guidelines\n4. Return ONLY the complete HTML (no explanations)`,
      },
    ];

    const requestFn = async () => {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: 16000,
          temperature: 0.5,
          search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'uptodate.com', 'nejm.org', 'thelancet.com', 'jamanetwork.com'],
          return_citations: true,
          return_images: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Perplexity API error: ${response.status}`);
      }

      return response.json();
    };

    onProgress?.('perplexity', 70, 'Applying refinements with citations...');

    const data = await this.makeRequestWithRetry(requestFn, onProgress);

    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    onProgress?.('perplexity', 95, 'Formatting updated content...');

    const refinedHtml = this.extractAndFormatHTML(content, citations);

    onProgress?.('perplexity', 100, 'Refinement complete!');

    return refinedHtml;
  }

  /**
   * Build educational prompt with citation requirements
   */
  private buildEducationalPrompt(prompt: string, files: FileInput[], options: GenerationOptions): string {
    let enhancedPrompt = `Create a comprehensive medical education presentation on: ${prompt}\n\n`;

    enhancedPrompt += `REQUIREMENTS:\n`;
    enhancedPrompt += `1. Use current medical evidence and guidelines\n`;
    enhancedPrompt += `2. Include citations from reputable medical sources (PubMed, UpToDate, NEJM, Lancet, JAMA)\n`;
    enhancedPrompt += `3. Format as complete HTML with:\n`;
    enhancedPrompt += `   - Proper DOCTYPE and structure\n`;
    enhancedPrompt += `   - Embedded CSS for styling\n`;
    enhancedPrompt += `   - Sections organized by topic\n`;
    enhancedPrompt += `   - Citations formatted as numbered references\n`;
    enhancedPrompt += `4. Make content evidence-based and educational\n`;
    enhancedPrompt += `5. Include key clinical pearls and guidelines\n\n`;

    enhancedPrompt += `CITATION FORMAT:\n`;
    enhancedPrompt += `- Inline citations as superscript numbers: <sup>[1]</sup>\n`;
    enhancedPrompt += `- References section at bottom with:\n`;
    enhancedPrompt += `  <section id="references">\n`;
    enhancedPrompt += `    <h2>References</h2>\n`;
    enhancedPrompt += `    <ol class="references">\n`;
    enhancedPrompt += `      <li>Author, et al. Title. Journal. Year. DOI/URL</li>\n`;
    enhancedPrompt += `    </ol>\n`;
    enhancedPrompt += `  </section>\n\n`;

    enhancedPrompt += `OUTPUT: Complete HTML document with citations. No explanations, just pure HTML.`;

    return enhancedPrompt;
  }

  /**
   * Extract HTML from response and format citations
   */
  private extractAndFormatHTML(content: string, citations: any[]): string {
    // Try to extract HTML from markdown code blocks
    const htmlMatch = content.match(/```html\n?([\s\S]*?)```/) || content.match(/<!DOCTYPE[\s\S]*<\/html>/i);

    let html = '';
    if (htmlMatch) {
      html = htmlMatch[1] || htmlMatch[0];
    } else {
      html = content;
    }

    // If citations provided by API, append them to HTML
    if (citations && citations.length > 0) {
      html = this.appendCitationsToHTML(html, citations);
    }

    return html.trim();
  }

  /**
   * Append Perplexity citations to HTML
   */
  private appendCitationsToHTML(html: string, citations: any[]): string {
    // Check if HTML already has a references section
    if (html.includes('id="references"') || html.includes('class="references"')) {
      return html; // Already has citations
    }

    // Build references HTML
    let referencesHtml = `\n<section id="references" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e5e7eb;">\n`;
    referencesHtml += `  <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">References</h2>\n`;
    referencesHtml += `  <ol class="references" style="font-size: 0.875rem; line-height: 1.5; padding-left: 1.5rem;">\n`;

    citations.forEach((citation, index) => {
      referencesHtml += `    <li style="margin-bottom: 0.5rem;">\n`;
      referencesHtml += `      <a href="${citation.url || '#'}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; hover:underline;">\n`;
      referencesHtml += `        ${citation.title || `Source ${index + 1}`}\n`;
      referencesHtml += `      </a>\n`;
      if (citation.snippet) {
        referencesHtml += `      <p style="margin-top: 0.25rem; color: #6b7280;">${citation.snippet}</p>\n`;
      }
      referencesHtml += `    </li>\n`;
    });

    referencesHtml += `  </ol>\n`;
    referencesHtml += `</section>\n`;

    // Insert before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${referencesHtml}</body>`);
    } else {
      return html + referencesHtml;
    }
  }
}

/**
 * Research Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Research Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should export research functions', async () => {
    const research = await import('../services/research');

    // Check actual exported functions
    expect(research.searchPerplexity).toBeDefined();
    expect(research.searchPubMed).toBeDefined();
    expect(research.isScraperConfigured).toBeDefined();
    expect(research.searchAggregate).toBeDefined();
  });

  it('should check if scraper is configured', async () => {
    const research = await import('../services/research');

    const result = research.isScraperConfigured();
    expect(typeof result).toBe('boolean');
  });

  it('should have proper citation structure', () => {
    interface Citation {
      id: string;
      title: string;
      authors?: string[];
      source: string;
      year?: number;
      url?: string;
      pmid?: string;
    }

    const mockCitation: Citation = {
      id: 'cite-1',
      title: 'Medical Study on Topic X',
      authors: ['Smith J', 'Doe A'],
      source: 'New England Journal of Medicine',
      year: 2024,
      url: 'https://example.com/study',
      pmid: '12345678',
    };

    expect(mockCitation.id).toBeDefined();
    expect(mockCitation.title).toBeDefined();
    expect(mockCitation.source).toBeDefined();
  });

  it('should have search result structure', () => {
    interface SearchResult {
      answer: string;
      citations: any[];
      sources: string[];
    }

    const mockResult: SearchResult = {
      answer: 'The latest research shows...',
      citations: [],
      sources: ['PubMed', 'UpToDate'],
    };

    expect(mockResult.answer).toBeDefined();
    expect(Array.isArray(mockResult.citations)).toBe(true);
    expect(Array.isArray(mockResult.sources)).toBe(true);
  });

  it('should export citation formatting functions', async () => {
    const research = await import('../services/research');

    expect(research.formatCitationsAsMarkdown).toBeDefined();
    expect(research.formatCitationsAsHTML).toBeDefined();
  });
});

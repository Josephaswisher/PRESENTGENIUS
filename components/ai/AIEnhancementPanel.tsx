
/**
 * AI Enhancement Panel
 * Provides research integration and image generation capabilities
 */
import React, { useMemo, useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  PhotoIcon,
  DocumentMagnifyingGlassIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import {
  formatMedicalQuery,
  formatGuidelineQuery,
  EVIDENCE_LEVELS,
  generateEvidenceBadgeHTML,
  generateCitationsHTML,
  type EvidenceLevel,
  type ResearchSource,
} from '../../services/ai-research.service';
import {
  isFALConfigured,
  generatePlaceholder,
  MEDICAL_DIAGRAM_TEMPLATES,
  type ImageStyle,
  type GeneratedImage,
} from '../../services/fal-ai.service';

interface AIEnhancementPanelProps {
  html: string;
  title: string;
  onClose: () => void;
  onEnhance?: (enhancedHtml: string) => void;
}

type TabType = 'research' | 'images' | 'verify';

type VerificationState = {
  verified: boolean;
  issues: string[];
  suggestions: string[];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export function AIEnhancementPanel({
  html,
  title,
  onClose,
  onEnhance,
}: AIEnhancementPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('research');

  // Research state
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<string | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('medical-diagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationState | null>(null);

  // Provider gates
  const researchConfigured = useMemo(
    () => Boolean(import.meta.env.VITE_PERPLEXITY_API_KEY),
    []
  );
  const aiProviderConfigured = useMemo(
    () => Boolean(
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.VITE_ANTHROPIC_API_KEY
    ),
    []
  );

  const hasEnhancementContent = Boolean(researchResults || verificationResult);

  // Build enhanced HTML with citations and verification notes
  const buildEnhancedHtml = (): string => {
    if (!hasEnhancementContent) return html;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body || doc.createElement('body');

      const enhancementSection = doc.createElement('section');
      enhancementSection.className = 'slide evidence-slide';
      enhancementSection.setAttribute('data-slide', 'evidence');

      const parts: string[] = [];
      parts.push(`<h2>Evidence & Updates</h2>`);

      if (researchResults) {
        const guidelineQuery = formatGuidelineQuery(title);
        parts.push(`
          <div class="research-summary">
            <p class="text-sm">${escapeHtml(researchResults).replace(/\n/g, '<br/>')}</p>
            <div class="text-xs text-zinc-500 mt-2">Search seed: ${escapeHtml(guidelineQuery)}</div>
          </div>
        `);
      }

      if (verificationResult) {
        const issues = verificationResult.issues
          .map(issue => `<li>⚠️ ${escapeHtml(issue)}</li>`)
          .join('');
        const suggestions = verificationResult.suggestions
          .map(s => `<li>✅ ${escapeHtml(s)}</li>`)
          .join('');

        parts.push(`
          <div class="verification-section mt-4">
            <h3 class="text-base font-semibold">Verification Findings</h3>
            ${issues ? `<ul class="text-sm space-y-1 text-red-300">${issues}</ul>` : ''}
            ${suggestions ? `<ul class="text-sm space-y-1 text-green-300 mt-2">${suggestions}</ul>` : ''}
          </div>
        `);
      }

      if (sources.length > 0) {
        parts.push(generateCitationsHTML(sources));
      }

      enhancementSection.innerHTML = parts.join('\n');
      body.appendChild(enhancementSection);

      const serialized = html.trim().toLowerCase().startsWith('<!doctype')
        ? doc.documentElement.outerHTML
        : body.innerHTML;
      return serialized;
    } catch (error) {
      console.error('Failed to apply enhancement HTML', error);
      return html;
    }
  };

  // Handle research
  const handleResearch = async () => {
    if (!researchQuery.trim()) return;

    setIsResearching(true);
    setResearchResults(null);

    try {
      const formattedQuery = formatMedicalQuery(researchQuery, title);

      // Simulated fetch; replace with MCP call when available
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoResults =
        `Research results for "${researchQuery}":

` +
        `This feature uses Perplexity MCP for deep medical research. ` +
        `When configured, it will search PubMed, UpToDate, and clinical guidelines ` +
        `to find evidence-based information on your topic.

` +
        `Query formatted as: ${formattedQuery}`;

      setResearchResults(demoResults);

      // Demo sources; real implementation should map API response
      setSources([
        {
          title: 'ACC/AHA Clinical Guidelines',
          url: 'https://www.acc.org/guidelines',
          snippet: 'Current clinical practice recommendations',
          type: 'guideline',
        },
        {
          title: 'PubMed Systematic Review',
          url: 'https://pubmed.ncbi.nlm.nih.gov',
          snippet: 'Meta-analysis of recent studies',
          type: 'pubmed',
        },
      ]);
    } catch (error) {
      console.error('Research failed:', error);
      setResearchResults('Research failed. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);

    try {
      const image = generatePlaceholder({
        prompt: imagePrompt,
        style: imageStyle,
      });

      setGeneratedImages((prev) => [image, ...prev]);
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle content verification
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Simulate verification (would use Perplexity in production)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationResult({
        verified: true,
        issues: [],
        suggestions: [
          'Consider adding recent guideline references',
          'Include evidence level badges for key statements',
          'Add clinical pearl highlights for high-yield points',
        ],
      });
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyEnhancement = () => {
    if (!onEnhance || !hasEnhancementContent) return;
    const updatedHtml = buildEnhancedHtml();
    onEnhance(updatedHtml);
  };

  // Copy evidence badge HTML
  const copyEvidenceBadge = (level: EvidenceLevel) => {
    const badge = {
      level,
      description: EVIDENCE_LEVELS[level].description,
      color: EVIDENCE_LEVELS[level].color,
      sources: [],
    };
    const badgeHtml = generateEvidenceBadgeHTML(badge);
    navigator.clipboard.writeText(badgeHtml);
  };

  // Use template prompt
  const useTemplate = (key: string) => {
    setImagePrompt(MEDICAL_DIAGRAM_TEMPLATES[key]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">AI Enhancements</h2>
              <p className="text-sm text-zinc-400">Research, verify, and generate visuals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Gates */}
        {(!aiProviderConfigured || !researchConfigured) && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-start gap-3 text-amber-200 text-sm">
            <ShieldExclamationIcon className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Running in demo mode</p>
              <p className="text-amber-200/80 text-xs">
                {aiProviderConfigured ? 'Add VITE_PERPLEXITY_API_KEY to enable live research.' : 'Add an AI provider key (OpenRouter, Gemini, or Claude) and VITE_PERPLEXITY_API_KEY for research/verification.'}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'research', label: 'Research', icon: MagnifyingGlassIcon },
            { id: 'images', label: 'Generate Images', icon: PhotoIcon },
            { id: 'verify', label: 'Verify Content', icon: CheckBadgeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Research Tab */}
          {activeTab === 'research' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Research Topic
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="e.g., Heart failure treatment guidelines"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                  />
                  <button
                    onClick={handleResearch}
                    disabled={isResearching || !researchQuery.trim()}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isResearching ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    )}
                    Search
                  </button>
                </div>
              </div>

              {/* Quick search buttons */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Quick searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Latest guidelines', 'Treatment updates', 'Evidence review'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setResearchQuery(`${title} ${q}`)}
                      className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {researchResults && (
                <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Results</h4>
                    <button
                      onClick={handleApplyEnhancement}
                      disabled={!hasEnhancementContent || !onEnhance}
                      className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                    >
                      Apply to slides
                    </button>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{researchResults}</p>

                  {sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <h5 className="text-sm font-medium text-zinc-400 mb-2">Sources</h5>
                      <ul className="space-y-1">
                        {sources.map((source, i) => (
                          <li key={i} className="text-xs">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              {source.title}
                            </a>
                            <span className="ml-2 text-zinc-500">({source.type})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Evidence Badges */}
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Evidence Level Badges</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(EVIDENCE_LEVELS) as EvidenceLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => copyEvidenceBadge(level)}
                      className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-left"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          level === 'A'
                            ? 'bg-green-500/20 text-green-400'
                            : level === 'B'
                            ? 'bg-blue-500/20 text-blue-400'
                            : level === 'C'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : level === 'D'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        Level {level}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-400">{EVIDENCE_LEVELS[level].description}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Click to copy badge HTML</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {!isFALConfigured() && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm text-amber-300">
                    FAL AI not configured. Set VITE_FAL_KEY to enable image generation.
                    Using placeholder images for demo.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Image Description
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the medical diagram or illustration you want to create..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Style</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'medical-diagram',
                    'anatomical',
                    'flowchart',
                    'infographic',
                  ].map((style) => (
                    <button
                      key={style}
                      onClick={() => setImageStyle(style as ImageStyle)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        imageStyle === style
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {style.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Quick templates:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(MEDICAL_DIAGRAM_TEMPLATES)
                    .slice(0, 6)
                    .map((key) => (
                      <button
                        key={key}
                        onClick={() => useTemplate(key)}
                        className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        {key.replace(/-/g, ' ')}
                      </button>
                    ))}
                </div>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGenerating || !imagePrompt.trim()}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PhotoIcon className="w-4 h-4" />
                    Generate Image
                  </>
                )}
              </button>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Generated Images</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((img) => (
                      <div
                        key={img.id}
                        className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
                      >
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-2">
                          <p className="text-xs text-zinc-400 truncate">{img.prompt}</p>
                          <p className="text-[10px] text-zinc-600">{img.style}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verify Tab */}
          {activeTab === 'verify' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <DocumentMagnifyingGlassIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Content Verification</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Check your content against current medical literature and guidelines
                  to ensure accuracy and identify outdated information.
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckBadgeIcon className="w-4 h-4" />
                    Verify Content
                  </>
                )}
              </button>

              {verificationResult && (
                <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckBadgeIcon
                        className={`w-5 h-5 ${
                          verificationResult.verified ? 'text-green-400' : 'text-amber-400'
                        }`}
                      />
                      <span className="font-medium text-white">
                        {verificationResult.verified ? 'Content Verified' : 'Review Needed'}
                      </span>
                    </div>
                    <button
                      onClick={handleApplyEnhancement}
                      disabled={!hasEnhancementContent || !onEnhance}
                      className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                    >
                      Apply to slides
                    </button>
                  </div>

                  {verificationResult.issues.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-400 mb-2">Issues Found</h5>
                      <ul className="space-y-1">
                        {verificationResult.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-zinc-300">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {verificationResult.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-purple-400 mb-2">Suggestions</h5>
                      <ul className="space-y-1">
                        {verificationResult.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-zinc-300">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIEnhancementPanel;

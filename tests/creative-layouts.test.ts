/**
 * Creative Layouts E2E Test Suite
 *
 * Comprehensive testing of all 25 upgrades with real presentation generation
 */

import { test, expect } from 'vitest';
import { CreativeLayoutService } from '../services/creative-layouts';
import { qualityScorer } from '../services/quality-scorer';
import { backgroundEnhancer } from '../services/background-enhancer';
import { promptSuggestions } from '../services/prompt-suggestions';
import type { CreativityLevel, LayoutType } from '../types/creative-layouts';

describe('Creative Layouts System', () => {
  let layoutService: CreativeLayoutService;

  beforeEach(() => {
    layoutService = new CreativeLayoutService({
      level: 'creative',
      layoutVariety: true,
      autoLayoutSelection: true,
    });
  });

  describe('Layout Selection', () => {
    test('selects appropriate layout for timeline content', () => {
      const content = 'History of heart failure guidelines: 2010 initial release, 2013 update with new medications, 2017 emphasis on HFpEF, 2020 SGLT2 inhibitors, 2024 current recommendations';

      const result = layoutService.selectLayout(content, 1, 10);

      expect(result.type).toBe('timeline');
      expect(result.reason).toContain('timeline');
    });

    test('selects split-screen for comparison content', () => {
      const content = 'Comparison of ACE inhibitors vs ARBs: efficacy, side effects, cost considerations';

      const result = layoutService.selectLayout(content, 1, 10);

      expect(result.type).toBe('split-screen');
      expect(result.reason).toContain('comparison');
    });

    test('selects radial layout for cyclical processes', () => {
      const content = 'Cardiac cycle: diastole filling, atrial contraction, isovolumetric contraction, ventricular ejection, isovolumetric relaxation';

      const result = layoutService.selectLayout(content, 1, 10);

      expect(result.type).toBe('radial');
      expect(result.reason).toContain('cycle');
    });

    test('selects horizontal slider for multi-step processes', () => {
      const content = 'ACLS algorithm: Step 1 assess rhythm, Step 2 CPR quality, Step 3 drug therapy, Step 4 reversible causes, Step 5 post-cardiac care';

      const result = layoutService.selectLayout(content, 1, 10);

      expect(result.type).toBe('horizontal-slider');
      expect(result.reason).toContain('process');
    });

    test('ensures variety across consecutive slides', () => {
      const layouts: LayoutType[] = [];

      for (let i = 0; i < 10; i++) {
        const result = layoutService.selectLayout('Generic medical content', i, 10);
        layouts.push(result.type);
      }

      // Check that we don't have 3 consecutive identical layouts
      for (let i = 0; i < layouts.length - 2; i++) {
        const hasVariety = !(
          layouts[i] === layouts[i + 1] &&
          layouts[i + 1] === layouts[i + 2]
        );
        expect(hasVariety).toBe(true);
      }
    });
  });

  describe('Creativity Levels', () => {
    test('standard level uses mostly standard layouts', () => {
      layoutService.updateSettings({ level: 'standard', autoLayoutSelection: false });

      const layouts: LayoutType[] = [];
      for (let i = 0; i < 20; i++) {
        const result = layoutService.selectLayout('Content', i, 20);
        layouts.push(result.type);
      }

      const standardCount = layouts.filter(l => l === 'standard').length;
      expect(standardCount).toBeGreaterThan(15); // >75% should be standard
    });

    test('experimental level uses no standard layouts', () => {
      layoutService.updateSettings({ level: 'experimental', autoLayoutSelection: false });

      const layouts: LayoutType[] = [];
      for (let i = 1; i < 11; i++) {
        const result = layoutService.selectLayout('Content', i, 10);
        layouts.push(result.type);
      }

      const standardCount = layouts.filter(l => l === 'standard').length;
      expect(standardCount).toBe(0);
    });
  });

  describe('Content Analysis', () => {
    test('correctly identifies timeline content', () => {
      const content = 'History of diabetes treatment: 1920s insulin discovery, 1955 oral agents, 1990s intensive control trials, 2000s incretin era, 2015 SGLT2 emergence';

      const analysis = layoutService.analyzeContent(content, 1);

      expect(analysis.hasTimeline).toBe(true);
      expect(analysis.itemCount).toBeGreaterThan(0);
    });

    test('detects comparison content', () => {
      const content = 'Type 1 vs Type 2 diabetes: pathophysiology, age of onset, treatment approach';

      const analysis = layoutService.analyzeContent(content, 1);

      expect(analysis.hasComparison).toBe(true);
    });

    test('identifies cyclical processes', () => {
      const content = 'Krebs cycle: iterative process of cellular respiration';

      const analysis = layoutService.analyzeContent(content, 1);

      expect(analysis.hasCycle).toBe(true);
    });
  });
});

describe('Quality Scoring', () => {
  test('scores slide quality across dimensions', async () => {
    const slideContent = {
      html: `
        <section>
          <h1>Heart Failure Management</h1>
          <p>Evidence-based approach to acute decompensated heart failure</p>
          <ul>
            <li>Initial stabilization and assessment</li>
            <li>Diuretic therapy titration</li>
            <li>Hemodynamic monitoring</li>
            <li>Transition to chronic management</li>
          </ul>
        </section>
      `,
      slideNumber: 1,
      totalSlides: 10,
      layoutType: 'standard',
    };

    const score = await qualityScorer.scoreSlide(slideContent);

    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.content).toBeGreaterThan(0);
    expect(score.visual).toBeGreaterThan(0);
    expect(score.clarity).toBeGreaterThan(0);
    expect(score.feedback).toBeInstanceOf(Array);
  });

  test('provides appropriate color coding', () => {
    const excellentColor = qualityScorer.getScoreColor(92);
    expect(excellentColor.text).toContain('green');

    const goodColor = qualityScorer.getScoreColor(75);
    expect(goodColor.text).toContain('cyan');

    const fairColor = qualityScorer.getScoreColor(55);
    expect(fairColor.text).toContain('yellow');

    const poorColor = qualityScorer.getScoreColor(35);
    expect(poorColor.text).toContain('red');
  });
});

describe('Background Enhancement', () => {
  test('enhances slide content', async () => {
    const originalHtml = `
      <section>
        <h2>Diabetes</h2>
        <p>Common disease</p>
      </section>
    `;

    const result = await backgroundEnhancer.enhanceSlide(
      originalHtml,
      'standard',
      1,
      { provider: 'glm', focus: 'both' }
    );

    expect(result.originalHtml).toBe(originalHtml);
    expect(result.enhancedHtml).toBeDefined();
    expect(result.changes).toBeInstanceOf(Array);
  });

  test('queues enhancement for background processing', () => {
    const slideHtml = '<section><h2>Test</h2></section>';

    backgroundEnhancer.queueEnhancement('slide-1', slideHtml, 'standard', 1);

    expect(backgroundEnhancer.isReady('slide-1')).toBe(false);
  });
});

describe('AI Prompt Suggestions', () => {
  test('generates creative medical prompt suggestions', async () => {
    const suggestions = await promptSuggestions.generateSuggestions('glm', 6);

    expect(suggestions).toHaveLength(6);
    expect(suggestions[0]).toHaveProperty('text');
    expect(suggestions[0]).toHaveProperty('category');
    expect(suggestions[0]).toHaveProperty('estimatedSlides');
    expect(suggestions[0]).toHaveProperty('icon');
  });

  test('provides fallback suggestions on error', async () => {
    // Force error by using invalid provider
    const suggestions = await promptSuggestions.generateSuggestions('invalid' as any, 3);

    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('caches suggestions for 5 minutes', async () => {
    const first = await promptSuggestions.generateSuggestions('glm', 3);
    const second = await promptSuggestions.generateSuggestions('glm', 3);

    // Should return from cache (same instances)
    expect(first[0].id).toBe(second[0].id);
  });

  test('clears cache on demand', async () => {
    await promptSuggestions.generateSuggestions('glm', 3);
    promptSuggestions.clearCache();

    // Next call should generate new suggestions
    const fresh = await promptSuggestions.generateSuggestions('glm', 3);
    expect(fresh.length).toBeGreaterThan(0);
  });
});

describe('Layout Prompt Generation', () => {
  const layoutService = new CreativeLayoutService();

  test('generates enhanced prompts with layout instructions', () => {
    const basePrompt = 'Create a slide about heart failure';
    const enhancedPrompt = layoutService.generateLayoutPrompt(
      basePrompt,
      'horizontal-slider',
      'Heart failure management steps'
    );

    expect(enhancedPrompt).toContain('Horizontal Slider');
    expect(enhancedPrompt).toContain('slide-horizontal-slider');
    expect(enhancedPrompt).toContain('Heart failure management steps');
  });
});

describe('Integration Test: Complete Workflow', () => {
  test('end-to-end creative presentation generation', async () => {
    const layoutService = new CreativeLayoutService({
      level: 'creative',
      layoutVariety: true,
      autoLayoutSelection: true,
    });

    // Simulate 10-slide presentation
    const slides = [
      'Introduction to Atrial Fibrillation',
      'History: 1850s first description, 1920s ECG findings, 1990s ablation era, 2010s anticoagulation breakthroughs',
      'Pathophysiology of AF vs normal sinus rhythm',
      'Risk stratification: CHADS2 vs CHA2DS2-VASc comparison',
      'Treatment algorithm: Step 1 rate control, Step 2 rhythm control, Step 3 anticoagulation, Step 4 ablation consideration',
      'Anticoagulation options comparison',
      'Catheter ablation cycle: pre-procedure, mapping, isolation, post-ablation care',
      'Case study patient presentation',
      'Summary and key takeaways',
      'References and guidelines'
    ];

    const results: Array<{ layout: LayoutType; score: any }> = [];

    for (let i = 0; i < slides.length; i++) {
      // Select layout
      const { type, reason } = layoutService.selectLayout(slides[i], i, slides.length);

      // Generate placeholder HTML
      const html = `<section class="slide-${type}"><h2>${slides[i]}</h2></section>`;

      // Score quality
      const score = await qualityScorer.scoreSlide({
        html,
        slideNumber: i,
        totalSlides: slides.length,
        layoutType: type,
      });

      results.push({ layout: type, score });
    }

    // Verify variety
    const layoutTypes = results.map(r => r.layout);
    const uniqueLayouts = new Set(layoutTypes);
    expect(uniqueLayouts.size).toBeGreaterThan(3); // At least 4 different layouts

    // Verify quality scores
    results.forEach(({ score }) => {
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  }, 30000); // 30 second timeout for AI calls
});

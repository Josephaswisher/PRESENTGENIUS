/**
 * Mini-Games Test Suite
 * Tests for medical mini-game templates and injection system
 */

import { describe, it, expect } from 'vitest';
import { MINI_GAMES, MINI_GAMES_TEMPLATE } from '../templates/mini-games';
import {
  detectMiniGameOpportunities,
  injectMiniGames,
  validateMiniGameHtml,
  extractMedicalContent
} from '../services/mini-game-injector';

describe('Mini-Game Templates', () => {
  it('should export all three game types', () => {
    expect(MINI_GAMES.ORGAN_PLACEMENT).toBeDefined();
    expect(MINI_GAMES.SYMPTOM_MATCHING).toBeDefined();
    expect(MINI_GAMES.DRUG_MECHANISM).toBeDefined();
  });

  it('should have proper HTML structure in organ placement game', () => {
    const html = MINI_GAMES.ORGAN_PLACEMENT;
    expect(html).toContain('draggable="true"');
    expect(html).toContain('ondragstart');
    expect(html).toContain('ondrop');
    expect(html).toContain('ondragover');
    expect(html).toContain('Heart');
    expect(html).toContain('Lungs');
    expect(html).toContain('Liver');
  });

  it('should have score tracking in all games', () => {
    expect(MINI_GAMES.ORGAN_PLACEMENT).toContain('Score:');
    expect(MINI_GAMES.SYMPTOM_MATCHING).toContain('Score:');
    expect(MINI_GAMES.DRUG_MECHANISM).toContain('Score:');
  });

  it('should have confetti celebration in all games', () => {
    expect(MINI_GAMES.ORGAN_PLACEMENT).toContain('confetti');
    expect(MINI_GAMES.SYMPTOM_MATCHING).toContain('confetti');
    expect(MINI_GAMES.DRUG_MECHANISM).toContain('confetti');
  });

  it('should have inline JavaScript in all games', () => {
    expect(MINI_GAMES.ORGAN_PLACEMENT).toContain('<script>');
    expect(MINI_GAMES.SYMPTOM_MATCHING).toContain('<script>');
    expect(MINI_GAMES.DRUG_MECHANISM).toContain('<script>');
  });

  it('should have completion modals in all games', () => {
    expect(MINI_GAMES.ORGAN_PLACEMENT).toContain('complete-modal');
    expect(MINI_GAMES.SYMPTOM_MATCHING).toContain('complete-modal');
    expect(MINI_GAMES.DRUG_MECHANISM).toContain('complete-modal');
  });
});

describe('Mini-Game Detection', () => {
  it('should detect organ placement opportunity from anatomy content', () => {
    const html = `
      <h1>Cardiovascular Anatomy</h1>
      <p>The heart pumps blood through the body. The lungs provide oxygen exchange.</p>
      <p>The liver is located in the right upper quadrant.</p>
    `;
    const results = detectMiniGameOpportunities(html);
    const organGame = results.find(r => r.gameType === 'organ-placement');
    expect(organGame).toBeDefined();
    expect(organGame?.shouldInject).toBe(true);
    expect(organGame?.confidence).toBeGreaterThan(0);
  });

  it('should detect symptom matching opportunity from clinical content', () => {
    const html = `
      <h1>Myocardial Infarction</h1>
      <p>Patient presents with crushing chest pain and diaphoresis.</p>
      <p>Clinical diagnosis requires ECG and cardiac biomarkers.</p>
      <p>Differential diagnosis includes angina and pericarditis.</p>
    `;
    const results = detectMiniGameOpportunities(html);
    const symptomGame = results.find(r => r.gameType === 'symptom-matching');
    expect(symptomGame).toBeDefined();
    expect(symptomGame?.shouldInject).toBe(true);
  });

  it('should detect drug mechanism opportunity from pharmacology content', () => {
    const html = `
      <h1>Antihypertensive Medications</h1>
      <p>Lisinopril is an ACE inhibitor that blocks angiotensin conversion.</p>
      <p>The mechanism of action involves reducing peripheral resistance.</p>
      <p>Common side effects include dry cough due to bradykinin accumulation.</p>
    `;
    const results = detectMiniGameOpportunities(html);
    const drugGame = results.find(r => r.gameType === 'drug-mechanism');
    expect(drugGame).toBeDefined();
    expect(drugGame?.shouldInject).toBe(true);
  });

  it('should not detect games in non-medical content', () => {
    const html = `
      <h1>Introduction to Programming</h1>
      <p>JavaScript is a versatile programming language.</p>
      <p>Functions are first-class citizens in JavaScript.</p>
    `;
    const results = detectMiniGameOpportunities(html);
    expect(results.length).toBe(0);
  });

  it('should calculate confidence scores correctly', () => {
    const html = `
      <h1>Complete Anatomy Review</h1>
      <p>Heart, lungs, liver, kidney, stomach, brain, pancreas anatomy.</p>
      <p>Cardiovascular system includes the heart and blood vessels.</p>
      <p>Respiratory physiology involves the lungs and diaphragm.</p>
      <p>Digestive organs include liver, stomach, and intestines.</p>
    `;
    const results = detectMiniGameOpportunities(html);
    const organGame = results.find(r => r.gameType === 'organ-placement');
    expect(organGame?.confidence).toBeGreaterThan(0.5); // High confidence
  });
});

describe('Mini-Game Injection', () => {
  it('should inject games into HTML content', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Anatomy Lesson</h1>
          <p>The heart pumps blood. The lungs exchange oxygen.</p>
        </body>
      </html>
    `;
    const injected = injectMiniGames(html, { autoDetect: true });
    expect(injected).toContain('INTERACTIVE MINI-GAMES');
    expect(injected.length).toBeGreaterThan(html.length);
  });

  it('should inject specific games when requested', () => {
    const html = `<!DOCTYPE html><html><body><p>Test</p></body></html>`;
    const injected = injectMiniGames(html, {
      autoDetect: false,
      specificGames: ['organ-placement', 'drug-mechanism']
    });
    expect(injected).toContain('Organ Placement Challenge');
    expect(injected).toContain('Drug Mechanism Challenge');
  });

  it('should preserve original HTML when injecting games', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Original Content</h1>
          <p>This should be preserved.</p>
        </body>
      </html>
    `;
    const injected = injectMiniGames(html, { specificGames: ['symptom-matching'] });
    expect(injected).toContain('Original Content');
    expect(injected).toContain('This should be preserved');
  });

  it('should not inject games when none are detected', () => {
    const html = `<!DOCTYPE html><html><body><p>Generic content</p></body></html>`;
    const injected = injectMiniGames(html, { autoDetect: true });
    expect(injected).toBe(html); // Should be unchanged
  });
});

describe('Mini-Game Validation', () => {
  it('should validate correct organ placement game HTML', () => {
    const result = validateMiniGameHtml(MINI_GAMES.ORGAN_PLACEMENT);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate correct symptom matching game HTML', () => {
    const result = validateMiniGameHtml(MINI_GAMES.SYMPTOM_MATCHING);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate correct drug mechanism game HTML', () => {
    const result = validateMiniGameHtml(MINI_GAMES.DRUG_MECHANISM);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing drag-drop attributes', () => {
    const invalidHtml = `<div><p>No drag and drop here</p></div>`;
    const result = validateMiniGameHtml(invalidHtml);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect missing JavaScript', () => {
    const invalidHtml = `
      <div draggable="true" ondragstart="test" ondrop="test" ondragover="test">
        <p>Has attributes but no script</p>
      </div>
    `;
    const result = validateMiniGameHtml(invalidHtml);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing inline JavaScript - mini-game will not be functional');
  });

  it('should provide warnings for missing visual feedback', () => {
    const htmlWithoutFeedback = `
      <script>
        function test() {}
      </script>
      <div draggable="true" ondragstart="test" ondrop="test" ondragover="test">
        <p>Game without visual feedback</p>
      </div>
    `;
    const result = validateMiniGameHtml(htmlWithoutFeedback);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('Medical Content Extraction', () => {
  it('should extract organ mentions from anatomy content', () => {
    const html = `<p>The heart, lungs, and liver are vital organs.</p>`;
    const content = extractMedicalContent(html, 'organ-placement');
    expect(content.type).toBe('organ-placement');
    expect(content.organs.heart).toBe(true);
    expect(content.organs.lungs).toBe(true);
    expect(content.organs.liver).toBe(true);
  });

  it('should return correct content type for each game', () => {
    const html = `<p>Test content</p>`;
    expect(extractMedicalContent(html, 'organ-placement').type).toBe('organ-placement');
    expect(extractMedicalContent(html, 'symptom-matching').type).toBe('symptom-matching');
    expect(extractMedicalContent(html, 'drug-mechanism').type).toBe('drug-mechanism');
  });
});

describe('Template Metadata', () => {
  it('should have correct template metadata', () => {
    expect(MINI_GAMES_TEMPLATE.meta.id).toBe('mini-games');
    expect(MINI_GAMES_TEMPLATE.meta.category).toBe('gamification');
    expect(MINI_GAMES_TEMPLATE.meta.icon).toBe('🎮');
  });

  it('should support appropriate learner levels', () => {
    const levels = MINI_GAMES_TEMPLATE.meta.learnerLevels;
    expect(levels).toContain('medical-student');
    expect(levels).toContain('resident');
    expect(levels).toContain('continuing-education');
  });

  it('should have appropriate tags', () => {
    const tags = MINI_GAMES_TEMPLATE.meta.tags || [];
    expect(tags).toContain('interactive');
    expect(tags).toContain('drag-drop');
    expect(tags).toContain('gamification');
  });

  it('should have prompt augmentation', () => {
    expect(MINI_GAMES_TEMPLATE.promptAugment).toBeDefined();
    expect(MINI_GAMES_TEMPLATE.promptAugment.length).toBeGreaterThan(100);
    expect(MINI_GAMES_TEMPLATE.promptAugment).toContain('drag-and-drop');
  });
});

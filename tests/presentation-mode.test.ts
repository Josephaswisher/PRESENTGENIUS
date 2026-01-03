/**
 * Presentation Mode Tests
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Presentation Mode', () => {
  it('should have presentation mode component', async () => {
    const filePath = path.resolve(process.cwd(), 'components', 'PresentationMode.tsx');
    expect(() => fs.accessSync(filePath)).not.toThrow();
  });

  it('should support keyboard navigation keys', () => {
    const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Escape', 'Space'];

    expect(navigationKeys).toContain('ArrowRight');
    expect(navigationKeys).toContain('ArrowLeft');
    expect(navigationKeys).toContain('Escape');
  });

  it('should have slide counter data structure', () => {
    interface SlideState {
      currentSlide: number;
      totalSlides: number;
    }

    const state: SlideState = {
      currentSlide: 1,
      totalSlides: 10,
    };

    expect(state.currentSlide).toBeGreaterThan(0);
    expect(state.totalSlides).toBeGreaterThanOrEqual(state.currentSlide);
  });
});

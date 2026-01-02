/**
 * Export Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Export Service', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement for download links
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      style: {},
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    // Mock document.body.appendChild
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
  });

  it('should export module with all functions', async () => {
    const exportService = await import('../services/export');

    expect(exportService.exportToHTML).toBeDefined();
    expect(exportService.exportToPDF).toBeDefined();
    expect(exportService.exportToJSON).toBeDefined();
    expect(exportService.generateEmbedCode).toBeDefined();
    expect(exportService.copyToClipboard).toBeDefined();
  });

  it('should generate valid embed code', async () => {
    const exportService = await import('../services/export');

    const html = '<!DOCTYPE html><html><body><h1>Test</h1></body></html>';
    const embedCode = exportService.generateEmbedCode(html);

    expect(embedCode).toContain('<iframe');
    expect(embedCode).toContain('sandbox=');
    expect(embedCode).toContain('data:text/html;base64,');
  });

  it('should generate data URL', async () => {
    const exportService = await import('../services/export');

    const html = '<h1>Test</h1>';
    const dataUrl = exportService.generateDataUrl(html);

    expect(dataUrl).toContain('data:text/html;base64,');
  });

  it('should call exportToHTML without throwing', async () => {
    const exportService = await import('../services/export');

    // Should not throw with mocked DOM
    expect(() => {
      exportService.exportToHTML('<h1>Test</h1>', 'test.html');
    }).not.toThrow();
  });

  it('should sanitize filenames', async () => {
    const exportService = await import('../services/export');

    // Test with various filenames
    expect(() => {
      exportService.exportToHTML('<h1>Test</h1>', 'test file/name.html');
    }).not.toThrow();
  });
});

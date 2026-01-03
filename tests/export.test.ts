/**
 * Export Service Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock html2canvas and jsPDF before importing the module
const mockCanvas = {
  width: 1200,
  height: 800,
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  toBlob: vi.fn((cb: any) => cb(new Blob(['png']))),
};

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve(mockCanvas as unknown as HTMLCanvasElement)),
}));

const saveFn = vi.fn();
vi.mock('jspdf', () => {
  class MockPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
    addImage = vi.fn();
    addPage = vi.fn();
    save = saveFn;
  }
  return { jsPDF: MockPDF };
});

describe('Export Service', () => {
  let mockLink: any;

  beforeEach(() => {
    saveFn.mockClear();
    mockCanvas.toDataURL.mockClear();
    mockCanvas.toBlob.mockClear();

    // Mock URL functions
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      style: {},
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockLink as any;
      if (tag === 'canvas') {
        return {
          toDataURL: () => 'data:image/png;base64,mock',
          toBlob: (cb: any) => cb(new Blob(['png'])),
          getContext: () => ({})
        } as any;
      }
      return (document as any).__proto__.createElement.call(document, tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    // Clipboard mocks
    (global as any).navigator.clipboard = {
      writeText: vi.fn(() => Promise.resolve()),
    };
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => true),
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Exports', () => {
    it('exports required functions', async () => {
      const exportService = await import('../services/export');
      expect(exportService.exportToHTML).toBeDefined();
      expect(exportService.exportToPDF).toBeDefined();
      expect(exportService.exportToPNG).toBeDefined();
      expect(exportService.exportToJSON).toBeDefined();
      expect(exportService.generateEmbedCode).toBeDefined();
      expect(exportService.generateDataUrl).toBeDefined();
      expect(exportService.copyToClipboard).toBeDefined();
      expect(exportService.checkExportSupport).toBeDefined();
    });
  });

  describe('HTML Export', () => {
    it('exports HTML with .html filename', async () => {
      const { exportToHTML } = await import('../services/export');
      exportToHTML('<h1>Test</h1>', 'test file/name!@#.html');
      expect(mockLink.download).toContain('.html');
      expect(mockLink.download).toMatch(/test_file_name/);
    });

    it('cleans up resources', async () => {
      const { exportToHTML } = await import('../services/export');
      exportToHTML('<h1>Test</h1>', 'test');
      await new Promise((r) => setTimeout(r, 150));
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('PDF Export', () => {
    it('generates PDF via jsPDF and reports success', async () => {
      const { exportToPDF } = await import('../services/export');
      const progress: any[] = [];
      await exportToPDF('<h1>Test</h1>', 'test', (p) => progress.push(p));
      expect(saveFn).toHaveBeenCalled();
      expect(progress.some((p) => p.status === 'success')).toBe(true);
    });
  });

  describe('PNG Export', () => {
    it('generates PNG via canvas toBlob', async () => {
      const { exportToPNG } = await import('../services/export');
      const progress: any[] = [];
      await exportToPNG('<h1>Test</h1>', 'test', (p) => progress.push(p));
      expect(mockCanvas.toBlob).toHaveBeenCalled();
      expect(progress.some((p) => p.status === 'success')).toBe(true);
    });
  });

  describe('JSON Export', () => {
    it('exports JSON with metadata', async () => {
      const { exportToJSON } = await import('../services/export');
      exportToJSON('<h1>Test</h1>', 'test', undefined, 'test-id');
      expect(mockLink.download).toContain('_artifact.json');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Clipboard Operations', () => {
    it('uses Clipboard API when available', async () => {
      const { copyToClipboard } = await import('../services/export');
      const result = await copyToClipboard('<h1>Test</h1>');
      expect(navigator.clipboard!.writeText).toHaveBeenCalledWith('<h1>Test</h1>');
      expect(result).toBe(true);
    });

    it('falls back to execCommand when Clipboard API missing', async () => {
      const { copyToClipboard } = await import('../services/export');
      (global as any).navigator.clipboard = undefined;
      const result = await copyToClipboard('<h1>Test</h1>');
      expect((document as any).execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });
  });

  describe('Embed/Data URLs', () => {
    it('generates embed code', async () => {
      const { generateEmbedCode } = await import('../services/export');
      const embed = generateEmbedCode('<h1>Test</h1>', '800px', '600px');
      expect(embed).toContain('iframe');
      expect(embed).toContain('data:text/html;base64');
      expect(embed).toContain('width="800px"');
      expect(embed).toContain('height="600px"');
    });

    it('generates data URL', async () => {
      const { generateDataUrl } = await import('../services/export');
      const url = generateDataUrl('<h1>Test</h1>');
      expect(url.startsWith('data:text/html;base64,')).toBe(true);
    });
  });

  describe('Support Detection', () => {
    it('detects export support', async () => {
      const { checkExportSupport } = await import('../services/export');
      const support = checkExportSupport();
      expect(support.html).toBe(true);
      expect(support.pdf).toBe(true);
      expect(support.png).toBe(true);
      expect(support.clipboard).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('throws when Blob creation fails', async () => {
      const { exportToHTML } = await import('../services/export');
      const original = global.Blob;
      class FailingBlob {
        constructor(..._args: any[]) {
          throw new Error('fail');
        }
      }
      // @ts-ignore
      global.Blob = FailingBlob as any;
      expect(() => exportToHTML('<h1>Test</h1>', 'test')).toThrow();
      // @ts-ignore
      global.Blob = original as any;
    });
  });
});

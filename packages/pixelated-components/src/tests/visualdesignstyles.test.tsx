import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../test/test-utils';
import { VisualDesignStyles } from '../components/foundation/visualdesignstyles';

const mockGetFullPixelatedConfig = vi.fn();
vi.mock('../components/config/config', () => ({
  getFullPixelatedConfig: () => mockGetFullPixelatedConfig(),
}));

// Helper to build valid VisualDesignType fixtures for tests
const makeToken = (value: string) => ({ value: String(value), type: 'string', group: 'test', label: 'test' });
const defaultVisualDesign = {
  'primary-color': makeToken('#007bff'),
  'font-size1-min': makeToken('2.00rem')
}; // fallback to generated tokens for very specific unit tests

const buildVisualDesign = (overrides: Record<string, any> = {}, extras: Record<string, any> = {}) => ({ ...defaultVisualDesign, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, typeof v === 'string' ? makeToken(v) : v])), ...extras });

const setVisualDesignConfig = (visualdesign: Record<string, any>) => {
  mockGetFullPixelatedConfig.mockReturnValue({ visualdesign });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConfigEngine Components', () => {
  describe('VisualDesignStyles Component', () => {
    it('should render CSS custom properties from flat tokens', () => {
      const tokens = buildVisualDesign({ 'primary-color': '#007bff' });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--primary-color: #007bff;');
    });

    it('should build font stacks from 3-field structure', () => {
      const tokens = buildVisualDesign({}, {
        'header-font-primary': 'Montserrat',
        'header-font-fallback': 'Arial',
        'header-font-generic': 'sans-serif',
        'body-font-primary': 'Open Sans',
        'body-font-fallback': 'Helvetica',
        'body-font-generic': 'sans-serif'
      });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--header-font-family: "Montserrat", "Arial", "sans-serif";');
      expect(styleElement?.textContent).toContain('--body-font-family: "Open Sans", "Helvetica", "sans-serif";');
    });

    it('should handle missing font fields gracefully', () => {
      const tokens = buildVisualDesign({}, {
        'header-font-primary': 'Montserrat',
        'header-font-generic': 'sans-serif',
        'body-font-fallback': 'Helvetica'
      });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--header-font-family: "Montserrat", "sans-serif";');
      // body-font-fallback alone doesn't create a font family since there's no primary
      expect(styleElement?.textContent).not.toContain('--body-font-family');
    });

    it('should include responsive font sizing when font min/max values exist', () => {
      const tokens = buildVisualDesign({
        'font-size1-min': '14px',
        'font-size1-max': '18px',
        'font-size2-min': '16px',
        'font-size2-max': '20px',
        'font-min-screen': '320px',
        'font-max-screen': '1200px'
      });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--font-size1: clamp(var(--font-size1-min), calc(var(--font-size1-min) + ((var(--font-size1-max) - var(--font-size1-min)) * ((100vw - var(--font-min-screen)) / (var(--font-max-screen) - var(--font-min-screen))))), var(--font-size1-max));');
      expect(styleElement?.textContent).toContain('h1 { font-size: var(--font-size1); }');
    });

    it('should handle empty tokens', () => {
      const tokens = buildVisualDesign();
      setVisualDesignConfig(tokens);
      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain(':root {');
      expect(styleElement?.textContent).toContain('}');
    });

    it('should resolve object values with value property', () => {
      const tokens = buildVisualDesign({ 'primary-color': '#007bff' }, { 'font-size-base': { value: '16px' } });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--primary-color: #007bff;');
      expect(styleElement?.textContent).toContain('--font-size-base: 16px;');
    });

    it('should handle old 2-field font format', () => {
      const tokens = buildVisualDesign({ 'header-font': '"Playfair Display", serif', 'body-font': '"Lato", sans-serif' });
      setVisualDesignConfig(tokens);

      const { container } = render(<VisualDesignStyles />);
      const styleElement = container.querySelector('style');

      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('--header-font: "Playfair Display", serif;');
      expect(styleElement?.textContent).toContain('--body-font: "Lato", sans-serif;');
    });

	it('should return null when visualdesign is missing', () => {
		mockGetFullPixelatedConfig.mockReturnValue({} as any);

		const { container } = render(<VisualDesignStyles />);
		expect(container.firstChild).toBeNull();
	});
  });
});

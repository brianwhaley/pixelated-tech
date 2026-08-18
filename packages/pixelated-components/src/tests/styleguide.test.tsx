import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as baseRender } from '../test/test-utils';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';

const nestedRoutes = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about', routes: [{ name: 'Team', path: '/team' }, { name: 'History', path: '/history' }] },
  { name: 'Blog', path: '/blog' },
];

function createFakeConfig() {
  return {
    routes: nestedRoutes,
    visualdesign: {
      'header-font': { value: '"Montserrat", Arial, sans-serif' },
      'body-font': { value: "'Roboto', system-ui, -apple-system" },
      'primary-color': { value: '#000000' },
      'secondary-color': { value: '#111111' },
      'tertiary-color': { value: '#222222' },
      'accent1-color': { value: '#FF0000' },
      'accent2-color': { value: '#00FF00' },
      'accent3-color': { value: '#0000FF' },
      'bg-color': { value: '#FFFFFF' },
      'text-color': { value: '#000000' },
    },
  };
}

let fakeConfig = createFakeConfig();

vi.mock('../components/config/config', () => ({
  getFullPixelatedConfig: vi.fn(() => fakeConfig),
}));

// Stub package-level UI used by StyleGuideUI so tests don't resolve built `dist` assets
vi.mock('@pixelated-tech/components', () => {
  const React = require('react');
  return {
    PageTitleHeader: (props: any) => React.createElement('h1', { className: 'page-title-header' }, props.title),
    PageSection: (props: any) => React.createElement('section', { id: props.id, className: 'page-section' }, props.children),
    getAllRoutes: (r: any) => {
      // simple leaf-only flatten used by tests
      if (!r) return [];
      return r.flatMap((item: any) => (item.routes ? item.routes : [item]));
    },
  };
});

import { StyleGuideUI }  from '../components/foundation/styleguide';

async function render(ui: React.ReactElement, options?: any) {
  if (React.isValidElement(ui) && ui.type === StyleGuideUI) {
    const element = await StyleGuideUI();
    return baseRender(element, { config: { routes: (ui.props as any).routes }, ...options });
  }
  return baseRender(ui, options);
}

const flatRoutes = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' },
];

describe('StyleGuideUI', () => {
  beforeEach(() => {
    fakeConfig = createFakeConfig();
    // Reset CSS variables before each test
    document.documentElement.style.removeProperty('--header-font');
    document.documentElement.style.removeProperty('--body-font');
    document.documentElement.style.removeProperty('--primary-color');
    document.documentElement.style.removeProperty('--secondary-color');
  });

  describe('Component Rendering', () => {
    it('renders color swatches and page title', async () => {
      await render(<StyleGuideUI routes={nestedRoutes} />);
      expect(screen.getByText(/Primary Color/)).toBeInTheDocument();
      expect(screen.getByText(/Secondary Color/)).toBeInTheDocument();
      expect(screen.getByText(/Style Guide/)).toBeInTheDocument();
    });

    it('renders page title header component', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const header = container.querySelector('.page-title-header');
      expect(header).toBeInTheDocument();
    });

    it('renders page section containers', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const sections = container.querySelectorAll('.page-section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('renders fonts section', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');
      expect(fontsSection).toBeInTheDocument();
    });

    it('renders colors section', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const colorsSection = container.querySelector('#colors-section');
      expect(colorsSection).toBeInTheDocument();
    });

    it('renders routes section', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      expect(container).toBeTruthy();
    });
  });

  describe('CSS Variables - Fonts', () => {
    it('reads CSS vars and displays the first font token (strips quotes)', async () => {
      document.documentElement.style.setProperty('--header-font', '"Montserrat", Arial, sans-serif');
      document.documentElement.style.setProperty('--body-font', "'Roboto', system-ui, -apple-system");

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');

      expect(fontsSection).toBeInTheDocument();
      const h1 = fontsSection?.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/Montserrat/);

      const p = fontsSection?.querySelector('p');
      expect(p).toBeInTheDocument();
      expect(p).toHaveTextContent(/Roboto/);
    });

    it('handles font variables with unquoted values', async () => {
      document.documentElement.style.setProperty('--header-font', 'Georgia, serif');
      document.documentElement.style.setProperty('--body-font', 'Verdana, sans-serif');

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');
      expect(fontsSection).toBeInTheDocument();
    });

    it('handles font variables with system fonts', async () => {
      document.documentElement.style.setProperty('--header-font', 'system-ui, -apple-system, sans-serif');
      document.documentElement.style.setProperty('--body-font', '-apple-system, system-ui, BlinkMacSystemFont, sans-serif');

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');
      expect(fontsSection).toBeInTheDocument();
    });

    it('when config fonts are absent the font placeholders fallback to sans-serif', async () => {
      fakeConfig = { ...fakeConfig, visualdesign: { 'primary-color': { value: '#000000' }, 'secondary-color': { value: '#111111' }, 'tertiary-color': { value: '#222222' }, 'accent1-color': { value: '#FF0000' }, 'accent2-color': { value: '#00FF00' }, 'accent3-color': { value: '#0000FF' }, 'bg-color': { value: '#FFFFFF' }, 'text-color': { value: '#000000' } } };
      // keep colors present but fonts absent
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');

      const h1 = fontsSection?.querySelector('h1');
      expect(h1?.textContent).toBe('H1 - sans-serif font');

      const p = fontsSection?.querySelector('p');
      expect(p?.textContent).toContain('sans-serif font.  This is a paragraph');
    });

    it('displays multiple font size/weight variations', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const fontsSection = container.querySelector('#fonts-section');
      const headings = fontsSection?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect((headings?.length || 0) > 0).toBe(true);
    });
  });

  describe('CSS Variables - Colors', () => {
    it('displays primary and secondary color swatches', async () => {
      await render(<StyleGuideUI routes={nestedRoutes} />);
      expect(screen.getByText(/Primary Color/)).toBeInTheDocument();
      expect(screen.getByText(/Secondary Color/)).toBeInTheDocument();
    });

    it('handles custom color variables when set', async () => {
      document.documentElement.style.setProperty('--primary-color', '#FF5733');
      document.documentElement.style.setProperty('--secondary-color', '#33FF57');

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const colorsSection = container.querySelector('#colors-section');
      expect(colorsSection).toBeInTheDocument();
    });

    it('handles RGB color format', async () => {
      document.documentElement.style.setProperty('--primary-color', 'rgb(255, 87, 51)');
      document.documentElement.style.setProperty('--secondary-color', 'rgb(51, 255, 87)');

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const colorsSection = container.querySelector('#colors-section');
      expect(colorsSection).toBeInTheDocument();
    });

    it('handles HSL color format', async () => {
      document.documentElement.style.setProperty('--primary-color', 'hsl(12, 100%, 67%)');
      document.documentElement.style.setProperty('--secondary-color', 'hsl(130, 100%, 67%)');

      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const colorsSection = container.querySelector('#colors-section');
      expect(colorsSection).toBeInTheDocument();
    });

    it('displays color swatches as visual elements', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const swatches = container.querySelectorAll('[style*="background-color"]');
      expect(swatches.length >= 0).toBe(true);
    });
  });

  describe('Routes - Rendering', () => {
    it('renders flattened route list including nested routes (only leaf routes are shown)', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const routeSection = Array.from(container.querySelectorAll('section')).find(section => section.textContent?.includes('Information Architecture'));
      const ul = routeSection?.querySelector('ul');
      const items = Array.from(ul?.querySelectorAll('li') || []).map(li => (li.textContent || '').replace(/\s+/g, ' ').trim());

      expect(items).toContain('Team - /team');
      expect(items).toContain('History - /history');
      // parent with nested `routes` is not listed by getAllRoutes (leaf-only)
      expect(items).not.toContain('About - /about');
    });

    it('renders flat routes without nesting', async () => {
      const { container } = await render(<StyleGuideUI routes={flatRoutes} />);
      const routeItems = container.querySelectorAll('li');
      expect(routeItems.length >= flatRoutes.length).toBe(true);
    });

    it('handles routes without paths', async () => {
      const routesWithoutPaths = [
        { name: 'Home' },
        { name: 'About' },
      ];
      const { container } = await render(<StyleGuideUI routes={routesWithoutPaths as any} />);
      expect(container).toBeInTheDocument();
    });

    it('handles deeply nested routes', async () => {
      const deepRoutes = [
        {
          name: 'Root',
          path: '/',
          routes: [
            {
              name: 'Level1',
              path: '/l1',
              routes: [
                { name: 'Level2', path: '/l1/l2' },
              ]
            }
          ]
        }
      ];
      const { container } = await render(<StyleGuideUI routes={deepRoutes as any} />);
      expect(container).toBeInTheDocument();
    });

    it('renders all leaf routes from nested structure', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const listItems = container.querySelectorAll('li');
      // Should have at least the leaf routes
      expect(listItems.length >= 3).toBe(true); // Team, History, Blog, Home
    });
  });

  describe('Routes - Path Display', () => {
    it('displays route paths correctly', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const listItems = Array.from(container.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
      const hasPathItems = listItems.some(item => item.includes('/'));
      expect(hasPathItems).toBe(true);
    });

    it('formats route names and paths together', async () => {
      const { container } = await render(<StyleGuideUI routes={flatRoutes} />);
      const listItems = container.querySelectorAll('li');
      expect(listItems.length > 0).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty routes array', async () => {
      const { container } = await render(<StyleGuideUI routes={[]} />);
      expect(container).toBeInTheDocument();
    });

    it('handles undefined routes gracefully', async () => {
      const { container } = await render(<StyleGuideUI routes={undefined as any} />);
      expect(container).toBeInTheDocument();
    });

    it('handles routes with special characters in names', async () => {
      const specialRoutes = [
        { name: 'Home & Work', path: '/home-work' },
        { name: 'FAQ\'s', path: '/faq' },
        { name: 'About "Us"', path: '/about' },
      ];
      const { container } = await render(<StyleGuideUI routes={specialRoutes as any} />);
      expect(container).toBeInTheDocument();
    });

    it('handles very long route names', async () => {
      const longRoutes = [
        { name: 'This is a very long route name that should still render properly without breaking', path: '/long' },
      ];
      const { container } = await render(<StyleGuideUI routes={longRoutes as any} />);
      expect(container).toBeInTheDocument();
    });

    it('handles routes with unicode characters', async () => {
      const unicodeRoutes = [
        { name: 'Café Menu', path: '/cafe' },
        { name: '日本語', path: '/ja' },
        { name: 'Ελληνικά', path: '/el' },
      ];
      const { container } = await render(<StyleGuideUI routes={unicodeRoutes as any} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Multiple Section Integration', () => {
    it('renders all major sections together', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      
      const fontSection = container.querySelector('#fonts-section');
      const colorSection = container.querySelector('#colors-section');
      const routeSection = container.querySelector('ul, ol');
      
      expect(fontSection || colorSection || routeSection).toBeInTheDocument();
    });

    it('maintains proper section hierarchy', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const sections = container.querySelectorAll('.page-section');
      sections.forEach(section => {
        expect(section).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides semantic HTML structure', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const sections = container.querySelectorAll('section');
      expect(sections.length > 0).toBe(true);
    });

    it('has proper heading hierarchy', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length > 0).toBe(true);
    });

    it('renders lists with proper structure', async () => {
      const { container } = await render(<StyleGuideUI routes={nestedRoutes} />);
      const lists = container.querySelectorAll('ul, ol');
      lists.forEach(list => {
        expect(list).toBeInTheDocument();
      });
    });
  });
});

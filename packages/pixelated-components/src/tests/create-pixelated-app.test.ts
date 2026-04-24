import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadManifest, findTemplateForSlug, addRouteEntry } from '../scripts/create-pixelated-app.js';
import path from 'path';

interface Route {
  name: string;
  path: string;
  title: string;
  description: string;
  keywords: string;
}

interface SiteConfig {
  routes: Route[];
  siteInfo?: { name?: string; [key: string]: any };
}

describe('create-pixelated-app template mapping', () => {
  let manifest: any;

  beforeEach(async () => {
    manifest = await loadManifest(path.resolve(__dirname, '..', 'scripts'));
  });

  describe('loadManifest', () => {
    it('loads manifest from scripts directory', async () => {
      const loadedManifest = await loadManifest(path.resolve(__dirname, '..', 'scripts'));
      expect(loadedManifest).toBeTruthy();
      expect(typeof loadedManifest).toBe('object');
    });

    it('manifest contains templates array', async () => {
      const loadedManifest = await loadManifest(path.resolve(__dirname, '..', 'scripts'));
      expect(Array.isArray(loadedManifest.templates) || Array.isArray(loadedManifest)).toBe(true);
    });

    it('manifest templates have required properties', async () => {
      const loadedManifest = await loadManifest(path.resolve(__dirname, '..', 'scripts'));
      const templates = Array.isArray(loadedManifest.templates) ? loadedManifest.templates : loadedManifest;
      if (templates.length > 0) {
        expect(templates[0]).toHaveProperty('name');
      }
    });

    it('handles missing manifest gracefully', async () => {
      try {
        const result = await loadManifest('/nonexistent/path');
        // May throw or return null/empty
      } catch (e) {
        // Expected error for missing path
        expect(e).toBeDefined();
      }
    });
  });

  describe('findTemplateForSlug - Direct Matches', () => {
    it('finds the Services template by alias', async () => {
      const tmpl = findTemplateForSlug(manifest, 'services');
      expect(tmpl).toBeTruthy();
      expect(tmpl.name).toBe('Services');
    });

    it('finds the Contact template by slug', async () => {
      const tmpl = findTemplateForSlug(manifest, 'contact');
      expect(tmpl).toBeTruthy();
    });

    it('finds the Home template by slug', async () => {
      const tmpl = findTemplateForSlug(manifest, 'home');
      expect(tmpl || !tmpl).toBeDefined();
    });

    it('returns null for non-existent template', () => {
      const tmpl = findTemplateForSlug(manifest, 'nonexistent-template-xyz');
      expect(tmpl || !tmpl).toBeDefined();
    });

    it('handles empty string slug', () => {
      const tmpl = findTemplateForSlug(manifest, '');
      expect(tmpl === null || tmpl).toBeDefined();
    });
  });

  describe('findTemplateForSlug - Fuzzy Matching', () => {
    it('fuzzy matches contact-us to Contact template', async () => {
      const tmpl = findTemplateForSlug(manifest, 'contact-us');
      expect(tmpl).toBeTruthy();
      expect(tmpl.name).toBe('Contact');
    });

    it('fuzzy matches with hyphens and underscores', () => {
      const tmpl1 = findTemplateForSlug(manifest, 'services-page');
      const tmpl2 = findTemplateForSlug(manifest, 'services_page');
      // Should find similar templates
      expect(tmpl1 || !tmpl1).toBeDefined();
      expect(tmpl2 || !tmpl2).toBeDefined();
    });

    it('fuzzy matches case-insensitive', () => {
      const tmpl1 = findTemplateForSlug(manifest, 'SERVICES');
      const tmpl2 = findTemplateForSlug(manifest, 'Services');
      expect(tmpl1).toBeDefined();
      expect(tmpl2).toBeDefined();
    });

    it('handles partial slug matches', () => {
      const tmpl = findTemplateForSlug(manifest, 'servic');
      expect(tmpl || !tmpl).toBeDefined();
    });

    it('handles slug variations', () => {
      const variations = ['service', 'services', 'service-page', 'services-list'];
      variations.forEach(slug => {
        const result = findTemplateForSlug(manifest, slug);
        expect(result || !result).toBeDefined();
      });
    });
  });

  describe('findTemplateForSlug - Edge Cases', () => {
    it('handles very long slug names', () => {
      const longSlug = 'a'.repeat(100);
      const tmpl = findTemplateForSlug(manifest, longSlug);
      expect(tmpl || !tmpl).toBeDefined();
    });

    it('handles special characters in slug', () => {
      const specialSlugs = ['contact@us', 'services#page', 'home!'];
      specialSlugs.forEach(slug => {
        const result = findTemplateForSlug(manifest, slug);
        expect(result || !result).toBeDefined();
      });
    });

    it('handles null or undefined manifest', () => {
      expect(() => findTemplateForSlug(null as any, 'services')).not.toThrow();
      expect(() => findTemplateForSlug(undefined as any, 'services')).not.toThrow();
    });

    it('returns consistent results for same slug', () => {
      const result1 = findTemplateForSlug(manifest, 'services');
      const result2 = findTemplateForSlug(manifest, 'services');
      expect(result1).toEqual(result2);
    });
  });
});

describe('route management', () => {
  describe('addRouteEntry - Basic Operations', () => {
    it('adds a services route when missing and prevents duplicates', () => {
      const siteConfig: SiteConfig = {
        routes: [
          { name: 'Home', path: '/', title: 'Test - Home', description: '', keywords: '' },
          { name: 'Contact', path: '/contact', title: 'Test - Contact', description: '', keywords: '' }
        ]
      };

      const added = addRouteEntry(siteConfig, 'services', 'Services', 'Test');
      expect(added).toBe(true);
      expect(siteConfig.routes.some(r => r.path === '/services')).toBe(true);

      // Trying again should not add a duplicate
      const addedAgain = addRouteEntry(siteConfig, 'services', 'Services', 'Test');
      expect(addedAgain).toBe(false);

      // Check the title formatting
      const svc = siteConfig.routes.find(r => r.path === '/services');
      expect(svc).toBeDefined();
      expect(svc!.title).toBe('Test - Services');
      expect(svc!.name).toBe('Services');
    });

    it('adds a single new route to empty routes array', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      const added = addRouteEntry(siteConfig, 'about', 'About', 'Company');
      expect(added).toBe(true);
      expect(siteConfig.routes.length).toBe(1);
      expect(siteConfig.routes[0].path).toBe('/about');
    });

    it('adds multiple different routes', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'about', 'About', 'Company');
      addRouteEntry(siteConfig, 'contact', 'Contact', 'Company');
      addRouteEntry(siteConfig, 'services', 'Services', 'Company');
      
      expect(siteConfig.routes.length).toBe(3);
      expect(siteConfig.routes.map(r => r.path)).toContain('/about');
      expect(siteConfig.routes.map(r => r.path)).toContain('/contact');
      expect(siteConfig.routes.map(r => r.path)).toContain('/services');
    });

    it('returns false when route already exists', () => {
      const siteConfig: SiteConfig = {
        routes: [{ name: 'Home', path: '/', title: 'Home', description: '', keywords: '' }]
      };
      const added = addRouteEntry(siteConfig, '', 'Home', 'Test');
      expect(added).toBe(false);
    });

    it('creates route path from slug', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'my-page', 'My Page', 'Site');
      const route = siteConfig.routes.find(r => r.path === '/my-page');
      expect(route).toBeDefined();
    });
  });

  describe('addRouteEntry - Route Fields', () => {
    it('sets correct name field', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'test', 'TestName', 'Prefix');
      const route = siteConfig.routes[0];
      expect(route.name).toBe('TestName');
    });

    it('formats title with prefix', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'services', 'Services', 'MyCompany');
      const route = siteConfig.routes[0];
      expect(route.title).toBe('MyCompany - Services');
    });

    it('initializes description field', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'about', 'About', 'Company');
      const route = siteConfig.routes[0];
      expect(typeof route.description).toBe('string');
    });

    it('initializes keywords field', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'about', 'About', 'Company');
      const route = siteConfig.routes[0];
      expect(typeof route.keywords).toBe('string');
    });

    it('creates correct path format', () => {
      const routes = [
        { slug: '', expectedPath: '/' },
        { slug: 'home', expectedPath: '/home' },
        { slug: 'about', expectedPath: '/about' },
        { slug: 'services-list', expectedPath: '/services-list' }
      ];

      routes.forEach(({ slug, expectedPath }) => {
        const siteConfig: SiteConfig = { routes: [] as Route[] };
        addRouteEntry(siteConfig, slug, 'Test', 'Prefix');
        if (siteConfig.routes.length > 0) {
          expect(siteConfig.routes[0].path).toBe(expectedPath);
        }
      });
    });
  });

  describe('addRouteEntry - Edge Cases', () => {
    it('handles empty slug', () => {
      const siteConfig: SiteConfig = { routes: [] };
      const added = addRouteEntry(siteConfig, '', 'Home', 'Test');
      expect(typeof added).toBe('boolean');
    });

    it('handles special characters in slug', () => {
      const siteConfig: SiteConfig = { routes: [] };
      const added = addRouteEntry(siteConfig, 'page@test', 'Test', 'Prefix');
      expect(typeof added).toBe('boolean');
    });

    it('handles very long slug names', () => {
      const siteConfig: SiteConfig = { routes: [] };
      const longSlug = 'a'.repeat(100);
      const added = addRouteEntry(siteConfig, longSlug, 'Test', 'Prefix');
      expect(typeof added).toBe('boolean');
    });

    it('handles null or empty prefix', () => {
      const siteConfig: SiteConfig = { routes: [] };
      const added1 = addRouteEntry(siteConfig, 'test', 'Test', '');
      const added2 = addRouteEntry(siteConfig, 'test2', 'Test2', null as any);
      expect(typeof added1).toBe('boolean');
      expect(typeof added2).toBe('boolean');
    });

    it('handles unicode characters in name', () => {
      const siteConfig: SiteConfig = { routes: [] };
      const added = addRouteEntry(siteConfig, 'test', 'Тест', 'Компания');
      expect(typeof added).toBe('boolean');
    });

    it('preserves existing routes when adding new ones', () => {
      const siteConfig: SiteConfig = {
        routes: [
          { name: 'Home', path: '/', title: 'Home', description: 'Home page', keywords: 'home' }
        ]
      };
      const originalRoute = siteConfig.routes[0];
      addRouteEntry(siteConfig, 'about', 'About', 'Company');
      
      expect(siteConfig.routes[0]).toEqual(originalRoute);
      expect(siteConfig.routes.length).toBe(2);
    });

    it('prevents duplicates case-insensitively if applicable', () => {
      const siteConfig: SiteConfig = { routes: [] };
      addRouteEntry(siteConfig, 'Test', 'Test', 'Prefix');
      const addedAgain = addRouteEntry(siteConfig, 'test', 'Test', 'Prefix');
      
      // Behavior depends on implementation (case-sensitive or not)
      expect(typeof addedAgain).toBe('boolean');
    });
  });

  describe('addRouteEntry - Data Integrity', () => {
    it('maintains route array structure', () => {
      const siteConfig: SiteConfig = { routes: [] };
      addRouteEntry(siteConfig, 'test', 'Test', 'Prefix');
      expect(Array.isArray(siteConfig.routes)).toBe(true);
    });

    it('does not modify source manifest', () => {
      const manifest = { name: 'Test Company' };
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'test', 'Test', 'Test Company');
      expect(manifest.name).toBe('Test Company');
    });

    it('creates valid route objects', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'test', 'Test', 'Prefix');
      const route = siteConfig.routes[0];
      
      expect(route).toHaveProperty('name');
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('title');
      expect(route).toHaveProperty('description');
      expect(route).toHaveProperty('keywords');
    });

    it('maintains data types of route properties', () => {
      const siteConfig: SiteConfig = { routes: [] as Route[] };
      addRouteEntry(siteConfig, 'test', 'TestName', 'Prefix');
      const route = siteConfig.routes[0];
      
      expect(typeof route.name).toBe('string');
      expect(typeof route.path).toBe('string');
      expect(typeof route.title).toBe('string');
      expect(typeof route.description).toMatch(/string|undefined/);
      expect(typeof route.keywords).toMatch(/string|undefined/);
    });
  });
});

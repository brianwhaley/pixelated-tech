import { describe, it, expect } from 'vitest';
import siteConfig from '@/data/siteconfig.json';
import { flattenRoutes } from '../components/foundation/sitemap';

describe('siteconfig.json — integration smoke', () => {
  it('uses canonical siteInfo from src/data/siteconfig.json', () => {
    expect(siteConfig.siteInfo?.name).toBe('Pixelated Technologies');
  });

  it('exposes visualdesign tokens (primary-color)', () => {
    expect(siteConfig.visualdesign).toBeTruthy();
    const primary = siteConfig.visualdesign?.['primary-color'];
    expect(primary).toBeTruthy();
    expect(primary?.value).toBe('#336699');
  });

  it('flattenRoutes(routes) contains the Buzzword Bingo route', () => {
    const flat = flattenRoutes(siteConfig.routes || []);
    expect(Array.isArray(flat)).toBe(true);
    expect(flat.some((r: any) => String(r.path) === '/buzzwordbingo')).toBe(true);
  });
});

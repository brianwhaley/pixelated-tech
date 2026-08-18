import { describe, it, expect } from 'vitest';
import { pixelatedConfig } from '../test/test-data';
import { getAllRoutes } from '../components/foundation/metadata.functions';

describe('siteconfig.json — integration smoke', () => {
  it('uses canonical siteInfo from src/data/siteconfig.json', () => {
    expect(pixelatedConfig.siteInfo?.name).toBe('Pixelated Technologies');
  });

  it('exposes visualdesign tokens (primary-color)', () => {
    expect(pixelatedConfig.visualdesign).toBeTruthy();
    const primary = pixelatedConfig.visualdesign?.['primary-color'];
    expect(primary).toBeTruthy();
    expect(primary?.value).toBe('#336699');
  });

  it('getAllRoutes(routes, "routes") contains the Buzzword Bingo route', () => {
    const flat = getAllRoutes(pixelatedConfig.routes || [], 'routes');
    expect(Array.isArray(flat)).toBe(true);
    expect(flat.some((r: any) => String(r.path) === '/buzzwordbingo')).toBe(true);
  });
});

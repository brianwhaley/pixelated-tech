import { describe, it, expect, vi } from 'vitest';
import { packageJson } from '../test/test-data';
import { pixelatedComponentsVersion } from '../version';

describe('version export', () => {
  it('matches the package.json version', () => {
    expect(pixelatedComponentsVersion).toBe(packageJson.version);
  });

  it('returns an empty string when package.json version is missing', async () => {
    vi.resetModules();
    vi.doMock('../../package.json', async () => ({ default: { version: undefined } }));

    const mod = await import('../version');
    expect(mod.pixelatedComponentsVersion).toBe('');
  });
});

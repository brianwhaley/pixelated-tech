import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as fs from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  safeJSON,
  generateHumansTxt,
  createWellKnownResponse,
  createTextResponsePayload,
} from '@/components/foundation/well-known';
import { pixelatedComponentsVersion } from '@/version';
import { sanitizeString } from '@/components/foundation/utilities';

import testData from '../test/test-data';

describe('humanstxt (server)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizeString collapses whitespace and trims', () => {
    expect(sanitizeString('  foo   bar \n baz ')).toBe('foo bar baz');
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });

  it('safeJSON returns null on missing/invalid file', async () => {
    // avoid spying on the ESM fs/promises namespace (not configurable in some runners)
    const v = await safeJSON('/no/such/path.json');
    expect(v).toBeNull();
  });

  it('uses the package-exported components version', () => {
    expect(pixelatedComponentsVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+/);
  });

  it('generateHumansTxt reads package.json from provided cwd when pkg is not passed', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelated-humans-txt-'));
    try {
      const pixelatedVersion = pixelatedComponentsVersion;
      await fs.mkdir(path.join(tmpDir, 'node_modules', '@pixelated-tech', 'components'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'test-app', version: '1.0.0' }, null, 2)
      );
      await fs.writeFile(
        path.join(tmpDir, 'node_modules', '@pixelated-tech', 'components', 'package.json'),
        JSON.stringify({ name: '@pixelated-tech/components', version: '3.15.33' }, null, 2)
      );

      const { body } = await generateHumansTxt({
        cwd: tmpDir,
        siteConfig: { siteInfo: { name: 'Temp App' }, routes: [] },
      });

      expect(body).toContain('Site Package Name: test-app');
      expect(body).toContain('Site Package Version: 1.0.0');
      expect(body).toContain(`Site Pixelated Components Package Version: ${pixelatedVersion}`);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('generateHumansTxt produces expected body + headers when passed data', async () => {
    const pkg = { name: 'acme', version: '9.9.9' };
    const routes = testData.routes || [];
    const siteInfo = testData.siteInfo || { name: 'Test Site' };
    const pixelatedVersion = pixelatedComponentsVersion;

    const { body, headers, etag } = await generateHumansTxt({ pkg, siteConfig: { siteInfo, routes } });

    expect(body).toContain(`Site Name: ${siteInfo.name}`);
    expect(body).toContain(`Site Pixelated Components Package Version: ${pixelatedVersion ?? 'N/A'}`);
    // sanity: ensure at least one real route was used from test-data
    if ((routes || []).length > 0) {
      expect(body).toContain(`${routes[0].path} - ${routes[0].title}`);
    }
    expect(headers['Content-Type']).toContain('text/plain');
    expect(typeof etag).toBe('string');
  });

  it('createHumansTxtResponse returns 200 and body, and 304 when if-none-match matches', async () => {
    const pkg = { name: 'acme', version: '9.9.9' };
    const routes = [ { path: '/a', title: 'A' } ];
    const pixelatedVersion = pixelatedComponentsVersion;

    const generated = await generateHumansTxt({ pkg, siteConfig: { siteInfo: { name: 'ACME' }, routes } });
    expect(generated.body).toContain(`Site Pixelated Components Package Version: ${pixelatedVersion ?? 'N/A'}`);

    const req1 = new NextRequest(new URL('https://example.test/humans.txt'));
    const resp1 = await createWellKnownResponse('humans', req1, { pkg, siteConfig: { siteInfo: { name: 'ACME' }, routes } });
    expect(resp1.status).toBe(200);
    const text = await resp1.text();
    expect(text).toBe(generated.body);

    const req2 = new NextRequest(new URL('https://example.test/humans.txt'), { headers: { 'if-none-match': generated.etag } });
    const resp2 = await createWellKnownResponse('humans', req2, { pkg, siteConfig: { siteInfo: { name: 'ACME' }, routes } });
    expect(resp2.status).toBe(304);
  });

  it('createTextResponsePayload returns stable headers and etag for the same body', () => {
    const first = createTextResponsePayload('hello humans');
    const second = createTextResponsePayload('hello humans');

    expect(first.body).toBe('hello humans');
    expect(first.etag).toBe(second.etag);
    expect(first.headers['Content-Type']).toContain('text/plain');
    expect(first.headers['Cache-Control']).toContain('max-age=60');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFile, rm } from 'fs/promises';
import path from 'path';
import {
  createTextResponsePayload,
  generateHumansTxt,
  generateSecurityTxt,
  createWellKnownResponse,
  safeJSON,
} from '../components/foundation/well-known';
import * as config from '../components/config/config';

vi.mock('../components/config/config', () => ({
  getFullPixelatedConfig: vi.fn(),
}));

describe('well-known utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('safeJSON returns null for a missing JSON file', async () => {
    expect(await safeJSON('/this/path/does/not/exist.json')).toBeNull();
  });

  it('createTextResponsePayload returns body and ETag headers', () => {
    const payload = createTextResponsePayload('hello world');
    expect(payload.body).toBe('hello world');
    expect(payload.headers['Content-Type']).toContain('text/plain');
    expect(payload.headers.ETag).toBeDefined();
    expect(payload.headers.ETag.length).toBeGreaterThan(0);
  });

  it('generateHumansTxt includes author and route list entries', async () => {
    (vi.mocked(config.getFullPixelatedConfig) as any).mockReturnValue({
      siteInfo: {
        author: 'Test Author',
        address: {
          streetAddress: '123 Main St',
          addressLocality: 'Testville',
          addressRegion: 'TS',
          postalCode: '12345',
          addressCountry: 'USA',
        },
        email: 'test@example.com',
        telephone: '555-1234',
      },
      routes: [
        { path: '/home', title: 'Home' },
        { path: '/about', title: 'About' },
      ],
    });

    const payload = await generateHumansTxt();
    expect(payload.body).toContain('Author Name: Test Author');
    expect(payload.body).toContain('Site URL:');
    expect(payload.body).toContain('/home');
    expect(payload.body).toContain('/about');
  });

  it('generateSecurityTxt contains the preferred languages entry', async () => {
    (vi.mocked(config.getFullPixelatedConfig) as any).mockReturnValue({});
    const payload = await generateSecurityTxt();
    expect(payload.body).toContain('Preferred-Languages: en');
  });

  it('safeJSON returns parsed object for valid JSON', async () => {
    const tempPath = path.join(process.cwd(), 'tmp-well-known-json-test.json');
    await writeFile(tempPath, '{"foo":"bar"}', 'utf8');
    try {
      expect(await safeJSON(tempPath)).toEqual({ foo: 'bar' });
    } finally {
      await rm(tempPath).catch(() => undefined);
    }
  });

  it('createWellKnownResponse returns 304 when the request ETag matches', async () => {
    (vi.mocked(config.getFullPixelatedConfig) as any).mockReturnValue({});
    const payload = await generateSecurityTxt();
    const req = {
      headers: {
        get: vi.fn(() => payload.etag),
      },
    } as any;

    const response = await createWellKnownResponse('security', req);
    expect(response.status).toBe(304);
  });

  it('createWellKnownResponse returns 200 when the request ETag does not match', async () => {
    (vi.mocked(config.getFullPixelatedConfig) as any).mockReturnValue({});
    const payload = await generateSecurityTxt();
    const req = {
      headers: {
        get: vi.fn(() => 'not-the-etag'),
      },
    } as any;

    const response = await createWellKnownResponse('security', req);
    expect(response.status).toBe(200);
    expect(response.headers.get('ETag')).toBe(payload.etag);
  });
});

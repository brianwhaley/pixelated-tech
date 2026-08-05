import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { BrowserConfigXML } from '@/components/foundation/browserconfig';
import { getFullPixelatedConfig } from '@/components/config/config';

vi.mock('@/components/config/config', async () => {
	const actual = await vi.importActual<typeof import('@/components/config/config')>('@/components/config/config');
	return {
		...actual,
		getFullPixelatedConfig: vi.fn()
	};
});

describe('BrowserConfigXML', () => {
	const mockConfig = {
		siteInfo: {
			url: 'https://example.com',
			image: 'https://example.com/logo.png',
			theme_color: '#ff0000'
		}
	};

	beforeEach(() => {
		vi.mocked(getFullPixelatedConfig).mockReturnValue(mockConfig as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a valid XML response with correct headers', async () => {
		const response = await BrowserConfigXML({});
		expect(response).toBeInstanceOf(NextResponse);
		expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
		const text = await response.text();
		expect(text).toContain('<browserconfig>');
		expect(text).toContain('<square70x70logo src="https://example.com/logo.png"/>');
		expect(text).toContain('<TileColor>#ff0000</TileColor>');
	});

	it('trims trailing slash from site URL', async () => {
		vi.mocked(getFullPixelatedConfig).mockReturnValue({
			siteInfo: { url: 'https://example.com/', image: 'https://example.com/logo.png', theme_color: '#000000' }
		} as any);
		const response = await BrowserConfigXML({});
		const text = await response.text();
		expect(text).toContain('<square70x70logo src="https://example.com/logo.png"/>');
	});
});

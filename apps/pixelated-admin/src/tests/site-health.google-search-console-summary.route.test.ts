import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getSiteConfig: vi.fn(),
	getFullPixelatedConfig: vi.fn(),
	getSearchConsoleData: vi.fn(),
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: mocks.getSiteConfig,
	getFullPixelatedConfig: mocks.getFullPixelatedConfig,
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	getSearchConsoleData: mocks.getSearchConsoleData,
}));

describe('Google Search Console billing summary route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSiteConfig.mockResolvedValue({ name: 'test', gscSiteUrl: 'https://example.com' });
		mocks.getFullPixelatedConfig.mockReturnValue({
			integrations: { googleSearchConsole: { serviceAccountKey: 'key' } },
		});
		mocks.getSearchConsoleData
			.mockResolvedValueOnce({
				success: true,
				data: [{ date: '2026-03-15', currentClicks: 31, currentImpressions: 0, previousClicks: 20, previousImpressions: 0 }],
			})
			.mockResolvedValueOnce({
				success: true,
				data: [{ currentClicks: 20, currentImpressions: 0 }],
			});
	});

	it('compares the invoice month with the preceding calendar month', async () => {
		const route = await import('@/app/api/site-health/google-search-console/route');
		const response = await route.GET(new Request('http://localhost?siteName=test&startDate=2026-03-01&endDate=2026-03-31'));

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			data: {
				currentMonth: '2026-03',
				previousMonth: '2026-02',
				currentClicks: 31,
				previousClicks: 20,
				change: 11,
				percentChange: 55,
				chartData: [{ date: '2026-03-15', currentClicks: 31, previousClicks: 20 }],
			},
		});
		expect(mocks.getSearchConsoleData).toHaveBeenNthCalledWith(
			1,
			expect.anything(),
			'test',
			'2026-03-01',
			'2026-03-31'
		);
		expect(mocks.getSearchConsoleData).toHaveBeenNthCalledWith(
			2,
			expect.anything(),
			'test',
			'2026-02-01',
			'2026-02-28'
		);
	});

	it('rejects requests without a site or complete date range', async () => {
		const route = await import('@/app/api/site-health/google-search-console/route');
		const response = await route.GET(new Request('http://localhost?siteName=test'));

		expect(response.status).toBe(400);
	});
});

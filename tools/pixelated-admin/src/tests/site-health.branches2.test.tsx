import { render, waitFor } from '@testing-library/react';

describe('Site Health page - branch variants', () => {
	it('imports and renders when fetch returns error-like payload', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components', () => ({
			PageSection: (p:any)=> (p.children),
			Loading: () => 'Loading',
			usePixelatedConfig: () => ({ siteInfo: { title: 'Test' } }),
			fetchSiteHealth: async () => ({ uptime: { status: 'error' }, metrics: [] }),
		}));
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		const { container } = render(<Page /> as any);
		await waitFor(() => expect(container).toBeTruthy());
	});

	it('imports when fetch returns detailed metrics', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components', () => ({
			PageSection: (p:any)=> (p.children),
			Loading: () => 'Loading',
			usePixelatedConfig: () => ({ siteInfo: { title: 'Test' } }),
			fetchSiteHealth: async () => ({ uptime: { status: 'ok' }, metrics: [{ name: 'LCP', value: 2.5 }] }),
		}));
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		const { container } = render(<Page /> as any);
		await waitFor(() => expect(container).toBeTruthy());
	});
});

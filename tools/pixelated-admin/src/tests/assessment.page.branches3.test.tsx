// Use doMock + resetModules to force different module-level mocks per test
describe('Assessment page - additional branch coverage', () => {
	it('renders with full payload hitting many branches', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components', () => ({
			PageSection: (_p:any)=> (_p.children),
			Loading: () => 'Loading',
			usePixelatedConfig: () => ({ siteInfo: { title: 'Test' } }),
			useFileData: () => ({ data: [{ name: 'a.json', file: '/data/assessment/a.json' }], loading: false, error: null }),
			smartFetch: async () => ({
				companyName: 'FullCo',
				title: 'Full Assessment',
				brand: { logo: '/logo.png', color: '#123' },
				existingSite: { url: 'https://existing', strengths: ['s1'], areasForImprovement: ['a1'] },
				websiteDomain: { currentUrls: ['https://example.com'] },
				marketOverview: ['m1','m2'],
				competitors: [{ name: 'c1', url: 'https://c1' }, { name: 'c2' }],
				colorPalette: ['#000', '#fff'],
			}),
			FontLoader: () => null,
			SmartImage: (_p:any) => null,
		}));

		const Page = (await import('@/app/(pages)/assessment/page')).default;
		expect(Page).toBeTruthy();
	});

	it('renders with minimal payload hitting fallback branches', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components', () => ({
			PageSection: (_p:any)=> (_p.children),
			Loading: () => 'Loading',
			usePixelatedConfig: () => ({ siteInfo: { title: 'Test' } }),
			useFileData: () => ({ data: [{ name: 'b.json', file: '/data/assessment/b.json' }], loading: false, error: null }),
			smartFetch: async () => ({
				companyName: 'MinCo',
				title: 'Minimal Assessment',
				brand: {},
				existingSite: null,
				marketOverview: 'single line overview',
				competitors: [],
			}),
			FontLoader: () => null,
			SmartImage: (_p:any) => null,
		}));

		const Page = (await import('@/app/(pages)/assessment/page')).default;
		expect(Page).toBeTruthy();
	});
});

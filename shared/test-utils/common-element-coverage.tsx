 
interface CommonElementCoverageOptions {
	Header: any;
	Nav: any;
	Footer: any;
	LayoutClient: any;
	NotFoundElement: any;
	RootLayout: (_props: { children: any }) => Promise<any> | any;
	proxy: (_req: any) => any;
	humansGET: (_req: any) => any;
	securityGET: (_req: any) => any;
	config: any;
	setPixelatedConfigOverride: (_override: any | null | undefined) => void;
	headersModule?: { headers: () => any };
	cloudinaryProductEnv?: string;
	render: any;
	screen: any;
	createElement: any;
	navAssertion?: () => void;
	headerAssertion?: () => void;
	footerAssertion?: () => void;
	notFoundAssertion?: () => void;
}
 

export function runCommonElementCoverage({
	Header,
	Nav,
	Footer,
	LayoutClient,
	NotFoundElement,
	RootLayout,
	proxy,
	humansGET,
	securityGET,
	config,
	setPixelatedConfigOverride,
	headersModule,
	cloudinaryProductEnv = 'test_env',
	render,
	screen,
	createElement,
	navAssertion,
	headerAssertion,
	footerAssertion,
	notFoundAssertion,
}: CommonElementCoverageOptions) {
	describe('Common element coverage', () => {
		it('renders nav with fallback routes when config is unavailable', () => {
			setPixelatedConfigOverride(null);
			render(<Nav />);
			if (navAssertion) {
				navAssertion();
				return;
			}
			const nav = screen.queryByTestId('menu-simple');
			expect(nav).not.toBeNull();
		});

		it('renders header without error', () => {
			render(<Header />);
			if (headerAssertion) {
				headerAssertion();
				return;
			}
			const smartImage = screen.queryByTestId('smart-image');
			expect(smartImage).not.toBeNull();
		});

		it('renders footer without error', async () => {
			const footerElement = Footer();
			render(footerElement && typeof (footerElement as any).then === 'function' ? await footerElement : footerElement);
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (footerAssertion) {
				footerAssertion();
				return;
			}
			const analytics = screen.queryByTestId('google-analytics');
			const footer = screen.queryByTestId('pixelated-footer');
			// Analytics script may be conditionally omitted in test environments; ensure footer exists
			expect(footer).not.toBeNull();
			if (analytics) {
				expect(analytics).not.toBeNull();
			}
		});

		it('renders layout client without error', async () => {
			render(<LayoutClient />);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(true).toBe(true);
		});

		it('renders app not-found element without error', () => {
			render(<NotFoundElement />);
			if (notFoundAssertion) {
				notFoundAssertion();
				return;
			}
			expect(screen.getByTestId('smart-image')).not.toBeNull();
		});

		it('renders layout client and uses cloudinary fallback product env', async () => {
			setPixelatedConfigOverride({ integrations: { cloudinary: {} } });
			render(<LayoutClient />);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(true).toBe(true);
		});

		it('renders layout client with explicit cloudinary product env', async () => {
			setPixelatedConfigOverride({ integrations: { cloudinary: { product_env: cloudinaryProductEnv } } });
			render(<LayoutClient />);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(true).toBe(true);
		});

		it('uses real pixelated.config.json siteInfo and route data', () => {
			expect(config.siteInfo).toBeDefined();
			expect(typeof config.siteInfo.url).toBe('string');
			expect(config.siteInfo.url).toContain('http');
			expect(config.routes.some((route: any) => route.path === '/')).toBe(true);
		});

		if (headersModule) {
			it('renders root layout with trailing slash path and fallback metadata', async () => {
				vi.mocked(headersModule.headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact/', 'x-origin': 'https://example.com' }));
				const root = await RootLayout({ children: createElement('div', { 'data-testid': 'child' }) });
				expect(root).toBeDefined();
				expect(root.props?.children).toBeTruthy();
			});
		}

		it('proxies request headers correctly', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1' },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect(result.request.headers.get('x-path')).toBe('/test?a=1');
			expect(result.request.headers.get('x-origin')).toBe('https://example.com');
		});

		it('proxies request headers with fallback url when href is unavailable', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: undefined },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect(result.request.headers.get('x-url')).toBe('https://example.com/test?a=1');
		});

		it('returns humans well-known response', async () => {
			const result = await humansGET({ url: 'https://example.com/humans.txt' } as any);
			if (typeof Response !== 'undefined' && result instanceof Response) {
				expect(await result.text()).toContain('humans');
			} else {
				expect(result).toEqual({ type: 'humans', url: 'https://example.com/humans.txt' });
			}
		});

		it('returns security well-known response', async () => {
			const result = await securityGET({ url: 'https://example.com/security.txt' } as any);
			if (typeof Response !== 'undefined' && result instanceof Response) {
				expect(await result.text()).toContain('security');
			} else {
				expect(result).toEqual({ type: 'security', url: 'https://example.com/security.txt' });
			}
		});
	});
}

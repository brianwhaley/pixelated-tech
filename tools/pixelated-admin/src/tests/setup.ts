import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TEST_CONFIG } from './fixtures';

// Stub @pixelated-tech/components to avoid requiring deep optional modules
vi.mock('@pixelated-tech/components/server', () => ({
	getFullPixelatedConfig: () => ({
		integrations: {
			nextAuth: { secret: TEST_CONFIG.nextAuth.secret },
			google: { client_id: (TEST_CONFIG.integrations as any).google.client_id, client_secret: (TEST_CONFIG.integrations as any).google.client_secret },
		},
		siteInfo: {
			name: 'Pixelated Admin',
			description: 'Admin interface',
			url: 'https://admin.pixelated.tech',
			email: 'brian@pixelated.tech',
			favicon: '/favicon.ico',
			favicon_sizes: '64x64 32x32 24x24 16x16',
			favicon_type: 'image/x-icon',
			theme_color: '#336699',
			background_color: '#ffffff',
			default_locale: 'en',
			display: 'standalone',
			image: '/pix-bg-512.gif',
			address: {
				streetAddress: '',
				addressLocality: '',
				addressRegion: '',
				postalCode: '',
				addressCountry: ''
			}
		},
		routes: [
			{ name: 'Home', path: '/' },
			{ name: 'Login', path: '/login' }
		],
		// Minimal mock for StyleGuideUI used by pages (return plain text to avoid JSX in setup)
		StyleGuideUI: () => 'StyleGuide',
	}),
}));

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		server: {
			...actual.server,
			getFullPixelatedConfig: () => ({
				integrations: {
					nextAuth: { secret: TEST_CONFIG.nextAuth.secret, url: TEST_CONFIG.nextAuth.url },
					google: { client_id: (TEST_CONFIG.integrations as any).google.client_id, client_secret: (TEST_CONFIG.integrations as any).google.client_secret },
				},
			}),
		},
		PageSection: (props: any) => props.children,
		Loading: () => 'Loading',
		usePixelatedConfig: () => ({ siteInfo: { title: 'Test' }, routes: [] }),
	};
});

// Provide a minimal adminserver integration mock so tests that import it can spy on
// `performAxeCoreAnalysis` without pulling in optional heavy modules from the real package.
vi.mock('@pixelated-tech/components/adminserver', () => ({
	performAxeCoreAnalysis: vi.fn(),
	getNextAuthCredentials: () => ({
		secret: TEST_CONFIG.nextAuth.secret,
	}),
	getGoogleOAuthCredentials: () => ({
		clientId: (TEST_CONFIG.integrations as any).google.client_id,
		clientSecret: (TEST_CONFIG.integrations as any).google.client_secret,
	}),
	InvoiceBuilder: ({ siteName, billingCycle }: any) => ({
		dataTestId: 'InvoiceBuilder',
		siteName,
		billingCycle,
	}),
	CacheManager: class {
		constructor() {}
		get() { return null; }
		set() { return null; }
	}
}));

// augment components mock with client-side utilities used by components
vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		PageSection: (props: any) => /*#__PURE__*/ (props.children),
		Loading: () => 'Loading',
		usePixelatedConfig: () => ({ siteInfo: { title: 'Test' }, routes: [] }),
	};
});

// Mock next-auth hooks for components that use useSession
vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));
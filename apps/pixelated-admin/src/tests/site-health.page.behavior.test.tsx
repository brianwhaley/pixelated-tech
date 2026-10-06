import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockSmartFetch = vi.fn();

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		smartFetch: (...args: any[]) => mockSmartFetch(...args),
	};
});

vi.mock('@pixelated-tech/components/adminclient', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		SiteHealthGit: ({ children }: any) => <div>{children}</div>,
		SiteHealthUptime: ({ children }: any) => <div>{children}</div>,
		SiteHealthSecurity: ({ children }: any) => <div>{children}</div>,
		SiteHealthOverview: ({ children }: any) => <div>{children}</div>,
		SiteHealthPerformance: ({ children }: any) => <div>{children}</div>,
		SiteHealthAccessibility: ({ children }: any) => <div>{children}</div>,
		SiteHealthAxeCore: ({ children }: any) => <div>{children}</div>,
		SiteHealthDependencyVulnerabilities: ({ children }: any) => <div>{children}</div>,
		SiteHealthSEO: ({ children }: any) => <div>{children}</div>,
		SiteHealthGoogleAnalytics: ({ children }: any) => <div>{children}</div>,
		SiteHealthGoogleSearchConsole: ({ children }: any) => <div>{children}</div>,
		SiteHealthOnSiteSEO: ({ children }: any) => <div>{children}</div>,
		SiteHealthCloudwatch: ({ children }: any) => <div>{children}</div>,
	};
});

describe('Site Health page behavior', () => {
	beforeEach(() => {
		vi.resetModules();
		mockSmartFetch.mockReset();
	});

	it('renders loading state while fetching sites', async () => {
		mockSmartFetch.mockResolvedValue({ ok: true, json: async () => [{ name: 'test' }] });
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		render(<Page />);
		expect(screen.getByText('Site Health')).toBeTruthy();
		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
	});
});

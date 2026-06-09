import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../components/admin/site-health/site-health-template', async () => {
	const actual = await vi.importActual('../components/admin/site-health/site-health-mock-context');
	const SiteHealthTemplate = ({ children, title, data }: any) => {
		const mockData = data ?? (title ? actual.useSiteHealthMockData()?.[title] : undefined);
		return <div data-testid="site-health-template">{children(mockData)}</div>;
	};
	return { SiteHealthTemplate };
});

vi.mock('../components/elements/table', () => ({
	Table: ({ data }: any) => (
		<table data-testid="mock-table">
			<tbody>
				{Array.isArray(data) ? data.map((row: any, idx: number) => (
					<tr key={idx}>
						<td>{String(row.Date)}</td>
						<td>{String(row.Message)}</td>
					</tr>
				)) : null}
			</tbody>
		</table>
	)
}));

vi.mock('child_process', () => {
	const mockExec = vi.fn();
	return {
		default: { exec: mockExec },
		exec: mockExec
	};
});

vi.mock('util', () => {
	const promisify = (fn: any) => {
		return async (...args: any[]) => {
			return new Promise((resolve, reject) => {
				fn(...args, (err: any, stdout: any, stderr: any) => {
					if (err) reject(err);
					else resolve({ stdout, stderr });
				});
			});
		};
	};
	return {
		default: { promisify },
		promisify
	};
});

vi.mock('puppeteer', () => {
	const launch = vi.fn();
	return {
		default: { launch },
		launch
	};
});

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(() => ({
		integrations: {
			googlePSI: { api_key: 'test-key' },
			aws: { access_key_id: 'AKIA', secret_access_key: 'SECRET', region: 'us-east-1' }
		}
	}))
}));

import { pixelatedComponentsVersion } from '../version';
import { folderFilenameToExportName, analyzeComponentUsage } from '../components/admin/componentusage/componentAnalysis';
import { discoverComponentsFromLibrary, parseComponentExports } from '../components/admin/componentusage/componentDiscovery';
import { executeDeployment, type DeploymentRequest } from '../components/admin/deploy/deployment.integration';
import { calculateDateRanges, formatChartDate, getCachedData, setCachedData } from '../components/admin/site-health/google.api.utils';
import { EXCLUDED_URL_PATTERNS, EXCLUDED_FILE_EXTENSIONS, EXCLUDED_DIRECTORY_NAMES } from '../components/admin/site-health/seo-constants';
import { SiteHealthAccessibility } from '../components/admin/site-health/site-health-accessibility';
import { performAxeCoreAnalysis } from '../components/admin/site-health/site-health-axe-core.integration';
import { SiteHealthAxeCore } from '../components/admin/site-health/site-health-axe-core';
import { SiteHealthCloudwatch } from '../components/admin/site-health/site-health-cloudwatch';
import { SiteHealthDependencyVulnerabilities } from '../components/admin/site-health/site-health-dependency-vulnerabilities';
import { SiteHealthGit } from '../components/admin/site-health/site-health-github';
import { SiteHealthGoogleAnalytics } from '../components/admin/site-health/site-health-google-analytics';
import { SiteHealthGoogleSearchConsole } from '../components/admin/site-health/site-health-google-search-console';
import { getScoreIndicator, getImpactIndicator, getPassingIndicator, getIncompleteIndicator } from '../components/admin/site-health/site-health-indicators';
import { SiteHealthMockProvider, useSiteHealthMockData } from '../components/admin/site-health/site-health-mock-context';
import { fetchPSIData, processPSIData } from '../components/admin/site-health/site-health-core-web-vitals.integration';

const { exec } = await import('child_process');
const { getFullPixelatedConfig } = await import('../components/config/config');

const siteHealthTemplateProps = {
	mockData: null
};

const renderSiteHealthComponent = (element: React.ReactNode, title: string, mockData: any) => {
	return render(
		<SiteHealthMockProvider mocks={{ [title]: mockData }}>
			{element}
		</SiteHealthMockProvider>
	);
};

describe('Bottom 20 branch coverage additions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('version export should be a non-empty string or empty string', () => {
		expect(typeof pixelatedComponentsVersion).toBe('string');
		expect(pixelatedComponentsVersion.length).toBeGreaterThanOrEqual(0);
	});

	describe('SEO constants', () => {
		it('should contain expected excluded URL patterns and file extension matcher', () => {
			expect(EXCLUDED_URL_PATTERNS).toContain('/images');
			expect(EXCLUDED_DIRECTORY_NAMES).toContain('assets');
			expect(EXCLUDED_FILE_EXTENSIONS.test('image.jpg')).toBe(true);
			expect(EXCLUDED_FILE_EXTENSIONS.test('document.docx')).toBe(true);
			expect(EXCLUDED_FILE_EXTENSIONS.test('index.html')).toBe(false);
		});
	});

	describe('Google API utils', () => {
		it('calculateDateRanges should return default and previous ranges', () => {
			const result = calculateDateRanges();
			expect(result.currentEnd instanceof Date).toBe(true);
			expect(result.previousEnd instanceof Date).toBe(true);
			expect(result.previousEnd.getTime()).toBeLessThan(result.currentStart.getTime());
			expect(result.currentStartStr).toMatch(/\d{4}-\d{2}-\d{2}/);
		});

		it('formatChartDate should return formatted US date', () => {
			const formatted = formatChartDate(new Date('2024-01-15T00:00:00Z'));
			expect(formatted).toMatch(/Jan|1/);
		});

		it('cache helpers should pass values through', () => {
			const cache: any = { get: vi.fn(() => 42), set: vi.fn() };
			expect(getCachedData(cache, 'x')).toBe(42);
			setCachedData(cache, 'x', 100);
			expect(cache.set).toHaveBeenCalledWith('x', 100);
		});
	});

	describe('Branch helpers', () => {
		it('getScoreIndicator should return correct buckets', () => {
			expect(getScoreIndicator(0.95).color).toBe('#10b981');
			expect(getScoreIndicator(0.75).color).toBe('#d97706');
			expect(getScoreIndicator(0.55).color).toBe('#ea580c');
			expect(getScoreIndicator(0.25).color).toBe('#dc2626');
			expect(getScoreIndicator(null).icon).toBe('⚪');
		});

		it('getImpactIndicator should return known and unknown mappings', () => {
			expect(getImpactIndicator('critical').icon).toBe('🔴');
			expect(getImpactIndicator('serious').icon).toBe('🟠');
			expect(getImpactIndicator('moderate').icon).toBe('🟡');
			expect(getImpactIndicator('minor').icon).toBe('⚪');
			expect(getImpactIndicator('unknown').color).toBe('#6b7280');
		});

		it('passing and incomplete indicators should be stable objects', () => {
			expect(getPassingIndicator()).toEqual({ icon: '🟢', color: '#10b981' });
			expect(getIncompleteIndicator()).toEqual({ icon: '⚪', color: '#6b7280' });
		});
	});

	describe('Mock context utilities', () => {
		it('SiteHealthMockProvider should expose context data via hook', () => {
			const TestComponent = () => {
				const data = useSiteHealthMockData();
				return <div>{JSON.stringify(data)}</div>;
			};

			render(
				<SiteHealthMockProvider mocks={{ foo: 'bar' }}>
					<TestComponent />
				</SiteHealthMockProvider>
			);

			expect(screen.getByText(/"foo":"bar"/)).toBeDefined();
		});

		it('useSiteHealthMockData should return null outside provider', () => {
			const TestComponent = () => {
				const data = useSiteHealthMockData();
				return <div>{String(data)}</div>;
			};

			render(<TestComponent />);
			expect(screen.getByText('null')).toBeDefined();
		});
	});

	describe('SiteHealth components with render props', () => {
		it('SiteHealthAccessibility should render no data message', () => {
			renderSiteHealthComponent(<SiteHealthAccessibility siteName="test-site" />, 'PageSpeed - Accessibility', null);
			expect(screen.getByText(/No accessibility data available/)).toBeDefined();
		});

		it('SiteHealthAccessibility should render error message when data.error exists', () => {
			renderSiteHealthComponent(
				<SiteHealthAccessibility siteName="test-site" />,
				'PageSpeed - Accessibility',
				{ data: [{ status: 'error', error: 'bad', site: 'example-site', url: 'https://example.com', scores: { accessibility: null }, categories: { accessibility: { audits: [] } }, timestamp: new Date().toISOString() }] }
			);
			expect(screen.getByText(/Error: bad/)).toBeDefined();
		});

		it('SiteHealthAccessibility should render score and audit details', () => {
			renderSiteHealthComponent(
				<SiteHealthAccessibility siteName="test-site" />,
				'PageSpeed - Accessibility',
				{
					data: [{
						status: 'success',
						site: 'example-site',
						url: 'https://example.com',
						timestamp: new Date().toISOString(),
						scores: { accessibility: 0.85 },
						categories: {
							accessibility: {
								audits: [
									{ id: 'color-contrast', score: 0.25, scoreDisplayMode: 'numeric', title: 'Low contrast', displayValue: '1 failing element', details: { items: [{ target: ['.example'] }] } }
								]
							}
						},
					}]
				}
			);
			expect(screen.getByText(/Low contrast/)).toBeDefined();
		});

		it('SiteHealthAxeCore should render fallback no data', () => {
			renderSiteHealthComponent(<SiteHealthAxeCore siteName="test-site" />, 'Axe-Core Accessibility', null);
			expect(screen.getByText(/No axe-core data available/)).toBeDefined();
		});

		it('SiteHealthAxeCore should render error output when site data errors', () => {
			renderSiteHealthComponent(
				<SiteHealthAxeCore siteName="test-site" />,
				'Axe-Core Accessibility',
				{ data: [{ status: 'error', error: 'axe failed', site: 'example-site', url: 'https://example.com', result: { violations: [], passes: [], incomplete: [], inapplicable: [], testEngine: { name: 'axe-core', version: '1' }, testRunner: { name: 'axe' }, testEnvironment: { userAgent: 'x', windowWidth: 0, windowHeight: 0 }, timestamp: new Date().toISOString(), url: 'https://example.com' }, summary: { violations: 0, passes: 0, incomplete: 0, inapplicable: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }, timestamp: new Date().toISOString() }] }
			);
			expect(screen.getByText(/Error: axe failed/)).toBeDefined();
		});

		it('SiteHealthAxeCore should render violations, passes, and incomplete sections', () => {
			renderSiteHealthComponent(
				<SiteHealthAxeCore siteName="test-site" />,
				'Axe-Core Accessibility',
				{
					data: [{
						status: 'success',
						site: 'example-site',
						url: 'https://example.com',
						timestamp: new Date().toISOString(),
						result: {
							violations: [
								{ id: 'v1', impact: 'critical', help: 'Fix this', description: 'bad', helpUrl: 'https://example.com', nodes: [{ target: ['#a'], html: '<div />' }], tags: [] }
							],
							passes: [],
							incomplete: [
								{ id: 'i1', impact: 'minor', help: 'May be incomplete', description: 'info', helpUrl: 'https://example.com', nodes: [{ html: '<span>foo</span>' }], tags: [] }
							],
							inapplicable: [],
							testEngine: { name: 'axe-core', version: '1' },
							testRunner: { name: 'axe' },
							testEnvironment: { userAgent: 'x', windowWidth: 0, windowHeight: 0 },
							timestamp: new Date().toISOString(),
							url: 'https://example.com'
						},
						summary: { violations: 1, passes: 0, incomplete: 1, inapplicable: 0, critical: 1, serious: 0, moderate: 0, minor: 0 },
					}]
				}
			);

			expect(screen.getByText(/Accessibility Violations/)).toBeDefined();
			expect(screen.getByText(/Fix this/)).toBeDefined();
			expect(screen.getByText(/May be incomplete/)).toBeDefined();
		});

		it('SiteHealthCloudwatch should show no uptime data placeholder', () => {
			renderSiteHealthComponent(<SiteHealthCloudwatch siteName="test-site" />, 'CloudWatch Uptime', null);
			expect(screen.getByText(/No uptime data available/)).toBeDefined();
		});

		it('SiteHealthCloudwatch should show no metric data placeholder when all checks are zero', () => {
			renderSiteHealthComponent(
				<SiteHealthCloudwatch siteName="test-site" />,
				'CloudWatch Uptime',
				[{ date: '2024-01-01', successCount: 0, failureCount: 0, totalChecks: 0, successRate: 0 }]
			);
			expect(screen.getByText(/Health check exists but has no metric data/)).toBeDefined();
		});

		it('SiteHealthDependencyVulnerabilities should handle secure data and render no vulnerabilities', () => {
			renderSiteHealthComponent(
				<SiteHealthDependencyVulnerabilities siteName="test-site" />,
				'Dependency Vulnerability',
				{ url: 'https://example.com', status: 'Secure', totalDependencies: 2, dependencies: 2, vulnerabilities: [], summary: { total: 0 }, timestamp: new Date().toISOString() }
			);
			expect(screen.getByText(/No vulnerabilities found/)).toBeDefined();
		});

		it('SiteHealthDependencyVulnerabilities should render vulnerability entries', () => {
			renderSiteHealthComponent(
				<SiteHealthDependencyVulnerabilities siteName="test-site" />,
				'Dependency Vulnerability',
				{
					url: 'https://example.com',
					status: 'High Risk',
					totalDependencies: 1,
					dependencies: 1,
					vulnerabilities: [{ name: 'insecure-lib', severity: 'high', range: '<1.0.0', title: 'Security issue', url: 'https://example.com', fixAvailable: true }],
					summary: { total: 1 },
					timestamp: new Date().toISOString()
				}
			);
			expect(screen.getByText(/Security issue/)).toBeDefined();
			expect(screen.getByText(/Fix available/)).toBeDefined();
		});

		it('SiteHealthGit should render no-data state when data is missing', () => {
			renderSiteHealthComponent(<SiteHealthGit siteName="test-site" />, 'Git Push Notes', null);
			expect(screen.getByText(/No git data available/)).toBeDefined();
		});

		it('SiteHealthGit should render error state when error exists', () => {
			renderSiteHealthComponent(
				<SiteHealthGit siteName="test-site" />,
				'Git Push Notes',
				{ success: true, error: 'gone', commits: [], timestamp: new Date().toISOString() }
			);
			expect(screen.getByText(/Error: gone/)).toBeDefined();
		});

		it('SiteHealthGit should render commit table when commits present', () => {
			renderSiteHealthComponent(
				<SiteHealthGit siteName="test-site" />,
				'Git Push Notes',
				{ success: true, commits: [{ hash: 'abc', date: new Date().toISOString(), message: 'Fix bug', author: 'me' }], timestamp: new Date().toISOString() }
			);
			expect(screen.getByTestId('mock-table')).toBeDefined();
		});

		it('SiteHealthGoogleAnalytics should render no data placeholder', () => {
			renderSiteHealthComponent(<SiteHealthGoogleAnalytics siteName="test-site" />, 'Google Analytics', null);
			expect(screen.getByText(/No data available for the selected date range/)).toBeDefined();
		});

		it('SiteHealthGoogleAnalytics should render invalid data placeholder', () => {
			renderSiteHealthComponent(
				<SiteHealthGoogleAnalytics siteName="test-site" />,
				'Google Analytics',
				[{ date: 123, currentPageViews: 'x', previousPageViews: null }]
			);
			expect(screen.getByText(/Invalid data format received from Google Analytics API/)).toBeDefined();
		});

		it('SiteHealthGoogleSearchConsole should render no data placeholder', () => {
			renderSiteHealthComponent(<SiteHealthGoogleSearchConsole siteName="test-site" />, 'Google Search Console', null);
			expect(screen.getByText(/No indexing data available for the selected date range/)).toBeDefined();
		});

		it('SiteHealthGoogleSearchConsole should render invalid data placeholder', () => {
			renderSiteHealthComponent(
				<SiteHealthGoogleSearchConsole siteName="test-site" />,
				'Google Search Console',
				[{ date: 123, currentImpressions: 'x', currentClicks: 'y', previousImpressions: null, previousClicks: null }]
			);
			expect(screen.getByText(/Invalid data format received from Google Search Console API/)).toBeDefined();
		});
	});

	describe('Deployment integration', () => {
		const siteConfig = { name: 'test-site', localPath: '/tmp/site', remote: 'origin' } as any;
		const request: DeploymentRequest = {
			site: 'test-site',
			environments: ['dev', 'prod'],
			versionType: 'patch',
			commitMessage: 'Deploy patch'
		};

		it('should reject non-local execution', async () => {
			await expect(executeDeployment(request, siteConfig, false)).rejects.toThrow(/only allowed when running locally/);
		});

		it('should reject missing localPath', async () => {
			await expect(executeDeployment(request, { ...siteConfig, localPath: undefined }, true)).rejects.toThrow(/localPath is required/);
		});

		it('should reject missing remote', async () => {
			await expect(executeDeployment(request, { ...siteConfig, remote: undefined }, true)).rejects.toThrow(/remote is required/);
		});

		it('should perform deployment when commands succeed', async () => {
			vi.mocked(exec).mockImplementation((cmd: string, options: any, callback: any) => {
				if (cmd.includes('git branch --show-current')) return callback(null, 'dev\n', '');
				if (cmd.includes('npm outdated --json')) return callback(null, '{}', '');
				if (cmd.includes('npm run lint')) return callback(null, 'Lint passed', '');
				if (cmd.includes('npm audit fix')) return callback(null, 'Audit fixed', '');
				if (cmd.includes('npm version patch')) return callback(null, '1.0.1', '');
				if (cmd.includes('npm run build')) return callback(null, 'Built', '');
				if (cmd.includes('git add')) return callback(null, 'Added', '');
				if (cmd.includes('git commit')) return callback(null, 'Committed', '');
				if (cmd.includes('node -p')) return callback(null, '1.0.1\n', '');
				if (cmd.includes('git push')) return callback(null, 'Pushed', '');
				return callback(null, '', '');
			});

			const result = await executeDeployment(request, siteConfig, true);
			expect(result.prep).toContain('Built project successfully');
			expect(result.environments.dev).toContain('Successfully deployed');
			expect(result.environments.prod).toContain('Successfully deployed');
		});

		it('should fail when not on dev branch', async () => {
			vi.mocked(exec).mockImplementation((cmd: string, options: any, callback: any) => {
				if (cmd.includes('git branch --show-current')) return callback(null, 'main\n', '');
				return callback(null, '', '');
			});

			await expect(executeDeployment(request, siteConfig, true)).rejects.toThrow(/Must be on dev branch/);
		});
	});

	describe('Axe integration error path', () => {
		it('should return structured error when puppeteer launch fails', async () => {
			const puppeteer = await import('puppeteer');
			vi.mocked(puppeteer.launch).mockRejectedValueOnce(new Error('Launch failed'));

			const result = await performAxeCoreAnalysis('https://example.com');
			expect(result.status).toBe('error');
			expect(result.error).toContain('Launch failed');
		});
	});

	describe('Core Web Vitals helpers', () => {
		it('fetchPSIData should reject when API key is missing', async () => {
			vi.mocked(getFullPixelatedConfig).mockReturnValue({ integrations: {} });
			await expect(fetchPSIData('https://example.com')).rejects.toThrow(/Google PSI API key is not set/);
		});

		it('processPSIData should extract metrics and categories cleanly', async () => {
			const psiData = {
				lighthouseResult: {
					audits: {
						'cumulative-layout-shift': { numericValue: 0.1 },
						'first-contentful-paint': { numericValue: 1.2 },
						'largest-contentful-paint': { numericValue: 2.5 },
						'max-potential-fid': { numericValue: 0 },
						'server-response-time': { numericValue: 0.2 },
						'speed-index': { numericValue: 3.5 },
						'interactive': { numericValue: 4.1 },
						'total-blocking-time': { numericValue: 120 },
						'first-meaningful-paint': { numericValue: 1.8 }
					},
					categories: {
						performance: { id: 'performance', title: 'Performance', score: 0.92, auditRefs: [{ id: 'cumulative-layout-shift' }] },
						accessibility: { id: 'accessibility', title: 'Accessibility', score: 0.85, auditRefs: [] },
						'best-practices': { id: 'best-practices', title: 'Best Practices', score: 0.88, auditRefs: [] },
						seo: { id: 'seo', title: 'SEO', score: 0.78, auditRefs: [] },
						pwa: { id: 'pwa', title: 'PWA', score: 0.5, auditRefs: [] }
					}
				}
			};

			const result = await processPSIData(psiData, 'test-site', 'https://example.com');
			expect(result.metrics.lcp).toBe(2.5);
			expect(result.scores.performance).toBe(0.92);
			expect(result.categories.performance.id).toBe('performance');
		});
	});
});

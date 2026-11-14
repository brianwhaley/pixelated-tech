import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { mockConfig, render, screen } from '../test/test-utils';
import { mockGoogleSearchConsoleData } from '../test/test-data';

vi.mock('../components/admin/site-health/site-health-template', () => ({
	SiteHealthTemplate: ({ children, endpoint }: any) => (
		<div>
			{children(endpoint.responseTransformer({
				success: true,
				data: {
					currentMonth: '2026-10',
					previousMonth: '2026-09',
					currentClicks: mockGoogleSearchConsoleData.reduce((total, point) => total + point.currentClicks, 0),
					previousClicks: mockGoogleSearchConsoleData.reduce((total, point) => total + point.previousClicks, 0),
					change: mockGoogleSearchConsoleData.reduce((total, point) => total + point.currentClicks - point.previousClicks, 0),
					percentChange: (mockGoogleSearchConsoleData.reduce((total, point) => total + point.currentClicks - point.previousClicks, 0)
						/ mockGoogleSearchConsoleData.reduce((total, point) => total + point.previousClicks, 0)) * 100,
					chartData: mockGoogleSearchConsoleData,
				},
			}))}
		</div>
	),
}));

import { SiteHealthGoogleSearchConsole } from '../components/admin/site-health/site-health-google-search-console';

describe('SiteHealthGoogleSearchConsole', () => {
	it('renders the transformed Search Console summary response', () => {
		render(
			<SiteHealthGoogleSearchConsole
				siteName={mockConfig.siteInfo?.name || 'example-site'}
				startDate="2026-10-01"
				endDate="2026-10-31"
			/>
		);

		expect(screen.getByTestId('search-console-clicks-chart')).toBeInTheDocument();
		expect(screen.queryByTestId('search-console-clicks-summary')).not.toBeInTheDocument();
	});
});

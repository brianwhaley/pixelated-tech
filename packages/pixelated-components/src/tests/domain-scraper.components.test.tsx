import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { DomainScraper } from '../components/admin/scraper/domain-scraper.components';
import { listAvailableDomainDiscoveryRuns, scrapeDomain } from '../components/admin/scraper/domain-scraper.server';

vi.mock('../components/admin/scraper/domain-scraper.server', () => ({
	listAvailableDomainDiscoveryRuns: vi.fn(),
	scrapeDomain: vi.fn(),
}));

describe('DomainScraper', () => {
	it('loads recovery runs and renders scrape results', async () => {
		vi.mocked(listAvailableDomainDiscoveryRuns).mockResolvedValue([
			{ discoveryFileName: 'run-1.json' } as any,
		]);
		vi.mocked(scrapeDomain).mockResolvedValue({
			pagesCrawled: 2,
			records: [{ fullName: ['Ada Lovelace'], emails: ['ada@example.com'], sourceUrl: ['https://example.com/ada'] }],
			logs: ['Finished'],
		} as any);

		render(<DomainScraper />, { config: {
			integrations: { domainScraper: { sites: { example: { startUrls: ['https://example.com'], maxPages: 4, maxDepth: 2, requestDelay: 1 } } } }
		} as any });

		fireEvent.change(screen.getByLabelText('Starting URL'), { target: { value: 'https://example.com' } });
		expect(screen.getByLabelText('Maximum pages')).toHaveValue(4);
		fireEvent.click(screen.getByLabelText('Recovery Mode'));
		await waitFor(() => expect(screen.getByText('run-1.json')).toBeInTheDocument());

		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form')!);
		await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
		expect(screen.getByText('2 pages crawled, 1 email addresses found.')).toBeInTheDocument();
	});

	it('renders errors and does not download without records', async () => {
		vi.mocked(scrapeDomain).mockResolvedValue({ error: 'Crawl failed', records: [], pagesCrawled: 0, logs: [] } as any);
		render(<DomainScraper />, { config: { integrations: { domainScraper: { sites: {} } } } as any });
		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form')!);
		await waitFor(() => expect(screen.getByText('Crawl failed')).toBeInTheDocument());
	});
});
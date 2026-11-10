import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockScrapeDomain = vi.hoisted(() => vi.fn());
const mockListDiscoveryRuns = vi.hoisted(() => vi.fn(async () => []));
const mockConfig = vi.hoisted(() => ({
	integrations: {
		domainScraper: {
			sites: {
				charterOne: { startUrls: ['https://www.charteronerealty.com/agents.php'], maxPages: 0, maxDepth: 2, requestDelay: 0 },
				example: { startUrls: ['https://example.com/start'], maxPages: 25, maxDepth: 3, requestDelay: 1.5 }
			}
		}
	}
}));
vi.mock('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server', () => ({ scrapeDomain: mockScrapeDomain, listAvailableDomainDiscoveryRuns: mockListDiscoveryRuns }));
vi.mock('../../../../packages/pixelated-components/src/components/config/config.client', () => ({ usePixelatedConfig: () => mockConfig }));

describe('DomainScraper component', () => {
	it('populates scraper settings from the selected configured URL', async () => {
		const { DomainScraper } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.components');
		render(<DomainScraper />);
		const siteSelect = screen.getByLabelText('Starting URL') as HTMLSelectElement;
		expect(siteSelect.value).toBe('');
		expect((screen.getByLabelText('Maximum pages') as HTMLInputElement).value).toBe('');
		expect((screen.getByLabelText('Maximum depth') as HTMLInputElement).value).toBe('');
		expect((screen.getByLabelText('Request delay (seconds)') as HTMLInputElement).value).toBe('');

		fireEvent.change(siteSelect, { target: { value: 'https://www.charteronerealty.com/agents.php' } });
		expect(screen.getByLabelText('Maximum pages')).toHaveValue(0);
		expect(screen.getByLabelText('Maximum depth')).toHaveValue(2);
		expect(screen.getByLabelText('Request delay (seconds)')).toHaveValue(0);

		fireEvent.change(siteSelect, { target: { value: 'https://example.com/start' } });
		expect(screen.getByLabelText('Maximum pages')).toHaveValue(25);
		expect(screen.getByLabelText('Maximum depth')).toHaveValue(3);
		expect(screen.getByLabelText('Request delay (seconds)')).toHaveValue(1.5);
	});

	it('submits a crawl and downloads returned records', async () => {
		mockScrapeDomain.mockResolvedValue({
			startUrl: 'https://example.com',
			pagesCrawled: 1,
			records: [{ fullName: ['Jane Doe'], emails: ['jane@example.com'], sourceUrl: ['https://example.com'] }],
			logs: ['complete'],
		});
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
		const { DomainScraper } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.components');
		render(<DomainScraper />);
		fireEvent.change(screen.getByLabelText('Starting URL'), { target: { value: 'https://www.charteronerealty.com/agents.php' } });
		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form') as HTMLFormElement);
		await waitFor(() => expect(screen.getByText('jane@example.com')).toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
		expect(mockScrapeDomain).toHaveBeenCalled();
		const submittedForm = mockScrapeDomain.mock.lastCall?.[0] as FormData;
		expect(submittedForm.get('url')).toBe('https://www.charteronerealty.com/agents.php');
		expect(submittedForm.get('maxPages')).toBe('0');
		expect(submittedForm.get('maxDepth')).toBe('2');
		expect(submittedForm.get('requestDelay')).toBe('0');
		expect(createObjectURL).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
		expect(click).toHaveBeenCalled();
	});

	it('shows the empty result state', async () => {
		mockScrapeDomain.mockResolvedValue({ startUrl: 'https://example.com', pagesCrawled: 1, records: [], logs: [] });
		const { DomainScraper } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.components');
		render(<DomainScraper />);
		fireEvent.change(screen.getByLabelText('Starting URL'), { target: { value: 'https://www.charteronerealty.com/agents.php' } });
		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form') as HTMLFormElement);
		await waitFor(() => expect(screen.getByText('No email addresses were found.')).toBeInTheDocument());
	});

	it('shows and submits a selected recovery run', async () => {
		mockListDiscoveryRuns.mockResolvedValueOnce([{
			discoveryFileName: '2026-11-06-example-discovery.jsonl',
			extractFileName: '2026-11-06-example-extract.jsonl',
			siteName: 'example',
			startUrl: 'https://example.com/start',
			phase: 'discovery',
			updatedAt: '2026-11-06T14:32:10.000Z'
		}]);
		mockScrapeDomain.mockResolvedValue({ startUrl: 'https://example.com/start', pagesCrawled: 0, records: [], logs: [] });
		const { DomainScraper } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.components');
		render(<DomainScraper />);
		fireEvent.change(screen.getByLabelText('Starting URL'), { target: { value: 'https://www.charteronerealty.com/agents.php' } });
		fireEvent.click(screen.getByLabelText('Recovery Mode'));
		const recoveryRun = await screen.findByLabelText('Recovery Run') as HTMLSelectElement;
		expect(recoveryRun.options[0]?.value).toBe('');
		expect(screen.getByRole('option', { name: /2026-11-06-example-discovery\.jsonl/ })).toBeInTheDocument();
		fireEvent.change(recoveryRun, { target: { value: '2026-11-06-example-discovery.jsonl' } });
		fireEvent.submit(recoveryRun.closest('form') as HTMLFormElement);
		await waitFor(() => expect(mockScrapeDomain).toHaveBeenCalled());
		const submittedForm = mockScrapeDomain.mock.lastCall?.[0] as FormData;
		expect(submittedForm.get('recoveryMode')).toBe('true');
		expect(submittedForm.get('recoveryFileName')).toBe('2026-11-06-example-discovery.jsonl');
	});
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockScrapeDomain = vi.hoisted(() => vi.fn());
vi.mock('../app/(pages)/domain-scraper/actions.server', () => ({ scrapeDomain: mockScrapeDomain }));

describe('DomainScraper component', () => {
	it('submits a crawl and downloads returned records', async () => {
		mockScrapeDomain.mockResolvedValue({
			startUrl: 'https://example.com',
			pagesCrawled: 1,
			records: [{ name: 'Jane Doe', email: 'jane@example.com', sourceUrl: 'https://example.com' }],
			logs: ['complete'],
		});
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
		const { DomainScraper } = await import('../app/(pages)/domain-scraper/domain-scraper.components');
		render(<DomainScraper />);
		fireEvent.change(screen.getByLabelText('Starting URL'), { target: { value: 'https://example.com' } });
		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form') as HTMLFormElement);
		await waitFor(() => expect(screen.getByText('jane@example.com')).toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
		expect(mockScrapeDomain).toHaveBeenCalled();
		expect(createObjectURL).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
		expect(click).toHaveBeenCalled();
	});

	it('shows the empty result state', async () => {
		mockScrapeDomain.mockResolvedValue({ startUrl: 'https://example.com', pagesCrawled: 1, records: [], logs: [] });
		const { DomainScraper } = await import('../app/(pages)/domain-scraper/domain-scraper.components');
		render(<DomainScraper />);
		fireEvent.submit(screen.getByRole('button', { name: 'Start crawl' }).closest('form') as HTMLFormElement);
		await waitFor(() => expect(screen.getByText('No email addresses were found.')).toBeInTheDocument());
	});
});

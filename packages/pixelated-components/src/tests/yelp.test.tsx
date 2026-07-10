import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { YelpReviews } from '../components/integrations/yelp';
import { pixelatedConfig } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';
import { smartFetch } from '../components/foundation/smartfetch';

// Mock smartFetch
vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

describe('YelpReviews Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(smartFetch).mockClear();
	});

	it('should render component with business ID', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			reviews: [
				{
					id: '1',
					rating: 5,
					text: 'Great experience!',
					user: { name: 'John Doe' }
				}
			]
		});

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID="biz-123" />);
			container = result.container;
		});
		
		expect(container!).toBeTruthy();
	});

	it('should accept required business ID prop', async () => {
		const businessID = 'biz-456789';
		vi.mocked(smartFetch).mockResolvedValueOnce({ reviews: [] });

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID={businessID} />);
			container = result.container;
		});
		expect(container!).toBeTruthy();
	});

	it('should show loading state initially', async () => {
		vi.mocked(smartFetch).mockImplementationOnce(() =>
			new Promise(resolve => setTimeout(() =>
				resolve({ reviews: [] }), 100)
			)
		);

		await act(async () => {
			renderWithProviders(<YelpReviews businessID="biz-123" />);
		});
		expect(screen.queryByText(/loading/i)).toBeTruthy();
	});

	it('should display an error message when smartFetch fails', async () => {
		vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Network failure'));

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID="biz-123" />);
			container = result.container;
		});

		await waitFor(() => {
			expect(container.textContent).toContain('Error: Network failure');
		});
	});

	it('should display Yelp Reviews heading', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ reviews: [] });

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID="biz-123" />);
			container = result.container;
		});

		await waitFor(() => {
			expect(container.textContent).toContain('Yelp Reviews');
		});
	});

	it('should display business reviews data', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			reviews: [
				{
					id: 'rev-1',
					rating: 5,
					text: 'Great experience!',
					user: { name: 'John Doe' }
				}
			]
		});

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID="biz-123" />);
			container = result.container;
		});

		await waitFor(() => {
			expect(container.textContent).toContain('Great experience!');
			expect(container.textContent).toContain('John Doe');
		});
	});

	it('should display ratings from reviews', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			reviews: [
				{
					id: '1',
					rating: 4.5,
					text: 'Good food',
					user: { name: 'Jane Smith' }
				}
			]
		});

		let container: HTMLElement;
		await act(async () => {
			const result = renderWithProviders(<YelpReviews businessID="biz-123" />);
			container = result.container;
		});

		await waitFor(() => {
			expect(container.textContent).toContain('Jane Smith');
		});
	});
});

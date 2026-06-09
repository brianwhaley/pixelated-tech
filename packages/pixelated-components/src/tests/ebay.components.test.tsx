import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, waitFor, screen, fireEvent } from '@testing-library/react';
import { EbayItems, EbayListFilter, EbayItemHeader, EbayListItem, EbayItemDetail, EbayRateLimitsVisualizer } from '../components/shoppingcart/ebay.components';
import * as ebayFunctions from '../components/shoppingcart/ebay.functions';
import { pixelatedConfig, mockEbayItem as ebayItem } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';

vi.mock('../components/integrations/cloudinary', () => ({
	getCloudinaryRemoteFetchURL: vi.fn(({ url }) => `https://cloudinary.com/${url}`),
	buildCloudinaryUrl: vi.fn(({ src }) => `https://cloudinary.com/${src}`),
	getCloudinaryRemoteFetchURLFromConfig: vi.fn(({ url }) => `https://cloudinary.com/${url}`),
}));

vi.mock('../components/shoppingcart/ebay.functions', async () => {
	const actual = await vi.importActual<typeof import('../components/shoppingcart/ebay.functions')>('../components/shoppingcart/ebay.functions');
	return {
		...actual,
		getEbayItems: vi.fn(),
		getEbayItem: vi.fn(),
		getEbayAppToken: vi.fn(),
		getEbayRateLimits: vi.fn(),
	};
});

describe('EbayItems component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('should render EbayItems component with apiProps', async () => {
		const { container } = renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations?.ebay}
			/>
		);

		await waitFor(() => {
			expect(container).toBeDefined();
		}, { timeout: 200 });
	});

	it('should fetch eBay items with provided apiProps', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockResolvedValueOnce({ itemSummaries: [ebayItem], refinement: { aspectDistributions: [] } } as any);

		renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations?.ebay}
			/>
		);

		await waitFor(() => {
			expect(getEbayItemsMock).toHaveBeenCalledWith({ apiProps: pixelatedConfig.integrations?.ebay });
		});
	});

	it('renders the loading container before items load', async () => {
		const { container } = renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations?.ebay}
			/>
		);

		await waitFor(() => {
			expect(container.querySelector('#ebay-items')).toBeInTheDocument();
		});
	});

	it('renders the fallback loading state when the API returns no items', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockResolvedValueOnce({ itemSummaries: [], refinement: { aspectDistributions: [] } } as any);

		const { container } = renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations?.ebay}
			/>
		);

		await waitFor(() => {
			expect(container.querySelector('#ebay-items')).toBeInTheDocument();
		});
		expect(screen.queryByText('Store Items')).toBeNull();
	});

	it('loads and renders items when getEbayItems resolves', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockResolvedValueOnce({ itemSummaries: [ebayItem], refinement: { aspectDistributions: [] } } as any);
		
		renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations.ebay}
			/>
		);

		await screen.findByText(ebayItem.title);
		expect(screen.getByText(ebayItem.title)).toBeInTheDocument();
	});

	it('handles errors from getEbayItems without crashing', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockRejectedValueOnce(new Error('API failure'));

		renderWithProviders(
			<EbayItems
				apiProps={pixelatedConfig.integrations?.ebay}
			/>
		);

		await waitFor(() => {
			expect(getEbayItemsMock).toHaveBeenCalled();
		});

		expect(screen.queryByText('Store Items')).toBeNull();
	});

	describe('EbayListFilter component', () => {
		it('renders filter options and calls callback when selection changes', async () => {
			const aspectData = [
				{
					localizedAspectName: 'Color',
					aspectValueDistributions: [
						{ localizedAspectValue: 'Red' },
						{ localizedAspectValue: 'Blue' }
					]
				}
			];
			const callback = vi.fn();

			const { container } = renderWithProviders(
				<EbayListFilter aspects={aspectData as any} callback={callback} />
			);

			const aspectSelect = container.querySelector('#aspectName') as HTMLSelectElement;
			const valueSelect = container.querySelector('#aspectValue') as HTMLSelectElement;
			const filterButton = screen.getByRole('button', { name: /Filter/i });

			fireEvent.change(aspectSelect, { target: { value: 'Color' } });
			await waitFor(() => expect(valueSelect.disabled).toBe(false));

			fireEvent.change(valueSelect, { target: { value: 'Red' } });
			fireEvent.click(filterButton);

			expect(callback).toHaveBeenCalledWith({ aspectName: 'Color', aspectValue: 'Red' });
		});
	});

	describe('EbayItemHeader component', () => {
		it('renders a link when a url is provided', () => {
			renderWithProviders(
				<EbayItemHeader title="Test Product" url="https://example.com" target="_blank" />
			);

			expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
			expect(screen.getByText('Test Product')).toBeInTheDocument();
		});

		it('renders plain text when no url is provided', () => {
			renderWithProviders(<EbayItemHeader title="Plain Title" />);
			expect(screen.getByText('Plain Title')).toBeInTheDocument();
		});
	});

	describe('EbayListItem component', () => {
		it('renders item details and fallback quantity when categories do not match', () => {
			const item = {
				legacyItemId: '123',
				title: 'Fallback Product',
				thumbnailImages: [{ imageUrl: 'https://example.com/test.jpg' }],
				price: { value: '24.00', currency: 'USD' },
				condition: 'New',
				seller: { username: 'seller123', feedbackScore: 10, feedbackPercentage: 95 },
				buyingOptions: ['BUY_IT_NOW'],
				itemLocation: { postalCode: '94016', country: 'US' },
				itemCreationDate: '2024-01-01',
				categories: [{ categoryId: 'other' }],
				itemWebUrl: 'https://example.com/item',
			};

			renderWithProviders(
				<EbayListItem apiProps={{ itemCategory: 'different' } as any} cloudinaryProductEnv={undefined} item={item as any} />
			);

			expect(screen.getByRole('img')).toBeInTheDocument();
			expect(screen.getByText(/Item ID:/)).toBeInTheDocument();
		});

		it('renders quantity as 1 when item category matches apiProps.itemCategory', () => {
			const item = {
				legacyItemId: '456',
				title: 'Matched Category Product',
				thumbnailImages: [{ imageUrl: 'https://example.com/test2.jpg' }],
				price: { value: '99.00', currency: 'USD' },
				condition: 'New',
				seller: { username: 'seller456', feedbackScore: 55, feedbackPercentage: 98 },
				buyingOptions: ['BUY_IT_NOW'],
				itemLocation: { postalCode: '94016', country: 'US' },
				itemCreationDate: '2024-01-01',
				categories: [{ categoryId: 'category-123' }],
				itemWebUrl: 'https://example.com/item2',
			};

			renderWithProviders(
				<EbayListItem apiProps={{ itemCategory: 'category-123' } as any} cloudinaryProductEnv={undefined} item={item as any} />
			);

			const quantityDiv = screen.getByText('Quantity:').closest('div');
			expect(quantityDiv).toHaveTextContent('Quantity: 1');
		});
	});

	describe('EbayItemDetail component', () => {
		it('loads and renders ebay item details from getEbayItem', async () => {
			const getEbayItemMock = vi.mocked(ebayFunctions.getEbayItem, true);
			getEbayItemMock.mockResolvedValueOnce({
				legacyItemId: 'detail-123',
				title: 'Detail Product',
				additionalImages: [{ imageUrl: 'https://example.com/detail.jpg' }],
				description: '<p>Detailed description</p>',
				categoryId: 'cat-001',
				categoryPath: 'Category > Subcategory',
				condition: 'Used',
				seller: { username: 'sellerdetail', feedbackScore: 42, feedbackPercentage: 80 },
				buyingOptions: ['AUCTION'],
				itemLocation: { city: 'Austin', stateOrProvince: 'TX' },
				itemCreationDate: '2024-02-02',
				price: { value: '49.99', currency: 'USD' },
				itemWebUrl: 'https://example.com/detail',
			} as any);

			renderWithProviders(
				<EbayItemDetail apiProps={{ itemCategory: 'cat-001' } as any} itemID="detail-123" />
			);

			await screen.findByText('Detail Product');
			expect(screen.getByText(/Item ID:/)).toBeInTheDocument();
			expect(screen.getByText(/Category:/)).toBeInTheDocument();
			expect(screen.getByText(/Location:/)).toBeInTheDocument();
		});
	});

	describe('EbayRateLimitsVisualizer component', () => {
		it('auto-fetches token and can display mock rate-limit data', async () => {
			const getEbayAppTokenMock = vi.mocked(ebayFunctions.getEbayAppToken, true);
			const getEbayRateLimitsMock = vi.mocked(ebayFunctions.getEbayRateLimits, true);
			getEbayAppTokenMock.mockResolvedValueOnce('test-token-123');
			getEbayRateLimitsMock.mockResolvedValueOnce({
				rate_limit: {
					apiContext: 'Buy',
					apiName: 'Browse',
					apiVersion: 'v1',
					resources: [{
						resourceName: 'item_summary',
						methods: [{ methodName: 'search', quotaTotal: 5000, quotaRemaining: 4990, quotaResets: '2026-01-10T00:00:00.000Z' }]
					}]
				}
			} as any);

			renderWithProviders(
				<EbayRateLimitsVisualizer apiProps={{ appId: 'app-id', appCertId: 'app-cert' } as any} />
			);

			await screen.findByDisplayValue('test-token-123');
			const fetchButton = screen.getByRole('button', { name: /Fetch Rate Limits/i });
			fireEvent.click(fetchButton);

			await screen.findByText(/Response Data:/i);
			expect(screen.getByText(/rate_limit/)).toBeInTheDocument();
		});

		it('shows error when fetch rate limits fails with invalid token', async () => {
			const getEbayAppTokenMock = vi.mocked(ebayFunctions.getEbayAppToken, true);
			const getEbayRateLimitsMock = vi.mocked(ebayFunctions.getEbayRateLimits, true);
			getEbayAppTokenMock.mockResolvedValueOnce('bad-token');
			getEbayRateLimitsMock.mockRejectedValueOnce(new Error('Invalid token'));

			renderWithProviders(
				<EbayRateLimitsVisualizer apiProps={{ appId: 'app-id', appCertId: 'app-cert' } as any} />
			);

			await screen.findByDisplayValue('bad-token');
			const fetchButton = screen.getByRole('button', { name: /Fetch Rate Limits/i });
			fireEvent.click(fetchButton);

			await screen.findByText(/Error:/i);
			expect(screen.getByText(/Invalid token/i)).toBeInTheDocument();
		});

		it('loads sample structure when button clicked', async () => {
			renderWithProviders(
				<EbayRateLimitsVisualizer apiProps={{ appId: 'app-id', appCertId: 'app-cert' } as any} />
			);

			const sampleButton = screen.getByRole('button', { name: /Load Sample Structure/i });
			fireEvent.click(sampleButton);

			await screen.findByText(/rate_limit/);
			expect(screen.getByText(/user_rate_limit/)).toBeInTheDocument();
		});
	});
});

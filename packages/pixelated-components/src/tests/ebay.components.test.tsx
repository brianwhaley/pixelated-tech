import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor, screen } from '@testing-library/react';
import { EbayItems, EbayListFilter, EbayItemHeader, EbayListItem, getShoppingCartItem } from '../components/shoppingcart/ebay.components';
import * as ebayFunctions from '../components/shoppingcart/ebay.functions';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		ebay: { maxResults: 10 },
		cloudinary: { baseUrl: 'https://res.cloudinary.com', transforms: 'f_auto' },
	})),
}));

vi.mock('../components/integrations/cloudinary', () => ({
	getCloudinaryRemoteFetchURL: vi.fn(({ url }) => `https://cloudinary.com/${url}`),
}));

vi.mock('../components/shoppingcart/ebay.functions', async () => {
	const actual = await vi.importActual<typeof import('../components/shoppingcart/ebay.functions')>('../components/shoppingcart/ebay.functions');
	return {
		...actual,
		getEbayItems: vi.fn(),
	};
});

afterEach(() => {
	cleanup();
});

describe('EbayItems component', () => {
	const mockItem = {
		legacyItemId: 'ITEM-1',
		title: 'Mock Item',
		price: { value: '25.00', currency: 'USD' },
		thumbnailImages: [{ imageUrl: 'https://example.com/image.jpg' }],
		categories: [{ categoryId: 'electronics' }],
		categoryId: 'electronics',
		condition: 'New',
		seller: { username: 'seller1', feedbackScore: 100, feedbackPercentage: 99.9 },
		buyingOptions: ['BuyItNow'],
		itemLocation: { postalCode: '12345', country: 'US' },
		itemCreationDate: '2025-01-01',
		itemWebUrl: 'https://example.com/item/ITEM-1',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('exports EbayItems as a function', () => {
		expect(typeof EbayItems).toBe('function');
	});

	it('renders the loading container before items load', async () => {
		const { container } = render(
			<EbayItems
				apiProps={{
					proxyURL: '',
					baseTokenURL: '',
					baseSearchURL: '',
					qsSearchURL: '',
					baseItemURL: '',
					qsItemURL: '',
					baseAnalyticsURL: '',
					appId: '',
					appCertId: '',
					globalId: '',
					itemCategory: 'electronics',
				}}
			/>
		);

		await waitFor(() => {
			expect(container.querySelector('#ebay-items')).toBeInTheDocument();
		});
	});

	it('loads and renders items when getEbayItems resolves', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockResolvedValueOnce({ itemSummaries: [mockItem], refinement: { aspectDistributions: [] } } as any);

		render(
			<EbayItems
				apiProps={{
					proxyURL: '',
					baseTokenURL: '',
					baseSearchURL: '',
					qsSearchURL: '',
					baseItemURL: '',
					qsItemURL: '',
					baseAnalyticsURL: '',
					appId: '',
					appCertId: '',
					globalId: '',
					itemCategory: 'electronics',
				}}
			/>
		);

		await waitFor(() => {
			expect(screen.getByText('Item ID:')).toBeInTheDocument();
		});

		expect(getEbayItemsMock).toHaveBeenCalledTimes(1);
	});

	it('logs an error when getEbayItems rejects', async () => {
		const getEbayItemsMock = vi.mocked(ebayFunctions.getEbayItems, true);
		getEbayItemsMock.mockRejectedValueOnce(new Error('fetch failed'));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		render(
			<EbayItems
				apiProps={{
					proxyURL: '',
					baseTokenURL: '',
					baseSearchURL: '',
					qsSearchURL: '',
					baseItemURL: '',
					qsItemURL: '',
					baseAnalyticsURL: '',
					appId: '',
					appCertId: '',
					globalId: '',
					itemCategory: 'electronics',
				}}
			/>
		);

		await waitFor(() => {
			expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Error fetching eBay items:'), expect.any(Error));
		});

		expect(getEbayItemsMock).toHaveBeenCalledTimes(1);
	});
});

describe('ebay.components - helper list components', () => {
	it('should render EbayListFilter and call callback when aspects are selected', async () => {
		const callback = vi.fn();
		const aspects = [
			{
				localizedAspectName: 'Color',
				aspectValueDistributions: [
					{ localizedAspectValue: 'Red' },
					{ localizedAspectValue: 'Blue' }
				]
			},
			{
				localizedAspectName: 'Size',
				aspectValueDistributions: [
					{ localizedAspectValue: 'Small' },
					{ localizedAspectValue: 'Large' }
				]
			}
		];

		render(<EbayListFilter aspects={aspects} callback={callback} />);

		const aspectNameSelect = screen.getByLabelText('Aspect:') as HTMLSelectElement;
		expect(aspectNameSelect).toBeTruthy();

		fireEvent.change(aspectNameSelect, { target: { value: 'Size' } });
		const aspectValueSelect = screen.getByLabelText('Value:') as HTMLSelectElement;
		expect(aspectValueSelect.options.length).toBeGreaterThan(1);

		fireEvent.change(aspectValueSelect, { target: { value: 'Small' } });
		fireEvent.click(screen.getByText('Filter'));

		await waitFor(() => {
			expect(callback).toHaveBeenCalledWith({ aspectName: 'Size', aspectValue: 'Small' });
		});
	});

	it('should return null for EbayListFilter when aspects is not an array', () => {
		render(<EbayListFilter aspects={undefined as any} callback={vi.fn()} />);
		expect(screen.queryByRole('form')).toBeNull();
	});

	it('should render EbayItemHeader title as a link when url is provided', () => {
		render(<EbayItemHeader title="Item Title" url="https://example.com/item" target="_blank" />);

		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', 'https://example.com/item');
		expect(link).toHaveAttribute('target', '_blank');
		expect(screen.getByText('Item Title')).toBeTruthy();
	});

	it('should render EbayItemHeader as plain text when no url is provided', () => {
		render(<EbayItemHeader title="Item Title" />);

		expect(screen.queryByRole('link')).toBeNull();
		expect(screen.getByText('Item Title')).toBeTruthy();
	});

	it('should render EbayListItem with fallback content when no images are available', () => {
		const item = {
			legacyItemId: 'ITEM-123',
			title: 'Test Item',
			price: { value: '49.99', currency: 'USD' },
			thumbnailImages: undefined,
			image: undefined,
			categories: [],
			categoryId: '100',
			condition: 'New',
			seller: { username: 'seller1', feedbackScore: 100, feedbackPercentage: 99.9 },
			buyingOptions: ['BuyItNow'],
			itemLocation: { postalCode: '12345', country: 'US' },
			itemCreationDate: '2025-01-01',
		};

		const { container } = render(<EbayListItem item={item as any} apiProps={{ itemCategory: 'other' }} />);

		expect(container.querySelector('.ebay-item')).toBeInTheDocument();
		expect(container.querySelector('.ebay-item-details')).toBeInTheDocument();
		expect(container.textContent).toContain('Condition:');
	});

	it('should render EbayListItem and display item details', () => {
		const item = {
			legacyItemId: 'ITEM-123',
			title: 'Test Item',
			price: { value: '49.99', currency: 'USD' },
			thumbnailImages: [{ imageUrl: 'https://example.com/image.jpg' }],
			image: { imageUrl: 'https://example.com/image.jpg' },
			categories: [{ categoryId: '100' }],
			categoryId: '100',
			condition: 'New',
			seller: { username: 'seller1', feedbackScore: 100, feedbackPercentage: 99.9 },
			buyingOptions: ['BuyItNow'],
			itemLocation: { postalCode: '12345', country: 'US' },
			itemCreationDate: '2025-01-01',
		};

		const { container } = render(<EbayListItem item={item as any} apiProps={{ itemCategory: '100' }} />);

		expect(container.querySelector('.ebay-item')).toBeInTheDocument();
		expect(screen.getByText('Item ID:')).toBeTruthy();
		expect(screen.getByText('Quantity:')).toBeTruthy();
		expect(screen.getByText(/Condition:/)).toBeTruthy();
		expect(screen.getByText('Seller:')).toBeTruthy();
		expect(screen.getByText('Location:')).toBeTruthy();
		expect(screen.getByText('$49.99 USD')).toBeTruthy();
	});

	it('should return shopping cart item with cloudinary transform when env is provided', () => {
		const item = {
			legacyItemId: 'ITEM-789',
			price: { value: '99.99', currency: 'USD' },
			thumbnailImages: [{ imageUrl: 'https://example.com/image.jpg' }],
			image: { imageUrl: 'https://example.com/fallback.jpg' },
			itemWebUrl: 'https://example.com/product',
			categories: [{ categoryId: 'electronics' }],
			categoryId: 'electronics',
			title: 'Ebay Product',
			condition: 'New',
			seller: { username: 'seller1', feedbackScore: 100, feedbackPercentage: 99.9 },
		};

		const cartItem = getShoppingCartItem({
			thisItem: item as any,
			cloudinaryProductEnv: 'production',
			apiProps: { itemCategory: 'electronics' },
		});

		expect(cartItem.itemQuantity).toBe(1);
		expect(cartItem.itemID).toBe('ITEM-789');
		expect(cartItem.itemCost).toBe('99.99');
		expect(cartItem.itemURL).toBe('https://example.com/product');
		expect(cartItem.itemImageURL).toContain('cloudinary.com');
	});

	it('should return shopping cart item without cloudinary transform when env is not provided', () => {
		const item = {
			legacyItemId: 'ITEM-999',
			price: { value: '19.95', currency: 'USD' },
			thumbnailImages: [{ imageUrl: 'https://example.com/image.jpg' }],
			image: { imageUrl: 'https://example.com/fallback.jpg' },
			itemWebUrl: 'https://example.com/product',
			categories: [{ categoryId: 'electronics' }],
			categoryId: 'electronics',
			title: 'No Transform Product',
			condition: 'Used',
			seller: { username: 'seller1', feedbackScore: 50, feedbackPercentage: 80 },
		};

		const cartItem = getShoppingCartItem({
			thisItem: item as any,
			apiProps: { itemCategory: 'electronics' },
		});

		expect(cartItem.itemImageURL).toBe('https://example.com/image.jpg');
	});
});

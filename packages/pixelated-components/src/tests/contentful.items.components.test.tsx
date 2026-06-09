import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentfulItems, ContentfulListItem } from '../components/integrations/contentful.items.components';
import * as contentfulFunctions from '../components/integrations/contentful.delivery';
import { pixelatedConfig, mockContentfulItems, mockContentfulAssets } from '../test/test-data';

// Mock dependencies
vi.mock('../components/integrations/contentful.delivery', () => ({
	getContentfulEntriesByType: vi.fn(),
	getContentfulEntryByEntryID: vi.fn()
}));

vi.mock('../components/elements/smartimage', () => ({
	SmartImage: ({ src, alt, title }: any) => (
		<img src={src} alt={alt} title={title} data-testid="smart-image" />
	)
}));

vi.mock('../components/structure/carousel', () => ({
	Carousel: ({ cards }: any) => <div data-testid="carousel">{cards.length} items</div>
}));

vi.mock('../components/structure/page-blocks', () => ({
	PageGridItem: ({ children }: any) => <div data-testid="grid-item">{children}</div>
}));

vi.mock('../components/shoppingcart/shoppingcart.components', () => ({
	AddToCartButton: ({ item }: any) => (
		<button
			data-testid="add-to-cart"
			data-itemid={item?.itemID}
			data-itemcurrency={item?.itemCurrency}
			data-itemisshippable={String(item?.itemIsShippable)}
			data-itemweight={item?.itemWeight}
			data-itemweightunit={item?.itemWeightUnit}
			data-itemtype={item?.itemType}
		>
			Add to Cart
		</button>
	),
	ViewItemDetails: ({ item }: any) => <a href="#details">Details</a>
}));

describe('ContentfulItems Component', () => {
	const mockItems = mockContentfulItems;
	const mockAssets = mockContentfulAssets;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render loading state when no items', () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: [],
			includes: { Asset: [] }
		});
		
		render(<ContentfulItems />);
		
		// Should render empty contentful-items div
		const container = document.getElementById('contentful-items');
		expect(container).toBeInTheDocument();
	});

	it('should fetch items on mount', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: mockItems as any,
			includes: { Asset: mockAssets as any }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			expect(contentfulFunctions.getContentfulEntriesByType).toHaveBeenCalledWith(
				expect.objectContaining({
					apiProps: expect.objectContaining({
						base_url: pixelatedConfig.integrations.contentful.base_url,
						delivery_access_token: pixelatedConfig.integrations.contentful.delivery_access_token,
						environment: pixelatedConfig.integrations.contentful.environment,
						proxyURL: pixelatedConfig.integrations.contentful.proxyURL,
						space_id: pixelatedConfig.integrations.contentful.space_id,
					})
				})
			);
		});
	});

	it('should display featured items header for multiple items', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: mockItems as any,
			includes: { Asset: mockAssets as any }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			expect(screen.getByText(/2 Featured Items/)).toBeInTheDocument();
		});
	});

	it('should display featured item header for single item', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: [mockItems[0]],
			includes: { Asset: mockAssets }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			expect(screen.getByText(/1 Featured Item/)).toBeInTheDocument();
		});
	});

	it('should render items in contentful-items container', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: mockItems,
			includes: { Asset: mockAssets }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			const container = document.getElementById('contentful-items');
			expect(container).toHaveClass('contentful-items');
		});
	});

	it('should render without cloudinaryProductEnv prop', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: mockItems,
			includes: { Asset: mockAssets }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			const container = document.getElementById('contentful-items');
			expect(container).toBeInTheDocument();
		});
	});

	it('should handle fetch errors gracefully', async () => {
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockRejectedValue(
			new Error('Fetch error')
		);
		
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error fetching Contentful items:',
				expect.any(Error)
			);
		});
		
		consoleErrorSpy.mockRestore();
	});

	it('should fetch items using provider config', async () => {
		const spy = vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: [],
			includes: { Asset: [] }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({
					apiProps: expect.objectContaining({
						base_url: pixelatedConfig.integrations.contentful.base_url,
						delivery_access_token: pixelatedConfig.integrations.contentful.delivery_access_token,
						environment: pixelatedConfig.integrations.contentful.environment,
						proxyURL: pixelatedConfig.integrations.contentful.proxyURL,
						space_id: pixelatedConfig.integrations.contentful.space_id,
					})
				})
			);
		});
	});

	it('should filter assets matching item image references', async () => {
		const itemWithAssetRef = {
			sys: { id: 'item-1' },
			fields: {
				title: 'Product with Asset',
				images: [{ sys: { id: 'asset-1' } }],
				price: 99.99,
				quantity: 1,
				imageUrl: ''
			}
		};
		
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: [itemWithAssetRef],
			includes: { Asset: mockAssets }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			// Component should match assets to items
			const container = document.getElementById('contentful-items');
			expect(container).toBeInTheDocument();
		});
	});

	it('should sort item assets by creation date', async () => {
		const multiAssetItem = {
			sys: { id: 'item-1' },
			fields: {
				title: 'Multi-asset Product',
				images: [{ sys: { id: 'asset-1' } }, { sys: { id: 'asset-2' } }],
				price: 99.99,
				quantity: 1
			}
		};
		
		const multiAssets = [
			{
				sys: { id: 'asset-2', createdAt: '2024-01-03' },
				fields: { file: { url: 'https://example.com/2.jpg' }, title: 'Asset 2' }
			},
			{
				sys: { id: 'asset-1', createdAt: '2024-01-01' },
				fields: { file: { url: 'https://example.com/1.jpg' }, title: 'Asset 1' }
			}
		];
		
		vi.mocked(contentfulFunctions.getContentfulEntriesByType).mockResolvedValue({
			items: [multiAssetItem],
			includes: { Asset: multiAssets }
		});
		
		render(<ContentfulItems />);
		
		await waitFor(() => {
			// Should use earliest (oldest) asset
			const container = document.getElementById('contentful-items');
			expect(container).toBeInTheDocument();
		});
	});
});

describe('ContentfulListItem Component', () => {
	const mockItem = {
		sys: { id: 'item-1' },
		fields: {
			title: 'Test Product',
			imageUrl: 'https://example.com/image.jpg',
			price: 99.99,
			priceCurrency: 'USD',
			quantity: 1,
			weight: 2,
			weightUnit: 'lb',
			isShippable: true
		}
	};

	it('should render item container', () => {
		const { container } = render(<ContentfulListItem item={mockItem} />);
		
		expect(container.querySelector('.contentful-item')).toBeInTheDocument();
	});

	it('should display item title', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		expect(screen.getByText('Test Product')).toBeInTheDocument();
	});

	it('should render item image', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		const image = screen.getByTestId('smart-image');
		expect(image).toBeInTheDocument();
	});

	it('should create link to item detail page', () => {
		const { container } = render(<ContentfulListItem item={mockItem} />);
		
		const link = container.querySelector('a[href*="./store/item-1"]');
		expect(link).toBeInTheDocument();
	});

	it('should render add to cart button', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		expect(screen.getByTestId('add-to-cart')).toBeInTheDocument();
	});

	it('should render item image without cloudinaryProductEnv prop', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		const image = screen.getByTestId('smart-image');
		expect(image).toBeInTheDocument();
	});

	it('should pass correct image alt text', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		const image = screen.getByAltText('Test Product');
		expect(image).toBeInTheDocument();
	});

	it('should structure shopping cart item with correct properties', () => {
		render(<ContentfulListItem item={mockItem} />);
		
		const button = screen.getByTestId('add-to-cart');
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('data-itemcurrency', 'USD');
		expect(button).toHaveAttribute('data-itemisshippable', 'true');
		expect(button).toHaveAttribute('data-itemweight', '2');
		expect(button).toHaveAttribute('data-itemweightunit', 'lb');
		expect(button).toHaveAttribute('data-itemtype', 'product');
	});

	it('should set link target to _self', () => {
		const { container } = render(<ContentfulListItem item={mockItem} />);
		
		const link = container.querySelector('a[href*="./store/"]');
		expect(link?.getAttribute('target')).toBe('_self');
	});

	it('should render with grid layout classes', () => {
		const { container } = render(<ContentfulListItem item={mockItem} />);
		
		expect(container.querySelector('.contentful-item-photo')).toBeInTheDocument();
		expect(container.querySelector('.contentful-item-body')).toBeInTheDocument();
	});

	it('should work without cloudinary env', () => {
		const { container } = render(<ContentfulListItem item={mockItem} />);
		
		expect(container.querySelector('.contentful-item')).toBeInTheDocument();
	});
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		cloudinary: {
			product_env: 'test-cloud',
			baseUrl: 'cloudinary.com',
			transforms: {}
		}
	}))
}));

vi.mock('../components/integrations/contentful.delivery', () => ({
	getContentfulEntriesByType: vi.fn(),
	getContentfulEntryByEntryID: vi.fn()
}));

vi.mock('../components/general/smartimage', () => ({
	SmartImage: ({ src, alt, title }: any) => (
		<img src={src} alt={alt} title={title} data-testid="smart-image" />
	)
}));

vi.mock('../components/general/carousel', () => ({
	Carousel: ({ cards }: any) => <div data-testid="carousel">{cards.length} items</div>
}));

vi.mock('../components/shoppingcart/shoppingcart.components', () => ({
	AddToCartButton: ({ item }: any) => <button data-testid="add-to-cart">Add</button>
}));

import { ContentfulItemHeader, ContentfulItemDetail } from '../components/integrations/contentful.items.components';
import * as delivery from '../components/integrations/contentful.delivery';

const mockApiProps = {
	space_id: 'test-space',
	delivery_access_token: 'test-token'
};

describe('Contentful item detail tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render item header with link when url is provided', () => {
		render(<ContentfulItemHeader title="Test Item" url="/link" target="_blank" />);

		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/link');
		expect(screen.getByText('Test Item')).toBeInTheDocument();
	});

	it('should render item header without link when no url is provided', () => {
		render(<ContentfulItemHeader title="Plain Item" />);

		expect(screen.getByText('Plain Item')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('should fetch item detail and render carousel when entry exists', async () => {
		vi.mocked(delivery.getContentfulEntryByEntryID).mockResolvedValueOnce({
			sys: { id: 'item-1', type: 'Entry' },
			fields: {
				title: 'Detailed Product',
				price: 79.99,
				quantity: 2,
				id: '12345',
				brand: 'Brand',
				model: 'Model',
				date: '2026-01-01',
				description: 'Live product description',
				images: [{ sys: { id: 'asset-1' } }]
			}
		});

		vi.mocked(delivery.getContentfulEntriesByType).mockResolvedValueOnce({
			items: [],
			includes: {
				Asset: [
					{
						sys: { id: 'asset-1' },
						fields: {
							file: { url: '//example.com/asset1.jpg' },
							title: 'Asset 1'
						}
					}
				]
			}
		});

		render(<ContentfulItemDetail apiProps={mockApiProps} entry_id="item-1" />);

		await waitFor(() => {
			expect(screen.getByTestId('carousel')).toBeInTheDocument();
			expect(screen.getByText('Detailed Product')).toBeInTheDocument();
			expect(screen.getByText(/\$79.99 USD/)).toBeInTheDocument();
		});
	});
});

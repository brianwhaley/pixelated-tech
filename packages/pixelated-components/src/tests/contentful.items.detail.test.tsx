import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pixelatedConfig, mockContentfulItemsDetail } from '../test/test-data';

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

vi.mock('../components/shoppingcart/shoppingcart.components', () => ({
	AddToCartButton: ({ item }: any) => <button data-testid="add-to-cart">Add</button>
}));

import { ContentfulItemHeader, ContentfulItemDetail } from '../components/integrations/contentful.items.components';
import * as delivery from '../components/integrations/contentful.delivery';

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
		vi.mocked(delivery.getContentfulEntryByEntryID).mockResolvedValueOnce(mockContentfulItemsDetail.mockContentfulEntry);

		vi.mocked(delivery.getContentfulEntriesByType).mockResolvedValueOnce(mockContentfulItemsDetail.mockContentfulEntries);

		render(<ContentfulItemDetail entry_id="item-1" />);

		await waitFor(() => {
			expect(delivery.getContentfulEntryByEntryID).toHaveBeenCalledWith(
				expect.objectContaining({
					apiProps: expect.objectContaining({
						base_url: pixelatedConfig.integrations.contentful.base_url,
						delivery_access_token: pixelatedConfig.integrations.contentful.delivery_access_token,
						environment: pixelatedConfig.integrations.contentful.environment,
						proxyURL: pixelatedConfig.integrations.contentful.proxyURL,
						space_id: pixelatedConfig.integrations.contentful.space_id,
					}),
					entry_id: 'item-1',
				})
			);
			expect(screen.getByTestId('carousel')).toBeInTheDocument();
			expect(screen.getByText('Detailed Product')).toBeInTheDocument();
			expect(screen.getByText(/\$79.99 USD/)).toBeInTheDocument();
		});
	});
});

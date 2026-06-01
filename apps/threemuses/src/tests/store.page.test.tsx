import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () =>
	createPageComponentMocks({
		SquareStoreItems: (props: any) => React.createElement('div', { 'data-testid': 'mock-square-store-items' }, props.title ?? 'Square Store Items'),
	})
);

vi.mock('@pixelated-tech/components/server', () => ({
	getSquareStoreItems: vi.fn(),
}));

import * as serverComponents from '@pixelated-tech/components/server';
const mockGetSquareStoreItems = serverComponents.getSquareStoreItems as ReturnType<typeof vi.fn>;

import StorePage from '@/app/(pages)/store/page';

describe('Store page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetPixelatedConfigOverride();
	});

	it('renders store items when the Square store returns data', async () => {
		mockGetSquareStoreItems.mockResolvedValueOnce({
			items: [
				{
					itemID: 'item-1',
					itemTitle: 'Artisan Tray',
					itemPrice: 45,
					itemCurrency: 'USD',
					itemInventory: 5,
					itemIsShippable: true,
				},
			],
			filters: [],
		});

		let element: React.ReactElement | null = null;
		await act(async () => {
			element = await StorePage();
		});
		if (!element) throw new Error('StorePage returned no element');
		render(element);

		await waitFor(() => expect(screen.getByTestId('mock-square-store-items')).toBeTruthy());
		expect(screen.getByText('Boutique Store')).toBeTruthy();
		expect(mockGetSquareStoreItems).toHaveBeenCalledTimes(1);
	});

	it('renders an empty state when no store items are available', async () => {
		mockGetSquareStoreItems.mockResolvedValueOnce({ items: [], filters: [] });

		let element: React.ReactElement | null = null;
		await act(async () => {
			element = await StorePage();
		});
		if (!element) throw new Error('StorePage returned no element');
		render(element);

		await waitFor(() => expect(screen.getByText('No boutique items available')).toBeTruthy());
	});

	it('renders an error state when the store fetch fails', async () => {
		mockGetSquareStoreItems.mockRejectedValueOnce(new Error('Store offline'));

		let element: React.ReactElement | null = null;
		await act(async () => {
			element = await StorePage();
		});
		if (!element) throw new Error('StorePage returned no element');
		render(element);

		await waitFor(() => expect(screen.getByText('Store loading error')).toBeTruthy());
	});
});

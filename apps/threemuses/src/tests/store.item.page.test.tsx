import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('next/navigation', () => ({
	notFound: vi.fn(() => {
		throw new Error('notFound');
	}),
}));

vi.mock('@pixelated-tech/components', () =>
	createPageComponentMocks({
		SquareStoreItemDetail: (props: any) => React.createElement('div', { 'data-testid': 'mock-square-store-item-detail' }, props.item?.itemTitle ?? 'Store Item Detail'),
	})
);

vi.mock('@pixelated-tech/components/server', () => ({
	getSquareStoreItemById: vi.fn(),
}));

import * as serverComponents from '@pixelated-tech/components/server';
const mockGetSquareStoreItemById = serverComponents.getSquareStoreItemById as ReturnType<typeof vi.fn>;
import StoreItemPage from '@/app/(pages)/store/[item]/page';

const exampleItem = {
	itemID: 'item-1',
	itemTitle: 'Artisan Tray',
	itemDescription: 'A handcrafted ceramic tray.',
	itemPrice: 45,
	itemCurrency: 'USD',
	itemInventory: 5,
	itemIsShippable: true,
};

describe('Store item page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetPixelatedConfigOverride();
	});

	it('renders the store item detail page when the item exists', async () => {
		mockGetSquareStoreItemById.mockResolvedValueOnce(exampleItem);

		let element: React.ReactElement | null = null;
		await act(async () => {
			element = await StoreItemPage({ params: Promise.resolve({ item: 'item-1' }) as any });
		});
		if (!element) throw new Error('StoreItemPage returned no element');
		render(element);

		await waitFor(() => expect(screen.getByTestId('mock-square-store-item-detail')).toBeTruthy());
		const detail = screen.getByTestId('mock-square-store-item-detail');
		expect(detail.textContent).toContain('Artisan Tray');
	});

	it('throws notFound when the item cannot be found', async () => {
		mockGetSquareStoreItemById.mockResolvedValueOnce(null);

		await expect(async () => {
			await StoreItemPage({ params: Promise.resolve({ item: 'missing' }) as any });
		}).rejects.toThrow('notFound');
	});
});

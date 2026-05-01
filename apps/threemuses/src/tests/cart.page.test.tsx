import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getCart: () => [],
	getCartItemCount: () => 0,
	getCartSubTotal: () => 0,
	formatAsHundredths: (value: number) => value,
	smartFetch: async () => ({ success: true }),
	ShoppingCart: () => <div data-testid="mock-shoppingcart" />,
}));

import CartPage from '@/app/(pages)/cart/page';

describe('Cart page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the cart page and shopping cart', async () => {
		render(<CartPage />);
		await waitFor(() => expect(screen.getByTestId('mock-shoppingcart')).not.toBeNull());
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Shopping Cart');
	});
});

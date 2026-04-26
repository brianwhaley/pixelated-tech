import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '../test/test-utils';
import { createMockConfig } from '../test/config.mock';
import { ShoppingCart } from '../components/shoppingcart/shoppingcart.components';
import { setCart, setShippingInfo, clearShoppingCart } from '../components/shoppingcart/shoppingcart.functions';

vi.mock('../components/shoppingcart/paypal.components', () => ({
	PayPalCheckout: ({ onApprove }: any) => (
		<button data-testid="paypal-checkout" onClick={() => onApprove({ data: 'paypal-success' })}>
			PayPal Checkout
		</button>
	),
}));

vi.mock('../components/shoppingcart/square.components', async () => {
	const actual = await vi.importActual<typeof import('../components/shoppingcart/square.components')>('../components/shoppingcart/square.components');
	return {
		...actual,
		SquareCheckout: ({ onApprove }: any) => (
			<button data-testid="square-checkout" onClick={() => onApprove({ data: 'square-success' })}>
				Square Checkout
			</button>
		),
	};
});

vi.mock('../components/sitebuilder/form/formsubmit', () => ({
	emailJSON: vi.fn(),
}));

vi.mock('../components/shoppingcart/shoppingcart.functions', async () => {
	const actual = await vi.importActual<typeof import('../components/shoppingcart/shoppingcart.functions')>('../components/shoppingcart/shoppingcart.functions');
	return {
		...actual,
		getRemoteDiscountCodes: vi.fn(async () => []),
	};
});

describe('ShoppingCart provider selection and approval integration', () => {
	beforeEach(() => {
		clearShoppingCart();
		localStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		clearShoppingCart();
		localStorage.clear();
	});

	async function renderWithConfig(config: any) {
		let result: any;
		await act(async () => {
			result = render(<ShoppingCart />, { config: createMockConfig(config) });
		});
		return result;
	}

	function setShoppingState() {
		setCart([
			{
				itemID: 'item-1',
				itemTitle: 'Test Item',
				itemQuantity: 1,
				itemCost: 10,
			},
		]);
		setShippingInfo({
			name: 'Test User',
			street1: '123 Main St',
			city: 'Testville',
			state: 'NY',
			zip: '10001',
			country: 'US',
		});
	}

	it('renders SquareCheckout when shoppingcart.provider is square and Square is configured', async () => {
		await act(async () => {
			setShoppingState();
		});

		renderWithConfig({
			shoppingcart: { provider: 'square' },
			square: { applicationId: 'app-id', locationId: 'location-id' },
		});

		await waitFor(() => {
			expect(screen.getByTestId('square-checkout')).toBeInTheDocument();
		});
	});

	it('renders PayPalCheckout when shoppingcart.provider is paypal and PayPal is configured', async () => {
		await act(async () => {
			setShoppingState();
		});

		renderWithConfig({
			shoppingcart: { provider: 'paypal' },
			square: { applicationId: '', locationId: '' },
		});

		await waitFor(() => {
			expect(screen.getByTestId('paypal-checkout')).toBeInTheDocument();
		});
	});

	it('transitions to Thank You state when provider onApprove is called', async () => {
		await act(async () => {
			setShoppingState();
		});

		renderWithConfig({
			shoppingcart: { provider: 'square' },
			square: { applicationId: 'app-id', locationId: 'location-id' },
		});

		const checkoutButton = await screen.findByTestId('square-checkout');
		fireEvent.click(checkoutButton);

		await waitFor(() => {
			expect(screen.getByText(/Thank you for your payment!/i)).toBeInTheDocument();
		});
	});
});

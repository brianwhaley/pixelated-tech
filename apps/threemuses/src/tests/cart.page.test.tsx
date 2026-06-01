import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

const cartTestState = vi.hoisted(() => ({
	items: [] as any[],
	shoppingCartProps: null as any,
}));

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getCart: () => cartTestState.items,
	getCartItemCount: (cart: any[]) => cart.reduce((total, item) => total + (item?.itemQuantity ?? 1), 0),
	getCartSubTotal: (cart: any[]) => cart.reduce((total, item) => total + ((item?.itemCost ?? 0) * (item?.itemQuantity ?? 1)), 0),
	formatAsHundredths: (value: number) => value,
	ShoppingCart: (props: any) => {
		cartTestState.shoppingCartProps = props;
		return <div data-testid="mock-shoppingcart" />;
	},
}));

import CartPage from '@/app/(pages)/cart/page';

describe('Cart page', () => {
	beforeEach(() => {
		cartTestState.items = [];
		cartTestState.shoppingCartProps = null;
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the cart page and shopping cart', async () => {
		render(<CartPage />);
		await waitFor(() => expect(screen.getByTestId('mock-shoppingcart')).not.toBeNull());
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Shopping Cart');
	});

	it('includes adult and youth registration fields when the cart has those categories', async () => {
		cartTestState.items = [
			{ itemCategory: ['Adult', 'event'] },
			{ itemCategory: ['Summer Camp', 'event'] },
		];

		render(<CartPage />);
		await waitFor(() => expect(screen.getByTestId('mock-shoppingcart')).not.toBeNull());

		expect(cartTestState.shoppingCartProps.additionalInfoForm.fields.some((field: any) => field.props?.name === 'birthdate')).toBe(true);
		expect(cartTestState.shoppingCartProps.additionalInfoForm.fields.some((field: any) => field.props?.name === 'child_name')).toBe(true);
		expect(cartTestState.shoppingCartProps.additionalInfoForm.fields.some((field: any) => field.props?.name === 'full_payment')).toBe(true);
	});

	it('renders base registration fields when no adult or youth items are present', async () => {
		cartTestState.items = [
			{ itemCategory: ['Other'] },
		];

		render(<CartPage />);
		await waitFor(() => expect(screen.getByTestId('mock-shoppingcart')).not.toBeNull());

		expect(cartTestState.shoppingCartProps.additionalInfoForm.fields.some((field: any) => field.props?.name === 'full_payment')).toBe(true);
		expect(cartTestState.shoppingCartProps.additionalInfoForm.fields.some((field: any) => field.props?.name === 'child_name')).toBe(false);
	});
});

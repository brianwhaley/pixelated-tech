import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '../test/test-utils';
import {
	ShoppingCartItems,
	CheckoutInfoForm,
	CheckoutSummary,
	ShoppingCartReceipt,
	buildReceiptData,
	renderReceiptTable,
} from '../components/shoppingcart/shoppingcart.components';

vi.mock('../components/config/config.client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config.client')>();
	return {
		...actual,
		usePixelatedConfig: vi.fn(() => ({
			cloudinary: { product_env: 'prod', baseUrl: 'test', transforms: '' },
			shoppingcart: { currency: 'USD' },
		})),
	};
});

vi.mock('../components/shoppingcart/shoppingcart.functions', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/shoppingcart/shoppingcart.functions')>();
	return {
		...actual,
		clearShoppingCart: vi.fn(),
		removeFromShoppingCart: vi.fn(),
		getCartItemCount: vi.fn(() => 2),
		getCart: vi.fn(() => []),
		formatAsUSD: vi.fn((cost: number) => `$${cost.toFixed(2)}`),
		formatAsHundredths: vi.fn((cost: number) => cost.toFixed(2)),
	};
});

vi.mock('../components/sitebuilder/form/formcomponents', () => ({
	FormButton: ({ text, onClick, ...props }: any) => (
		<button type="button" onClick={onClick} {...props}>{text}</button>
	),
}));

vi.mock('../components/sitebuilder/form/formengine', () => ({
	COMPONENTS: {},
	FormEngine: ({ name, id, formData, onSubmitHandler }: any) => (
		<div
			data-testid="form-engine"
			data-name={name}
			data-id={id}
			data-form-data={JSON.stringify(formData)}
			data-has-submit={typeof onSubmitHandler === 'function'}
		/>
	),
}));

vi.mock('../components/general/table', () => ({
	Table: ({ id, data }: any) => (
		<div data-testid={id}>
			{data?.map((row: any, index: number) => (
				<div key={row.Name || row.Field || index}>
					<span>{row.Name || row.Field}</span>
					<span>{row.Value ?? Object.values(row).join(' ')}</span>
				</div>
			))}
		</div>
	),
}));

vi.mock('../components/general/modal', () => ({
	Modal: ({ modalContent }: any) => <div>{modalContent}</div>,
	handleModalOpen: vi.fn(),
}));

vi.mock('../components/general/smartimage', () => ({
	SmartImage: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

vi.mock('../components/general/pageheader', () => ({
	PageSectionHeader: ({ title }: any) => <h2>{title}</h2>,
}));

describe('shopping cart component surface', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders each shopping cart item and its shipping branch', () => {
		render(
			<ShoppingCartItems
				items={[
					{
						itemID: 'item-1',
						itemTitle: 'First Item',
						itemQuantity: 1,
						itemCost: 12.5,
						itemIsShippable: false,
					},
					{
						itemID: 'item-2',
						itemTitle: 'Second Item',
						itemQuantity: 2,
						itemCost: 7.25,
						itemIsShippable: true,
						itemWeight: 2,
						itemWeightUnit: 'oz',
					},
				] as any}
			/>
		);

		expect(screen.getByText('First Item')).toBeInTheDocument();
		expect(screen.getByText('Second Item')).toBeInTheDocument();
		expect(screen.getAllByText(/Non-shippable item/i)).not.toHaveLength(0);
		expect(screen.getAllByText(/Weight:/i)).not.toHaveLength(0);
		expect(screen.getAllByRole('button', { name: /Remove/i })).toHaveLength(2);
	});

	it('renders checkout info through the form engine wrapper', () => {
		render(
			<CheckoutInfoForm
				checkoutFormData={{ fields: [{ name: 'email' }] }}
				onShippingSubmit={vi.fn()}
			/>
		);

		const formEngine = screen.getByTestId('form-engine');
		expect(formEngine).toHaveAttribute('data-name', 'checkout_shipping');
		expect(formEngine).toHaveAttribute('data-id', 'checkout_shipping');
		expect(formEngine).toHaveAttribute('data-has-submit', 'true');
		expect(formEngine).toHaveAttribute('data-form-data', JSON.stringify({ fields: [{ name: 'email' }] }));
	});

	it('renders the checkout summary and passes provider props through', () => {
		const onBackToCart = vi.fn();
		const handlePaymentSuccess = vi.fn();
		const PaymentProviderComponent = vi.fn(({ checkoutData, onApprove }: any) => (
			<div
				data-testid="payment-provider"
				data-has-checkout-data={Boolean(checkoutData)}
				data-has-on-approve={typeof onApprove === 'function'}
			/>
		));

		render(
			<CheckoutSummary
				effectiveCheckoutData={{
					items: [{ itemID: 'item-1', itemTitle: 'First Item', itemQuantity: 1, itemCost: 12.5 }],
					shippingTo: {
						name: 'Jane Doe',
						street1: '123 Main St',
						city: 'Austin',
						state: 'TX',
						zip: '78701',
						country: 'US',
						shippingMethod: 'USPS-GA',
					},
					subtotal_discount: 0,
					subtotal: 12.5,
					shippingCost: 9.99,
					handlingFee: 1.5,
					salesTax: 1,
					total: 24.99,
				} as any}
				checkoutShippingWeight={2}
				PaymentProviderComponent={PaymentProviderComponent as any}
				paymentProviderProps={{ provider: 'mock' }}
				onBackToCart={onBackToCart}
				handlePaymentSuccess={handlePaymentSuccess}
			/>
		);

		expect(screen.getByText(/Shopping Cart Items/i)).toBeInTheDocument();
		expect(screen.getByText(/Payment Options :/i)).toBeInTheDocument();
		expect(screen.getByTestId('payment-provider')).toHaveAttribute('data-has-checkout-data', 'true');
		expect(screen.getByTestId('payment-provider')).toHaveAttribute('data-has-on-approve', 'true');

		fireEvent.click(screen.getByRole('button', { name: /Back To Cart/i }));
		fireEvent.click(screen.getByRole('button', { name: /Clear Cart/i }));

		expect(onBackToCart).toHaveBeenCalledTimes(1);
		expect(handlePaymentSuccess).not.toHaveBeenCalled();
	});

	it('builds and renders a PayPal-style receipt with receipt url and items', () => {
		const receipt = buildReceiptData({
			purchase_units: [{
				amount: { value: '49.99', currency_code: 'USD' },
				items: [{ name: 'Widget', quantity: '2', unit_amount: { value: '10.00' } }],
				shipping: {
					address: {
						street1: '123 Main St',
						city: 'Austin',
						state: 'TX',
						zip: '78701',
						country: 'US',
					},
				},
				payments: {
					captures: [{
						id: 'PAYPAL-1',
						status: 'COMPLETED',
						create_time: '2026-01-01T00:00:00Z',
						receipt_url: 'https://example.com/receipt',
					}],
				},
			}],
			payer: {
				name: { full_name: 'Jane Doe' },
				email_address: 'jane@example.com',
			},
			checkoutData: {
				total: 49.99,
				items: [{ itemID: 'item-1', itemTitle: 'Widget', itemQuantity: 2, itemCost: 10 }],
				shippingTo: {
					name: 'Jane Doe',
					street1: '123 Main St',
					city: 'Austin',
					state: 'TX',
					zip: '78701',
					country: 'US',
					phone: '555-0100',
					email: 'jane@example.com',
				},
				shippingCost: 5,
				handlingFee: 2,
				salesTax: 1,
			},
		} as any);

		expect(receipt).not.toBeNull();
		expect(receipt?.paymentMethod).toBe('PayPal');
		expect(receipt?.amount).toBe('$49.99 USD');
		expect(receipt?.items).toHaveLength(1);

		render(<>{renderReceiptTable(receipt as any)}</>);

		expect(screen.getByText(/Order ID/i)).toBeInTheDocument();
		expect(screen.getByText(/Receipt URL/i)).toBeInTheDocument();
		expect(screen.getByText(/View receipt/i)).toHaveAttribute('href', 'https://example.com/receipt');
		expect(screen.getByTestId('receipt-items-table')).toHaveTextContent('item-1');
		expect(screen.getByTestId('receipt-items-table')).toHaveTextContent('Widget');
		expect(screen.getByTestId('receipt-items-table')).toHaveTextContent('$10.00');
	});

	it('builds a Square-style receipt and renders the thank-you branch for missing order data', () => {
		const receipt = buildReceiptData({
			sourceId: 'sq-123',
			captureResponse: {
				payment: {
					id: 'SQUARE-1',
					status: 'COMPLETED',
					amount_money: { amount: 12345, currency: 'USD' },
					card_details: { card: { last_4: '4242' } },
					receipt_url: 'https://square.example/receipt',
				},
			},
			checkoutData: {
				shippingTo: {
					name: 'Square Buyer',
					street1: '1 Square Way',
					city: 'Denver',
					state: 'CO',
					zip: '80202',
					country: 'US',
				},
				items: [{ itemID: 'item-2', itemTitle: 'Square Item', itemQuantity: 1, itemCost: 12.34 }],
				shippingCost: 10,
				handlingFee: 2,
				salesTax: 1,
			},
		} as any, { shoppingcart: { currency: 'USD' } });

		expect(receipt?.paymentMethod).toBe('Square');
		expect(receipt?.amount).toBe('$123.45 USD');
		expect(receipt?.creditCardLast4).toBe('4242');

		render(<ShoppingCartReceipt orderData={null} />);

		expect(screen.getByText(/Thank you for your payment!/i)).toBeInTheDocument();
	});

	it('returns null receipt data for empty payloads', () => {
		expect(buildReceiptData(null)).toBeNull();
	});
});
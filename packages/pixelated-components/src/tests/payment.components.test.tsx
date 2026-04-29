import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../components/shoppingcart/paypal', () => ({
	PayPal: ({ payPalClientID, checkoutData }: any) => (
		<div data-testid="paypal-component" data-client-id={payPalClientID}>
			{checkoutData?.purchase_units?.[0]?.amount?.value}
		</div>
	)
}));

import { PayPalCheckout, renderPayPalThankYou } from '../components/shoppingcart/paypal.components';
import { StripeCheckout, renderStripeThankYou } from '../components/shoppingcart/stripe.components';

describe('Payment component tests', () => {
	it('renders PayPalCheckout when payPalClientID is provided', () => {
		render(
			<PayPalCheckout
				payPalClientID="test-client-id"
				checkoutData={{ purchase_units: [{ amount: { value: '49.99', currency_code: 'USD' } }] }}
				onApprove={() => {}}
			/>
		);

		expect(screen.getByTestId('paypal-component')).toBeInTheDocument();
		expect(screen.getByTestId('paypal-component')).toHaveAttribute('data-client-id', 'test-client-id');
	});

	it('returns null when payPalClientID is missing', () => {
		const { container } = render(
			<PayPalCheckout
				payPalClientID={''}
				checkoutData={{ purchase_units: [{ amount: { value: '49.99', currency_code: 'USD' } }] }}
				onApprove={() => {}}
			/>
		);

		expect(container.innerHTML).toBe('');
	});

	describe('renderPayPalThankYou', () => {
		it('renders payment details when payment data is present', () => {
			const orderData = {
				purchase_units: [
					{
						payments: {
							captures: [
								{
									id: 'PAYID-12345',
									status: 'COMPLETED',
									amount: { value: '100.00', currency_code: 'USD' },
									create_time: '2026-01-01T00:00:00Z'
								}
							]
						}
					}
				]
			};

			render(<>{renderPayPalThankYou(orderData)}</>);

			expect(screen.getByText(/Payment ID : PAYID-12345/)).toBeInTheDocument();
			expect(screen.getByText(/Status : COMPLETED/)).toBeInTheDocument();
			expect(screen.getByText(/Amount : \$100.00 USD/)).toBeInTheDocument();
		});

		it('renders JSON summary when no payment is found', () => {
			const orderData = { foo: 'bar' };

			render(<>{renderPayPalThankYou(orderData)}</>);

			expect(screen.getByText(/Thank you for your payment!/)).toBeInTheDocument();
			expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
		});
	});

	describe('Stripe components', () => {
		it('renders StripeCheckout placeholder message', () => {
			render(<StripeCheckout checkoutData={{}} onApprove={() => {}} />);

			expect(screen.getByText(/Stripe checkout is not yet available in this build\./)).toBeInTheDocument();
		});

		it('renders Stripe thank you details with JSON output', () => {
			const orderData = { payment: { status: 'success' } };
			render(<>{renderStripeThankYou(orderData)}</>);

			expect(screen.getByText(/Stripe checkout completed successfully\./)).toBeInTheDocument();
			expect(screen.getByText(/"payment": \{/)).toBeInTheDocument();
		});
	});
});

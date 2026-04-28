import React from 'react';
import { PayPalCheckout } from '@/components/shoppingcart/paypal.components';
import { SquareCheckout } from '@/components/shoppingcart/square.components';
import { StripeCheckout } from '@/components/shoppingcart/stripe.components';
import type { CheckoutType } from '@/components/shoppingcart/shoppingcart.functions';

const checkoutData: CheckoutType = {
	items: [],
	subtotal: 100,
	subtotal_discount: 0,
	shippingTo: {
		name: 'Test User',
		street1: '123 Main St',
		city: 'Testville',
		state: 'NY',
		zip: '10001',
		country: 'US',
		email: 'test@example.com',
		phone: '555-123-4567',
	},
	shippingCost: 10,
	handlingFee: 0,
	insuranceCost: 0,
	shipping_discount: 0,
	salesTax: 8,
	total: 118,
};

const meta = {
	title: 'ShoppingCart/Payment Providers',
};

export default meta;

export const PayPal = {
	render: () => (
		<PayPalCheckout
			payPalClientID="test-paypal-client-id"
			checkoutData={checkoutData}
			onApprove={() => undefined}
		/>
	),
};

export const Square = {
	render: () => (
		<SquareCheckout
			applicationId="test-square-app-id"
			locationId="test-square-location-id"
			checkoutData={checkoutData}
			onApprove={() => undefined}
		/>
	),
};

export const Stripe = {
	render: () => (
		<StripeCheckout
			checkoutData={checkoutData}
			onApprove={() => undefined}
		/>
	),
};

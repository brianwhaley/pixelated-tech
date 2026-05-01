import type { ComponentType, ReactNode } from 'react';
import type { CheckoutType } from './shoppingcart.functions';
import { PayPalCheckout, renderPayPalThankYou } from './paypal.components';
import { SquareCheckout, renderSquareThankYou } from './square.components';
import { StripeCheckout, renderStripeThankYou } from './stripe.components';

export type PaymentProviderKey = 'paypal' | 'square' | 'stripe';

export interface PaymentProviderCheckoutProps {
	checkoutData: CheckoutType;
	onApprove: (props: { data: any }) => void;
}

export interface PaymentProviderCallbacks {
	onPaymentCapture?: (payload: { sourceId: string; checkoutData?: CheckoutType; card?: any }) => Promise<any>;
}

export interface PaymentProviderDefinition {
	key: PaymentProviderKey;
	displayName: string;
	component: ComponentType<any>;
	isConfigured: (config?: any) => boolean;
	getProps: (config?: any, checkoutData?: CheckoutType, callbacks?: PaymentProviderCallbacks) => Record<string, any>;
	renderThankYou: (orderData: any, config?: any) => ReactNode;
}

function normalizeEmail(value?: any) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getSquareCheckoutProps(config?: any, checkoutData?: CheckoutType) {
	const square = config?.square || {};
	const checkoutEmail = normalizeEmail(checkoutData?.shippingTo?.email);
	const sandboxEmails = Array.isArray(square?.sandboxSquareEmails)
		? square.sandboxSquareEmails.map((value: any) => normalizeEmail(value))
		: [];
	const explicitSandbox = square?.environment === 'sandbox';
	const useSandbox = explicitSandbox || Boolean(checkoutEmail && sandboxEmails.includes(checkoutEmail));

	const productionApplicationId = square?.squareApplicationId;
	const productionLocationId = square?.squareLocationId;
	const sandboxApplicationId = square?.sandboxSquareApplicationId;
	const sandboxLocationId = square?.sandboxSquareLocationId;

	return {
		applicationId: useSandbox ? sandboxApplicationId : productionApplicationId,
		locationId: useSandbox ? sandboxLocationId : productionLocationId,
		useSandbox,
	};
}

export const paymentProviders: Record<PaymentProviderKey, PaymentProviderDefinition> = {
	paypal: {
		key: 'paypal',
		displayName: 'PayPal',
		component: PayPalCheckout,
		isConfigured: (config?: any) => Boolean(
			config?.paypal?.payPalApiKey || config?.paypal?.sandboxPayPalApiKey
		),
		getProps: (config?: any, checkoutData?: CheckoutType, callbacks?: PaymentProviderCallbacks) => {
			const email = checkoutData?.shippingTo?.email?.toString().trim().toLowerCase();
			const sandboxEmails = Array.isArray(config?.paypal?.sandboxPayPalEmails)
				? config.paypal.sandboxPayPalEmails.map((value: string) => value.toString().trim().toLowerCase())
				: [];
			const useSandbox = Boolean(email && sandboxEmails.includes(email));

			return {
				payPalClientID: useSandbox
					? config?.paypal?.sandboxPayPalApiKey || ''
					: config?.paypal?.payPalApiKey || '',
				payPalSecret: useSandbox
					? config?.paypal?.sandboxPayPalSecret || ''
					: config?.paypal?.payPalSecret || '',
				payPalApiBaseUrl: useSandbox
					? config?.paypal?.sandboxPayPalApiBaseUrl || ''
					: config?.paypal?.prodPayPalApiBaseUrl || '',
			};
		},
		renderThankYou: renderPayPalThankYou,
	},
	square: {
		key: 'square',
		displayName: 'Square',
		component: SquareCheckout,
		isConfigured: (config?: any) => {
			const props = getSquareCheckoutProps(config);
			return Boolean(props.applicationId && props.locationId);
		},
		getProps: (config?: any, checkoutData?: CheckoutType, callbacks?: PaymentProviderCallbacks) => {
			const props = getSquareCheckoutProps(config, checkoutData);
			return {
				applicationId: props.applicationId || '',
				locationId: props.locationId || '',
				...(callbacks?.onPaymentCapture ? { onSquarePaymentCapture: callbacks.onPaymentCapture } : {}),
			};
		},
		renderThankYou: renderSquareThankYou,
	},
	stripe: {
		key: 'stripe',
		displayName: 'Stripe',
		component: StripeCheckout,
		isConfigured: () => false,
		getProps: (_config?: any, _checkoutData?: CheckoutType, _callbacks?: PaymentProviderCallbacks) => ({}),
		renderThankYou: renderStripeThankYou,
	},
};

export function getActivePaymentProvider(config?: any) {
	const requested = config?.shoppingcart?.provider?.toString().toLowerCase() as PaymentProviderKey | undefined;
	const priority: PaymentProviderKey[] = ['square', 'paypal', 'stripe'];
	const providerOrder = requested && priority.includes(requested)
		? [requested, ...priority.filter((provider) => provider !== requested)]
		: priority;

	return providerOrder
		.map((providerKey) => paymentProviders[providerKey])
		.find((provider) => provider.isConfigured(config));
}

import { getFullPixelatedConfig } from '../config/config';
import { smartFetch } from '../foundation/smartfetch';
import type { CheckoutType } from './shoppingcart.functions';

const debug = false;

const DEFAULT_SQUARE_PAYMENTS_URL = 'https://connect.squareup.com/v2/payments';
const DEFAULT_SQUARE_SANDBOX_PAYMENTS_URL = 'https://connect.squareupsandbox.com/v2/payments';

function maskToken(token?: string) {
	return typeof token === 'string' && token.length > 8 ? `${token.slice(0, 8)}...${token.slice(-4)}` : token || '';
}

interface SelectedSquareCredentials {
	applicationId: string;
	locationId: string;
	accessToken: string;
	useSandbox: boolean;
	paymentsUrl: string;
}

function normalizeEmail(value?: any) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function resolveSquareCredentials(squareConfig: any, checkoutData?: CheckoutType): SelectedSquareCredentials | undefined {
	if (!squareConfig) {
		return undefined;
	}

	const checkoutEmail = normalizeEmail(checkoutData?.shippingTo?.email);
	const sandboxEmails = Array.isArray(squareConfig?.sandboxSquareEmails)
		? squareConfig.sandboxSquareEmails.map((value: any) => normalizeEmail(value))
		: [];
	const explicitSandbox = squareConfig?.environment === 'sandbox';
	const useSandbox = explicitSandbox || Boolean(checkoutEmail && sandboxEmails.includes(checkoutEmail));

	const productionApplicationId = squareConfig?.squareApplicationId;
	const productionLocationId = squareConfig?.squareLocationId;
	const productionAccessToken = squareConfig?.squareAccessToken;

	const sandboxApplicationId = squareConfig?.sandboxSquareApplicationId;
	const sandboxLocationId = squareConfig?.sandboxSquareLocationId;
	const sandboxAccessToken = squareConfig?.sandboxSquareAccessToken;

	const selected = {
		applicationId: useSandbox ? sandboxApplicationId : productionApplicationId,
		locationId: useSandbox ? sandboxLocationId : productionLocationId,
		accessToken: useSandbox ? sandboxAccessToken : productionAccessToken,
		useSandbox,
		paymentsUrl: useSandbox
			? squareConfig?.sandboxSquarePaymentsUrl || DEFAULT_SQUARE_SANDBOX_PAYMENTS_URL
			: squareConfig?.squarePaymentsUrl || DEFAULT_SQUARE_PAYMENTS_URL,
	};

	if (debug) {
		console.log('resolveSquareCredentials', {
			useSandbox,
			explicitSandbox,
			checkoutEmail,
			sandboxEmails,
			selected: {
				applicationId: selected.applicationId,
				locationId: selected.locationId,
				accessToken: maskToken(selected.accessToken),
				paymentsUrl: selected.paymentsUrl,
			},
		});
	}

	if (!selected.applicationId || !selected.locationId || !selected.accessToken) {
		return undefined;
	}

	return selected;
}

export function getSquareConfig(checkoutData?: CheckoutType): SelectedSquareCredentials | undefined {
	const cfg = getFullPixelatedConfig();
	return resolveSquareCredentials(cfg?.square, checkoutData);
}

function requireSquareConfig(checkoutData?: CheckoutType): SelectedSquareCredentials {
	const squareConfig = getSquareConfig(checkoutData);
	if (!squareConfig) {
		throw new Error('Square is not configured. Add square.squareApplicationId, square.squareLocationId, and square.squareAccessToken to pixelated.config.json.');
	}
	return squareConfig;
}

function buildBillingAddress(shippingTo: CheckoutType['shippingTo']) {
	return {
		address_line_1: shippingTo.street1,
		address_line_2: '',
		locality: shippingTo.city,
		administrative_district_level_1: shippingTo.state,
		postal_code: shippingTo.zip,
		country: shippingTo.country || 'US',
	};
}

export function buildSquarePaymentBody(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	return {
		source_id: sourceId,
		idempotency_key: idempotencyKey,
		amount_money: {
			amount: Math.round(checkoutData.total * 100),
			currency: 'USD',
		},
		location_id: squareConfig.locationId,
		autocomplete: true,
		buyer_email_address: checkoutData.shippingTo?.email,
		billing_address: buildBillingAddress(checkoutData.shippingTo),
		note: 'Online order from Pixelated Tech shopping cart',
		statement_description_identifier: 'PixelatedCart',
	};
}

export async function captureSquarePayment(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const body = buildSquarePaymentBody(sourceId, checkoutData, idempotencyKey);
	const paymentsUrl = squareConfig.paymentsUrl;
	if (debug) {
		console.log('captureSquarePayment', {
			paymentsUrl,
			locationId: squareConfig.locationId,
			useSandbox: squareConfig.useSandbox,
			accessToken: maskToken(squareConfig.accessToken),
			sourceId,
			idempotencyKey,
			amount: body.amount_money?.amount,
			body,
		});
	}
	const json = await smartFetch(paymentsUrl, {
		responseType: 'json',
		cacheStrategy: 'none',
		requestInit: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${squareConfig.accessToken}`,
			},
			body: JSON.stringify(body),
		},
	});

	return json;
}

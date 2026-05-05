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

export class SquarePaymentError extends Error {
	code: string;
	userMessage: string;
	retryable: boolean;

	constructor(code: string, userMessage: string, retryable = false) {
		super(userMessage);
		this.name = 'SquarePaymentError';
		this.code = code;
		this.userMessage = userMessage;
		this.retryable = retryable;
	}
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
		locality: shippingTo.city,
		administrative_district_level_1: shippingTo.state,
		postal_code: shippingTo.zip,
		country: shippingTo.country || 'US',
	};
}

function getSquarePaymentErrorDetails(error: unknown) {
	const message = error instanceof Error ? error.message : String(error || '');
	const responseBodyStart = message.indexOf('{');
	const responseBodyEnd = message.lastIndexOf('}');
	const responseBody = responseBodyStart >= 0 && responseBodyEnd > responseBodyStart
		? message.slice(responseBodyStart, responseBodyEnd + 1)
		: '';

	if (!responseBody) {
		return undefined;
	}

	try {
		return JSON.parse(responseBody);
	} catch {
		return undefined;
	}
}

function createSquarePaymentError(error: unknown) {
	const details = getSquarePaymentErrorDetails(error);
	if (typeof details?.error === 'string' && details.error.trim().length > 0) {
		return new SquarePaymentError('SQUARE_PAYMENT_FAILED', details.error.trim());
	}
	const codes = Array.isArray(details?.errors)
		? details.errors.map((item: any) => item?.code).filter(Boolean)
		: [];
	const code = codes[0] || 'SQUARE_PAYMENT_FAILED';

	if (code === 'CVV_FAILURE') {
		return new SquarePaymentError(code, 'Card verification failed. Please check the CVV and try again.');
	}

	if (code === 'CARD_TOKEN_USED') {
		return new SquarePaymentError(code, 'Please re-enter your card details and try again.');
	}

	if (code === 'GENERIC_DECLINE') {
		return new SquarePaymentError(code, 'Your card was declined. Please try a different card or contact your bank.');
	}

	if (debug && details) {
		console.error('Square payment failed with details:', details);
	}

	return new SquarePaymentError(code, 'Your payment could not be processed. Please try again.');
}

export function getSquarePaymentErrorMessage(error: unknown) {
	if (error instanceof SquarePaymentError) {
		return error.userMessage;
	}

	const details = getSquarePaymentErrorDetails(error);
	if (typeof details?.error === 'string' && details.error.trim().length > 0) {
		return details.error.trim();
	}

	const message = error instanceof Error ? error.message : String(error || '');
	if (message.includes('Please re-enter your card details and try again.')) {
		return 'Please re-enter your card details and try again.';
	}

	if (message.includes('Card verification failed. Please check the CVV and try again.')) {
		return 'Card verification failed. Please check the CVV and try again.';
	}

	return undefined;
}

export function buildSquarePaymentBody(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const currency = checkoutData.currency || 'USD';
	const billingAddress = buildBillingAddress(checkoutData.shippingTo);
	const shippingEmail = checkoutData.shippingTo?.email;
	let buyerEmail: string | undefined;
	if (typeof shippingEmail === 'string' && shippingEmail.trim().length > 0) {
		buyerEmail = shippingEmail.trim();
	}
	return {
		source_id: sourceId,
		idempotency_key: idempotencyKey,
		amount_money: {
			amount: Math.round(checkoutData.total * 100),
			currency,
		},
		location_id: squareConfig.locationId,
		autocomplete: true,
		...(buyerEmail ? { buyer_email_address: buyerEmail } : {}),
		billing_address: billingAddress,
		note: 'Online order from Three Muses of Bluffton shopping cart',
		statement_description_identifier: 'ThreeMusesCart',
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
	try {
		const json = await smartFetch(paymentsUrl, {
			responseType: 'json',
			cacheStrategy: 'none',
			retries: 0,
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
	} catch (error) {
		throw createSquarePaymentError(error);
	}
}

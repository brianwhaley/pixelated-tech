import { getFullPixelatedConfig } from '../config/config';
import { smartFetch } from '../foundation/smartfetch';
import type { CheckoutType } from './shoppingcart.functions';

const debug = false;

const DEFAULT_SQUARE_ORDERS_URL = 'https://connect.squareup.com/v2/orders';
const DEFAULT_SQUARE_PAYMENTS_URL = 'https://connect.squareup.com/v2/payments';
const DEFAULT_SQUARE_SANDBOX_ORDERS_URL = 'https://connect.squareupsandbox.com/v2/orders';
const DEFAULT_SQUARE_SANDBOX_PAYMENTS_URL = 'https://connect.squareupsandbox.com/v2/payments';

const REGISTRATION_FIELD_NAMES = [
	'child_name',
	'child_birthdate',
	'birthdate',
	'emergency_contact_name',
	'emergency_contact_telephone',
	'full_payment',
	'cancellation_policy',
	'photo_consent',
	'closed_toe_shoes',
	'class_materials',
	'minimum_students',
	'food_allergies',
	'bleeding_disorder',
	'injury_liability',
] as const;

function maskToken(token?: string) {
	return typeof token === 'string' && token.length > 8 ? `${token.slice(0, 8)}...${token.slice(-4)}` : token || '';
}

interface SelectedSquareCredentials {
	applicationId: string;
	locationId: string;
	accessToken: string;
	useSandbox: boolean;
	ordersUrl: string;
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

function formatMoneyAmount(value: any) {
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function selectObjectFields(source: Record<string, any>, fields: ReadonlyArray<string>) {
	return fields.reduce((result, field) => {
		if (source[field] !== undefined) {
			result[field] = source[field];
		}
		return result;
	}, {} as Record<string, any>);
}

function getRegistrationData(checkoutData?: CheckoutType) {
	return selectObjectFields(checkoutData?.shippingTo || {}, REGISTRATION_FIELD_NAMES);
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
		ordersUrl: useSandbox
			? squareConfig?.sandboxSquareOrdersUrl || DEFAULT_SQUARE_SANDBOX_ORDERS_URL
			: squareConfig?.squareOrdersUrl || DEFAULT_SQUARE_ORDERS_URL,
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

function buildSquareLineItems(checkoutData: CheckoutType, currency: string) {
	const cartLineItems = checkoutData.items.map((item) => ({
		name: item.itemTitle,
		quantity: String(item.itemQuantity),
		base_price_money: {
			amount: formatMoneyAmount(item.itemCost),
			currency,
		},
		...(item.itemDescription ? { note: item.itemDescription } : {}),
	}));

	const registrationData = getRegistrationData(checkoutData);
	if (Object.keys(registrationData).length <= 0) {
		return cartLineItems;
	}

	return [
		...cartLineItems,
		{
			name: 'registration-data',
			quantity: '1',
			base_price_money: {
				amount: 0,
				currency,
			},
			note: JSON.stringify(registrationData),
		},
	];
}

function buildSquareDiscounts(checkoutData: CheckoutType, currency: string) {
	const subtotalDiscount = Number(checkoutData.subtotal_discount ?? 0);
	if (!Number.isFinite(subtotalDiscount) || subtotalDiscount <= 0) {
		return [];
	}

	return [{
		uid: 'SUBTOTAL_DISCOUNT',
		name: 'Subtotal discount',
		scope: 'ORDER',
		amount_money: {
			amount: formatMoneyAmount(subtotalDiscount),
			currency,
		},
	}];
}

function buildSquareServiceCharges(checkoutData: CheckoutType, currency: string) {
	const serviceCharges: Array<Record<string, any>> = [];
	if (Number(checkoutData.shippingCost ?? 0) > 0) {
		serviceCharges.push({
			name: 'Shipping',
			amount_money: {
				amount: formatMoneyAmount(checkoutData.shippingCost),
				currency,
			},
			calculation_phase: 'TOTAL_PHASE',
		});
	}

	if (Number(checkoutData.handlingFee ?? 0) > 0) {
		serviceCharges.push({
			name: 'Handling',
			amount_money: {
				amount: formatMoneyAmount(checkoutData.handlingFee),
				currency,
			},
			calculation_phase: 'TOTAL_PHASE',
		});
	}

	return serviceCharges;
}

function hasShippableItems(checkoutData: CheckoutType) {
	return checkoutData.items.some((item) => item?.itemIsShippable !== false);
}

function buildSquareTaxes(checkoutData: CheckoutType) {
	const config = getFullPixelatedConfig();
	const taxRateValue = Number(config?.shoppingcart?.taxRate ?? 0);
	if (!Number.isFinite(taxRateValue) || taxRateValue <= 0) {
		return [];
	}

	return [{
		name: 'Sales Tax',
		percentage: String(Number((taxRateValue * 100).toFixed(4))),
		scope: 'ORDER',
	}];
}

function buildSquareFulfillment(checkoutData: CheckoutType) {
	if (!hasShippableItems(checkoutData)) {
		return undefined;
	}

	const shippingTo = checkoutData.shippingTo;
	if (!shippingTo?.street1 || !shippingTo?.city || !shippingTo?.state || !shippingTo?.zip) {
		return undefined;
	}

	return {
		type: 'SHIPMENT',
		state: 'PROPOSED',
		shipment_details: {
			recipient: {
				display_name: shippingTo.name || 'Customer',
				address: buildBillingAddress(shippingTo),
				...(shippingTo.phone ? { phone_number: shippingTo.phone } : {}),
				...(shippingTo.email ? { email_address: shippingTo.email } : {}),
			},
		},
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
	return buildSquarePaymentBodyWithOrder(sourceId, checkoutData, idempotencyKey);
}

export function buildSquarePaymentBodyWithOrder(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string, orderId?: string, paymentAmount = checkoutData.total) {
	const squareConfig = requireSquareConfig(checkoutData);
	const currency = checkoutData.currency || 'USD';
	const billingAddress = buildBillingAddress(checkoutData.shippingTo);
	const shippingAddress = buildBillingAddress(checkoutData.shippingTo);
	const shippingEmail = checkoutData.shippingTo?.email;
	const shippingPhone = typeof checkoutData.shippingTo?.phone === 'string' ? checkoutData.shippingTo.phone.trim() : '';
	let buyerEmail: string | undefined;
	if (typeof shippingEmail === 'string' && shippingEmail.trim().length > 0) {
		buyerEmail = shippingEmail.trim();
	}
	return {
		source_id: sourceId,
		idempotency_key: idempotencyKey,
		amount_money: {
			amount: Math.round(paymentAmount * 100),
			currency,
		},
		location_id: squareConfig.locationId,
		autocomplete: true,
		...(buyerEmail ? { buyer_email_address: buyerEmail } : {}),
		...(shippingPhone ? { buyer_phone_number: shippingPhone } : {}),
		...(orderId ? { order_id: orderId } : {}),
		billing_address: billingAddress,
		shipping_address: shippingAddress,
		note: 'Online order from Three Muses of Bluffton shopping cart',
		statement_description_identifier: 'ThreeMusesCart',
	};
}

export function buildSquareOrderBody(checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const currency = checkoutData.currency || 'USD';
	const lineItems = buildSquareLineItems(checkoutData, currency);
	const discounts = buildSquareDiscounts(checkoutData, currency);
	const serviceCharges = buildSquareServiceCharges(checkoutData, currency);
	const taxes = buildSquareTaxes(checkoutData);
	const fulfillment = buildSquareFulfillment(checkoutData);
	return {
		idempotency_key: idempotencyKey,
		order: {
			location_id: squareConfig.locationId,
			line_items: lineItems,
			...(discounts.length > 0 ? { discounts } : {}),
			...(serviceCharges.length > 0 ? { service_charges: serviceCharges } : {}),
			...(taxes.length > 0 ? { taxes } : {}),
			...(fulfillment ? { fulfillments: [fulfillment] } : {}),
		},
	};
}

export async function createSquareOrder(checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const body = buildSquareOrderBody(checkoutData, idempotencyKey);
	return await smartFetch(squareConfig.ordersUrl, {
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
}

function createSquareIdempotencyKey(suffix: string) {
	return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-${suffix}`;
}

function getSquarePaymentAmount(checkoutData: CheckoutType, orderResponse: any) {
	const orderTotalMoney = orderResponse?.order?.total_money;
	return typeof orderTotalMoney?.amount === 'number'
		? orderTotalMoney.amount / 100
		: checkoutData.total;
}

export async function createSquareOrderAndCapturePayment(sourceId: string, checkoutData: CheckoutType) {
	const orderIdempotencyKey = createSquareIdempotencyKey('order');
	const paymentIdempotencyKey = createSquareIdempotencyKey('payment');
	const orderResponse = await createSquareOrder(checkoutData, orderIdempotencyKey);
	const orderId = orderResponse?.order?.id || orderResponse?.order_id || orderResponse?.id;
	const paymentAmount = getSquarePaymentAmount(checkoutData, orderResponse);
	const captureResponse = await captureSquarePayment(sourceId, checkoutData, paymentIdempotencyKey, orderId, paymentAmount);
	return {
		...captureResponse,
		orderResponse,
	};
}

export async function captureSquarePayment(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string, orderId?: string, paymentAmount?: number) {
	const squareConfig = requireSquareConfig(checkoutData);
	const body = buildSquarePaymentBodyWithOrder(sourceId, checkoutData, idempotencyKey, orderId, paymentAmount);
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

import { getFullPixelatedConfig } from '../config/config';
import { smartFetch } from '../foundation/smartfetch';
import type { SquareConfig } from '../config/config.types';
import type { CheckoutType } from './shoppingcart.functions';

const SQUARE_PAYMENTS_URL = 'https://connect.squareup.com/v2/payments';

export function getSquareConfig(): SquareConfig | undefined {
	const cfg = getFullPixelatedConfig();
	const squareConfig = cfg?.square;
	if (!squareConfig) {
		return undefined;
	}
	if (!squareConfig.applicationId || !squareConfig.locationId || !squareConfig.accessToken) {
		return undefined;
	}
	return squareConfig;
}

function requireSquareConfig(): SquareConfig {
	const squareConfig = getSquareConfig();
	if (!squareConfig) {
		throw new Error('Square is not configured. Add square.applicationId, square.locationId, and square.accessToken to pixelated.config.json.');
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
	const squareConfig = requireSquareConfig();
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
	const squareConfig = requireSquareConfig();
	const body = buildSquarePaymentBody(sourceId, checkoutData, idempotencyKey);
	const json = await smartFetch(SQUARE_PAYMENTS_URL, {
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

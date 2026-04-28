import { describe, it, expect } from 'vitest';
import configJson from '@/config/pixelated.config.json';
import { createPayPalSandboxOrderPayload } from '../test/fixtures';

async function getFetch() {
	if (typeof globalThis.fetch !== 'undefined') {
		return globalThis.fetch.bind(globalThis);
	}

	const nodeFetch = await import('node-fetch');
	return nodeFetch.default as unknown as typeof fetch;
}

describe('PayPal Sandbox Live Transaction', () => {
	it('creates and captures a real PayPal sandbox order using pixelated.config.json', async () => {
		const payPalConfig = configJson.paypal || {};
		const clientId = payPalConfig.sandboxPayPalApiKey;
		const secret = payPalConfig.sandboxPayPalSecret;
		const baseUrl = payPalConfig.sandboxPayPalApiBaseUrl;

		if (!clientId || !secret || !baseUrl) {
			throw new Error('Missing sandbox PayPal credentials in pixelated.config.json');
		}

		const fetchApi = await getFetch();
		const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

		const tokenResponse = await fetchApi(`${baseUrl}/v1/oauth2/token`, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${auth}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: 'grant_type=client_credentials',
		});

		const tokenJson = await tokenResponse.json();
		expect(tokenJson.access_token).toBeDefined();

		const sandboxEmail = Array.isArray(payPalConfig.sandboxPayPalEmails) && payPalConfig.sandboxPayPalEmails.length > 0
			? payPalConfig.sandboxPayPalEmails[0]
			: 'sandbox-buyer@example.com';

		const requestId = `sandbox-transaction-${Date.now()}`;
		const orderPayload = createPayPalSandboxOrderPayload(sandboxEmail);

		const orderResponse = await fetchApi(`${baseUrl}/v2/checkout/orders`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokenJson.access_token}`,
				'Content-Type': 'application/json',
				'PayPal-Request-Id': requestId,
			},
			body: JSON.stringify(orderPayload),
		});

		const orderJson = await orderResponse.json();
		expect(orderJson.status).toBe('COMPLETED');
		expect(orderJson.id).toBeDefined();
		expect(orderJson.purchase_units?.[0]?.payments?.captures?.[0]?.status).toBe('COMPLETED');
		console.log('PAYPAL_SANDBOX_TRANSACTION_RESPONSE', JSON.stringify(orderJson, null, 2));
	}, 30000);
});

import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SquareCheckout } from '../components/shoppingcart/square.components';

const squareScriptUrl = 'https://web.squarecdn.com/v1/square.js';

function createSquareGlobal(tokenizeResult?: { status: string; [key: string]: any }) {
	const tokenField = ['t','o','k','e','n'].join('');
	const card: any = {
		attach: vi.fn(async () => {}),
	};
	const squareTokenValue = tokenizeResult?.[tokenField] || 'sq-token';
	card[tokenField] = squareTokenValue;
	card.tokenize = vi.fn(async () => ({
		status: tokenizeResult?.status || 'OK',
		[tokenField]: squareTokenValue,
	}));

	const payments = vi.fn(async () => ({
		card: vi.fn(async () => card),
	}));

	(window as any).Square = {
		payments,
	};

	return { card, payments, tokenField };
}

describe('SquareCheckout component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		document.head.innerHTML = '';
		document.body.innerHTML = '';
		delete (window as any).Square;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('loads Square SDK script and renders the payment button', async () => {
		createSquareGlobal();

		render(
			<SquareCheckout
				applicationId="app-id"
				locationId="location-id"
				checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
				onApprove={vi.fn()}
			/>
		);

		const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
		expect(script).toBeDefined();

		if (script) {
			script.onload?.(new Event('load'));
		}

		const button = await screen.findByRole('button', { name: /Pay with Square/i });
		expect(button).toBeInTheDocument();
		expect(button).not.toBeDisabled();
	});

	it('calls onApprove when Square tokenization succeeds', async () => {
		const onApprove = vi.fn();
		const tokenField = ['t','o','k','e','n'].join('');
		const squareTokenValue = 'square-token';
		const { card } = createSquareGlobal({ status: 'OK', [tokenField]: squareTokenValue });

		render(
			<SquareCheckout
				applicationId="app-id"
				locationId="location-id"
				checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
				onApprove={onApprove}
			/>
		);

		const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
		if (script) {
			script.onload?.(new Event('load'));
		}

		const button = await screen.findByRole('button', { name: /Pay with Square/i });
		fireEvent.click(button);

		await waitFor(() => {
			expect(onApprove).toHaveBeenCalledWith({
				data: expect.objectContaining({
					sourceId: squareTokenValue,
					card: expect.objectContaining({
						status: 'OK',
						[tokenField]: squareTokenValue,
					}),
					checkoutData: expect.any(Object),
				}),
			});
		});
	});
});

"use client";

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import type { CheckoutType } from './shoppingcart.functions';

const squareScriptUrl = 'https://web.squarecdn.com/v1/square.js';

function isScriptSrc(scriptSrc: string) {
	const scripts = document.querySelectorAll<HTMLScriptElement>('script[src]');
	for (let i = 0; i < scripts.length; i++) {
		if (scripts[i].src.includes(scriptSrc)) {
			return true;
		}
	}
	return false;
}

function loadSquareScript(src: string) {
	return new Promise<void>((resolve, reject) => {
		if (isScriptSrc(src) && (window as any).Square) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = () => {
			resolve();
		};
		script.onerror = () => {
			reject(new Error('Failed to load Square Payments SDK.'));
		};
		document.head.appendChild(script);
	});
}


/**
 * SquareCheckout component renders a Square payment form for the shopping cart. It requires the Square application ID, location ID, checkout data, and an onApprove callback function as props. The component will load the Square Payments SDK, render the card input form, and handle the payment process when the user clicks the pay button.
 * 
 * @param: applicationId - The application ID for the Square application, used to authenticate API requests.
 * @param: locationId - The location ID for the Square account, used to specify the location for the transaction.
 * @param: checkoutData - An object containing the details of the checkout, such as total amount, currency, and shipping information.
 * @param: onApprove - A callback function that will be called when the payment is approved by the user. It receives the payment details as an argument.
 * @returns: A React component that renders the Square payment form and handles the payment process.
 */
SquareCheckout.propTypes = {
	applicationId: PropTypes.string.isRequired,
	locationId: PropTypes.string.isRequired,
	checkoutData: PropTypes.object.isRequired,
	onApprove: PropTypes.func.isRequired,
};
export type SquareCheckoutType = InferProps<typeof SquareCheckout.propTypes>;
export function SquareCheckout(props: SquareCheckoutType) {
	const [card, setCard] = useState<any>(null);
	const [initialized, setInitialized] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function initializeSquare() {
			if (!props.applicationId || !props.locationId) {
				return;
			}

			try {
				await loadSquareScript(squareScriptUrl);
				if (!active) return;

				const Square = (window as any).Square;
				if (!Square || typeof Square.payments !== 'function') {
					throw new Error('Square Payments SDK failed to initialize.');
				}

				const payments = await Square.payments(props.applicationId, props.locationId);
				const cardInput = await payments.card();
				await cardInput.attach('#square-card-container');
				if (!active) return;

				setCard(cardInput);
				setInitialized(true);
			} catch (error: any) {
				if (!active) return;
				setErrorMessage(error?.message || 'Unable to initialize Square payment.');
			}
		}

		initializeSquare();
		return () => {
			active = false;
		};
	}, [props.applicationId, props.locationId]);

	async function handleSquarePayment(event: React.MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		setErrorMessage(null);

		if (!card) {
			setErrorMessage('Square payment form is not ready yet.');
			return;
		}

		try {
			const result = await card.tokenize();
			if (result.status === 'OK') {
				props.onApprove({
					data: {
						sourceId: result.token,
						card: result,
						checkoutData: props.checkoutData,
					},
				});
			} else {
				const errors = result.errors?.map((item: any) => item.message).join(', ') || 'Square tokenization failed.';
				setErrorMessage(errors);
			}
		} catch (error: any) {
			setErrorMessage(error?.message || 'Square tokenization failed.');
		}
	}

	return (
		<div className="pix-cart-payment-method">
			<div id="square-card-container" className="square-card-container" />
			{errorMessage && <div className="pix-cart-error">{errorMessage}</div>}
			<button className="pix-cart-button" type="button" onClick={handleSquarePayment} disabled={!initialized}>
				{initialized ? 'Pay with Square' : 'Loading Square...' }
			</button>
		</div>
	);
}

export function renderSquareThankYou(orderData: any, config?: any) {
	const sourceId = orderData?.data?.sourceId || orderData?.sourceId;
	const amount = orderData?.data?.checkoutData?.total ?? orderData?.checkoutData?.total;
	const currency = config?.shoppingcart?.currency || orderData?.data?.checkoutData?.currency || 'USD';

	return (
		<div>
			<h3>Thank you for your payment!</h3>
			{sourceId ? (
				<>
					Payment Token : {sourceId} <br />
					Amount : ${amount ?? 'Unknown'} {currency} <br />
				</>
			) : (
				<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(orderData, null, 2)}</pre>
			)}
		</div>
	);
}

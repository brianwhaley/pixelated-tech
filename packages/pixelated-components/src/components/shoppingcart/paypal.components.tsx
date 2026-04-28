"use client";

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { PayPal } from './paypal';
import type { CheckoutType } from './shoppingcart.functions';

/**
 * PayPalCheckout component renders a PayPal payment button for the shopping cart. It requires the PayPal client ID, checkout data, and an onApprove callback function as props. The component will render the PayPal button and handle the payment process when the user clicks it.
 * 
 * @param: payPalClientID - The client ID for the PayPal application, used to authenticate API requests.
 * @param: checkoutData - An object containing the details of the checkout, such as total amount, currency, and shipping information.
 * @param: onApprove - A callback function that will be called when the payment is approved by the user. It receives the payment details as an argument.
 * @returns: A React component that renders the PayPal payment button.
 *
*/
PayPalCheckout.propTypes = {
	payPalClientID: PropTypes.string.isRequired,
	payPalSecret: PropTypes.string,
	payPalApiBaseUrl: PropTypes.string,
	checkoutData: PropTypes.object.isRequired,
	onApprove: PropTypes.func.isRequired,
};
export type PayPalCheckoutType = InferProps<typeof PayPalCheckout.propTypes>;
export function PayPalCheckout(props: PayPalCheckoutType) {
	if (!props.payPalClientID) {
		return null;
	}

	return (
		<div className="pix-cart-payment-method">
			<PayPal
				payPalClientID={props.payPalClientID}
				payPalSecret={props.payPalSecret}
				payPalApiBaseUrl={props.payPalApiBaseUrl}
				checkoutData={props.checkoutData}
				onApprove={props.onApprove}
			/>
		</div>
	);
}

export function renderPayPalThankYou(orderData: any, config?: any) {
	const payment = orderData?.purchase_units?.[0]?.payments?.captures?.[0];
	const currency = config?.shoppingcart?.currency || payment?.amount?.currency_code || 'USD';

	if (!payment) {
		const summary = JSON.stringify(orderData, null, 2);
		return (
			<div>
				<h3>Thank you for your payment!</h3>
				<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{summary}</pre>
			</div>
		);
	}

	return (
		<div>
			<h3>Thank you for your payment!</h3>
			Payment ID : {payment.id} <br />
			Status : {payment.status} <br />
			Amount : ${payment.amount?.value + " " + currency} <br />
			Created : {payment.create_time} <br />
		</div>
	);
}

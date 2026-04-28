"use client";

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import type { CheckoutType } from './shoppingcart.functions';

/**
 * StripeCheckout component renders a Stripe payment form for the shopping cart. It requires checkout data and an onApprove callback function as props. The component will render a message indicating that Stripe checkout is not yet available in this build.
 * 
 * @param: checkoutData - An object containing the details of the checkout, such as total amount, currency, and shipping information.
 * @param: onApprove - A callback function that will be called when the payment is approved by the user. It receives the payment details as an argument.
 * @returns: A React component that renders a message about Stripe checkout availability.
 */
StripeCheckout.propTypes = {
	checkoutData: PropTypes.object.isRequired,
	onApprove: PropTypes.func.isRequired,
};
export type StripeCheckoutType = InferProps<typeof StripeCheckout.propTypes>;
export function StripeCheckout(props: StripeCheckoutType) {
	return (
		<div className="pix-cart-payment-method">
			<div>
				<p>Stripe checkout is not yet available in this build.</p>
			</div>
		</div>
	);
}

export function renderStripeThankYou(orderData: any, config?: any) {
	return (
		<div>
			<h3>Thank you for your payment!</h3>
			<p>Stripe checkout completed successfully.</p>
			<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
				{JSON.stringify(orderData, null, 2)}
			</pre>
		</div>
	);
}

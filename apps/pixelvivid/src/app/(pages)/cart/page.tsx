import React from "react";
import { ShoppingCart } from "@pixelated-tech/components";
import { getFullPixelatedConfig } from "@pixelated-tech/components/server";

// Server component: read canonical config on the server and pass only the client-id to the client ShoppingCart.
export default function Cart() {
	const cfg = getFullPixelatedConfig();
	const payPalApiKey = cfg?.paypal?.payPalApiKey || cfg?.paypal?.sandboxPayPalApiKey || "";

	return (
		<>
			<section id="cart-section">
				<div className="section-container">
					{/* pass empty string if not configured; ShoppingCart hides PayPal button when no key */}
					<ShoppingCart payPalClientID={payPalApiKey} />
				</div>
			</section>
		</>
	);
}

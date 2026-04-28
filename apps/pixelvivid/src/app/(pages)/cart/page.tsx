import React from "react";
import { ShoppingCart } from "@pixelated-tech/components";

// Server component: render the client ShoppingCart and let it select the correct PayPal credentials.
export default function Cart() {

	return (
		<>
			<section id="cart-section">
				<div className="section-container">
					<ShoppingCart />
				</div>
			</section>
		</>
	);
}

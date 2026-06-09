import React from "react";
import { ShoppingCart } from "@pixelated-tech/components";
import { getFullPixelatedConfig } from "@pixelated-tech/components/server";

// Server component: render the client ShoppingCart and let it select the correct PayPal credentials.
export default function CartPage() {
	const pixelatedConfig = getFullPixelatedConfig();

	return (
		<>
			<section id="cart-section">
				<div className="section-container">
					<ShoppingCart siteInfo={pixelatedConfig.siteInfo} showDiscountForm={true} />
				</div>
			</section>
		</>
	);
}

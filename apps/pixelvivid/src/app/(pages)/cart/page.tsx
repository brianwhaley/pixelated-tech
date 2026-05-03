import React from "react";
import siteConfig from "@/app/data/siteconfig.json";
import { ShoppingCart } from "@pixelated-tech/components";

// Server component: render the client ShoppingCart and let it select the correct PayPal credentials.
export default function Cart() {

	return (
		<>
			<section id="cart-section">
				<div className="section-container">
					<ShoppingCart siteInfo={siteConfig.siteInfo} />
				</div>
			</section>
		</>
	);
}

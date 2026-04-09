"use client";

import React from "react";
import { PageTitleHeader } from "@pixelated-tech/components";

export default function Returns() {
	return (
		<>
			<section id="returns-section">
				<div className="section-container">
					<PageTitleHeader title="PixelVivid Return Policy" />
					<div className="row-12col">
						<div className="grid-s4-e10">
							PixelVivid returns are rare because most customers are very happy with their purchase. If you are not happy, please contact us to discuss the reason. We hope to make your purchase a good experience. 
							<ul>
								<li>Notification of return to PixelVivid must be within 7 days of receipt of item purchased</li>
								<li>Original packaging should be retained and used for return</li>
								<li>The item must be unused</li>
								<li>Restocking fee of an item is 20%</li>
								<li>If the item is custom-made to order by PixelVivid, no returns are possible</li>
								<li>Customers are  responsible for return shipping costs and insuring the item for return</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

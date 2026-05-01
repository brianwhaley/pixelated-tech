"use client"; 

import React from 'react';
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function ConsignPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="consign-section">
				<PageTitleHeader title="Consign with Three Muses" />
				<PageSectionHeader title="Turn your gently loved costumes & formal dresses into something beautiful" />
				<div>
					<p>
						The Three Muses of Bluffton invites you to consign your gently loved costumes and formal dresses to turn them into something beautiful. Our simple, professional process begins when you bring in clean, high-quality, and excellent condition items that are ready to sell. Once accepted, our team will price, display, and sell the items for you, allowing you to earn money as soon as they find a new home. The standard consignment period lasts for 90 days, during which we provide personal service to ensure your pieces are showcased with timeless style. Please note that any unsold items must be picked up within 14 days of the consignment period's end, or they will be graciously donated. Located next to Ulta in Bluffton, SC, we are ready to help you make beautiful new connections through your cherished wardrobe pieces.
					</p>
				</div>
			</PageSection>



			<PageSection columns={3} maxWidth="1024px" id="consign-steps-section">

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						imgShape="round"
						img="https://images.ctfassets.net/luf8eony1687/6RlzYli6GihWE5ZlX5NMjd/7062a3019f693b0aea9b98cf2a2c6797/dress-from-collection-museum-fine-arts.jpg"
						title="Bring in clean, high quality items" />
				</PageGridItem>

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						imgShape="round"
						img="https://images.ctfassets.net/luf8eony1687/2PrS6U4n2RZtbfIGmaVBwu/a8488410b2603cb3496e7fa65a52a1e4/lot-party-dresses-hanging-hangers-market.jpg"
						title="We price, display, and sell for you" />
				</PageGridItem>

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						imgShape="round"
						img="https://images.ctfassets.net/luf8eony1687/3YRpDlwKMuPFSY2jWvvZ4b/c43964e61dd814804e46dc4b8f49d8f4/currency-chronicles-dollar-bills-photography-collection.jpg"
						title="You earn when your items sell!" />
				</PageGridItem>

			</PageSection>



			<PageSection columns={1} maxWidth="1024px" id="consign-steps-section">

				<PageGridItem>
					
					<Callout
						variant="boxed grid"
						gridColumns={{ left: 1, right: 3 }}
						layout="horizontal"
						img="/images/site/consignment-period.png"
						title="Consignment Details"
						buttonText="Explore Our Dancewear Collection">
						<ul>
							<li style={{ display: "list-item"}}>Items must be clean, in excellent condition, and ready to sell.</li>
							<li style={{ display: "list-item"}}>We reserve the right to accept or decline any item. </li>
							<li style={{ display: "list-item"}}>Unsold items must be picked up within 14 days of the consignment period's end, or they will be donated.</li>
							<li style={{ display: "list-item"}}>While we take great care of your items, we are not responsible for any loss or damage.</li>
						</ul>
					</Callout>
					
				</PageGridItem>

			</PageSection>
		</>
	);
}

"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function DancewearPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="dancewear-section">
				<PageTitleHeader title="Terpsichore's Dancewear" />
				<div>
					<p>
						Terpsichore's Dancewear serves as the premier destination for the Lowcountry dance community, offering an expansive selection of high-performance apparel and footwear designed to meet the rigorous demands of the studio and the stage. When you visit our Bluffton boutique, you are invited to explore a curated inventory featuring industry-leading brands such as Bloch, Capezio, Nikolay, and Mirella. Our shelves are stocked with a diverse array of professional-grade leotards, durable tights, sleek unitards, and trendy crop tops from celebrated designers like Eurotard, Suffolk, and Body Wrappers. Whether you are a young student preparing for a first creative movement class or a seasoned professional requiring the technical precision of Gaynor Minden or Grishko, our collection ensures that every dancer finds the perfect silhouette. By choosing to shop in-person, you gain the advantage of touching the high-quality fabrics and seeing the vibrant palettes of brands like Ainsliewear and Mariia, ensuring your performance gear is as visually stunning as it is functional.
					</p>
					<p>
						Beyond our extensive product range, the hallmark of the Terpsichore experience is our unwavering commitment to exceptional customer service and meticulous attention to detail. We understand that the right fit is the foundation of a dancer’s confidence and safety, which is why our knowledgeable staff takes the time to provide personalized consultations for every guest. From the delicate adjustment of a drawstring to ensuring the correct line of a leotard, we approach every interaction with the technical expertise that only a specialized dancewear boutique can offer. Our team is dedicated to helping you navigate the specific dress codes of local studios while providing a supportive environment for dancers of all ages and levels. By visiting us in person, you bypass the guesswork of online shopping and receive the specialized care required for complex needs like professional pointe shoe fittings. At Terpsichore's Dancewear, we don’t just sell apparel; we provide the professional guidance and premium tools necessary for you to achieve your artistic goals with grace and poise.
					</p>
				</div>
			</PageSection>


			<PageSection columns={2} maxWidth="768px" id="dancewear-packages-section">

				<PageGridItem columnSpan={2}>
					<PageSectionHeader title="Ballet Stage Ready Packages" />
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg"
						imgShape="round"
						subtitle="Capezio Ballet Package" 
						content="Ultra Soft Transition Tight and Hanami Canvas Ballet Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$38.00</h4>
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/7FxnyavD2c9DaDIXLfw4sJ/2c36579a4432f62224a41d0b1c25f619/ThreeMusesFinal-6169-v2.jpg"
						imgShape="round"
						subtitle="Bloch Ballet Package" 
						content="Contour Soft Adaptatoe Tight and Performa Ballet Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$34.00</h4>
				</PageGridItem>

				<PageGridItem columnSpan={2}>
					<PageSectionHeader columnSpan={2} title="Jazz Stage Ready Packages" />
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/2o5J6PWPmMzedRVfk9UlMS/a80aacc6decb4a2da5895b68c43e62bf/ThreeMusesFinal-6512.jpg"
						imgShape="round"
						subtitle="Capezio Jazz Package"  
						content="Ultra Soft Transition Tight and E-Series Jazz Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$60.00</h4>
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/7qApDugQR5cfqZTi5mocrZ/4dda19935d04bf137493e542b07604f2/ThreeMusesFinal-6511-v2.jpg"
						imgShape="round"
						subtitle="Bloch Jazz Package"  
						content="Contour Soft Adaptatoe Tight and Pulse Jazz Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$55.00</h4>
				</PageGridItem>
			</PageSection>

		</>
	);
}

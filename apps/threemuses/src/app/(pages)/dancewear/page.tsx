"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem, ServicesSchema } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import * as componentLibrary from "../../elements/componentlibrary";

export default function DancewearPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="dancewear-section">
				<PageTitleHeader title="The Three Muses of Bluffton Dancewear" />
				<div>
					<p>
						Dancewear is the Lowcountry's premier destination for high-performance apparel and footwear. Our Bluffton boutique features a curated inventory of industry-leading brands like Bloch, Capezio, Jo+Jax, and Mirella. We stock professional-grade leotards, durable tights, and sleek unitards from celebrated designers such as Eurotard, Suffolk, and Body Wrappers. Whether you need the technical precision of Gaynor Minden or the style of Ainsliewear, our collection ensures every dancer finds their perfect silhouette. Shopping in-person allows you to experience high-quality fabrics and vibrant palettes firsthand, ensuring your gear is both stunning and functional.
					</p>
					<p>
						Exceptional customer service and meticulous attention to detail are the hallmarks of your experience with The Three Muses of Bluffton. Our knowledgeable staff provides personalized consultations, understanding that a proper fit is vital for a dancer's confidence and safety. The Three Muses of Bluffton offers specialized technical expertise, from delicate drawstring adjustments to professional pointe shoe fittings, that online shopping cannot replicate. Our team also helps you navigate local studio dress codes within a supportive environment for all ages. We provide the professional guidance and premium tools necessary to achieve your artistic goals with grace and poise.
					</p>
				</div>
			</PageSection>
			<ServicesSchema />

			<PageSection columns={2} maxWidth="768px" id="dancewear-packages-section">

				<PageGridItem columnSpan={2}>
					<PageSectionHeader title="Ballet Stage Ready Packages" />
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg?fm=webp"
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
						img="https://images.ctfassets.net/luf8eony1687/7FxnyavD2c9DaDIXLfw4sJ/2c36579a4432f62224a41d0b1c25f619/ThreeMusesFinal-6169-v2.jpg?fm=webp"
						imgShape="round"
						subtitle="Bloch Ballet Package" 
						content="Contour Soft Adaptatoe Tight and Performa Ballet Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$34.00</h4>
				</PageGridItem>

				<PageGridItem columnSpan={2}>
					<PageSectionHeader title="Jazz Stage Ready Packages" />
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="https://images.ctfassets.net/luf8eony1687/2o5J6PWPmMzedRVfk9UlMS/a80aacc6decb4a2da5895b68c43e62bf/ThreeMusesFinal-6512.jpg?fm=webp"
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
						img="https://images.ctfassets.net/luf8eony1687/7qApDugQR5cfqZTi5mocrZ/4dda19935d04bf137493e542b07604f2/ThreeMusesFinal-6511-v2.jpg?fm=webp"
						imgShape="round"
						subtitle="Bloch Jazz Package"  
						content="Contour Soft Adaptatoe Tight and Pulse Jazz Shoe" 
					/>
					<h4 style={{ textAlign: 'center' }}>$55.00</h4>
				</PageGridItem>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="boutique-consign-section">
				<componentLibrary.ConsignWithUs />
			</PageSection>

		</>
	);
}

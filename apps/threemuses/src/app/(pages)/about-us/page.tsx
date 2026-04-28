"use client";

import React from "react";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { GoogleReviewsCarousel } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

export default function AboutUsPage() {
	const config = usePixelatedConfig();

	return (
		<>

			<PageTitleHeader title="About Three Muses" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				
				<PageSectionHeader title="Our History" />
				<div>
					<p>
						The story of The Three Muses of Bluffton is a testament to the enduring bond between mother and daughter and their shared passion for the classical arts and meticulous craftsmanship. Officially organized as a Domestic Limited-Liability Partnership on April 16, 2025, the business was born from the vision of Katie Coupland and her mother, Kathie. For Katie, the shop represents a professional evolution of her lifelong dedication to movement; having spent years as a dancer herself, she recognized a need in the Bluffton community for a specialized space that offered not only high-quality dancewear but also the technical expertise required for professional fittings. Her transition from the stage to the storefront allowed her to translate her firsthand knowledge of performance needs into a curated retail experience that serves local studios with unparalleled authority and grace.
					</p>
					<p>
						Complementing Katie's background in dance is her mother Kathie's deep-rooted expertise in the textile arts. Kathie's influence is the heartbeat of the studio's creative wing, where she oversees the sewing curriculum, community events, and professional alterations. Her vision was to create a sanctuary where the "rhythm of the needle" could be taught to a new generation, ensuring that the practical skills of tailoring and design remain a vibrant part of the Lowcountry's culture. Together, they have expanded their mission to include a boutique that champions local artisans, bringing the finest regional crafts under one roof. Today, The Three Muses of Bluffton stands as a beacon of inspiration in South Carolina, proving that when mother and daughter combine their unique talents, they create a space where every stitch, step, and style is infused with a legacy of love and artistry.
					</p>
				</div>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="team-section">

				<PageSectionHeader title="Our Team" />

				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="/images/logo/muse1-terpsichore.png"
					title="Katie Coupland"
					content="As the co-founder and driving force behind the dancewear division of The Three Muses, Katie brings a lifetime of elite performance experience to the Bluffton community. Having spent years training and performing as a classical dancer, she possesses an intimate understanding of the technical requirements and physical demands placed on an athlete's gear. This firsthand expertise allows her to provide specialized pointe shoe fittings and professional apparel consultations with a level of precision and empathy that only a fellow dancer can offer. Katie is dedicated to ensuring that every performer who enters the shop feels empowered, supported, and perfectly equipped to achieve their artistic dreams on stage."
				/>

				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="/images/logo/muse2-erato.png"
					title="Kathie"
					content="Kathie is the creative heart of the studio's sewing and boutique operations, where her lifelong mastery of the textile arts serves as a cornerstone for the business. With a deep passion for education and craftsmanship, she curates the shop's sewing curriculum and leads the in-house alterations department with meticulous care and an eye for timeless style. Beyond her work at the sewing machine, Kathie is a champion of the local arts scene, frequently collaborating with regional artisans to bring unique, high-quality handcrafted treasures into the boutique. Her mission is to foster a welcoming space where the Bluffton community can gather to learn, create, and celebrate the enduring beauty of handmade artistry."
				/>

			</PageSection>


			<PageSection columns={1} maxWidth="768px" padding="20px" id="reviews-section">
				<PageSectionHeader title="Customer Reviews" />
				{config?.googlePlaces?.apiKey ? (
					<GoogleReviewsCarousel
						placeId={config.googlePlaces.placeId ?? ''}
						apiKey={config.googlePlaces.apiKey}
						proxyBase={config?.global?.proxyUrl || ''}
						businessName="The Three Muses of Bluffton"
						draggable={true}
						imgFit="contain"
					/>
				) : null}
			</PageSection>
		</>
	);
}

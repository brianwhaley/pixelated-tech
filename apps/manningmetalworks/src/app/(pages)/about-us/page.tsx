"use client";

import React, { useState, useEffect } from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { Carousel } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { ReviewSchema } from "@pixelated-tech/components";
import { getGoogleReviewsByPlaceId } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";

export default function AboutUsPage() {
	const config = usePixelatedConfig();
	const [carouselCards, setCarouselCards] = useState<any[]>([]);
	const [reviewSchemas, setReviewSchemas] = useState<any[]>([]);

	useEffect(() => {
		const fetchReviews = async () => {
			try {
				const result = await getGoogleReviewsByPlaceId({
					placeId: config?.googlePlaces?.placeId || "",
					proxyBase: config?.global?.proxyUrl || "",
					apiKey: config?.googlePlaces?.apiKey || "",
					maxReviews: 100,
				});

				// Transform reviews to carousel cards
				const cards = result.reviews.map((review: any, index: number) => ({
					headerText: `${review.rating}/5 Stars`,
					subHeaderText: review.text || "",
					bodyText: `- ${review.author_name}`,
					index: index,
					cardIndex: index,
					cardLength: result.reviews.length,
					image: review.profile_photo_url || "",
				}));
				setCarouselCards(cards);

				// Generate ReviewSchema from same data
				const schemas = result.reviews.map((review: any) => ({
					"@context": "https://schema.org/",
					"@type": "Review",
					"reviewRating": {
						"@type": "Rating",
						"ratingValue": review.rating.toString(),
					},
					"author": {
						"@type": "Person",
						"name": review.author_name,
					},
					"reviewBody": review.text || "",
					"itemReviewed": {
						"@type": "LocalBusiness",
						"name": "Manning Metalworks",
					},
				}));

				setReviewSchemas(schemas);
			} catch (error) {
				console.error("Error fetching reviews:", error);
			}
		};

		if (config?.googleMaps?.apiKey) {
			fetchReviews();
		}
	}, [config?.googleMaps?.apiKey]);

    
	return (
		<>

			<PageTitleHeader title="About Manning Metalworks" />
`
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				
				<PageSectionHeader title="Our History" />
				<div>
					<p>
							The foundation of Manning Metalworks was built on a commitment to the finer details of the metalworking craft. Our founder, Tim Manning, honed his skills while working for some of the most respected names in the industry. During his earlier years, Tim focused on the high-end complexities of ornamental fabrication, learning that the difference between a good weld and a great one lies in the precision of the preparation and the artistry of the finish. Tim also spent significant time at some highly reputed local forges, where he developed a reputation for reliability and technical proficiency—a relationship of mutual respect that continues to thrive today.
					</p>
					<p>
							In a recent and exciting chapter of our story, the company transitioned into a proud son-and-father-owned business when Tim's father, Greg Manning, officially joined the team. Greg brings a unique and disciplined perspective to the shop; after a long and successful career as a firefighter for the FDNY, he transitioned his passion and unwavering focus on safety into the metalworks trade. After completing his professional welding certification, Greg now applies the same life-saving attention to detail required in the fire service to every structural joint and custom project we produce.
					</p>
					<p>
							Today, Manning Metalworks operates out of the Morris Plains area, providing expert residential, commercial, and municipal services to clients throughout Morris County. Our history is one of continuous learning and deep local roots, allowing us to approach every job with the sophisticated skill of a large-scale firm and the personal accountability of a family business. Whether we are working on a municipal infrastructure project or a custom residential gate, we carry the lessons of our past into every spark we strike, ensuring that the Manning name remains synonymous with quality and integrity.
					</p>
				</div>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="bio-section">
				<PageSectionHeader title="Meet the Team" />
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/j4mgog9ij96e/72q7aF96JizutnU4rg5ypc/f0807c244e9ca3d63f9451c44fb0be84/manning-welding.jpg"
					title="Tim Manning | Founder & Lead Fabricator"
					subtitle="With a career forged in some of the most prestigious ornamental and structural shops in the industry, Tim brings an artisan's eye and an engineer's precision to every project."
					content="Tim Manning established Manning Metalworks on the principle that high-end craftsmanship should be accessible to residential, commercial, and municipal clients alike. His professional journey includes years of experience at La Forge De Style, where he mastered the intricate details of elite-level ornamental ironwork and fine-scale fabrication. Tim also spent significant time at White Iron LLC, where he honed his skills in heavy-duty structural welding and developed the robust industry relationships he maintains today. Now leading the shop in Morris Plains, Tim oversees every project to ensure it meets his uncompromising standards for structural integrity and aesthetic finish."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/j4mgog9ij96e/3MWxQf0bBzfA9fKyX8YlR/8978cac4569a3422331f5a66313be23f/manning-repair.jpg"
					title="Greg Manning | Partner & Certified Welder"
					subtitle="Bringing a lifelong commitment to precision and care from the fire department, Greg transitioned into the family business to provide a unique, detail-oriented approach to metalwork."
					content="Greg Manning represents the 'father' in our son-and-father-owned partnership, joining the firm after a distinguished career as a firefighter with the FDNY. This background in the fire service instilled in Greg a deep-seated discipline and a 'measure twice, cut once' mentality that is rare in the construction trades. After completing his formal welding certification, Greg stepped into the shop to merge his attention to detail with the technical demands of modern fabrication. His presence ensures that Manning Metalworks operates with a level of organization and safety that reflects his decades of professional service, providing our clients with peace of mind and reliable results."
				/>
			</PageSection>

			<PageSection columns={1} maxWidth="768px" padding="20px" id="reviews-section">
				<PageSectionHeader title="Customer Reviews" />
				{reviewSchemas.map((review, idx) => (
					<ReviewSchema key={idx} review={review} />
				))}
				{carouselCards.length > 0 && <Carousel cards={carouselCards} />}
			</PageSection>

		</>
	);
}

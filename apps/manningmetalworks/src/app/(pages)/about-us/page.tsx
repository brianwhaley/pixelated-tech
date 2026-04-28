"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { GoogleReviewsCarousel } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";

export default function AboutUsPage() {
	const config = usePixelatedConfig();    
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


			<PageSection columns={1} maxWidth="768px" padding="20px" id="bio-section">
				<PageSectionHeader title="Meet the Team" />
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="vertical"
					img="https://images.ctfassets.net/j4mgog9ij96e/72q7aF96JizutnU4rg5ypc/f0807c244e9ca3d63f9451c44fb0be84/manning-welding.jpg"
					title="Tim and Greg Manning"
					subtitle="The Son-and-Father Fabrication Duo"
				/>
			</PageSection>

			<PageSection columns={1} maxWidth="768px" padding="20px" id="reviews-section">
				<PageSectionHeader title="Customer Reviews" />
				{config?.googlePlaces?.placeId && (
					<GoogleReviewsCarousel
						placeId={config.googlePlaces.placeId}
						apiKey={config?.googlePlaces?.apiKey || ''}
						proxyBase={config?.global?.proxyUrl || ''}
						maxReviews={10}
						businessName="Manning Metalworks"
					/>
				)}
			</PageSection>

		</>
	);
}

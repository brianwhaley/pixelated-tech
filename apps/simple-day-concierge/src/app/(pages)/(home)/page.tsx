"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem, Callout, SmartImage, buildServiceUrl, usePixelatedConfig } from '@pixelated-tech/components';

const headers = [
	"https://images.ctfassets.net/jc3fkpb2sdyr/1BnguPZQ497FdhDvo7XAsZ/d702761c01c20c69d83ca75a2f4474ac/phone-coffee.jpg?fm=webp",
	"https://images.ctfassets.net/jc3fkpb2sdyr/1DP5suqBmGEeWpcpe3XRb2/091efa84476bd51ce016ffda6097ae74/smartphone-notebook-planning-affairs-lie-wooden-table.jpg?fm=webp",
	"https://images.ctfassets.net/jc3fkpb2sdyr/2MOsQbltCoRHLOGgAVVp36/33870a3776a0887e3c120bdee4fb2bf3/coffee-cup-table.jpg?fm=webp",
	"https://images.ctfassets.net/jc3fkpb2sdyr/6unIVGY5ojJjC3irKiPooA/893f64371f264069a0f3f378c6c3606e/high-angle-view-coffee-cup-table.jpg?fm=webp",
];

export default function Home() {
	const pixelatedConfig = usePixelatedConfig();
	const services = pixelatedConfig?.siteInfo?.services ?? [];
	const headerImg = headers[Math.floor(Math.random() * headers.length)];
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="home-header-section">
				<PageTitleHeader title="Simple Day Concierge Service" />
				<SmartImage
					src={headerImg}
					alt="Simple Day Concierge Service - Where Simplicity Meets Exceptional Service"
					width="2000"
					height="200"
					aboveFold
					style={{ objectFit: 'cover', width: '100%', height: '20vh', opacity: 0.5 }}
				/>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-promise-section">
				<PageSectionHeader>The Simple Day Promise:<br />Where Simplicity Meets Exceptional Service</PageSectionHeader>

				<p>Welcome to Simple Day Concierge Service</p>

				<p>We understand that your time is your most precious asset. Simple Day was founded with the single-minded goal of handling all of your logistics and planning, from daily errands to complex travel, with an unmatched level of attention and execution. Founded by Patti and Joe Jadevaia, our family business transforms daily chaos into a seamless experience of absolute peace of mind.</p>

				<p>Rooted in our founders' corporate cybersecurity backgrounds, Simple Day Concierge protects your personal information with strict security and total discretion. We focus on building high-touch relationships, learning your exact tastes to manage your home quietly and efficiently in the background. Whether we are stocking your kitchen before you return from vacation or supervising a home repair, Simple Day COncierge treats your family like our own. We promise to lift the daily mental load entirely, giving you the freedom to finally enjoy your time.</p>
			</PageSection>

			<PageSection columns={4} maxWidth="1024px" id="home-services-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Our Services" />
				</PageGridItem>
				
				{services.map((service: any, index: number) => (
					<PageGridItem key={service.name ?? index}>
						<Callout
							layout="vertical"
							subtitle={service.name}
							img={service.image}
							imgAlt={service.name}
							imgShape="bevel"
							url={buildServiceUrl(service, "/services")}
						/>
					</PageGridItem>
				))}
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-membership-section">
				<PageSectionHeader title="Membership" />
				<div style={{ overflow: 'auto' }}>
					<SmartImage
						src="https://images.ctfassets.net/jc3fkpb2sdyr/3MGsNU6jDZQKsOxbtti1VB/c9f9f06607050eb7551ac2f2eb4578f2/magnific__talk__30044.jpeg?fm=webp"
						alt="Simple Day Concierge Service - Where Simplicity Meets Exceptional Service"
						width="500"
						height="500"
						aboveFold
						style={{ float: 'left', aspectRatio: "1/1", objectFit: 'cover', opacity: 0.7, width: '150px', height: '150px', marginRight: '20px', borderRadius: '8px' }}
					/>
					<p>
						Becoming a monthly member of Simple Day Concierge unlocks an elite level of personalized lifestyle support for your household. As a dedicated subscriber, you receive guaranteed calendar placement and priority scheduling, ensuring our trusted team is available precisely when your schedule demands it. Membership delivers premium perks, including significant discounts on bulk hour pricing and early access to all the newly launched Simple Day Concierge service offerings. Members also enjoy streamlined, direct communication for immediate checklist updates and last-minute errand adjustments. Check out the Simple Day Concierge <a href="/pricing">flexible subscription options</a> on the pricing page to find the perfect tier for your home.
					</p>
				</div>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-spacer-section">
				<p>&nbsp;</p>
			</PageSection>

		</>
	);
}
 
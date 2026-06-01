"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader } from '@pixelated-tech/components';

export default function Home() {
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader title="Simple Day Concierge Service" />
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="promise-section">
				<PageSectionHeader>The Simple Day Promise:<br />Where Simplicity Meets Exceptional Service</PageSectionHeader>

				<p>Welcome to Simple Day Concierge Service</p>

				{ /* <p>We understand that your time is your most precious asset. Simple Day was founded with the single-minded goal of handling all of your logistics and planning, from daily errands to complex travel, with an unmatched level of attention and execution. Founded by Patti and Joe Jadevaia, our family business transforms daily chaos into a seamless experience of absolute peace of mind.</p>

				<p>Rooted in our founders' corporate cybersecurity backgrounds, we protect your keys, alarm codes, and personal data with strict security and total discretion. We focus on building high-touch relationships, learning your exact tastes to manage your home quietly and efficiently in the background. Whether we are stocking your kitchen before you return from vacation or supervising a home repair, we treat your family like our own. We promise to lift the daily mental load entirely, giving you the freedom to finally enjoy your time.</p> */ }
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="services-section">
				<PageSectionHeader title="Our Services" />
				<p>Welcome to Simple Day Concierge Service</p>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="membership-section">
				<PageSectionHeader title="Membership" />
				<p>Welcome to Simple Day Concierge Service</p>
			</PageSection>
		</>
	);
}
 
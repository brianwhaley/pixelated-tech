"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";

export default function Pricing() {
	
    
	return (
		<>

			<PageTitleHeader title="Simple Day Concierge Pricing" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="services-pricing-section">
				<PageSectionHeader title="Services" />
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="packages-pricing-section">
				<PageSectionHeader title="Packages" />
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="subscriptions-pricing-section">
				<PageSectionHeader title="Subscriptions" />
				<PageSectionHeader title="Subscription Benefits" />
			</PageSection>


		</>
	);
}

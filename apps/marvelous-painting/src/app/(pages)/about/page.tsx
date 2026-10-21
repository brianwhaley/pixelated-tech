"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";

export default function AboutPage() {
	return (
		<>
			<PageTitleHeader title="About Marvelous Painting" />
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				<PageSectionHeader title="A painting and remodeling partner in Northern New Jersey" />
				<p>Marvelous Painting has served the community for more than 25 years. The company began with painting services, expanded into exterior work, and grew into renovations including kitchens, bathrooms, decks, crown molding, wainscoting, and custom carpentry.</p>
				<p>Today, each project is approached with the same hands-on attention to preparation, finish quality, communication, and care for the home or business being improved.</p>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="commitment-section">
				<PageSectionHeader title="The Marvelous quality commitment" />
				<p>Marvelous Painting is fully licensed and insured, certified in lead-safe work practices by the EPA, and committed to professional, reliable service at a reasonable price.</p>
			</PageSection>

		</>
	);
}

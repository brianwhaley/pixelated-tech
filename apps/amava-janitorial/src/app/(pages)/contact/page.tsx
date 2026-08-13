 
"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, usePixelatedConfig } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/contactform.json";
import { PageHero } from "@/app/elements/page-hero";

export default function ContactPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "AMAVA Janitorial";

	return (
		<>
			<PageHero />

			<PageTitleHeader title={`Contact ${siteName}`} />

			{siteInfo && (
				<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-info-section">
					<PageSectionHeader title="Contact Information" />
					<div style={{ margin: '0 auto' }}>
						<h3>Address:</h3>
						<p>
							<a href="https://maps.app.goo.gl/2bD1zr43i5CmkfAk7" target="_blank" rel="noopener noreferrer">
								{siteInfo?.address?.streetAddress}, {siteInfo?.address?.addressLocality}, {siteInfo?.address?.addressRegion} {siteInfo?.address?.postalCode}
							</a>
						</p>
						<h3>Email:</h3>
						<p><a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></p>
						<h3>Phone:</h3>
						<p><a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></p>
					</div>
				</PageSection>
			)}

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-us-section">
				<PageSectionHeader title="Contact Us" />
				<div style={{ margin: '0 auto', border: '2px solid var(--accent1-color)', padding: '20px', borderRadius: '20px' }}>
					<FormEngine formData={formData as any} />
				</div>
			</PageSection>

		</>
	);
}

 
"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, usePixelatedConfig } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/contactform.json";

export default function ContactPage() {
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo ?? {};
	const address = siteInfo.address;
	const email = siteInfo.email;
	const telephone = siteInfo.telephone;

	return (
		<>
			<PageTitleHeader title="Contact Simple Day Concierge" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-us-section">
				<PageSectionHeader title="Contact Us" />
				<div className="contact-us-form-wrapper" style={{ margin: '0 auto', border: '2px solid var(--accent1-color)', padding: '20px', borderRadius: '20px' }}>
					<FormEngine formData={formData as any} />
				</div>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-info-section">
				<PageSectionHeader title="Contact Information" />
				<div style={{ margin: '0 auto' }}>
					<h3>Address:</h3>
					{address ? (
						<p>
							<a href="https://maps.app.goo.gl/2bD1zr43i5CmkfAk7" target="_blank" rel="noopener noreferrer">
								{address.streetAddress}, {address.addressLocality}, {address.addressRegion} {address.postalCode}
							</a>
						</p>
					) : null}
					<h3>Email:</h3>
					{email ? <p><a href={`mailto:${email}`}>{email}</a></p> : null}
					<h3>Phone:</h3>
					{telephone ? <p><a href={`tel:${telephone}`}>{telephone}</a></p> : null}
				</div>
			</PageSection>

		</>
	);
}

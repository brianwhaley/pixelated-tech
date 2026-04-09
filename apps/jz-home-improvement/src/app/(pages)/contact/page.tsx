 
"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/contactform.json";
import routes from "@/app/data/routes.json";
const siteInfo = (routes as any).siteInfo;

export default function ContactPage() {
	return (
		<>
			<PageTitleHeader title="Contact JZ Home Improvement" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-us-section">
				<div>
					<p>
						If you are planning a home improvement project in Union, New Jersey or the surrounding area, JZ Home Improvement is the trusted local partner you can rely on from the first conversation to the final walk-through. JZ Home Improvement brings more than 30 years of hands-on experience in residential renovation, repairs, and technical trades to every project. You are not handed off to salespeople or rotating crews—your project is guided by an experienced professional who is directly involved in the work and accountable for the results.
					</p>
					<p>
						Homeowners contact JZ Home Improvement because they want honest guidance, clear communication, and pricing that is fair and transparent from the start. Whether you are remodeling a kitchen, updating a bathroom, finishing a basement, or tackling long-overdue repairs, you will receive practical recommendations tailored to your home and your budget. Built almost entirely on referrals and repeat clients, JZ Home Improvement has earned its reputation by consistently delivering expert work, honest pricing, and beautiful results for families throughout Union and Northern New Jersey.
					</p>
				</div>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-us-section">
				<PageSectionHeader title="Contact Us" />
				<div style={{ margin: '0 auto', border: '2px solid var(--accent1-color)', padding: '20px', borderRadius: '20px' }}>
					<FormEngine formData={formData as any} />
				</div>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="contact-info-section">
				<PageSectionHeader title="Contact Information" />
				<div style={{ margin: '0 auto' }}>
					<h3>Address:</h3>
					<p>
						<a href="https://maps.app.goo.gl/2bD1zr43i5CmkfAk7" target="_blank" rel="noopener noreferrer">
							{siteInfo.address.streetAddress}, {siteInfo.address.addressLocality}, {siteInfo.address.addressRegion}, {siteInfo.address.postalCode}
						</a>
					</p>
					<h3>Email:</h3>
					<p><a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></p>
					<h3>Phone:</h3>
					<p><a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></p>
				</div>
			</PageSection>

		</>
	);
}

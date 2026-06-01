"use client";

import React from "react";
import siteConfig from '@/app/data/siteconfig.json';
import { PageSection, PageGridItem, PageSectionHeader } from "@pixelated-tech/components";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
import { BusinessFooterAddress, BusinessFooterMap } from "@pixelated-tech/components";

export default function Footer() {
	const siteInfo = (siteConfig as any).siteInfo;
	return (
		<>
			<PageSection id="footer" columns={3} maxWidth="1024px" padding="20px 0 0 0">
				<PageGridItem>
					<BusinessFooterAddress
						name={siteInfo.name}
						address={siteInfo.address}
						addressAdditionalInfo={siteInfo.addressAdditionalInfo}
						telephone={siteInfo.telephone}
						email={siteInfo.email}
					/>
				</PageGridItem>

				<PageGridItem>
					<BusinessFooterMap address={siteInfo.address} />
				</PageGridItem>

				<PageGridItem>
					<PageSectionHeader title="Useful Links" />
					<ul style={{ listStyleType: "none", textAlign: "center", margin: 0, padding: 0 }}>
						<li><a href="/about">About Us</a></li>
						<li><a href="/pricing">Pricing</a></li>
						<li><a href="/contact">Contact Us</a></li>
						<li><a href="/faqs">FAQs</a></li>
						<li><a href="/about">About Us</a></li>
						<li><a href="/services">Services</a></li>
						<li><a href="/service-areas">Service Areas</a></li>
						<li><a href="/terms">Terms of Service</a></li>
					</ul>
				</PageGridItem>
			</PageSection>

			<PageSection id="footer" columns={1} maxWidth="1024px" padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<GoogleAnalytics id="" />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<br />
					<div className="centered">
						<p className="footer-text">&copy; {new Date().getFullYear()} Simple Day Concierge Service. All rights reserved.</p>

						<PixelatedFooter />
						
					</div>
				</div>
			</PageSection>
		</>
	);
}

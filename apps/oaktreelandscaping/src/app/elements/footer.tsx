"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
// import { GoogleAnalytics } from '@next/third-parties/google';
import SocialTags from "@/app/elements/socialtags";


export default function Footer() {
	return (
		<>
			<PageSection maxWidth="1024px" id="social-section" columns={1} background="var(--accent2-color)">
				<SocialTags />
			</PageSection>

			<PageSection id="footer-section" columns={1} padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<GoogleAnalytics id="G-S4FFGHP3ZN" />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<br />
					<div className="centered">
						<p className="footer-text">&copy; {new Date().getFullYear()} Oaktree Landscaping. All rights reserved.</p>

						<PixelatedFooter />
					
					</div>
				</div>
			</PageSection>
		</>
	);
}

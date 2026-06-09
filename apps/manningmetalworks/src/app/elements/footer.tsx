"use client";

import React from "react";
import { PageSection, GoogleAnalytics, PixelatedFooter, BusinessFooter, usePixelatedConfig } from "@pixelated-tech/components";
import SocialTags from "./socialtags";

export default function Footer() {
	const pixelatedConfig = usePixelatedConfig();
	const googleMapsApiKey = pixelatedConfig?.googleMaps?.apiKey ?? undefined;
	const siteInfo = pixelatedConfig?.siteInfo;

	return (
		<>
			<PageSection id="footer" columns={1} maxWidth="1024px" padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<GoogleAnalytics />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<SocialTags />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<BusinessFooter siteInfo={siteInfo} googleMapsApiKey={googleMapsApiKey} />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<div className="centered">
						<br />
						<p className="footer-text">&copy; {new Date().getFullYear()} Manning Metalworks. All rights reserved.</p>
						<PixelatedFooter />
					</div>
				</div>
			</PageSection>
		</>
	);
}

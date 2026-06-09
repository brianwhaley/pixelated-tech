"use client";

import React from "react";
import { PageSection, GoogleAnalytics, PixelatedFooter, usePixelatedConfig } from "@pixelated-tech/components";

export default function Footer() {
	const config = usePixelatedConfig();
	const siteName = config?.siteInfo?.name || "__SITE_NAME__";

	return (
		<PageSection id="footer" columns={1} max-width="1024px" padding="20px 0 0 0">
			<div suppressHydrationWarning={true} >
				<GoogleAnalytics />
				<hr style={{ margin: "0 auto", width: "80%" }} />
				<br />
				<div className="centered">
					<p className="footer-text">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>

					<PixelatedFooter />
					
				</div>
			</div>
		</PageSection>
	);
}

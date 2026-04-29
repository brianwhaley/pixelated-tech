"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
import { BusinessFooter } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";
import SocialTags from "./socialtags";
import siteConfig from "@/app/data/siteconfig.json";
const siteInfo = (siteConfig as any).siteInfo;

export default function Footer() {
	const config = usePixelatedConfig();
	const googleMapsApiKey = config?.googleMaps?.apiKey ?? undefined;

	return (
		<>
			<PageSection id="footer" columns={1} max-width="1024px"padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<GoogleAnalytics id="G-7V857NV7TW" />
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

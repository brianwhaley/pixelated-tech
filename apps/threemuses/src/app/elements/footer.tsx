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

			<PageSection id="footer" columns={1} maxWidth="1024px" padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<GoogleAnalytics id="G-VGD1JHM9FN" />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<SocialTags />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<BusinessFooter siteInfo={siteInfo} googleMapsApiKey={googleMapsApiKey} />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<br />
					<div className="centered">
						<p className="footer-text">&copy; {new Date().getFullYear()} The Three Muses of Bluffton. All rights reserved.</p>
						<PixelatedFooter />
					</div>
				</div>
			</PageSection>
		</>
	);
}

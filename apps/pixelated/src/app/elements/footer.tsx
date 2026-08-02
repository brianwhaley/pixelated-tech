import { headers } from "next/headers";
import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
import { GoogleAnalytics, GoogleAnalyticsEvent } from "@pixelated-tech/components";
// import { GoogleAnalytics } from '@next/third-parties/google';

export default async function Footer() {
	const reqHeaders = await headers();
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	return (
		<PageSection id="footer-section" columns={1} padding="20px 0 0 0">
			<div suppressHydrationWarning={true} >
				<GoogleAnalytics />
				<GoogleAnalyticsEvent event_name="conversion" 
					event_parameters={{ 
						send_to: "AW-17721931789/qOjmCM77-74bEI3wvIJC", 
						value: 1.0, 
						currency: "USD" 
					}} 
				/>
				{ /* <GoogleAnalytics gaId="G-1J1W90VBE1" /> */ }
				<hr style={{ margin: "0 auto", width: "80%" }} />
				<br />
				<div className="centered">
					<p className="footer-text">&copy; {new Date().getFullYear()} Pixelated Technologies. All rights reserved.</p>
					<PixelatedFooter pathname={pathname} />
				</div>
				<br /><br />
			</div>
		</PageSection>
	);
}

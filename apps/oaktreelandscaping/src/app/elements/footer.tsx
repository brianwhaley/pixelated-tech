import { headers } from "next/headers";
import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
// import { GoogleAnalytics } from '@next/third-parties/google';
import { SocialTags } from "@pixelated-tech/components";


export default async function Footer() {
	const reqHeaders = await headers();
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	return (
		<>
			<PageSection maxWidth="1024px" id="social-section" columns={1} background="var(--accent2-color)">
				<SocialTags />
			</PageSection>
			<PageSection id="footer-section" columns={1} padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<GoogleAnalytics />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<br />
					<div className="centered">
						<p className="footer-text">&copy; {new Date().getFullYear()} Oaktree Landscaping. All rights reserved.</p>
						<PixelatedFooter pathname={pathname} />
					</div>
				</div>
			</PageSection>
		</>
	);
}

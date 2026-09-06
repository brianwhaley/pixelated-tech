import { headers } from "next/headers";
import React from "react";
import { PageSection, GoogleAnalytics, PixelatedFooter } from "@pixelated-tech/components";
import { getFullPixelatedConfig } from "@pixelated-tech/components/server";
import { FooterMenu } from "@pixelated-tech/components/server";
import { BusinessFooter } from "@pixelated-tech/components";
// import { SocialTags } from "@pixelated-tech/components";

export default async function Footer() {
	const reqHeaders = await headers();
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	const config = await getFullPixelatedConfig();
	const siteName = config?.siteInfo?.name || "AMAVA Janitorial";
	return (
		<PageSection id="footer" columns={1} maxWidth="1024px" padding="20px 0 0 0">
			<div suppressHydrationWarning={true} >
				<GoogleAnalytics />
				<hr style={{ margin: "0 auto", width: "80%" }} />
				{ /* <SocialTags />
				<hr style={{ margin: "0 auto", width: "80%" }} /> */ }
				<BusinessFooter />
				<hr style={{ margin: "0 auto", width: "80%" }} />
				<br />
				<FooterMenu />
				<br />
				<hr style={{ margin: "0 auto", width: "80%" }} />
				<br />
				<div className="centered">
					<p className="footer-text">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
					<PixelatedFooter pathname={pathname} />
				</div>
			</div>
		</PageSection>
	);
}
    
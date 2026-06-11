"use client";

import React from "react";
import { PageSection, GoogleAnalytics, PixelatedFooter, BusinessFooter } from "@pixelated-tech/components";
import SocialTags from "./socialtags";

export default function Footer() {
	return (
		<>
			<PageSection id="footer" columns={1} maxWidth="1024px" padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<GoogleAnalytics />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<SocialTags />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<BusinessFooter />
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

import { headers } from "next/headers";
import React from "react";
import { GoogleAnalytics } from "@pixelated-tech/components";
// import { GoogleAnalytics } from '@next/third-parties/google';
import { PixelatedFooter } from "@pixelated-tech/components";

export default async function Footer() {
	const reqHeaders = await headers();
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	return (
		<div className="section-container" suppressHydrationWarning={true} >
			<GoogleAnalytics />
			{ /* <GoogleAnalytics gaId="G-1J1W90VBE1" /> */ }
			<hr style={{ margin: "0 auto", width: "80%" }} />
			<br />
			<div className="centered">
				<p className="footer-text">&copy; {new Date().getFullYear()} Brian T. Whaley. All rights reserved.</p>
				<PixelatedFooter pathname={pathname} />
			</div>
			<br /><br />
		</div>
	);
}

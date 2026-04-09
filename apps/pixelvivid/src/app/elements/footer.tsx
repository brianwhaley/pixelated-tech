"use client";

import React from "react";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";


export default function Footer() {
	return (
		<div className="section-container" suppressHydrationWarning={true} >
			
			<GoogleAnalytics id="G-B1NZG3YT9Y" />
			{ /* <GoogleAnalytics gaId="G-1J1W90VBE1" /> */ }
			
			<hr style={{ margin: "0 auto", width: "80%" }} />
			<br />
			<div className="centered">
				<p className="footer-text">&copy; {new Date().getFullYear()} PixelVivid. All rights reserved.</p>

				<PixelatedFooter />
					
			</div>
			<br /><br />

		</div>
	);
}

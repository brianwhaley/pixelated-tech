"use client";

import React from "react";
import Nav from "@/app/elements/nav";
// import { Analytics } from "@pixelated-tech/components";
import { GoogleAnalytics } from '@next/third-parties/google';
import { SmartImage } from "@pixelated-tech/components";


export default function Footer() {
	return (
		<div className="section-container">
			<div>
				<Nav />
				{ /* <Analytics id="G-X2R4REQ3NG" /> */ }
				<GoogleAnalytics gaId="G-X2R4REQ3NG" />
			</div>

			<br />
			<div className="centered">
				<p className="footer-text">&copy; {new Date().getFullYear()} Palmetto Epoxy. All rights reserved.</p>

				<p className="footer-text">Designed and developed by 
					<a href="https://www.pixelated.tech" target="_blank" rel="noopener noreferrer">
						<SmartImage
							src="https://www.pixelated.tech/images/pix/pix-bg.png" alt="Pixelated Technologies"
							width={50} height={50}
							style={{ width: "20px", height: "20px", margin: "0 1px 0 8px", verticalAlign: "middle", borderRadius: "5px" }}
						/>Pixelated Technologies.
					</a>
				</p>
					
			</div>
			<br /><br />

		</div>
	);
}

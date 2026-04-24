
"use client";

import React from "react";
import { SmartImage } from "@pixelated-tech/components";
import Social from "@/app/elements/social";
import Nav from "@/app/elements/nav";
import siteConfig from "@/app/data/siteconfig.json";
const siteInfo = (siteConfig as any).siteInfo;

export default function Header() {
	return (
		<div className="section-container">

			<div className="row-10col">
				<div className="grid-s1-e3 header-logo">
					<a href="/">
						<SmartImage src="/images/logo/palmetto-epoxy-logo.jpg" 
							alt="Palmetto Epoxy Logo" aboveFold={true} 
							fetchPriority="high" loading="eager" />
					</a>
				</div>
			

				<div className="grid-s3-e10 header-right">

					<div className="row-1col">
					
						<div className="grid-item header-address">
							<h3>Dennis and Martha Aberle</h3>
							<h3>{siteInfo.address.addressLocality}, {siteInfo.address.addressRegion}</h3>
							<h3>{siteInfo.email}</h3>
							<h3>Tel : {siteInfo.telephone}</h3>
							<br />
						</div>

						<div className="grid-item header-social centered">
							<Social />
						</div>

					</div>

				</div>

			</div>

			<div>
				<Nav />
			</div>
			
		</div>
	);
}

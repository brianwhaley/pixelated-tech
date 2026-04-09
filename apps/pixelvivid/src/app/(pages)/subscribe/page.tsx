"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from "@pixelated-tech/components";
import { HubSpotForm, initializeHubSpotScript } from "@pixelated-tech/components";

export default function Subscribe() {
	useEffect(() => {
		initializeHubSpotScript("na2", "243048355");
	}, []);

	return (
		<div className="section-container">
			<PageTitleHeader title="Subscribe to PixelVivid Emails" />
			<div className="row-1col" suppressHydrationWarning={true} >
				<div>
					Subscribe to the PixelVivid newsletter and get regular updates on: 
					<ul>
						<li>Monthly activities</li>
						<li>New releases and custom sunglass drops</li>
						<li>Discounts and sales on existing custom sunglasses</li>
						<li>Announcements of upcoming drips and previews of their designs</li>
					</ul>
				</div>
				<HubSpotForm
					region="na2"
					portalId="243048355"
					formId="f5236434-f88f-4f87-a150-54070be4494c"
				/>
			</div>
		</div>
	);
}

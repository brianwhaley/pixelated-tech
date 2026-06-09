"use client";

import React from 'react';
import { PageTitleHeader, HubSpotForm } from "@pixelated-tech/components";

export default function Subscribe() {
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
				<HubSpotForm />
			</div>
		</div>
	);
}

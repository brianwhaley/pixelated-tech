"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function SupermarketShenanigansPage() {
	return (
		<PageSection columns={1} maxWidth="768px" id="supermarket-shenanigans-container">
			<SmartImage
				src="/images/supermarket-shenanigans-cover.jpg"
				alt="Supermarket Shenanigans"
				aboveFold={true}
				width={800}
				height={600}
			/>
		</PageSection>
	);
}

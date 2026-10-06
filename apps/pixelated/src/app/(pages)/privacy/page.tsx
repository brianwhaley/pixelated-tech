"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { PageTitleHeader } from "@pixelated-tech/components";
import Privacy from "@/app/elements/privacy";

export default function PrivacyPage() {
	return (
		<>
			<PageTitleHeader title="Privacy Policy" />
			<PageSection columns={1} id="privacy-section">
				<Privacy />
			</PageSection>
		</>
	);
}

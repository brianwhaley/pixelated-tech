import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";

export default function AboutPage() {
	return (
		<>
			<PageTitleHeader title="About MGT Pro Services" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				<PageSectionHeader title="Measured Project Planning" />
				<p>MGT Pro Services provides residential floor coatings, commercial floor coatings, and home renovation assessments across selected South Carolina markets.</p>
				<p>Each project begins with a review of the space, concrete or existing conditions, intended use, access, schedule, and finish goals. That information is used to determine whether the requested work is a fit and what next steps should be considered.</p>
				<p>Unknown project details are confirmed before a scope is proposed. Contact MGT Pro Services to request an assessment for a residential, commercial, or renovation project.</p>

			</PageSection>

		</>
	);
}

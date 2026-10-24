"use client";

import React from "react";
import { FormEngine, PageSection, PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";
import formData from "@/app/data/assessmentform.json";

export default function RequestAnAssessmentPage() {
	return (
		<>
			<PageTitleHeader title="Request an Assessment" />
			<PageSection columns={1} maxWidth="1024px" id="assessment-intro">
				<p>Tell MGT Pro Services about the space, surface, intended use, and timing. This information helps frame the next conversation; it does not commit you to a scope, system, price, or schedule.</p>
			</PageSection>
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="assessment-form-section">
				<PageSectionHeader title="Project Assessment Request" />
				<div style={{ margin: "0 auto", border: "2px solid var(--accent1-color)", padding: "20px", borderRadius: "8px" }}>
					<FormEngine formData={formData as any} />
				</div>
			</PageSection>
		</>
	);
}
 
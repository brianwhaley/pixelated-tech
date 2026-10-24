"use client";

import React from "react";
import { PageSection, PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";

export default function ProcessPage() {
	return (
		<>
			<PageTitleHeader title="Our Assessment Process" />
			<PageSection columns={1} maxWidth="1024px" id="process-intro">
				<p>A MGT Pro Services assessment starts with a practical review of the space, the existing surface, the intended use, and the project outcome.</p>
			</PageSection>
			<PageSection columns={2} maxWidth="1024px" gap="20px" id="process-steps">
				<PageSectionHeader title="From First Request to Project Scope" />
				<div><h3>1. Share the Project</h3><p>Provide the location, project type, approximate size, surface condition, intended use, and timing.</p></div>
				<div><h3>2. Review the Site</h3><p>Discuss access, slab or existing-material conditions, moisture questions, traffic, and operating constraints.</p></div>
				<div><h3>3. Define Preparation</h3><p>Identify cleaning, repairs, profiling, removal, protection, staging, and other preparation needs.</p></div>
				<div><h3>4. Compare Options</h3><p>Review finish goals, maintenance priorities, use requirements, and coating-system considerations.</p></div>
				<div><h3>5. Plan the Work</h3><p>Confirm scope, access, schedule, cure guidance, communication, and any coordination with other work.</p></div>
				<div><h3>6. Confirm Next Steps</h3><p>Move forward only after the project requirements and MGT Pro Services capabilities are understood.</p></div>
			</PageSection>
			<PageSection columns={1} maxWidth="1024px" id="process-cta">
				<p><a href="/request-an-assessment">Request an assessment</a> to start with the information available to you.</p>
			</PageSection>
		</>
	);
}
 
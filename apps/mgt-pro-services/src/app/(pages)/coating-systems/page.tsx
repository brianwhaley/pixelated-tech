"use client";

import React from "react";
import { PageSection, PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";

export default function CoatingSystemsPage() {
	return (
		<>
			<PageTitleHeader title="Coating Systems" />
			<PageSection columns={1} maxWidth="1024px" id="systems-intro">
				<p>Coating systems should be compared against the concrete, the environment, the intended use, the finish goal, and the maintenance plan. The following categories are starting points for an assessment, not a promise that every system fits every space.</p>
			</PageSection>
			<PageSection columns={3} maxWidth="1024px" gap="20px" id="systems-options">
				<PageSectionHeader title="Options to Discuss" />
				<div><h3>Epoxy</h3><p>Discuss where an epoxy system may fit based on substrate preparation, use, appearance, and project conditions.</p></div>
				<div><h3>Polyaspartic and Polyurea</h3><p>Review cure, exposure, traffic, preparation, and schedule requirements before selecting a system.</p></div>
				<div><h3>Flake and Quartz</h3><p>Consider decorative aggregate, texture, cleaning, and the intended commercial or residential environment.</p></div>
				<div><h3>Solid Color</h3><p>Compare a simpler visual direction with surface condition, maintenance, and finish expectations.</p></div>
				<div><h3>Slip-Resistant Texture</h3><p>Discuss texture needs alongside cleaning, use, accessibility, and the conditions of the space.</p></div>
				<div><h3>Topcoat and Maintenance</h3><p>Review exposure, traffic, cleaning practices, and maintenance expectations as part of the system plan.</p></div>
			</PageSection>
			<PageSection columns={1} maxWidth="1024px" id="systems-cta">
				<p><a href="/request-an-assessment">Request an assessment</a> to discuss which considerations matter for your space.</p>
			</PageSection>
		</>
	);
}
 
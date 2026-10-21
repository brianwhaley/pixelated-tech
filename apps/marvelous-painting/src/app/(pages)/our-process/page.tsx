"use client";

import React from "react";
import { PageSection, PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";

const exteriorSteps = [
	"Power wash the exterior with appropriate cleaners to remove dirt and mildew.",
	"Scrape, sand, caulk, and prime surfaces for a durable finish.",
	"Apply premium-quality paint for proper coverage and finish.",
	"Clean up paint chips and debris when the work is complete.",
	"Inspect the finished work with you before the project is closed out.",
];

const interiorSteps = [
	"Protect floors, furniture, and adjacent surfaces with drop cloths and plastic sheeting.",
	"Spackle, scrape, sand, and prime surfaces as needed.",
	"Apply premium-quality paint for a consistent finish.",
	"Leave the work area clean and tidy.",
	"Inspect the completed work with you and address the final details.",
];

function StepList({ steps }: { steps: string[] }) {
	return (
		<ol>
			{steps.map((step) => <li key={step}>{step}</li>)}
		</ol>
	);
}

export default function OurProcessPage() {
	return (
		<>
			<PageTitleHeader title="Our Process" />
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="process-introduction">
				<PageSectionHeader title="Preparation is part of the finish" />
				<p>Every project begins with a clear understanding of the surfaces, the scope, and the desired result. Preparation, communication, and cleanup are treated as part of the work, not as afterthoughts.</p>
			</PageSection>
			<PageSection columns={2} maxWidth="1024px" padding="20px" id="painting-process-steps">
				<div>
					<PageSectionHeader title="Exterior painting process" />
					<StepList steps={exteriorSteps} />
				</div>
				<div>
					<PageSectionHeader title="Interior painting process" />
					<StepList steps={interiorSteps} />
				</div>
			</PageSection>
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="remodeling-process">
				<PageSectionHeader title="Remodeling and carpentry projects" />
				<p>For kitchens, trim, wainscoting, decks, and other custom work, the process starts with a project conversation and site review. Scope, materials, sequencing, and finish details are discussed before work begins.</p>
				<p><a href="/contact">Tell us about your project</a> and we will help identify the next step.</p>
			</PageSection>
		</>
	);
}

"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader, PageSection } from '@pixelated-tech/components';


export default function RealtorPartnerProgramPage() {
	
	return (
		<>
			<PageTitleHeader title="Pixelated Technologies Partners" />
			<br />
			<PageSectionHeader title="Find us on these platforms" />
			<PageSection columns={12} maxWidth="1024px" id="partners-section">
			</PageSection>
		</>
	);
}

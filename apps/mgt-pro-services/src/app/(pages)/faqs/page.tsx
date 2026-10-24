"use client";

import React from 'react';
import { PageSection, PageTitleHeader, FAQ } from '@pixelated-tech/components';
import faqsData from './faqs.json';

export default function FAQPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader
					title="Frequently Asked Questions"
					subtitle="Find practical answers about floor coatings, renovations, assessments, and service areas"
				/>
				<p>These answers describe the information MGT Pro Services can review before a project scope is proposed. Unknown details can be discussed during an assessment.</p>
			</PageSection>
							
			<PageSection columns={1} maxWidth="1024px" id="faqs-section">
				<FAQ faqsData={faqsData} />
			</PageSection>
		</>
	);
}

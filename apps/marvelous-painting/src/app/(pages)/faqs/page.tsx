"use client";

import React from 'react';
import { PageSection, PageTitleHeader, FAQ } from '@pixelated-tech/components';
import faqsData from './marvelous-faqs.json';

export default function FAQPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader
					title="Frequently Asked Questions"
					subtitle="Practical answers about painting, carpentry, remodeling, and outdoor projects"
				/>
				<p>These answers cover common planning, preparation, service-area, and project questions. Contact us when your project needs a more specific conversation.</p>
			</PageSection>
							
			<PageSection columns={1} maxWidth="1024px" id="faqs-section">
				<FAQ faqsData={faqsData} />
			</PageSection>
		</>
	);
}

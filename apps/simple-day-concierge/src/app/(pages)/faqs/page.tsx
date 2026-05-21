"use client";

import React from 'react';
import { PageSection, PageTitleHeader, FAQAccordion } from '@pixelated-tech/components';
import { SchemaFAQ } from '@pixelated-tech/components';
import faqsData from '@/app/data/faqs.json';

export default function FAQsPage() {
	return (
		<>
			<SchemaFAQ faqsData={faqsData} />

			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader
					title="Frequently Asked Questions"
					subtitle="Find answers to common questions about our web design and development services"
				/>
				<p>These frequently asked questions (FAQs) provide answers to common inquiries about 
					our services and offerings. If you have any additional questions, feel free to 
					reach out to our support team.</p>
			</PageSection>
							
			<PageSection columns={1} maxWidth="1024px" id="faqs-section">
				<FAQAccordion faqsData={faqsData} />
			</PageSection>
		</>
	);
}

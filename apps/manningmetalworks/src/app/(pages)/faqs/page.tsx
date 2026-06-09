"use client";

import React from 'react';
import { PageSection, PageTitleHeader, FAQ } from '@pixelated-tech/components';
import faqsData from '@/app/data/faqs.json';

export default function FAQPage() {
	const faqItems = {
		...faqsData,
		mainEntity: faqsData.mainEntity.map((faq) => ({ ...faq, category: "" }))
	};
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader
					title="Frequently Asked Questions"
				/>
				<p>These frequently asked questions (FAQs) provide answers to common inquiries about 
					our services and offerings. If you have any additional questions, feel free to 
					reach out to our support team.</p>
			</PageSection>
							
			<PageSection columns={1} maxWidth="1024px" id="faqs-section">
				<FAQ faqsData={faqItems} />
			</PageSection>
		</>
	);
}

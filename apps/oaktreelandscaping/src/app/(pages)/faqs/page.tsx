"use client";

import React from 'react';
import { PageSection, PageTitleHeader, FAQ } from '@pixelated-tech/components';
import faqsData from '@/app/data/faqs.json';

export default function FAQPage() {
	return (
		<>
			<PageTitleHeader title="Frequently Asked Questions" />
			<PageSection id="faq-section" columns={1} maxWidth="1024px">
				<p style={{ margin: "0 auto"}}>Find answers to common questions about Oaktree Landscaping's services in Hardeeville, SC.</p>
				<FAQ faqsData={faqsData} />
			</PageSection>
		</>
	);
}
"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader } from '@pixelated-tech/components';
import { PartnerTags } from '@pixelated-tech/components';

// https://www.invoiceberry.com/blog/top-57-us-business-directories-to-get-your-small-business-noticed/
// https://www.brightlocal.com/resources/top-citation-sites/location/usa-free/


export default function PartnersPage() {
	const cssContent = `
		.callout .callout-content {
    		margin: 0 auto;
    		font-size: var(--font-size5);
		}
	`;
	
	return (
		<>
			<style id="dynamic-styles" dangerouslySetInnerHTML={{ __html: cssContent }} />
			<PageTitleHeader title="Pixelated Technologies Partners" />
			<br />
			<PageSectionHeader title="Find us on these platforms" />
			<PartnerTags />
		</>
	);
}

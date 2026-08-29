"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader } from '@pixelated-tech/components';
import { PartnerTags } from '@pixelated-tech/components';
import { usePixelatedConfig } from '@pixelated-tech/components';

export default function PartnersPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "__SITE_NAME__";
	const cssContent = `
        .callout .callout-content {
            margin: 0 auto;
            font-size: var(--font-size5);
        }
    `;
    
	return (
		<>
			<style id="dynamic-styles" dangerouslySetInnerHTML={{ __html: cssContent }} />
			<PageTitleHeader title={`${siteName} Partners`} />
			<br />
			<PageSectionHeader title="Find us on these platforms" />
			<PartnerTags />
		</>
	);
}

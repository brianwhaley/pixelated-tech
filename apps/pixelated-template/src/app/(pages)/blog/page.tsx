"use client";

import React, { useEffect } from 'react';
import { usePixelatedConfig } from '@pixelated-tech/components';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList } from '@pixelated-tech/components';

export default function BlogPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "__SITE_NAME__";
	
	useEffect(() => {
		MicroInteractions({ 
			scrollfadeSelectors: '.tile, .blog-post-summary, .scroll-fade-element',
		});
	}, []); 

	return (
		<>
			<PageTitleHeader title={`${siteName} Blog Posts`} />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}

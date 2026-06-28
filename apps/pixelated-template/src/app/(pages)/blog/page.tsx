"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList } from '@pixelated-tech/components';

export default function BlogPage() {
	
	useEffect(() => {
		MicroInteractions({ 
			scrollfadeSelectors: '.tile, .blog-post-summary, .scroll-fade-element',
		});
	}, []); 

	return (
		<>
			<PageTitleHeader title="Oaktree Landscaping Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}

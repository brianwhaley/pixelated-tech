"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
// import { PageGridItem } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
// import { BlogPostCategories } from '@pixelated-tech/components';
import { BlogPostList, WordpressCategoryList } from '@pixelated-tech/components';

export default function BlogPage() {

	useEffect(() => {
		MicroInteractions({ 
			scrollfadeSelectors: '.tile, .blogPostSummary, .scroll-fade-element',
		});
	}, []); 

	return (
		<>
			<PageTitleHeader title="Pixelated Technologies Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<WordpressCategoryList excludeCategories={['Leadership', 'Personal']} />
				{ /* <PageGridItem>
				    <BlogPostCategories />
				</PageGridItem> */ }
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}
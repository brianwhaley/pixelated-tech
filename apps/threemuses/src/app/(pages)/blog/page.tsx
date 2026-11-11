"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList, WordpressCategoryList } from '@pixelated-tech/components';

export default function BlogPage() {

	useEffect(() => {
		MicroInteractions({ 
			scrollfadeSelectors: '.tile, .blog-post-summary, .scroll-fade-element',
		});
	}, []); 

	return (
		<>
			<PageTitleHeader title="The Three Muses of Bluffton Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<WordpressCategoryList />
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}

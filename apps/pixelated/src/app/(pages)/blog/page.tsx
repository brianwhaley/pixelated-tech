"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection, PageGridItem } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostCategories, BlogPostList } from '@pixelated-tech/components';

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
				<PageGridItem>
					<BlogPostCategories />
				</PageGridItem>
				<BlogPostList />
			</PageSection>
		</>
	);
}
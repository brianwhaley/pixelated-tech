"use client";

import React, { useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList } from '@pixelated-tech/components';
import { PageHero } from '@/app/elements/page-hero';

export default function BlogPage() {

	useEffect(() => {
		MicroInteractions({
			scrollfadeSelectors: '.tile, .blog-post-summary, .scroll-fade-element',
		});
	}, []);

	return (
		<>
			<PageHero />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="blog-section">
			    <PageTitleHeader title="AMAVA Janitorial Blog Posts" />
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}

"use client";

import React, { useEffect } from 'react';
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
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
			<CalloutLibrary.PageTitle title="Palmetto Epoxy Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<WordpressCategoryList />
				<BlogPostList showCategories={false} />
			</PageSection>
		</>
	);
}

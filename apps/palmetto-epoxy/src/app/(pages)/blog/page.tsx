"use client";

import React, { useState, useEffect } from 'react';
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList , type BlogPostType } from '@pixelated-tech/components';
import { ToggleLoading } from '@pixelated-tech/components';
import { getCachedWordPressItems } from '@pixelated-tech/components';

const wpSite = "blog.palmetto-epoxy.com";

export default function Blog() {
	
	const [ wpPosts, setWpPosts ] = useState<BlogPostType[]>([]);

	useEffect(() => {
		ToggleLoading({show: true});
		(async () => {
			const posts = await getCachedWordPressItems({ site: wpSite }); // 1 week
			setWpPosts(posts ?? []);
			ToggleLoading({show: false});
		})();
	}, []);

	useEffect(() => {
		MicroInteractions({ 
			scrollfadeElements: '.tile , .blog-post-summary, .scroll-fade-element',
		});
	}, []); 

	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<BlogPostList site={wpSite} posts={wpPosts} showCategories={false} />
			</PageSection>
		</>
	);
}

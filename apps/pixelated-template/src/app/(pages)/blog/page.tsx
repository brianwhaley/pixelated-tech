"use client";

import React, { useState, useEffect } from 'react';
import { PageTitleHeader } from '@pixelated-tech/components';
import { PageSection } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostList , type BlogPostType, getCachedWordPressItems } from '@pixelated-tech/components';
import { SchemaBlogPosting } from "@pixelated-tech/components";
import { mapWordPressToBlogPosting } from "@pixelated-tech/components";
import { ToggleLoading } from '@pixelated-tech/components';

const wpSite = "blog.oaktree-landscaping.com";

export default function Blog() {

	const [ wpPosts, setWpPosts ] = useState<BlogPostType[]>([]);
	const [ blogSchemas, setBlogSchemas ] = useState<any[]>([]);

	useEffect(() => {
		ToggleLoading({show: true});
		(async () => {
			const posts = await getCachedWordPressItems({ site: wpSite }); // 1 week
			setWpPosts(posts ?? []);
			setBlogSchemas((posts ?? []).map(post => mapWordPressToBlogPosting(post, false)));
			ToggleLoading({show: false});
		})();
	}, []);
	

	useEffect(() => {
		MicroInteractions({ 
			scrollfadeElements: '.tile , .blog-post-summary, scroll-fade-element',
		});
	}, []); 

	return (
		<>
			{ blogSchemas.map((schema, index) => (
				<SchemaBlogPosting key={index} post={schema} />
			)) }
			<PageTitleHeader title="Oaktree Landscaping Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<BlogPostList site={wpSite} posts={wpPosts} showCategories={false} />
			</PageSection>
		</>
	);
}

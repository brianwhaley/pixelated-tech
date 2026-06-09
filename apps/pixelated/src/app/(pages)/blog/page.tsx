"use client";

import React, { useEffect, useState } from 'react';
import { PageTitleHeader, usePixelatedConfig } from '@pixelated-tech/components';
import { PageSection, PageGridItem } from '@pixelated-tech/components';
import { MicroInteractions } from "@pixelated-tech/components";
import { BlogPostCategories, BlogPostList, type BlogPostType } from '@pixelated-tech/components';
import { getWordPressCategories } from '@pixelated-tech/components';
import { ToggleLoading } from '@pixelated-tech/components';
import { getCachedWordPressItems } from '@pixelated-tech/components';

export default function BlogPage() {
	const pixelatedConfig = usePixelatedConfig();
	const wordpressSite = pixelatedConfig?.integrations?.wordpress?.site ?? '';

	const [ wpCategories, setWpCategories ] = useState<string[]>([]);
	const [ wpPosts, setWpPosts ] = useState<BlogPostType[]>([]);

	useEffect(() => {
		ToggleLoading({show: true});
		(async () => {
			const posts = await getCachedWordPressItems({ site: wordpressSite }); // 1 week
			setWpPosts(posts ?? []);
			ToggleLoading({show: false});
		})();
		if (wordpressSite) {
			getWordPressCategories({ site: wordpressSite }).then((categories) => {
				setWpCategories(categories ?? []);
			});
		}
	}, []);
	
	useEffect(() => {
		MicroInteractions({ 
			scrollfadeSelectors: '.tile, .blogPostSummary, .scroll-fade-element',
		});
	}, [wpPosts]); 

	return (
		<>
			<PageTitleHeader title="Pixelated Technologies Blog Posts" />
			<PageSection columns={1} maxWidth="1024px" id="blog-section">
				<PageGridItem>
					<BlogPostCategories categories={wpCategories} />
				</PageGridItem>
				<BlogPostList posts={wpPosts} />
			</PageSection>
		</>
	);
}
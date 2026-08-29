"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import { buildServiceUrl, usePixelatedConfig } from '@pixelated-tech/components';
import { SocialTags } from '@pixelated-tech/components';
import { BlogPostList } from '@pixelated-tech/components';

export default function Home() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "__SITE_NAME__";
	const services = config?.siteInfo?.services ?? [];
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="home-header-section">
				<PageTitleHeader title={siteName} />
			</PageSection>


			<PageSection columns={3} maxWidth="1024px" gap="20px" id="home-services-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Our Services" />
				</PageGridItem>

				{services.map((service: any, index: number) => (
					<PageGridItem key={service.name ?? index}>
						<Callout
							layout="vertical"
							subtitle={service.name}
							img={service.image}
							imgAlt={service.name}
							imgShape="bevel"
							url={buildServiceUrl(service, "/services")}
						/>
					</PageGridItem>
				))}
			</PageSection>

			<SocialTags />

			<PageSection id="home-blog-section" columns={1} >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList count={1} showCategories={false} />
			</PageSection>
            
		</>
	);
}
 
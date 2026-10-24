"use client";

import React, { useState, useEffect } from "react";
import { PageSection, PageSectionHeader, PageTitleHeader, PageGridItem } from "@pixelated-tech/components";
import { BlogPostList } from "@pixelated-tech/components";
import { SocialTags } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { buildServiceUrl } from '@pixelated-tech/components';
import { Hero } from "@pixelated-tech/components";
import { Carousel } from "@pixelated-tech/components";
import { Callout } from '@pixelated-tech/components';

export default function Home() {
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo;
	const siteName = siteInfo?.name || "MGT Pro Services";
	const services = pixelatedConfig?.siteInfo?.services ?? [];

	const videos = [
		"/videos/0_Concrete_Floor_Floor_Grinding_1280x720.mp4",
		"/videos/0_Concrete_Floor_Grinder_Concrete_Floor_Finishing_Machine_1280x720.mp4",
		"/videos/0_Garage_Floor_1280x720.mp4",
		"/videos/0_Water_Blue_1280x720.mp4"
	];
	const [heroVideo, setHeroVideo] = useState<string>();
	useEffect(() => {
		setHeroVideo(videos[Math.floor(Math.random() * videos.length)]);
	}, []);

	const mycards = [
		{
			image: "/images/stock/empty-twocar-garage-with-glossy-epoxy-floor-open-sectional-door-onto-suburban-street.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 0, cardIndex: 0, cardLength: 6,
		} , {
			image: "/images/stock/epoxy-flooring-cabinets-garage-doors.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 1, cardIndex: 1, cardLength: 6,
		} , {
			image: "/images/stock/headed-floor-grinder.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 2, cardIndex: 2, cardLength: 6,
		} , {
			image: "/images/stock/industrial-building-modern-factory-manufacturing-production-plant-large-warehouse-polished-concrete-floor-clean-condition-space-industry-product-display-industry-background.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 3, cardIndex: 3, cardLength: 6,
		} , {
			image: "/images/stock/self-leveling-blue-epoxy-floor-gym.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 4, cardIndex: 4, cardLength: 6,
		} , {
			image: "/images/stock/self-leveling-blue-epoxy-floor-gym-2.jpg",
			imageAlt: "MGT Pro Services",
			headerText: "", subHeaderText: "", bodyText: "",
			index: 5, cardIndex: 5, cardLength: 6,
		}];    

	return (
		<>

			{ /* ...heroVideoMeta */ }
			<PageSection maxWidth="100%" columns={1} id="header-video-section">
				<Hero 
					variant="video"
					video={heroVideo}
					height="300px"
				/>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-header-section">
				<PageTitleHeader title={siteName} />
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-header-section">
				<p>Residential and commercial floor coating assessments, plus selected home renovation planning, for South Carolina properties.</p>
				<p><a href="/request-an-assessment">Request an assessment</a> to share your project, surface, location, and timing.</p>
			</PageSection>

			<PageSection maxWidth="100%" columns={1} id="carousel-section">
				<Carousel cards={mycards} variant="continuous" />
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

			<PageSection id="home-blog-section" columns={1}>
				<PageSectionHeader title="Recent Blog Posts" />
				<BlogPostList count={3} showCategories={true} />
			</PageSection>
		</>
	);
}
 
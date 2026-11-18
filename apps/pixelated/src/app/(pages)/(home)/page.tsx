"use client"; 

import React, { useState, useEffect } from "react";
import { PageTitleHeader, PageSectionHeader, ServicesTiles, usePixelatedConfig } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { SocialTags } from "@pixelated-tech/components";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Hero, getContentfulVideoMetadata } from "@pixelated-tech/components";
import { BlogPostList } from "@pixelated-tech/components";

export default function Home() {
	const pixelatedConfig = usePixelatedConfig();
	const [heroVideo, setHeroVideo] = useState<string>();
	const [heroVideoMeta, setHeroVideoMeta] = useState<{ title?: string; description?: string; uploadDate?: string; duration?: string; poster?: string }>({});

	const videos = [
		"https://videos.ctfassets.net/ank9sh265hdu/4rxGU5MYRZtZcfD0b7nq1j/1a4a9f7a7f8f4f5e6de7aae53796f024/0_Animation_Network_Connection.mp4",
		"https://videos.ctfassets.net/ank9sh265hdu/4rukYNzKrmBTrM7r2AWcxw/eca6e2aa323209ce3949593a7a1c1a50/0_People_Animation.mp4",
		"https://videos.ctfassets.net/ank9sh265hdu/7kdjRW4ARgZpk2Zuslt2bN/e81d09990e04c660612462e3466c0383/1294192_App_Application.mp4",
		"https://videos.ctfassets.net/ank9sh265hdu/5CfnOgx8k1Gqq0xXDlyJpd/108a865ae94f4c521fe4cfbd63cdd9b0/GettyImages-1251562713.mp4",
		"https://videos.ctfassets.net/ank9sh265hdu/6kj4wZu4VRAupq78sYhA9D/f2c378598ba552197884be5e29e1e0c3/GettyImages-675750094.mp4",
	];
	useEffect(() => {
		setHeroVideo(videos[Math.floor(Math.random() * videos.length)]);
		setHeroVideoMeta({});
	}, []);

	useEffect(() => {
		if (!heroVideo) {
			return;
		}

		let cancelled = false;
		getContentfulVideoMetadata(heroVideo, pixelatedConfig?.integrations?.contentful)
			.then((metadata) => {
				if (cancelled || !metadata) return;
				setHeroVideoMeta({
					...metadata,
				});
			})
			.catch(() => undefined);

		return () => {
			cancelled = true;
		};
	}, [heroVideo]);

	return (
		<>

			<Hero 
				variant="video"
				// video="/videos/GettyImages-1251562713.mp4"
				{...heroVideoMeta}
				video={heroVideo}
				height="40vh"
			/>

			<PageTitleHeader title="Pixelated Technologies" />
			<PageSection id="pixelated-section" maxWidth="768px" columns={1}>
				<PageGridItem>
					<Callout
						aboveFold={true}
						layout='vertical' 
						imgAlt='Pixelated Technologies'
						imgShape="squircle" 
						subtitle="About Pixelated Technologies"
						content='Pixelated Technologies is a Digital Services company that specializes in transforming small businesses through custom IT solutions, including web development, social media marketing, search engine optimization, content management, eCommerce solutions, and small business modernization. Our mission is to empower small businesses to thrive in the digital age by providing tailored technology services that drive growth and efficiency.'/>
				</PageGridItem>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-schedule-section" >
				<PageGridItem>
					<CalloutLibrary.scheduleAppointment 
						variant='boxed grid'
						layout='horizontal'
					/>
				</PageGridItem>
			</PageSection>

			<PageSection columns={2} maxWidth="1024px"id="spotlight-section">

				<PageGridItem>
					<Callout
						layout='vertical'
						url='/portfolio'
						img='https://images.ctfassets.net/ank9sh265hdu/5o6Znbm8NrLxnAYNigmZ9v/1c86b278e3c15271d452c3a4d25ff1c2/portfolio.jpg?fm=webp'
						imgAlt='Portfolio'
						imgShape='bevel'
						title='View Our Work Portfolio'
						content='Explore the Pixelated Technologies portfolio to see examples of the web development and design work delivered by our team members over the years. From responsive websites and custom web applications to branding and logo designs, our portfolio showcases the diverse range of projects we have successfully completed for small businesses. Discover how Pixelated Technologies can bring your vision to life with tailored solutions that meet your unique needs.'/>
				</PageGridItem>

				<PageGridItem>
					<Callout
						layout='vertical'
						url='/samples'
						img='https://images.ctfassets.net/ank9sh265hdu/6eYGISUKzCqZnQ7J9uASQK/a31c298d8a6e4da5c174a9615e9cb1e8/samples.jpg?fm=webp'
						imgAlt='Samples'
						imgShape='bevel'
						title='View Some Samples'
						content="Take a look at some of the Pixelated Technologies web design samples to get an idea of the quality and style we bring to our projects. Examples include a landscape company website, a wedding photographer, a local restaurant menu, a bicycle shop, and a taco food truck.  These samples are just a few examples of how Pixelated Technologies can create visually appealing and user-friendly websites tailored to your industry. No matter your industry, we have experience creating custom web solutions that can help your business succeed online."/>
				</PageGridItem>
			</PageSection>

			<PageSection id="recent-blog-section" columns={1} background="var(--secondary-color)" >
				<SocialTags />
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList count={1} showCategories={false}  />
			</PageSection>


			<PageSection id="home-services-section" columns={3}>
				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader title="Our Services" />
				</PageGridItem>
				<ServicesTiles variant="boxed" imgShape="square" />
			</PageSection>

		</>
	);
}

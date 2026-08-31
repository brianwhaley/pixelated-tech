"use client";

import React, { useState, useEffect } from "react";
import { PageSection, Hero, SmartImage, usePixelatedConfig, getContentfulVideoMetadata } from "@pixelated-tech/components";

export default function Header() {
	const pixelatedConfig = usePixelatedConfig();
	const videos = [
		"https://videos.ctfassets.net/6ewno74sai9a/1TrFikTTfPiUfKYr65AfxK/bdd46b0f5b1ee4a315b0818c58d52ed6/2020008_Darwin_Nt_1280x720.mp4",
	];
	const [heroVideo, setHeroVideo] = useState<string>();
	const [heroVideoMeta, setHeroVideoMeta] = useState<{ title?: string; description?: string; uploadDate?: string; duration?: string; poster?: string }>({});

	useEffect(() => {
		setHeroVideo(videos[Math.floor(Math.random() * videos.length)]);
	}, []);

	useEffect(() => {
		if (!heroVideo) { return; }
		let cancelled = false;
		getContentfulVideoMetadata(heroVideo, pixelatedConfig?.integrations?.contentful)
			.then((metadata) => {
				if (cancelled || !metadata) return;
				setHeroVideoMeta({ ...metadata });
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [heroVideo]);

	return (
		<>
			<PageSection maxWidth="100%" columns={1} id="header-section">
				<Hero 
					variant="video"
					video={heroVideo}
					{...heroVideoMeta}
					height="300px"
				>
					<div className="hero-content centered">
						<a href="/">
							<SmartImage
								id="logo"
								src="/images/gea-construction-logo-2-color.png"
								alt={pixelatedConfig?.siteInfo?.name ? `${pixelatedConfig.siteInfo.name} Logo` : "Site Logo"}
								aboveFold={true}
								width={525}
								height={237.5}
							/>
						</a>
					</div>
				</Hero>
			</PageSection>
		</>
	);
}

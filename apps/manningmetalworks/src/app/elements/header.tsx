"use client";

import React, { useState, useEffect } from "react";
import { PageSection, Hero, SmartImage, MenuAccordion, MenuAccordionButton, usePixelatedConfig } from "@pixelated-tech/components";
import Nav from "./nav";

export default function Header() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];

	const videos = [
		"https://videos.ctfassets.net/j4mgog9ij96e/5SrvQuZYq2bXRjEEtzNyYK/9d23f764e350ff8b9e1972a0b4b914b1/Welding_Metal_1920x1080.mp4",
	];
	const [heroVideo, setHeroVideo] = useState<string>();
	useEffect(() => {
		setHeroVideo(videos[Math.floor(Math.random() * videos.length)]);
	}, []);
	
	return (
		<>

			<MenuAccordion menuItems={routes} />
			<PageSection columns={1} maxWidth="100%" id="hero-section" >

				<Hero 
					variant="video"
					// video="/videos/GettyImages-1251562713.mp4"
					video={heroVideo}
					height="40vh">
					<div className="row-12col">
						<div className="logo grid-s1-e4">
							<MenuAccordionButton />
							<a href="/">
								<SmartImage 
									src="/images/logo/mm-logo-white.webp" 
									aboveFold={true}
									alt="Manning Metalworks Logo"/>
							</a>
						</div>
						<div className="menu grid-s4-e13">
							<nav>
								<Nav />
							</nav>
						</div>
					</div>
				</Hero>

			</PageSection>
			
			
		</>
	);
}

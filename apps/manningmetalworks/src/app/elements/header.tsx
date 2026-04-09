"use client";

import React, { useState, useEffect } from "react";
import { PageSection } from "@pixelated-tech/components";
import { Hero } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { MenuAccordion, MenuAccordionButton } from "@pixelated-tech/components";
import Nav from "./nav";
import myroutes from '../data/routes.json';
const allRoutes = myroutes.routes;

export default function Header() {

	const videos = [
		"/videos/0_Welding_Metal_3840x2160.mp4",
	];
	const [heroVideo, setHeroVideo] = useState<string>();
	useEffect(() => {
		setHeroVideo(videos[Math.floor(Math.random() * videos.length)]);
	}, []);
	
	return (
		<>

			<MenuAccordion menuItems={allRoutes} />
			<PageSection columns={1} maxWidth="100%" id="hero-section" >

				<Hero 
					variant="video"
					// video="/videos/GettyImages-1251562713.mp4"
					video={heroVideo}
					height="40vh">
					<div className="row-12col">
						<div className="logo grid-s1-e4">
							<MenuAccordionButton />
							<SmartImage 
								src="/images/logo/mm-logo-white.webp" 
								aboveFold={true}
								alt="Manning Metalworks Logo"/>
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

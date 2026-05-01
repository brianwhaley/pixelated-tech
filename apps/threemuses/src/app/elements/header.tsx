"use client";

import React, { useState, useEffect } from "react";
import { PageSection, PageGridItem, CartButton } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { Hero } from "@pixelated-tech/components";
import { MenuAccordion, MenuAccordionButton } from "@pixelated-tech/components";
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

export default function Header() {


	const heroImages = [
		// "/images/group-modern-ballet-dancers.jpg",
		"https://images.ctfassets.net/luf8eony1687/1FUEGZHHgfRdEhpdbRwiBA/522b17e2e1bb7f40a9456850307ab2b3/ThreeMusesFinal--19.jpg",
		// "https://images.ctfassets.net/luf8eony1687/4faykiY64Sz8B6sZsOf3iQ/68caf7415bb67d32b124ae1b03e45443/ThreeMusesFinal-6801.jpg",
		// "https://images.ctfassets.net/luf8eony1687/2TbvhRFM0zzEPzXkxeT7VM/3e1c9f4d9e58c47119d19a2f345f164a/ThreeMusesFinal-6585.jpg",
		"https://images.ctfassets.net/luf8eony1687/4Iyc4LlTJEdFU0XIPCCqLF/66884eabe71d32f9324fc5fee6ea0ac8/ThreeMusesFinal-6813.jpg",
		"https://images.ctfassets.net/luf8eony1687/5iC6Yh6vlKHAfSu4QiZKYW/bfa3ad0c020ad187dabcbeb5a84ee27e/ThreeMusesFinal-6496.jpg",
		"https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg",
		"https://images.ctfassets.net/luf8eony1687/4G4Z2bfM9Li0uy5HVJLV3d/107250fcaff018f43b586344f70b7f4d/ThreeMusesFinal-6177.jpg",
		"https://images.ctfassets.net/luf8eony1687/rX8FOFylfPZfkOJStyV4M/79247da0e8ebf8e767325de2924cbfc7/ThreeMusesFinal-6157.jpg",
		"https://images.ctfassets.net/luf8eony1687/3cr16xjAMX9RsZnoShMpaB/769b7c916f87a20816da7033a69e9282/ThreeMusesFinal-6671.jpg",
	];
	const [heroImage, setHeroImage] = useState<string>();
	useEffect(() => {
		setHeroImage(heroImages[Math.floor(Math.random() * heroImages.length)]);
	}, []);

    
	return (
		<>
			<div className="header-actions">
				<MenuAccordionButton />
				<CartButton href="/cart" />
			</div>
			<MenuAccordion menuItems={allRoutes} />
			<PageSection columns={1} maxWidth="100%"id="header-section">
				<Hero 
					variant="static"
					img={heroImage}
					height="40vh">
					<PageSection columns={1} maxWidth="100%" id="logo-section">
						<PageGridItem>
							<SmartImage 
								src="/images/logo/three-muses-color-round.png" 
								aboveFold={true} 
								alt="The Three Muses of Bluffton Logo"/>
						</PageGridItem>
					</PageSection>
				</Hero>
			</PageSection>
		</>
	);
}

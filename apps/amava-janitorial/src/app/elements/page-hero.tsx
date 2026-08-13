"use client";

import React, { useState, useEffect } from "react";
import PropTypes, { InferProps } from 'prop-types';
import { Hero } from "@pixelated-tech/components";

const heroImages = [
	"/images/large-room-with-large-window-that-says-no-one.jpg",

	"/images/services/facility-maintenance.jpg",
	"/images/services/janitorial-service.jpg",
	"/images/services/professional-cleaning.jpg",
];

/**
 * PageHero component for the AMAVA Janitorial Services website.
 * This component renders a hero section with a static image and alt text.
 * @param no props
 * @returns {JSX.Element} 
 */
PageHero.propTypes = PropTypes.exact({});
export type PageHeroType = InferProps<typeof PageHero.propTypes>;
export function PageHero() {
	const [heroImage, setHeroImage] = useState<string>();
	useEffect(() => {
		setHeroImage(heroImages[Math.floor(Math.random() * heroImages.length)]);
	}, []);

	return ( 
		<Hero
			// variant="static"
			variant="anchored-img"
			img={heroImage}
			imgAlt="AMAVA Janitorial Services"
			height="40vh"
		/>
	);
}

"use client";

import { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { Hero } from "@pixelated-tech/components";

const defaultHeroImage = "https://www.pixelated.tech/images/icons/1x1.png";

const heroImages = [
	"/images/stock/office-building.jpg", 
	"/images/stock/office-building-2.jpg", 
	"/images/stock/office-building-3.jpg", 
	"/images/services/facility-maintenance.jpg", 
	// "/images/services/janitorial-service.jpg",
	// "/images/services/janitorial-service-2.jpg",
	"/images/services/professional-cleaning.jpg",
	"/images/services/professional-cleaning-2.jpg",
	"/images/services/professional-cleaning-3.jpg",
	"/images/services/professional-cleaning-4.jpg",
	"/images/services/professional-cleaning-5.jpg",
	// "/images/services/professional-cleaning-6.jpg",
	"/images/services/day-porter-services.jpg",
	// "/images/services/day-porter-services-2.jpg", 
	"/images/services/specialty-cleaning-services.jpg",
	"/images/services/janitorial-supply-services-2.jpg", 
	"/images/services/construction-cleanup.jpg",
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
	const [heroImage, setHeroImage] = useState(defaultHeroImage);

	useEffect(() => {
		setHeroImage(heroImages[Math.floor(Math.random() * heroImages.length)]);
	}, []);

	return ( 
		<Hero
			// variant="static"
			variant="anchored-img"
			img={heroImage}
			imgId="amava-page-hero"
			imgAlt="AMAVA Janitorial Services"
			height="50vh"
		/>
	);
}

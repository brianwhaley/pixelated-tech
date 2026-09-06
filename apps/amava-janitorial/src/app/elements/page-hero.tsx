"use client";

import { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { Hero } from "@pixelated-tech/components";

const defaultHeroImage = "https://www.pixelated.tech/images/icons/1x1.png";

const heroImages = [
	"https://images.ctfassets.net/syybqad2lwuh/4JTD8dwWZ9QmbW0P6davyp/da5852378feacd701b81120eda5686e6/office-building.jpg?fm=webp", 
	"https://images.ctfassets.net/syybqad2lwuh/6SmWdFFlp2LOpGG27V8Fwx/b0271998f5d4227cab83d084afff1834/office-building-2.jpg?fm=webp", 
	"https://images.ctfassets.net/syybqad2lwuh/2jUsDdSLEcq6vh50xb88A8/420793732e7c84e63e3e2a1e79a81fbe/office-building-3.jpg?fm=webp", 
	"https://images.ctfassets.net/syybqad2lwuh/3MFcDYr8cTXcCA2uPbt2t6/602d74901b02aa67878f4b5e2fcd8646/facility-maintenance.jpg?fm=webp", 
	// "https://images.ctfassets.net/syybqad2lwuh/2pUqq1vQFvUgvDAU1qJsW6/707c0608c4ec9cdff38e00e3e4caf202/janitorial-service.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/6rg1zvcdgLgtUddbfXpGZh/6101a599e953d4568d8d8d9ffa4f06f2/janitorial-service-2.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/aUMNZi8ug3BuiM2TZer8p/14d08a9d085c9fd992004ab9d323835e/professional-cleaning.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/3dBiPrGEJgHkUh7s01qEjC/a6d74f4270a1edadd6f25add7e62f3d1/professional-cleaning-2.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/26jNoEgY5F5W9mos2BjcGw/634ee9929a147223082ee533849cfed6/professional-cleaning-3.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/1k0o1oSgv69uU1tegr158Z/eda779db0388fd0a5a550947c285251a/professional-cleaning-4.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/4isJ7T6oDDZdXfJNcRKC4t/92f6c120e8bd1dce096c6f6ca9c980f4/professional-cleaning-5.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/Uh4lLRa6czdto3ylsP8H5/f8bfbacb0ade7aa4126dac42f3880dcf/professional-cleaning-6.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/NbxbhXpAIiu9JnvAkLohd/48e65bacdb3914c6c36e88a60a91be0c/day-porter-services.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/3UKP5nLdSj4opQpNgsJIwk/1a035d9f85da349e793987c278893c19/day-porter-services-2.jpg?fm=webp", 
	"https://images.ctfassets.net/syybqad2lwuh/6Zv226IhfbobFE7t0sOZFI/2b4aa6511dbfbcd5ccd7c096dafadf56/specialty-cleaning-services.jpg?fm=webp",
	"https://images.ctfassets.net/syybqad2lwuh/67mpTH7joHX9aLY3g8Wvwg/2c666d4cd600c9d2244b1fc4773d9d63/specialty-cleaning-services-2.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/5wXK7piZf5jryaGKmOPHH5/832bc2d811608b9821fe2be91f0ddfd6/janitorial-supply-services.jpg?fm=webp"
	"https://images.ctfassets.net/syybqad2lwuh/1yXXRUwncPkNIJfTwPfSUh/8be0fd5e48c812a62bebeb8399676399/janitorial-supply-services-2.jpg?fm=webp", 
	"https://images.ctfassets.net/syybqad2lwuh/5elSaSvDyo4mXKrb1geiMB/f24cfaa99f2d4f89a7cff079f3a540c8/construction-cleanup.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/3T2nZHFEm9GmhkUFfb9ar7/08aadced1ef23c4298dcd5c7ce12ab1a/schedule-assessment.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/6bl0HVrpcM2moesz8Onrca/2ddc5e6559c1ad5cc1dcc7ef1ed4c0c1/contact-us.jpg?fm=webp",
	// "https://images.ctfassets.net/syybqad2lwuh/3D1jQAv9fhUxLSD3f8xNPp/e022b18c51ca19aac0e99cd367f33ebb/service-areas.jpg?fm=webp",
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

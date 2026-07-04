"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Tiles } from '@pixelated-tech/components';

const galleryImages = [
	{
		image: 'https://images.ctfassets.net/luf8eony1687/50ro5lPQGPM0PN2TReAtLw/c00cd08f9926753352dacf8190eac4c7/ThreeMusesFinal-6047.jpg',
		imageAlt: 'Katie Coupland, co-owner of The Three Muse of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/2JAytZ9bA6pRjxhHbSok6u/f2f2e0a7e1d878e21304730836a8c1d9/ThreeMusesFinal-6131.jpg',
		imageAlt: 'Kathie Nolte, co-owner of The Three Muse of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/1FUEGZHHgfRdEhpdbRwiBA/522b17e2e1bb7f40a9456850307ab2b3/ThreeMusesFinal--19.jpg',
		imageAlt: 'Young dancers wearing colorful leotards practicing in front of a mirror inside The Three Muses of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/1jWnkLjwTjHFREylmUgTnq/fd3503fed7acbe8b794d0a2759d33a46/ThreeMusesFinal-6157.jpg',
		imageAlt: 'Boutique display table with folded dancewear and accessories inside The Three Muses of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/4G4Z2bfM9Li0uy5HVJLV3d/107250fcaff018f43b586344f70b7f4d/ThreeMusesFinal-6177.jpg',
		imageAlt: 'Rack of colorful dance leotards hanging on white hangers inside The Three Muses of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/3TAlGC5C3ws8LLXvrG1eir/e381f82aa28a2969420a01ace42f07ba/ThreeMusesFinal-6789.jpg',
		imageAlt: 'Pair of ballet pointe shoes resting on pastel leotards from The Three Muses of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/5iC6Yh6vlKHAfSu4QiZKYW/bfa3ad0c020ad187dabcbeb5a84ee27e/ThreeMusesFinal-6496.jpg',
		imageAlt: 'Group of young dancers posing together in colorful studio attire from The Three Muses of Bluffton',
	},
	{
		image: 'https://images.ctfassets.net/luf8eony1687/2TbvhRFM0zzEPzXkxeT7VM/3e1c9f4d9e58c47119d19a2f345f164a/ThreeMusesFinal-6585.jpg',
		imageAlt: 'Katie, Kathie, and team standing outside the Three Muses of Bluffton storefront with festive balloons',
	},
];

export default function GalleryPage() {

	const updatedGalleryImages = galleryImages.map((image, index) => ({
		...image,
		index: index,
		cardLength: galleryImages.length,
	}));

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="gallery-section">
				<PageTitleHeader title="Gallery" />
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="gallery-items-section">
				<PageGridItem>
					<PageSectionHeader title="Photo Gallery" />
				</PageGridItem>
				<Tiles cards={updatedGalleryImages} rowCount={3} variant="overlay" showOverlay={false} />
			</PageSection>


		</>
	);
}

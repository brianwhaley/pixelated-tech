"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function BoutiquePage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="boutique-section">
				<PageTitleHeader title="Thalia's Boutique" />
				<div>
					<p>
					Thalia's Boutique (notably presided over by the Muse of Celebration) serves as a curated treasure trove where the vibrant artistic spirit of the Lowcountry is brought to life through a collection of high-end, handcrafted goods. When you step into this corner of our shop, you are immediately met with an array of unique items that far surpass the quality of mass-produced retail. Our boutique is dedicated to showcasing the exceptional talent of local Bluffton and regional artisans who specialize in creating one-of-a-kind accessories, home decor, and bespoke gifts. Every item on our shelves has been selected for its superior craftsmanship, ensuring that whether you are purchasing a hand-stitched silk scarf, a custom-designed dance bag, or a piece of artisanal jewelry, you are investing in a product of lasting beauty and style. By focusing on small-batch production and high-quality materials, we offer our customers the opportunity to own something truly original that reflects their personal aesthetic.
					</p>
					<p>
					The experience of shopping at Thalia's Boutique is defined by a commitment to elegance and a passion for storytelling through craft. We believe that a gift should be as special as the person receiving it, which is why we offer personalized services such as professional gift wrapping and custom-ordered commissions. Our staff is expertly trained to help you navigate our rotating collection, providing detailed information about the makers behind each piece and the techniques used to create them. Because we work so closely with our local artisans, we can often facilitate unique modifications or custom color palettes for specific items to suit your individual needs. We invite you to visit us in person to feel the textures of our hand-woven textiles and see the intricate details of our custom-sewn boutique treasures. At Thalia's, we don't just sell products; we celebrate the artistry of the human hand and the joy of discovering a gift that will be cherished for a lifetime.
					</p>
				</div>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="boutique-items-section">
				<Callout
					variant="boxed grid"
					layout="horizontal"
					direction="left"
					gridColumns={{ left: 1, right: 3 }}
					img="https://images.ctfassets.net/luf8eony1687/rX8FOFylfPZfkOJStyV4M/79247da0e8ebf8e767325de2924cbfc7/ThreeMusesFinal-6157.jpg"
					title="Check Back Soon"
					subtitle="Join Us in the store or check back here for updaets on our custom Boutique Items" 
					content="Our boutique is a dynamic space that is constantly evolving with new and exciting items. We are currently in the process of curating a collection of high-end, handcrafted goods that will be available for purchase both in-store and online. We invite you to visit us in person to experience the beauty and craftsmanship of our boutique items firsthand, and we encourage you to check back here regularly for updates on our latest offerings. Whether you're looking for a unique gift or a special treat for yourself, Thalia's Boutique will soon be your go-to destination for one-of-a-kind treasures that celebrate the artistry of the Lowcountry."
				/>
			</PageSection>
		</>
	);
}

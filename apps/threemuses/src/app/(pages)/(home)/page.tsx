"use client"; 

import React from 'react';
import { PageSection, PageSectionHeader, PageTitleHeader } from '@pixelated-tech/components';
import { PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function Home() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="welcome-section">
				<PageTitleHeader title="Welcome to The Three Muses of Bluffton" />
				<div>
					<p>
					Welcome to The Three Muses of Bluffton, where the timeless elegance of classical artistry meets the dedicated craftsmanship of the Lowcountry. Our unique studio is a sanctuary for dancers, makers, and gift-seekers alike, purposefully designed to nurture your creative spirit through our three distinct pillars of service. Guided by the grace of Terpsichore, our dancewear collection provides performers with professional-grade attire and expert pointe shoe fittings that ensure every step on stage is supported by precision and style. For those drawn to the rhythmic art of the needle, the muse Erato presides over our comprehensive sewing classes and high-end alteration services, offering a space where beginners can master the basics and seasoned wardrobe favorites can be tailored to perfection. Finally, the joy of the find awaits under the watchful eye of Thalia in our custom boutique, featuring a curated selection of artisanal treasures and bespoke gifts that celebrate life’s special milestones. Whether you are preparing for a first recital, looking to repair a beloved garment, or searching for a one-of-a-kind handcrafted treasure, The Three Muses of Bluffton invites you to experience a community-centered atmosphere where artistry is sewn into every stitch and grace is found in every step.
					</p>
				</div>
			</PageSection>


			<PageSection columns={3} maxWidth="100%" id="home-services-section">

				<PageGridItem columnSpan={3}>
					<PageSectionHeader title="Our Services" />
				</PageGridItem>

				<Callout
					variant="grid"
					layout="vertical"
					img="/images/logo/muse1-terpsichore.png"
					url="/dancewear"
					title="Terpsichore: The Spirit of the Dance"
					subtitle="The Muse of Dance" 
					content="Grace meets performance at the barre. Whether you are preparing for your first recital or your final curtain call, Terpsichore’s collection offers premium leotards, pointe shoes, and essentials designed to move with you. Step into confidence with dancewear that feels as good as it looks."
					buttonText="Explore Our Dancewear Collection"
				/>

				<Callout
					variant="grid"
					layout="vertical"
					img="/images/logo/muse2-erato.png"
					url="/sewing"
					title="Erato: The Heart of the Stitch"
					subtitle="The Muse of Craft & Creation"
					content="Precision is an art form. Under the guidance of Erato, we celebrate the rhythm of the needle through our expert alteration services and hands-on sewing classes. From tailoring your favorite garment to teaching you the skills to create your own, we find the beauty in every stitch."
					buttonText="Learn to Sew & Book Alterations"
				/>

				<Callout
					variant="grid"
					layout="vertical"
					img="/images/logo/muse3-thalia.png"
					url="/boutique"
					title="Thalia: The Joy of the Find"
					subtitle="The Muse of Celebration"
					content="Every gift tells a story. Thalia presides over our custom boutique, a curated space filled with unique treasures, bespoke accessories, and handcrafted items perfect for life’s special moments. Discover a gift as unique as the person receiving it."
					buttonText="Shop the Custom Boutique"
				/>

			</PageSection>
		</>
	);
}

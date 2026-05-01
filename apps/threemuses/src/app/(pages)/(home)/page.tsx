"use client"; 

import React, { useState, useEffect } from 'react';
import { PageSection, PageSectionHeader, PageTitleHeader } from '@pixelated-tech/components';
import { PageGridItem } from '@pixelated-tech/components';
import { Callout, ToggleLoading } from '@pixelated-tech/components';
import { getWordPressItems, BlogPostList } from "@pixelated-tech/components";

// const wpSite = "blog.thethreemusesofbluffton.com";
const wpSite = "thethreemusesofbluffton.wordpress.com";

export default function Home() {

	const [ wpPosts, setWpPosts ] = useState<Awaited<ReturnType<typeof getCachedWordPressItems>>>([]);
	useEffect(() => {
		async function fetchPosts() {
			ToggleLoading({show: true});
			const posts = (await getWordPressItems({ site: wpSite, count: 1 })) ?? [];
			if(posts) { 
				setWpPosts(posts);
				ToggleLoading({show: false});
			}
		}
		fetchPosts();
	}, []); 

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



			<PageSection columns={1} maxWidth="1024px" id="home-events-section">
				<Callout
					variant="boxed grid"
					layout="horizontal"
					direction="left"
					gridColumns={{ left: 1, right: 3 }}
					img="/images/logo/muse2-erato.png"
					url="/events"
					title="Erato's Upcoming Sewing Events"
					subtitle="Join Us for Sewing Workshops, Classes, and Summer Camps" 
					content="Whether you're a beginner eager to learn the basics or an experienced sewer looking to refine your skills, Erato's sewing events offer something for everyone. Our workshops and classes cover a range of topics, from mastering the fundamentals of sewing to exploring advanced techniques. Plus, our summer camps provide an immersive experience for young creatives to dive into the world of sewing in a fun and supportive environment. Join us and let Erato inspire your creativity with every stitch."
					buttonText="Upcoming Sewing Events"
				/>
			</PageSection>

		

			<PageSection columns={1} maxWidth="1024px" id="home-consign-section">
				<Callout
					variant="grid"
					layout="horizontal"
					direction="right"
					gridColumns={{ left: 3, right: 1 }}
					img="https://images.ctfassets.net/luf8eony1687/6RlzYli6GihWE5ZlX5NMjd/7062a3019f693b0aea9b98cf2a2c6797/dress-from-collection-museum-fine-arts.jpg"
					url="/consign"
					title="Consign With Us"
					subtitle="Turn Your Gently Loved Items into Something Beautiful" 
					content="The Three Muses of Bluffton invites you to consign your gently loved costumes and formal dresses to turn them into something beautiful. Bring in clean, high-quality, and excellent condition items that are ready to sell. We will price, display, and sell the items for you, allowing you to earn money as soon as they find a new home. We are ready to help you make beautiful new connections through your cherished wardrobe pieces."
					buttonText="Consign With Us"
				/>

			</PageSection>


			<PageSection id="social-section" columns={1} background="var(--accent1-color)" >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList site={wpSite} posts={wpPosts} count={1} />
			</PageSection>

		</>
	);
}

 
"use client"; 

import React, { useState, useEffect } from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { ContentfulReviewsCarousel } from "@pixelated-tech/components";
import { PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";
import { BlogPostList , type BlogPostType, getCachedWordPressItems } from '@pixelated-tech/components';
import { Loading, ToggleLoading } from '@pixelated-tech/components';

export default function Home() {

	const config = usePixelatedConfig();
	if (!config) {
		return <Loading />;
	}

	const wpSite = "blog.palmetto-epoxy.com";
	const [ wpPosts, setWpPosts ] = useState<BlogPostType[]>([]);
	useEffect(() => {
		ToggleLoading({show: true});
		(async () => {
			const posts = await getCachedWordPressItems({ site: wpSite, count: 1 }); // 1 week
			setWpPosts(posts ?? []);
			ToggleLoading({show: false});
		})();
	}, []);
	
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy" />

      		<PageSection columns={1} id="homeCTA-section">
				<PageGridItem>
					<div className="home-cta">
						<div className="">
							Elevate your space with a solution 
							<br />
							that&#39;s as practical as it is visually stunning.
							<br />
							<button type="button" onClick={() => { window.location.href = '/contact'; }}>Schedule an Estimate</button>
						</div>
					</div>
				</PageGridItem>
			</PageSection>

      		<PageSection columns={3} className="section-alt" id="home-callouts-section">
				<PageGridItem>
					<Callout
						layout='vertical'
						img='https://images.ctfassets.net/0b82pebh837v/VEoiv9Mi9OsB4cSSUritM/835dcfa45b98453fdaeb7b19394b1164/Blue.jpg?fm=webp'
						imgShape='bevel'  
						title="Floors You'll Adore" />
				</PageGridItem>
				<PageGridItem>
					<Callout
						layout='vertical' 
						img='https://images.ctfassets.net/0b82pebh837v/6oA0GDDEJSkZRPy0PhCBSl/44c7989017c8f08c9fe7abc7bd732486/Epoxy_Floor_4.jpg?fm=webp'
						imgShape='bevel'  
						title='Epoxy Excellence' />
				</PageGridItem>
				<PageGridItem>
					<Callout
						layout='vertical' 
						img='https://images.ctfassets.net/0b82pebh837v/5wDiaYXOaLMx2AO1w78SJG/9b65f0e67a515c59e126c952c0d41003/Grey_Bowling-Ball-Floor.jpg?fm=webp'
						imgShape='bevel'  
						title='Shine On...' />
				</PageGridItem>
			</PageSection>



			<PageSection id="social-section" columns={1} >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList site={wpSite} posts={wpPosts} count={1} showCategories={false} />
			</PageSection>



			<PageSection columns={1} id="home-reviews-section">
				<ContentfulReviewsCarousel
					reviewContentType="reviews"
					itemName="Epoxy Flooring Service"
					itemType="Service"
					publisherName="Palmetto Epoxy"
					maxReviews={100}
					draggable={true}
					imgFit='contain'
				/>
			</PageSection>

			<PageSection  columns={1} className="section-pavers text-outline" id="reviewCTA-section">
				<div className="home-cta">
					<div className="">
						Voice your opinion and  
						<br />
						share your experience with us.
						<br />
						<button type="button" onClick={() => { window.location.href = '/submitreview'; }}>Submit your Review</button>
					</div>
				</div>
			</PageSection>

			<section style={{backgroundColor: "var(--accent1-color)"}} id="lowcountrysbest-section">
				<CalloutLibrary.LowCountrysBest />
			</section>

			<section id="sponsor-section">
				<div className="section-container">
					<div className="row-12col">
						<div className="grid-s2-e12">
							<Callout
								variant='grid'
								direction='right'
								layout='horizontal'
								img='https://images.ctfassets.net/0b82pebh837v/5AiTNJSyca5JJ9ZycxXJ2W/814eac82c120b5fa87505011cfe10609/MR_Sharks_2.jpg?fm=webp'
								imgShape='square'  
								title="Palmetto Epoxy is a proud Sponsor of May River High School Girls Soccer" />
						</div>
					</div>
				</div>
			</section>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>

		</>
	);
}

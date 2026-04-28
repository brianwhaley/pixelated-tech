"use client"; 

import React from "react";
import { PageTitleHeader } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import SocialTags from "@/app/elements/socialtags";
import { ContentfulReviewsCarousel } from "@pixelated-tech/components";
import { Loading } from '@pixelated-tech/components';
import { usePixelatedConfig } from "@pixelated-tech/components";

export default function Home() {

	const config = usePixelatedConfig();
	if (!config) {
		return <Loading />;
	}

	return (
		<>
			<section id="products-section">
				<div className="section-container">
					<br />
					<PageTitleHeader title="PixelVivid Products & Services" />
					<div className="row-12col">
						<div className="grid-s3-e11">
							PixelVivid offers a wide variety of artistic products 
							and services such as unique one-of-a-kind painted sunglasses, 
							photography, jewelry, commissioned paintings, and more. 
							Explore our creative offerings below. 
						</div>
					</div>
					<div className="row-2col">
						<CalloutLibrary.customSunglasses />
						<CalloutLibrary.photography />
					</div>
				</div>
			</section>

			<section style={{backgroundColor: "var(--accent1-color)"}} id="social-section">
				<div className="section-container">

					<SocialTags />

					<div className="row-1col">
						<div className="grid-item">
							<div className="callout-body">
								Links to each of my social media accounts and a few recent postings from each,
								including 500px, Blurb, Etsy, Facebook, Flickr,
								Instagram, iStock Photo, LinkedIn, Pinterest, Reddit, Shutterfly, Shutterstock, 
								Twitter, Tumblr, Youtube, and more.
								<br/>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="spotlight-section">
				<div className="section-container">
					<PageSectionHeader title="Featured Spotlights" />
					<div className="row-3col">
						<div className="grid-item">
							<CalloutLibrary.sunglassStore />
						</div>
						<div className="grid-item">
							<CalloutLibrary.subscribe />
						</div>
						<div className="grid-item">
							<CalloutLibrary.specialOrder />
						</div>
						
					</div>
				</div>
			</section>

			<section style={{backgroundColor: "var(--accent1-color)"}} id="review-section">
				<div className="section-container">
					<div className="row-1col">

						<div className="grid-item">
							<ContentfulReviewsCarousel
								reviewContentType="feedback"
								itemName="PixelVivid Custom Sunglasses"
								itemType="Service"
								publisherName="PixelVivid"
								draggable={true}
								imgFit='contain'
							/>
						</div>

						<div className="grid-item">
							<CalloutLibrary.feedback />
						</div>
					</div>
				</div>
			</section>

			<section className="section" id="upcycle-section">
				<div className="section-container">
					<div className="row-1col">
						<div className="grid-item">
							<CalloutLibrary.sustainabilityMessage />
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

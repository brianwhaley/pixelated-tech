"use client";

import React, { useState, useEffect } from "react";
import { PageTitleHeader } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import SocialTags from "@/app/elements/socialtags";
import { Carousel } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";
import { Loading } from '@pixelated-tech/components';
import { getContentfulEntriesByType, getContentfulReviewsSchema, ReviewSchema } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";

export default function Home() {


	const config = usePixelatedConfig();
	if (!config) {
		return <Loading />;
	}


	const [ carouselCards , setCarouselCards ] = useState<CarouselCardType[]>([]);
	const [ reviewSchemas , setReviewSchemas ] = useState<any[]>([]);
	const apiProps = {
		base_url: config?.contentful?.base_url ?? "",
		space_id: config?.contentful?.space_id ?? "",
		environment: config?.contentful?.environment ?? "",
		delivery_access_token: config?.contentful?.delivery_access_token ?? "",
	};
	useEffect(() => {
		async function getCarouselCards() {
			const contentType = "feedback"; 
			const typeCards = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const items = typeCards.items.filter((card: any) => card.sys.contentType.sys.id === contentType);
			const cardLength = items.length;
			const reviewCards = items.map(function (card: any, index: number) {
				return {
					headerText: card.fields.description,
					bodyText: card.fields.reviewer,
					index: index,
					cardIndex: index,
					cardLength: cardLength,
				};
			});
			setCarouselCards(reviewCards);

			const schemas = await getContentfulReviewsSchema({
				apiProps: apiProps,
				itemName: "PixelVivid Custom Sunglasses",
				itemType: "Service",
				publisherName: "PixelVivid"
			});
			setReviewSchemas(await schemas);

			// Transform feedback items into review schemas for JSON-LD
			/* const schemas = items.map((item: any) => ({
				"@context": "https://schema.org/",
				"@type": "Review",
				"name": item.fields.feedbackText?.substring(0, 100) || "Review",
				"reviewBody": item.fields.feedbackText || "",
				"datePublished": new Date(item.sys.createdAt).toISOString().split("T")[0],
				"author": {
					"@type": "Person",
					"name": item.fields.name || "Anonymous"
				},
				"itemReviewed": {
						"@type": "Service",
						"name": "PixelVivid Custom Sunglasses Services"
				},
				"reviewRating": {
					"@type": "Rating",
					"ratingValue": "5",
					"bestRating": "5",
					"worstRating": "1"
				},
				"publisher": {
					"@type": "Organization",
					"name": "PixelVivid"
				}
			}));
			setReviewSchemas(schemas); */
		}
		getCarouselCards();
	}, []);




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
							{reviewSchemas.map((review, idx) => (
								<ReviewSchema key={idx} review={review} />
							))}
							<Carousel 
								cards={carouselCards} 
								draggable={true}
								imgFit='contain' />
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

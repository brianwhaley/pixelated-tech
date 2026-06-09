"use client";

import React, { useState, useEffect } from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Carousel, usePixelatedConfig, getContentfulEntriesByType, getContentfulImagesFromEntries, Loading, contentfulValueToSlug } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";
import { PageSection } from "@pixelated-tech/components";

// const imageOrigin = "https://images.palmetto-epoxy.com";

/* Carousel bug conflict with drag and click */

export default function ProjectsPage() {

	const [ carouselCards , setCarouselCards ] = useState<CarouselCardType[]>([]);

	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) { return <Loading />; }

	const apiProps = {
		base_url: pixelatedConfig?.integrations?.contentful?.base_url ?? "",
		space_id: pixelatedConfig?.integrations?.contentful?.space_id ?? "",
		environment: pixelatedConfig?.integrations?.contentful?.environment ?? "",
		delivery_access_token: pixelatedConfig?.integrations?.contentful?.delivery_access_token ?? "",
	};

	useEffect(() => {
		async function getCarouselCards() {
			const contentType = "carouselCard"; 
			const typeCards = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const reviewCards : CarouselCardType[] = [];
			for (const card of typeCards.items) {
				if ( card.sys.contentType.sys.id == contentType ) {
					const images = await getContentfulImagesFromEntries({ images: [card.fields.image], assets: typeCards.includes.Asset });
					reviewCards.push({
						index: card.sys.contentType.sys.id.indexOf("card"),
						cardIndex: reviewCards.length,
						cardLength: typeCards.items.length,
						image: images[0].image,
						imageAlt: images[0].imageAlt,
						headerText: card.fields.title,
						bodyText: card.fields.description,
						// link: card.fields.link,
						// translate spaces to dashes for URL Friendly strings
						link: "/projects/" + contentfulValueToSlug({ value: card.fields.title }),
						linkTarget: "_self"
					});
				}
			}
			setCarouselCards(reviewCards);
		}
		getCarouselCards();
	}, []);

	return (
		<>
			<CalloutLibrary.PageTitle title="Projects" />
			
			<PageSection columns={1} className="" id="projects-section">
				<Carousel 
					cards={carouselCards} 
					draggable={false} 
					imgFit='contain' />
			</PageSection>
            
			<PageSection columns={1} className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</PageSection>
		</>
	);
}

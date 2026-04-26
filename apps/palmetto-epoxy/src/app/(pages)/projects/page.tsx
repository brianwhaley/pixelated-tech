"use client";

import React, { useState, useEffect } from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Carousel, usePixelatedConfig, getContentfulEntriesByType, getContentfulImagesFromEntries, Loading } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";
import { PageSection } from "@pixelated-tech/components";

// const imageOrigin = "https://images.palmetto-epoxy.com";

/* Carousel bug conflict with drag and click */

export default function Projects() {

	const [ carouselCards , setCarouselCards ] = useState<CarouselCardType[]>([]);

	const config = usePixelatedConfig();

	if (!config) {
		return <Loading />;
	}

	const apiProps = {
		base_url: config?.contentful?.base_url ?? "",
		space_id: config?.contentful?.space_id ?? "",
		environment: config?.contentful?.environment ?? "",
		delivery_access_token: config?.contentful?.delivery_access_token ?? "",
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
						link: card.fields.link,
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

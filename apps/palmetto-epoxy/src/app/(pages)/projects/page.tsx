"use client";

import React, { useState, useEffect } from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
// import { Carousel } from "@pixelated-tech/components";
import { usePixelatedConfig, getContentfulEntriesByType, getContentfulAssetsFromEntries, Loading, contentfulValueToSlug } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";
import { PageSection } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

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
					const images = await getContentfulAssetsFromEntries({ images: [card.fields.image], assets: typeCards.includes.Asset });
					reviewCards.push({
						index: card.sys.contentType.sys.id.indexOf("card"),
						cardIndex: reviewCards.length,
						cardLength: typeCards.items.length,
						image: images[0].url,
						imageAlt: images[0].description ?? images[0].title,
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
				{carouselCards.map((card, index) => (
					<Callout
						key={index}
						variant='boxed grid'
						url={card.link}
						title={card.headerText}
						img={card.image}
						imgAlt={card.imageAlt} 
						content={card.bodyText}
						layout='horizontal' 
						imgShape='square'
					/>
				))}
				{ /* <Carousel 
					cards={carouselCards} 
					draggable={false} 
					imgFit='contain' /> */ }
			</PageSection>
            
			<PageSection
				columns={1}
				className="section-bluechip"
				id="contact-section"
				backgroundImage="https://images.ctfassets.net/0b82pebh837v/72Ctu7oGaGNja5gHpTz4Fd/50984bad832c63d7845e3c6d511a1735/BluChips.jpg?fm=webp"
			>
				<CalloutLibrary.ContactCTA />
			</PageSection>
		</>
	);
}

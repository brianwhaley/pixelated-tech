 
"use client";

import React from "react";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// import { Metadata } from 'next';
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { getContentfulEntriesByType, getContentfulEntryByField, getContentfulImagesFromEntries, usePixelatedConfig, Loading } from "@pixelated-tech/components";
import { Carousel } from "@pixelated-tech/components";
import { PageSection } from '@pixelated-tech/components';

export default function Project(){

	interface Card {
		fields: {
			title: string;
			description: string;
			keywords?: string;
			link?: string,
			carouselImages: any[];
		};
	}

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

	const [ card , setCard ] = useState<Card | null>(null);
	const [ carouselCards , setCarouselCards ] = useState<{ image: any }[]>([]);
	const params = useParams();
	const project = typeof params?.project === 'string' ? params.project : '';

	useEffect(() => {
		if (!project) {
			return;
		}
		async function getCarouselCards(project: string) {
			const contentType = "carouselCard";
			const cards = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType });
			const card = await getContentfulEntryByField({
				cards: cards,
				searchField: "title",
				searchVal: project
			});
			setCard(card);
			const images = await getContentfulImagesFromEntries({ images: card.fields.carouselImages, assets: cards.includes.Asset });
			setCarouselCards(images);
		}
		getCarouselCards(project);
	}, [project]);


	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
		return () => {
			setIsMounted(false);
		};
	}, []);

	return (
		<>
			{ isMounted ? (
	      		<>
					<CalloutLibrary.PageTitle title={card?.fields.title || ""} />
							
					<PageSection columns={1} id="project-carousel-section">
						<div>
							{card?.fields.description}
						</div>
						<Carousel
							cards={carouselCards.map((card, index) => ({
								...card,
								index: index,
								cardIndex: index,
								cardLength: carouselCards.length
							}))} 
							draggable={true}
							imgFit='contain'
						/>
					</PageSection>
					<br /><br />
				</>
			) : (
				<PageSection columns={1} id="project-section">
					{ /* <div>Loading data...</div> */ }
				</PageSection>
			)
			}
			<PageSection columns={1} className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</PageSection>
		</>
	);
}

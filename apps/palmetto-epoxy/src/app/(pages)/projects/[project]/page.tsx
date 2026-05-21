 
"use client";

import React from "react";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// import { Metadata } from 'next';
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { getContentfulEntriesByType, getContentfulEntryByField, getContentfulImagesFromEntries, usePixelatedConfig, Loading, contentfulSlugToValue, Tiles } from "@pixelated-tech/components";
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
	const [ tileCards , setTileCards ] = useState<{ image: any; imageAlt?: string }[]>([]);
	const params = useParams();
	// Decode the slug from URL back to original title
	const projectSlug = typeof params?.project === 'string' ? params.project : '';
	const project = projectSlug ? contentfulSlugToValue({ slug: projectSlug }) : '';

	useEffect(() => {

		console.log("Project param:", project);

		if (!project) {
			return;
		}
		async function getTileCards(project: string) {
			const contentType = "carouselCard";
			const cards = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType });
			const card = await getContentfulEntryByField({
				cards: cards,
				searchField: "title",
				searchVal: project
			});
			setCard(card);
			const images = await getContentfulImagesFromEntries({ images: card.fields.carouselImages, assets: cards.includes.Asset });
			setTileCards(images);
		}
		getTileCards(project);
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
						<Tiles
							cards={tileCards.map((tile, index) => ({
								index,
								cardIndex: index,
								cardLength: tileCards.length,
								image: tile.image,
								imageAlt: tile.imageAlt ?? ''
							}))}
							variant="caption"
							rowCount={3}
							modalOnClick={true}
							showOverlay={false}
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

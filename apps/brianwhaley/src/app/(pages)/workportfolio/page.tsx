"use client";

import React, { useState, useEffect } from "react";
import { PageSection } from "@pixelated-tech/components";
import { PageTitleHeader } from "@pixelated-tech/components";
import { Carousel, FlickrWrapper } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";
import { usePixelatedConfig } from '@pixelated-tech/components';

export default function PortfolioPage() {

	const integrationsconfig = usePixelatedConfig()?.integrations;
	const [ flickrCards, setFlickrCards ] = useState<CarouselCardType[]>([]);
	const props = { 
		api_key: integrationsconfig?.flickr?.urlProps.api_key ?? "",
		user_id: integrationsconfig?.flickr?.urlProps.user_id ?? "",
		tags: "", // "workportfolio"
		method: integrationsconfig?.flickr?.urlProps.method ?? "flickr.photosets.getPhotos",
		photoset_id: integrationsconfig?.flickr?.urlProps.photoset_id ?? "72177720326903710",
		photoSize: integrationsconfig?.flickr?.urlProps.photoSize ?? "Large",
		callback: getFlickrCards
	};
	function getFlickrCards(cards: CarouselCardType[]) {
		const myCards = cards.sort((a, b) => ((a.imageAlt ?? '') < (b.imageAlt ?? '')) ? 1 : -1);
		setFlickrCards(myCards);
	}
	useEffect(() => {
		async function fetchGallery() {
			await FlickrWrapper(props);
		}
		fetchGallery();
	}, []); 

	return (
		<>
			<PageSection columns={1} id="gallery-section">
				<PageTitleHeader title="Work Portfolio Gallery" />
				<Carousel 
					cards={flickrCards} 
					draggable={true}
					imgFit="contain" />
			</PageSection>
		</>
	);
}
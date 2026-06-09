"use client";

import React, { useState, useEffect } from "react";
import { Carousel } from "@pixelated-tech/components";
import { GetFlickrData, GenerateFlickrCards, usePixelatedConfig } from '@pixelated-tech/components';
import type { CarouselCardType } from "@pixelated-tech/components";
import './hero.css';

export default function Hero() {

	const integrationsConfig = usePixelatedConfig()?.integrations;
	const [flickrCards, setFlickrCards] = useState<CarouselCardType[]>([]);

	useEffect(() => {
		if (!integrationsConfig) return;
		async function getFlickrCards() {
			const myPromise = GetFlickrData({
				flickr : {
					baseURL: integrationsConfig?.flickr?.baseURL ?? 'https://api.flickr.com/services/rest/?',
					urlProps: {
						method: 'flickr.photos.search',
						api_key: integrationsConfig?.flickr?.urlProps.api_key ?? "",
						user_id: integrationsConfig?.flickr?.urlProps.user_id ?? "",
						tags: 'pixelatedviewsgallery',
						extras: 'date_taken,description,owner_name',
						sort: 'date-taken-desc',
						per_page: integrationsConfig?.flickr?.urlProps.per_page ?? 500,
						format: integrationsConfig?.flickr?.urlProps.format ?? "json",
						photoSize: integrationsConfig?.flickr?.urlProps.photoSize ?? "Large",
						nojsoncallback: 'true',
					}
				}
			});
			const myFlickrImages = await myPromise;
			const myFlickrCards = GenerateFlickrCards({flickrImages: myFlickrImages, photoSize: 'Medium'});
			// REMOVE LINKS
			if (myFlickrCards) { 
				const myScrubbedFlickrCards = myFlickrCards.map((obj, index): CarouselCardType => {
					return {
						index: index,
						cardIndex: index,
						cardLength: myFlickrCards.length,
						image: obj.image,
						imageAlt: obj.imageAlt,
						subHeaderText: obj.subHeaderText
					};
				});
				setFlickrCards(myScrubbedFlickrCards);
			}
		}
		getFlickrCards();
	}, [integrationsConfig]); // Run when config is available


	return (
		<div id="page-hero">
			<Carousel 
				cards={flickrCards} 
				draggable={false}
				imgFit="cover" />
		</div>
	);
}

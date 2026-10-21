'use client';

import React, { useEffect, useState } from 'react';
import { FlickrWrapper, Loading, MicroInteractions, PageTitleHeader, Tiles, usePixelatedConfig } from '@pixelated-tech/components';
import type { CarouselCardType } from '@pixelated-tech/components';
import sampleImages from './gallery.json';

export default function GalleryPage() {
	const config = usePixelatedConfig();
	const siteName = config?.siteInfo?.name || 'Marvelous Painting';
	const flickr = config?.integrations?.flickr;
	const [cards, setCards] = useState<CarouselCardType[]>([]);
	const [loading, setLoading] = useState(true);
	const [usingSampleContent, setUsingSampleContent] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);

		async function loadGallery() {
			let images: CarouselCardType[] = sampleImages;
			let fallback = true;
			if (!flickr?.urlProps.api_key || !flickr.urlProps.user_id || !flickr.urlProps.photoset_id) {
				console.warn('[Gallery] Flickr album configuration is incomplete. Showing sample images.');
			} else {
				try {
					const result = await FlickrWrapper({
						api_key: flickr.urlProps.api_key,
						user_id: flickr.urlProps.user_id,
						photoset_id: flickr.urlProps.photoset_id,
						method: 'flickr.photosets.getPhotos',
						photoSize: flickr.urlProps.photoSize || 'Large',
						tags: '',
						callback: () => {},
					});
					if (result?.length) {
						images = result;
						fallback = false;
					} else {
						console.warn('[Gallery] Flickr returned no images or could not load the album. Showing sample images.');
					}
				} catch (error) {
					console.error('[Gallery] Unable to load Flickr images. Showing sample images.', error);
				}
			}
			if (active) {
				setCards(images);
				setUsingSampleContent(fallback);
				setLoading(false);
			}
		}

		void loadGallery();
		return () => { active = false; };
	}, [flickr]);

	useEffect(() => {
		if (cards.length) MicroInteractions({ scrollfadeSelectors: '#gallery-section .tile' });
	}, [cards]);

	return (
		<section id="gallery-section">
			<div className="section-container">
				<PageTitleHeader title={`${siteName} Gallery`} />
				{loading ? <Loading /> : (
					<>
						{usingSampleContent && <p role="status">Sample images are shown because live content is unavailable.</p>}
						<Tiles cards={cards} rowCount={3} />
					</>
				)}
			</div>
		</section>
	);
}

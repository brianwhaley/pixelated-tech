import React, { useState, useEffect } from 'react';
import { Carousel } from '@/components/structure/carousel';
import { GenerateFlickrCards } from '@/components/integrations/flickr';
import flickrFixture from '../../test/data/flickr-pixelatedviewsgallery.json';
import '@/css/pixelated.global.css';
import './carousel-hero.stories.css';

export default {
	title: 'General/Carousel',
	component: Carousel,
};

const FlickrHeroCarousel = (args) => {
	const [cards, setCards] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function getFlickrCards() {
			try {
				const myFlickrImages = flickrFixture.photos?.photo ?? [];
				if (!Array.isArray(myFlickrImages)) {
					throw new Error('Flickr fixture contains no images.');
				}
				const myFlickrCards = GenerateFlickrCards({flickrImages: myFlickrImages, photoSize: 'Medium'});
				const myScrubbedFlickrCards = myFlickrCards.map(obj => {
					const newObj = { ...obj };
					delete newObj.link;
					delete newObj.bodyText;
					return newObj;
				});
				setCards(myScrubbedFlickrCards);
				setError(null);
			} catch (requestError) {
				setCards([]);
				setError(requestError instanceof Error ? requestError.message : 'Unable to load Flickr images.');
			}
		}
		getFlickrCards();
		}, []);

	if (error) {
		return <div className="section-container">Unable to load Flickr images: {error}</div>;
	}

	return <Carousel {...args} cards={cards} />;
};

export const CarouselHero = {
	render: (args) => <FlickrHeroCarousel {...args} />,
	args: {
		draggable: false,
		imgFit: "cover",
	}
};

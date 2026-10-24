import React, { useState, useEffect } from 'react';
import { Carousel } from '@/components/structure/carousel';
import { GenerateFlickrCards } from '@/components/integrations/flickr';
import flickrFixture from '../../test/data/flickr-pixelatedviewsgallery.json';
import '@/css/pixelated.global.css';
import './carousel.stories.css';

export default {
	title: 'General/Carousel',
	component: Carousel,
};

const FlickrCarousel = (args) => {
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
				// REMOVE LINKS
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

export const Carousel2 = {
	render: (args) => <FlickrCarousel {...args} />,
	args: {
		draggable: true,
		imgFit: "contain",
		variant: "stack",
	},
	argTypes: {
		imgFit: {
			options: ['contain', 'cover', 'fill'],
			control: { type: 'select' },
		},
		draggable: {
			options: [true, false],
			control: { type: 'select' },
		},
		variant: {
			options: ['stack', 'continuous'],
			control: { type: 'select' },
		}
	}
};

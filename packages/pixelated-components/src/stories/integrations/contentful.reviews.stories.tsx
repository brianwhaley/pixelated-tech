import React from 'react';
import { ContentfulReviewsCarousel } from '@/components/integrations/contentful.reviews.components';

export default {
	title: 'Integrations/Contentful Reviews',
	component: ContentfulReviewsCarousel,
	argTypes: {
		reviewContentType: { control: 'text' },
		itemName: { control: 'text' },
		itemType: { control: 'text' },
		publisherName: { control: 'text' },
		headerField: { control: 'text' },
		bodyField: { control: 'text' },
		imageField: { control: 'text' },
		maxReviews: { control: { type: 'number', min: 1, max: 20 } },
		displayMode: { control: { type: 'select', options: ['carousel', 'grid'] } },
		draggable: { control: 'boolean' },
		imgFit: { control: { type: 'select', options: ['contain', 'cover', 'fill'] } },
		includeReviewSchema: { control: 'boolean' },
	},
	args: {
		reviewContentType: 'feedback',
		itemName: 'PixelVivid Custom Sunglasses',
		itemType: 'Service',
		publisherName: 'PixelVivid',
		headerField: 'headline',
		bodyField: 'reviewer',
		imageField: 'photo',
		maxReviews: 5,
		displayMode: 'carousel',
		draggable: true,
		imgFit: 'contain',
		includeReviewSchema: false,
	},
};

const Template = (args: any) => <ContentfulReviewsCarousel {...args} />;

export const Default: any = Template.bind({});
Default.storyName = 'Contentful Reviews Carousel';

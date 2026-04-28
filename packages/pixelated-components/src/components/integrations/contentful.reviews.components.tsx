"use client";

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { Carousel, type CarouselCardType } from '../general/carousel';
import { ReviewSchema } from '../foundation/schema';
import { getContentfulEntriesByType, getContentfulReviewsSchema } from './contentful.delivery';
import { usePixelatedConfig } from '../config/config.client';
import './contentful.reviews.css';

ContentfulReviewsCarousel.propTypes = {
	/** Contentful entry type used to build the carousel cards. */
	reviewContentType: PropTypes.string.isRequired,
	/** Name of the item or service being reviewed for schema generation. */
	itemName: PropTypes.string.isRequired,
	/** Schema type of the reviewed item. */
	itemType: PropTypes.string,
	/** Publisher name for review schema. */
	publisherName: PropTypes.string,
	/** Contentful API config object. Falls back to usePixelatedConfig if omitted. */
	apiProps: PropTypes.shape({
		base_url: PropTypes.string.isRequired,
		space_id: PropTypes.string.isRequired,
		environment: PropTypes.string.isRequired,
		delivery_access_token: PropTypes.string.isRequired,
		proxyURL: PropTypes.string,
	}),
	/** Field name used to populate the card header text. */
	headerField: PropTypes.string,
	/** Field name used to populate the card body text. */
	bodyField: PropTypes.string,
	/** Optional field name for an image URL on the review card. */
	imageField: PropTypes.string,
	/** Limit how many review cards are shown. */
	maxReviews: PropTypes.number,
	/** Display mode: carousel or grid. */
	displayMode: PropTypes.oneOf(['carousel', 'grid']),
	/** Enable swipe/drag interactions on touch devices. */
	draggable: PropTypes.bool,
	/** Image fit mode for carousel cards. */
	imgFit: PropTypes.oneOf(['contain', 'cover', 'fill']),
	/** Include JSON-LD ReviewSchema for SEO. */
	includeReviewSchema: PropTypes.bool,
};
export type ContentfulReviewsCarouselType = InferProps<typeof ContentfulReviewsCarousel.propTypes>;
export function ContentfulReviewsCarousel(props: ContentfulReviewsCarouselType) {
	const config = usePixelatedConfig();
	const [cards, setCards] = useState<CarouselCardType[]>([]);
	const [reviewSchemas, setReviewSchemas] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const apiProps = props.apiProps ?? {
		base_url: config?.contentful?.base_url ?? '',
		space_id: config?.contentful?.space_id ?? '',
		environment: config?.contentful?.environment ?? '',
		delivery_access_token: config?.contentful?.delivery_access_token ?? '',
	};

	const headerField = props.headerField || 'description';
	const bodyField = props.bodyField || 'reviewer';
	const imageField = props.imageField;
	const displayMode = props.displayMode || 'carousel';
	const draggable = props.draggable !== false;
	const imgFit = props.imgFit || 'cover';
	const includeReviewSchema = props.includeReviewSchema !== false;

	useEffect(() => {
		const fetchReviews = async () => {
			if (!apiProps.base_url || !apiProps.space_id || !apiProps.environment || !apiProps.delivery_access_token) {
				setLoading(false);
				return;
			}

			try {
				const response = await getContentfulEntriesByType({
					apiProps,
					contentType: props.reviewContentType,
				});

				const items = Array.isArray(response?.items)
					? response.items.filter((item: any) => item?.sys?.contentType?.sys?.id === props.reviewContentType)
					: [];

				const reviewCards = items.slice(0, props.maxReviews ?? items.length).map((item: any, index: number) => ({
					index,
					cardIndex: index,
					cardLength: Math.max(items.length, 0),
					headerText: item.fields?.[headerField] ?? '',
					bodyText: item.fields?.[bodyField] ?? '',
					image: imageField ? item.fields?.[imageField] ?? '' : '',
					imageAlt: item.fields?.[headerField] ?? '',
					imgFit,
				} as CarouselCardType));

				setCards(reviewCards);

				if (includeReviewSchema) {
					const schemas = await getContentfulReviewsSchema({
						apiProps,
						itemName: props.itemName,
						itemType: props.itemType,
						publisherName: props.publisherName,
					});
					setReviewSchemas(schemas ?? []);
				}
			} catch (e: any) {
				setError(e?.message || 'Failed to fetch reviews');
			}
			setLoading(false);
		};

		fetchReviews();
	}, [apiProps.base_url, apiProps.space_id, apiProps.environment, apiProps.delivery_access_token, props.reviewContentType, headerField, bodyField, imageField, props.maxReviews, includeReviewSchema, props.itemName, props.itemType, props.publisherName]);

	if (loading) {
		return (
			<div className="contentful-reviews-card">
				<p className="loading">Loading reviews...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="contentful-reviews-card">
				<p className="error">Error: {error}</p>
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="contentful-reviews-card">
				<p className="no-reviews">No reviews found.</p>
			</div>
		);
	}

	return (
		<div className="contentful-reviews-card">
			{includeReviewSchema && reviewSchemas.map((schema, index) => (
				<ReviewSchema key={index} review={schema} />
			))}
			<Carousel cards={cards} draggable={draggable} imgFit={imgFit} />
		</div>
	);
}

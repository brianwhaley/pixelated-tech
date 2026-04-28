'use client';

import React, { useState, useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { SmartImage } from '../general/smartimage';
import { Carousel } from '../general/carousel';
import { ReviewSchema } from '../foundation/schema';
import { getGoogleReviewsByPlaceId, GoogleReview, GooglePlaceSummary } from './google.reviews.functions';
import { usePixelatedConfig } from '../config/config.client';
import './google.reviews.css';


/* 
https://maps.googleapis.com/maps/api/place/textsearch/json?query=Manning+Metalworks+Morris+Plains+NJ&key=[API_KEY]
*/


/**
 * GoogleReviewsCard — Fetch and display Google Place reviews for a specific Place ID.
 *
 * @param {string} [props.placeId] - Google Place ID to fetch reviews for (required).
 * @param {string} [props.language] - Optional language code to localize review text.
 * @param {number} [props.maxReviews] - Maximum number of reviews to display.
 * @param {string} [props.proxyBase] - Optional proxy base URL to avoid CORS restrictions.
 * @param {string} [props.apiKey] - Optional Google API key to use when fetching reviews.
 */
GoogleReviewsCard.propTypes = {
/** Google Place ID (required) */
	placeId: PropTypes.string.isRequired,
	/** Language code for localization (optional) */
	language: PropTypes.string,
	/** Max number of reviews to display */
	maxReviews: PropTypes.number,
	/** Optional proxy base URL to avoid CORS issues */
	proxyBase: PropTypes.string,
	/** Optional Google API key */
	apiKey: PropTypes.string,
};
export type GoogleReviewsCardType = InferProps<typeof GoogleReviewsCard.propTypes>;
export function GoogleReviewsCard(props: GoogleReviewsCardType) {
	const config = usePixelatedConfig();
	const [place, setPlace] = useState<GooglePlaceSummary | undefined>();
	const [reviews, setReviews] = useState<GoogleReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const apiKey = props.apiKey || config?.googleMaps?.apiKey || '';
	const proxyBase = props.proxyBase || config?.global?.proxyUrl || undefined;

	useEffect(() => {
		(async () => {
			try {
				const result = await getGoogleReviewsByPlaceId({
					placeId: props.placeId,
					language: props.language ?? undefined,
					maxReviews: props.maxReviews ?? undefined,
					proxyBase: proxyBase,
					apiKey: apiKey,
				});
				setPlace(result.place);
				setReviews(result.reviews);
				setLoading(false);
			} catch (e: any) {
				const errorMessage = e?.message || 'Failed to fetch reviews';
				// Check for common CORS/network issues
				if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
					setError('Unable to load reviews. This may be due to CORS restrictions in the browser. Try using a proxy server or server-side rendering.');
				} else {
					setError(errorMessage);
				}
				setLoading(false);
			}
		})();
	}, [props.placeId, props.language, props.maxReviews, props.proxyBase]);

	if (loading) {
		return (
			<div className="google-reviews-card">
				<p className="loading">Loading reviews...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="google-reviews-card">
				<p className="error">Error: {error}</p>
			</div>
		);
	}

	return (
		<div className="google-reviews-card">
			<h3>{place?.name || 'Reviews'}</h3>
			{place?.formatted_address && (
				<p className="address">
					{place.formatted_address}
				</p>
			)}
			{reviews.length === 0 ? (
				<p className="no-reviews">No reviews found.</p>
			) : (
				<ul>
					{reviews.map((r, i) => (
						<li key={i}>
							<div className="review-header">
								{r.profile_photo_url && (
									<div className="profile-photo-container">
										<SmartImage
											src={r.profile_photo_url}
											alt={r.author_name}
											className="profile-photo"
										/>
									</div>
								)}
								<div>
									<div className="author-name">{r.author_name}</div>
									<div className="rating">
										{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.rating}/5
										{r.relative_time_description && <span> · {r.relative_time_description}</span>}
									</div>
								</div>
							</div>
							{r.text && <div className="review-text">{r.text}</div>}
						</li>
					))}
				</ul>
			)}
			{place && (
				<a
					href={`https://search.google.com/local/writereview?placeid=${place.place_id}`}
					target="_blank"
					rel="noopener noreferrer"
					className="write-review"
				>
					Write a review on Google →
				</a>
			)}
		</div>
	);
}
GoogleReviewsCarousel.propTypes = {
	/** Google Place ID (required) */
	placeId: PropTypes.string.isRequired,
	/** Language code for localization */
	language: PropTypes.string,
	/** Max number of reviews to display */
	maxReviews: PropTypes.number,
	/** Optional proxy base URL to avoid CORS issues */
	proxyBase: PropTypes.string,
	/** Optional Google API key */
	apiKey: PropTypes.string,
	/** Display mode: carousel or grid */
	displayMode: PropTypes.oneOf(['carousel', 'grid']),
	/** Enable swipe/drag interactions on touch devices */
	draggable: PropTypes.bool,
	/** Image fit mode for carousel cards */
	imgFit: PropTypes.oneOf(['contain', 'cover', 'fill']),
	/** Business name for review schema itemReviewed */
	businessName: PropTypes.string,
	/** Include JSON-LD ReviewSchema for each loaded review */
	includeReviewSchema: PropTypes.bool,
};
export type GoogleReviewsCarouselType = InferProps<typeof GoogleReviewsCarousel.propTypes>;
export function GoogleReviewsCarousel(props: GoogleReviewsCarouselType) {
	const config = usePixelatedConfig();
	const [place, setPlace] = useState<GooglePlaceSummary | undefined>();
	const [reviews, setReviews] = useState<GoogleReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const apiKey = props.apiKey || config?.googleMaps?.apiKey || '';
	const proxyBase = props.proxyBase || config?.global?.proxyUrl || undefined;
	const displayMode = props.displayMode || 'carousel';
	const imgFit = props.imgFit || 'cover';
	const businessName = props.businessName || 'Local Business';
	const includeReviewSchema = props.includeReviewSchema !== false;

	useEffect(() => {
		if (!props.placeId) {
			setError('Place ID is required.');
			setLoading(false);
			return;
		}

		(async () => {
			try {
				const result = await getGoogleReviewsByPlaceId({
					placeId: props.placeId,
					language: props.language ?? undefined,
					maxReviews: props.maxReviews ?? undefined,
					proxyBase: proxyBase,
					apiKey: apiKey,
				});
				setPlace(result.place);
				setReviews(result.reviews);
				setLoading(false);
			} catch (e: any) {
				const errorMessage = e?.message || 'Failed to fetch reviews';
				if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
					setError('Unable to load reviews. This may be due to CORS restrictions in the browser. Try using a proxy server or server-side rendering.');
				} else {
					setError(errorMessage);
				}
				setLoading(false);
			}
		})();
	}, [props.placeId, props.language, props.maxReviews, props.proxyBase, props.apiKey]);

	if (loading) {
		return (
			<div className="google-reviews-card">
				<p className="loading">Loading reviews...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="google-reviews-card">
				<p className="error">Error: {error}</p>
			</div>
		);
	}

	if (reviews.length === 0) {
		return (
			<div className="google-reviews-card">
				<p className="no-reviews">No reviews found.</p>
			</div>
		);
	}

	const cards = reviews.map((review, index) => ({
		index,
		cardIndex: index,
		cardLength: reviews.length,
		image: review.profile_photo_url || '',
		imageAlt: review.author_name,
		imgFit,
		headerText: `${review.rating}/5 Stars`,
		subHeaderText: review.relative_time_description,
		bodyText: review.text ? review.text : `- ${review.author_name}`,
	}));

	const reviewSchemas = reviews.map((review) => ({
		'@context': 'https://schema.org/',
		'@type': 'Review',
		name: review.text ? review.text.substring(0, 110) : `${review.author_name} review`,
		reviewBody: review.text || '',
		datePublished: review.time ? new Date(review.time * 1000).toISOString() : undefined,
		author: {
			'@type': 'Person',
			name: review.author_name,
		},
		itemReviewed: {
			'@type': 'LocalBusiness',
			name: businessName,
		},
		reviewRating: {
			'@type': 'Rating',
			ratingValue: review.rating.toString(),
			bestRating: '5',
			worstRating: '1',
		},
	}));

	return (
		<div className="google-reviews-card">
			{place?.name && <h3>{place.name}</h3>}
			{place?.formatted_address && <p className="address">{place.formatted_address}</p>}
			{includeReviewSchema && reviewSchemas.map((schema, index) => (
				<ReviewSchema key={index} review={schema} />
			))}
			{displayMode === 'grid' ? (
				<div className="google-reviews-grid">
					{reviews.map((review, index) => (
						<div key={index} className="google-review-grid-card">
							{review.profile_photo_url && (
								<div className="profile-photo-container">
									<SmartImage
										src={review.profile_photo_url}
										alt={review.author_name}
										className="profile-photo"
									/>
								</div>
							)}
							<div>
								<div className="author-name">{review.author_name}</div>
								<div className="rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5</div>
								{review.relative_time_description && <div className="review-time">{review.relative_time_description}</div>}
								{review.text && <div className="review-text">{review.text}</div>}
							</div>
						</div>
					))}
				</div>
			) : (
				<Carousel cards={cards} draggable={props.draggable} imgFit={imgFit} />
			)}
		</div>
	);
}
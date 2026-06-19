'use client';

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { contentfulValueToSlug, normalizeContentfulAssetUrl } from '../integrations/contentful.delivery';
import type { SiteInfo } from '../config/config.types';
import { usePixelatedConfig } from '../config/config.client';
import { getServicePathPrefix } from '../elements/services.functions';
import { getGoogleReviewsByPlaceId, type GoogleReview } from '../integrations/google.reviews.functions';
import { getWikipediaCityObject } from '../integrations/wikipedia.functions';





/* ========================================
	SCHEMA HELPER COMPONENTS
======================================== */

function SchemaScript({ schema }: { schema: any }) {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}





/* ========================================
	BLOG POSTING SCHEMA COMPONENTS
======================================== */

/**
 * SchemaBlogPosting — Inject a JSON-LD <script> tag containing a BlogPosting schema object.
 *
 * @param {object} [props.post] - Structured JSON-LD object representing a blog post (BlogPosting schema).
 * @returns {JSX.Element} A script tag with the BlogPosting JSON-LD data.
 */
SchemaBlogPosting.propTypes = {
/** Structured BlogPosting JSON-LD object */
	post: PropTypes.object.isRequired,
};
export type SchemaBlogPostingType = InferProps<typeof SchemaBlogPosting.propTypes>;
export function SchemaBlogPosting(props: SchemaBlogPostingType) {
	const { post } = props;
	return (
		<SchemaScript schema={post} />
	);
}





/* ========================================
	EVENT SCHEMA COMPONENTS
======================================== */

function toIsoDate(value: unknown) {
	const date = new Date(value as string);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeEventImages(images: unknown): string[] {
	if (!Array.isArray(images)) return [];
	return images
		.map((image: any) => normalizeContentfulAssetUrl(image?.image))
		.filter((url: string | undefined): url is string => Boolean(url));
}

/**
 * Build an Event JSON-LD object from raw event data and optional site info.
 *
 * @param {object} event - Contentful event entry payload.
 * @param {object} [siteInfo] - Site metadata used for canonical URL, location, and organizer details.
 */
export function buildEventSchema(event: any, siteInfo?: SiteInfo | null) {
	const baseUrl = siteInfo?.url?.replace(/\/$/, '') ?? '';
	const eventUrl = baseUrl ? `${baseUrl}/events/${event.fields.id}` : `/events/${event.fields.id}`;
	const images = normalizeEventImages(event.fields.carouselImages);

	return {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: event.fields.title,
		startDate: toIsoDate(event.fields.startDate),
		endDate: toIsoDate(event.fields.endDate),
		eventStatus: 'https://schema.org/EventScheduled',
		location: {
			'@type': 'Place',
			name: siteInfo?.name,
			address: {
				'@type': 'PostalAddress',
				streetAddress: siteInfo?.address?.streetAddress,
				addressLocality: siteInfo?.address?.addressLocality,
				postalCode: siteInfo?.address?.postalCode,
				addressRegion: siteInfo?.address?.addressRegion,
				addressCountry: siteInfo?.address?.addressCountry,
			},
		},
		image: images.length ? images : undefined,
		description: event.fields.description,
		url: eventUrl,
		offers: event.fields.price != null ? {
			'@type': 'Offer',
			url: eventUrl,
			price: event.fields.price,
			priceCurrency: 'USD',
			availability: event.fields.maxSeats > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
			validFrom: toIsoDate(event.fields.startDate),
		} : undefined,
		organizer: {
			'@type': 'Organization',
			name: siteInfo?.name,
			url: siteInfo?.url,
		},
	};
}

SchemaEvent.propTypes = {
	/** Structured Event JSON-LD object */
	event: PropTypes.any.isRequired,
};
export type SchemaEventType = InferProps<typeof SchemaEvent.propTypes>;
export function SchemaEvent(props: SchemaEventType) {
	const config = usePixelatedConfig();
	const { event } = props;
	const schema = event?.['@type'] ? event : buildEventSchema(event, config?.siteInfo);
	return (
		<SchemaScript schema={schema} />
	);
}







/* ========================================
	BREADCRUMB SCHEMA COMPONENTS
======================================== */

/* The server-only breadcrumb schema implementation lives in schema.server.tsx.
   This client module no longer exports the breadcrumb JSON-LD component.
*/

/* ========================================
	FAQ SCHEMA COMPONENTS
======================================== */

interface SchemaFAQProps {
  faqsData: any;
}

// normalizeFaqs turns a JSON-LD FAQPage payload into a form where each
// question has a single `acceptedAnswer.text` string.  Some of our data
// sources (WordPress, CMS exports) allow multiple answer fragments; we
// merge them here so the final JSON remains valid for search engines.
function normalizeFaqs(data: any): any {
	if (!data || typeof data !== 'object') return data;
	const faqs = JSON.parse(JSON.stringify(data));
	if (Array.isArray(faqs.mainEntity)) {
		faqs.mainEntity.forEach((entry: any) => {
			if (entry && entry.acceptedAnswer) {
				const ans = entry.acceptedAnswer;
				if (ans && Array.isArray(ans.text)) {
					ans.text = ans.text.join(' ');
				}
			}
		});
	}
	return faqs;
}

/**
 * SchemaFAQ — Inject a JSON-LD <script> tag containing an FAQPage schema object.
 *
 * @param {object} [props.faqsData] - Structured JSON-LD object representing an FAQ page (FAQPage schema).
 */
SchemaFAQ.propTypes = {
	/** Structured FAQPage JSON-LD object */
	faqsData: PropTypes.object.isRequired,
};
export type SchemaFAQType = InferProps<typeof SchemaFAQ.propTypes>;
export function SchemaFAQ({ faqsData }: SchemaFAQType) {
	const normalized = normalizeFaqs(faqsData);
	return (
		<SchemaScript schema={normalized} />
	);
}







/* ========================================
	LOCAL BUSINESS SCHEMA COMPONENTS
======================================== */

export function normalizeOpeningHoursValue(value: unknown): string | string[] | undefined {
	if (!value) {
		return undefined;
	}
	if (typeof value === 'string') {
		return value;
	}
	if (!Array.isArray(value)) {
		return undefined;
	}
	if (value.every((item) => typeof item === 'string')) {
		return value as string[];
	}
	const normalized = value
		.map((item: any) => {
			if (!item || typeof item !== 'object') {
				return undefined;
			}
			const day = item.day?.toString?.().trim();
			if (!day) {
				return undefined;
			}
			if (item.closed) {
				return undefined;
			}
			const hours = item.hours?.toString?.().trim();
			const open = item.open?.toString?.().trim();
			const close = item.close?.toString?.().trim();
			if (open && close) {
				return `${day} ${open}-${close}`;
			}
			if (hours) {
				return `${day} ${hours}`;
			}
			return undefined;
		})
		.filter(Boolean) as string[];
	return normalized.length ? normalized : undefined;
}

export function formatServiceDescription(description: unknown): string | undefined {
	if (typeof description === 'string') {
		return description;
	}
	if (Array.isArray(description) && description.every((item) => typeof item === 'string')) {
		return description.join('  ');
	}
	return undefined;
}

/**
 * LocalBusiness Schema Component
 * Generates JSON-LD structured data for SEO
 * https://schema.org/LocalBusiness
 * 
 * @param no params
 * @return A SchemaScript component embedding LocalBusiness JSON-LD, or null if required data is missing.
 * 
 * This component uses siteInfo from the config provider to generate schema data.
 */
LocalBusinessSchema.propTypes = { /** no props */ };
export type LocalBusinessSchemaType = InferProps<typeof LocalBusinessSchema.propTypes>;
export function LocalBusinessSchema() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;

	const name = siteInfo?.name;
	const address = siteInfo?.address;
	const streetAddress = siteInfo?.address?.streetAddress;
	const addressLocality = siteInfo?.address?.addressLocality;
	const addressRegion = siteInfo?.address?.addressRegion;
	const postalCode = siteInfo?.address?.postalCode;
	const addressCountry = siteInfo?.address?.addressCountry || 'United States';
	const telephone = siteInfo?.telephone;
	const url = siteInfo?.url;
	const logo = siteInfo?.image;
	const services = siteInfo?.services || [];
	const servicePathPrefix = getServicePathPrefix(siteInfo);
	const serviceCatalogItems = services
		.filter((service): service is NonNullable<typeof service> => service != null && typeof service.name === 'string')
		.map((service) => {
			const serviceName = service.name;
			const serviceSlug = contentfulValueToSlug({ value: serviceName });
			const serviceUrl = service.url
				|| (url && serviceSlug ? `${url.replace(/\/$/, '')}${servicePathPrefix}/${serviceSlug}` : undefined);
			return {
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: serviceName,
					...(service.description && { description: formatServiceDescription(service.description) }),
					...(serviceUrl && { url: serviceUrl }),
				}
			};
		});
	const image = siteInfo?.image || logo;
	const openingHours = normalizeOpeningHoursValue(siteInfo?.openingHours);
	const description = siteInfo?.description;
	const email = siteInfo?.email;
	const priceRange = siteInfo?.priceRange;
	const sameAs = siteInfo?.sameAs;
	const schemaData = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name,
		address: {
			'@type': 'PostalAddress',
			...( address || {
				streetAddress,
				addressLocality,
				addressRegion,
				postalCode,
				addressCountry
			})
		},
		telephone,
		url,
		...(logo && { logo }),
		...(serviceCatalogItems.length > 0 && {
			hasOfferCatalog: {
				'@type': 'OfferCatalog',
				name: 'Services',
				itemListElement: serviceCatalogItems,
			}
		}),
		...(image && { image }),
		...(openingHours && { openingHours }),
		...(description && { description }),
		...(email && { email }),
		...(priceRange && { priceRange }),
		...(sameAs && sameAs.length > 0 && { sameAs })
	};

	return (
		<SchemaScript schema={schemaData} />
	);
}





/* ========================================
	PODCAST SCHEMA COMPONENTS
======================================== */

/**
 * SchemaPodcastEpisode — Inject a JSON-LD <script> tag containing a PodcastEpisode schema object.
 *
 * @param {object} [props.episode] - Structured JSON-LD object representing a podcast episode (PodcastEpisode schema).
 */
SchemaPodcastEpisode.propTypes = {
	episode: PropTypes.object.isRequired,
};
export type SchemaPodcastEpisodeType = InferProps<typeof SchemaPodcastEpisode.propTypes>;
export function SchemaPodcastEpisode(props: SchemaPodcastEpisodeType) {
	const { episode } = props;
	return (
		<SchemaScript schema={episode} />
	);
}

/**
 * SchemaPodcastSeries — Inject a JSON-LD <script> tag containing a PodcastSeries schema object.
 *
 * @param {object} [props.series] - Structured JSON-LD object representing a podcast series (PodcastSeries schema).
 */
SchemaPodcastSeries.propTypes = {
	series: PropTypes.object.isRequired,
};
export type SchemaPodcastSeriesType = InferProps<typeof SchemaPodcastSeries.propTypes>;
export function SchemaPodcastSeries(props: SchemaPodcastSeriesType) {
	const { series } = props;
	return (
		<SchemaScript schema={series} />
	);
}





/* ========================================
	PRODUCT SCHEMA COMPONENTS
======================================== */

/**
 * ProductSchema — embeds a product/offer as JSON-LD for SEO (schema.org/Product).
 *
 * @param {shape} [props.product] - Product object conforming to schema.org/Product; will be serialized as JSON-LD.
 * @param {string} [props.product.name] - The product name.
 * @param {string} [props.product.description] - Product description.
 * @param {shape} [props.product.brand] - Brand information (name and @type).
 * @param {shape} [props.product.offers] - Offer information including price, currency, URL, and availability.
 */
ProductSchema.propTypes = {
	/** Product information object to be serialized as JSON-LD. */
	product: PropTypes.shape({
		'@context': PropTypes.string.isRequired,
		'@type': PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		image: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
		brand: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		}),
		offers: PropTypes.oneOfType([
			PropTypes.shape({
				'@type': PropTypes.string.isRequired,
				url: PropTypes.string,
				priceCurrency: PropTypes.string,
				price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
				availability: PropTypes.string,
			}),
			PropTypes.arrayOf(
				PropTypes.shape({
					'@type': PropTypes.string.isRequired,
					url: PropTypes.string,
					priceCurrency: PropTypes.string,
					price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
					availability: PropTypes.string,
				})
			)
		]),
		aggregateRating: PropTypes.shape({
			'@type': PropTypes.string,
			ratingValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			reviewCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
	}).isRequired,
};
export type ProductSchemaType = InferProps<typeof ProductSchema.propTypes>;
export function ProductSchema(props: ProductSchemaType) {
	const { product } = props;
	return (
		<SchemaScript schema={product} />
	);
}






/* ========================================
	RECIPE SCHEMA COMPONENTS
======================================== */

/**
 * Recipe Schema Component
 * Generates JSON-LD structured data for recipes
 * https://schema.org/Recipe
 */

/**
 * RecipeSchema — embeds a recipe as JSON-LD for SEO (schema.org/Recipe).
 *
 * @param {shape} [props.recipe] - Recipe object conforming to schema.org/Recipe; will be serialized as JSON-LD.
 * @param {string} [props.name] - Recipe title.
 * @param {string} [props.description] - Short recipe description.
 * @param {shape} [props.author] - Author information (name and @type).
 * @param {string} [props.datePublished] - ISO date the recipe was published.
 * @param {string} [props.image] - Primary image URL for the recipe.
 * @param {string} [props.recipeYield] - Yield or serving size (e.g., '4 servings').
 * @param {string} [props.prepTime] - Prep time in ISO 8601 duration (e.g. 'PT20M').
 * @param {string} [props.cookTime] - Cook time in ISO 8601 duration.
 * @param {string} [props.totalTime] - Total time in ISO 8601 duration.
 * @param {string} [props.recipeCategory] - Category of the recipe (e.g., 'Dessert').
 * @param {string} [props.recipeCuisine] - Cuisine (e.g., 'Italian').
 * @param {arrayOf} [props.recipeIngredient] - List of ingredient strings.
 * @param {arrayOf} [props.recipeInstructions] - Structured list of instruction steps or paragraphs.
 * @param {string} [props.license] - License URL or short string for the recipe content.
 */
RecipeSchema.propTypes = {
/** Recipe information object to be serialized as JSON-LD. */
	recipe: PropTypes.shape({
		'@context': PropTypes.string.isRequired,
		'@type': PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		author: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		}),
		datePublished: PropTypes.string,
		image: PropTypes.string,
		recipeYield: PropTypes.string,
		prepTime: PropTypes.string,
		cookTime: PropTypes.string,
		totalTime: PropTypes.string,
		recipeCategory: PropTypes.string,
		recipeCuisine: PropTypes.string,
		recipeIngredient: PropTypes.arrayOf(PropTypes.string),
		recipeInstructions: PropTypes.arrayOf(PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			text: PropTypes.string.isRequired,
		})),
		license: PropTypes.string,
	}).isRequired,
};
export type RecipeSchemaType = InferProps<typeof RecipeSchema.propTypes>;
export function RecipeSchema(props: RecipeSchemaType) {
	const { recipe } = props;
	return (
		<SchemaScript schema={recipe} />
	);
}







/* ========================================
	REVIEW SCHEMA COMPONENTS
======================================== */

/**
 * ReviewSchema — embeds a review as JSON-LD for SEO (schema.org/Review).
 *
 * @param {shape} [props.review] - Review object conforming to schema.org/Review; will be serialized as JSON-LD.
 * @param {string} [props.review.name] - The headline or title of the review.
 * @param {string} [props.review.reviewBody] - The body of the review content.
 * @param {string} [props.review.datePublished] - ISO date the review was published.
 * @param {shape} [props.review.author] - Author information (name and @type).
 * @param {shape} [props.review.itemReviewed] - The item being reviewed (product, service, etc.).
 * @param {shape} [props.review.reviewRating] - Rating information including ratingValue, bestRating, worstRating.
 * @param {shape} [props.review.publisher] - Organization publishing the review.
 */
ReviewSchema.propTypes = {
	/** Review information object to be serialized as JSON-LD. */
	review: PropTypes.shape({
		'@context': PropTypes.string.isRequired,
		'@type': PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		reviewBody: PropTypes.string,
		datePublished: PropTypes.string,
		author: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		}),
		itemReviewed: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			name: PropTypes.string,
		}),
		reviewRating: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			ratingValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			bestRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			worstRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
		publisher: PropTypes.shape({
			'@type': PropTypes.string.isRequired,
			name: PropTypes.string,
		}),
	}).isRequired,
};
export type ReviewSchemaType = InferProps<typeof ReviewSchema.propTypes>;
export function ReviewSchema(props: ReviewSchemaType) {
	const { review } = props;
	return (
		<SchemaScript schema={review} />
	);
}








/* ========================================
	SERVICES SCHEMA COMPONENTS
======================================== */

/**
 * Services Schema Component
 * Generates JSON-LD structured data for services
 * https://schema.org/Service
 *
 * This component reads service definitions from config.siteInfo.services.
 * 
 * @param {string} [] - Optional service name to override config data.
 * @returns {JSX.Element|null} - Returns a SchemaScript component with the generated JSON-LD, or null if required data is missing.
 */
ServicesSchema.propTypes = {};
export type ServicesSchemaType = InferProps<typeof ServicesSchema.propTypes>;
export function ServicesSchema() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const services = siteInfo?.services || [];
	const provider = {
		name: siteInfo?.name || '',
		url: siteInfo?.url || '',
		logo: siteInfo?.image,
		telephone: siteInfo?.telephone,
		email: siteInfo?.email,
		address: siteInfo?.address,
		sameAs: siteInfo?.sameAs,
		openingHours: siteInfo?.openingHours
	};

	const baseUrl = siteInfo?.url?.replace(/\/$/, '') || provider.url?.replace(/\/$/, '') || '';
	const serviceAreas = siteInfo?.serviceAreas || [];

	const areaServedValues = serviceAreas
		.map(area => getWikipediaCityObject(area?.name))
		.filter((item): item is NonNullable<typeof item> => item !== null);

	const googlePlacesPlaceId = config?.integrations?.googlePlaces?.placeId || '';
	const googlePlacesApiKey = config?.integrations?.googlePlaces?.apiKey || '';
	const googlePlacesLanguage = config?.integrations?.googlePlaces?.language;
	const proxyBase = config?.integrations?.global?.proxyUrl || undefined;
	const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
	const shouldLoadGoogleReviews = Boolean(googlePlacesPlaceId && googlePlacesApiKey);

	useEffect(() => {
		if (!shouldLoadGoogleReviews) {
			return;
		}

		let didCancel = false;
		(async () => {
			try {
				const result = await getGoogleReviewsByPlaceId({
					apiKey: googlePlacesApiKey,
					placeId: googlePlacesPlaceId,
					proxyBase,
					language: googlePlacesLanguage ?? undefined,
					maxReviews: 5,
				});
				if (!didCancel && Array.isArray(result.reviews)) {
					setGoogleReviews(result.reviews);
				}
			} catch {
				// Silently ignore review fetch failures and continue rendering service schema without reviews.
			}
		})();

		return () => {
			didCancel = true;
		};
	}, [googlePlacesApiKey, googlePlacesLanguage, googlePlacesPlaceId, proxyBase, shouldLoadGoogleReviews]);

	if (!services.length || !provider.name) {
		return null;
	}

	const sharedAudience = siteInfo?.audience;
	const sharedBrand = siteInfo?.brand;
	const sharedAvailability = siteInfo?.availability;
	const sharedAvailableChannel = (() => {
		const availableChannel = siteInfo?.availableChannel;
		if (availableChannel?.servicePhone) {
			return availableChannel;
		}
		if (!siteInfo?.telephone) {
			return availableChannel;
		}
		return {
			...availableChannel,
			'@type': availableChannel?.['@type'] || 'ContactPoint',
			servicePhone: siteInfo.telephone,
		};
	})();
	const sharedOffers = siteInfo?.offers;
	const sharedTermsOfService = siteInfo?.termsOfService;
	const servicePathPrefix = getServicePathPrefix(siteInfo);

	const serviceObjects = services.filter((service): service is NonNullable<typeof service> => service != null).map((service) => {
		const serviceSlug = contentfulValueToSlug({ value: service.name });
		const serviceUrl = baseUrl && serviceSlug ? `${baseUrl}${servicePathPrefix}/${serviceSlug}` : undefined;
		const serviceType = service.serviceType || service.name;
		const serviceOutput = service.serviceOutput || `High-performance ${service.name.toLowerCase()} optimized for business growth and measurable results.`;
		const category = service.category || service.name;
		const audience = service.audience || sharedAudience;
		const offers = service.offers || sharedOffers;
		const termsOfService = service.termsOfService || sharedTermsOfService;
		const googleReviewSchemas = googleReviews.map((review) => ({
			'@context': 'https://schema.org',
			'@type': 'Review',
			name: review.text ? review.text.substring(0, 110) : `${review.author_name} review`,
			reviewBody: review.text || undefined,
			datePublished: review.time ? new Date(review.time * 1000).toISOString() : undefined,
			author: {
				'@type': 'Person',
				name: review.author_name,
			},
			itemReviewed: {
				'@type': 'LocalBusiness',
				name: provider.name,
				...(provider.url && { url: provider.url }),
			},
			reviewRating: {
				'@type': 'Rating',
				ratingValue: review.rating.toString(),
				bestRating: '5',
				worstRating: '1',
			},
		}));

		const googleAggregateRating = googleReviews.length > 0 ? {
			'@type': 'AggregateRating',
			ratingValue: (
				googleReviews.reduce((sum, review) => sum + review.rating, 0) / googleReviews.length
			).toFixed(1),
			reviewCount: googleReviews.length.toString(),
			bestRating: '5',
			worstRating: '1',
		} : undefined;

		return {
			'@type': 'Service',
			name: service.name,
			description: formatServiceDescription(service.description),
			...(serviceUrl && { url: serviceUrl }),
			...(service.image && { image: service.image }),
			...(termsOfService && { termsOfService }),
			...(serviceType && { serviceType }),
			...(serviceOutput && { serviceOutput }),
			...(category && { category }),
			...(audience && { audience }),
			...(offers && { offers }),
			...(sharedBrand && { brand: sharedBrand }),
			...(sharedAvailability && { availability: sharedAvailability }),
			...(sharedAvailableChannel && { availableChannel: sharedAvailableChannel }),
			...(areaServedValues.length > 0 && { areaServed: areaServedValues }),
			...(googleAggregateRating && { aggregateRating: googleAggregateRating }),
			...(googleReviewSchemas.length > 0 && { review: googleReviewSchemas }),
			provider: {
				'@type': 'LocalBusiness',
				name: provider.name,
				url: provider.url,
				...(provider.logo && { logo: provider.logo }),
				...(provider.telephone && { telephone: provider.telephone }),
				...(provider.email && { email: provider.email }),
				...(provider.address && { address: {
					'@type': 'PostalAddress',
					...provider.address
				} }),
				...(Array.isArray(provider.sameAs) && provider.sameAs.length > 0 && { sameAs: provider.sameAs }),
				...(Array.isArray(provider.openingHours) && provider.openingHours.length > 0 && { openingHours: provider.openingHours })
			}
		};
	});

	return (
		<>
			{serviceObjects.map((service, idx) => (
				<SchemaScript key={idx} schema={{ '@context': 'https://schema.org', ...service }} />
			))}
		</>
	);
}





/* ========================================
	WEBPAGE SCHEMA COMPONENTS
======================================== */

/**
 * SchemaWebPage — embeds a WebPage as JSON-LD for geographic landing pages.
 */
SchemaWebPage.propTypes = {
	/** Slug of the active service area */
	serviceAreaSlug: PropTypes.string.isRequired,
	/** Optional path prefix for service area URLs */
	serviceAreaPathPrefix: PropTypes.string,
};
export type SchemaWebPageType = InferProps<typeof SchemaWebPage.propTypes>;
export function SchemaWebPage({ serviceAreaSlug, serviceAreaPathPrefix = '/service-areas' }: SchemaWebPageType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const activeArea = siteInfo?.serviceAreas?.find((area: any) => {
		const itemSlug = contentfulValueToSlug({ value: area?.name || '' });
		return itemSlug === serviceAreaSlug;
	});

	if (!activeArea) {
		return null;
	}

	const baseUrl = siteInfo?.url?.replace(/\/$/, '') || '';
	const servicePathPrefix = getServicePathPrefix(siteInfo);
	const services = siteInfo?.services || [];

	const aboutServices = services
		.filter((service): service is NonNullable<typeof service> => service != null && typeof service.name === 'string')
		.map((service) => {
			const serviceName = service.name;
			const serviceSlug = contentfulValueToSlug({ value: serviceName });
			const serviceUrl = service.url || (baseUrl ? `${baseUrl}${servicePathPrefix}/${serviceSlug}` : undefined);
			return {
				'@type': 'Service',
				name: serviceName,
				...(serviceUrl && { url: serviceUrl }),
			};
		});

	const url = `${baseUrl}${serviceAreaPathPrefix}/${serviceAreaSlug}`;
	const formattedAreaName = activeArea.name.trim().replace(/\s+([A-Z]{2})$/i, ', $1');
	const schemaData = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': url,
		url,
		name: `Digital Services and Web Design in ${formattedAreaName}`,
		...(aboutServices.length > 0 && { about: aboutServices }),
	};

	return (
		<SchemaScript schema={schemaData} />
	);
}




/* ========================================
	WEBSITE SCHEMA COMPONENTS
======================================== */

/**
 * Website Schema Component
 * Generates JSON-LD structured data for websites
 * https://schema.org/WebSite
 *
 * This component reads website metadata from config.siteInfo.
 * 
 * @param {string} [] - Optional props can be added to override config data for name, url, description, keywords, inLanguage, sameAs, publisher, potentialAction, copyrightYear, and copyrightHolder.
 * @returns {JSX.Element|null} - Returns a SchemaScript component with the generated JSON-LD, or null if required data is missing.
 */
WebsiteSchema.propTypes = {};
export type WebsiteSchemaType = InferProps<typeof WebsiteSchema.propTypes>;
export function WebsiteSchema() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const name = siteInfo?.name;
	const url = siteInfo?.url;
	if (!name || !url) {
		return null;
	}

	const description = siteInfo?.description;
	const keywords = siteInfo?.keywords;
	const inLanguage = siteInfo?.default_locale;
	const sameAs = siteInfo?.sameAs;
	const publisher = buildPublisher(siteInfo);
	const potentialAction = buildPotentialAction(siteInfo?.potentialAction);
	const copyrightYear = siteInfo?.copyrightYear;
	const copyrightHolder = buildCopyrightHolder(siteInfo);

	const schemaData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name,
		url,
		...(description && { description }),
		...(keywords && { keywords }),
		...(inLanguage && { inLanguage }),
		...(sameAs && sameAs.length ? { sameAs } : {}),
		...(publisher && { publisher }),
		...(potentialAction && { potentialAction }),
		...(copyrightYear != null && { copyrightYear }),
		...(copyrightHolder && { copyrightHolder })
	};

	return (
		<SchemaScript schema={schemaData} />
	);
}

function buildPublisher(siteInfo?: SiteInfo) {
	if (!siteInfo) {
		return undefined;
	}
	if (!siteInfo.name) {
		return undefined;
	}
	const logoUrl = siteInfo.image;
	const logoWidth = parseDimension(siteInfo.image_width ?? undefined);
	const logoHeight = parseDimension(siteInfo.image_height ?? undefined);
	const logo = logoUrl
		? {
			'@type': 'ImageObject',
			url: logoUrl,
			...(logoWidth !== undefined && { width: logoWidth }),
			...(logoHeight !== undefined && { height: logoHeight })
		}
		: undefined;
	return {
		'@type': siteInfo.publisherType || 'Organization',
		name: siteInfo.name,
		...(siteInfo.url && { url: siteInfo.url }),
		...(logo && { logo })
	};
}

function buildCopyrightHolder(siteInfo?: SiteInfo) {
	if (!siteInfo?.name) {
		return undefined;
	}
	const holderType = siteInfo.publisherType || 'Organization';
	return {
		'@type': holderType,
		name: siteInfo.name,
		...(siteInfo.url && { url: siteInfo.url })
	};
}

function buildPotentialAction(action?: SiteInfo['potentialAction']) {
	if (!action || !action.target) {
		return undefined;
	}
	const queryInput = action['query-input'] ?? action.queryInput;
	return {
		'@type': action['@type'] ?? 'SearchAction',
		target: {
			'@type': 'EntryPoint',
			urlTemplate: action.target
		},
		...(queryInput && { 'query-input': queryInput })
	};
}

function parseDimension(value?: string | number) {
	if (typeof value === 'number') {
		return value;
	}
	if (!value) {
		return undefined;
	}
	const parsed = Number(value);
	return Number.isNaN(parsed) ? undefined : parsed;
}

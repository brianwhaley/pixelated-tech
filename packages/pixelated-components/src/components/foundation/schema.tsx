'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { contentfulValueToSlug, normalizeContentfulAssetUrl } from '../integrations/contentful.delivery';
import type { SiteInfo } from '../config/config.types';
import { usePixelatedConfig } from '../config/config.client';
import { usePathname } from 'next/navigation';
import { getServicePathPrefix, findServiceBySlug } from '../elements/services.functions';
import { getGoogleReviewsByPlaceId, type GoogleReview } from '../integrations/google.reviews.functions';
import { getWikipediaCityObject } from '../integrations/wikipedia.functions';
import { sanitizeString, toBoolean } from '../foundation/utilities';
import { getPolicyRouteUrl } from '../foundation/schema.functions';
import { parseNumber, safeString, normalizeProtocolRelativeUrl } from '../elements/smartmediautils';

import { pixelatedTechOrganizationSchema } from '../pixelated/pixelated.functions';

type ServiceSchemaType = NonNullable<SiteInfo['services']>[number];



/* ========================================
	SCHEMA HELPER COMPONENTS
======================================== */

function SchemaScript({ schema }: { schema: any }) {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function addSameAs(entity: any, sameAs?: string[] | null) {
	if (!sameAs?.length || !entity) { return entity; }
	/* if (entity.sameAs) { return entity; }
	return { ...entity, sameAs }; */
	const existing = Array.isArray(entity.sameAs) ? entity.sameAs : [];
	const combined = Array.from(new Set([...existing, ...sameAs]));
	return { ...entity, sameAs: combined };
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
	const config = usePixelatedConfig();
	const sameAs = config?.siteInfo?.sameAs;
	const { post } = props;
	const schema = sameAs?.length ? {
		...post,
		author: addSameAs((post as any)?.author, sameAs),
		publisher: addSameAs((post as any)?.publisher, sameAs),
	} : post;
	return (
		<SchemaScript schema={schema} />
	);
}






/* ========================================
	BOOK SCHEMA COMPONENTS
======================================== */

function normalizeBookEntity(entity: unknown, fallbackName?: string, defaultType: 'Person' | 'Organization' = 'Person'): any | undefined {
	if (entity && typeof entity === 'object') {
		return {
			'@type': sanitizeString((entity as any)['@type']) || defaultType,
			...entity,
		};
	}
	if (typeof entity === 'string' && entity.trim()) {
		return {
			'@type': defaultType,
			name: entity.trim(),
		};
	}
	if (fallbackName && typeof fallbackName === 'string' && fallbackName.trim()) {
		return {
			'@type': defaultType,
			name: fallbackName.trim(),
		};
	}
	return undefined;
}

function buildBookUrl(bookUrl: unknown, pageUrl: unknown, siteUrl: unknown): string | undefined {
	const normalizedBookUrl = sanitizeString(bookUrl);
	if (normalizedBookUrl) {
		return normalizedBookUrl;
	}
	const normalizedPageUrl = sanitizeString(pageUrl);
	if (!normalizedPageUrl) {
		return undefined;
	}
	if (/^https?:\/\//i.test(normalizedPageUrl)) {
		return normalizedPageUrl;
	}
	const normalizedSiteUrl = sanitizeString(siteUrl);
	if (normalizedSiteUrl) {
		return `${normalizedSiteUrl.replace(/\/$/, '')}/${normalizedPageUrl.replace(/^\//, '')}`;
	}
	return undefined;
}

function normalizeBookFormat(value: unknown): string | undefined {
	const format = sanitizeString(value);
	if (!format) {
		return undefined;
	}
	const normalized = format.toLowerCase().replace(/\s+/g, '');
	const mapping: Record<string, string> = {
		hardcover: 'https://schema.org/Hardcover',
		paperback: 'https://schema.org/Paperback',
		ebook: 'https://schema.org/EBook',
		audiobook: 'https://schema.org/Audiobook',
		largeprint: 'https://schema.org/LargePrint',
		massmarketpaperback: 'https://schema.org/MassMarketPaperback',
		tradepaperback: 'https://schema.org/TradePaperback',
	};
	return mapping[normalized] || format;
}

function buildBookVariant(variant: any): any | undefined {
	if (!variant || typeof variant !== 'object') {
		return undefined;
	}

	const bookFormat = normalizeBookFormat(variant?.bookFormat || variant?.name || variant?.['@type']);
	const asin = sanitizeString(variant?.asin);
	const isbn = sanitizeString(variant?.isbn);
	const numberOfPages = variant?.numberOfPages != null ? Number(variant.numberOfPages) : undefined;
	const offer = buildOfferSchema({
		url: variant?.offerURL || variant?.offerUrl || variant?.url,
		price: variant?.price,
		priceCurrency: variant?.priceCurrency,
		availability: variant?.availability || 'https://schema.org/InStock',
	});

	const variantSchema: any = {
		'@type': 'Book',
		...(bookFormat && { bookFormat }),
		...(asin && { asin }),
		...(isbn && { isbn }),
		...(numberOfPages ? { numberOfPages } : {}),
		...(offer && { offers: offer }),
	};

	return Object.keys(variantSchema).length > 1 ? variantSchema : undefined;
}


/**
 * SchemaBook — embeds a book as JSON-LD for SEO (schema.org/Book).
 * @param {shape} [props.book] - Book object conforming to schema.org/Book; will be serialized as JSON-LD.
 * @returns {JSX.Element} A script tag with the Book JSON-LD data.
 */
SchemaBook.propTypes = {
	book: PropTypes.shape({
		'@context': PropTypes.string,
		'@type': PropTypes.string,
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		image: PropTypes.string,
		datePublished: PropTypes.string,
		genre: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
		inLanguage: PropTypes.string,
		isFamilyFriendly: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
		pageUrl: PropTypes.string,
		url: PropTypes.string,
		copyrightYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		author: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				'@type': PropTypes.string,
				name: PropTypes.string,
			}),
		]),
		publisher: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				'@type': PropTypes.string,
				name: PropTypes.string,
			}),
		]),
		lccn: PropTypes.string,
		sameAs: PropTypes.arrayOf(PropTypes.string),
		variants: PropTypes.arrayOf(
			PropTypes.shape({
				bookFormat: PropTypes.string,
				name: PropTypes.string,
				'@type': PropTypes.string,
				asin: PropTypes.string,
				isbn: PropTypes.string,
				numberOfPages: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
				offerURL: PropTypes.string,
				offerUrl: PropTypes.string,
				url: PropTypes.string,
				price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
				priceCurrency: PropTypes.string,
				availability: PropTypes.string,
			})
		),
	}).isRequired,
};
export type SchemaBookType = InferProps<typeof SchemaBook.propTypes>;
export function SchemaBook(props: SchemaBookType) {
	const config = usePixelatedConfig();
	const { book } = props;
	const siteInfo = config?.siteInfo;

	const author = normalizeBookEntity(book.author || siteInfo?.author, siteInfo?.name, 'Person');
	const publisher = normalizeBookEntity(book.publisher, undefined, 'Organization') || buildPublisher(siteInfo);
	const variantSchemas = Array.isArray(book.variants)
		? book.variants.map(buildBookVariant).filter(Boolean)
		: [];
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Book',
		name: book.name,
		...(book.description && { description: book.description }),
		...(book.datePublished && { datePublished: book.datePublished }),
		...(book.image ? { image: book.image } : siteInfo?.image ? { image: siteInfo.image } : {}),
		...(book.genre && { genre: book.genre }),
		...(book.inLanguage && { inLanguage: book.inLanguage }),
		...(toBoolean(book.isFamilyFriendly) != null && { isFamilyFriendly: toBoolean(book.isFamilyFriendly) }),
		...(author && { author: addSameAs(author, siteInfo?.sameAs) }),
		...(publisher && { publisher: addSameAs(publisher, siteInfo?.sameAs) }),
		...(book.sameAs && book.sameAs.length > 0 && { sameAs: book.sameAs }),
		...(buildBookUrl(book.url, book.pageUrl, siteInfo?.url) && { url: buildBookUrl(book.url, book.pageUrl, siteInfo?.url) }),
		// identifier: construct from `book.lccn` when present
		...(book.lccn ? { identifier: { '@type': 'PropertyValue', propertyID: 'LCCN', value: String(book.lccn) } } : {}),
		...(book.copyrightYear && { copyrightYear: Number(book.copyrightYear) }),
		...(variantSchemas.length > 0 && { workExample: variantSchemas }),
	};

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
	EVENT SCHEMA COMPONENTS
======================================== */

function toIsoDate(value: unknown) {
	const date = new Date(value as string);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * SchemaEvent — Inject a JSON-LD <script> tag containing an Event schema object.
 * @param {object} [props.event] - Structured JSON-LD object representing an event (Event schema).
 * @returns {JSX.Element} A script tag with the Event JSON-LD data.
 */
SchemaEvent.propTypes = {
	/** Structured Event JSON-LD object */
	event: PropTypes.any.isRequired,
};
export type SchemaEventType = InferProps<typeof SchemaEvent.propTypes>;
export function SchemaEvent(props: SchemaEventType) {
	const config = usePixelatedConfig();
	const { event } = props;
	const siteInfo = config?.siteInfo;

	const schema = event?.['@type'] ? event : (() => {
		const baseUrl = siteInfo?.url?.replace(/\/$/, '') ?? '';
		const eventUrl = baseUrl ? `${baseUrl}/events/${event.fields.id}` : `/events/${event.fields.id}`;
		const startIso = toIsoDate(event.fields.startDate);
		const endIso = toIsoDate(event.fields.endDate);
		const now = Date.now();
		const startTime = startIso ? Date.parse(startIso) : NaN;
		const endTime = endIso ? Date.parse(endIso) : NaN;
		const images = Array.isArray(event.fields.carouselImages)
			? event.fields.carouselImages
				.map((image: any) => normalizeContentfulAssetUrl(image?.image))
				.filter((url: string | undefined): url is string => Boolean(url))
			: [];
		return {
			'@context': 'https://schema.org',
			'@type': 'Event',
			name: event.fields.title,
			startDate: startIso,
			endDate: endIso,
			eventStatus: !Number.isNaN(endTime) && endTime < now
				? 'https://schema.org/EventCompleted'
				: !Number.isNaN(startTime) && startTime > now
					? 'https://schema.org/EventScheduled'
					: !Number.isNaN(startTime) && !Number.isNaN(endTime) && startTime <= now && endTime >= now
						? 'https://schema.org/EventOngoing'
						: !Number.isNaN(startTime)
							? 'https://schema.org/EventScheduled'
							: undefined,
			location: {
				'@type': 'Place',
				...(siteInfo?.url ? { '@id': `${siteInfo.url.replace(/\/$/, '')}/#organization` } : {}),
				name: siteInfo?.name,
				address: buildPostalAddress(siteInfo?.address),
				telephone: siteInfo?.telephone,
				priceRange: siteInfo?.priceRange,
				image: siteInfo?.image,
			},
			image: images.length ? images : siteInfo?.image ? [siteInfo.image] : undefined,
			performer: addSameAs({
				'@type': ['Organization', 'LocalBusiness'],
				'@id': siteInfo?.url ? `${siteInfo.url.replace(/\/$/, '')}/#organization` : undefined,
				name: siteInfo?.name,
				url: siteInfo?.url,
			}, siteInfo?.sameAs),
			description: event.fields.description,
			url: eventUrl,
			offers: event.fields.price != null ? buildOfferSchema({
				url: eventUrl,
				price: typeof event.fields.price === 'number' ? event.fields.price.toFixed(2) : event.fields.price,
				priceCurrency: 'USD',
				availability: event.fields.maxSeats > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
				validFrom: toIsoDate(event.fields.startDate),
			}) : undefined,
			organizer: addSameAs({
				'@type': ['Organization', 'LocalBusiness'],
				'@id': siteInfo?.url ? `${siteInfo.url.replace(/\/$/, '')}/#organization` : undefined,
				name: siteInfo?.name,
				url: siteInfo?.url,
			}, siteInfo?.sameAs),
		};
	})();
	return (
		<SchemaScript schema={schema} />
	);
}







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
	IMAGE OBJECT COMPONENTS
======================================== */

export function buildImageObject(props: { siteInfo?: SiteInfo, id?: string }) {
	const { siteInfo, id } = props;
	// const siteInfoAny = siteInfo as any;

	if (!siteInfo?.image) {
		return undefined;
	}
	const imageObject: any = {
		'@type': 'ImageObject',
		url: siteInfo.image,
		contentUrl: siteInfo.image,
		name: siteInfo.name,
		creator: {
			'@type': siteInfo?.author ? 'Person' : 'Organization',
			name: siteInfo?.author || siteInfo?.name
		},
		width: parseDimension(siteInfo.image_width ?? undefined),
		height: parseDimension(siteInfo.image_height ?? undefined),
		copyrightNotice: `© ${new Date().getFullYear()} ${siteInfo.name ?? ''}. All rights reserved.`,
		creditText: `${siteInfo.name ?? ''}${siteInfo.author ? ` / ${siteInfo.author}` : ''}`,
		acquireLicensePage: siteInfo.url ? `${siteInfo.url.replace(/\/$/, '')}/contact` : undefined,
		license: siteInfo.url ? `${siteInfo.url.replace(/\/$/, '')}/terms` : undefined,
	};
	if (id) {
		imageObject['@id'] = `${siteInfo.url.replace(/\/$/, '')}/${id}`;
	}
	return imageObject;
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

export function renderArrayToParagraphs(description?: Array<string | null | undefined>): React.ReactNode {
	if (!Array.isArray(description)) {
		return null;
	}
	return description
		.filter((paragraph): paragraph is string => typeof paragraph === 'string')
		.map((paragraph, index) => (
			<p key={index}>{paragraph}</p>
		));
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
	const url = siteInfo?.url;

	if (!name || !url) { return null; }

	const telephone = siteInfo?.telephone;
	const logoImageObject = siteInfo?.image ? buildImageObject({ siteInfo, id: 'organization' }) : undefined;
	const services = siteInfo?.services || [];
	const servicePathPrefix = getServicePathPrefix(siteInfo);
	const serviceCatalogItems = services
		.filter((service): service is NonNullable<typeof service> => service != null && typeof service.name === 'string')
		.map((service) => {
			const serviceName = service.name;
			const serviceSlug = contentfulValueToSlug({ value: serviceName });
			const serviceUrl = service.url
				|| (url && serviceSlug ? `${url.replace(/\/$/, '')}${servicePathPrefix}/${serviceSlug}` : undefined);
			return buildOfferSchema({
				url: serviceUrl,
				itemOffered: {
					name: serviceName,
					description: service.description,
					url: serviceUrl,
				},
			});
		});
	const brand = siteInfo?.brand;
	const availableChannel = siteInfo?.availableChannel;
	const image = siteInfo?.image;
	const openingHours = normalizeOpeningHoursValue(siteInfo?.openingHours);
	const description = siteInfo?.description;
	const email = siteInfo?.email;
	const priceRange = siteInfo?.priceRange;
	const sameAs = siteInfo?.sameAs;
	const knowsAbout = buildKnowsAbout(siteInfo);
	const serviceAreaValues = (siteInfo?.serviceAreas || [])
		.map((area) => getWikipediaCityObject(area?.name))
		.filter((item): item is NonNullable<typeof item> => item !== null);
	const schemaData = {
		'@context': 'https://schema.org',
		'@type': ["Organization", "LocalBusiness"],
		'@id': `${url?.replace(/\/$/, '')}/#organization`,
		name,
		address: buildPostalAddress(siteInfo?.address),
		...(telephone && { telephone }),
		url,
		"creator": pixelatedTechOrganizationSchema ,
		"provider": pixelatedTechOrganizationSchema,
		...(logoImageObject && { logo: logoImageObject }),
		...(brand && { brand }),
		...(availableChannel && { availableChannel }),
		...(serviceCatalogItems.length > 0 && {
			hasOfferCatalog: {
				'@type': 'OfferCatalog',
				name: 'Services',
				itemListElement: serviceCatalogItems,
			}
		}),
		...(knowsAbout && { knowsAbout }),
		...(serviceAreaValues.length > 0 && { areaServed: serviceAreaValues }),
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
	OFFER SCHEMA COMPONENTS
======================================== */

interface OfferSchemaInput {
  url?: string;
  offerURL?: string;
  offerUrl?: string;
  price?: string | number;
  priceCurrency?: string;
  availability?: string;
  validFrom?: string;
  itemOffered?: any;
}

function buildOfferSchema(input: OfferSchemaInput): any | undefined {
	const url = sanitizeString(input?.url ?? input?.offerURL ?? input?.offerUrl);
	const itemOfferedRaw = input?.itemOffered;
	let itemOffered: any | undefined;
	if (itemOfferedRaw && typeof itemOfferedRaw === 'object') {
		const name = sanitizeString(itemOfferedRaw.name);
		if (name) {
			itemOffered = {
				'@type': 'Service',
				name,
				...(itemOfferedRaw.description && { description: formatServiceDescription(itemOfferedRaw.description) }),
				...(itemOfferedRaw.url && { url: sanitizeString(itemOfferedRaw.url) }),
				...(itemOfferedRaw.serviceType && { serviceType: sanitizeString(itemOfferedRaw.serviceType) }),
				...(itemOfferedRaw.category && { category: sanitizeString(itemOfferedRaw.category) }),
			};
		}
	}
	if (!url && !itemOffered) {
		return undefined;
	}
	const price = input?.price != null ? sanitizeString(input.price) : undefined;
	const priceCurrency = sanitizeString(input?.priceCurrency) || (price ? 'USD' : undefined);
	const availability = sanitizeString(input?.availability) || (url ? 'https://schema.org/InStock' : undefined);
	const validFrom = sanitizeString(input?.validFrom);
	return {
		'@type': 'Offer',
		...(url && { url }),
		...(price && { price }),
		...(priceCurrency && { priceCurrency }),
		...(availability && { availability }),
		...(validFrom && { validFrom }),
		...(itemOffered && { itemOffered }),
	};
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
	POSTAL ADDRESS SCHEMA COMPONENTS
======================================== */

function buildPostalAddress(address: any): any | undefined {
	if (!address || typeof address !== 'object') {
		return undefined;
	}
	const streetAddress = sanitizeString(address.streetAddress);
	const addressLocality = sanitizeString(address.addressLocality);
	const addressRegion = sanitizeString(address.addressRegion);
	const postalCode = sanitizeString(address.postalCode);
	const addressCountry = sanitizeString(address.addressCountry) || "United States";
	return Object.keys({ streetAddress, addressLocality, addressRegion, postalCode, addressCountry })
		.filter((key) => Boolean(({
			streetAddress,
			addressLocality,
			addressRegion,
			postalCode,
			addressCountry,
		} as any)[key]))
		.length > 0 ? {
			'@type': 'PostalAddress',
			...(streetAddress && { streetAddress }),
			...(addressLocality && { addressLocality }),
			...(addressRegion && { addressRegion }),
			...(postalCode && { postalCode }),
			...(addressCountry && { addressCountry }),
		} : undefined;
}






/* ========================================
	PRODUCT SCHEMA COMPONENTS
======================================== */

/**
 * ProductSchema — embeds a product as JSON-LD for SEO (schema.org/Product).
 *
 * @param {shape} [props.product] - Raw product fields for a schema.org/Product object.
 *   Fields like name, description, sku, mpn, gtin, color, model, sameAs, brand, offers,
 *   aggregateRating, and review are passed through into the generated schema.
 * @param {string} [props.product.name] - The product name.
 * @param {string} [props.product.description] - Product description.
 */
ProductSchema.propTypes = {
	/** Product information object to be serialized as JSON-LD. */
	product: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		image: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
		brand: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				name: PropTypes.string.isRequired,
				sameAs: PropTypes.arrayOf(PropTypes.string),
			}),
		]),
		offers: PropTypes.oneOfType([
			PropTypes.shape({
				url: PropTypes.string,
				priceCurrency: PropTypes.string,
				price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
				availability: PropTypes.string,
				validFrom: PropTypes.string,
				itemOffered: PropTypes.any,
			}),
			PropTypes.arrayOf(
				PropTypes.shape({
					url: PropTypes.string,
					priceCurrency: PropTypes.string,
					price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
					availability: PropTypes.string,
					validFrom: PropTypes.string,
					itemOffered: PropTypes.any,
				})
			)
		]),
		review: PropTypes.arrayOf(PropTypes.object),
		aggregateRating: PropTypes.shape({
			ratingValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			reviewCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			ratingCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			bestRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			worstRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
		sku: PropTypes.string,
		mpn: PropTypes.string,
		gtin: PropTypes.string,
		color: PropTypes.string,
		model: PropTypes.string,
		shippingDetails: PropTypes.shape({
			isShippable: PropTypes.bool,
			weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			weightUnit: PropTypes.string,
		}),
		hasMerchantReturnPolicy: PropTypes.string,
		sameAs: PropTypes.arrayOf(PropTypes.string),
	}).isRequired,
};
export type ProductSchemaType = InferProps<typeof ProductSchema.propTypes>;
export function ProductSchema(props: ProductSchemaType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const sameAs = siteInfo?.sameAs;
	const { product } = props;
	const {
		'@context': _context,
		'@type': _type,
		shippingDetails: productShippingDetails,
		hasMerchantReturnPolicy: productHasMerchantReturnPolicyRaw,
		...productData
	} = product as Record<string, any>;
	const productHasMerchantReturnPolicy = productHasMerchantReturnPolicyRaw || getPolicyRouteUrl(config?.routes, siteInfo);
	const brand = productData.brand
		? addSameAs(
			typeof productData.brand === 'string'
				? { '@type': 'Brand', name: sanitizeString(productData.brand) }
				: { '@type': 'Brand', ...productData.brand, name: sanitizeString(productData.brand.name) },
			sameAs
		)
		: siteInfo?.name
			? addSameAs(
				{ '@type': 'Brand', name: sanitizeString(siteInfo.name) },
				sameAs
			)
			: undefined;
	const mergeOfferFields = (offer: any) => {
		if (!offer || typeof offer !== 'object') {
			return offer;
		}
		return {
			'@type': offer['@type'] || 'Offer',
			...offer,
			...(offer.shippingDetails == null && productShippingDetails ? { shippingDetails: productShippingDetails } : {}),
			...(offer.hasMerchantReturnPolicy == null && productHasMerchantReturnPolicy ? { hasMerchantReturnPolicy: productHasMerchantReturnPolicy } : {}),
		};
	};

	const offers = (() => {
		if (productData.offers == null) {
			return undefined;
		}
		if (Array.isArray(productData.offers)) {
			return productData.offers.map(mergeOfferFields);
		}
		if (typeof productData.offers === 'object') {
			return mergeOfferFields(productData.offers);
		}
		return productData.offers;
	})();
	const aggregateRating = productData.aggregateRating
		? {
			'@type': 'AggregateRating',
			...productData.aggregateRating,
			bestRating: productData.aggregateRating?.bestRating ?? '5',
			worstRating: productData.aggregateRating?.worstRating ?? '1',
			...(productData.aggregateRating?.reviewCount != null && productData.aggregateRating?.ratingCount == null ? { ratingCount: productData.aggregateRating.reviewCount } : {}),
		}
		: undefined;
	const review = Array.isArray(productData.review) && productData.review.length > 0 ? productData.review : undefined;
	const schema = {
		...productData,
		'@context': 'https://schema.org',
		'@type': 'Product',
		...(brand && { brand }),
		...(offers && { offers }),
		...(aggregateRating ? { aggregateRating } : {}),
		...(review ? { review } : {}),
	};
	return (
		<SchemaScript schema={schema} />
	);
}







/* ========================================
	PUBLISHER SCHEMA COMPONENTS
======================================== */

function buildPublisher(siteInfo?: SiteInfo): any | undefined {
	if (siteInfo) {
		const url = sanitizeString(siteInfo.url);
		const name = sanitizeString(siteInfo.name ?? siteInfo?.author);
		const logo = siteInfo.image ? buildImageObject({ siteInfo, id: 'organization' }) : undefined;
		const sameAs = Array.isArray(siteInfo.sameAs) && siteInfo.sameAs.length > 0 ? siteInfo.sameAs : undefined;
		const knowsAbout = buildKnowsAbout(siteInfo);
		const address = buildPostalAddress(siteInfo?.address);
		const publisher = {
			'@type': ['Organization', 'LocalBusiness'],
			...(url && { '@id': `${url.replace(/\/$/, '')}/#organization` }),
			...(name && { name }),
			...(url && { url }),
			...(logo && { logo }),
			...(siteInfo?.image && { image: sanitizeString(siteInfo.image) }),
			...(siteInfo?.telephone && { telephone: sanitizeString(siteInfo.telephone) }),
			...(siteInfo?.priceRange && { priceRange: sanitizeString(siteInfo.priceRange) }),
			...(address && { address }),
			...(sameAs && { sameAs }),
			...(knowsAbout && { knowsAbout }),
		};
		return Object.keys(publisher).length > 1 ? publisher : undefined;
	} else {
		return undefined;
	}
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
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const sameAs = siteInfo?.sameAs;
	const { recipe } = props;
	const publisher = addSameAs(buildPublisher(siteInfo), sameAs);
	const schema = {
		...recipe,
		author: addSameAs((recipe as any)?.author, sameAs),
		...(publisher && { publisher }),
	};
	return (
		<SchemaScript schema={schema} />
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
			sameAs: PropTypes.arrayOf(PropTypes.string),
		}),
	}).isRequired,
};
export type ReviewSchemaType = InferProps<typeof ReviewSchema.propTypes>;
export function ReviewSchema(props: ReviewSchemaType) {
	const config = usePixelatedConfig();
	const sameAs = config?.siteInfo?.sameAs;
	const { review } = props;
	const schema = sameAs?.length ? {
		...review,
		author: addSameAs((review as any)?.author, sameAs),
		publisher: addSameAs((review as any)?.publisher, sameAs),
	} : review;
	return (
		<SchemaScript schema={schema} />
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
	const pathname = usePathname() ?? '';
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const servicePathPrefix = getServicePathPrefix(siteInfo);
	const normalizedPathname = pathname.replace(/\/$/, '');
	const servicePageRegex = servicePathPrefix
		? new RegExp(`^${servicePathPrefix.replace(/\//g, '\\/')}/([^/]+)$`)
		: /^\/([^/]+)$/;
	const servicePageMatch = normalizedPathname.match(servicePageRegex);
	const pageServiceSlug = servicePageMatch?.[1];
	const activeService = pageServiceSlug ? findServiceBySlug(pageServiceSlug, siteInfo) : undefined;
	const services = activeService ? [activeService as ServiceSchemaType] : siteInfo?.services || [];
	const provider = {
		name: siteInfo?.name || '',
		id: siteInfo?.url ? `${siteInfo.url.replace(/\/$/, '')}/#organization` : undefined,
		url: siteInfo?.url || '',
		logo: siteInfo?.image ? buildImageObject({ siteInfo, id: 'organization' }) : undefined,
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

	const serviceObjects = services.filter((service): service is NonNullable<typeof service> => service != null).map((service) => {
		const serviceSlug = contentfulValueToSlug({ value: service.name });
		const computedServiceUrl = baseUrl && serviceSlug ? `${baseUrl}${servicePathPrefix}/${serviceSlug}` : undefined;
		const serviceType = service.serviceType || service.name;
		const serviceOutput = service.serviceOutput || `High-performance ${service.name.toLowerCase()} optimized for business growth and measurable results.`;
		const category = service.category || service.name;
		const audience = service.audience || sharedAudience;
		const offers = service.offers || sharedOffers || buildOfferSchema({
			url: computedServiceUrl,
			itemOffered: {
				name: service.name,
				description: service.description,
				url: computedServiceUrl,
				serviceType,
				category,
			},
		});
		const termsOfService = service.termsOfService || sharedTermsOfService;

		return {
			'@type': 'Service',
			name: service.name,
			description: formatServiceDescription(service.description),
			...(computedServiceUrl && { url: computedServiceUrl }),
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
			provider: {
				'@type': 'LocalBusiness',
				'@id': provider.id,
				name: provider.name,
				url: provider.url,
				...(provider.logo && { logo: provider.logo }),
				...(provider.telephone && { telephone: provider.telephone }),
				...(provider.email && { email: provider.email }),
				...(provider.address && { address: buildPostalAddress(provider.address) }),
				...(siteInfo?.brand && { brand: siteInfo.brand }),
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
	VIDEO SCHEMA COMPONENTS
======================================== */


export interface VideoObjectSchemaInput {
	contentUrl?: string | null;
	title?: string | null;
	name?: string | null;
	description?: string | null;
	poster?: string | null;
	thumbnailUrl?: string | null;
	width?: string | number | null;
	height?: string | number | null;
	uploadDate?: string | null;
	duration?: string | null;
	captionsSrc?: string | null;
	caption?: string | null;
}

export function buildVideoObjectSchema(props: VideoObjectSchemaInput) {
	const contentUrl = normalizeProtocolRelativeUrl(safeString(props.contentUrl) || '');
	const thumbnailUrl = normalizeProtocolRelativeUrl(safeString(props.thumbnailUrl ?? props.poster) || '');
	const name = sanitizeString(props.title ?? props.name);
	const description = sanitizeString(props.description);
	const uploadDate = sanitizeString(props.uploadDate);
	const duration = sanitizeString(props.duration);
	const caption = sanitizeString(props.caption ?? props.captionsSrc);
	const width = parseNumber(props.width ?? undefined);
	const height = parseNumber(props.height ?? undefined);
	return {
		'@context': 'https://schema.org',
		'@type': 'VideoObject',
		'@id': contentUrl ? `${contentUrl}#video` : undefined,
		...(name && { name }),
		...(description && { description }),
		...(contentUrl && { contentUrl }),
		...(thumbnailUrl && { thumbnailUrl }),
		...(width ? { width } : {}),
		...(height ? { height } : {}),
		...(uploadDate && { uploadDate }),
		...(duration && { duration }),
		...(caption && { caption }),
	};
}

/**
 * SchemaVideoObject — Inject a JSON-LD <script> tag containing a VideoObject schema object.
 *
 * @param {object} [props] - Structured JSON-LD object representing a video (VideoObject schema).
 * @returns {JSX.Element} - A <SchemaScript> component containing the VideoObject schema.
 * 
 */
SchemaVideoObject.propTypes = {
	contentUrl: PropTypes.string,
	title: PropTypes.string,
	name: PropTypes.string,
	description: PropTypes.string,
	thumbnailUrl: PropTypes.string,
	uploadDate: PropTypes.string,
	duration: PropTypes.string,
	caption: PropTypes.string,
};
export type SchemaVideoObjectType = InferProps<typeof SchemaVideoObject.propTypes>;
export function SchemaVideoObject(props: SchemaVideoObjectType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const publisher = buildPublisher(siteInfo);
	const baseSchema = buildVideoObjectSchema({
		contentUrl: props.contentUrl,
		title: props.title,
		name: props.name,
		description: props.description,
		thumbnailUrl: props.thumbnailUrl,
		uploadDate: props.uploadDate,
		duration: props.duration,
		caption: props.caption,
	});
	const schema = {
		...baseSchema,
		...(publisher && { publisher }),
	};

	return <SchemaScript schema={schema} />;
}









/* ========================================
	WEBPAGE SCHEMA COMPONENTS
======================================== */

/* The server-only webpage schema implementation lives in schema.server.tsx. */





export async function fetchGoogleReviewsFromConfig(config: any, maxReviews = 5): Promise<GoogleReview[]> {
	const placeId = config?.integrations?.googlePlaces?.placeId;
	const apiKey = config?.integrations?.googlePlaces?.apiKey;
	const language = config?.integrations?.googlePlaces?.language;
	const proxyBase = config?.integrations?.global?.proxyUrl || undefined;

	if (!placeId || !apiKey) {
		return [];
	}

	try {
		const result = await getGoogleReviewsByPlaceId({
			apiKey,
			placeId,
			proxyBase,
			language: language ?? undefined,
			maxReviews,
		});
		return Array.isArray(result.reviews) ? result.reviews : [];
	} catch {
		return [];
	}
}

export function buildGoogleReviewSchemas(googleReviews: GoogleReview[], provider: { name: string; url?: string }) {
	return googleReviews.map((review) => ({
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
}

export function buildGoogleAggregateRating(googleReviews: GoogleReview[]) {
	if (!googleReviews.length) {
		return undefined;
	}

	return {
		'@type': 'AggregateRating',
		ratingValue: (
			googleReviews.reduce((sum, review) => sum + review.rating, 0) / googleReviews.length
		).toFixed(1),
		reviewCount: googleReviews.length.toString(),
		ratingCount: googleReviews.length.toString(),
		bestRating: '5',
		worstRating: '1',
	};
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
	let potentialAction: any;
	const potentialActionTarget = siteInfo?.potentialAction;
	if (potentialActionTarget?.target) {
		const queryInput = potentialActionTarget['query-input'] ?? potentialActionTarget.queryInput;
		potentialAction = {
			'@type': potentialActionTarget['@type'] ?? 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: potentialActionTarget.target,
			},
			...(queryInput && { 'query-input': queryInput }),
		};
	}
	const copyrightYear = siteInfo?.copyrightYear;
	const publisher = buildPublisher(siteInfo);
	const copyrightHolder = publisher;
	const address = buildPostalAddress(siteInfo?.address);

	const schemaData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${url.replace(/\/$/, '')}/#website`,
		name,
		url,
		...(description && { description }),
		...(keywords && { keywords }),
		...(siteInfo?.telephone && { telephone: sanitizeString(siteInfo.telephone) }),
		...(siteInfo?.priceRange && { priceRange: sanitizeString(siteInfo.priceRange) }),
		...(address && { address }),
		...(siteInfo?.image && { image: sanitizeString(siteInfo.image) }),
		...(inLanguage && { inLanguage }),
		...(sameAs && sameAs.length ? { sameAs } : {}),
		creator: pixelatedTechOrganizationSchema,
		...(publisher && { publisher }),
		...(potentialAction && { potentialAction }),
		...(copyrightYear != null && { copyrightYear }),
		...(copyrightHolder && { copyrightHolder })
	};

	return (
		<SchemaScript schema={schemaData} />
	);
}

function buildKnowsAbout(siteInfo?: SiteInfo) {
	if (!siteInfo?.services || !Array.isArray(siteInfo.services)) {
		return undefined;
	}
	const knowsAbout = siteInfo.services
		.map((service) => typeof service?.name === 'string' ? service.name.trim() : '')
		.filter((value): value is string => Boolean(value));
	return knowsAbout.length ? Array.from(new Set(knowsAbout)) : undefined;
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

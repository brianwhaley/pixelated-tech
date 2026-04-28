import type { NextRequest } from 'next/server';
import PropTypes, { InferProps } from "prop-types";
import { getFullPixelatedConfig } from "../config/config";
import { CacheManager } from "../foundation/cache-manager";
import { getDomain } from "../foundation/utilities";
import { smartFetch } from "../foundation/smartfetch";
import { buildUrl } from "../foundation/urlbuilder";

const debug = false;

function encodeBase64(value: string) {
	if (typeof btoa === 'function') {
		return btoa(value);
	}
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(value, 'utf-8').toString('base64');
	}
	throw new Error('No base64 encoder available');
}

export type EbayApiType = {
    proxyURL: string;
    baseTokenURL: string;
    tokenScope: string;
    baseSearchURL: string;
    qsSearchURL: string;
    baseItemURL: string;
    qsItemURL: string;
    baseAnalyticsURL: string;
    appId: string;
    appCertId: string;
    globalId: string;
    itemCategory?: string;
};


const ebayCache = new CacheManager({
	mode: 'session',
	domain: getDomain(),
	namespace: 'ebay',
	ttl: 60 * 60 * 1000,
});



/**
 * getMergedEbayConfig — Helper function to merge provided API props with defaults and config values.
 * 
 * @param providedApiProps - API properties provided by the caller.
 * @returns Merged eBay API configuration.
 */
getMergedEbayConfig.propTypes = {
	apiProps: PropTypes.object.isRequired,
};
export type getMergedEbayConfigType = InferProps<typeof getMergedEbayConfig.propTypes>;
export function getMergedEbayConfig(providedApiProps: any): EbayApiType {
	let apiProps = {
		proxyURL: '',
		baseTokenURL: '',
		baseSearchURL: '',
		qsSearchURL: '',
		baseItemURL: '',
		qsItemURL: '',
		baseAnalyticsURL: '',
		...providedApiProps,
	};

	try {
		const config = getFullPixelatedConfig();
		if (config) {
			apiProps = {
				proxyURL: config.global?.proxyUrl || '',
				...apiProps,
				...(config.ebay || {}),
				...providedApiProps,
			};
		}
	} catch (e) {
		// Fail-silent, use provided props
	}

	return apiProps as EbayApiType;
}



/**
 * getEbayAppToken — PropType definitions for fetching an eBay application token.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to fetch the token.
 */
getEbayAppToken.propTypes = {
	apiProps: PropTypes.object.isRequired,
};
export type getEbayAppTokenType = InferProps<typeof getEbayAppToken.propTypes>;
export function getEbayAppToken(props: getEbayAppTokenType) {
	const apiProps = getMergedEbayConfig(props.apiProps);

	const fetchToken = async () => {
		if (debug) console.log("Fetching Token");
		try {
			const data = await smartFetch(apiProps.baseTokenURL, {
				proxy: apiProps.proxyURL
					? {
						url: apiProps.proxyURL,
						forceProxy: true,
						fallbackOnCors: true,
					}
					: undefined,
				requestInit: {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': 'Basic ' + encodeBase64(`${apiProps.appId}:${apiProps.appCertId}`),
					},
					body: new URLSearchParams({
						grant_type: 'client_credentials',
						scope: apiProps.tokenScope,
					}),
				},
			});
			const accessToken = data.access_token;
			if (debug) console.log("Fetched eBay Access Token:", accessToken);
			return accessToken;
		} catch (error) {
			console.error('Error fetching token:', error);
		}
	};
	return fetchToken();
}





/**
 * getEbayBrowseSearch — PropType definitions for the eBay browse search helper.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to perform the search.
 * @param {string} props.token - eBay application token for authentication.
 */
getEbayBrowseSearch.propTypes = {
	apiProps: PropTypes.object.isRequired,
	token: PropTypes.string.isRequired,
};
export type getEbayBrowseSearchType = InferProps<typeof getEbayBrowseSearch.propTypes>;
export function getEbayBrowseSearch(props: getEbayBrowseSearchType) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	const fetchData = async (token: string) => {
		const fullURL = apiProps.baseSearchURL + apiProps.qsSearchURL;
		const cacheKey = `search_${fullURL}`;

		const cached = ebayCache.get(cacheKey);
		if (cached) {
			if (debug) console.log("Returning cached eBay Search Data", cacheKey);
			return cached;
		}

		if (debug) console.log("Fetching ebay API Browse Search Data");
		try {
			const data = await smartFetch(
				buildUrl({
					baseUrl: fullURL,
					proxyUrl: apiProps.proxyURL,
				}), {
					requestInit: {
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + token,
							'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
							'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>',
							'X-EBAY-SOA-SECURITY-APPNAME': 'BrianWha-Pixelate-PRD-1fb4458de-1a8431fe',
						}
					}
				});
			if (debug) console.log("Fetched eBay API Browse Search Data:", data);
			ebayCache.set(cacheKey, data);
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};
	return fetchData(props.token);
}



/**
 * getEbayBrowseItem — PropType definitions for the eBay browse item helper.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to fetch the item details.
 * @param {string} props.token - eBay API access token required for authentication.
 */
getEbayBrowseItem.propTypes = {
	apiProps: PropTypes.object.isRequired,
	token: PropTypes.string.isRequired,
};
export type getEbayBrowseItemType = InferProps<typeof getEbayBrowseItem.propTypes>;
export function getEbayBrowseItem(props: getEbayBrowseItemType) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	const fetchData = async (token: string) => {
		const fullURL = (apiProps.baseItemURL ?? '') + (apiProps.qsItemURL ?? '');
		const cacheKey = `item_${fullURL}`;

		const cached = ebayCache.get(cacheKey);
		if (cached) {
			if (debug) console.log("Returning cached eBay Item Data", cacheKey);
			return cached;
		}

		if (debug) console.log("Fetching ebay API Browse Item Data");
		try {
			const data = await smartFetch(
				buildUrl({
					baseUrl: fullURL,
					proxyUrl: apiProps.proxyURL,
				}), {
					requestInit: {
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + token,
							'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
							'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>',
							'X-EBAY-SOA-SECURITY-APPNAME': 'BrianWha-Pixelate-PRD-1fb4458de-1a8431fe',
						}
					}
				});
			if (debug) console.log("Fetched eBay Item Data:", data);
			ebayCache.set(cacheKey, data);
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};
	return fetchData(props.token);
}



/**
 * getEbayRateLimits — PropType definitions for the eBay rate limit helper.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to fetch rate limit information.
 * @param {string} props.token - eBay API access token required for authentication.
 */
getEbayRateLimits.propTypes = {
	apiProps: PropTypes.object.isRequired,
	token: PropTypes.string.isRequired,
};
export type getEbayRateLimitsType = InferProps<typeof getEbayRateLimits.propTypes>;
export function getEbayRateLimits(props: getEbayRateLimitsType) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	const fetchAllLimits = async (token: string) => {
		if (debug) console.log("Fetching all eBay API Rate Limits");
		try {
			const rateLimitUrl = buildUrl({
				baseUrl: apiProps.baseAnalyticsURL,
				pathSegments: ['rate_limit'],
				proxyUrl: apiProps.proxyURL,
			});
			const userRateLimitUrl = buildUrl({
				baseUrl: apiProps.baseAnalyticsURL,
				pathSegments: ['user_rate_limit'],
				proxyUrl: apiProps.proxyURL,
			});
			const [rateLimitRes, userRateLimitRes] = await Promise.all([
				smartFetch(rateLimitUrl, {
					responseType: 'ok',
					requestInit: {
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + token,
						},
					},
				}),
				smartFetch(userRateLimitUrl, {
					responseType: 'ok',
					requestInit: {
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + token,
						},
					},
				}),
			]);
			if (!rateLimitRes.ok || !userRateLimitRes.ok) {
				throw new Error(`HTTP error! rate_limit: ${rateLimitRes.status}, user_rate_limit: ${userRateLimitRes.status}`);
			}
			const [rateLimit, userRateLimit] = await Promise.all([
				rateLimitRes.json(),
				userRateLimitRes.json(),
			]);
			const combinedData = {
				rate_limit: rateLimit,
				user_rate_limit: userRateLimit,
			};
			if (debug) console.log("Fetched Combined eBay Rate Limit Data:", combinedData);
			return combinedData;
		} catch (error) {
			console.error('Error fetching rate limits:', error);
		}
	};
	return fetchAllLimits(props.token);
}



/**
 * getEbayItems — PropType definitions for the eBay items list helper.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to fetch the items list.
 * @param {string} props.token - eBay API access token required for authentication.
 */
getEbayItems.propTypes = {
	apiProps: PropTypes.object.isRequired,
};
export type getEbayItemsType = InferProps<typeof getEbayItems.propTypes>;
export async function getEbayItems(props: getEbayItemsType) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	try {
		const response = await getEbayAppToken({ apiProps: apiProps });
		if (!response) {
			console.error('Unable to fetch eBay app token; aborting eBay item search.');
			return {};
		}
		if (debug) console.log("eBay App Token Response:", response);
		const data = await getEbayBrowseSearch({ apiProps: apiProps, token: response });
		if (debug) console.log("eBay Browse Search Data:", data);
		return data;
	} catch (error) {
		console.error("Failed to fetch eBay Items:", error);
	}
	return {};
}





/**
 * getEbayItem — PropType definitions for the eBay single item helper.
 * 
 * @param {object} props.apiProps - eBay API configuration properties required to fetch the item details.
 */
getEbayItem.propTypes = {
	apiProps: PropTypes.object.isRequired,
};
export type getEbayItemType = InferProps<typeof getEbayItem.propTypes>;
export async function getEbayItem(props: getEbayItemType) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	try {
		const response = await getEbayAppToken({ apiProps: apiProps });
		if (!response) {
			console.error('Unable to fetch eBay app token; aborting eBay item details fetch.');
			return {};
		}
		if (debug) console.log("eBay App Token Response:", response);
		const data = await getEbayBrowseItem({ apiProps: apiProps, token: response });
		if (debug) console.log("eBay Browse Item Data:", data);
		return data;
	} catch (error) {
		console.error("Failed to fetch eBay Items:", error);
	}
	return {};
}





export function getEbayItemsSearch(props: any) {
	const apiProps = getMergedEbayConfig(props.apiProps);
	const fetchData = async (token: string) => {
		const fullURL = apiProps.baseSearchURL + apiProps.qsSearchURL;
		const cacheKey = `search_${fullURL}`;

		const cached = ebayCache.get(cacheKey);
		if (cached) {
			if (debug) console.log("Returning cached eBay Search Data", cacheKey);
			return cached;
		}

		if (debug) console.log("Fetching ebay API Items Search Data");
		try {
			const data = await smartFetch(apiProps.proxyURL + encodeURIComponent(fullURL), {
				requestInit: {
					method: 'GET',
					headers: {
						'Authorization': 'Bearer ' + token,
						'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
						'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>',
						'X-EBAY-SOA-SECURITY-APPNAME': 'BrianWha-Pixelate-PRD-1fb4458de-1a8431fe',
					},
				},
			});
			ebayCache.set(cacheKey, data);
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};
	return fetchData(props.token);
}






getEbayProductSchema.propTypes = {
	item: PropTypes.object.isRequired,
	brandName: PropTypes.string,
	siteUrl: PropTypes.string,
};
export type getEbayProductSchemaType = InferProps<typeof getEbayProductSchema.propTypes>;
export function getEbayProductSchema(props: getEbayProductSchemaType) {
	const item: any = props.item;
	const brandName = props.brandName || 'eBay';
	const siteUrl = props.siteUrl || item.itemWebUrl || '';

	if (!item || !item.title || !item.price) {
		return null;
	}

	const primaryImage = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '';
	const images: string[] = [];
	if (primaryImage) images.push(primaryImage);
	if (Array.isArray(item.thumbnailImages)) {
		for (const thumbnail of item.thumbnailImages) {
			if (thumbnail?.imageUrl && !images.includes(thumbnail.imageUrl)) {
				images.push(thumbnail.imageUrl);
			}
		}
	}
	if (Array.isArray(item.additionalImages)) {
		for (const extra of item.additionalImages) {
			if (extra?.imageUrl && !images.includes(extra.imageUrl)) {
				images.push(extra.imageUrl);
			}
		}
	}

	const priceValue = item.price?.value ?? item.price?.__value__ ?? item.buyingOptions?.[0]?.price?.value ?? '';
	const currency = item.price?.currency || item.price?.currencyCode || 'USD';

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		'name': item.title,
		'image': images,
		'description': item.description || '',
		'sku': item.legacyItemId || item.itemId || '',
		'brand': {
			'@type': 'Brand',
			'name': brandName,
		},
		'offers': {
			'@type': 'Offer',
			'url': siteUrl,
			'priceCurrency': currency,
			'price': priceValue,
			'availability': 'https://schema.org/InStock',
			'itemCondition': item.condition ? `https://schema.org/${item.condition.replace(/\s+/g, '')}` : 'https://schema.org/NewCondition',
		},
	};
}

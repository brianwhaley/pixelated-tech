// Shared test data barrel for the package.
// This file aggregates raw JSON data files from src/test/data
// and shared test config files used across src/tests/*. 
//
// NOT for:
// - test helpers, test functions, or render wrappers (use src/test/test-utils.tsx)
// - arbitrary application logic
// - storing one-off test data that belongs directly in a specific test file
// - direct, raw JSON data or JSON configuration objects
//
// Data files owned by this barrel:
// - src/test/data/*.json for raw fixture payloads and API response bodies
// - src/test/fixtures.ts for derived or reusable fixture objects
// 
// Use src/test/test-utils.tsx for shared helper functions
// 
// if you need raw request or response data for a test, add it as a JSON file in src/test/data 
// and import / export it here
// IF YOU NEED SPECIFIC CUSTOM DATA FOR A TEST SCENARIO, IE A FAILING TEST FOR ONE FIELD CHANGE
// YOU SHOULD IMPORT THE DATA FROM OBJECTS IN test-data.ts AND THEN MODIFY THAT OBJECT IN YOUR TEST FILE
// IF YOU NEED SPECIFIC CUSTOM CONFIG DATA FOR A TEST SCENARIO, IE A FAILING TEST FOR ONE FIELD CHANGE
// YOU SHOULD IMPORT THE DATA FROM OBJECTS IN test-data.ts AND THEN MODIFY THAT OBJECT IN YOUR TEST FILE
// if you need snapshot test data, it should be placed into a json file and imported here
// large binary or encoded payloads should be placed into files in /data and imported here
// if you need dynamic data you should use existing functions provided by the component library to derive them, do not create new ones. 



import recipes from '@/data/recipes.json';
import resume from '@/data/resume.json';
import faqTestData from './data/faq-test-data.json';
import mockGoogleDateRangesJson from './data/mock-google-date-ranges.json';
import ebayData from './data/ebay-data.json';
import pageEngineData from './data/page-engine-data.json';
import paypalOrder from './data/paypal-order.json';
import squareOrderCheckoutData from './data/square-order-checkout-data.json';
import siteHealthData from './data/site-health-data.json';
import sitemapData from './data/sitemap-data.json';
import realWordPressApiData from './data/real-wordpress-api.json';
import wordpressFunctionsData from './data/wordpress-functions-data.json';
import siteImagesData from './data/site-images.json';
import realContentfulAssetsData from './data/real-contentful-assets.json';
import googlePsiExampleCom from './data/google-psi-example-com.json';
import squareCatalogResponseWithRelatedObjects from './data/square-catalog-response-with-related-objects.json';
import { POST } from './data/save-route-example';
import squareCatalogResponseNoRelatedObjects from './data/square-catalog-response-no-related-objects.json';
import squareCatalogResponseNestedVariation from './data/square-catalog-response-nested-variation.json';
import squareCatalogResponseById from './data/square-catalog-response-by-id.json';
import squareEventCatalogObjects from './data/square-event-catalog-objects.json';
import squareLargeStoreItems from './data/square-large-store-items.json';
import mockSitesConfig from './data/mock-sites-config.json';
import mockSpotifyRss from './data/spotify-rss-mocks.json';

import mockTileCards from './data/mock-tile-cards.json';
import mockCarouselCards from './data/mock-carousel-cards.json';
import mockPlaceReviews from './data/mock-place-reviews.json';
import mockContentfulItem from './data/mock-contentful-item.json';
import mockSitemapConfigs from './data/mock-sitemap-configs.json';
import mockSitemapItemsData from './data/mock-sitemap-items-data.json';
import mockGoogleApiResponses from './data/mock-google-api-responses.json';
import mockGooglePlacesPredictions from './data/google-places-predictions.json';
import mockGooglePlacesDetails from './data/google-places-details.json';
import mockWordPressPosts from './data/mock-wordpress-posts.json';
import mockContentfulItems from './data/mock-contentful-items.json';
import mockContentfulAssets from './data/mock-contentful-assets.json';
import mockContentfulImageAssets from './data/mock-contentful-image-assets.json';
import mockContentfulTestProps from './data/mock-contentful-test-props.json';
import contentfulItemsDetail from './data/contentful-items.json';
import mockOrderCheckoutDataJson from './data/mock-order-checkout-data.json';
import paypalCheckoutData from './data/paypal-checkout-data.json';
import ebayApiResponse from './data/ebay-api-response.json';
import mockEbayItem from './data/mock-ebay-item.json';
import ebayListings from './data/ebay-listings.json';
import mockGoogleAuth from './data/mock-google-auth.json';
import mockInstagramMedia from './data/mock-instagram-media.json';
import mockGoogleSearchConsoleData from './data/google-search-console.json';
import mockGoogleAnalyticsData from './data/mock-google-analytics-data.json';
import mockAxeCoreResponse from './data/mock-axe-core-response.json';
import mockCloudwatchData from './data/mock-cloudwatch-data.json';
import formDefinition from './data/form-definition.json';
import checkoutPersonalInfo from '../components/shoppingcart/checkout.personal.info.json';
import checkoutDiscountInfo from '../components/shoppingcart/checkout.discount.info.json';
import uspsGenericShippingInfo from '../components/shoppingcart/usps.generic.shipping.info.json';
import pixelatedConfigJson from '@/config/pixelated.config.json';
import pkg from '../../package.json';
import { buzzwords as buzzwordBingoWords } from '@/components/elements/buzzwordbingo.words';
import visualdesignformJson from '@/components/sitebuilder/config/visualdesignform.json';
import type { PixelatedConfig, ContentfulConfig, EbayConfig, SiteInfoType } from '../components/config/config.types';
import { processPSIData } from '../components/admin/site-health/site-health-core-web-vitals.integration';

// --- MOCK CONFIG DATA ---
export const pixelatedConfig = pixelatedConfigJson as PixelatedConfig;
export const packageJson = pkg as any;
export const pixelatedConfigEmpty = {} as PixelatedConfig;
export const mockCloudinary = pixelatedConfig.integrations?.cloudinary;
export const mockUspsConfig = pixelatedConfig.integrations?.usps;
export const mockSquareConfig = pixelatedConfig.integrations?.square;
export const mockGoogleAnalyticsConfig = pixelatedConfig.integrations?.google?.analytics;
export const mockEbayApiProps = pixelatedConfig.integrations?.ebay as any;

// --- TEST FIXTURES ---
export {
	faqTestData,
	recipes,
	resume,
	mockGoogleDateRangesJson,
	ebayData,
	pageEngineData,
	paypalOrder,
	squareOrderCheckoutData,
	siteHealthData,
	sitemapData,
	realWordPressApiData,
	wordpressFunctionsData,
	siteImagesData,
	realContentfulAssetsData,
	googlePsiExampleCom,
	squareCatalogResponseWithRelatedObjects,
	squareCatalogResponseNoRelatedObjects,
	squareCatalogResponseNestedVariation,
	squareCatalogResponseById,
	squareEventCatalogObjects,
	squareLargeStoreItems,
	mockSitesConfig,
	mockSpotifyRss,
	mockTileCards,
	mockCarouselCards,
	mockSitemapConfigs,
	mockSitemapItemsData,
	mockGoogleApiResponses,
	mockWordPressPosts,
	mockContentfulItems,
	mockContentfulAssets,
	mockContentfulImageAssets,
	mockPlaceReviews,
	mockGooglePlacesPredictions,
	mockGooglePlacesDetails,
	buzzwordBingoWords,
	mockContentfulItem,
	mockContentfulTestProps,
	mockEbayItem,
	mockGoogleAuth,
	mockInstagramMedia,
	mockGoogleSearchConsoleData,
	mockGoogleAnalyticsData,
	mockAxeCoreResponse,
	mockCloudwatchData,
	formDefinition,
	checkoutPersonalInfo,
	checkoutDiscountInfo,
	POST,
	uspsGenericShippingInfo,
	mockComponentTreeData,
	visualdesignformJson as visualdesignForm,
};

export const mockContentfulItemsDetail = contentfulItemsDetail;
export const mockPaypalCheckoutData = paypalCheckoutData;
export const mockEbayApiResponse = ebayApiResponse;
export const mockEbayListings = ebayListings;
export const mockOrderCheckoutData = mockOrderCheckoutDataJson;
export const mockCards = mockTileCards;
export const mockContentfulApiProps = mockContentfulTestProps;
export const mockGAnalyticsResponse = mockGoogleApiResponses.analytics;
export const mockGSearchConsoleResponse = mockGoogleApiResponses.searchConsole;
export const mockAxeCoreData = (mockAxeCoreResponse as any).data?.[0];
export const mockAxeCoreViolation = (mockAxeCoreData as any)?.result?.violations?.[0];

// Expose page engine fixtures directly from JSON to avoid circular imports with fixtures.ts
export const mockPageEngineData = pageEngineData as any;
export const mockDeepPageEngineData = { components: (pageEngineData as any).components || [] } as any;

export {
	realRecipes,
	realResume,
	siteInfo,
	siteInfoFull,
	visualdesign,
	minimalRecipe,
	minimalResume,
	emptySiteInfo,
	routes,
	emptyRoutes,
	malformedRoutes,
	createSiteHealthResponse
} from './fixtures';

import {
	realRecipes,
	realResume,
	siteInfo,
	siteInfoFull,
	visualdesign,
	emptySiteInfo,
	routes,
	emptyRoutes,
	malformedRoutes,
	createSiteHealthResponse,
	mockGoogleDateRanges,
	mockComponentTreeData
} from './fixtures';

// Re-export fixture objects needed by tests (including mockGoogleDateRanges)
export { mockGoogleDateRanges };

// Backwards-compat shape used by many existing tests (keeps migration minimal)
export default {
	visualdesign,
	siteInfo,
	siteInfoFull,
	faqTestData,
	ebayData,
	pageEngineData,
	paypalOrder,
	squareOrderCheckoutData,
	siteHealthData,
	sitemapData,
	realWordPressApiData,
	siteImagesData,
	realContentfulAssetsData,
	wordpressFunctionsData,
	mockCloudinary,
	mockGoogleAnalyticsConfig,
	pixelatedConfig,
	squareEventCatalogObjects,
	squareLargeStoreItems,

	emptySiteInfo,
	routes,
	emptyRoutes,
	malformedRoutes,
};

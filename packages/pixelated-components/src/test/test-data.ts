// Shared test data barrel for the package.
// This file aggregates raw JSON fixtures from src/test/data, derived fixture exports,
// and shared test config values used across src/tests/*. It is not a place for
// test utility functions.
//
// NOT for:
// - test helpers or render wrappers (use src/test/test-utils.tsx)
// - arbitrary application logic
// - storing one-off test data that belongs directly in a specific test file
//
// Data files owned by this barrel:
// - src/test/data/*.json for raw fixture payloads and API response bodies
// - src/test/fixtures.ts for derived or reusable fixture objects
// - src/test/test-utils.tsx for shared helper functions

import siteConfig from '@/data/siteconfig.json';
import recipes from '@/data/recipes.json';
import resume from '@/data/resume.json';
import faqTestData from './data/faq-test-data.json';
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
import squareCatalogResponseNoRelatedObjects from './data/square-catalog-response-no-related-objects.json';
import squareCatalogResponseNestedVariation from './data/square-catalog-response-nested-variation.json';
import mockSitesConfig from './data/mock-sites-config.json';
import mockSpotifyRss from './data/spotify-rss-mocks.json';
import mockTileCards from './data/mock-tile-cards.json';
import mockCarouselCards from './data/mock-carousel-cards.json';
import mockSitemapConfigs from './data/mock-sitemap-configs.json';
import mockSitemapItemsData from './data/mock-sitemap-items-data.json';
import mockGoogleApiResponses from './data/mock-google-api-responses.json';
import mockWordPressPosts from './data/mock-wordpress-posts.json';
import mockContentfulItems from './data/mock-contentful-items.json';
import mockContentfulAssets from './data/mock-contentful-assets.json';
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
import pixelatedConfigJson from '@/config/pixelated.config.json';
import type { PixelatedConfig, ContentfulConfig, EbayConfig, SiteInfoType } from '../components/config/config.types';
import { processPSIData } from '../components/admin/site-health/site-health-core-web-vitals.integration';

// --- MOCK CONFIG DATA ---
export const pixelatedConfig = pixelatedConfigJson as PixelatedConfig;
export const pixelatedConfigEmpty = {} as PixelatedConfig;
export const mockCloudinary = pixelatedConfig.integrations?.cloudinary;
export const mockUspsConfig = pixelatedConfig.integrations?.usps;
export const mockSquareConfig = pixelatedConfig.integrations?.square;
export const mockGoogleAnalyticsConfig = pixelatedConfig.integrations?.google?.analytics;
export const mockEbayApiProps = pixelatedConfig.integrations?.ebay as any;

// --- TEST FIXTURES ---
export {
	faqTestData,
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
	mockContentfulTestProps,
	mockEbayItem,
	mockGoogleAuth,
	mockInstagramMedia,
	mockGoogleSearchConsoleData,
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
	mockGoogleDateRanges
} from './fixtures';

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

	emptySiteInfo,
	routes,
	emptyRoutes,
	malformedRoutes,
};

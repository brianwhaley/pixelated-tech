import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import config from '@/app/config/pixelated.config.json';
import { createPageComponentMocks, mockState, resetMockState, resetFileDataState, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

import Preorder2026 from '@/app/(pages)/preorder-2026/page';
import Home from '@/app/(pages)/(home)/page';
import CustomSunglasses from '@/app/(pages)/customsunglasses/page';
import CustomGallery from '@/app/(pages)/customsgallery/page';
import Store, { createEbayStoreApiProps, createStoreCloudinaryProductEnv } from '@/app/(pages)/store/page';
import Photography from '@/app/(pages)/photography/page';
import Requests from '@/app/(pages)/requests/page';
import { createEbayItemApiProps, createItemCloudinaryProductEnv, isNumeric } from '@/app/(pages)/store/[item]/page';
import { customSunglasses, homeDesign } from '@/app/elements/calloutlibrary';

// const createParams = (item: string) => ({ params: Promise.resolve({ item }) });

describe('PixelVivid branch coverage tests', () => {
	beforeEach(() => {
		resetMockState();
		resetFileDataState();
		mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
		vi.clearAllMocks();
	});

	it('renders preorder page and validates form handler branch', async () => {
		render(<Preorder2026 />);
		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getByText(/Preorder 2026/i)).not.toBeNull();
	});

	it('covers ebay item helper numeric branch', () => {
		expect(isNumeric('123456789012')).toBe(true);
		expect(isNumeric('custom-item')).toBe(false);
	});

	it('covers callout library helper branches', () => {
		render(homeDesign({ layout: 'horizontal' }));
		render(customSunglasses({ variant: 'boxed grid' }));
		expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0);
	});

	it('renders loading fallback when pixelated config is unavailable for page-level components', () => {
		setPixelatedConfigOverride(null);
		render(<Home />);
		render(<CustomSunglasses />);
		render(<CustomGallery />);
		render(<Store />);
		render(<Photography />);
		render(<Requests />);
		expect(document.getElementsByClassName('loading').length).toBeGreaterThan(0);
	});

	it('renders store page content sections when pixelated config is available', async () => {
		setPixelatedConfigOverride(undefined);
		render(<Store />);
		await waitFor(() => expect(screen.getByText(/Custom Sunglasses For Sale/i)).not.toBeNull());
		expect(screen.getByTestId('mock-contentfulitems')).not.toBeNull();
		expect(screen.getByTestId('mock-ebayitems')).not.toBeNull();
	});

	it('covers store page helper branches for missing and present config values', () => {
		const emptyConfig = { ebay: {}, contentful: {}, cloudinary: {} };
		const ebayPropsEmpty = createEbayStoreApiProps(emptyConfig);
		expect(ebayPropsEmpty.proxyURL).toBe('');
		expect(ebayPropsEmpty.globalId).toBe('EBAY-US');

		expect(createStoreCloudinaryProductEnv(emptyConfig)).toBe('');

		const fullConfig = config;
		const ebayPropsFull = createEbayStoreApiProps(fullConfig);
		expect(ebayPropsFull.proxyURL).toBe(config.integrations.ebay.proxyURL);
		expect(ebayPropsFull.globalId).toBe(config.integrations.ebay.globalId);

		expect(createStoreCloudinaryProductEnv(fullConfig)).toBe(config.integrations.cloudinary.product_env);
	});

	it('covers ebay item helper branches for numeric and non-numeric item ids', () => {
		const emptyConfig = { ebay: {}, contentful: {}, cloudinary: {} };
		const numericProps = createEbayItemApiProps(emptyConfig, '123456789012');
		expect(numericProps.proxyURL).toBe('');
		expect(numericProps.qsItemURL).toContain('123456789012');

		expect(createItemCloudinaryProductEnv(emptyConfig)).toBe('');

		const fullConfig = config;
		const numericPropsFull = createEbayItemApiProps(fullConfig.integrations, 'custom-item');
		expect(numericPropsFull.proxyURL).toBe(config.integrations.ebay.proxyURL);
		expect(numericPropsFull.qsItemURL).toContain('custom-item');
	});

	it('renders page-level components when pixelated config is available', async () => {
		setPixelatedConfigOverride(undefined);
		render(<Home />);
		render(<CustomSunglasses />);
		render(<CustomGallery />);
		render(<Photography />);
		render(<Requests />);
		await waitFor(() => expect(screen.getByText(/PixelVivid Products & Services/i)).not.toBeNull());
		expect(screen.getByText(/Custom Painted Sunglasses by PixelVivid/i)).not.toBeNull();
		expect(screen.getAllByText(/PixelVivid Photography/i).length).toBeGreaterThan(0);
		expect(screen.getByText(/Request Your Custom Sunglasses/i)).not.toBeNull();
	});
});

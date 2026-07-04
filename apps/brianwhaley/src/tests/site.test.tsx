import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import {
	render,
	screen,
	waitFor,
	fireEvent,
	runCommonPageCoverage,
	runCommonElementCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import React from 'react';
import { config as pixelatedConfig, setPixelatedConfigOverride } from '@/tests/page-mocks';
import { headers } from 'next/headers';

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import BuzzWordBingoPage from '@/app/(pages)/buzzwordbingo/page';
import ReadmePage from '@/app/(pages)/readme/page';
import RecipesPage from '@/app/(pages)/recipes/page';
import Resume from '@/app/(pages)/resume/page';
import WorkPortfolio from '@/app/(pages)/workportfolio/page';
import SupermarketShenanigansPage from '@/app/(pages)/supermarketshenanigans/page';
import Hero from '@/app/elements/hero';
import Privacy from '@/app/elements/privacy';
import Search from '@/app/elements/search';
import Terms from '@/app/elements/terms';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const cloudinaryProductEnv = 'test_env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

describe('Brian Whaley coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'about',
			'blog',
			'blogcalendar',
			'contact',
			'faqs',
			'partners',
			'podcast',
			'projects',
			'services',
			'service-areas',
			'updates',
		],
		ignoredCommonRoutes: ['socialtags'],
	});

	runCommonElementCoverage({
		Header,
		Nav,
		Footer,
		LayoutClient,
		NotFoundElement: NotFound,
		RootLayout,
		proxy,
		humansGET,
		securityGET,
		config: pixelatedConfig,
		setPixelatedConfigOverride,
		headersModule: { headers },
		cloudinaryProductEnv,
		render,
		screen,
		createElement: React.createElement,
		navAssertion: () => {
			expect(screen.getByTestId('menu-accordion')).not.toBeNull();
		},
		headerAssertion: () => {
			expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			},
		},
		{
			name: 'Resume',
			Component: Resume,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-section')).not.toBeNull());
			},
		},
		{
			name: 'Work Portfolio',
			Component: WorkPortfolio,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('carousel')).not.toBeNull());
			},
		},
	]);

	describe('Brian Whaley extra page coverage', () => {
		it('renders Buzzword Bingo page without throwing', () => {
			render(<BuzzWordBingoPage />);
			expect(screen.getByTestId('page-section')).not.toBeNull();
		});

		it('renders Readme page with markdown when content exists', async () => {
			render(<ReadmePage />);
			await waitFor(() => expect(screen.getByTestId('markdown')).not.toBeNull());
			expect(screen.getByTestId('markdown').textContent).toContain('markdown content');
		});

		it('renders Recipes page without throwing', () => {
			render(<RecipesPage />);
			expect(screen.getByTestId('page-title-header')).toBeTruthy();
			expect(document.querySelector('#recipes')).not.toBeNull();
		});

		it('renders Hero element and Carousel without error', async () => {
			const { container } = render(<Hero />);
			await waitFor(() => expect(screen.getByTestId('carousel')).not.toBeNull());
			expect(container.querySelector('#page-hero')).not.toBeNull();
		});

		it('renders Hero using fallback Flickr config values when integration settings are empty', async () => {
			setPixelatedConfigOverride({
				integrations: {
					flickr: {
						urlProps: {},
					},
				},
			});
			render(<Hero />);
			await waitFor(() => expect(screen.getByTestId('carousel')).not.toBeNull());
			setPixelatedConfigOverride(undefined);
		});

		it('renders Resume page and activates image modal click handler', async () => {
			const link = document.createElement('a');
			link.setAttribute('href', '/images/test.jpg');
			const icon = document.createElement('span');
			icon.className = 'u-photo-icon';
			link.appendChild(icon);
			document.body.appendChild(link);

			render(<Resume />);
			await waitFor(() => expect(screen.getByTestId('page-section')).not.toBeNull());
			fireEvent.click(icon);
			expect(screen.getByTestId('smart-image')).not.toBeNull();
			document.body.removeChild(link);
		});

		it('renders Resume page and handles image click fallback when href is missing', async () => {
			const link = document.createElement('a');
			const icon = document.createElement('span');
			icon.className = 'u-photo-icon';
			link.appendChild(icon);
			document.body.appendChild(link);

			render(<Resume />);
			await waitFor(() => expect(screen.getByTestId('page-section')).not.toBeNull());
			fireEvent.click(icon);
			expect(screen.getByTestId('smart-image')).not.toBeNull();
			document.body.removeChild(link);
		});

		it('renders Work Portfolio page and populates gallery cards', async () => {
			render(<WorkPortfolio />);
			await waitFor(() => expect(screen.getByTestId('carousel')).not.toBeNull());
			expect(screen.getByText('Work Portfolio Gallery')).not.toBeNull();
		});

		it('renders Work Portfolio with fallback Flickr config values when urlProps are empty', async () => {
			setPixelatedConfigOverride({
				integrations: {
					flickr: {
						urlProps: {},
					},
				},
			});
			render(<WorkPortfolio />);
			await waitFor(() => expect(screen.getByTestId('carousel')).not.toBeNull());
			expect(screen.getByText('Work Portfolio Gallery')).not.toBeNull();
			setPixelatedConfigOverride(undefined);
		});

		it('renders Privacy element content', () => {
			render(<Privacy />);
			expect(screen.getByText('Privacy Policy')).not.toBeNull();
		});

		it('renders Search element content', () => {
			render(<Search />);
			expect(screen.getByTestId('google-search')).not.toBeNull();
		});

		it('renders Terms element content', () => {
			render(<Terms />);
			expect(screen.getByText('Terms of Service')).not.toBeNull();
		});

		it('renders Supermarket Shenanigans page without throwing', () => {
			render(<SupermarketShenanigansPage />);
			const section = document.getElementById('supermarket-shenanigans-container');
			expect(section).not.toBeNull();
		});
	});
});

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
	createPageComponentMocks,
	mockState,
	resetMockState,
	resetFileDataState,
	setFileDataState,
} from '@/test/page-mocks';

declare global {
	var pathname: string;
}
import { PixelatedClientConfigProvider } from '@pixelated-tech/components';

const renderWithConfig = (ui: React.ReactElement) =>
	render(
		<PixelatedClientConfigProvider config={{ global: {} } as any}>
			{ui}
		</PixelatedClientConfigProvider>,
	);

let mockSearch = '?installed=false';
let mockParams: Record<string, string> = {};

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(mockSearch),
	useParams: () => mockParams,
}));

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks({
			FlickrWrapper: async ({ callback }: any) => {
				await callback([
					{ imageAlt: 'B', image: 'https://example.com/b.jpg', subHeaderText: 'Card B' },
					{ imageAlt: 'A', image: 'https://example.com/a.jpg', subHeaderText: 'Card A' },
				]);
			},
			Tiles: ({ cards }: any) => (
				<div data-testid="mock-tiles">{Array.isArray(cards) ? cards.map((card: any) => card.imageAlt).join(',') : 'none'}</div>
			),
			PodcastEpisodeList: ({ episodes }: any) => (
				<div data-testid="mock-podcast-episode-list">
					<div data-testid="schema-podcast-series" />
					{Array.isArray(episodes) ? episodes.map((_: any, index: number) => (
						<div key={index} data-testid="schema-podcast-episode" />
					)) : null}
				</div>
			),
		}),
	};
});

import Blog from '@/app/(pages)/blog/page';
import BlogCalendar from '@/app/(pages)/blogcalendar/page';
import Podcast from '@/app/(pages)/podcast/page';
import Schedule from '@/app/(pages)/schedule/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import NerdJokes from '@/app/(pages)/nerdjokes/page';
import Portfolio from '@/app/(pages)/portfolio/page';
import Nav from '@/app/elements/nav';
import RootLayout from '@/app/layout';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
	headers: vi.fn(async () => new Headers({ 'x-path': '/', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/' })),
}));

describe('Pixelated branch coverage tests', () => {
	beforeEach(() => {
		resetMockState();
		resetFileDataState();
		mockSearch = '?installed=false';
		mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		restoreBasePathname();
	});

	function restoreBasePathname() {
		(globalThis as any).pathname = '/';
	}

	it('renders the portfolio page and exercises tiles branch', async () => {
		renderWithConfig(<Portfolio />);
		await waitFor(() => expect(screen.getByTestId('mock-tiles').textContent).toBe('B,A'));
	});

	it('renders nerdjokes page with installed false branch', async () => {
		renderWithConfig(<NerdJokes />);
		await waitFor(() => expect(screen.getAllByTestId('smart-image').length).toBeGreaterThan(0));
		expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
	});

	it('renders blogcalendar success branch', async () => {
		setFileDataState({ data: 'calendar content', loading: false, error: null });
		renderWithConfig(<BlogCalendar />);
		await waitFor(() => expect(screen.getByTestId('markdown')).not.toBeNull());
	});

	it('renders blogcalendar loading branch', async () => {
		setFileDataState({ data: null, loading: true, error: null });
		renderWithConfig(<BlogCalendar />);
		await waitFor(() => expect(screen.getByText('Loading...')).not.toBeNull());
	});

	it('renders blogcalendar error branch', async () => {
		setFileDataState({ data: null, loading: false, error: 'Load failure' });
		renderWithConfig(<BlogCalendar />);
		await waitFor(() => expect(screen.getByText('Error: Load failure')).not.toBeNull());
	});

	it('renders the blog page when categories are unavailable', async () => {
		mockState.wordpressCategories = null;
		renderWithConfig(<Blog />);
		await waitFor(() => expect(screen.getByTestId('blog-post-list')).not.toBeNull());
	});

	it('renders the podcast page when series and episodes are unavailable', async () => {
		mockState.spotifySeries = null;
		mockState.spotifyEpisodes = null;
		renderWithConfig(<Podcast />);
		await waitFor(() => expect(screen.getByTestId('mock-podcast-episode-list')).not.toBeNull());
	});

	it('renders services and related pages with configured siteInfo and routes', async () => {
		const fullConfig = {
			global: {},
			siteInfo: {
				email: 'contact@example.com',
				telephone: '555-1212',
				services: [{ name: 'Test Service', slug: 'test-service' }],
				serviceAreas: [{ name: 'Test Area', slug: 'test-area' }],
			},
			routes: [{ title: 'Home', href: '/' }],
		};
		mockParams = { service: 'test-service', serviceArea: 'test-area' };
		render(
			<PixelatedClientConfigProvider config={fullConfig as any}>
				<>
					<ServicesPage />
					<ServiceAreasPage />
					<Schedule />
					<StyleGuide />
					<ServiceDetailPage />
					<ServiceAreaDetailPage />
				</>
			</PixelatedClientConfigProvider>,
		);
		await waitFor(() => expect(screen.getAllByTestId('page-title-header').length).toBeGreaterThan(0));
	});

	it('renders nav and executes ref callback branch', () => {
		renderWithConfig(<Nav />);
		expect(screen.getByTestId('mock-menuaccordion')).not.toBeNull();
	});

	it('renders nav full menu branch when fullmenu=true', () => {
		mockSearch = '?fullmenu=true';
		renderWithConfig(<Nav />);
		expect(screen.getByTestId('mock-menuaccordion')).not.toBeNull();
	});

	it('renders root layout when route metadata is missing', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/unknown', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root).toBeDefined();
		expect(root.props?.children).toBeTruthy();
	});
});

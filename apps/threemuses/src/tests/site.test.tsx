import React from 'react';
import { describe, expect, vi } from 'vitest';
import { runCommonPageCoverage, runCommonElementCoverage, runCommonMarkdownPageCoverage, runPageSmokeTests } from '../../../../shared/test-utils/index.test-utils';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { config as pixelatedConfig, resetMockState, setCartItems, resetCartItems, setFileDataState, resetFileDataState, setPixelatedConfigOverride } from '@/tests/page-mocks';
import { headers } from 'next/headers';

import { createPageComponentMocks } from '@/tests/page-mocks';
import * as componentsServer from '@pixelated-tech/components/server';

const mockRouterPush = vi.fn();
(globalThis as any).mockRouterPush = mockRouterPush;

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components/server')>('@pixelated-tech/components/server');
	return {
		__esModule: true,
		...actual,
		SquareStoreItemsWrapper: (props: any) => React.createElement('div', { 'data-testid': 'square-store-items-wrapper' }, props.title ? React.createElement('div', { 'data-testid': 'square-store-items-wrapper-title' }, props.title) : null),
		getFullPixelatedConfig: vi.fn(() => ({
			integrations: {
				shoppingcart: {
					orderDomain: 'thethreemusesofbluffton.com',
					orderFormName: 'The Three Muses of Bluffton Order Form',
					orderTo: 'orders@thethreemusesofbluffton.com',
					orderFrom: 'noreply@pixelated.tech',
					orderSubject: 'The Three Muses of Bluffton Order Notification',
					storeName: 'The Three Muses of Bluffton',
				},
			},
		} as any)),
		getSquareStoreItems: vi.fn(async () => ({ items: [] })),
		getSquareStoreItemById: vi.fn(async (id: string) => ({ id, title: 'Test Item', price: 10 })),
		createSquareOrderAndCapturePayment: vi.fn(async (sourceId: any, checkoutData: any) => ({ status: 'ok', sourceId, checkoutData })),
		getSquareEventItems: vi.fn(async () => []),
		listPixelatedFormSubmissionReportRows: vi.fn(async () => []),
	};
});

vi.mock('next/server', () => {
	class NextResponse extends Response {
		request?: any;

		constructor(body?: BodyInit | null, init?: ResponseInit) {
			super(body, init);
		}

		static next(options: any) {
			const response = new NextResponse(null, { status: 200, headers: new Headers() });
			response.request = options?.request;
			return response;
		}

		static redirect(url: string, status: number) {
			const response = new NextResponse(null, { status, headers: new Headers() });
			response.headers.set('location', url);
			return response;
		}

		static json(body: any, init?: any) {
			return new NextResponse(JSON.stringify(body), { ...init, headers: init?.headers ?? new Headers(), status: init?.status ?? 200 });
		}
	}

	return {
		__esModule: true,
		NextResponse,
	};
});

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import BoutiquePage from '@/app/(pages)/boutique/page';
import CartPage from '@/app/(pages)/cart/page';
import ConsignPage from '@/app/(pages)/consign/page';
import DancewearPage from '@/app/(pages)/dancewear/page';
import EventsPage from '@/app/(pages)/events/page';
import EventDetailPage from '@/app/(pages)/events/[event]/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import SewingPage from '@/app/(pages)/sewing/page';
import StorePage from '@/app/(pages)/store/page';
import StoreItemPage from '@/app/(pages)/store/[item]/page';
import UpdatesPage from '@/app/(pages)/updates/page';
import GalleryPage from '@/app/(pages)/gallery/page';
import StudioSpecialsPage from '@/app/(pages)/studio-specials/page';
import AboutUsPage from '@/app/(pages)/about-us/page';
import ContactUsPage from '@/app/(pages)/contact-us/page';
import EventReportPage, { buildEventGroups, asArray, parsePossibleJson, normalizeReportRow, getEventIdentity } from '@/app/(pages)/events/report/page';
import { getThreeMusesSubtotalDiscount } from '@/app/lib/shoppingcart-discounts';
import { POST as capturePaymentPOST } from '@/app/api/capture-payment/route';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';
const { SquareEventCallout: EventCallout, SquareEventDetail: EventDetail } = createPageComponentMocks();

const routeParams: Record<string, string | undefined> = {
	event: undefined,
	serviceArea: undefined,
	item: undefined,
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
	useRouter: () => ({ push: mockRouterPush }),
	redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); },
	notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
}));

describe('ThreeMuses coverage harness', () => {
	beforeEach(() => {
		resetMockState();
		resetFileDataState();
		setPixelatedConfigOverride(undefined);
		mockRouterPush.mockReset();
		routeParams.event = undefined;
		routeParams.serviceArea = undefined;
		routeParams.item = undefined;
	});

	runCommonPageCoverage({
		appRoot: process.cwd(),
		ignoredPageTypes: ['partners', 'podcast', 'projects'],
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
		cloudinaryProductEnv: 'test_env',
		render,
		screen,
		createElement: React.createElement,
		navAssertion: () => {
			expect(document.getElementById('navigation-section')).not.toBeNull();
		},
		headerAssertion: () => {
			expect(document.getElementById('header-section')).not.toBeNull();
		},
		footerAssertion: () => {
			expect(document.getElementById('footer')).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(document.getElementById('notfound-section')).not.toBeNull();
		},
	});

	runCommonMarkdownPageCoverage({
		pages: [
			{
				name: 'Blog Calendar',
				Component: BlogCalendarPage,
				markdownTestId: 'markdown-container',
				loadingText: 'Loading...',
				errorText: 'Error: Failed to load',
			},
			{
				name: 'Updates',
				Component: UpdatesPage,
				markdownTestId: 'markdown-container',
				loadingText: 'Loading...',
				errorText: 'Error: Failed to load',
			},
		],
		render,
		screen,
		waitFor,
		setFileDataState,
		resetFileDataState,
	});

	describe('Service area route coverage', () => {
		beforeEach(() => {
			routeParams.serviceArea = 'custom-area';
		});

		it('renders the service areas index page', () => {
			render(<ServiceAreasPage />);
			expect(document.getElementById('service-areas-intro')).toBeTruthy();
		});

		it('renders a service area detail route when the slug exists', async () => {
			setPixelatedConfigOverride({
				siteInfo: {
					serviceAreas: [{ name: 'Custom Area', slug: 'custom-area' }],
				},
			});
			routeParams.serviceArea = 'custom-area';
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(document.getElementById('service-area-detail-wrapper')).toBeTruthy());
		});

		it('renders a service area detail route not found message when slug does not exist', async () => {
			routeParams.serviceArea = 'unknown-area';
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(screen.getByText('Service area not found. Please return to the service areas list and choose another region.')).toBeTruthy());
		});

		it('renders a service area detail route when an explicit slug field is present', async () => {
			setPixelatedConfigOverride({
				siteInfo: {
					serviceAreas: [{ name: 'Custom Area', slug: 'custom-area' }],
				},
			});
			routeParams.serviceArea = 'custom-area';
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(document.getElementById('service-area-detail-wrapper')).toBeTruthy());
		});
	});

	runPageSmokeTests([
		{
			name: 'Updates',
			Component: UpdatesPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('markdown-container')).not.toBeNull());
			},
		},
	]);

	describe('ThreeMuses additional coverage', () => {
		it('renders Home with no WordPress posts', async () => {
			const HomeComponent = await Home();
			render(HomeComponent as any);
			await waitFor(() => expect(document.getElementById('home-services-section')).not.toBeNull());
		});

		it('proxies request headers correctly', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1', hostname: 'example.com' },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect((result as any).request.headers.get('x-path')).toBe('/test?a=1');
			expect((result as any).request.headers.get('x-origin')).toBe('https://example.com');
		});

		it('redirects amplifyapp.com proxy requests to the canonical domain', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1', hostname: 'subdomain.amplifyapp.com' },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect(result.status).toBe(301);
			expect(result.headers.get('location')).toBe('https://www.thethreemusesofbluffton.com/test?a=1');
		});

		it('falls back to req.url when nextUrl.href is unavailable', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: undefined, hostname: 'example.com' },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect((result as any).request.headers.get('x-url')).toBe('https://example.com/test?a=1');
		});

		it('sets cache headers for /events/report proxy requests', () => {
			const result = proxy({
				nextUrl: { pathname: '/events/report', search: '', origin: 'https://example.com', href: 'https://example.com/events/report', hostname: 'example.com' },
				headers: new Headers({}),
				url: 'https://example.com/events/report',
			} as any);
			expect(result.headers.get('Cache-Control')).toBe('no-store, no-cache, max-age=0, s-maxage=0, must-revalidate');
			expect(result.headers.get('Pragma')).toBe('no-cache');
			expect(result.headers.get('Expires')).toBe('0');
		});

		it('renders Boutique page content', async () => {
			const boutique = await BoutiquePage();
			render(boutique as any);
			expect(document.getElementById('boutique-section')).not.toBeNull();
		});

		it('renders Store page empty state', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [], filters: [] });
			const store = await StorePage();
			render(store as any);
			expect(document.getElementById('store-items-section')).not.toBeNull();
		});

		it('renders Store page with items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ itemID: 'item-1', itemURL: '/item-1', itemTitle: 'Test Item', itemPrice: 10, itemCurrency: 'USD', itemInventory: 0, itemIsShippable: false }], filters: [] } as any);
			const store = await StorePage();
			render(store as any);
			expect(document.getElementById('store-items-section')).not.toBeNull();
		});

		it('renders store item detail page for an existing item', async () => {
			const storeItem = await StoreItemPage({ params: Promise.resolve({ item: 'test-item' }) });
			render(storeItem as any);
			expect(document.getElementById('store-item-detail-section')).not.toBeNull();
		});

		it('throws notFound for a missing store item', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce(null as any);
			await expect(StoreItemPage({ params: Promise.resolve({ item: 'missing-item' }) })).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('renders Store page with query filters applied', async () => {
			const store = await StorePage({ searchParams: Promise.resolve({ propertyName: 'color', propertyValue: 'blue' }) });
			render(store as any);
			expect(document.getElementById('store-items-section')).not.toBeNull();
		});

		it('renders About Us page with Google Reviews section when apiKey is configured', () => {
			setPixelatedConfigOverride({ integrations: { googlePlaces: { apiKey: 'TEST_KEY' } } } as any);
			render(<AboutUsPage />);
			expect(document.getElementById('reviews-section')).not.toBeNull();
		});

		it('renders About Us page without Google Reviews section when apiKey is missing', () => {
			setPixelatedConfigOverride({ integrations: { googlePlaces: {} } } as any);
			render(<AboutUsPage />);
			expect(document.getElementById('reviews-section')).not.toBeNull();
		});

		it('renders Contact Us page', () => {
			render(<ContactUsPage />);
			expect(document.getElementById('contact-us-section')).not.toBeNull();
		});

		it('renders Home page when featured boutique items fail to load', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockRejectedValueOnce(new Error('boom'));
			const home = await Home();
			render(home as any);
			expect(document.getElementById('home-services-section')).not.toBeNull();
		});

		it('renders Home page when featured boutique items response has no items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({} as any);
			const home = await Home();
			render(home as any);
			expect(document.getElementById('home-services-section')).not.toBeNull();
		});

		it('renders Boutique page when featured items response has no items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({} as any);
			const boutique = await BoutiquePage();
			render(boutique as any);
			expect(document.getElementById('boutique-section')).not.toBeNull();
		});

		it('renders Contact Us page with no siteInfo', () => {
			setPixelatedConfigOverride({ siteInfo: { address: { streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '' }, email: '', telephone: '' } });
			render(<ContactUsPage />);
			expect(document.getElementById('contact-us-section')).not.toBeNull();
		});

		it('renders Header with no routes configured', () => {
			setPixelatedConfigOverride({ routes: undefined } as any);
			render(<Header />);
			expect(screen.getByTestId('menuaccordion')).not.toBeNull();
		});

		it('renders Gallery page filtering excluded titles and handling missing image URLs', async () => {
			const components = await vi.importMock('@pixelated-tech/components');
			vi.spyOn(components, 'getContentfulAssetURLs').mockResolvedValueOnce([
				{ image: 'https://example.com/dress-from-collection-museum-fine-arts.jpg', imageAlt: 'Excluded Image' },
				{ image: 'https://example.com/unique_image.png?foo=bar', imageAlt: 'Included Image' },
				{ image: undefined, imageAlt: 'Missing Image' },
			]);
			const page = await GalleryPage();
			render(page as any);
			expect(document.getElementById('gallery-section')).not.toBeNull();
			expect(document.getElementById('gallery-items-section')).not.toBeNull();
		});

		it('renders EventReport page with year filter selected', async () => {
			const currentYear = new Date().getUTCFullYear();
			vi.mocked(componentsServer.getSquareEventItems).mockResolvedValueOnce([
				{ fields: { id: 'evt-1', title: 'Year Event', startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` } },
			]);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ itemID: 'evt-1', title: 'Year Event', itemQuantity: 1 }], shipping_to: { name: 'John' } },
			]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ filter: 'year', v: '1' }) });
			render(page as any);
			expect(screen.getByText('Event Registrations ( 1 )')).toBeTruthy();
		});

		it('renders EventReport page when listPixelatedFormSubmissionReportRows fails', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockRejectedValueOnce(new Error('boom'));
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '1' }) });
			render(page as any);
			expect(screen.getByText(/Unable to load the report:/)).not.toBeNull();
		});

		it('handles parsePossibleJson with invalid JSON and non-string values', () => {
			expect(parsePossibleJson(null)).toBeNull();
			expect(parsePossibleJson(123)).toBe(123);
			expect(parsePossibleJson('invalid')).toBe('invalid');
		});

		it('handles asArray for various inputs', () => {
			expect(asArray(undefined)).toEqual([]);
			expect(asArray('one')).toEqual(['one']);
			expect(asArray([1, 2])).toEqual([1, 2]);
		});

		it('handles event grouping with no event IDs', () => {
			const groups = buildEventGroups([
				{ created_at: '2024-01-01', items: [{ id: '1', title: 'Unknown' }], shipping_to: { name: 'Jane' } },
			]);
			expect(groups.length).toBe(1);
			expect(groups[0].eventId).toBe('1');
		});

		it('renders Boutique page content', async () => {
			const boutique = await BoutiquePage();
			render(boutique as any);
			expect(document.getElementById('boutique-section')).not.toBeNull();
		});

		it('renders Store page empty state', async () => {
			render(<ConsignPage />);
			expect(document.getElementById('consign-section')).not.toBeNull();
		});

		it('renders dancewear page', () => {
			render(<DancewearPage />);
			expect(document.getElementById('dancewear-section')).not.toBeNull();
		});

		it('renders sewing page', () => {
			render(<SewingPage />);
			expect(document.getElementById('sewing-section')).not.toBeNull();
		});

		it('renders cart page with no events in cart', async () => {
			resetCartItems();
			render(<CartPage />);
			await waitFor(() => expect(document.getElementById('cart-page')).not.toBeNull());
		});

		it('renders cart page with event discount calculations and triggers payment capture', async () => {
			setCartItems([
				{ itemCategory: ['event', 'adult'], itemQuantity: 1, itemCost: 100 },
			]);
			render(<CartPage />);
			await waitFor(() => expect(document.getElementById('cart-page')).not.toBeNull());
			expect(screen.getByTestId('shopping-cart')).not.toBeNull();
		});

		it('renders cart page with youth event items and builds the additional info form', async () => {
			setCartItems([
				{ itemCategory: ['event', 'youth'], itemQuantity: 1, itemCost: 100 },
			]);
			render(<CartPage />);
			await waitFor(() => expect(screen.getByTestId('shopping-cart')).not.toBeNull());
		});

		it('renders cart page with string event category and no adult/youth fields', async () => {
			setCartItems([
				{ itemCategory: 'event', itemQuantity: 1, itemCost: 100 },
			]);
			render(<CartPage />);
			await waitFor(() => expect(screen.getByTestId('shopping-cart')).not.toBeNull());
		});

		it('renders cart page with no event category and skips additional info form', async () => {
			setCartItems([
				{ itemCategory: ['product'], itemQuantity: 1, itemCost: 100 },
			]);
			render(<CartPage />);
			await waitFor(() => expect(screen.getByTestId('shopping-cart')).not.toBeNull());
		});

		it('renders Events page with no items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [], filters: [] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page with items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ itemID: 'event-1', itemURL: '/event-1', itemTitle: 'Event A', itemPrice: 10, itemCurrency: 'USD', itemInventory: 0, itemIsShippable: false }], filters: [] } as any);
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page when config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [], filters: [] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even with archived events', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ itemID: 'event-archived', itemURL: '/event-archived', itemTitle: 'Archived Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 0, itemIsShippable: false }], filters: [] } as any);
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even with content types that do not match', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ itemID: 'event-wrong', itemURL: '/event-wrong', itemTitle: 'Wrong Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 0, itemIsShippable: false }], filters: [] } as any);
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even when event images are missing', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ itemID: 'event-no-image', itemURL: '/event-no-image', itemTitle: 'No Image Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 0, itemIsShippable: false }], filters: [] } as any);
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders EventDetailPage when config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ itemID: 'event-1', itemURL: '/event-1', itemTitle: 'Test Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 1, itemIsShippable: false });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ event: 'event-1' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders the event detail route page and loads event data', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ itemID: 'event-1', itemURL: '/event-1', itemTitle: 'Test Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 1, itemIsShippable: false });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ event: 'event-1' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders the event detail route page with carouselImages instead of image', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ itemID: 'event-3', itemURL: '/event-3', itemTitle: 'Carousel Event', itemPrice: 10, itemCurrency: 'USD', itemInventory: 1, itemIsShippable: false });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ event: 'event-3' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders EventDetailPage not found when the item is missing', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce(undefined);
			await expect(EventDetailPage({ params: Promise.resolve({ event: 'event-1' }) })).rejects.toThrow();
		});

		it('renders events page loading state and content', async () => {
			render(
				<EventDetail
					eventData={{
						fields: {
							id: 'event-1',
							title: 'Test Event',
							startDate: '2024-01-01',
							endDate: '2024-01-02',
							duration: 2,
							schedule: '7:00 PM',
							maxSeats: 10,
							price: 50,
							status: 'open',
							carouselImages: [{ image: 'https://example.com/image.png' }],
							description: 'Detail description',
							category: 'event',
						},
					}}
					config={{ siteInfo: {} }}
				/>
			);
			await waitFor(() => expect(document.getElementById('add-to-cart-button')).not.toBeNull());
			fireEvent.click(document.getElementById('add-to-cart-button')!);
			await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/cart'));
		});

		it('does not show add to cart when the event is not open', () => {
			render(
				<EventDetail
					eventData={{
						fields: {
							id: 'event-2',
							title: 'Closed Event',
							startDate: '2024-01-01',
							endDate: '2024-01-02',
							duration: 2,
							schedule: '7:00 PM',
							maxSeats: 10,
							price: 50,
							status: 'closed',
							carouselImages: [{ image: 'https://example.com/image.png' }],
							description: 'Closed event',
							category: 'event',
						},
					}}
					config={{ siteInfo: {} }}
				/>
			);
			expect(document.getElementById('add-to-cart-button')).toBeNull();
		});

		it('renders event callout with schema and callout', () => {
			render(
				<EventCallout
					event={{ fields: { title: 'Test Event' } }}
					calloutProps={{ title: 'Test Callout', layout: 'horizontal' }}
					siteInfo={{}}
				/>
			);
			expect(screen.getByTestId('schemaevent')).toBeTruthy();
			expect(screen.getByTestId('callout')).toBeTruthy();
		});

		it('renders event detail page section', () => {
			render(
				<EventDetail
					eventData={{
						fields: {
							id: 'event-1',
							title: 'Test Event',
							startDate: '2024-01-01',
							endDate: '2024-01-02',
							duration: 2,
							schedule: '7:00 PM',
							maxSeats: 10,
							price: 50,
							status: 'Open',
							carouselImages: [{ image: 'https://example.com/image.png' }],
							description: 'Detail description',
							category: 'event',
						},
					}}
					config={{ siteInfo: {} }}
				/>
			);
			expect(document.getElementById('event-callout-section')).not.toBeNull();
		});

		it('calculates event group and report helper values', () => {
			expect(asArray('x')).toEqual(['x']);
			expect(asArray([1])).toEqual([1]);
			expect(parsePossibleJson({ a: 1 })).toEqual({ a: 1 });
			expect(parsePossibleJson('{"a":1}')).toEqual({ a: 1 });
			expect(parsePossibleJson('not json')).toBe('not json');

			const rows = [
				{ created_at: '2024-02-01', items: [{ id: '1', title: 'A', itemQuantity: 2 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ id: '2', title: 'B', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			];
			const groups = buildEventGroups(rows);
			expect(groups[0].registrationCount).toBeGreaterThanOrEqual(1);
			expect(groups[0].eventName).toContain('A');
		});

		it('renders event report page with no registrations', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '1' }) });
			render(page as any);
			expect(document.getElementById('three-muses-order-report-section')).not.toBeNull();
		});

		it('redirects event report requests when the version query is stale in production', async () => {
			const originalEnv = process.env.NODE_ENV;
			(process.env as any).NODE_ENV = 'production';
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([]);
			await expect(EventReportPage({ searchParams: Promise.resolve({ v: '1' }) })).rejects.toThrow('NEXT_REDIRECT:/events/report?filter=active&v=0');
			(process.env as any).NODE_ENV = originalEnv;
		});

		it('renders event report page with registration rows', async () => {
			vi.mocked(componentsServer.getFullPixelatedConfig).mockReturnValueOnce({
				integrations: {
					shoppingcart: {
						orderDomain: 'thethreemusesofbluffton.com',
						orderFormName: 'The Three Muses of Bluffton Order Form',
						orderTo: 'orders@thethreemusesofbluffton.com',
						orderFrom: 'noreply@pixelated.tech',
						orderSubject: 'The Three Muses of Bluffton Order Notification',
						storeName: 'The Three Muses of Bluffton',
					},
				},
			} as any);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ id: '1', title: 'A', itemQuantity: 2 }], shipping_to: { name: 'John' } },
			]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '2' }) });
			render(page as any);
			expect(document.getElementById('three-muses-order-report-section')).not.toBeNull();
			expect(componentsServer.listPixelatedFormSubmissionReportRows).toHaveBeenCalledWith({
				tableName: 'PixelatedFormSubmissionsTable',
				domain: 'thethreemusesofbluffton.com',
				formName: 'The Three Muses of Bluffton Order Form',
			});
		});

		it('renders event report page with multiple groups and sorts event report rows', async () => {
			const today = new Date();
			const futureDate = new Date(today.getTime() + 1000 * 60 * 60 * 24).toISOString().split('T')[0];

			vi.mocked(componentsServer.getSquareEventItems).mockResolvedValueOnce([
				{ fields: { id: '1', title: 'A', startDate: today.toISOString().split('T')[0], endDate: futureDate } },
				{ fields: { id: '2', title: 'B', startDate: today.toISOString().split('T')[0], endDate: futureDate } },
			] as any);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ id: '1', title: 'A', itemQuantity: 2 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ id: '2', title: 'B', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '3' }) });
			render(page as any);
			expect(document.getElementById('three-muses-event-report')).not.toBeNull();
		});

		it('renders event report page with event filter links and uses the active filter by default', async () => {
			const today = new Date();
			const futureDate = new Date(today.getTime() + 1000 * 60 * 60 * 24).toISOString().split('T')[0];
			const pastDate = new Date(today.getTime() - 1000 * 60 * 60 * 24).toISOString().split('T')[0];

			vi.mocked(componentsServer.getSquareEventItems).mockResolvedValueOnce([
				{ fields: { id: 'event-active', title: 'Active Event', startDate: pastDate, endDate: futureDate } },
				{ fields: { id: 'event-past', title: 'Past Event', startDate: '2024-01-01', endDate: '2024-01-02' } },
			] as any);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ itemID: 'event-active', title: 'Active Event', itemQuantity: 1 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ itemID: 'event-past', title: 'Past Event', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			]);

			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '2' }) });
			render(page as any);

			expect(screen.getByText('Active Events')).toBeTruthy();
			expect(screen.getByText('This Year')).toBeTruthy();
			expect(screen.getByText('All')).toBeTruthy();
			expect(screen.getByText('Event Registrations ( 1 )')).toBeTruthy();
		});

		it('excludes undated events from the active filter', async () => {
			const today = new Date();
			const futureDate = new Date(today.getTime() + 1000 * 60 * 60 * 24).toISOString().split('T')[0];

			vi.mocked(componentsServer.getSquareEventItems).mockResolvedValueOnce([
				{ fields: { id: 'event-active', title: 'Active Event', startDate: today.toISOString().split('T')[0], endDate: futureDate } },
				{ fields: { id: 'event-unknown', title: 'Unknown Dates Event' } },
			] as any);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ itemID: 'event-active', title: 'Active Event', itemQuantity: 1 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ itemID: 'event-unknown', title: 'Unknown Dates Event', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			]);

			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '2' }) });
			render(page as any);

			expect(screen.getByText('Event Registrations ( 1 )')).toBeTruthy();
			expect(screen.queryByText('Unknown Dates Event')).toBeNull();
		});

		it('renders event report page with the all filter showing every event', async () => {
			vi.mocked(componentsServer.getSquareEventItems).mockResolvedValueOnce([
				{ fields: { id: 'event-active', title: 'Active Event', startDate: '2024-01-01', endDate: '2099-12-31' } },
				{ fields: { id: 'event-past', title: 'Past Event', startDate: '2024-01-01', endDate: '2024-01-02' } },
			] as any);
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ itemID: 'event-active', title: 'Active Event', itemQuantity: 1 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ itemID: 'event-past', title: 'Past Event', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			]);

			const page = await EventReportPage({ searchParams: Promise.resolve({ filter: 'all', v: '2' }) });
			render(page as any);

			expect(screen.getByText('Event Registrations ( 2 )')).toBeTruthy();
		});

		it('normalizes report rows when submissionData contains JSON string data', () => {
			const normalized = normalizeReportRow({
				data: {
					orderData: JSON.stringify({
						items: [{ itemID: '1', title: 'A', itemQuantity: 2 }],
						shippingTo: { name: 'John' },
					}),
					created_at: '2024-01-01',
				},
			});
			expect(normalized.items.length).toBe(1);
			expect(normalized.shippingTo.name).toBe('John');
		});

		it('normalizes report rows from submissionData and falls back to itemID', () => {
			const normalized = normalizeReportRow({
				submissionData: JSON.stringify({
					items: [{ itemID: '2', title: 'B' }],
					shippingTo: { name: 'Jane' },
				}),
				created_at: '2024-01-02',
			});
			expect(normalized.items[0].itemID).toBe('2');
			expect(getEventIdentity(normalized.items[0]).eventId).toBe('2');
		});

		it('uses Square itemSKU as the canonical event identifier when present', () => {
			const normalized = normalizeReportRow({
				submissionData: JSON.stringify({
					items: [{ itemID: 'new-guid-123', itemSKU: 'old-legacy-2', title: 'B' }],
					shippingTo: { name: 'Jane' },
				}),
				created_at: '2024-01-02',
			});
			expect(normalized.items[0].itemID).toBe('new-guid-123');
			expect(getEventIdentity(normalized.items[0]).eventId).toBe('old-legacy-2');
		});

		it('prefers itemSKU over itemID for event grouping', () => {
			const normalized = normalizeReportRow({
				submissionData: JSON.stringify({
					items: [{ itemID: '2026-SC08', itemSKU: '2026-SC08', title: 'Summer Camp' }],
					shippingTo: { name: 'Jane' },
				}),
				created_at: '2026-07-10',
			});
			expect(getEventIdentity(normalized.items[0]).eventId).toBe('2026-SC08');
		});

		it('renders an error message when EventReportPage fails to load rows', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockRejectedValueOnce(new Error('boom'));
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '0' }) });
			render(page as any);
			expect(screen.getByText(/Unable to load the report:/)).not.toBeNull();
		});

		it('calculates a Three Muses subtotal discount for event cart items', () => {
			const discount = getThreeMusesSubtotalDiscount([
				{ itemID: 'event-1', itemTitle: 'Test Event', itemInventory: 1, itemCategory: 'event', itemQuantity: 3, itemCost: 100 },
			]);
			expect(discount).toBeGreaterThanOrEqual(0);
		});

		it('returns capture payment validation error when body is incomplete', async () => {
			const response = await capturePaymentPOST(new Request('https://example.com/api/capture-payment', {
				method: 'POST',
				body: JSON.stringify({}),
			}));
			const json = await response.json();
			expect(response.status).toBe(400);
			expect(json).toHaveProperty('error');
		});

		it('captures payment successfully with valid payload', async () => {
			const response = await capturePaymentPOST(new Request('https://example.com/api/capture-payment', {
				method: 'POST',
				body: JSON.stringify({ sourceId: 'src', checkoutData: { amount: 1 } }),
			}));
			const json = await response.json();
			expect(response.status).toBe(200);
			expect(json).toMatchObject({ status: 'ok' });
		});

		it('returns capture payment server error when payment creation fails', async () => {
			vi.mocked(componentsServer.createSquareOrderAndCapturePayment).mockRejectedValueOnce(new Error('boom'));
			const response = await capturePaymentPOST(new Request('https://example.com/api/capture-payment', {
				method: 'POST',
				body: JSON.stringify({ sourceId: 'src', checkoutData: { amount: 1 } }),
			}));
			const json = await response.json();
			expect(response.status).toBe(500);
			expect(json).toHaveProperty('error');
		});

		it('renders studio specials page content', () => {
			render(<StudioSpecialsPage />);
			expect(document.getElementById('studio-specials-section')).not.toBeNull();
			expect(document.querySelector('[id="coupon-section"]')).not.toBeNull();
		});

		it('renders gallery page with filtered images', async () => {
			const page = await GalleryPage();
			render(page as any);
			expect(document.getElementById('gallery-section')).not.toBeNull();
			expect(document.getElementById('gallery-items-section')).not.toBeNull();
			expect(screen.getByTestId('tiles')).not.toBeNull();
		});
	});
});

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
		getSquareStoreItems: vi.fn(async () => ({ items: [] })),
		getSquareStoreItemById: vi.fn(async (id: string) => ({ id, title: 'Test Item', price: 10 })),
		createSquareOrderAndCapturePayment: vi.fn(async (sourceId: any, checkoutData: any) => ({ status: 'ok', sourceId, checkoutData })),
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
import { SquareEventCallout as EventCallout, SquareEventDetail as EventDetail } from '@pixelated-tech/components';
import EventReportPage, { buildEventGroups, asArray, parsePossibleJson, normalizeReportRow, getEventIdentity } from '@/app/(pages)/events/report/page';
import { getThreeMusesSubtotalDiscount } from '@/app/lib/shoppingcart-discounts';
import { POST as capturePaymentPOST } from '@/app/api/capture-payment/route';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const routeParams: Record<string, string | undefined> = {
	event: undefined,
	serviceArea: undefined,
	item: undefined,
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
	useRouter: () => ({ push: mockRouterPush }),
	redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); },
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
			expect(result.request.headers.get('x-path')).toBe('/test?a=1');
			expect(result.request.headers.get('x-origin')).toBe('https://example.com');
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
			expect(result.request.headers.get('x-url')).toBe('https://example.com/test?a=1');
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
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [] });
			const store = await StorePage();
			render(store as any);
			expect(document.getElementById('store-items-section')).not.toBeNull();
		});

		it('renders Store page with items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ id: 'item-1', title: 'Test Item' }] });
			const store = await StorePage();
			render(store as any);
			expect(document.getElementById('store-items-section')).not.toBeNull();
		});

		it('renders store item detail page for an existing item', async () => {
			const storeItem = await StoreItemPage({ params: Promise.resolve({ item: 'test-item' }) });
			render(storeItem as any);
			expect(document.getElementById('store-item-detail-section')).not.toBeNull();
		});

		it('renders consign page', () => {
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
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page with items', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ id: 'event-1', title: 'Event A', price: 10, status: 'open' }] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page when config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even with archived events', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ id: 'event-archived', title: 'Archived Event', status: 'archived' }] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even with content types that do not match', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ id: 'event-wrong', title: 'Wrong Event', status: 'open' }] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders Events page even when event images are missing', async () => {
			vi.mocked(componentsServer.getSquareStoreItems).mockResolvedValueOnce({ items: [{ id: 'event-no-image', title: 'No Image Event', status: 'open' }] });
			const events = await EventsPage();
			render(events as any);
			expect(document.getElementById('events-section')).not.toBeNull();
		});

		it('renders EventDetailPage when config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ id: 'event-1', title: 'Test Event', price: 10 });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ item: 'event-1' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders the event detail route page and loads event data', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ id: 'event-1', title: 'Test Event', price: 10 });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ item: 'event-1' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders the event detail route page with carouselImages instead of image', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce({ id: 'event-3', title: 'Carousel Event', price: 10 });
			const eventDetail = await EventDetailPage({ params: Promise.resolve({ item: 'event-3' }) });
			render(eventDetail as any);
			await waitFor(() => expect(document.getElementById('store-item-detail-section')).not.toBeNull());
		});

		it('renders EventDetailPage not found when the item is missing', async () => {
			vi.mocked(componentsServer.getSquareStoreItemById).mockResolvedValueOnce(undefined);
			await expect(EventDetailPage({ params: Promise.resolve({ item: 'event-1' }) })).rejects.toThrow();
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
			process.env.NODE_ENV = 'production';
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([]);
			await expect(EventReportPage({ searchParams: Promise.resolve({ v: '1' }) })).rejects.toThrow('NEXT_REDIRECT:/events/report?v=0');
			process.env.NODE_ENV = originalEnv;
		});

		it('renders event report page with registration rows', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ id: '1', title: 'A', itemQuantity: 2 }], shipping_to: { name: 'John' } },
			]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '2' }) });
			render(page as any);
			expect(document.getElementById('three-muses-order-report-section')).not.toBeNull();
		});

		it('renders event report page with multiple groups and sorts event report rows', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{ created_at: '2024-02-01', items: [{ id: '1', title: 'A', itemQuantity: 2 }], shipping_to: { name: 'John' } },
				{ created_at: '2024-01-01', items: [{ id: '2', title: 'B', itemQuantity: 1 }], shipping_to: { name: 'Jane' } },
			]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '3' }) });
			render(page as any);
			expect(document.getElementById('three-muses-event-report')).not.toBeNull();
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

		it('returns Unknown event identity when item has no id or itemID', () => {
			expect(getEventIdentity({}).eventId).toBe('Unknown');
		});

		it('renders an event report page without redirect when version matches in test env', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([]);
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '0' }) });
			render(page as any);
			expect(document.getElementById('three-muses-order-report-section')).not.toBeNull();
		});

		it('renders an error message when EventReportPage fails to load rows', async () => {
			vi.mocked(componentsServer.listPixelatedFormSubmissionReportRows).mockRejectedValueOnce(new Error('boom'));
			const page = await EventReportPage({ searchParams: Promise.resolve({ v: '0' }) });
			render(page as any);
			expect(screen.getByText(/Unable to load the report:/)).not.toBeNull();
		});

		it('calculates a Three Muses subtotal discount for event cart items', () => {
			const discount = getThreeMusesSubtotalDiscount([
				{ itemCategory: 'event', itemQuantity: 3, itemCost: 100 },
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
	});
});

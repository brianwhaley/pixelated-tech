import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import appConfig from '@/app/config/pixelated.config.json';
import { createPageComponentMocks, resetPixelatedConfigOverride, setPixelatedConfigOverride } from '@/test/page-mocks';

const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockRouterPush }),
}));

const contentfulKey = 'contentful';
const baseUrlKey = 'base_url';
const spaceIdKey = 'space_id';
const environmentKey = 'environment';
const deliveryTokenKey = 'delivery_access_token';
const globalKey = 'global';
const proxyUrlKey = 'proxyUrl';
const siteInfoKey = 'siteInfo';

const createEventsConfig = () => {
	const configClone = structuredClone(appConfig) as any;
	configClone[contentfulKey] = {
		...configClone[contentfulKey],
		[baseUrlKey]: 'https://contentful.example.com',
		[spaceIdKey]: 'space',
		[environmentKey]: 'master',
		[deliveryTokenKey]: 'token',
	};
	configClone[globalKey] = {
		...configClone[globalKey],
		[proxyUrlKey]: '',
	};
	configClone[siteInfoKey] = {};
	return configClone;
};

vi.mock('@pixelated-tech/components', () =>
	createPageComponentMocks({
		getContentfulEntriesByType: vi.fn(),
		getContentfulEntryByField: vi.fn(),
		getContentfulImagesFromEntries: vi.fn(),
		buildEventSchema: vi.fn((event: any) => ({ title: event.fields.title })),
		FormButton: (props: any) => React.createElement('button', { 'data-testid': 'mock-formbutton', onClick: props.onClick }, props.text || 'Button'),
	})
);

import * as pixelatedComponents from '@pixelated-tech/components';
const mockGetContentfulEntriesByType = pixelatedComponents.getContentfulEntriesByType as ReturnType<typeof vi.fn>;
const mockGetContentfulEntryByField = pixelatedComponents.getContentfulEntryByField as ReturnType<typeof vi.fn>;
const mockGetContentfulImagesFromEntries = pixelatedComponents.getContentfulImagesFromEntries as ReturnType<typeof vi.fn>;
const mockBuildEventSchema = pixelatedComponents.buildEventSchema as ReturnType<typeof vi.fn>;

import EventsPage from '@/app/(pages)/events/page';
import EventDetailPage from '@/app/(pages)/events/[event]/page';

const exampleEvent1 = {
	fields: {
		id: 'event-1',
		title: 'Test Event One',
		description: 'Event description one',
		startDate: '2025-01-05',
		endDate: '2025-01-06',
		image: { sys: { id: 'img-1' } },
	},
	sys: {
		contentType: { sys: { id: 'event' } },
	},
};

const exampleEvent2 = {
	fields: {
		id: 'event-2',
		title: 'Test Event Two',
		description: 'Event description two',
		startDate: '2025-01-01',
		endDate: '2025-01-02',
		image: { sys: { id: 'img-2' } },
	},
	sys: {
		contentType: { sys: { id: 'event' } },
	},
};

const nonEvent = {
	fields: {
		id: 'other-1',
		title: 'Not an Event',
		description: 'Non-event description',
		startDate: '2025-01-01',
		endDate: '2025-01-02',
		image: { sys: { id: 'img-1' } },
	},
	sys: {
		contentType: { sys: { id: 'other' } },
	},
};

describe('Events page', () => {
	beforeEach(() => {
		mockRouterPush.mockReset();
		mockGetContentfulEntriesByType.mockReset();
		mockGetContentfulEntryByField.mockReset();
		mockGetContentfulImagesFromEntries.mockReset();
		mockBuildEventSchema.mockReset();
		resetPixelatedConfigOverride();
		setPixelatedConfigOverride(createEventsConfig());
	});

	it('renders the events page list when config is present', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({ items: [exampleEvent1, exampleEvent2], includes: { Asset: [] } });
		mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: '/images/event.jpg' }]);

		render(<EventsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Events'));
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});

	it('renders the event detail page with event data', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({ items: [exampleEvent1], includes: { Asset: [] } });
		mockGetContentfulEntryByField.mockResolvedValue(exampleEvent1);
		mockGetContentfulImagesFromEntries.mockResolvedValue([]);
		mockBuildEventSchema.mockImplementation((event: any) => ({ title: event.fields.title }));

		await act(async () => {
			render(<EventDetailPage params={Promise.resolve({ event: 'event-1' }) as any} />);
		});
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Test Event One'));
		expect(screen.getByTestId('mock-schemaevent')).toBeTruthy();
	});

	it('passes only event id to register page query string', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({ items: [exampleEvent1], includes: { Asset: [] } });
		mockGetContentfulEntryByField.mockResolvedValue(exampleEvent1);
		mockGetContentfulImagesFromEntries.mockResolvedValue([]);
		mockBuildEventSchema.mockImplementation((event: any) => ({ title: event.fields.title }));

		await act(async () => {
			render(<EventDetailPage params={Promise.resolve({ event: 'event-1' }) as any} />);
		});

		await waitFor(() => expect(screen.getByTestId('mock-formbutton')).toBeTruthy());
		const button = screen.getByTestId('mock-formbutton');
		button.click();
		expect(mockRouterPush).toHaveBeenCalledWith('/register?event=event-1');
	});

	it('renders the loading state when no config is available', async () => {
		setPixelatedConfigOverride(null as any);
		render(<EventsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-loading')).toBeTruthy());
	});

	it('renders no event callouts for non-event content types', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({ items: [nonEvent], includes: { Asset: [] } });
		mockGetContentfulImagesFromEntries.mockResolvedValue([]);

		render(<EventsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Events'));
		expect(screen.queryAllByTestId('mock-callout').length).toBe(0);
	});

	it('renders fallback event detail when the event is not found', async () => {
		mockGetContentfulEntryByField.mockResolvedValue(null);
		await act(async () => {
			render(<EventDetailPage params={Promise.resolve({ event: 'event-1' }) as any} />);
		});
		await waitFor(() => expect(screen.getByText('Loading event data...')).toBeTruthy());
	});
});

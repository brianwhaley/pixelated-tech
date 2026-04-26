import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import { SchemaEvent, buildEventSchema } from '@/components/foundation/schema';

describe('SchemaEvent Component', () => {
	describe('Rendering', () => {
		it('renders a JSON-LD script tag for Event schema', () => {
			const eventSchema = {
				'@context': 'https://schema.org',
				'@type': 'Event',
				name: 'Test Event',
			};

			const { container } = render(<SchemaEvent event={eventSchema} />);
			const scriptTag = container.querySelector('script[type="application/ld+json"]');

			expect(scriptTag).toBeTruthy();
			expect(scriptTag?.textContent).toContain('"@type":"Event"');
			expect(scriptTag?.textContent).toContain('"name":"Test Event"');
		});
	});
});

describe('buildEventSchema helper', () => {
	const siteInfo = {
		name: 'Three Muses',
		url: 'https://threemuses.example',
		address: {
			streetAddress: '123 Main St',
			addressLocality: 'Cambridge',
			postalCode: '02139',
			addressRegion: 'MA',
			addressCountry: 'USA',
		},
	};

	it('builds a valid Event schema object with offer and normalized images', () => {
		const eventData = {
			fields: {
				id: 'event-1',
				title: 'Spring Gathering',
				description: 'A live workshop',
				startDate: '2025-06-01T18:00:00Z',
				endDate: '2025-06-01T20:00:00Z',
				carouselImages: [
					{ image: '//images.ctfassets.net/abc/1.jpg', imageAlt: 'Image 1' },
				],
				price: 45,
				maxSeats: 5,
			},
		};

		const schema = buildEventSchema(eventData, siteInfo as any);

		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('Event');
		expect(schema.name).toBe('Spring Gathering');
		expect(schema.startDate).toBe('2025-06-01T18:00:00.000Z');
		expect(schema.endDate).toBe('2025-06-01T20:00:00.000Z');
		expect(schema.url).toBe('https://threemuses.example/events/event-1');
		expect(schema.image).toEqual(['https://images.ctfassets.net/abc/1.jpg']);
		expect(schema.offers).toEqual({
			'@type': 'Offer',
			url: 'https://threemuses.example/events/event-1',
			price: 45,
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock',
			validFrom: '2025-06-01T18:00:00.000Z',
		});
		expect(schema.organizer).toEqual({
			'@type': 'Organization',
			name: 'Three Muses',
			url: 'https://threemuses.example',
		});
	});

	it('omits offers when price is missing', () => {
		const eventData = {
			fields: {
				id: 'event-2',
				title: 'Free Session',
				description: 'A free event',
				startDate: '2025-07-01T18:00:00Z',
				endDate: '2025-07-01T20:00:00Z',
				carouselImages: [],
				price: null,
				maxSeats: 0,
			},
		};

		const schema = buildEventSchema(eventData, siteInfo as any);

		expect(schema.offers).toBeUndefined();
		expect(schema.image).toBeUndefined();
	});

	it('normalizes invalid carousel images and drops missing image URLs', () => {
		const eventData = {
			fields: {
				id: 'event-4',
				title: 'Image Cleanup Event',
				description: 'No valid image URLs',
				startDate: '2025-08-01T18:00:00Z',
				endDate: '2025-08-01T20:00:00Z',
				carouselImages: [
					{ image: null },
					{ image: 123 },
					{ image: '//images.ctfassets.net/abc/2.jpg' },
				],
				price: 15,
				maxSeats: 2,
			},
		};

		const schema = buildEventSchema(eventData, siteInfo as any);

		expect(schema.image).toEqual(['https://images.ctfassets.net/abc/2.jpg']);
	});

	it('handles undefined carouselImages by omitting image property', () => {
		const eventData = {
			fields: {
				id: 'event-5',
				title: 'Missing Images Event',
				description: 'No carousel images provided',
				startDate: '2025-09-01T18:00:00Z',
				endDate: '2025-09-01T20:00:00Z',
				carouselImages: undefined,
				price: 20,
				maxSeats: 1,
			},
		};

		const schema = buildEventSchema(eventData as any, siteInfo as any);

		expect(schema.image).toBeUndefined();
	});

	it('preserves non-CTF image URLs and normalizes them correctly', () => {
		const eventData = {
			fields: {
				id: 'event-6',
				title: 'External Image Event',
				description: 'Uses normal image URL',
				startDate: '2025-10-01T18:00:00Z',
				endDate: '2025-10-01T20:00:00Z',
				carouselImages: [
					{ image: 'https://example.com/image.jpg' },
				],
				price: 25,
				maxSeats: 10,
			},
		};

		const schema = buildEventSchema(eventData as any, siteInfo as any);

		expect(schema.image).toEqual(['https://example.com/image.jpg']);
	});

	it('falls back to relative event URL when siteInfo is missing', () => {
		const eventData = {
			fields: {
				id: 'event-7',
				title: 'Local URL Event',
				description: 'No site info',
				startDate: '2025-11-01T18:00:00Z',
				endDate: '2025-11-01T20:00:00Z',
				carouselImages: [],
				price: 30,
				maxSeats: 5,
			},
		};

		const schema = buildEventSchema(eventData as any, null);

		expect(schema.url).toBe('/events/event-7');
	});

	it('marks sold-out availability when maxSeats is zero', () => {
		const eventData = {
			fields: {
				id: 'event-8',
				title: 'Sold Out Event',
				description: 'No seats left',
				startDate: '2025-12-01T18:00:00Z',
				endDate: '2025-12-01T20:00:00Z',
				carouselImages: [],
				price: 50,
				maxSeats: 0,
			},
		};

		const schema = buildEventSchema(eventData as any, siteInfo as any);

		expect(schema.offers?.availability).toBe('https://schema.org/SoldOut');
	});

	it('drops invalid dates from the resulting schema', () => {
		const eventData = {
			fields: {
				id: 'event-3',
				title: 'Broken Date Event',
				description: 'Dates are invalid',
				startDate: 'not-a-date',
				endDate: 'also-not-a-date',
				carouselImages: [],
				price: 10,
				maxSeats: 3,
			},
		};

		const schema = buildEventSchema(eventData, siteInfo as any);

		expect(schema.startDate).toBeUndefined();
		expect(schema.endDate).toBeUndefined();
		expect(schema.url).toBe('https://threemuses.example/events/event-3');
	});
});

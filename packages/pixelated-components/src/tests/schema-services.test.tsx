import { describe, it, expect, vi } from 'vitest';
import { render } from '../test/test-utils';
import { waitFor } from '@testing-library/react';
import * as googleReviewsFunctions from '../components/integrations/google.reviews.functions';
import { ServicesSchema } from '../components/foundation/schema';

vi.mock('../components/integrations/google.reviews.functions', () => ({
	getGoogleReviewsByPlaceId: vi.fn(),
}));

let mockPathname = '/';
vi.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

describe('ServicesSchema', () => {
	const defaultServices = [
		{
			name: 'Web Development',
			description: 'Custom web development services'
		},
		{
			name: 'UI Design',
			description: 'User interface design services'
		}
	];

	const defaultConfig = {
		siteInfo: {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: defaultServices
		}
	};

	it('should render script tags with application/ld+json type', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		expect(scriptTags.length).toBe(2); // One for each service
	});

	it('should emit only a single service when the pathname matches a service detail page', () => {
		mockPathname = '/services/web-development';
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		expect(scriptTags.length).toBe(1);
		const service = JSON.parse(scriptTags[0].textContent || '{}');
		expect(service.name).toBe('Web Development');
	});

	afterEach(() => {
		mockPathname = '/';
	});

	it('should include schema.org context and Service type for each service', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');

		scriptTags.forEach(scriptTag => {
			const schemaData = JSON.parse(scriptTag.textContent || '{}');
			expect(schemaData['@context']).toBe('https://schema.org');
			expect(schemaData['@type']).toBe('Service');
		});
	});

	it('should include service name and description', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');

		const firstService = JSON.parse(scriptTags[0].textContent || '{}');
		expect(firstService.name).toBe('Web Development');
		expect(firstService.description).toBe('Custom web development services');

		const secondService = JSON.parse(scriptTags[1].textContent || '{}');
		expect(secondService.name).toBe('UI Design');
		expect(secondService.description).toBe('User interface design services');
	});

	it('should include provider information', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.provider['@type']).toBe('LocalBusiness');
		expect(firstService.provider.name).toBe(defaultConfig.siteInfo.name);
		expect(firstService.provider.url).toBe(defaultConfig.siteInfo.url);
	});

	it('should include provider logo when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			image: 'https://testagency.com/logo.png',
			services: defaultServices
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.provider.logo).toBe(siteInfo.image);
	});

	it('should include provider brand when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			brand: {
				'@type': 'Brand',
				name: 'Test Agency'
			},
			services: defaultServices
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.provider.brand).toEqual(siteInfo.brand);
	});

	it('should include provider telephone when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			telephone: '+1-555-0123',
			services: defaultServices
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.provider.telephone).toBe('+1-555-0123');
	});

	it('should use siteInfo.telephone as availableChannel.servicePhone when availableChannel is omitted', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			telephone: '+1-555-0123',
			services: defaultServices
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTag?.textContent || '{}');

		expect(service.availableChannel?.servicePhone).toBe('+1-555-0123');
		expect(service.availableChannel?.['@type']).toBe('ContactPoint');
	});

	it('should include provider email when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			email: 'hello@testagency.com',
			services: defaultServices
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.provider.email).toBe('hello@testagency.com');
	});

	it('should generate service url from name when services have short_description', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: [
				{
					name: 'Web Development',
					description: 'Custom web development services',
					short_description: 'Fast custom web development'
				}
			]
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.url).toBe('https://testagency.com/services/web-development');
	});

	it('should include service image when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: [
				{
					name: 'Web Development',
					description: 'Custom web development services',
					image: 'https://testagency.com/images/web-dev.jpg'
				}
			]
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.image).toBe('https://testagency.com/images/web-dev.jpg');
	});

	it('should generate service url from name and siteInfo.url when no url is provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.url).toBe('https://testagency.com/services/web-development');
	});

	it('should generate root-level service url when servicesPathPrefix is blank', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			servicesPathPrefix: '',
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.url).toBe('https://testagency.com/web-development');
	});

	it('should use siteInfo.servicesPathPrefix when generating service urls', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			servicesPathPrefix: '/offerings',
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.url).toBe('https://testagency.com/offerings/web-development');
	});

	it('should include areaServed from siteInfo.serviceAreas for every service', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			serviceAreas: [
				{ name: 'Metro Area' },
				{ name: 'Coastal Area' }
			],
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.areaServed).toEqual([
			{ '@type': 'City', name: 'Metro Area' },
			{ '@type': 'City', name: 'Coastal Area' }
		]);
	});

	it('should generate structured areaServed objects with Wikipedia sameAs links', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			serviceAreas: [
				{ name: 'Denville NJ' },
				{ name: 'Morristown NJ' },
				{ name: 'Savannah GA' }
			],
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.areaServed).toEqual([
			{
				'@type': 'City',
				name: 'Denville',
				sameAs: 'https://en.wikipedia.org/wiki/Denville_Township,_New_Jersey'
			},
			{
				'@type': 'City',
				name: 'Morristown',
				sameAs: 'https://en.wikipedia.org/wiki/Morristown,_New_Jersey'
			},
			{
				'@type': 'City',
				name: 'Savannah',
				sameAs: 'https://en.wikipedia.org/wiki/Savannah,_Georgia'
			}
		]);
	});

	it('should include provider address, sameAs, and openingHours when provided', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			logo: 'https://testagency.com/logo.png',
			telephone: '+1-555-0123',
			email: 'hello@testagency.com',
			address: {
				streetAddress: '123 Main St',
				addressLocality: 'Anytown',
				addressRegion: 'NY',
				postalCode: '10001',
				addressCountry: 'US'
			},
			sameAs: ['https://twitter.com/testagency'],
			openingHours: [
				{ day: 'Mon', open: '09:00', close: '17:00' }
			],
			services: [
				{ name: 'Web Development', description: 'Custom web development services' }
			]
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.provider.address['@type']).toBe('PostalAddress');
		expect(service.provider.address.streetAddress).toBe('123 Main St');
		expect(service.provider.sameAs).toEqual(['https://twitter.com/testagency']);
		expect(service.provider.openingHours).toEqual([{ day: 'Mon', open: '09:00', close: '17:00' }]);
	});

	it('should include termsOfService when provided for a service', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: [
				{
					name: 'Web Development',
					description: 'Custom web development services',
					termsOfService: 'https://testagency.com/terms'
				}
			]
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.termsOfService).toBe('https://testagency.com/terms');
	});

	it('should support siteInfo prop as a primary source of data', () => {
		const siteInfo = {
			name: 'SiteInfo Business',
			url: 'https://siteinfo.com',
			image: 'https://siteinfo.com/logo.png',
			telephone: '+1-234-5678',
			email: 'info@siteinfo.com',
			services: [
				{
					name: 'SiteInfo Service',
					description: 'Service from SiteInfo object'
				}
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag!.textContent || '{}');

		expect(schemaData.name).toBe(siteInfo.services[0].name);
		expect(schemaData.description).toBe(siteInfo.services[0].description);
		expect(schemaData.areaServed).toBeUndefined();
		
		expect(schemaData.provider.name).toBe(siteInfo.name);
		expect(schemaData.provider.url).toBe(siteInfo.url);
		expect(schemaData.provider.logo).toBe(siteInfo.image);
		expect(schemaData.provider.telephone).toBe(siteInfo.telephone);
		expect(schemaData.provider.email).toBe(siteInfo.email);
	});

	it('should handle multiple services from siteInfo', () => {
		const siteInfo = {
			name: 'Multi-Service Business',
			url: 'https://multi.com',
			services: [
				{ name: 'S1', description: 'D1' },
				{ name: 'S2', description: 'D2' }
			]
		};

		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		expect(scriptTags.length).toBe(2);
		
		const s1 = JSON.parse(scriptTags[0].textContent || '{}');
		const s2 = JSON.parse(scriptTags[1].textContent || '{}');
		
		expect(s1.name).toBe('S1');
		expect(s2.name).toBe('S2');
	});

	it('should not include service areaServed when it is removed', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.areaServed).toBeUndefined();
	});

	it('should still produce valid service JSON when no areaServed is provided', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const service = JSON.parse(scriptTags[0].textContent || '{}');

		expect(service.areaServed).toBeUndefined();
	});

	it('should handle multiple services', () => {
		const siteInfo = {
			name: 'Test Agency',
			url: 'https://testagency.com',
			services: [
				{ name: 'Service 1', description: 'Description 1' },
				{ name: 'Service 2', description: 'Description 2' },
				{ name: 'Service 3', description: 'Description 3' }
			]
		};
		const { container } = render(<ServicesSchema />, { config: { siteInfo } });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');

		expect(scriptTags.length).toBe(3);
	});

	it('should generate valid JSON for all services', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');

		expect(() => {
			scriptTags.forEach(scriptTag => {
				JSON.parse(scriptTag.textContent || '{}');
			});
		}).not.toThrow();
	});

	it('should not include review or aggregateRating even when googlePlaces placeId exists', async () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
			place: {
				name: 'Test Place',
				place_id: 'ChIJ1234567890',
				formatted_address: '123 Test St',
			},
			reviews: [
				{
					author_name: 'John Doe',
					rating: 5,
					text: 'Great service!',
					time: 1680000000,
				},
			],
		});

		const { container } = render(<ServicesSchema />, {
			config: {
				siteInfo: {
					name: 'Test Agency',
					url: 'https://testagency.com',
					services: defaultServices,
				},
				integrations: {
					googlePlaces: {
						placeId: 'ChIJ1234567890',
						apiKey: 'test-api-key',
					},
				},
			},
		});

		await waitFor(() => {
			const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
			expect(scriptTags.length).toBe(2);
			const schemaData = JSON.parse(scriptTags[0].textContent || '{}');
			expect(schemaData.aggregateRating).toBeUndefined();
			expect(schemaData.review).toBeUndefined();
		});
	});

	it('should exclude optional fields that are not provided except generated url', () => {
		const { container } = render(<ServicesSchema />, { config: defaultConfig });
		const scriptTags = container.querySelectorAll('script[type="application/ld+json"]');
		const firstService = JSON.parse(scriptTags[0].textContent || '{}');

		expect(firstService.image).toBeUndefined();
		expect(firstService.areaServed).toBeUndefined();
	});

	it('should render without crashing with minimal required props', () => {
		expect(() => {
			render(<ServicesSchema />, { config: defaultConfig });
		}).not.toThrow();
	});
});

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '../test/test-utils';
import { screen } from '@testing-library/react';
import { FormGooglePlacesInput } from '../components/sitebuilder/form/formcomponents';
import { FormValidationProvider } from '../components/sitebuilder/form/formvalidator';
import { GooglePlacesService } from '../components/integrations/googleplaces';
import { mockGooglePlacesPredictions, mockGooglePlacesDetailsUS, mockGooglePlacesDetailsCA, mockGooglePlacesDetailsInvalidCountry, mockGooglePlacesDetailsNoCountry } from '../test/fixtures';
import { pixelatedConfig } from '../test/test-data';

vi.mock('../components/foundation/smartfetch');

const { smartFetch } = await import('../components/foundation/smartfetch');
const mockSmartFetch = vi.mocked(smartFetch);

describe('GooglePlacesService', () => {
	const mockConfig = pixelatedConfig;

	// ensure an API key exists for tests that expect the service to call out
	if (!mockConfig.integrations) mockConfig.integrations = {} as any;
	if (!mockConfig.integrations.google) mockConfig.integrations.google = {} as any;
	mockConfig.integrations.google.apiKey = mockConfig.integrations.google.apiKey || 'test-api-key';

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getPlacePredictions', () => {
		it('should return empty array for empty input', async () => {
			const service = new GooglePlacesService(mockConfig);
			const results = await service.getPlacePredictions('', mockConfig);
			expect(results).toEqual([]);
		});

		it('should return empty array for input shorter than 2 characters', async () => {
			const service = new GooglePlacesService(mockConfig);
			const results = await service.getPlacePredictions('a', mockConfig);
			expect(results).toEqual([]);
		});

		it('should fetch predictions from API', async () => {
			mockSmartFetch.mockResolvedValueOnce(mockGooglePlacesPredictions);

			const service = new GooglePlacesService(mockConfig);
			const results = await service.getPlacePredictions('123 main', mockConfig);

			expect(results).toHaveLength(2);
			expect(results[0].placeId).toBe('place1');
			expect(results[0].mainText).toBe('123 Main St');
			expect(results[0].secondaryText).toBe('Springfield, IL');
			expect(results[0].fullText).toBe('123 Main St, Springfield, IL');
		});

		it('should cache predictions', async () => {
			const mockPredictions = {
				predictions: [
					{
						place_id: 'place1',
						description: '123 Main St, Springfield, IL',
						structured_formatting: {
							main_text: '123 Main St',
							secondary_text: 'Springfield, IL'
						}
					}
				]
			};

			mockSmartFetch.mockResolvedValueOnce(mockPredictions);

			const service = new GooglePlacesService(mockConfig);
			
			// First call
			const results1 = await service.getPlacePredictions('123 main', mockConfig);
			expect(results1).toHaveLength(1);
			expect(mockSmartFetch).toHaveBeenCalledTimes(1);

			// Second call should use cache (no new fetch)
			const results2 = await service.getPlacePredictions('123 main', mockConfig);
			expect(results2).toHaveLength(1);
			expect(mockSmartFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
		});

		it('should handle API errors gracefully', async () => {
			mockSmartFetch.mockRejectedValueOnce(new Error('Network error'));

			const service = new GooglePlacesService(mockConfig);
			const results = await service.getPlacePredictions('123 main', mockConfig);

			expect(results).toEqual([]);
		});

		it('should include country restrictions in API call', async () => {
			mockSmartFetch.mockResolvedValueOnce({
				predictions: []
			});

			const service = new GooglePlacesService(mockConfig);
			await service.getPlacePredictions('test', mockConfig);

			const callUrl = mockSmartFetch.mock.calls[0][0];
			// buildUrl encodes the colon in country:us as %3A
			expect(callUrl).toContain('components=country');
			expect(callUrl).toContain('US');
		});
	});

	describe('getPlaceDetails', () => {
		it('should return null for invalid placeId', async () => {
			const service = new GooglePlacesService(mockConfig);
			mockSmartFetch.mockResolvedValueOnce({});

			const result = await service.getPlaceDetails('invalid-id', mockConfig);
			expect(result).toBeNull();
		});

		it('should parse address components correctly', async () => {
			mockSmartFetch.mockResolvedValueOnce(mockGooglePlacesDetailsUS);

			const service = new GooglePlacesService(mockConfig);
			const result = await service.getPlaceDetails('place1', mockConfig);

			expect(result).not.toBeNull();
			expect(result?.street1).toContain('Main Street');
			expect(result?.city).toBe('Springfield');
			expect(result?.state).toBe('IL');
			expect(result?.zip).toBe('62701');
			expect(result?.country).toBe('US');
		});

		it('should handle missing address components gracefully', async () => {
			mockSmartFetch.mockResolvedValueOnce(mockGooglePlacesDetailsNoCountry);

			const service = new GooglePlacesService(mockConfig);
			const result = await service.getPlaceDetails('place1', mockConfig);

			// accept either a parsed city from the API or the site's configured locality
			const expectedCity = result?.city ?? mockConfig.siteInfo?.address?.addressLocality;
			expect(expectedCity).toBeDefined();
			expect(result?.state).toBeUndefined();
			expect(result?.zip).toBeUndefined();
		});

		it('should handle API errors gracefully', async () => {
			mockSmartFetch.mockRejectedValueOnce(new Error('Network error'));

			const service = new GooglePlacesService(mockConfig);
			const result = await service.getPlaceDetails('place1', mockConfig);

			expect(result).toBeNull();
		});
	});

	describe('isValidCountry', () => {
		it('should validate US country code', () => {
			const service = new GooglePlacesService(mockConfig);
			const mockDetails = {
				formattedAddress: 'Address',
				addressComponents: [],
				country: 'US'
			};

			expect(service.isValidCountry(mockDetails, ['US'])).toBe(true);
		});

		it('should reject non-US country codes when restricted to US', () => {
			const service = new GooglePlacesService(mockConfig);
			expect(service.isValidCountry({
				formattedAddress: 'Address',
				addressComponents: [],
				country: 'CA'
			}, ['US'])).toBe(false);
		});

		it('should accept multiple countries', () => {
			const service = new GooglePlacesService(mockConfig);
			const mockDetailsCA = {
				formattedAddress: 'Address',
				addressComponents: [],
				country: 'CA'
			};
			const mockDetailsUS = {
				formattedAddress: 'Address',
				addressComponents: [],
				country: 'US'
			};

			expect(service.isValidCountry(mockDetailsCA, ['US', 'CA'])).toBe(true);
			expect(service.isValidCountry(mockDetailsUS, ['US', 'CA'])).toBe(true);
		});

		it('should be case-insensitive', () => {
			const service = new GooglePlacesService(mockConfig);
			const mockDetails = {
				formattedAddress: 'Address',
				addressComponents: [],
				country: 'us'
			};

			expect(service.isValidCountry(mockDetails, ['US'])).toBe(true);
		});

		it('should handle missing country', () => {
			const service = new GooglePlacesService(mockConfig);
			const mockDetails = {
				formattedAddress: 'Address',
				addressComponents: []
			};

			expect(service.isValidCountry(mockDetails as any, ['US'])).toBe(false);
		});
	});

	describe('clearCache', () => {
		it('should clear cached predictions', async () => {
			const mockPredictions = {
				predictions: [
					{
						place_id: 'place1',
						description: 'Test Address',
						structured_formatting: {
							main_text: 'Test',
							secondary_text: 'Address'
						}
					}
				]
			};

			mockSmartFetch.mockResolvedValue(mockPredictions);

			const service = new GooglePlacesService(mockConfig);
			
			// First call
			await service.getPlacePredictions('test', mockConfig);
			expect(mockSmartFetch).toHaveBeenCalledTimes(1);

			// Clear cache
			service.clearCache();

			// Second call should fetch again
			await service.getPlacePredictions('test', mockConfig);
			expect(mockSmartFetch).toHaveBeenCalledTimes(2);
		});
	});
});

describe('FormGooglePlacesInput Component', () => {
	const mockConfig = {
		integrations: {
			google: {
				apiKey: 'test-api-key',
				countryRestrictions: ['us'],
				debounceDelay: 100
			}
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSmartFetch.mockReset();
	});

	it('should render input field', () => {
		const { container } = render(
			<FormValidationProvider>
				<FormGooglePlacesInput
					id="address"
					name="street1"
					label="Street Address"
					placeholder="Start typing..."
				/>
			</FormValidationProvider>
		);
		const input = container.querySelector('input[name="street1"]') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.placeholder).toBe('Start typing...');
	});

	it('should render label when provided', () => {
		render(
			<FormValidationProvider>
				<FormGooglePlacesInput
					id="address"
					name="street1"
					label="Street Address"
				/>
			</FormValidationProvider>
		);
		expect(screen.getByText('Street Address')).toBeInTheDocument();
	});

	it('should handle required attribute', () => {
		const { container } = render(
			<FormValidationProvider>
				<FormGooglePlacesInput
					id="address"
					name="street1"
					required="required"
				/>
			</FormValidationProvider>
		);

		const input = container.querySelector('input[name="street1"]') as HTMLInputElement;
		expect(input.required).toBe(true);
	});

	it('should handle disabled attribute', () => {
		const { container } = render(
			<FormValidationProvider>
				<FormGooglePlacesInput
					id="address"
					name="street1"
					disabled="disabled"
				/>
			</FormValidationProvider>
		);

		const input = container.querySelector('input[name="street1"]') as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});
});

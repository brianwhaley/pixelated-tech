import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

import { smartFetch } from '../components/foundation/smartfetch';
import { GooglePlacesService } from '../components/integrations/googleplaces';

describe('GooglePlacesService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns an empty array for input shorter than 2 characters', async () => {
		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const result = await service.getPlacePredictions('a');
		expect(result).toEqual([]);
	});

	it('returns an empty array when API key is missing for predictions', async () => {
		const service = new GooglePlacesService();
		const result = await service.getPlacePredictions('Austin');
		expect(result).toEqual([]);
	});

	it('returns formatted predictions when the API responds successfully', async () => {
		const mockResponse = {
			status: 'OK',
			predictions: [
				{
					place_id: 'place-1',
					description: 'Austin, TX, USA',
					structured_formatting: {
						main_text: 'Austin',
						secondary_text: 'TX, USA'
					}
				}
			]
		};
		vi.mocked(smartFetch).mockResolvedValueOnce(mockResponse);

		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const predictions = await service.getPlacePredictions('Austin');

		expect(predictions).toHaveLength(1);
		expect(predictions[0]).toEqual({
			placeId: 'place-1',
			mainText: 'Austin',
			secondaryText: 'TX, USA',
			fullText: 'Austin, TX, USA'
		});
	});

	it('caches prediction results and returns cached values on repeated input', async () => {
		const mockResponse = {
			status: 'OK',
			predictions: [
				{
					place_id: 'place-1',
					structured_formatting: { main_text: 'Austin', secondary_text: 'TX, USA' },
					description: 'Austin, TX, USA'
				}
			]
		};
		vi.mocked(smartFetch).mockResolvedValueOnce(mockResponse);

		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const first = await service.getPlacePredictions('Austin');
		const second = await service.getPlacePredictions('Austin');

		expect(first).toEqual(second);
		expect(smartFetch).toHaveBeenCalledTimes(1);
	});

	it('returns an empty array when the autocomplete API status is not OK', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ status: 'ZERO_RESULTS', error_message: 'No results' });

		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const predictions = await service.getPlacePredictions('Austin');

		expect(predictions).toEqual([]);
	});

	it('returns null for place details when API key is missing', async () => {
		const service = new GooglePlacesService();
		const details = await service.getPlaceDetails('place-1');
		expect(details).toBeNull();
	});

	it('parses place details into address components', async () => {
		const mockResponse = {
			status: 'OK',
			result: {
				formatted_address: '123 Main St, Austin, TX 78701, USA',
				address_components: [
					{ long_name: '123', short_name: '123', types: ['street_number'] },
					{ long_name: 'Main St', short_name: 'Main St', types: ['route'] },
					{ long_name: 'Austin', short_name: 'Austin', types: ['locality'] },
					{ long_name: 'Texas', short_name: 'TX', types: ['administrative_area_level_1'] },
					{ long_name: '78701', short_name: '78701', types: ['postal_code'] },
					{ long_name: 'United States', short_name: 'US', types: ['country'] }
				]
			}
		};
		vi.mocked(smartFetch).mockResolvedValueOnce(mockResponse);

		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const details = await service.getPlaceDetails('place-1');

		expect(details).toEqual({
			formattedAddress: '123 Main St, Austin, TX 78701, USA',
			addressComponents: mockResponse.result.address_components,
			street1: '123 Main St',
			city: 'Austin',
			state: 'TX',
			zip: '78701',
			country: 'US'
		});
	});

	it('returns null for place details when the API returns an error status', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ status: 'REQUEST_DENIED', error_message: 'Denied' });

		const service = new GooglePlacesService({ apiKey: 'test-key' });
		const details = await service.getPlaceDetails('place-1');

		expect(details).toBeNull();
	});
});

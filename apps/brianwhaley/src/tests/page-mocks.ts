import config from '@/app/config/pixelated.config.json';
import { createAppTestHelpers } from '../../../../shared/test-utils/page-mocks';

export { config };

const appTestHelpers = createAppTestHelpers(config);
export const {
	mockState,
	resetMockState,
	setFileDataState,
	resetFileDataState,
	setPixelatedConfigOverride,
	resetPixelatedConfigOverride,
	setGoogleReviewsResponse,
	resetGoogleReviewsResponse,
	setContentfulEntriesResponse,
	setContentfulEntryResponse,
	setContentfulImagesResponse,
	setBuildEventSchema,
	resetContentfulMocks,
} = appTestHelpers;

const defaultFlickrCards = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 2,
		image: 'https://example.com/a.jpg',
		imageAlt: 'zz',
		subHeaderText: 'A',
	},
	{
		index: 1,
		cardIndex: 1,
		cardLength: 2,
		image: 'https://example.com/b.jpg',
		imageAlt: 'aa',
		subHeaderText: 'B',
	},
];

export const createPageComponentMocks = (overrides: Record<string, any> = {}) =>
	appTestHelpers.createPageComponentMocks({
		GetFlickrData: async () => [{ id: '1', title: 'test' }],
		GenerateFlickrCards: () => [
			{
				index: 0,
				cardIndex: 0,
				cardLength: 1,
				image: 'https://example.com/test.jpg',
				imageAlt: 'Test image',
				subHeaderText: 'Test card',
			},
		],
		FlickrWrapper: async ({ callback }: any) => {
			if (typeof callback === 'function') {
				callback(defaultFlickrCards);
			}
			return defaultFlickrCards;
		},
		...overrides,
	});

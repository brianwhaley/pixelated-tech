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

export const createPageComponentMocks = appTestHelpers.createPageComponentMocks;

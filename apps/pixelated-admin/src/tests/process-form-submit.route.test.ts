import { beforeEach, describe, expect, it, vi } from 'vitest';

const processFormSubmissionRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components/server')>('@pixelated-tech/components/server');
	return {
		...actual,
		processFormSubmissionRequest: processFormSubmissionRequestMock,
	};
});

import { OPTIONS, POST } from '@/app/api/process-form-submit/route';

describe('process form submit route', () => {
	beforeEach(() => {
		processFormSubmissionRequestMock.mockReset();
	});

	it('delegates POST and OPTIONS to the shared server handler', () => {
		expect(POST).toBe(processFormSubmissionRequestMock);
		expect(OPTIONS).toBe(processFormSubmissionRequestMock);
	});
});
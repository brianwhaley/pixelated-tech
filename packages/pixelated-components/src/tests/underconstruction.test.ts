import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: vi.fn() }));

import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../components/config/config';
import { isUnderConstruction } from '../components/structure/underconstruction.server';

const headersMock = headers as unknown as Mock;
const configMock = getFullPixelatedConfig as unknown as Mock;

describe('isUnderConstruction', () => {
	beforeEach(() => {
		headersMock.mockReset();
		configMock.mockReset();
		vi.stubEnv('UNDER-CONSTRUCTION', undefined);
		vi.stubEnv('UNDER_CONSTRUCTION', undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns false when the env var is not true', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'false');
		headersMock.mockReturnValue({ get: () => 'www.example.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns false when request is localhost', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: () => 'localhost:3000' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns false when request is amplifyapp preview host', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: () => 'main.d123abc.amplifyapp.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns true when env is true and request host matches config site url', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: () => 'www.example.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(true);
	});
});

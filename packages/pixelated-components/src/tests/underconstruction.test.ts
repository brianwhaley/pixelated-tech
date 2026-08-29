import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen } from '../test/test-utils';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: vi.fn() }));

import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../components/config/config';
import { isUnderConstruction } from '../components/structure/underconstruction.server';
import { UnderConstruction } from '../components/structure/underconstruction';

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
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-proto' ? 'https' : 'www.example.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns false when request is localhost', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-proto' ? 'https' : 'localhost:3000' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns false when request is amplifyapp preview host', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-host' ? null : key === 'x-forwarded-proto' ? 'https' : 'main.d123abc.amplifyapp.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns false when x-forwarded-host is an Amplify preview host', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-host' ? 'main.d123abc.amplifyapp.com' : key === 'x-forwarded-proto' ? 'https' : null });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(false);
	});

	it('returns true when env is true and request host matches config site url', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-host' ? null : key === 'x-forwarded-proto' ? 'https' : 'www.example.com' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(true);
	});

	it('returns true when env is true and request origin includes default https port', async () => {
		vi.stubEnv('UNDER_CONSTRUCTION', 'true');
		headersMock.mockReturnValue({ get: (key: string) => key === 'x-forwarded-host' ? null : key === 'x-forwarded-proto' ? 'https' : 'www.example.com:443' });
		configMock.mockReturnValue({ siteInfo: { url: 'https://www.example.com' } });

		expect(await isUnderConstruction()).toBe(true);
	});
});

describe('UnderConstruction component', () => {
	it('renders an under construction callout with title and subtitle', () => {
		render(React.createElement(UnderConstruction));

		expect(screen.getByText('Under Construction')).toBeInTheDocument();
		expect(screen.getByText("We're working hard to bring you something amazing. Check back soon!")).toBeInTheDocument();
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

let mockParams: Record<string, string> = {};

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('?installed=true'),
	usePathname: () => '/',
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
	useParams: () => mockParams,
}));

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import EbayItem from '@/app/(pages)/store/[item]/page';

describe('PixelVivid service and store route coverage', () => {
	beforeEach(() => {
		resetMockState();
		mockParams = {};
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the services page and content list', async () => {
		render(<ServicesPage />);

		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getByText(/Our Services/)).not.toBeNull();
	});

	it('renders the service areas page and content list', async () => {
		render(<ServiceAreasPage />);

		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getByText(/Our Service Areas/)).not.toBeNull();
	});

	it('renders a known service detail route', async () => {
		mockParams = { service: 'custom-upcycled-sunglasses' };
		render(<ServiceDetailPage />);

		await waitFor(() => expect(screen.getByTestId('mock-servicedetailpage')).not.toBeNull());
		expect(screen.getByTestId('page-title-header').textContent).toContain('Custom Upcycled Sunglasses');
	});

	it('renders a service detail fallback for an unknown slug', async () => {
		mockParams = { service: 'missing-service' };
		render(<ServiceDetailPage />);

		await waitFor(() => expect(screen.getByText(/Service not found/)).not.toBeNull());
	});

	it('renders a known service area detail route', async () => {
		mockParams = { serviceArea: 'us-nationwide-shipping' };
		render(<ServiceAreaDetailPage />);

		await waitFor(() => expect(screen.getByTestId('mock-serviceareadetailpage')).not.toBeNull());
		expect(screen.getByTestId('page-title-header').textContent).toContain('US Nationwide Shipping');
	});

	it('renders a service area detail fallback for an unknown slug', async () => {
		mockParams = { serviceArea: 'missing-area' };
		render(<ServiceAreaDetailPage />);

		await waitFor(() => expect(screen.getByText(/Service area not found/)).not.toBeNull());
	});

	it('renders a numeric ebay item detail route', async () => {
		await act(async () => {
			render(<EbayItem params={Promise.resolve({ item: '123456789012' } as any)} />);
		});

		await waitFor(() => expect(screen.getByTestId('mock-ebayitemdetail')).not.toBeNull());
	});

	it('renders a contentful ebay item detail route', async () => {
		await act(async () => {
			render(<EbayItem params={Promise.resolve({ item: 'custom-item' } as any)} />);
		});

		await waitFor(() => expect(screen.getByTestId('mock-contentfulitemdetail')).not.toBeNull());
	});
});

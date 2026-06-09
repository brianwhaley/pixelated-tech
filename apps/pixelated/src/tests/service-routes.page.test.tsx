import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';
import { PixelatedClientConfigProvider } from '@pixelated-tech/components';

const renderWithConfig = (ui: React.ReactElement) =>
	render(
		<PixelatedClientConfigProvider config={{ global: {} } as any}>
			{ui}
		</PixelatedClientConfigProvider>,
	);

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
import ServiceDetailRoute from '@/app/(pages)/services/[service]/page';
import ServiceAreaDetailRoute from '@/app/(pages)/service-areas/[serviceArea]/page';

describe('Pixelated service route coverage', () => {
	beforeEach(() => {
		resetMockState();
		mockParams = {};
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the services list page and service content', async () => {
		renderWithConfig(<ServicesPage />);

		await waitFor(() => expect(screen.getByTestId('mock-services')).not.toBeNull());
		expect(screen.getByText(/Pixelated Technologies Services/)).not.toBeNull();
		expect(screen.getByText(/Click a service to read more about how it works for your business./)).not.toBeNull();
	});

	it('renders the service areas list page and service area content', async () => {
		renderWithConfig(<ServiceAreasPage />);

		await waitFor(() => expect(screen.getByTestId('mock-serviceareas')).not.toBeNull());
		expect(screen.getByText(/Pixelated Technologies Service Areas/)).not.toBeNull();
		expect(screen.getByText(/Click a service area to see the local coverage and specialties for that region./)).not.toBeNull();
	});

	it('renders a service detail route for a known service', async () => {
		mockParams = { service: 'web-development' };
		renderWithConfig(<ServiceDetailRoute />);

		await waitFor(() => expect(screen.getByTestId('mock-servicedetailpage')).not.toBeNull());
		expect(screen.getByTestId('page-title-header').textContent).toContain('Web Development');
	});

	it('renders a service detail fallback for an unknown service slug', async () => {
		mockParams = { service: 'missing-service' };
		renderWithConfig(<ServiceDetailRoute />);

		await waitFor(() => expect(screen.getByText(/Service not found/)).not.toBeNull());
	});

	it('renders a service area detail route for a known service area', async () => {
		mockParams = { serviceArea: 'denville-nj' };
		renderWithConfig(<ServiceAreaDetailRoute />);

		await waitFor(() => expect(screen.getByTestId('mock-serviceareadetailpage')).not.toBeNull());
		expect(screen.getByTestId('page-title-header').textContent).toContain('Denville NJ');
	});

	it('renders a service area fallback for an unknown service area slug', async () => {
		mockParams = { serviceArea: 'missing-area' };
		renderWithConfig(<ServiceAreaDetailRoute />);

		await waitFor(() => expect(screen.getByText(/Service area not found/)).not.toBeNull());
	});
});

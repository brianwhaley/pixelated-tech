import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

const params: Record<string, string> = {};

vi.mock('next/navigation', () => ({
	useParams: () => params,
}));

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());
vi.mock('@/app/data/siteconfig.json', () => ({
	__esModule: true,
	default: {
		siteInfo: {
			serviceAreas: [
				{ name: 'Metro Service Area', slug: 'metro-service-area' },
				{ name: 'Coastal Service Area', slug: 'coastal-service-area' },
				{ name: 'Regional Service Area', slug: 'regional-service-area' },
			],
			services: [
				{ name: 'Website Design and Development', slug: 'website-design-and-development' },
				{ name: 'Local SEO and Marketing', slug: 'local-seo-and-marketing' },
				{ name: 'Other Stuff and Things', slug: 'other-stuff-and-things' },
			],
		},
	},
}));

import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailRoute from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailRoute from '@/app/(pages)/services/[service]/page';

describe('pixelated-template service routes', () => {
	beforeEach(() => {
		params.serviceArea = 'metro-service-area';
		params.service = 'website-design-and-development';
	});

	it('renders the service areas index page', () => {
		render(<ServiceAreasPage />);
		expect(screen.getByTestId('mock-serviceareaslist')).toBeTruthy();
		expect(screen.getAllByTestId('mock-servicearea').length).toBeGreaterThan(0);
	});

	it('renders a service area detail route when slug exists', async () => {
		await act(async () => {
			render(<ServiceAreaDetailRoute />);
		});
		expect(screen.getByTestId('mock-serviceareadetailpage')).toBeTruthy();
	});

	it('renders a not found message when service area slug does not exist', async () => {
		params.serviceArea = 'unknown-area';
		await act(async () => {
			render(<ServiceAreaDetailRoute />);
		});
		expect(screen.getByText('Service area not found. Please return to the service areas list and choose another region.')).toBeTruthy();
	});

	it('renders a service detail route when slug exists', async () => {
		await act(async () => {
			render(<ServiceDetailRoute />);
		});
		expect(screen.getByTestId('mock-servicedetailpage')).toBeTruthy();
	});

	it('renders a not found message when service slug does not exist', async () => {
		params.service = 'unknown-service';
		await act(async () => {
			render(<ServiceDetailRoute />);
		});
		expect(screen.getByText('Service not found. Please return to the services list and choose another option.')).toBeTruthy();
	});
});

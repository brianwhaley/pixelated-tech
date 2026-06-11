import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createPageComponentMocks, setPixelatedConfigOverride } from '@/test/page-mocks';

const params: Record<string, string | undefined> = {};

vi.mock('next/navigation', () => ({
	useParams: () => params,
}));

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';

describe('JZ Home Improvement service routes', () => {
	beforeEach(() => {
		params.serviceArea = 'union-nj';
		params.service = 'kitchens';
	});

	afterEach(() => {
		setPixelatedConfigOverride(undefined);
	});

	it('renders the service areas index page', () => {
		render(<ServiceAreasPage />);
		expect(screen.getByTestId('mock-serviceareas')).toBeTruthy();
		expect(screen.getAllByTestId('mock-servicearea').length).toBeGreaterThan(0);
	});

	it('renders a service area detail route when service area slug exists', async () => {
		await act(async () => {
			render(<ServiceAreaDetailPage />);
		});
		expect(screen.getByTestId('mock-serviceareadetailpage')).toBeTruthy();
	});

	it('renders a service area detail route when no service area slug is provided', async () => {
		params.serviceArea = undefined;
		await act(async () => {
			render(<ServiceAreaDetailPage />);
		});
		expect(screen.getByText('Service area not found. Please return to the service areas list and choose another region.')).toBeTruthy();
	});

	it('renders a service area detail route when an explicit slug field is present', async () => {
		setPixelatedConfigOverride({
			siteInfo: {
				serviceAreas: [
					{ name: 'Custom Area', slug: 'custom-area' }
				],
				services: [],
			},
		});
		params.serviceArea = 'custom-area';
		await act(async () => {
			render(<ServiceAreaDetailPage />);
		});
		expect(screen.getByTestId('mock-serviceareadetailpage')).toBeTruthy();
	});

	it('renders a not found message when service area slug does not exist', async () => {
		params.serviceArea = 'unknown-area';
		await act(async () => {
			render(<ServiceAreaDetailPage />);
		});
		expect(screen.getByText('Service area not found. Please return to the service areas list and choose another region.')).toBeTruthy();
	});

	it('renders a service detail route when service slug exists', async () => {
		await act(async () => {
			render(<ServiceDetailPage />);
		});
		expect(screen.getByTestId('mock-servicedetailpage')).toBeTruthy();
	});
	it('renders a service detail route when no service slug is provided', async () => {
		params.service = undefined;
		await act(async () => {
			render(<ServiceDetailPage />);
		});
		expect(screen.getByText('Service not found. Please return to the services list and choose another option.')).toBeTruthy();
	});

	it('renders a service detail route when an explicit slug field is present', async () => {
		setPixelatedConfigOverride({
			siteInfo: {
				services: [
					{ name: 'Custom Kitchens', slug: 'custom-kitchens' }
				],
				source: 'override',
			},
		});
		params.service = 'custom-kitchens';
		await act(async () => {
			render(<ServiceDetailPage />);
		});
		expect(screen.getByTestId('mock-servicedetailpage')).toBeTruthy();
	});
	it('renders a not found message when service slug does not exist', async () => {
		params.service = 'unknown-service';
		await act(async () => {
			render(<ServiceDetailPage />);
		});
		expect(screen.getByText('Service not found. Please return to the services list and choose another option.')).toBeTruthy();
	});
});

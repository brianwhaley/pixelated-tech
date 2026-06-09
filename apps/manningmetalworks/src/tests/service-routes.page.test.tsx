import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

const params: Record<string, string> = {};

vi.mock('next/navigation', () => ({
	useParams: () => params,
}));

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailRoute from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailRoute from '@/app/(pages)/services/[service]/page';

describe('Manning Metalworks service routes', () => {
	beforeEach(() => {
		params.serviceArea = 'morris-plains-nj';
		params.service = 'precision-metal-fabrication';
	});

	it('renders the service areas index page', () => {
		render(<ServiceAreasPage />);
		expect(screen.getByTestId('mock-serviceareas')).toBeTruthy();
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

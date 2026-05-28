import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<any>('@pixelated-tech/components');
	return {
		...actual,
		PageTitleHeader: ({ title }: any) => React.createElement('div', { 'data-testid': 'page-title' }, title),
		PageSection: ({ children }: any) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		PageSectionHeader: ({ title }: any) => React.createElement('div', { 'data-testid': 'section-header' }, title),
	};
});

describe('events report page', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('queries the expected Dynamo table and renders the report table', async () => {
		const server = await import('@pixelated-tech/components/server');
		const listSpy = vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockResolvedValue([
			{
				domain: 'thethreemusesofbluffton.com',
				formName: 'The Three Muses of Bluffton Order Form',
				created_at: '2026-05-05T10:00:00.000Z',
				registration_data: {
					child_name: 'Grace Sturkie',
					child_birthdate: '2017-10-21',
				},
				items: [
					{
						id: '2026-SC08',
						title: 'SLEEPOVER SQUAD CAMP',
						quantity: 1,
					},
				],
			},
		]);

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(listSpy).toHaveBeenCalledWith({
			tableName: 'PixelatedFormSubmissionsTable',
			domain: 'thethreemusesofbluffton.com',
			formName: 'The Three Muses of Bluffton Order Form',
		});
		expect(screen.getByTestId('page-title').textContent).toBe('Three Muses Order Report');
		expect(screen.getAllByTestId('section-header')[0].textContent).toBe('Registrants Per Class');
		expect(screen.getAllByTestId('section-header')[1].textContent).toBe('Event Registrations ( 1 )');
		expect(document.getElementById('three-muses-order-report')).toBeTruthy();
		expect(document.getElementById('three-muses-event-report')).toBeTruthy();
		expect(document.getElementById('three-muses-event-report-Registrants-2-0')).toBeTruthy();
		expect(screen.getByText('Registrants Per Class')).toBeTruthy();
		expect(screen.getByText('2026-SC08 - SLEEPOVER SQUAD CAMP')).toBeTruthy();
		expect(screen.getByText('Attendee')).toBeTruthy();
		expect(screen.getByText('Parent / guardian')).toBeTruthy();
	}, 15000);

	it('renders plural rows in descending date order', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockResolvedValue([
			{
				created_at: '2026-05-05T10:00:00.000Z',
				items: [{ id: 'event-b', title: 'Event B', quantity: 1 }],
				shipping_to: { name: 'Adult Two', child_name: 'Kid Two' },
				registration_data: { child_name: 'Kid Two' },
			},
			{
				created_at: '2026-05-04T10:00:00.000Z',
				items: [{ id: 'event-a', title: 'Event A', quantity: 1 }],
				shipping_to: { name: 'Adult One' },
			},
		]);

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(screen.getAllByTestId('section-header')[1].textContent).toBe('Event Registrations ( 2 )');
		expect(document.getElementById('three-muses-order-report')?.textContent).toContain('2026-05-05T10:00:00.000Z');
		expect(document.getElementById('three-muses-event-report')).toBeTruthy();
		expect(document.querySelector('#three-muses-event-report tbody > tr:first-child')?.textContent).toContain('event-a - Event A');
		expect(document.getElementById('three-muses-event-report-Registrants-2-0')?.textContent).toContain('Adult One');
	});

	it('renders the empty-state message when no rows are returned', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockResolvedValue([]);

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(screen.getAllByTestId('section-header')[1].textContent).toBe('Event Registrations ( 0 )');
		expect(screen.getByText('No matching form submissions were found.')).toBeTruthy();
	});

	it('renders the error state when report loading fails', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockRejectedValue(new Error('Database unavailable'));

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(screen.getByText('Unable to load the report: Database unavailable')).toBeTruthy();
	});
});
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => ({
	__esModule: true,
	PageTitleHeader: ({ title }: any) => React.createElement('div', { 'data-testid': 'page-title' }, title),
	PageSection: ({ children }: any) => React.createElement('section', { 'data-testid': 'page-section' }, children),
	PageSectionHeader: ({ title }: any) => React.createElement('div', { 'data-testid': 'section-header' }, title),
	Table: ({ data }: any) => React.createElement('div', { 'data-testid': 'report-table', 'data-count': String(data.length) }, JSON.stringify(data)),
}));

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
				orderData_json: '{"items":[]}',
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
		expect(screen.getByTestId('section-header').textContent).toBe('1 form submission');
		expect(screen.getByTestId('report-table').getAttribute('data-count')).toBe('1');
	});

	it('renders plural rows in descending date order', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockResolvedValue([
			{
				created_at: '2026-05-04T10:00:00.000Z',
				orderData_json: '{"items":[{"id":1}]}',
			},
			{
				updatedAt: '2026-05-05T10:00:00.000Z',
				orderData_json: '{"items":[{"id":2}]}',
			},
		]);

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(screen.getByTestId('section-header').textContent).toBe('2 form submissions');
		expect(screen.getByTestId('report-table').getAttribute('data-count')).toBe('2');
		expect(screen.getByTestId('report-table').textContent).toContain('2026-05-05T10:00:00.000Z');
	});

	it('renders the empty-state message when no rows are returned', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'listPixelatedFormSubmissionReportRows').mockResolvedValue([]);

		const { default: EventReportPage } = await import('@/app/(pages)/events/report/page');
		const element = await EventReportPage();
		render(element);

		expect(screen.getByTestId('section-header').textContent).toBe('0 form submissions');
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
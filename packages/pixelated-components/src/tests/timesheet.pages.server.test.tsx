import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectRenderSuccess, renderWithoutProviders as render, screen } from '../test/test-utils';

const mocks = vi.hoisted(() => ({
	cookies: vi.fn(),
	redirect: vi.fn(),
	getAuthenticatedTimesheetUser: vi.fn(),
	getTimesheetForWeek: vi.fn(),
	isTimesheetAdmin: vi.fn(),
	listAdminTimesheets: vi.fn(),
	listUserTimesheets: vi.fn(),
	saveTimesheet: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('../components/elements/index.elements', () => ({
	Table: ({ data }: { data: Array<Record<string, string>> }) => <div data-testid="table">{JSON.stringify(data)}</div>,
	MenuSimple: () => <nav>timesheet menu</nav>,
}));
vi.mock('../components/structure/page-blocks', () => ({
	PageSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
	PageSectionHeader: ({ title }: { title: string }) => <h2>{title}</h2>,
}));
vi.mock('../components/admin/timesheet/timesheet.components', () => ({
	TimesheetEmailForm: () => <div>email form</div>,
	TimesheetEntryForm: ({ weekOf }: { weekOf: string }) => <div>entry form {weekOf}</div>,
	TimesheetPasscodeForm: ({ email }: { email: string }) => <div>passcode form {email}</div>,
	TimesheetWeekSelector: ({ weekOf }: { weekOf: string }) => <div>week selector {weekOf}</div>,
}));
vi.mock('../components/admin/timesheet/timesheet.server', () => ({
	getAuthenticatedTimesheetUser: mocks.getAuthenticatedTimesheetUser,
	getTimesheetForWeek: mocks.getTimesheetForWeek,
	isTimesheetAdmin: mocks.isTimesheetAdmin,
	listAdminTimesheets: mocks.listAdminTimesheets,
	listUserTimesheets: mocks.listUserTimesheets,
	saveTimesheet: mocks.saveTimesheet,
}));

import {
	TimesheetAdminPage,
	TimesheetLoginPage,
	TimesheetNewPage,
	TimesheetSummaryPage,
} from '../components/admin/timesheet/timesheet.pages.server';

describe('timesheet server pages', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.cookies.mockResolvedValue({
			get: vi.fn().mockReturnValue(undefined),
		});
		mocks.redirect.mockImplementation((path: string) => {
			throw new Error(`redirect:${path}`);
		});
	});

	it('renders email and passcode login states', async () => {
		const emailPage = await TimesheetLoginPage({ searchParams: Promise.resolve({}) });
		const { container } = render(emailPage);
		expectRenderSuccess(container);
		expect(screen.getByText('email form')).toBeInTheDocument();

		mocks.cookies.mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: 'worker@example.com' }),
		});
		const passcodePage = await TimesheetLoginPage({ searchParams: Promise.resolve({ error: 'invalid' }) });
		render(passcodePage);
		expect(screen.getByText('That email or passcode could not be verified.')).toBeInTheDocument();
		expect(screen.getByText('passcode form worker@example.com')).toBeInTheDocument();
	});

	it('renders user summaries and redirects unauthenticated users', async () => {
		mocks.getAuthenticatedTimesheetUser.mockResolvedValue({
			email: 'worker@example.com',
			role: 'user',
		});
		mocks.listUserTimesheets.mockResolvedValue([
			{ weekOf: '2026-11-08', totalHours: '8', updatedAt: '2026-11-14' },
		]);
		const page = await TimesheetSummaryPage({ domain: 'example.com' });
		render(page);
		expect(screen.getByTestId('table')).toHaveTextContent('2026-11-08');

		mocks.getAuthenticatedTimesheetUser.mockResolvedValue(null);
		await expect(TimesheetSummaryPage({ domain: 'example.com' })).rejects.toThrow('redirect:/timesheets');
	});

	it('renders and submits a new timesheet', async () => {
		mocks.getAuthenticatedTimesheetUser.mockResolvedValue({
			email: 'worker@example.com',
			role: 'user',
		});
		mocks.getTimesheetForWeek.mockResolvedValue(null);
		const page = await TimesheetNewPage({
			domain: 'example.com',
			searchParams: Promise.resolve({ weekOf: '2026-11-12' }),
		});
		render(page);
		expect(screen.getByText('entry form 2026-11-08')).toBeInTheDocument();

		mocks.getTimesheetForWeek.mockResolvedValue({ createdAt: '2026-11-01' });
		await expect(TimesheetNewPage({
			domain: 'example.com',
			searchParams: Promise.resolve({
				action: 'submit',
				weekOf: '2026-11-12',
				sun: '8',
				mon: '0',
				tue: '0',
				wed: '0',
				thu: '0',
				fri: '0',
				sat: '0',
			}),
		})).rejects.toThrow('redirect:/timesheets/summary');
		expect(mocks.saveTimesheet).toHaveBeenCalled();
	});

	it('enforces admin access and renders the selected week', async () => {
		mocks.getAuthenticatedTimesheetUser.mockResolvedValue({ email: 'worker@example.com', role: 'user' });
		mocks.isTimesheetAdmin.mockResolvedValue(false);
		const unauthorized = await TimesheetAdminPage({
			domain: 'example.com',
			searchParams: Promise.resolve({}),
		});
		render(unauthorized);
		expect(screen.getByText('You do not have access to this page.')).toBeInTheDocument();

		mocks.getAuthenticatedTimesheetUser.mockResolvedValue({ email: 'admin@example.com', role: 'admin' });
		mocks.isTimesheetAdmin.mockResolvedValue(true);
		mocks.listAdminTimesheets.mockResolvedValue([]);
		const authorized = await TimesheetAdminPage({
			domain: 'example.com',
			searchParams: Promise.resolve({ weekOf: '2026-11-12' }),
		});
		render(authorized);
		expect(screen.getByText('week selector 2026-11-08')).toBeInTheDocument();
	});
});

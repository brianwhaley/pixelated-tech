import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	getAuthenticatedTimesheetUser,
	getFullPixelatedConfig,
	createTimesheetAuthHandlers,
	cookieGet,
	headerGet,
	redirect,
} = vi.hoisted(() => ({
	getAuthenticatedTimesheetUser: vi.fn(),
	getFullPixelatedConfig: vi.fn(),
	createTimesheetAuthHandlers: vi.fn(),
	cookieGet: vi.fn(),
	headerGet: vi.fn(),
	redirect: vi.fn((path: string) => {
		throw new Error(`REDIRECT:${path}`);
	}),
}));

vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components/server')>('@pixelated-tech/components/server');
	return {
		...actual,
		getAuthenticatedTimesheetUser,
		getFullPixelatedConfig,
		createTimesheetAuthHandlers,
		DEFAULT_PASSCODE_COOKIE: 'timesheet-passcode',
		TimesheetLoginPage: ({ searchParams }: { searchParams: Promise<unknown> }) => <div data-testid="login-page">{String(searchParams instanceof Promise)}</div>,
		TimesheetNewPage: ({ domain }: { domain: string }) => <div data-testid="new-page">{domain}</div>,
		TimesheetSummaryPage: ({ domain }: { domain: string }) => <div data-testid="summary-page">{domain}</div>,
		TimesheetAdminPage: ({ domain }: { domain: string }) => <div data-testid="admin-page">{domain}</div>,
	};
});

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		...actual,
		MenuSimple: ({ menuItems }: { menuItems: Array<{ name: string }> }) => <nav>{menuItems.map(item => <span key={item.name}>{item.name}</span>)}</nav>,
		PageSection: ({ children, id }: { children: React.ReactNode; id?: string }) => <section id={id ?? 'test-page-section'}>{children}</section>,
		PageTitleHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
		PixelatedFooter: ({ pathname }: { pathname: string }) => <span data-testid="pixelated-footer">{pathname}</span>,
		SmartImage: () => <img alt="AMAVA Janitorial Logo" />,
	};
});

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({ get: cookieGet })),
	headers: vi.fn(async () => ({ get: headerGet })),
}));

vi.mock('next/navigation', () => ({ redirect }));

import TimesheetsLayout from '@/app/timesheets/layout';
import TimesheetsPage from '@/app/timesheets/page';
import * as authRoute from '@/app/timesheets/auth/route';
import TimesheetsLoginPage from '@/app/timesheets/login/page';
import TimesheetNewPageWrapper from '@/app/timesheets/new/page';
import TimesheetSummaryPageWrapper from '@/app/timesheets/summary/page';
import TimesheetAdminPageWrapper from '@/app/timesheets/admin/page';

describe('Amava timesheet adapters', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cookieGet.mockReturnValue({ value: 'test-passcode' });
		headerGet.mockReturnValue('/timesheets/summary/');
		getAuthenticatedTimesheetUser.mockResolvedValue({ role: 'user' });
		getFullPixelatedConfig.mockResolvedValue({
			siteInfo: { name: 'AMAVA Janitorial', url: 'https://www.amavajanitorial.com' },
		});
	});

	it('redirects unauthenticated users to login', async () => {
		getAuthenticatedTimesheetUser.mockResolvedValue(null);

		await expect(TimesheetsPage()).rejects.toThrow('REDIRECT:/timesheets/login');
	});

	it('redirects regular and admin users to their respective summaries', async () => {
		await expect(TimesheetsPage()).rejects.toThrow('REDIRECT:/timesheets/summary');

		getAuthenticatedTimesheetUser.mockResolvedValue({ role: 'admin' });
		await expect(TimesheetsPage()).rejects.toThrow('REDIRECT:/timesheets/admin');
	});

	it('renders the authenticated layout with admin navigation and normalized pathname', async () => {
		getAuthenticatedTimesheetUser.mockResolvedValue({ role: 'admin' });

		render(await TimesheetsLayout({ children: <div>Timesheet content</div> }));

		expect(screen.getByText('Admin View')).toBeInTheDocument();
		expect(screen.getByText('Timesheet content')).toBeInTheDocument();
		expect(screen.getByTestId('pixelated-footer')).toHaveTextContent('/timesheets/summary');
	});

	it('renders the regular user menu without admin navigation', async () => {
		getAuthenticatedTimesheetUser.mockResolvedValue({ role: 'user' });

		render(await TimesheetsLayout({ children: <div>Timesheet content</div> }));

		expect(screen.getByText('My Timesheets')).toBeInTheDocument();
		expect(screen.queryByText('Admin View')).not.toBeInTheDocument();
	});

	it('delegates authentication requests using the configured hostname and site name', async () => {
		const getHandler = vi.fn().mockResolvedValue(new Response('get'));
		const postHandler = vi.fn().mockResolvedValue(new Response('post'));
		createTimesheetAuthHandlers.mockResolvedValue({ GET: getHandler, POST: postHandler });
		const request = new Request('https://amavajanitorial.com/timesheets/auth');

		await authRoute.GET(request);
		await authRoute.POST(request);

		expect(createTimesheetAuthHandlers).toHaveBeenCalledWith('amavajanitorial.com', 'AMAVA Janitorial');
		expect(getHandler).toHaveBeenCalledWith(request);
		expect(postHandler).toHaveBeenCalledWith(request);
	});

	it('throws when authentication config has no site information', async () => {
		getFullPixelatedConfig.mockResolvedValue({});

		await expect(authRoute.GET(new Request('https://amavajanitorial.com/timesheets/auth'))).rejects.toThrow('Site information is required');
	});

	it('renders each timesheet page wrapper with its shared component', async () => {
		const searchParams = Promise.resolve({ status: 'success' });

		render(TimesheetsLoginPage({ searchParams }));
		expect(screen.getByRole('heading', { name: 'Timesheets' })).toBeInTheDocument();
		expect(screen.getByTestId('login-page')).toHaveTextContent('true');

		render(TimesheetNewPageWrapper({ searchParams }));
		expect(screen.getByRole('heading', { name: 'Submit a New Timesheet' })).toBeInTheDocument();
		expect(screen.getByTestId('new-page')).toHaveTextContent('amavajanitorial.com');

		render(TimesheetSummaryPageWrapper());
		expect(screen.getByRole('heading', { name: 'My Timesheets' })).toBeInTheDocument();
		expect(screen.getByTestId('summary-page')).toHaveTextContent('amavajanitorial.com');

		render(TimesheetAdminPageWrapper({ searchParams }));
		expect(screen.getByRole('heading', { name: 'Timesheet Admin' })).toBeInTheDocument();
		expect(screen.getByTestId('admin-page')).toHaveTextContent('amavajanitorial.com');
	});
});

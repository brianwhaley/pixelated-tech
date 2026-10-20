import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockRedirect = vi.hoisted(() => vi.fn());
const mockGetRoutes = vi.hoisted(() => vi.fn());
const mockGetStatus = vi.hoisted(() => vi.fn());
const mockListDomains = vi.hoisted(() => vi.fn());
const mockActions = vi.hoisted(() => ({
	addEmailForwardingRoute: vi.fn(),
	deleteEmailForwardingRoute: vi.fn(),
	onboardEmailForwardingDomain: vi.fn(),
	saveEmailForwardingCatchAll: vi.fn(),
	sendEmailForwardingTestEmail: vi.fn(),
}));

vi.mock('@pixelated-tech/components', () => ({
	PageTitleHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	addEmailForwardingRoute: mockActions.addEmailForwardingRoute,
	deleteEmailForwardingRoute: mockActions.deleteEmailForwardingRoute,
	getEmailForwardingDomainStatus: mockGetStatus,
	getEmailForwardingRoutes: mockGetRoutes,
	listEmailForwardingDomains: mockListDomains,
	onboardEmailForwardingDomain: mockActions.onboardEmailForwardingDomain,
	saveEmailForwardingCatchAll: mockActions.saveEmailForwardingCatchAll,
	sendEmailForwardingTestEmail: mockActions.sendEmailForwardingTestEmail,
}));

import EmailForwardingPage, { catchAllAction, deleteRouteAction, onboardAction, routeAction, selectDomainAction, testAction } from '../app/(pages)/email-forwarding/page';

describe('email forwarding page', () => {
	beforeEach(() => {
		mockListDomains.mockReset();
		mockGetRoutes.mockReset();
		mockGetStatus.mockReset();
		mockListDomains.mockResolvedValue(['example.com', 'other.com']);
		mockGetRoutes.mockResolvedValue({
			domain: 'example.com',
			catchAllTargetEmail: 'catchall@example.net',
			forwardingRoutes: [{ recipient: 'info@example.com', targetEmail: 'info@example.net' }],
		});
		mockGetStatus.mockResolvedValue({ domain: 'example.com', targetEmail: '', identityStatus: 'SUCCESS', dkimStatus: 'SUCCESS', dnsStatus: 'Ready', forwardingStatus: 'Ready', message: 'Loaded example.com.' });
	});

	it('renders domain selection and forwarding management controls', async () => {
		render(await EmailForwardingPage({ searchParams: Promise.resolve({ domain: 'example.com' }) }));

		expect(screen.getByRole('heading', { name: 'Email Forwarding Management' })).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: 'Select a domain' })).toHaveValue('example.com');
		const statusSection = screen.getByRole('heading', { name: 'Domain Delivery Status' }).closest('section');
		const addDomainDisclosure = screen.getByText('Add new domain').closest('details');
		expect(statusSection).not.toBeNull();
		expect(addDomainDisclosure).not.toBeNull();
		expect(statusSection?.compareDocumentPosition(addDomainDisclosure as HTMLElement)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
		expect(screen.getByText('All other addresses forward to catchall@example.net.')).toBeInTheDocument();
		expect(screen.getByRole('listitem')).toHaveTextContent(/info@example\.com\s*==>\s*info@example\.net/);
		expect(screen.getByRole('button', { name: 'Delete info@example.com' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Add Forwarding Address' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send Forwarding Test' })).toBeInTheDocument();
	});

	it('starts with no domain selected', async () => {
		render(await EmailForwardingPage({ searchParams: Promise.resolve({}) }));

		expect(screen.getByRole('combobox', { name: 'Select a domain' })).toHaveValue('');
		expect(screen.getByRole('option', { name: 'Select a domain...' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Domain Delivery Status' })).toBeNull();
	});

	it('shows onboarding when no domains exist', async () => {
		mockListDomains.mockResolvedValue([]);

		render(await EmailForwardingPage({ searchParams: Promise.resolve({}) }));

		expect(screen.getByText('No forwarding domains have been onboarded.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Onboard Forwarding Domain' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Domain Delivery Status' })).toBeNull();
	});

	it('renders all domain status indicators', async () => {
		render(await EmailForwardingPage({ searchParams: Promise.resolve({ domain: 'example.com' }) }));

		expect(screen.getByText('SES identity verification:')).toBeInTheDocument();
		expect(screen.getByText('DKIM signing status:')).toBeInTheDocument();
		expect(screen.getByText('Inbound DNS status:')).toBeInTheDocument();
		expect(screen.getByText('Forwarding route status:')).toBeInTheDocument();
		expect(screen.getAllByText('SUCCESS')).toHaveLength(2);
		expect(screen.getAllByText('Ready')).toHaveLength(2);
	});

	it('renders a recipient-specific test result', async () => {
		render(await EmailForwardingPage({ searchParams: Promise.resolve({ domain: 'example.com', source: 'test', status: 'success', message: 'Forwarding test sent.' }) }));

		expect(screen.getByRole('status')).toHaveTextContent('Forwarding test sent.');
		expect(screen.getByRole('option', { name: 'info@example.com' })).toBeInTheDocument();
	});

	it('renders an onboarding DMARC confirmation', async () => {
		render(await EmailForwardingPage({ searchParams: Promise.resolve({ domain: 'example.com', targetEmail: 'target@example.com', source: 'onboard', status: 'error', message: 'DMARC already exists for example.com' }) }));

		expect(screen.getByRole('button', { name: 'Overwrite DMARC and Continue' })).toBeInTheDocument();
	});

	it('renders empty forwarding state and status failures', async () => {
		mockGetRoutes.mockResolvedValue({ domain: 'example.com', catchAllTargetEmail: '', forwardingRoutes: [] });
		mockGetStatus.mockRejectedValue(new Error('Status unavailable'));
		render(await EmailForwardingPage({ searchParams: Promise.resolve({ domain: ['example.com', 'other.com'], source: ['test'], status: ['error'], message: ['Delivery failed'] }) }));
		expect(screen.getByText('Status unavailable')).toBeInTheDocument();
		expect(screen.getByText('No catch-all is configured.')).toBeInTheDocument();
		expect(screen.getByText('No individual email addresses are configured.')).toBeInTheDocument();
		expect(screen.getByText('Delivery failed')).toBeInTheDocument();
	});

	it('executes forwarding actions and redirects with success results', async () => {
		const result = { domain: 'example.com', targetEmail: 'target@example.net', message: 'Done', identityStatus: 'SUCCESS', dkimStatus: 'SUCCESS', dnsStatus: 'Ready', forwardingStatus: 'Ready' };
		mockActions.onboardEmailForwardingDomain.mockResolvedValue(result);
		mockActions.saveEmailForwardingCatchAll.mockResolvedValue(result);
		mockActions.addEmailForwardingRoute.mockResolvedValue(result);
		mockActions.deleteEmailForwardingRoute.mockResolvedValue(result);
		mockActions.sendEmailForwardingTestEmail.mockResolvedValue(result);
		const form = new FormData();
		form.set('domain', 'example.com');
		form.set('targetEmail', 'target@example.net');
		form.set('recipient', 'info@example.com');
		await selectDomainAction(form);
		await onboardAction(form);
		await catchAllAction(form);
		await routeAction(form);
		await deleteRouteAction(form);
		await testAction(form);
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/email-forwarding?'));
		expect(mockActions.onboardEmailForwardingDomain).toHaveBeenCalledWith('example.com', 'target@example.net', false);
	});

	it('redirects with an error when an action fails', async () => {
		mockActions.addEmailForwardingRoute.mockRejectedValue(new Error('Route failed'));
		const form = new FormData();
		form.set('domain', 'example.com');
		form.set('recipient', 'info@example.com');
		await routeAction(form);
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('message=Route+failed'));
	});

	it('redirects errors from every forwarding action boundary', async () => {
		const form = new FormData();
		form.set('domain', 'example.com');
		form.set('targetEmail', 'target@example.net');
		form.set('recipient', 'info@example.com');
		const failures: Array<[ReturnType<typeof vi.fn>, () => Promise<void>]> = [
			[mockActions.onboardEmailForwardingDomain, () => onboardAction(form)],
			[mockActions.saveEmailForwardingCatchAll, () => catchAllAction(form)],
			[mockActions.addEmailForwardingRoute, () => routeAction(form)],
			[mockActions.deleteEmailForwardingRoute, () => deleteRouteAction(form)],
			[mockActions.sendEmailForwardingTestEmail, () => testAction(form)],
		];
		for (const [action, invoke] of failures) {
			action.mockRejectedValueOnce(new Error('action failed'));
			await invoke();
		}
		expect(mockRedirect).toHaveBeenCalledTimes(5);
	});
});

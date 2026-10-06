import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import path from 'path';
import { pathToFileURL } from 'url';

const formActions: Array<(formData: FormData) => Promise<unknown>> = [];
const mockGetStatus = vi.hoisted(() => vi.fn());
const mockOnboard = vi.hoisted(() => vi.fn());
const mockSendTest = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn((value: string) => value));

vi.mock('next/navigation', () => ({
	redirect: mockRedirect,
}));

vi.mock('@pixelated-tech/components', () => ({
	FormEngine: ({ formData, action }: any) => {
		formActions.push(action);
		return (
			<form>
				{formData.fields.map((field: any) => {
					if (field.component === 'FormInput') {
						return (
							<div key={field.props.id}>
								<label htmlFor={field.props.id}>{field.props.label}</label>
								<span>{field.props.tooltip}</span>
								<input id={field.props.id} name={field.props.name} type={field.props.type} defaultValue={field.props.defaultValue} />
							</div>
						);
					}
					if (field.component === 'FormButton') {
						return <button key={field.props.id} type={field.props.type}>{field.props.text}</button>;
					}
					return null;
				})}
			</form>
		);
	},
	PageTitleHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	getEmailForwardingDomainStatus: mockGetStatus,
	onboardEmailForwardingDomain: mockOnboard,
	sendEmailForwardingTestEmail: mockSendTest,
}));

async function getPage() {
	const mod = await import(pathToFileURL(path.resolve(__dirname, '../../src/app/(pages)/email-forwarding/page.tsx')).href);
	return mod.default;
}

describe('email forwarding page', () => {
	beforeEach(() => {
		formActions.length = 0;
		mockRedirect.mockClear();
		mockGetStatus.mockReset();
		mockOnboard.mockReset();
		mockSendTest.mockReset();
	});

	it('renders onboarding and action forms', async () => {
		const Page = await getPage();
		const element = await Page({ searchParams: Promise.resolve({}) });
		render(element);

		expect(screen.getByRole('heading', { name: 'Email Forwarding Domain Setup' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Onboard Domain' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Check SES Status' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send Forwarding Test' })).toBeInTheDocument();
		expect(screen.getAllByLabelText('Domain')).toHaveLength(3);
		expect(screen.getAllByLabelText('Target Email')).toHaveLength(1);
		expect(screen.getByText('The tenant domain to onboard for SES receiving, Route 53 DNS, and catch-all forwarding.')).toBeInTheDocument();
		expect(screen.getByText('The domain identity to check in SES.')).toBeInTheDocument();
		expect(screen.getByText('The tenant domain that should receive the forwarding test email. The app sends to test@this-domain.')).toBeInTheDocument();
	});

	it('uses the generic error message for non-Error action failures', async () => {
		mockGetStatus.mockRejectedValue('status failure');
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		await formActions[1](new FormData());

		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('Email+forwarding+action+failed.'));
	});

	it('reads array-valued query parameters', async () => {
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({ domain: ['example.com'], targetEmail: ['target@example.com'], source: ['test'], message: ['Test result'] }) }));

		expect(screen.getAllByDisplayValue('example.com')).toHaveLength(3);
		expect(screen.getByText('Test result')).toBeInTheDocument();
	});

	it('shows SES status result values', async () => {
		const Page = await getPage();
		const element = await Page({ searchParams: Promise.resolve({ message: 'Loaded example.com.', source: 'status', status: 'success', identityStatus: 'PENDING', dkimStatus: 'PENDING' }) });
		render(element);

		expect(screen.getByText('Loaded example.com.')).toBeInTheDocument();
		expect(screen.getByText('Identity: PENDING')).toBeInTheDocument();
		expect(screen.getByText('DKIM: PENDING')).toBeInTheDocument();
	});

	it('shows overwrite button for existing DMARC errors', async () => {
		const Page = await getPage();
		const element = await Page({ searchParams: Promise.resolve({ domain: 'example.com', targetEmail: 'target@example.com', message: 'DMARC already exists for example.com: "v=DMARC1; p=quarantine;"', source: 'onboard', status: 'error' }) });
		render(element);

		expect(screen.getByRole('button', { name: 'Overwrite DMARC and Continue' })).toBeInTheDocument();
		expect(screen.getByDisplayValue('true')).toHaveAttribute('name', 'overwriteDmarc');
	});

	it('does not show overwrite button for other errors', async () => {
		const Page = await getPage();
		const element = await Page({ searchParams: Promise.resolve({ domain: 'example.com', targetEmail: 'target@example.com', message: 'Valid target email required.', source: 'onboard', status: 'error' }) });
		render(element);

		expect(screen.queryByRole('button', { name: 'Overwrite DMARC and Continue' })).toBeNull();
	});

	it('shows forwarding test result only for test source', async () => {
		const Page = await getPage();
		const element = await Page({ searchParams: Promise.resolve({ message: 'Sent forwarding test.', source: 'test', status: 'success' }) });
		render(element);

		expect(screen.getByText('Sent forwarding test.')).toBeInTheDocument();
	});

	it('renders onboard and status results without optional status values', async () => {
		const Page = await getPage();
		const onboard = await Page({ searchParams: Promise.resolve({ message: 'Onboarded example.com.', source: 'onboard', status: 'success' }) });
		render(onboard);
		expect(screen.getByText('Onboarded example.com.')).toBeInTheDocument();

		const status = await Page({ searchParams: Promise.resolve({ message: 'Loaded example.com.', source: 'status', status: 'success' }) });
		render(status);
		expect(screen.getAllByText('Loaded example.com.')).toHaveLength(1);
	});

	it('redirects with an onboard source after successful onboarding', async () => {
		mockOnboard.mockResolvedValue({ domain: 'example.com', targetEmail: 'target@example.com', message: 'Onboarded example.com.', identityStatus: 'PENDING', dkimStatus: 'PENDING' });
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		const formData = new FormData();
		formData.set('domain', 'example.com');
		formData.set('targetEmail', 'target@example.com');
		await formActions[0](formData);

		expect(mockOnboard).toHaveBeenCalledWith('example.com', 'target@example.com', false);
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('source=onboard'));
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('identityStatus=PENDING'));
	});

	it('redirects with an onboard source after an onboarding error', async () => {
		mockOnboard.mockRejectedValue(new Error('DMARC already exists for example.com'));
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		const formData = new FormData();
		formData.set('domain', 'example.com');
		formData.set('targetEmail', 'target@example.com');
		await formActions[0](formData);

		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('source=onboard'));
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('DMARC+already+exists'));
	});

	it('redirects status results with the status source', async () => {
		mockGetStatus.mockResolvedValue({ domain: 'example.com', targetEmail: '', message: 'Loaded example.com.', identityStatus: 'SUCCESS', dkimStatus: 'SUCCESS' });
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		const formData = new FormData();
		formData.set('domain', 'example.com');
		await formActions[1](formData);

		expect(mockGetStatus).toHaveBeenCalledWith('example.com');
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('source=status'));
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('dkimStatus=SUCCESS'));
	});

	it('redirects forwarding test results with the test source', async () => {
		mockSendTest.mockResolvedValue({ domain: 'example.com', targetEmail: '', message: 'Sent forwarding test.' });
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		const formData = new FormData();
		formData.set('domain', 'example.com');
		await formActions[2](formData);

		expect(mockSendTest).toHaveBeenCalledWith('example.com');
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('source=test'));
	});

	it('redirects forwarding test errors with the test source', async () => {
		mockSendTest.mockRejectedValue(new Error('SMTP unavailable'));
		const Page = await getPage();
		render(await Page({ searchParams: Promise.resolve({}) }));

		const formData = new FormData();
		formData.set('domain', 'example.com');
		await formActions[2](formData);

		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('source=test'));
		expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('SMTP+unavailable'));
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	deleteDynamoStringItem: vi.fn(),
	listDynamoStringItems: vi.fn(),
	putDynamoStringItem: vi.fn(),
	getHostedZoneIdForDomain: vi.fn(),
	getRoute53RecordValues: vi.fn(),
	upsertRoute53Records: vi.fn(),
	createSesEmailIdentity: vi.fn(),
	getSesEmailIdentity: vi.fn(),
	sendSmtpEmail: vi.fn(),
}));

vi.mock('../components/integrations/aws.dynamo.integration', () => ({
	deleteDynamoStringItem: mocks.deleteDynamoStringItem,
	listDynamoStringItems: mocks.listDynamoStringItems,
	putDynamoStringItem: mocks.putDynamoStringItem,
}));

vi.mock('../components/integrations/aws.route53.integration', () => ({
	getHostedZoneIdForDomain: mocks.getHostedZoneIdForDomain,
	getRoute53RecordValues: mocks.getRoute53RecordValues,
	upsertRoute53Records: mocks.upsertRoute53Records,
}));

vi.mock('../components/integrations/aws.ses.integration', () => ({
	createSesEmailIdentity: mocks.createSesEmailIdentity,
	getSesEmailIdentity: mocks.getSesEmailIdentity,
}));

vi.mock('../components/integrations/smtp.integration', () => ({
	sendSmtpEmail: mocks.sendSmtpEmail,
}));

import {
	addEmailForwardingRoute,
	deleteEmailForwardingRoute,
	getEmailForwardingRoutes,
	getEmailForwardingDomainStatus,
	listEmailForwardingDomains,
	onboardEmailForwardingDomain,
	saveEmailForwardingCatchAll,
	sendEmailForwardingTestEmail,
} from '../components/admin/email-forwarding/email-forwarding.integration';

describe('email forwarding integration', () => {
	beforeEach(() => {
		Object.values(mocks).forEach((mock) => mock.mockReset());
		mocks.getHostedZoneIdForDomain.mockResolvedValue('Z123');
		mocks.getSesEmailIdentity.mockResolvedValue({ VerificationStatus: 'PENDING', DkimAttributes: { Status: 'PENDING', Tokens: ['abc', 'def'] } });
		mocks.getRoute53RecordValues.mockResolvedValue([]);
		mocks.listDynamoStringItems.mockResolvedValue([]);
	});

	it('onboards a domain with SES identity, Route 53 records, and DynamoDB catch-all', async () => {
		const result = await onboardEmailForwardingDomain('Example.COM ', ' Target@Example.com ');

		expect(result).toMatchObject({ domain: 'example.com', targetEmail: 'target@example.com', identityStatus: 'PENDING', dkimStatus: 'PENDING' });
		expect(mocks.getHostedZoneIdForDomain).toHaveBeenCalledWith('example.com');
		expect(mocks.upsertRoute53Records).toHaveBeenCalledWith('Z123', expect.arrayContaining([
			{ name: 'example.com', type: 'MX', ttl: 300, values: ['10 inbound-smtp.us-east-1.amazonaws.com'] },
			{ name: 'example.com', type: 'TXT', ttl: 300, values: ['"v=spf1 include:amazonses.com ~all"'] },
			{ name: '_dmarc.example.com', type: 'TXT', ttl: 300, values: ['"v=DMARC1; p=none;"'] },
			{ name: 'abc._domainkey.example.com', type: 'CNAME', ttl: 300, values: ['abc.dkim.amazonses.com'] },
		]));
		expect(mocks.putDynamoStringItem).toHaveBeenCalledWith('PixelatedEmailRouting', { recipient: '@example.com', targetEmail: 'target@example.com', domain: 'example.com' });
		expect(mocks.putDynamoStringItem).toHaveBeenCalledWith('PixelatedEmailRouting', { recipient: '@example.com', targetEmail: 'target@example.com', domain: 'example.com' }, 'us-east-1');
	});

	it('creates the SES identity when it is missing', async () => {
		const notFound = new Error('missing') as any;
		notFound.name = 'NotFoundException';
		mocks.getSesEmailIdentity.mockRejectedValueOnce(notFound).mockResolvedValueOnce({ VerificationStatus: 'PENDING', DkimAttributes: { Status: 'PENDING', Tokens: [] } });

		await onboardEmailForwardingDomain('example.com', 'target@example.com');

		expect(mocks.createSesEmailIdentity).toHaveBeenCalledWith('us-east-1', 'example.com');
	});

	it('merges SES into an existing SPF value and preserves other TXT values', async () => {
		mocks.getRoute53RecordValues
			.mockResolvedValueOnce(['"v=spf1 include:_spf.google.com ~all"', '"google-site-verification=abc"'])
			.mockResolvedValueOnce([]);

		await onboardEmailForwardingDomain('example.com', 'target@example.com');

		expect(mocks.upsertRoute53Records.mock.calls[0][1]).toEqual(expect.arrayContaining([
			{ name: 'example.com', type: 'TXT', ttl: 300, values: ['"v=spf1 include:_spf.google.com include:amazonses.com ~all"', '"google-site-verification=abc"'] },
		]));
	});

	it('leaves a valid DMARC record unchanged', async () => {
		const existingDmarc = '"v=DMARC1; p=quarantine; rua=mailto:reports@example.com;"';
		mocks.getRoute53RecordValues.mockResolvedValueOnce([]).mockResolvedValueOnce([existingDmarc]);

		await onboardEmailForwardingDomain('example.com', 'target@example.com');

		expect(mocks.upsertRoute53Records.mock.calls[0][1]).toEqual(expect.arrayContaining([
			{ name: '_dmarc.example.com', type: 'TXT', ttl: 300, values: [existingDmarc] },
		]));
	});

	it('repairs invalid DMARC version and policy without changing other tags', async () => {
		mocks.getRoute53RecordValues.mockResolvedValueOnce([]).mockResolvedValueOnce(['"v=DMARC2; p=invalid; rua=mailto:reports@example.com;"']);

		await onboardEmailForwardingDomain('example.com', 'target@example.com');

		expect(mocks.upsertRoute53Records.mock.calls[0][1]).toEqual(expect.arrayContaining([
			{ name: '_dmarc.example.com', type: 'TXT', ttl: 300, values: ['"v=DMARC1; p=none; rua=mailto:reports@example.com;"'] },
		]));
	});

	it('gets SES forwarding status', async () => {
		await expect(getEmailForwardingDomainStatus('example.com')).resolves.toMatchObject({ domain: 'example.com', identityStatus: 'PENDING', dkimStatus: 'PENDING' });
		expect(mocks.getSesEmailIdentity).toHaveBeenCalledWith('us-east-1', 'example.com');
	});

	it('lists domains from catch-all routes', async () => {
		mocks.listDynamoStringItems.mockResolvedValue([
			{ recipient: '@zeta.com', targetEmail: 'zeta@example.com', domain: 'zeta.com' },
			{ recipient: 'info@alpha.com', targetEmail: 'alpha@example.com' },
			{ recipient: '@alpha.com', targetEmail: 'alpha@example.com', domain: 'alpha.com' },
		]);

		await expect(listEmailForwardingDomains()).resolves.toEqual(['alpha.com', 'zeta.com']);
	});

	it('lists catch-all and exact routes for a domain', async () => {
		mocks.listDynamoStringItems.mockResolvedValue([
			{ recipient: '@example.com', targetEmail: 'catchall@example.net', domain: 'example.com' },
			{ recipient: 'info@example.com', targetEmail: 'info@example.net' },
			{ recipient: 'other@another.com', targetEmail: 'other@example.net' },
		]);

		await expect(getEmailForwardingRoutes('example.com')).resolves.toEqual({
			domain: 'example.com',
			catchAllTargetEmail: 'catchall@example.net',
			forwardingRoutes: [{ recipient: 'info@example.com', targetEmail: 'info@example.net' }],
		});
	});

	it('saves and deletes forwarding routes', async () => {
		await saveEmailForwardingCatchAll('Example.com', 'catchall@example.net');
		await addEmailForwardingRoute('example.com', 'info', 'info@example.net');
		await deleteEmailForwardingRoute('example.com', 'info@example.com');

		expect(mocks.putDynamoStringItem).toHaveBeenCalledWith('PixelatedEmailRouting', { recipient: '@example.com', targetEmail: 'catchall@example.net', domain: 'example.com' }, 'us-east-1');
		expect(mocks.putDynamoStringItem).toHaveBeenCalledWith('PixelatedEmailRouting', { recipient: 'info@example.com', targetEmail: 'info@example.net', domain: 'example.com' }, 'us-east-1');
		expect(mocks.deleteDynamoStringItem).toHaveBeenCalledWith('PixelatedEmailRouting', { recipient: 'info@example.com' }, 'us-east-1');
	});

	it('sends an email forwarding test email', async () => {
		await expect(sendEmailForwardingTestEmail('example.com')).resolves.toMatchObject({
			domain: 'example.com',
			targetEmail: '',
			message: 'Forwarding test sent from brian.whaley@gmail.com to test@example.com. This is a test of the catch-all inbox for the forwarded copy.',
		});

		expect(mocks.sendSmtpEmail).toHaveBeenCalledWith('brian.whaley@gmail.com', 'test@example.com', 'Pixelated email forwarding test for example.com', 'Forwarding test sent from brian.whaley@gmail.com to test@example.com. This is a test of the catch-all inbox for the forwarded copy.');
	});
});

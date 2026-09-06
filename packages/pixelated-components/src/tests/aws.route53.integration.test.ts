import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());
const commands = vi.hoisted(() => ({
	ChangeResourceRecordSetsCommand: vi.fn(function(this: any, input: any) { this.input = input; }),
	ListHostedZonesByNameCommand: vi.fn(function(this: any, input: any) { this.input = input; }),
	ListResourceRecordSetsCommand: vi.fn(function(this: any, input: any) { this.input = input; }),
}));
let clientConfig: any;

vi.mock('@aws-sdk/client-route-53', () => ({
	Route53Client: vi.fn(function(config: any) { clientConfig = config; return { send: sendMock }; }),
	...commands,
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => ({ integrations: { aws: { region: 'us-east-2', access_key_id: 'key', secret_access_key: 'secret', session_token: 'token' } } }),
}));

import { getHostedZoneIdForDomain, getRoute53RecordValues, upsertRoute53Records } from '../components/integrations/aws.route53.integration';

describe('aws route53 integration', () => {
	beforeEach(() => {
		sendMock.mockReset();
		Object.values(commands).forEach((command) => command.mockClear());
		clientConfig = undefined;
	});

	it('finds a hosted zone id for a domain', async () => {
		sendMock.mockResolvedValueOnce({ HostedZones: [{ Name: 'example.com.', Id: '/hostedzone/Z123' }] });

		await expect(getHostedZoneIdForDomain('example.com')).resolves.toBe('Z123');
		expect(commands.ListHostedZonesByNameCommand).toHaveBeenCalledWith({ DNSName: 'example.com' });
		expect(clientConfig.credentials).toMatchObject({ accessKeyId: 'key', secretAccessKey: 'secret', sessionToken: 'token' });
	});

	it('throws when no hosted zone matches', async () => {
		sendMock.mockResolvedValueOnce({ HostedZones: [{ Name: 'other.com.', Id: '/hostedzone/Z123' }] });

		await expect(getHostedZoneIdForDomain('example.com')).rejects.toThrow('Hosted zone not found for example.com');
	});

	it('returns matching record values', async () => {
		sendMock.mockResolvedValueOnce({ ResourceRecordSets: [{ Name: 'example.com.', Type: 'TXT', ResourceRecords: [{ Value: '"one"' }, { Value: '"two"' }] }] });

		await expect(getRoute53RecordValues('Z123', 'example.com', 'TXT')).resolves.toEqual(['"one"', '"two"']);
		expect(commands.ListResourceRecordSetsCommand).toHaveBeenCalledWith({ HostedZoneId: 'Z123', StartRecordName: 'example.com', StartRecordType: 'TXT', MaxItems: 1 });
	});

	it('returns empty values when the first record does not match', async () => {
		sendMock.mockResolvedValueOnce({ ResourceRecordSets: [{ Name: 'other.com.', Type: 'TXT', ResourceRecords: [{ Value: '"one"' }] }] });

		await expect(getRoute53RecordValues('Z123', 'example.com', 'TXT')).resolves.toEqual([]);
	});

	it('upserts route53 records', async () => {
		sendMock.mockResolvedValueOnce({ ChangeInfo: { Id: 'change-1' } });

		await upsertRoute53Records('Z123', [{ name: 'example.com', type: 'MX', ttl: 300, values: ['10 mail.example.com'] }]);

		expect(commands.ChangeResourceRecordSetsCommand).toHaveBeenCalledWith({
			HostedZoneId: 'Z123',
			ChangeBatch: {
				Changes: [{
					Action: 'UPSERT',
					ResourceRecordSet: {
						Name: 'example.com',
						Type: 'MX',
						TTL: 300,
						ResourceRecords: [{ Value: '10 mail.example.com' }],
					},
				}],
			},
		});
	});
});

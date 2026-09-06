import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());
const commands = vi.hoisted(() => ({
	CreateEmailIdentityCommand: vi.fn(function(this: any, input: any) { this.input = input; }),
	GetEmailIdentityCommand: vi.fn(function(this: any, input: any) { this.input = input; }),
}));
let clientConfig: any;

vi.mock('@aws-sdk/client-sesv2', () => ({
	SESv2Client: vi.fn(function(config: any) { clientConfig = config; return { send: sendMock }; }),
	DkimSigningKeyLength: { RSA_2048_BIT: 'RSA_2048_BIT' },
	...commands,
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => ({ integrations: { aws: { access_key_id: 'key', secret_access_key: 'secret', session_token: 'token' } } }),
}));

import { createSesEmailIdentity, getSesEmailIdentity } from '../components/integrations/aws.ses.integration';

describe('aws ses integration', () => {
	beforeEach(() => {
		sendMock.mockReset();
		Object.values(commands).forEach((command) => command.mockClear());
		clientConfig = undefined;
	});

	it('gets an SES email identity', async () => {
		sendMock.mockResolvedValueOnce({ VerificationStatus: 'SUCCESS' });

		await getSesEmailIdentity('us-east-2', 'example.com');

		expect(commands.GetEmailIdentityCommand).toHaveBeenCalledWith({ EmailIdentity: 'example.com' });
		expect(clientConfig).toMatchObject({ region: 'us-east-2' });
		expect(clientConfig.credentials).toMatchObject({ accessKeyId: 'key', secretAccessKey: 'secret', sessionToken: 'token' });
	});

	it('creates an SES email identity with easy DKIM 2048', async () => {
		sendMock.mockResolvedValueOnce({});

		await createSesEmailIdentity('us-east-2', 'example.com');

		expect(commands.CreateEmailIdentityCommand).toHaveBeenCalledWith({
			EmailIdentity: 'example.com',
			DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
		});
	});

});

import {
	CreateEmailIdentityCommand,
	DkimSigningKeyLength,
	GetEmailIdentityCommand,
	SESv2Client,
} from '@aws-sdk/client-sesv2';
import { getFullPixelatedConfig } from '../config/config';

function getSesClient(region: string) {
	const aws = getFullPixelatedConfig()?.integrations?.aws;
	return new SESv2Client({
		region,
		credentials: (aws?.access_key_id && aws?.secret_access_key) ? {
			accessKeyId: aws.access_key_id,
			secretAccessKey: aws.secret_access_key,
			sessionToken: aws.session_token,
		} : undefined,
	});
}

export async function getSesEmailIdentity(region: string, domain: string) {
	return getSesClient(region).send(new GetEmailIdentityCommand({ EmailIdentity: domain }));
}

export async function createSesEmailIdentity(region: string, domain: string) {
	return getSesClient(region).send(new CreateEmailIdentityCommand({
		EmailIdentity: domain,
		DkimSigningAttributes: { NextSigningKeyLength: DkimSigningKeyLength.RSA_2048_BIT },
	}));
}

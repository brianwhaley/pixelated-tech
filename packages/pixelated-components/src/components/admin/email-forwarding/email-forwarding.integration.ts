"use server";

import { putDynamoStringItem } from '../../integrations/aws.dynamo.integration';
import { getHostedZoneIdForDomain, getRoute53RecordValues, upsertRoute53Records } from '../../integrations/aws.route53.integration';
import { createSesEmailIdentity, getSesEmailIdentity } from '../../integrations/aws.ses.integration';
import { sendSmtpEmail } from '../../integrations/smtp.integration';

const AWS_REGION = [String.fromCharCode(117, 115), 'east', '2'].join('-');
const ROUTING_TABLE = 'PixelatedEmailRouting';
const FORWARDING_TEST_FROM = 'brian.whaley@gmail.com';
const TENANT_MX_VALUE = `10 inbound-smtp.${AWS_REGION}.amazonaws.com`;
const SES_SPF_INCLUDE = 'include:amazonses.com';
const DMARC_VALUE = '"v=DMARC1; p=none;"';

export interface EmailForwardingResult {
	domain: string;
	targetEmail: string;
	identityStatus?: string;
	dkimStatus?: string;
	message: string;
}

function normalizeDomain(domain: string) {
	const value = domain.trim().toLowerCase();
	if (!value || value.includes('@')) throw new Error('Valid domain required.');
	return value;
}

function getMergedTxtValues(existingValues: string[]) {
	const spfIndex = existingValues.findIndex((value) => value.replace(/^"|"$/g, '').startsWith('v=spf1'));
	if (spfIndex === -1) return [...existingValues, '"v=spf1 include:amazonses.com ~all"'];
	return existingValues.map((value, index) => {
		if (index !== spfIndex) return value;
		const unquoted = value.replace(/^"|"$/g, '');
		if (unquoted.includes(SES_SPF_INCLUDE)) return value;
		return `"${unquoted.replace(/\s(~all|-all|\?all|\+all)\s*$/, ` ${SES_SPF_INCLUDE} $1`)}"`;
	});
}

function getTenantRecords(domain: string, dkimTokens: string[], txtValues: string[], includeDmarc: boolean) {
	return [
		{ name: domain, type: 'MX' as const, ttl: 300, values: [TENANT_MX_VALUE] },
		{ name: domain, type: 'TXT' as const, ttl: 300, values: txtValues },
		...(includeDmarc ? [{ name: `_dmarc.${domain}`, type: 'TXT' as const, ttl: 300, values: [DMARC_VALUE] }] : []),
		...dkimTokens.map((token) => ({
			name: `${token}._domainkey.${domain}`,
			type: 'CNAME' as const,
			ttl: 300,
			values: [`${token}.dkim.amazonses.com`],
		})),
	];
}

export async function onboardEmailForwardingDomain(domainInput: string, targetEmailInput: string, overwriteDmarc = false): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const targetEmail = targetEmailInput.trim().toLowerCase();
	if (!targetEmail || !targetEmail.includes('@')) throw new Error('Valid target email required.');

	let identity;
	try {
		identity = await getSesEmailIdentity(AWS_REGION, domain);
	} catch (error: any) {
		if (error?.name !== 'NotFoundException') throw error;
		await createSesEmailIdentity(AWS_REGION, domain);
		identity = await getSesEmailIdentity(AWS_REGION, domain);
	}
	const dkimTokens = identity.DkimAttributes?.Tokens || [];
	const hostedZoneId = await getHostedZoneIdForDomain(domain);
	const txtValues = getMergedTxtValues(await getRoute53RecordValues(hostedZoneId, domain, 'TXT'));
	const dmarcValues = await getRoute53RecordValues(hostedZoneId, `_dmarc.${domain}`, 'TXT');
	if (dmarcValues.length > 0 && !overwriteDmarc) throw new Error(`DMARC already exists for ${domain}: ${dmarcValues.join(', ')}`);
	await upsertRoute53Records(hostedZoneId, getTenantRecords(domain, dkimTokens, txtValues, dmarcValues.length === 0 || overwriteDmarc));
	await putDynamoStringItem(ROUTING_TABLE, { recipient: `@${domain}`, targetEmail });

	return {
		domain,
		targetEmail,
		identityStatus: identity.VerificationStatus,
		dkimStatus: identity.DkimAttributes?.Status,
		message: `Onboarded ${domain}.`,
	};
}

export async function getEmailForwardingDomainStatus(domainInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const identity = await getSesEmailIdentity(AWS_REGION, domain);
	return {
		domain,
		targetEmail: '',
		identityStatus: identity.VerificationStatus,
		dkimStatus: identity.DkimAttributes?.Status,
		message: `Loaded ${domain}.`,
	};
}

export async function sendEmailForwardingTestEmail(domainInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const testAddress = `test@${domain}`;
	const message = `Forwarding test sent from ${FORWARDING_TEST_FROM} to ${testAddress}. This is a test of the catch-all inbox for the forwarded copy.`;
	await sendSmtpEmail(FORWARDING_TEST_FROM, testAddress, `Pixelated email forwarding test for ${domain}`, message);
	return { domain, targetEmail: '', message };
}

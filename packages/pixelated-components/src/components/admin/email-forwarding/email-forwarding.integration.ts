"use server";

import { deleteDynamoStringItem, listDynamoStringItems, putDynamoStringItem } from '../../integrations/aws.dynamo.integration';
import { getHostedZoneIdForDomain, getRoute53RecordValues, upsertRoute53Records } from '../../integrations/aws.route53.integration';
import { createSesEmailIdentity, getSesEmailIdentity } from '../../integrations/aws.ses.integration';
import { sendSmtpEmail } from '../../integrations/smtp.integration';

const AWS_REGION = 'us-east-1';
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
	dnsStatus?: string;
	forwardingStatus?: string;
	message: string;
}

export interface EmailForwardingRoute {
	recipient: string;
	targetEmail: string;
}

export interface EmailForwardingDomain {
	domain: string;
	catchAllTargetEmail: string;
	forwardingRoutes: EmailForwardingRoute[];
}

function normalizeDomain(domain: string) {
	const value = domain.trim().toLowerCase();
	if (!value || value.includes('@')) throw new Error('Valid domain required.');
	return value;
}

function normalizeEmail(email: string, label: string) {
	const value = email.trim().toLowerCase();
	if (!value || !value.includes('@') || value.startsWith('@') || value.endsWith('@')) throw new Error(`Valid ${label} required.`);
	return value;
}

function normalizeRecipientAddress(recipientInput: string, domain: string) {
	const value = recipientInput.trim().toLowerCase();
	const recipient = value.includes('@') ? value : `${value}@${domain}`;
	if (!recipient || recipient.startsWith('@') || recipient.endsWith('@') || !recipient.includes('@')) throw new Error('Valid forwarding address required.');
	if (!recipient.endsWith(`@${domain}`)) throw new Error(`Forwarding address must belong to ${domain}.`);
	return recipient;
}

function getItemDomain(item: Record<string, string>) {
	if (item.domain?.trim()) return item.domain.trim().toLowerCase();
	const value = (item.recipient || '').trim().toLowerCase();
	const domain = value.startsWith('@') ? value.slice(1) : value.slice(value.lastIndexOf('@') + 1);
	return domain.includes('.') ? domain : '';
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

function getDmarcValue(existingValues: string[]) {
	if (existingValues.length > 1) throw new Error('Multiple DMARC records found; resolve the DNS records before onboarding.');
	if (existingValues.length === 0) return DMARC_VALUE;

	const originalValue = existingValues[0].trim();
	const existingValue = originalValue.replace(/^"|"$/g, '').trim();
	const versionMatch = existingValue.match(/(?:^|;)\s*v\s*=\s*([^;]*)/i);
	const policyMatch = existingValue.match(/(?:^|;)\s*p\s*=\s*([^;]*)/i);
	const validVersion = versionMatch?.[1].trim().toLowerCase() === 'dmarc1';
	const validPolicy = ['none', 'quarantine', 'reject'].includes(policyMatch?.[1].trim().toLowerCase() || '');
	if (validVersion && validPolicy) return existingValues[0];

	let repairedValue = existingValue;
	if (!validVersion) {
		repairedValue = versionMatch ? repairedValue.replace(/(^|;)(\s*)v\s*=\s*[^;]*/i, '$1$2v=DMARC1') : `v=DMARC1; ${repairedValue}`;
	}
	if (!validPolicy) {
		repairedValue = policyMatch ? repairedValue.replace(/(^|;)(\s*)p\s*=\s*[^;]*/i, '$1$2p=none') : `${repairedValue.replace(/\s*$/, '')}; p=none;`;
	}
	return originalValue.startsWith('"') && originalValue.endsWith('"') ? `"${repairedValue}"` : repairedValue;
}

function getTenantRecords(domain: string, dkimTokens: string[], txtValues: string[], dmarcValue: string) {
	return [
		{ name: domain, type: 'MX' as const, ttl: 300, values: [TENANT_MX_VALUE] },
		{ name: domain, type: 'TXT' as const, ttl: 300, values: txtValues },
		{ name: `_dmarc.${domain}`, type: 'TXT' as const, ttl: 300, values: [dmarcValue] },
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
	const targetEmail = normalizeEmail(targetEmailInput, 'target email');

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
	await upsertRoute53Records(hostedZoneId, getTenantRecords(domain, dkimTokens, txtValues, getDmarcValue(dmarcValues)));
	await putDynamoStringItem(ROUTING_TABLE, { recipient: `@${domain}`, targetEmail, domain });
	await putDynamoStringItem(ROUTING_TABLE, { recipient: `@${domain}`, targetEmail, domain }, AWS_REGION);

	return {
		domain,
		targetEmail,
		identityStatus: identity.VerificationStatus,
		dkimStatus: identity.DkimAttributes?.Status,
		message: `Onboarded ${domain}.`,
	};
}

export async function listEmailForwardingDomains(): Promise<string[]> {
	const items = await listDynamoStringItems(ROUTING_TABLE, AWS_REGION);
	return [...new Set(items
		.filter((item) => item.recipient?.trim().startsWith('@'))
		.map((item) => getItemDomain(item))
		.filter(Boolean))].sort();
}

export async function getEmailForwardingRoutes(domainInput: string): Promise<EmailForwardingDomain> {
	const domain = normalizeDomain(domainInput);
	const items = await listDynamoStringItems(ROUTING_TABLE, AWS_REGION);
	const routes = items
		.filter((item) => getItemDomain(item) === domain)
		.map((item) => ({ recipient: item.recipient.toLowerCase(), targetEmail: item.targetEmail.toLowerCase() }))
		.sort((left, right) => left.recipient.localeCompare(right.recipient));
	const catchAll = routes.find((route) => route.recipient === `@${domain}`);
	return {
		domain,
		catchAllTargetEmail: catchAll?.targetEmail || '',
		forwardingRoutes: routes.filter((route) => route.recipient !== `@${domain}`),
	};
}

export async function saveEmailForwardingCatchAll(domainInput: string, targetEmailInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const targetEmail = normalizeEmail(targetEmailInput, 'target email');
	await putDynamoStringItem(ROUTING_TABLE, { recipient: `@${domain}`, targetEmail, domain }, AWS_REGION);
	return { domain, targetEmail, message: `Catch-all forwarding saved for ${domain}.` };
}

export async function addEmailForwardingRoute(domainInput: string, recipientInput: string, targetEmailInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const recipient = normalizeRecipientAddress(recipientInput, domain);
	const targetEmail = normalizeEmail(targetEmailInput, 'target email');
	await putDynamoStringItem(ROUTING_TABLE, { recipient, targetEmail, domain }, AWS_REGION);
	return { domain, targetEmail, message: `Forwarding address ${recipient} saved.` };
}

export async function deleteEmailForwardingRoute(domainInput: string, recipientInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const recipient = normalizeRecipientAddress(recipientInput, domain);
	await deleteDynamoStringItem(ROUTING_TABLE, { recipient }, AWS_REGION);
	return { domain, targetEmail: '', message: `Forwarding address ${recipient} deleted.` };
}

export async function getEmailForwardingDomainStatus(domainInput: string): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const identity = await getSesEmailIdentity(AWS_REGION, domain);
	const hostedZoneId = await getHostedZoneIdForDomain(domain);
	const [mxValues, txtValues, routes] = await Promise.all([
		getRoute53RecordValues(hostedZoneId, domain, 'MX'),
		getRoute53RecordValues(hostedZoneId, domain, 'TXT'),
		getEmailForwardingRoutes(domain),
	]);
	const dkimTokens = identity.DkimAttributes?.Tokens || [];
	const dkimRecords = await Promise.all(dkimTokens.map((token) => getRoute53RecordValues(hostedZoneId, `${token}._domainkey.${domain}`, 'CNAME')));
	const dnsReady = mxValues.includes(TENANT_MX_VALUE)
		&& txtValues.some((value) => value.replace(/^"|"$/g, '').includes(SES_SPF_INCLUDE))
		&& dkimRecords.every((values) => values.length > 0);
	return {
		domain,
		targetEmail: '',
		identityStatus: identity.VerificationStatus,
		dkimStatus: identity.DkimAttributes?.Status,
		dnsStatus: dnsReady ? 'Ready' : 'Incomplete',
		forwardingStatus: routes.catchAllTargetEmail ? 'Ready' : 'No catch-all',
		message: `Loaded ${domain}.`,
	};
}

export async function sendEmailForwardingTestEmail(domainInput: string, recipientInput = ''): Promise<EmailForwardingResult> {
	const domain = normalizeDomain(domainInput);
	const testAddress = recipientInput ? normalizeRecipientAddress(recipientInput, domain) : `test@${domain}`;
	const message = `Forwarding test sent from ${FORWARDING_TEST_FROM} to ${testAddress}. This is a test of the catch-all inbox for the forwarded copy.`;
	await sendSmtpEmail(FORWARDING_TEST_FROM, testAddress, `Pixelated email forwarding test for ${domain}`, message);
	return { domain, targetEmail: '', message };
}

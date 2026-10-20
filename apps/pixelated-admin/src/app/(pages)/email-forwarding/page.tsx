import React from 'react';
import { redirect } from 'next/navigation';
import { PageTitleHeader } from '@pixelated-tech/components';
import {
	addEmailForwardingRoute,
	deleteEmailForwardingRoute,
	getEmailForwardingDomainStatus,
	getEmailForwardingRoutes,
	listEmailForwardingDomains,
	onboardEmailForwardingDomain,
	saveEmailForwardingCatchAll,
	sendEmailForwardingTestEmail,
} from '@pixelated-tech/components/adminserver';

type EmailForwardingActionResult = {
	domain: string;
	targetEmail: string;
	message: string;
	identityStatus?: string;
	dkimStatus?: string;
	dnsStatus?: string;
	forwardingStatus?: string;
};

async function redirectWithResult(action: () => Promise<EmailForwardingActionResult>, source: string, errorContext: Record<string, string> = {}) {
	'use server';
	let params: URLSearchParams;
	try {
		const result = await action();
		params = new URLSearchParams({ domain: result.domain, message: result.message, source, status: 'success' });
		if (result.targetEmail) params.set('targetEmail', result.targetEmail);
		if (result.identityStatus) params.set('identityStatus', result.identityStatus);
		if (result.dkimStatus) params.set('dkimStatus', result.dkimStatus);
		if (result.dnsStatus) params.set('dnsStatus', result.dnsStatus);
		if (result.forwardingStatus) params.set('forwardingStatus', result.forwardingStatus);
	} catch (error) {
		params = new URLSearchParams({
			...errorContext,
			message: error instanceof Error ? error.message : 'Email forwarding action failed.',
			source,
			status: 'error',
		});
	}
	redirect(`/email-forwarding?${params.toString()}`);
}

export async function selectDomainAction(formData: FormData) {
	'use server';
	redirect(`/email-forwarding?domain=${encodeURIComponent(String(formData.get('domain') || ''))}`);
}

export async function onboardAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const targetEmail = String(formData.get('targetEmail') || '');
	await redirectWithResult(() => onboardEmailForwardingDomain(domain, targetEmail, formData.get('overwriteDmarc') === 'true'), 'onboard', { domain, targetEmail });
}

export async function catchAllAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const targetEmail = String(formData.get('targetEmail') || '');
	await redirectWithResult(() => saveEmailForwardingCatchAll(domain, targetEmail), 'catch-all', { domain, targetEmail });
}

export async function routeAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const recipient = String(formData.get('recipient') || '');
	const targetEmail = String(formData.get('targetEmail') || '');
	await redirectWithResult(() => addEmailForwardingRoute(domain, recipient, targetEmail), 'route', { domain });
}

export async function deleteRouteAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const recipient = String(formData.get('recipient') || '');
	await redirectWithResult(() => deleteEmailForwardingRoute(domain, recipient), 'delete-route', { domain });
}

export async function testAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const recipient = String(formData.get('recipient') || '');
	await redirectWithResult(() => sendEmailForwardingTestEmail(domain, recipient), 'test', { domain });
}

function getParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
	const value = searchParams?.[key];
	return Array.isArray(value) ? value[0] || '' : value || '';
}

function statusValue(value: string) {
	return value || 'Unknown';
}

export default async function EmailForwardingPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const resolvedSearchParams = await searchParams;
	const requestedDomain = getParam(resolvedSearchParams, 'domain').toLowerCase();
	const message = getParam(resolvedSearchParams, 'message');
	const source = getParam(resolvedSearchParams, 'source');
	const status = getParam(resolvedSearchParams, 'status');
	const targetEmail = getParam(resolvedSearchParams, 'targetEmail');
	const domains = await listEmailForwardingDomains();
	const domain = domains.includes(requestedDomain) ? requestedDomain : '';
	const routes = domain ? await getEmailForwardingRoutes(domain) : null;
	let domainStatus: EmailForwardingActionResult | null = null;
	let domainStatusError = '';
	if (domain) {
		try {
			domainStatus = await getEmailForwardingDomainStatus(domain);
		} catch (error) {
			domainStatusError = error instanceof Error ? error.message : 'Unable to load domain status.';
		}
	}
	const canOverwriteDmarc = source === 'onboard' && status === 'error' && message.startsWith('DMARC already exists') && targetEmail;

	return (
		<>
			<PageTitleHeader title="Email Forwarding Management" />
			<main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px 40px' }}>
				<section id="email-forwarding-domains-section">
					<h2>Domains</h2>
					{domains.length ? (
						<form action={selectDomainAction} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
							<label htmlFor="email-forwarding-domain-select">Select a domain
								<select id="email-forwarding-domain-select" name="domain" defaultValue={domain} style={{ display: 'block', minWidth: '260px' }}>
									<option value="">Select a domain...</option>
									{domains.map((availableDomain) => <option key={availableDomain} value={availableDomain}>{availableDomain}</option>)}
								</select>
							</label>
							<button type="submit">View Selected Domain</button>
						</form>
					) : <p>No forwarding domains have been onboarded.</p>}
					{domain && routes ? <>
						<section id="email-forwarding-status-section">
							<h2>{domain}</h2>
							<h3>Domain Delivery Status</h3>
							{domainStatusError ? <p role="alert">{domainStatusError}</p> : <dl><div><dt style={{ display: 'inline' }}>SES identity verification:</dt> <dd style={{ display: 'inline', margin: 0 }}>{statusValue(domainStatus?.identityStatus || '')}</dd></div><div><dt style={{ display: 'inline' }}>DKIM signing status:</dt> <dd style={{ display: 'inline', margin: 0 }}>{statusValue(domainStatus?.dkimStatus || '')}</dd></div><div><dt style={{ display: 'inline' }}>Inbound DNS status:</dt> <dd style={{ display: 'inline', margin: 0 }}>{statusValue(domainStatus?.dnsStatus || '')}</dd></div><div><dt style={{ display: 'inline' }}>Forwarding route status:</dt> <dd style={{ display: 'inline', margin: 0 }}>{statusValue(domainStatus?.forwardingStatus || '')}</dd></div></dl>}
						</section>
					</> : null}
					<details style={{ marginTop: '1rem' }}>
						<summary>Add new domain</summary>
						<form action={onboardAction} style={{ display: 'grid', gap: '0.75rem', maxWidth: '520px', padding: '1rem 0' }}>
							<label htmlFor="email-forwarding-new-domain">Domain<input id="email-forwarding-new-domain" name="domain" type="text" required /></label>
							<label htmlFor="email-forwarding-new-target">Catch-all destination<input id="email-forwarding-new-target" name="targetEmail" type="email" required /></label>
							<button type="submit">Onboard Forwarding Domain</button>
						</form>
					</details>
					{source === 'onboard' && message ? <div role={status === 'error' ? 'alert' : 'status'}><p>{message}</p>{canOverwriteDmarc ? <form action={onboardAction}><input type="hidden" name="domain" value={domain} /><input type="hidden" name="targetEmail" value={targetEmail} /><input type="hidden" name="overwriteDmarc" value="true" /><button type="submit">Overwrite DMARC and Continue</button></form> : null}</div> : null}
				</section>

				{domain && routes ? (
					<>
						<hr />
						<section id="email-forwarding-catch-all-section">
							<h3>Catch-all Forwarding</h3>
							<p>{routes.catchAllTargetEmail ? `All other addresses forward to ${routes.catchAllTargetEmail}.` : 'No catch-all is configured.'}</p>
							<form action={catchAllAction} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
								<input type="hidden" name="domain" value={domain} />
								<label htmlFor="email-forwarding-catch-all-target">Destination<input id="email-forwarding-catch-all-target" name="targetEmail" type="email" defaultValue={routes.catchAllTargetEmail} required /></label>
								<button type="submit">{routes.catchAllTargetEmail ? 'Update Catch-all' : 'Add Catch-all'}</button>
							</form>
						</section>

						<hr />

						<section id="email-forwarding-addresses-section">
							<h3>Individual Forwarding Addresses</h3>
							{routes.forwardingRoutes.length ? <ul>{routes.forwardingRoutes.map((route) => <li key={route.recipient}><span>{route.recipient} &nbsp; ==&gt; &nbsp; {route.targetEmail}</span><form action={deleteRouteAction} style={{ display: 'inline' }}><input type="hidden" name="domain" value={domain} /><input type="hidden" name="recipient" value={route.recipient} /><button type="submit" aria-label={`Delete ${route.recipient}`} title={`Delete ${route.recipient}`}>Delete</button></form></li>)}</ul> : <p>No individual email addresses are configured.</p>}
							<form action={routeAction} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
								<input type="hidden" name="domain" value={domain} />
								<label htmlFor="email-forwarding-recipient">Address or local part<input id="email-forwarding-recipient" name="recipient" type="text" placeholder="info or info@example.com" required /></label>
								<label htmlFor="email-forwarding-route-target">Destination<input id="email-forwarding-route-target" name="targetEmail" type="email" required /></label>
								<button type="submit">Add Forwarding Address</button>
							</form>
						</section>

						<hr />
						<section id="email-forwarding-test-section">
							<h3>Test Email Forwarding</h3>
							<form action={testAction} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
								<input type="hidden" name="domain" value={domain} />
								<label htmlFor="email-forwarding-test-recipient">Send a test to<select id="email-forwarding-test-recipient" name="recipient" required><option value={`test@${domain}`}>Catch-all (test@{domain})</option>{routes.forwardingRoutes.map((route) => <option key={route.recipient} value={route.recipient}>{route.recipient}</option>)}</select></label>
								<button type="submit">Send Forwarding Test</button>
							</form>
							{source === 'test' && message ? <p role={status === 'error' ? 'alert' : 'status'}>{message}</p> : null}
						</section>
					</>
				) : null}
			</main>
		</>
	);
}

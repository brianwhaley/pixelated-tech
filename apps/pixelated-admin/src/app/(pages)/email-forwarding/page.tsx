import React from 'react';
import { redirect } from 'next/navigation';
import { FormEngine, PageTitleHeader } from '@pixelated-tech/components';
import {
	getEmailForwardingDomainStatus,
	onboardEmailForwardingDomain,
	sendEmailForwardingTestEmail,
} from '@pixelated-tech/components/adminserver';

async function redirectWithResult(action: () => Promise<{ domain: string; targetEmail: string; message: string; identityStatus?: string; dkimStatus?: string }>, source: string, errorContext: Record<string, string> = {}) {
	'use server';
	let params: URLSearchParams;
	try {
		const result = await action();
		params = new URLSearchParams({
			domain: result.domain,
			targetEmail: result.targetEmail,
			message: result.message,
			source,
			status: 'success',
		});
		if (result.identityStatus) params.set('identityStatus', result.identityStatus);
		if (result.dkimStatus) params.set('dkimStatus', result.dkimStatus);
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

async function onboardAction(formData: FormData) {
	'use server';
	const domain = String(formData.get('domain') || '');
	const targetEmail = String(formData.get('targetEmail') || '');
	await redirectWithResult(() => onboardEmailForwardingDomain(domain, targetEmail, formData.get('overwriteDmarc') === 'true'), 'onboard', { domain, targetEmail });
}

async function statusAction(formData: FormData) {
	'use server';
	await redirectWithResult(() => getEmailForwardingDomainStatus(String(formData.get('domain') || '')), 'status');
}

async function testAction(formData: FormData) {
	'use server';
	await redirectWithResult(() => sendEmailForwardingTestEmail(String(formData.get('domain') || '')), 'test');
}

function getParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
	const value = searchParams?.[key];
	return Array.isArray(value) ? value[0] || '' : value || '';
}

function getEmailForwardingFormData(domain: string, targetEmail: string) {
	return {
		fields: [
			{ component: 'FormInput', props: { type: 'text', id: 'email-forwarding-domain', name: 'domain', defaultValue: domain, required: 'required', display: 'vertical', label: 'Domain', tooltip: 'The tenant domain to onboard for SES receiving, Route 53 DNS, and catch-all forwarding.' } },
			{ component: 'FormInput', props: { type: 'email', id: 'email-forwarding-target-email', name: 'targetEmail', defaultValue: targetEmail, required: 'required', display: 'vertical', label: 'Target Email', tooltip: 'The destination inbox where mail for this domain will be forwarded.' } },
			{ component: 'FormButton', props: { type: 'submit', id: 'email-forwarding-onboard-submit', text: 'Onboard Domain' } },
		],
	};
}

function getEmailForwardingStatusFormData(domain: string) {
	return {
		fields: [
			{ component: 'FormInput', props: { type: 'text', id: 'email-forwarding-status-domain', name: 'domain', defaultValue: domain, required: 'required', display: 'vertical', label: 'Domain', tooltip: 'The domain identity to check in SES.' } },
			{ component: 'FormButton', props: { type: 'submit', id: 'email-forwarding-status-submit', text: 'Check SES Status' } },
		],
	};
}

function getEmailForwardingTestFormData(domain: string) {
	return {
		fields: [
			{ component: 'FormInput', props: { type: 'text', id: 'email-forwarding-test-domain', name: 'domain', defaultValue: domain, required: 'required', display: 'vertical', label: 'Domain', tooltip: 'The tenant domain that should receive the forwarding test email. The app sends to test@this-domain.' } },
			{ component: 'FormButton', props: { type: 'submit', id: 'email-forwarding-test-submit', text: 'Send Forwarding Test' } },
		],
	};
}

export default async function EmailForwardingPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const resolvedSearchParams = await searchParams;
	const domain = getParam(resolvedSearchParams, 'domain');
	const targetEmail = getParam(resolvedSearchParams, 'targetEmail');
	const message = getParam(resolvedSearchParams, 'message');
	const source = getParam(resolvedSearchParams, 'source');
	const status = getParam(resolvedSearchParams, 'status');
	const identityStatus = getParam(resolvedSearchParams, 'identityStatus');
	const dkimStatus = getParam(resolvedSearchParams, 'dkimStatus');
	const canOverwriteDmarc = source === 'onboard' && status === 'error' && message.startsWith('DMARC already exists') && domain && targetEmail;

	return (
		<>
			<PageTitleHeader title="Email Forwarding Domain Setup" />
			<section id="email-forwarding-onboarding-section" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
				<h2>Onboard Email Forwarding Domain</h2>
				<div style={{ border: '2px solid currentColor', padding: '1rem' }}><FormEngine action={onboardAction} method="post" formData={getEmailForwardingFormData(domain, targetEmail)} /></div>
				{source === 'onboard' && message ? (
					<div>
						<p>{message}</p>
						{identityStatus ? <p>Identity: {identityStatus}</p> : null}
						{dkimStatus ? <p>DKIM: {dkimStatus}</p> : null}
						{canOverwriteDmarc ? (
							<form action={onboardAction}>
								<input type="hidden" name="domain" value={domain} />
								<input type="hidden" name="targetEmail" value={targetEmail} />
								<input type="hidden" name="overwriteDmarc" value="true" />
								<button type="submit">Overwrite DMARC and Continue</button>
							</form>
						) : null}
					</div>
				) : null}
			</section>
			<br />
			<section id="email-forwarding-status-section" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
				<h2>Check SES Status</h2>
				<div style={{ border: '2px solid currentColor', padding: '1rem' }}><FormEngine action={statusAction} method="post" formData={getEmailForwardingStatusFormData(domain)} /></div>
				{source === 'status' && message ? (
					<div>
						<p>{message}</p>
						{identityStatus ? <p>Identity: {identityStatus}</p> : null}
						{dkimStatus ? <p>DKIM: {dkimStatus}</p> : null}
					</div>
				) : null}
			</section>
			<br />
			<section id="email-forwarding-test-section" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px' }}>
				<h2>Send Forwarding Test</h2>
				<div style={{ border: '2px solid currentColor', padding: '1rem' }}><FormEngine action={testAction} method="post" formData={getEmailForwardingTestFormData(domain)} /></div>
				{source === 'test' && message ? <div><p>{message}</p></div> : null}
			</section>
		</>
	);
}

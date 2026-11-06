import { getFullPixelatedConfig, smartFetch, verifyWordPressWebhookSignature } from '@pixelated-tech/components/server';
import { publishSocialPost } from '@pixelated-tech/components/adminserver';

// eslint-disable-next-line pixelated/no-debug-true
const DEBUG = true;
const SENDMAIL_URL = 'https://sendmail.pixelated.tech/default/sendmail';
const DEFAULT_DEBUG_EMAIL = 'brian@pixelated.tech';

async function sendDebugEmail(requestId: string, stage: string, details: Record<string, unknown> = {}) {
	if (!DEBUG) return;

	let recipient = DEFAULT_DEBUG_EMAIL;
	try {
		const config = getFullPixelatedConfig();
		recipient = config.integrations?.socialPublish?.failureEmail || DEFAULT_DEBUG_EMAIL;
	} catch (error) {
		console.error('WordPress webhook debug email failed:', error);
	}

	try {
		const text = [
			`Request ID: ${requestId}`,
			`Stage: ${stage}`,
			...Object.entries(details).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`),
		].join('\n');
		const response = await smartFetch(SENDMAIL_URL, {
			responseType: 'status',
			cacheStrategy: 'none',
			retries: 0,
			requestInit: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: recipient,
					subject: `[Pixelated Debug] WordPress webhook ${stage}`,
					text,
				}),
			},
		});
		if (!response.ok) {
			console.error('WordPress webhook debug email failed:', response.status, await response.text());
		}
	} catch (error) {
		console.error('WordPress webhook debug email failed:', error);
	}
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	const requestId = request.headers.get('x-pixelated-request-id') || crypto.randomUUID();
	let payload: { requestId?: string; postId?: string; postUrl?: string; destinations?: Array<'nextdoor'> };
	try {
		payload = JSON.parse(rawBody);
	} catch {
		await sendDebugEmail(requestId, 'invalid-json', { error: 'Invalid JSON payload.' });
		return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
	}
	const effectiveRequestId = payload.requestId || requestId;
	await sendDebugEmail(effectiveRequestId, 'webhook-called', {
		body_length: rawBody.length,
		signature_present: request.headers.has('x-wordpress-signature'),
	});
	await sendDebugEmail(effectiveRequestId, 'payload-parsed', {
		post_id: payload.postId || '',
		post_url: payload.postUrl || '',
		destinations: payload.destinations || [],
	});

	let site = '';
	if (typeof payload.postUrl === 'string' && payload.postUrl.trim()) {
		try {
			site = new URL(payload.postUrl).hostname.toLowerCase();
		} catch {
			site = '';
		}
	}
	let secret = '';
	try {
		secret = site ? getFullPixelatedConfig().integrations?.socialPublish?.wordpress?.webhookSecrets?.[site] || '' : '';
	} catch (error) {
		if (DEBUG) console.error('WordPress webhook configuration failed:', error);
		await sendDebugEmail(effectiveRequestId, 'configuration-error', {
			error: error instanceof Error ? error.message : String(error),
		});
		return Response.json({ error: 'Webhook configuration could not be loaded.' }, { status: 500 });
	}
	if (!site) {
		await sendDebugEmail(effectiveRequestId, 'invalid-site', {
			error: 'A valid postUrl is required to identify the WordPress site.',
			post_url: payload.postUrl || '',
		});
		return Response.json({ error: 'A valid postUrl is required to identify the WordPress site.' }, { status: 400 });
	}
	if (!site || !secret || !verifyWordPressWebhookSignature(rawBody, request.headers.get('x-wordpress-signature'), secret)) {
		await sendDebugEmail(effectiveRequestId, 'invalid-signature', {
			site,
			secret_configured: secret ? 'yes' : 'no',
		});
		return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
	}
	if (!payload.postId && !payload.postUrl) {
		await sendDebugEmail(effectiveRequestId, 'invalid-payload', {
			error: 'Provide at least one of postId or postUrl.',
			site,
		});
		return Response.json({ error: 'Provide at least one of postId or postUrl.' }, { status: 400 });
	}

	try {
		await sendDebugEmail(effectiveRequestId, 'social-publish-started', {
			site,
			post_id: payload.postId || '',
			post_url: payload.postUrl || '',
		});
		const result = await publishSocialPost({
			site,
			postId: payload.postId,
			postUrl: payload.postUrl,
			destinations: payload.destinations,
		});
		await sendDebugEmail(effectiveRequestId, 'social-publish-succeeded', result);
		return Response.json(result, { status: 200 });
	} catch (error) {
		if (DEBUG) console.error('WordPress social publish failed:', error);
		await sendDebugEmail(effectiveRequestId, 'social-publish-failed', {
			site,
			error: error instanceof Error ? error.message : String(error),
		});
		return Response.json({ error: error instanceof Error ? error.message : 'Social publish failed.' }, { status: 500 });
	}
}

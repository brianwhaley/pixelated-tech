import { getFullPixelatedConfig, verifyWordPressWebhookSignature } from '@pixelated-tech/components/server';
import { publishSocialPost } from '@pixelated-tech/components/adminserver';

// eslint-disable-next-line pixelated/no-debug-true
const DEBUG = true;

function logDebug(requestId: string, stage: string, details: Record<string, unknown> = {}) {
	if (!DEBUG) return;

	console.log('WordPress webhook:', { requestId, stage, ...details });
}

function logDebugError(requestId: string, stage: string, details: Record<string, unknown> = {}) {
	if (!DEBUG) return;

	console.error('WordPress webhook error:', { requestId, stage, ...details });
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	const requestId = request.headers.get('x-pixelated-request-id') || crypto.randomUUID();
	let payload: { requestId?: string; postId?: string; postUrl?: string; destinations?: Array<'nextdoor'> };
	try {
		payload = JSON.parse(rawBody);
	} catch {
		logDebugError(requestId, 'invalid-json', { error: 'Invalid JSON payload.' });
		return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
	}
	const effectiveRequestId = payload.requestId || requestId;
	logDebug(effectiveRequestId, 'webhook-called', {
		body_length: rawBody.length,
		signature_present: request.headers.has('x-wordpress-signature'),
	});
	logDebug(effectiveRequestId, 'payload-parsed', {
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
		logDebugError(effectiveRequestId, 'configuration-error', {
			error: error instanceof Error ? error.message : String(error),
		});
		return Response.json({ error: 'Webhook configuration could not be loaded.' }, { status: 500 });
	}
	if (!site) {
		logDebugError(effectiveRequestId, 'invalid-site', {
			error: 'A valid postUrl is required to identify the WordPress site.',
			post_url: payload.postUrl || '',
		});
		return Response.json({ error: 'A valid postUrl is required to identify the WordPress site.' }, { status: 400 });
	}
	if (!site || !secret || !verifyWordPressWebhookSignature(rawBody, request.headers.get('x-wordpress-signature'), secret)) {
		logDebugError(effectiveRequestId, 'invalid-signature', {
			site,
			secret_configured: secret ? 'yes' : 'no',
		});
		return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
	}
	if (!payload.postId && !payload.postUrl) {
		logDebugError(effectiveRequestId, 'invalid-payload', {
			error: 'Provide at least one of postId or postUrl.',
			site,
		});
		return Response.json({ error: 'Provide at least one of postId or postUrl.' }, { status: 400 });
	}

	try {
		logDebug(effectiveRequestId, 'social-publish-started', {
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
		logDebug(effectiveRequestId, 'social-publish-succeeded', result);
		return Response.json(result, { status: 200 });
	} catch (error) {
		logDebugError(effectiveRequestId, 'social-publish-failed', {
			site,
			error: error instanceof Error ? error.message : String(error),
		});
		return Response.json({ error: error instanceof Error ? error.message : 'Social publish failed.' }, { status: 500 });
	}
}

import { getFullPixelatedConfig, verifyWordPressWebhookSignature } from '@pixelated-tech/components/server';
import { publishSocialPost } from '@pixelated-tech/components/adminserver';

export async function POST(request: Request) {
	const rawBody = await request.text();
	let payload: { site?: string; postId?: string; postUrl?: string; destinations?: Array<'nextdoor'> };
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
	}

	const site = typeof payload.site === 'string' ? payload.site.trim() : '';
	const secret = site ? getFullPixelatedConfig().integrations?.socialPublish?.wordpress?.webhookSecrets?.[site] : '';
	if (!site || !secret || !verifyWordPressWebhookSignature(rawBody, request.headers.get('x-wordpress-signature'), secret)) {
		return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
	}
	if (!payload.postId && !payload.postUrl) {
		return Response.json({ error: 'Provide at least one of postId or postUrl.' }, { status: 400 });
	}

	try {
		const result = await publishSocialPost({
			site,
			postId: payload.postId,
			postUrl: payload.postUrl,
			destinations: payload.destinations,
		});
		return Response.json(result, { status: 200 });
	} catch (error) {
		console.error('WordPress social publish failed:', error);
		return Response.json({ error: error instanceof Error ? error.message : 'Social publish failed.' }, { status: 500 });
	}
}

/* eslint-disable pixelated/no-hardcoded-config-keys */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	publishSocialPost: vi.fn(),
	fetch: vi.fn(),
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getFullPixelatedConfig: () => ({
		integrations: {
			socialPublish: {
				wordpress: {
					webhookSecrets: {
						'blog.pixelated.tech': 'site-secret',
					},
				},
			},
		},
	}),
	smartFetch: vi.fn(async (url: string, options: { requestInit?: RequestInit }) => {
		mocks.fetch(url, options.requestInit);
		return new Response('{}', { status: 200 });
	}),
	verifyWordPressWebhookSignature: (_rawBody: string, signature: string | null, secret: string) => signature === `valid:${secret}`,
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	publishSocialPost: mocks.publishSocialPost,
}));

import { POST } from '../app/api/webhooks/wordpress/route';

function makeRequest(body: unknown, signature = 'valid:site-secret') {
	return new Request('https://admin.pixelated.tech/api/webhooks/wordpress', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WordPress-Signature': signature,
		},
		body: JSON.stringify(body),
	});
}

describe('WordPress webhook route', () => {
	beforeEach(() => {
		mocks.publishSocialPost.mockReset();
		mocks.fetch.mockReset();
		mocks.fetch.mockResolvedValue(new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', mocks.fetch);
		mocks.publishSocialPost.mockResolvedValue({
			site: 'blog.pixelated.tech',
			postId: 'post-1',
			url: 'https://blog.pixelated.tech/post-1',
			destinations: ['nextdoor'],
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('derives the site from the post URL and publishes the post', async () => {
		const response = await POST(makeRequest({
			requestId: 'request-1',
			postId: 'post-1',
			postUrl: 'https://blog.pixelated.tech/post-1',
			destinations: ['nextdoor'],
		}));

		expect(response.status).toBe(200);
		expect(mocks.publishSocialPost).toHaveBeenCalledWith({
			site: 'blog.pixelated.tech',
			postId: 'post-1',
			postUrl: 'https://blog.pixelated.tech/post-1',
			destinations: ['nextdoor'],
		});
		expect(mocks.fetch).toHaveBeenCalled();
		expect(JSON.parse(mocks.fetch.mock.calls[0][1].body as string).text).toContain('Request ID: request-1');
	});

	it('requires a valid post URL to identify the site', async () => {
		const response = await POST(makeRequest({ postId: 'post-1' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'A valid postUrl is required to identify the WordPress site.' });
	});

	it('rejects an invalid signature for the derived site', async () => {
		const response = await POST(makeRequest({
			postId: 'post-1',
			postUrl: 'https://blog.pixelated.tech/post-1',
		}, 'valid:wrong-secret'));

		expect(response.status).toBe(401);
		expect(mocks.publishSocialPost).not.toHaveBeenCalled();
	});
});
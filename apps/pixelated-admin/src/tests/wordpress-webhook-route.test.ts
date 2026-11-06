/* eslint-disable pixelated/no-hardcoded-config-keys */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	publishSocialPost: vi.fn(),
	consoleError: vi.fn(),
	consoleLog: vi.fn(),
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
		mocks.consoleError.mockReset();
		mocks.consoleLog.mockReset();
		vi.spyOn(console, 'error').mockImplementation(mocks.consoleError);
		vi.spyOn(console, 'log').mockImplementation(mocks.consoleLog);
		mocks.publishSocialPost.mockResolvedValue({
			site: 'blog.pixelated.tech',
			postId: 'post-1',
			url: 'https://blog.pixelated.tech/post-1',
			destinations: ['nextdoor'],
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
		expect(mocks.consoleLog).toHaveBeenCalledWith('WordPress webhook:', expect.objectContaining({
		requestId: 'request-1',
		stage: 'webhook-called',
	}));
		expect(mocks.consoleLog).toHaveBeenCalledWith('WordPress webhook:', expect.objectContaining({
		requestId: 'request-1',
		stage: 'social-publish-succeeded',
		postId: 'post-1',
	}));
	});

	it('requires a valid post URL to identify the site', async () => {
		const response = await POST(makeRequest({ postId: 'post-1' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'A valid postUrl is required to identify the WordPress site.' });
		expect(mocks.consoleError).toHaveBeenCalledWith('WordPress webhook error:', expect.objectContaining({
		stage: 'invalid-site',
	}));
	});

	it('rejects an invalid signature for the derived site', async () => {
		const response = await POST(makeRequest({
			postId: 'post-1',
			postUrl: 'https://blog.pixelated.tech/post-1',
		}, 'valid:wrong-secret'));

		expect(response.status).toBe(401);
		expect(mocks.publishSocialPost).not.toHaveBeenCalled();
		expect(mocks.consoleError).toHaveBeenCalledWith('WordPress webhook error:', expect.objectContaining({
		stage: 'invalid-signature',
	}));
	});
});
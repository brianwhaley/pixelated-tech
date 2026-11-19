/* eslint-disable pixelated/no-hardcoded-config-keys */
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

const redirect = vi.hoisted(() => vi.fn((url: string) => {
	throw new Error(`REDIRECT:${url}`);
}));
const getFullPixelatedConfig = vi.hoisted(() => vi.fn());
const getWordPressPost = vi.hoisted(() => vi.fn());
const smartFetch = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@pixelated-tech/components', () => ({ PageTitleHeader: () => null }));
vi.mock('@pixelated-tech/components/server', () => ({ getFullPixelatedConfig, getWordPressPost, smartFetch }));

import { publishAction } from '../app/(pages)/social-publish/page';

const config = {
	integrations: {
		wordpress: { site: 'amavajanitorial.wpcomstaging.com', baseURL: 'https://public-api.example.com' },
		socialPublish: { wordpress: { webhookSecrets: { 'amavajanitorial.blog': 'webhook-secret' } } },
	},
};

function formData(values: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.append(key, value);
	return data;
}

describe('social publish page action', () => {
	it('resolves a post ID and submits the signed request to the API', async () => {
		getFullPixelatedConfig.mockReturnValue(config);
		getWordPressPost.mockResolvedValue({ ID: '42', URL: 'https://amavajanitorial.blog/post-42' });
		smartFetch.mockResolvedValue({ accepted: true, requestId: 'request-1' });

		await expect(publishAction(formData({
			site: 'amava-janitorial',
			postId: '42',
			destinations: 'nextdoor',
		}))).rejects.toThrow('REDIRECT:/social-publish?status=success&message=Publish%20accepted.%20Request%20ID%3A%20request-1');

		const body = JSON.stringify({
			site: 'amava-janitorial',
			postId: '42',
			postUrl: 'https://amavajanitorial.blog/post-42',
			destinations: ['nextdoor'],
		});
		expect(getWordPressPost).toHaveBeenCalledWith({
			site: 'amavajanitorial.wpcomstaging.com',
			postId: '42',
			baseURL: 'https://public-api.example.com',
		});
		expect(smartFetch).toHaveBeenCalledWith('https://api.pixelated.tech/social-publish', expect.objectContaining({
			responseType: 'json',
			cacheStrategy: 'none',
			retries: 0,
			requestInit: expect.objectContaining({
				method: 'POST',
				body,
				headers: expect.objectContaining({
					'X-WordPress-Signature': `sha256=${createHmac('sha256', 'webhook-secret').update(body).digest('hex')}`,
				}),
			}),
		}));
	});

	it('redirects API failures as errors', async () => {
		getFullPixelatedConfig.mockReturnValue(config);
		smartFetch.mockRejectedValue(new Error('API unavailable'));

		await expect(publishAction(formData({
			site: 'amava-janitorial',
			postUrl: 'https://amavajanitorial.blog/post-42',
			destinations: 'nextdoor',
		}))).rejects.toThrow('REDIRECT:/social-publish?status=error&message=API%20unavailable');
	});
});

import { describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { deepClone } from '../test/test-utils';

vi.mock('../components/foundation/smartfetch', () => ({ smartFetch: vi.fn() }));

const { smartFetch } = await import('../components/foundation/smartfetch');
const { getWordPressPost, verifyWordPressWebhookSignature } = await import('../components/integrations/wordpress.server');

describe('WordPress webhook signatures', () => {
	it('accepts a matching sha256 signature', () => {
		const payload = JSON.stringify(deepClone({ site: 'amava-janitorial', postId: '42' }));
		const secret = 'webhook-secret';
		const signature = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;

		expect(verifyWordPressWebhookSignature(payload, signature, secret)).toBe(true);
	});

	it('rejects missing, malformed, and incorrect signatures', () => {
		const payload = '{"site":"amava-janitorial"}';
		expect(verifyWordPressWebhookSignature(payload, null, 'webhook-secret')).toBe(false);
		expect(verifyWordPressWebhookSignature(payload, 'not-a-signature', 'webhook-secret')).toBe(false);
		expect(verifyWordPressWebhookSignature(payload, 'sha256=' + '0'.repeat(64), 'webhook-secret')).toBe(false);
	});
});

describe('WordPress post lookup', () => {
	it('normalizes a numeric REST API post ID', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			ID: 42,
			title: 'Published post',
			URL: 'https://blog.example.com/published-post',
		});

		expect(await getWordPressPost({ site: 'blog.example.com', postId: '42' })).toMatchObject({ ID: '42' });
	});
});

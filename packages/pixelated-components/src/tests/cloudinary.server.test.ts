import { describe, expect, it, vi } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));

const { smartFetch } = await import('../components/foundation/smartfetch');
const { downloadCloudinaryTransformedImage } = await import('../components/integrations/cloudinary.server');

const mockSmartFetch = vi.mocked(smartFetch);

describe('downloadCloudinaryTransformedImage', () => {
	it('requires a source URL and Cloudinary product environment', async () => {
		await expect(downloadCloudinaryTransformedImage({ sourceUrl: '', productEnv: 'test-cloud' })).rejects.toThrow(
			'Cloudinary image transformation requires sourceUrl and productEnv'
		);
		await expect(downloadCloudinaryTransformedImage({ sourceUrl: 'https://stock.example/image.jpg', productEnv: '' })).rejects.toThrow(
			'Cloudinary image transformation requires sourceUrl and productEnv'
		);
		expect(mockSmartFetch).not.toHaveBeenCalled();
	});

	it('downloads the deterministic Cloudinary WebP transformation', async () => {
		const imageBytes = Uint8Array.from([1, 2, 3]).buffer;
		mockSmartFetch.mockResolvedValue(imageBytes);

		const result = await downloadCloudinaryTransformedImage({
			sourceUrl: 'https://stock.example/image.jpg',
			productEnv: 'test-cloud',
			cloudinaryDomain: 'https://images.example',
		});

		expect(result).toEqual({
			url: expect.stringContaining('https://images.example/test-cloud/image/fetch/'),
			buffer: Buffer.from(imageBytes),
			mimeType: 'image/webp',
		});
		expect(result.url).toContain('w_2500');
		expect(result.url).toContain('h_2500');
		expect(result.url).toContain('c_limit');
		expect(result.url).toContain('f_webp');
		expect(result.url).toContain('q_auto');
		expect(mockSmartFetch).toHaveBeenCalledWith(result.url, {
			responseType: 'arrayBuffer',
			timeout: 60000,
			retries: 0,
		});
	});

	it('propagates Cloudinary download failures', async () => {
		const error = new Error('Cloudinary unavailable');
		mockSmartFetch.mockRejectedValue(error);

		await expect(downloadCloudinaryTransformedImage({
			sourceUrl: 'https://stock.example/image.jpg',
			productEnv: 'test-cloud',
		})).rejects.toBe(error);
	});
});

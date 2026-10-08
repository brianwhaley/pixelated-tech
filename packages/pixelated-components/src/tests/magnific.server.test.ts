import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));
vi.mock('../components/integrations/cloudinary.server', () => ({
	downloadCloudinaryTransformedImage: vi.fn(),
}));

const { smartFetch } = await import('../components/foundation/smartfetch');
const { downloadCloudinaryTransformedImage } = await import('../components/integrations/cloudinary.server');
const { findMagnificStockImage, prepareMagnificStockImage } = await import('../components/integrations/magnific.server');

const mockSmartFetch = vi.mocked(smartFetch);
const mockDownloadCloudinaryTransformedImage = vi.mocked(downloadCloudinaryTransformedImage);

beforeEach(() => {
	vi.resetAllMocks();
});

describe('findMagnificStockImage', () => {
	it('returns null without an API key or search terms', async () => {
		const input = { title: 'Basement waterproofing', imageBrief: 'A basement protected from water damage', searchTerms: ['waterproofing'] };
		expect(await findMagnificStockImage('', input)).toBeNull();
		expect(await findMagnificStockImage('magnific-key', { ...input, searchTerms: [] })).toBeNull();
		expect(mockSmartFetch).not.toHaveBeenCalled();
	});

	it('selects the highest-scoring relevant photo', async () => {
		mockSmartFetch.mockResolvedValue({
			data: [
				{ id: 'ai-1', title: 'Generated server image', imageUrl: 'https://ai.example/image.jpg', image: { type: 'ai-generated', source: { url: 'https://ai.example/image.jpg' } } },
				{
					resourceId: 'stock-1',
					name: 'Server room',
					image: {
						type: 'photo',
						orientation: 'landscape',
						source: { url: 'https://stock.example/server.jpg' },
					},
				},
				{
					resourceId: 'stock-2',
					name: 'Server room technology powered by renewable energy',
					url: 'https://www.magnific.com/free-photo/renewable-server.htm',
					image: {
						type: 'photo',
						orientation: 'landscape',
						source: { url: 'https://stock.example/renewable-server.jpg' },
					},
					licenses: [{ url: 'https://stock.example/license' }],
					author: { name: 'Stock Provider' },
				},
			],
		});

		const result = await findMagnificStockImage('magnific-key', {
			title: 'Sustainable server technology',
			imageBrief: 'A realistic photograph of efficient technology',
			searchTerms: ['renewable energy server'],
		});

		expect(result).toEqual({
			id: 'stock-2',
			title: 'Server room technology powered by renewable energy',
			sourceUrl: 'https://stock.example/renewable-server.jpg',
			detailUrl: 'https://www.magnific.com/free-photo/renewable-server.htm',
			licenseUrl: 'https://stock.example/license',
			provider: 'Stock Provider',
			orientation: 'landscape',
		});
		expect(mockSmartFetch).toHaveBeenCalledWith(
			expect.stringContaining('term=renewable+energy+server'),
			expect.objectContaining({
				timeout: 30000,
				retries: 0,
				requestInit: { headers: { 'x-magnific-api-key': 'magnific-key' } },
			})
		);
		expect(mockSmartFetch.mock.calls[0][0]).toContain('filters%5Bcontent_type%5D%5Bphoto%5D=1');
		expect(mockSmartFetch.mock.calls[0][0]).toContain('filters%5Bai-generated%5D%5Bexcluded%5D=1');
	});

	it('uses popularity to break close matches without promoting a weak match', async () => {
		mockSmartFetch.mockResolvedValue({
			data: [
				{ id: 'best-match', title: 'Small business technology workspace', stats: { downloads: 2, likes: 0 }, image: { type: 'photo', source: { url: 'https://stock.example/best.jpg' } } },
				{ id: 'popular-near-match', title: 'Small business technology owner with laptop', stats: { downloads: 100000, likes: 10000 }, image: { type: 'photo', source: { url: 'https://stock.example/popular.jpg' } } },
				{ id: 'popular-weak-match', title: 'Business laptop', stats: { downloads: 1000000, likes: 100000 }, image: { type: 'photo', source: { url: 'https://stock.example/weak.jpg' } } },
			],
		});

		const result = await findMagnificStockImage('magnific-key', {
			title: 'Small business technology',
			imageBrief: 'A realistic small business technology photograph',
			searchTerms: ['small business technology'],
		});

		expect(result?.id).toBe('popular-near-match');
	});

	it('rejects a search-term match without article-context overlap', async () => {
		mockSmartFetch.mockResolvedValue({
			data: [{ id: 'generic-match', title: 'Small business technology', image: { type: 'photo', source: { url: 'https://stock.example/generic.jpg' } } }],
		});

		await expect(findMagnificStockImage('magnific-key', {
			title: 'Link building strategy',
			imageBrief: 'A realistic photograph of SEO analysis and website links',
			searchTerms: ['small business technology'],
		})).resolves.toBeNull();
	});

	it('rejects non-photo and obviously unsuitable assets', async () => {
		mockSmartFetch.mockResolvedValue({
			data: [
				{ title: 'Server rack vector illustration', image: { type: 'vector', source: { url: 'https://stock.example/server.svg' } } },
				{ title: 'Renewable energy logo', image: { type: 'photo', source: { url: 'https://stock.example/logo.jpg' } } },
				{ title: 'Server room line art PSD', image: { type: 'photo', source: { url: 'https://stock.example/server-room.psd' } } },
			],
		});

		expect(await findMagnificStockImage('magnific-key', {
			title: 'Sustainable server technology',
			imageBrief: 'A realistic server photograph',
			searchTerms: ['renewable energy server'],
		})).toBeNull();
	});

	it('returns null when Magnific has no supported resource collection', async () => {
		mockSmartFetch.mockResolvedValue({ resources: [] });
		expect(await findMagnificStockImage('magnific-key', { title: 'Basement', imageBrief: 'A basement photo', searchTerms: ['basement'] })).toBeNull();

		mockSmartFetch.mockResolvedValue({ message: 'no resources' });
		expect(await findMagnificStockImage('magnific-key', { title: 'Basement', imageBrief: 'A basement photo', searchTerms: ['basement'] })).toBeNull();
	});
});

describe('prepareMagnificStockImage', () => {
	it('uses Cloudinary to prepare the selected stock image', async () => {
		const image = {
			id: 'stock-2',
			title: 'Dry basement',
			sourceUrl: 'https://stock.example/image.jpg',
			detailUrl: 'https://stock.example/image',
		};
		const buffer = Buffer.from('webp');
		const cloudinaryConfig = { ['product' + '_env']: 'test-cloud', baseUrl: 'https://images.example' };
		mockDownloadCloudinaryTransformedImage.mockResolvedValue({ url: 'https://cloudinary.example/image.webp', buffer, mimeType: 'image/webp' });

		await expect(prepareMagnificStockImage(image, cloudinaryConfig)).resolves.toEqual({
			...image,
			buffer,
			mimeType: 'image/webp',
		});
		expect(mockDownloadCloudinaryTransformedImage).toHaveBeenCalledWith({
			sourceUrl: image.sourceUrl,
			productEnv: 'test-cloud',
			cloudinaryDomain: 'https://images.example',
		});
	});
});

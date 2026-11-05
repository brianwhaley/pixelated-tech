import { beforeEach, describe, expect, it, vi } from 'vitest';

const getFullPixelatedConfig = vi.hoisted(() => vi.fn());
const sendSmtpEmail = vi.hoisted(() => vi.fn());
const publishToNextdoor = vi.hoisted(() => vi.fn());
const closePuppeteerBrowser = vi.hoisted(() => vi.fn());
const launchPuppeteerBrowser = vi.hoisted(() => vi.fn());
const openPuppeteerPage = vi.hoisted(() => vi.fn());
const getWordPressPost = vi.hoisted(() => vi.fn());

vi.mock('../components/config/config', () => ({ getFullPixelatedConfig }));
vi.mock('../components/integrations/smtp.integration', () => ({ sendSmtpEmail }));
vi.mock('../components/integrations/nextdoor.server', () => ({ publishToNextdoor }));
vi.mock('../components/integrations/puppeteer.server', () => ({
	closePuppeteerBrowser,
	launchPuppeteerBrowser,
	openPuppeteerPage,
}));
vi.mock('../components/integrations/wordpress.server', () => ({ getWordPressPost }));

import { publishSocialPost } from '../components/admin/socialpublish/socialpublish.server';

const config = {
	integrations: {
		wordpress: { site: 'blog.example.com', baseURL: 'https://public-api.example.com' },
		socialPublish: {
		failureEmail: 'failures@example.com',
		nextdoor: { sites: { example: { username: 'nextdoor-user', password: 'nextdoor-password', businessPageUrl: 'https://nextdoor.com/page/example' } } },
		},
		puppeteer: { executable_path: '/browser/chrome' },
		smtp: { smtpUser: 'smtp@example.com' },
	},
};

const post = {
	ID: '42',
	title: 'Published title',
	excerpt: 'Published excerpt',
	URL: 'https://blog.example.com/published-title',
};

function setSuccessfulDependencies() {
	getFullPixelatedConfig.mockReturnValue(config);
	getWordPressPost.mockResolvedValue(post);
	launchPuppeteerBrowser.mockResolvedValue({ id: 'browser' });
	openPuppeteerPage.mockResolvedValue({ id: 'page' });
	closePuppeteerBrowser.mockResolvedValue(undefined);
	publishToNextdoor.mockResolvedValue(undefined);
	sendSmtpEmail.mockResolvedValue(undefined);
}

describe('publishSocialPost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setSuccessfulDependencies();
	});

	it('publishes the WordPress post to the configured Nextdoor site', async () => {
		await expect(publishSocialPost({ site: 'example', postId: '42' })).resolves.toEqual({
			site: 'example',
			postId: '42',
			url: post.URL,
			destinations: ['nextdoor'],
		});

		expect(getWordPressPost).toHaveBeenCalledWith({
			site: 'blog.example.com',
			postId: '42',
			postUrl: undefined,
			baseURL: 'https://public-api.example.com',
		});
		expect(launchPuppeteerBrowser).toHaveBeenCalledWith({ headless: true, executablePath: '/browser/chrome' });
		expect(publishToNextdoor).toHaveBeenCalledWith({
			page: { id: 'page' },
			username: 'nextdoor-user',
			password: 'nextdoor-password',
			businessPageUrl: 'https://nextdoor.com/page/example',
			title: post.title,
			excerpt: post.excerpt,
			url: post.URL,
		});
		expect(closePuppeteerBrowser).toHaveBeenCalledWith({ id: 'browser' });
	});

	it('uses the requested destinations and post URL', async () => {
		await publishSocialPost({ site: 'example', postUrl: post.URL, destinations: ['nextdoor'] });

		expect(getWordPressPost).toHaveBeenCalledWith(expect.objectContaining({ postId: undefined, postUrl: post.URL }));
	});

	it('rejects missing WordPress configuration before fetching the post', async () => {
		getFullPixelatedConfig.mockReturnValue({ integrations: {} });

		await expect(publishSocialPost({ site: 'example', postId: '42' })).rejects.toThrow('WordPress site is not configured.');
		expect(getWordPressPost).not.toHaveBeenCalled();
	});

	it('rejects when WordPress returns no post', async () => {
		getWordPressPost.mockResolvedValue(null);

		await expect(publishSocialPost({ site: 'example', postId: '42' })).rejects.toThrow('WordPress post could not be found.');
	});

	it('rejects unsupported destinations and sends a failure email', async () => {
		await expect(publishSocialPost({ site: 'example', postId: '42', destinations: ['facebook' as never] })).rejects.toThrow(
			'Unsupported social destination: facebook'
		);

		expect(sendSmtpEmail).toHaveBeenCalledWith(
			'smtp@example.com',
			'failures@example.com',
			'Social publish failed: Published title',
			'Unsupported social destination: facebook\n\nhttps://blog.example.com/published-title',
		);
	});

	it('rejects missing Nextdoor credentials and uses the default failure recipient', async () => {
		getFullPixelatedConfig.mockReturnValue({
			...config,
			integrations: {
				...config.integrations,
				socialPublish: { nextdoor: { sites: { example: { businessPageUrl: 'https://nextdoor.com/page/example' } } } },
				smtp: {},
			},
		});

		await expect(publishSocialPost({ site: 'example', postId: '42' })).rejects.toThrow(
			'Nextdoor credentials are not configured for site: example'
		);
		expect(sendSmtpEmail).toHaveBeenCalledWith(
			'brian@pixelated.tech',
			'brian@pixelated.tech',
			expect.any(String),
			expect.stringContaining('Nextdoor credentials are not configured'),
		);
	});

	it('cleans up and emails when the Nextdoor publisher fails', async () => {
		const error = new Error('Nextdoor rejected the post');
		publishToNextdoor.mockRejectedValue(error);

		await expect(publishSocialPost({ site: 'example', postId: '42' })).rejects.toBe(error);
		expect(closePuppeteerBrowser).toHaveBeenCalledWith({ id: 'browser' });
		expect(sendSmtpEmail).toHaveBeenCalledWith(
			'smtp@example.com',
			'failures@example.com',
			'Social publish failed: Published title',
			'Nextdoor rejected the post\n\nhttps://blog.example.com/published-title',
		);
	});
});

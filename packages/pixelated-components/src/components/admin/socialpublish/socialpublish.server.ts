"use server";

import { getFullPixelatedConfig } from '../../config/config';
import { sendSmtpEmail } from '../../integrations/smtp.integration';
import { publishToNextdoor } from '../../integrations/nextdoor.server';
import { closePuppeteerBrowser, launchPuppeteerBrowser, openPuppeteerPage } from '../../integrations/puppeteer.server';
import { getWordPressPost } from '../../integrations/wordpress.server';

export type SocialPublishDestination = 'nextdoor';

export interface SocialPublishRequest {
	site: string;
	postId?: string;
	postUrl?: string;
	destinations?: SocialPublishDestination[];
}

export interface SocialPublishResult {
	site: string;
	postId: string;
	url: string;
	destinations: SocialPublishDestination[];
}

export async function publishSocialPost(request: SocialPublishRequest): Promise<SocialPublishResult> {
	const config = getFullPixelatedConfig();
	const socialConfig = config.integrations?.socialPublish;
	const siteConfig = socialConfig?.nextdoor?.sites?.[request.site];
	const wordpressSite = config.integrations?.wordpress?.site;
	if (!wordpressSite) throw new Error('WordPress site is not configured.');
	const destinations: SocialPublishDestination[] = request.destinations?.length
		? request.destinations
		: ['nextdoor'];
	const post = await getWordPressPost({
		site: wordpressSite,
		postId: request.postId,
		postUrl: request.postUrl,
		baseURL: config.integrations?.wordpress?.baseURL,
	});
	if (!post) throw new Error('WordPress post could not be found.');

	try {
		for (const destination of destinations) {
			if (destination !== 'nextdoor') throw new Error(`Unsupported social destination: ${destination}`);
			if (!siteConfig?.username || !siteConfig.password) {
				throw new Error(`Nextdoor credentials are not configured for site: ${request.site}`);
			}
			if (!siteConfig.businessPageUrl) {
				throw new Error(`Nextdoor Business Page URL is not configured for site: ${request.site}`);
			}
			const browser = await launchPuppeteerBrowser({
				executablePath: config.integrations?.puppeteer?.executable_path,
			});
			try {
				const page = await openPuppeteerPage(browser);
				await publishToNextdoor({
					page,
					username: siteConfig.username,
					password: siteConfig.password,
					businessPageUrl: siteConfig.businessPageUrl,
					title: post.title,
					excerpt: post.excerpt,
					url: post.URL,
				});
			} finally {
				await closePuppeteerBrowser(browser);
			}
		}
	} catch (error) {
		const failureEmail = socialConfig?.failureEmail || 'brian@pixelated.tech';
		try {
			await sendSmtpEmail(
				config.integrations?.smtp?.smtpUser || failureEmail,
				failureEmail,
				`Social publish failed: ${post.title}`,
				`${error instanceof Error ? error.message : String(error)}\n\n${post.URL}`,
			);
		} catch (emailError) {
			console.error('Failed to send social publish failure email:', emailError);
		}
		throw error;
	}

	return {
		site: request.site,
		postId: post.ID,
		url: post.URL,
		destinations,
	};
}

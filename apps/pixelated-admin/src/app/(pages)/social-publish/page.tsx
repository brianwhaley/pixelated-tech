import { createHmac } from 'node:crypto';
import { redirect } from 'next/navigation';
import { PageTitleHeader } from '@pixelated-tech/components';
import { getFullPixelatedConfig, getWordPressPost, smartFetch } from '@pixelated-tech/components/server';
import type { SocialPublishDestination } from '@pixelated-tech/components/adminserver';
import sitesData from '../../data/sites.json';

type SiteRecord = {
	name?: string;
	blog_url?: string;
};

const sites = (sitesData.sites as SiteRecord[]).filter((site) => site.name && site.blog_url);

export async function publishAction(formData: FormData) {
	'use server';
	const site = String(formData.get('site') || '').trim();
	const postId = String(formData.get('postId') || '').trim();
	const postUrl = String(formData.get('postUrl') || '').trim();
	const destinations = formData.getAll('destinations').map(String).filter((value): value is SocialPublishDestination => value === 'nextdoor');
	if (!site || (postId && postUrl) || (!postId && !postUrl) || destinations.length === 0) {
		redirect('/social-publish?status=error&message=Choose a site, one post identifier, and at least one destination.');
	}
	let requestId = '';
	try {
		const config = getFullPixelatedConfig();
		const post = postUrl ? { URL: postUrl, ID: postId } : await getWordPressPost({
			site: config.integrations?.wordpress?.site || '',
			postId,
			baseURL: config.integrations?.wordpress?.baseURL,
		});
		if (!post?.URL) throw new Error('WordPress post could not be found.');
		const body = JSON.stringify({ site, postId: post.ID, postUrl: post.URL, destinations });
		const secret = config.integrations?.socialPublish?.wordpress?.webhookSecrets?.[new URL(post.URL).hostname.toLowerCase()];
		if (!secret) throw new Error(`Social publish secret is not configured for ${site}.`);
		const result = await smartFetch('https://api.pixelated.tech/social-publish', { responseType: 'json', cacheStrategy: 'none', retries: 0, timeout: 30000, requestInit: { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WordPress-Signature': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` }, body } }) as { accepted?: boolean; requestId?: string; error?: string };
		if (!result.accepted || !result.requestId) throw new Error(result.error || 'Social publish request failed.');
		requestId = result.requestId;
	} catch (error) {
		redirect(`/social-publish?status=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Social publish failed.')}`);
	}
	redirect(`/social-publish?status=success&message=${encodeURIComponent(`Publish accepted. Request ID: ${requestId}`)}`);
}

function getParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string): string {
	const value = searchParams?.[key];
	return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function SocialPublishPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const status = getParam(params, 'status');
	const message = getParam(params, 'message');
	return (
		<main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem' }}>
			<PageTitleHeader title="Social Publish" />
			{message ? <p role={status === 'error' ? 'alert' : 'status'}>{message}</p> : null}
			<form action={publishAction} style={{ display: 'grid', gap: '1rem' }}>
				<label>
					Site
					<select name="site" required defaultValue="">
						<option value="" disabled>Select a site</option>
						{sites.map((site) => <option key={site.name} value={site.name}>{site.name}</option>)}
					</select>
				</label>
				<label>
					Post ID
					<input name="postId" inputMode="numeric" />
				</label>
				<label>
					Post URL
					<input name="postUrl" type="url" />
				</label>
				<fieldset>
					<legend>Destinations</legend>
					<label><input type="checkbox" name="destinations" value="nextdoor" defaultChecked /> Nextdoor</label>
				</fieldset>
				<button type="submit">Publish</button>
			</form>
		</main>
	);
}

import { redirect } from 'next/navigation';
import { PageTitleHeader } from '@pixelated-tech/components';
import { publishSocialPost, type SocialPublishDestination } from '@pixelated-tech/components/adminserver';
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
	let result;
	try {
		result = await publishSocialPost({ site, postId: postId || undefined, postUrl: postUrl || undefined, destinations });
	} catch (error) {
		redirect(`/social-publish?status=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Social publish failed.')}`);
	}
	redirect(`/social-publish?status=success&message=${encodeURIComponent(`Published ${result.postId} to ${result.destinations.join(', ')}.`)}`);
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

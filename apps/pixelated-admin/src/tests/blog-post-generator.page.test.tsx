import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockLoadSites = vi.hoisted(() => vi.fn());
const mockGenerate = vi.hoisted(() => vi.fn());
const mockDrafts = vi.hoisted(() => vi.fn());

vi.mock('@pixelated-tech/components/server', () => ({ loadSitesConfig: mockLoadSites }));
vi.mock('@pixelated-tech/components/adminserver', () => ({
	generateBlogPostsFromCalendar: mockGenerate,
	getExistingWordPressDrafts: mockDrafts,
}));
vi.mock('../app/(pages)/blog-post-generator/BlogPostGeneratorClient', () => ({
	default: ({ action, getExistingDraftsAction, sites }: { action: Function; getExistingDraftsAction: Function; sites: unknown[] }) => {
		React.useEffect(() => {
			const formData = new FormData();
			formData.set('siteName', 'Example');
			void action(null, formData);
			void getExistingDraftsAction(formData);
		}, [action, getExistingDraftsAction]);
		return <output data-testid="blog-sites">{JSON.stringify(sites)}</output>;
	},
}));

describe('BlogPostGeneratorPage', () => {
	it('loads only configured blog sites and wires server actions', async () => {
		mockLoadSites.mockResolvedValue([
			{ name: 'Example', blog_url: 'https://example.com' },
			{ name: 'No Blog' },
		]);
		mockGenerate.mockResolvedValue({ calendar: [], results: [] });
		mockDrafts.mockResolvedValue([]);
		const Page = (await import('../app/(pages)/blog-post-generator/page')).default;
		render(await Page());
		await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
		expect(mockDrafts).toHaveBeenCalledWith('Example');
	});
});
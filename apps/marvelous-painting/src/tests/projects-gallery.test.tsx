import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { config, createPageComponentMocks } from './page-mocks';
import ProjectsPage from '@/app/(pages)/projects/page';
import GalleryPage from '@/app/(pages)/gallery/page';
import sampleProjects from '@/app/(pages)/projects/projects.json';
import sampleImages from '@/app/(pages)/gallery/gallery.json';
import contentfulItems from '../../../../packages/pixelated-components/src/test/data/mock-contentful-items.json';
import imageAssets from '../../../../packages/pixelated-components/src/test/data/mock-contentful-image-assets.json';

const mocks = vi.hoisted(() => ({
	config: vi.fn(),
	entries: vi.fn(),
	images: vi.fn(),
	flickr: vi.fn(),
	projects: vi.fn(),
	tiles: vi.fn(),
	microInteractions: vi.fn(),
}));

vi.mock('@pixelated-tech/components', async () => ({
	...(await vi.importActual('@pixelated-tech/components')),
	...createPageComponentMocks(),
	usePixelatedConfig: mocks.config,
	getContentfulEntriesByType: mocks.entries,
	getContentfulImagesFromEntries: mocks.images,
	FlickrWrapper: mocks.flickr,
	ProjectsClient: mocks.projects,
	Tiles: mocks.tiles,
	MicroInteractions: mocks.microInteractions,
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getFullPixelatedConfig: mocks.config,
}));

function integratedConfig() {
	const value = structuredClone(config);
	value.siteInfo.name = 'Example Company';
	value.integrations.contentful.space_id = 'example-space';
	value.integrations.contentful.delivery_access_token = 'test-token';
	value.integrations.contentful.projectsContentType = 'project';
	value.integrations.flickr.urlProps.api_key = 'test-key';
	value.integrations.flickr.urlProps.user_id = 'example-user';
	value.integrations.flickr.urlProps.photoset_id = 'example-album';
	return value;
}

function projectEntry(title: string) {
	return {
		...contentfulItems[0],
		sys: { ...contentfulItems[0].sys, contentType: { sys: { id: 'project' } } },
		fields: { ...contentfulItems[0].fields, title, description: `About ${title}` },
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue(integratedConfig());
	mocks.entries.mockResolvedValue({ items: [], includes: { Asset: imageAssets.items } });
	mocks.images.mockResolvedValue([{ image: imageAssets.items[0].fields.file.url, imageAlt: 'Project image' }]);
	mocks.flickr.mockResolvedValue([]);
	mocks.projects.mockImplementation(createPageComponentMocks().ProjectsClient);
	mocks.tiles.mockImplementation(createPageComponentMocks().Tiles);
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('Contentful Projects offering', () => {
	it('fetches grouped projects, resolves assets, and preserves the GEA title ordering', async () => {
		mocks.entries.mockResolvedValue({
			items: ['Apple', '10 Oak', '2 Pine', 'Zebra'].map(projectEntry),
			includes: { Asset: imageAssets.items },
		});

		render(await ProjectsPage());

		expect(screen.getByText('Example Company Projects')).not.toBeNull();
		expect(screen.queryByRole('status')).toBeNull();
		const contentful = integratedConfig().integrations.contentful;
		expect(mocks.entries).toHaveBeenCalledWith({
			apiProps: {
				base_url: contentful.base_url,
				space_id: contentful.space_id,
				environment: contentful.environment,
				delivery_access_token: contentful.delivery_access_token,
			},
			contentType: 'project',
		});
		expect(mocks.images).toHaveBeenCalledWith({ images: [], assets: imageAssets.items });
		expect(mocks.projects.mock.calls[0][0]).toMatchObject({
			modalOnClick: true,
			showOverlay: true,
			projects: ['10 Oak', '2 Pine', 'Zebra', 'Apple'].map((title) => ({
				title,
				description: `About ${title}`,
				tileCards: [{
					index: ['Apple', '10 Oak', '2 Pine', 'Zebra'].indexOf(title), cardIndex: 0, cardLength: 1,
					image: imageAssets.items[0].fields.file.url, imageAlt: 'Project image',
				}],
			})),
		});
	});

	it.each(['missing configuration', 'empty content', 'fetch error', 'invalid response', 'invalid fields'])('uses labeled sample projects for %s', async (scenario) => {
		if (scenario === 'missing configuration') mocks.config.mockReturnValue(null);
		if (scenario === 'fetch error') mocks.entries.mockRejectedValue(new Error('Contentful unavailable'));
		if (scenario === 'invalid response') mocks.entries.mockResolvedValue(null);
		if (scenario === 'invalid fields') mocks.entries.mockResolvedValue({ items: [{ ...projectEntry('Example'), fields: {} }] });

		render(await ProjectsPage());

		expect(screen.getByRole('status').textContent).toContain('Sample projects');
		expect(mocks.projects.mock.calls[0][0].projects).toEqual(sampleProjects);
		expect(vi.mocked(console.warn).mock.calls.length + vi.mocked(console.error).mock.calls.length).toBeGreaterThan(0);
		if (scenario === 'missing configuration') expect(mocks.entries).not.toHaveBeenCalled();
	});

	it('does not mix unrelated content types into projects', async () => {
		mocks.entries.mockResolvedValue({ items: [{ ...projectEntry('Other'), sys: { contentType: { sys: { id: 'other' } } } }] });
		render(await ProjectsPage());
		expect(mocks.projects.mock.calls[0][0].projects).toEqual(sampleProjects);
		expect(mocks.images).not.toHaveBeenCalled();
	});

	it('falls back if resolving project images fails', async () => {
		mocks.entries.mockResolvedValue({ items: [projectEntry('Example')] });
		mocks.images.mockRejectedValue(new Error('Invalid asset'));
		render(await ProjectsPage());
		expect(mocks.projects.mock.calls[0][0].projects).toEqual(sampleProjects);
		expect(console.error).toHaveBeenCalled();
	});

	it('uses sample projects when none of the entries has usable images', async () => {
		mocks.entries.mockResolvedValue({ items: [projectEntry('Example')] });
		mocks.images.mockResolvedValue([]);
		render(await ProjectsPage());
		expect(mocks.projects.mock.calls[0][0].projects).toEqual(sampleProjects);
		expect(screen.getByRole('status').textContent).toContain('Sample projects');
		expect(console.warn).toHaveBeenCalled();
	});
});

describe('Flickr Gallery offering', () => {
	it('shows loading until the album resolves, then renders a flat image grid', async () => {
		let resolveAlbum!: (cards: typeof sampleImages) => void;
		mocks.flickr.mockReturnValue(new Promise<typeof sampleImages>((resolve) => { resolveAlbum = resolve; }));
		render(<GalleryPage />);
		expect(screen.getByText('Example Company Gallery')).not.toBeNull();
		expect(screen.getByTestId('loading')).not.toBeNull();
		expect(mocks.tiles).not.toHaveBeenCalled();

		const liveImages = sampleImages.map((image) => ({ ...image, imageAlt: 'Live Flickr image' }));
		await act(async () => { resolveAlbum(liveImages); });

		const flickr = integratedConfig().integrations.flickr.urlProps;
		expect(mocks.flickr).toHaveBeenCalledWith(expect.objectContaining({
			api_key: flickr.api_key, user_id: flickr.user_id, photoset_id: flickr.photoset_id,
			method: 'flickr.photosets.getPhotos', photoSize: 'Large', tags: '',
		}));
		expect(mocks.tiles.mock.calls[0][0]).toMatchObject({
			cards: liveImages, rowCount: 3,
		});
		expect(mocks.tiles.mock.calls[0][0]).not.toHaveProperty('modalOnClick');
		expect(mocks.tiles.mock.calls[0][0]).not.toHaveProperty('showOverlay');
		expect(screen.queryByRole('status')).toBeNull();
		expect(screen.queryByTestId('loading')).toBeNull();
		expect(mocks.microInteractions).toHaveBeenCalled();
	});

	it.each(['missing configuration', 'empty content', 'fetch error', 'undefined response'])('uses labeled sample images for %s', async (scenario) => {
		if (scenario === 'missing configuration') mocks.config.mockReturnValue(null);
		if (scenario === 'fetch error') mocks.flickr.mockRejectedValue(new Error('Flickr unavailable'));
		if (scenario === 'undefined response') mocks.flickr.mockResolvedValue(undefined);
		render(<GalleryPage />);

		await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Sample images'));
		expect(mocks.tiles.mock.calls[0][0].cards).toEqual(sampleImages);
		expect(vi.mocked(console.warn).mock.calls.length + vi.mocked(console.error).mock.calls.length).toBeGreaterThan(0);
		if (scenario === 'missing configuration') expect(mocks.flickr).not.toHaveBeenCalled();
	});

	it('loads when configuration becomes available without changing hook order', async () => {
		mocks.config.mockReturnValue(null);
		const page = render(<GalleryPage />);
		await waitFor(() => expect(screen.getByRole('status')).not.toBeNull());
		mocks.config.mockReturnValue(integratedConfig());
		mocks.flickr.mockResolvedValue(sampleImages);
		page.rerender(<GalleryPage />);
		await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
		expect(mocks.flickr).toHaveBeenCalledTimes(1);
	});

	it('ignores a stale album response after the configured album changes', async () => {
		let resolveOldAlbum!: (cards: typeof sampleImages) => void;
		mocks.flickr.mockReturnValueOnce(new Promise<typeof sampleImages>((resolve) => { resolveOldAlbum = resolve; }));
		const page = render(<GalleryPage />);
		const nextConfig = integratedConfig();
		nextConfig.integrations.flickr.urlProps.photoset_id = 'new-album';
		mocks.config.mockReturnValue(nextConfig);
		const newImages = sampleImages.map((image) => ({ ...image, imageAlt: 'New album' }));
		mocks.flickr.mockResolvedValue(newImages);
		page.rerender(<GalleryPage />);
		await waitFor(() => expect(mocks.tiles).toHaveBeenCalled());
		await act(async () => { resolveOldAlbum(sampleImages); });
		expect(mocks.tiles.mock.lastCall?.[0].cards).toEqual(newImages);
	});
});

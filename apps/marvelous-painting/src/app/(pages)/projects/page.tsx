import React from 'react';
import { getContentfulEntriesByType, getContentfulImagesFromEntries, ProjectsClient, PageTitleHeader } from '@pixelated-tech/components';
import type { ProjectTilesType } from '@pixelated-tech/components';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';
import sampleProjects from './projects.json';

export default async function ProjectsPage() {
	const config = getFullPixelatedConfig();
	const siteName = config?.siteInfo?.name || 'Marvelous Painting';
	const contentful = config?.integrations?.contentful;
	let projects: ProjectTilesType[] = sampleProjects;
	let usingSampleContent = true;

	if (!contentful?.base_url || !contentful.space_id || !contentful.environment || !contentful.delivery_access_token || !contentful.projectsContentType) {
		console.warn('[Projects] Contentful configuration is incomplete. Showing sample projects.');
	} else {
		try {
			const entries = await getContentfulEntriesByType({
				apiProps: {
					base_url: contentful.base_url,
					space_id: contentful.space_id,
					environment: contentful.environment,
					delivery_access_token: contentful.delivery_access_token,
				},
				contentType: contentful.projectsContentType,
			});
			if (!Array.isArray(entries?.items)) throw new Error('Invalid Contentful entries response.');
			const fetchedProjects: ProjectTilesType[] = [];
			let nextImageIndex = 0;
			for (const entry of entries.items) {
				if (entry.sys?.contentType?.sys?.id !== contentful.projectsContentType) continue;
				if (typeof entry.fields?.title !== 'string' || typeof entry.fields?.description !== 'string') {
					throw new Error('Project entries must include text title and description fields.');
				}
				const images = await getContentfulImagesFromEntries({
					images: entry.fields.images ?? [],
					assets: entries.includes?.Asset ?? [],
				});
				if (images.length === 0) {
					console.warn('[Projects] A Contentful project has no resolved images. Skipping this project.');
					continue;
				}
				fetchedProjects.push({
					title: entry.fields.title,
					description: entry.fields.description,
					tileCards: images.map((image, index) => ({
						index: nextImageIndex++,
						cardIndex: index,
						cardLength: images.length,
						image: image.image,
						imageAlt: image.imageAlt ?? entry.fields.title,
					})),
				});
			}
			if (fetchedProjects.length > 0) {
				fetchedProjects.sort((a, b) => {
					const aIsNum = /^\d/.test(a.title);
					const bIsNum = /^\d/.test(b.title);
					if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;
					return aIsNum ? parseFloat(b.title) - parseFloat(a.title) : b.title.localeCompare(a.title);
				});
				projects = fetchedProjects;
				usingSampleContent = false;
			} else {
				console.warn('[Projects] Contentful returned no projects. Showing sample projects.');
			}
		} catch (error) {
			console.error('[Projects] Unable to load Contentful projects. Showing sample projects.', error);
		}
	}

	return (
		<>
			<PageTitleHeader title={`${siteName} Projects`} />
			{usingSampleContent && <p role="status">Sample projects are shown because live content is unavailable.</p>}
			<ProjectsClient projects={projects} modalOnClick={true} showOverlay={true} />
		</>
	);
}

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import config from '@/app/config/pixelated.config.json';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	ProjectsClient: ({ projects }: any) => <div data-testid="mock-projectsclient">{projects.length}</div>,
	getContentfulEntriesByType: vi.fn(async () => ({
		items: [
			{
				sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
				fields: {
					title: 'Project One',
					description: 'A beautiful epoxy project',
					images: [],
				},
			},
		],
		includes: { Asset: [] },
	})),
	getContentfulImagesFromEntries: vi.fn(async () => []),
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getFullPixelatedConfig: () => config,
}));

import * as pixelatedComponents from '@pixelated-tech/components';
const mockGetContentfulEntriesByType = pixelatedComponents.getContentfulEntriesByType as ReturnType<typeof vi.fn>;
const mockGetContentfulImagesFromEntries = pixelatedComponents.getContentfulImagesFromEntries as ReturnType<typeof vi.fn>;

import ProjectsPage from '@/app/(pages)/projects/page';

describe('JZ Home Improvement projects page', () => {
	it('renders projects through the ProjectsClient component', async () => {
		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient')).toBeTruthy();
		expect(mockGetContentfulEntriesByType).toHaveBeenCalled();
	});

	it('renders project cards with images and numeric sorting', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: '2 Project',
						description: 'Second project',
						images: [{ sys: { id: 'img-1' } }],
					},
				},
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: 'Project One',
						description: 'First project',
						images: [],
					},
				},
			],
			includes: { Asset: [{ sys: { id: 'img-1' } }] },
		});
		mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: '/images/project.jpg', imageAlt: 'Project image' }]);

		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient').textContent).toBe('2');
		expect(mockGetContentfulImagesFromEntries).toHaveBeenCalled();
	});

	it('skips non-matching content types and sorts numeric titles correctly', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: '3 Project',
						description: 'Third project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: '10 Project',
						description: 'Tenth project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: 'wrong-type' } } },
					fields: {
						title: 'Ignored Project',
						description: 'Should be ignored',
						images: [],
					},
				},
			],
			includes: { Asset: [] },
		});
		mockGetContentfulImagesFromEntries.mockResolvedValue([]);

		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient').textContent).toBe('2');
	});

	it('sorts alphabetic titles in descending order', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: 'Apple Project',
						description: 'Apple project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
					fields: {
						title: 'Banana Project',
						description: 'Banana project',
						images: [],
					},
				},
			],
			includes: { Asset: [] },
		});
		mockGetContentfulImagesFromEntries.mockResolvedValue([]);

		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient').textContent).toBe('2');
	});
});

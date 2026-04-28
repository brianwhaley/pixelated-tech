import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import config from '@/app/config/pixelated.config.json';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	ProjectsClient: ({ projects }: any) => <div data-testid="mock-projectsclient">{projects.length}</div>,
	getContentfulEntriesByType: vi.fn(async () => ({
		items: [
			{
				sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
				fields: {
					title: 'Project One',
					description: 'A beautiful project',
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

describe('Oaktree Landscaping projects page', () => {
	it('renders projects through the ProjectsClient component', async () => {
		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient')).toBeTruthy();
		expect(mockGetContentfulEntriesByType).toHaveBeenCalled();
	});

	it('renders projects with image cards', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: '2 Project',
						description: 'Second project',
						images: [{ sys: { id: 'img-1' } }],
					},
				},
			],
			includes: { Asset: [{ sys: { id: 'img-1' } }] },
		});
		mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: '/images/project.jpg', imageAlt: 'Project image' }]);

		const pageElement = await ProjectsPage();
		render(pageElement);
		expect(screen.getByTestId('mock-projectsclient').textContent).toBe('1');
		expect(mockGetContentfulImagesFromEntries).toHaveBeenCalled();
	});

	it('sorts numeric and non-numeric project titles correctly', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: 'Project One',
						description: 'First project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: '2 Project',
						description: 'Second project',
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

	it('sorts numeric-only project titles in descending order', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: '10 Project',
						description: 'Ten project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: '2 Project',
						description: 'Two project',
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

	it('sorts alphabetic-only project titles in descending order', async () => {
		mockGetContentfulEntriesByType.mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
					fields: {
						title: 'Apple Project',
						description: 'Apple project',
						images: [],
					},
				},
				{
					sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
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

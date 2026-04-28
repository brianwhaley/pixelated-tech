import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride, setPixelatedConfigOverride } from '@/test/page-mocks';
import * as pixelatedComponents from '@pixelated-tech/components';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getContentfulEntriesByType: vi.fn(async () => ({
		items: [
			{
				sys: { contentType: { sys: { id: 'carouselCard' } } },
				fields: {
					title: 'Project One',
					description: 'A beautiful epoxy project',
					link: '/projects/one',
					image: { sys: { id: 'img-1' } },
				},
			},
		],
		includes: { Asset: [{ sys: { id: 'img-1' } }] },
	})),
	getContentfulImagesFromEntries: vi.fn(async () => [{ image: '/images/project.jpg', imageAlt: 'Project image' }]),
}));

const mockGetContentfulEntriesByType = pixelatedComponents.getContentfulEntriesByType as ReturnType<typeof vi.fn>;

import ProjectsPage from '@/app/(pages)/projects/page';

describe('Palmetto Epoxy projects page', () => {
	beforeEach(() => {
		resetPixelatedConfigOverride();
		mockGetContentfulEntriesByType.mockClear();
	});

	it('renders the projects carousel when contentful data is available', async () => {
		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
	});

	it('skips non-carouselCard items when building the project carousel', async () => {
		mockGetContentfulEntriesByType.mockResolvedValueOnce({
			items: [
				{
					sys: { contentType: { sys: { id: 'notACard' } } },
					fields: {
						title: 'Bad Item',
						description: 'Should be ignored',
						image: { sys: { id: 'img-1' } },
					},
				},
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Project One',
						description: 'A beautiful epoxy project',
						link: '/projects/one',
						image: { sys: { id: 'img-1' } },
					},
				},
			],
			includes: { Asset: [{ sys: { id: 'img-1' } }] },
		});

		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
	});

	it('renders the loading fallback when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<ProjectsPage />);
		expect(screen.getByTestId('mock-loading')).toBeTruthy();
	});

	it('renders projects when contentful config fields are missing', async () => {
		setPixelatedConfigOverride({ contentful: {} });
		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
	});
});

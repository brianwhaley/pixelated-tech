import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('next/navigation', () => ({
	useParams: () => ({ project: 'Test Project' }),
}));

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getContentfulEntriesByType: vi.fn(async () => ({
		items: [
			{
				sys: { contentType: { sys: { id: 'carouselCard' } } },
				fields: {
					title: 'Test Project',
					description: 'Test description',
					keywords: ['epoxy'],
					carouselImages: [{ sys: { id: 'img-1' } }],
				},
			},
		],
		includes: { Asset: [{ sys: { id: 'img-1' }, fields: { image: '/images/project.jpg', imageAlt: 'Project image' } }] },
	})),
	getContentfulEntryByField: vi.fn(async () => ({
		fields: {
			title: 'Test Project',
			description: 'Test description',
			carouselImages: [{ sys: { id: 'img-1' } }],
		},
	})),
	getContentfulImagesFromEntries: vi.fn(async () => [{ image: '/images/project.jpg', imageAlt: 'Project image' }]),
}));

import ProjectPage from '@/app/(pages)/projects/[project]/page';

describe('Palmetto Epoxy project detail page', () => {
	beforeEach(() => {
		resetPixelatedConfigOverride();
	});

	it('renders the loading fallback when config is unavailable', async () => {
		setPixelatedConfigOverride(null);
		await act(async () => {
			render(<ProjectPage />);
		});
		expect(screen.getByTestId('mock-loading')).toBeTruthy();
	});

	it('renders the project detail route with carousel data when config is available', async () => {
		await act(async () => {
			render(<ProjectPage />);
		});
		await screen.findByTestId('mock-carousel');
	});

	it('renders the project detail route when contentful config fields are missing', async () => {
		setPixelatedConfigOverride({ contentful: {} });
		await act(async () => {
			render(<ProjectPage />);
		});
		await screen.findByTestId('mock-carousel');
	});
});

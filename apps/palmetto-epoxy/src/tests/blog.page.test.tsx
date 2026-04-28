import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import * as pixelatedComponents from '@pixelated-tech/components';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getCachedWordPressItems: vi.fn(async () => [{
		title: 'Sample Blog Post',
		content: 'Sample content',
	}]),
}));

const mockGetCachedWordPressItems = pixelatedComponents.getCachedWordPressItems as ReturnType<typeof vi.fn>;

import BlogPage from '@/app/(pages)/blog/page';

describe('Palmetto Epoxy blog page', () => {
	it('renders the Palmetto Epoxy blog posts list', async () => {
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders the blog page gracefully when no WordPress posts exist', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(null);
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders the blog page gracefully when WordPress posts are undefined', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(undefined);
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});
});

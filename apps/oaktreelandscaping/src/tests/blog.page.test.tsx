import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import { getCachedWordPressItems } from '@pixelated-tech/components';
import BlogPage from '@/app/(pages)/blog/page';

vi.mock('@pixelated-tech/components', () => {
	const mocks = createPageComponentMocks({
		getCachedWordPressItems: vi.fn(async () => [{
			title: 'Sample Blog Post',
			content: 'Sample content',
		}]),
	});
	return mocks;
});

const mockGetCachedWordPressItems = getCachedWordPressItems as unknown as ReturnType<typeof vi.fn>;

describe('Oaktree Landscaping blog page', () => {
	it('renders the Oaktree Landscaping blog title and blog post list', async () => {
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders without errors when no WordPress posts are returned', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(null);
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});
});

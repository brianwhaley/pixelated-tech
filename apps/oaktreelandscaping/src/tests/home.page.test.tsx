import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import { getCachedWordPressItems } from '@pixelated-tech/components';
import HomePage from '@/app/(pages)/(home)/page';

vi.mock('@pixelated-tech/components', () => {
	const mocks = createPageComponentMocks({
		getCachedWordPressItems: vi.fn(async () => [{
			title: 'Latest Blog Post',
			content: 'Featured post content',
		}]),
	});
	return mocks;
});

const mockGetCachedWordPressItems = getCachedWordPressItems as unknown as ReturnType<typeof vi.fn>;

describe('Oaktree Landscaping home page', () => {
	it('renders the home page with a welcome callout', async () => {
		render(<HomePage />);
		const callouts = await screen.findAllByTestId('mock-callout');
		expect(callouts.some((element) => element.textContent?.includes('Welcome to Oaktree Landscaping'))).toBe(true);
	});

	it('handles missing blog posts gracefully', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(null);
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});
});

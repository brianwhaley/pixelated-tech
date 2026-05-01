import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogPage from '@/app/(pages)/blog/page';

describe('Blog page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the blog list when wordpress posts are available', async () => {
		mockState.wordpressPosts = [{ id: 1, title: 'Post One' }];
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).not.toBeNull());
		expect(screen.getByTestId('mock-blogpostlist').textContent).toContain('site:thethreemusesofbluffton.wordpress.com count:1');
	});

	it('renders the blog list when wordpress posts are unavailable', async () => {
		mockState.wordpressPosts = null as any;
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).not.toBeNull());
		expect(screen.getByTestId('mock-blogpostlist').textContent).toContain('site:thethreemusesofbluffton.wordpress.com count:0');
	});
});

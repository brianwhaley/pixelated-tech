import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Blog from '@/app/(pages)/blog/page';

describe('Blog page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the blog page with posts and schema', async () => {
		mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
		render(<Blog />);
		await waitFor(() => expect(screen.getByTestId('blog-post-list')).toBeInTheDocument());
		expect(screen.getByTestId('schema-blog-posting')).toBeInTheDocument();
		expect(screen.getByTestId('blog-post-list')).toHaveTextContent('site:blog.oaktree-landscaping.com count:1');
	});

	it('renders the blog page with no posts fallback', async () => {
		mockState.wordpressPosts = [];
		render(<Blog />);
		await waitFor(() => expect(screen.getByTestId('blog-post-list')).toBeInTheDocument());
		expect(screen.getByTestId('blog-post-list')).toHaveTextContent('site:blog.oaktree-landscaping.com count:0');
	});
});

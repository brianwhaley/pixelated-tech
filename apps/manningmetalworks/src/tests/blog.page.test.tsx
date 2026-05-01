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

	it('renders the blog page with posts and schema', async () => {
		mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeInTheDocument());
		expect(screen.getByTestId('mock-blogpostlist')).toHaveTextContent('site:manningmetalworks.wpcomstaging.com count:1');
	});

	it('renders the blog page when wordpress posts are unavailable', async () => {
		mockState.wordpressPosts = null as any;
		render(<BlogPage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeInTheDocument());
		expect(screen.getByTestId('mock-blogpostlist')).toHaveTextContent('site:manningmetalworks.wpcomstaging.com count:0');
	});
});

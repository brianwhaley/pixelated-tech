import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Home from '@/app/(pages)/(home)/page';

describe('Home page', () => {
	beforeEach(() => {
		resetMockState();
	});

	it('renders the page title', async () => {
		let element = null;
		await act(async () => {
			element = await Home();
		});
		render(element as any);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Welcome to The Three Muses of Bluffton'));
	});

	it('handles no WordPress posts returned by the API', async () => {
		mockState.wordpressPosts = false as any;
		let element = null;
		await act(async () => {
			element = await Home();
		});
		render(element as any);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Welcome to The Three Muses of Bluffton'));
	});
});

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import SubmitReviewPage from '@/app/(pages)/submitreview/page';

describe('Palmetto Epoxy submit review page', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<form id="submitReviewForm">
				<input id="installdate" type="date" />
				<button type="submit"></button>
			</form>
		`;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders the submit review page and form engine', async () => {
		render(<SubmitReviewPage />);
		await waitFor(() => expect(screen.getByTestId('mock-formengine')).toBeTruthy());
		expect((document.getElementById('installdate') as HTMLInputElement).value).not.toBe('');
	});

	it('renders when the review form does not exist', async () => {
		document.body.innerHTML = '';
		render(<SubmitReviewPage />);
		await waitFor(() => expect(screen.getByTestId('mock-formengine')).toBeTruthy());
	});

	it('renders when the submit button exists but date input is absent', async () => {
		const originalGetElementById = document.getElementById;
		const fakeForm = {
			querySelector: (selector: string) => {
				if (selector === 'input#installdate[type="date"]') return null;
				return { parentElement: null };
			},
		};
		document.getElementById = vi.fn(() => fakeForm as any);
		render(<SubmitReviewPage />);
		await waitFor(() => expect(screen.getByTestId('mock-formengine')).toBeTruthy());
		document.getElementById = originalGetElementById;
	});
});

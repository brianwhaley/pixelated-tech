import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	Table: ({ data }: any) => <div data-testid="mock-table">{Array.isArray(data) ? data.length : 0}</div>,
}));

import Requests from '@/app/(pages)/prospects/page';

describe('Oaktree Landscaping prospects page', () => {
	beforeEach(() => {
		resetFileDataState();
	});

	it('renders no custom requests when no data is available', async () => {
		setFileDataState({ data: null, loading: false, error: null });
		render(<Requests />);
		await waitFor(() => expect(screen.getByText('No custom requests found.')).toBeTruthy());
	});

	it('renders a table when prospects data is present', async () => {
		setFileDataState({
			data: [
				{
					company: 'Acme',
					'first name': 'Jane',
					'last name': 'Doe',
					'street address': '123 Elm St',
					city: 'Orlando',
					state: 'FL',
					zip: '32801',
					emails: ['jane@example.com'],
				},
			],
			loading: false,
			error: null,
		});

		render(<Requests />);
		await waitFor(() => expect(screen.getByTestId('mock-table')).toBeTruthy());
	});
});

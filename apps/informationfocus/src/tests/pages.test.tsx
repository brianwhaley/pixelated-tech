import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

import Home from '@/app/(pages)/(home)/page';
import Resume from '@/app/(pages)/resume/page';
import StyleGuide from '@/app/(pages)/styleguide/page';

describe('Information Focus pages', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the home page with section headers and images', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getByTestId('mock-pagesectionheader')).not.toBeNull());
		expect(screen.getAllByTestId('smart-image').length).toBeGreaterThan(0);
	});

	it('renders every static page without throwing', async () => {
		const pages = [
			{ name: 'Home', Component: Home },
			{ name: 'Resume', Component: Resume },
			{ name: 'StyleGuide', Component: StyleGuide },
		];

		for (const page of pages) {
			render(React.createElement(page.Component));
			if (page.name === 'StyleGuide') {
				await waitFor(() => expect(screen.getByTestId('styleguide-ui')).not.toBeNull());
			} else {
				await waitFor(() => expect(screen.queryAllByTestId(/mock-/).length).toBeGreaterThan(0));
			}
			cleanup();
		}
	});
});

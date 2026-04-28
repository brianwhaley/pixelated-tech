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
import BuzzwordBingo from '@/app/(pages)/buzzwordbingo/page';
import Readme from '@/app/(pages)/readme/page';
import Recipes from '@/app/(pages)/recipes/page';
import Resume from '@/app/(pages)/resume/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import WorkPortfolio from '@/app/(pages)/workportfolio/page';

describe('Brian Whaley pages', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the home page hero and callouts', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0);
	});

	it('renders every static page without throwing', async () => {
		const pages = [
			{ name: 'Home', Component: Home },
			{ name: 'BuzzwordBingo', Component: BuzzwordBingo },
			{ name: 'Readme', Component: Readme },
			{ name: 'Recipes', Component: Recipes },
			{ name: 'Resume', Component: Resume },
			{ name: 'StyleGuide', Component: StyleGuide },
			{ name: 'WorkPortfolio', Component: WorkPortfolio },
		];

		for (const page of pages) {
			const { container } = render(React.createElement(page.Component));
			await waitFor(() => expect(container.firstChild).not.toBeNull());
			cleanup();
		}
	});
});

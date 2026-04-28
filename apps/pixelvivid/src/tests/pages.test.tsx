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
import About from '@/app/(pages)/about/page';
import Cart from '@/app/(pages)/cart/page';
import Contact from '@/app/(pages)/contact/page';
import Customsgallery from '@/app/(pages)/customsgallery/page';
import Customsunglasses from '@/app/(pages)/customsunglasses/page';
import Faqs from '@/app/(pages)/faqs/page';
import Photography from '@/app/(pages)/photography/page';
import Preorder2026 from '@/app/(pages)/preorder-2026/page';
import Requests from '@/app/(pages)/requests/page';
import Returns from '@/app/(pages)/returns/page';
import Store from '@/app/(pages)/store/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import Subscribe from '@/app/(pages)/subscribe/page';

describe('PixelVivid page coverage', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the home page when config is available', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getByTestId('contentful-reviews-carousel')).not.toBeNull();
	});

	it('renders all static pages without error', async () => {
		const pages = [
			{ name: 'Home', Component: Home },
			{ name: 'About', Component: About },
			{ name: 'Cart', Component: Cart },
			{ name: 'Contact', Component: Contact },
			{ name: 'Customsgallery', Component: Customsgallery },
			{ name: 'Customsunglasses', Component: Customsunglasses },
			{ name: 'Faqs', Component: Faqs },
			{ name: 'Photography', Component: Photography },
			{ name: 'Preorder2026', Component: Preorder2026 },
			{ name: 'Requests', Component: Requests },
			{ name: 'Returns', Component: Returns },
			{ name: 'Store', Component: Store },
			{ name: 'StyleGuide', Component: StyleGuide },
			{ name: 'Subscribe', Component: Subscribe },
		];

		for (const page of pages) {
			render(React.createElement(page.Component));
			await waitFor(() => expect(
				screen.queryAllByTestId(/mock-/).length +
				screen.queryAllByTestId('page-title-header').length +
				screen.queryAllByTestId('shopping-cart').length +
				screen.queryAllByTestId('styleguide-ui').length
			).toBeGreaterThan(0));
			cleanup();
		}
	});
});

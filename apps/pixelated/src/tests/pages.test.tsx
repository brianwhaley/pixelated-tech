import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';
import { PixelatedClientConfigProvider } from '@pixelated-tech/components';

const renderWithConfig = (ui: React.ReactElement) =>
	render(
		<PixelatedClientConfigProvider config={{ global: {} } as any}>
			{ui}
		</PixelatedClientConfigProvider>,
	);

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('?installed=true'),
	usePathname: () => '/',
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

import Home from '@/app/(pages)/(home)/page';
import Blog from '@/app/(pages)/blog/page';
import BlogCalendar from '@/app/(pages)/blogcalendar/page';
import ByTheWay from '@/app/(pages)/bytheway/page';
import Cost from '@/app/(pages)/cost/page';
import Faqs from '@/app/(pages)/faqs/page';
import Instagram from '@/app/(pages)/instagram/page';
import Legal from '@/app/(pages)/legal/page';
import NerdJokes from '@/app/(pages)/nerdjokes/page';
import Partners from '@/app/(pages)/partners/page';
import Podcast from '@/app/(pages)/podcast/page';
import Portfolio from '@/app/(pages)/portfolio/page';
import Privacy from '@/app/(pages)/privacy/page';
import Process from '@/app/(pages)/process/page';
import Samples from '@/app/(pages)/samples/page';
import Schedule from '@/app/(pages)/schedule/page';
import Stkr from '@/app/(pages)/stkr/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import Terms from '@/app/(pages)/terms/page';
import SamplePage1 from '@/app/(pages)/samples/page1/page';
import SamplePage2 from '@/app/(pages)/samples/page2/page';
import SamplePage3 from '@/app/(pages)/samples/page3/page';
import SamplePage4 from '@/app/(pages)/samples/page4/page';
import SamplePage5 from '@/app/(pages)/samples/page5/page';
import SamplePage6 from '@/app/(pages)/samples/page6/page';

describe('Pixelated page coverage', () => {
	beforeEach(() => {
		resetMockState();
		mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
		vi.clearAllMocks();
	});

	it('renders the home page with page hero and blog list', async () => {
		renderWithConfig(<Home />);
		await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
		expect(screen.getByTestId('hero')).not.toBeNull();
		expect(screen.getByTestId('blog-post-list')).not.toBeNull();
	});

	it('renders all available static pages without error', async () => {
		const pages = [
			{ name: 'Home', Component: Home },
			{ name: 'Blog', Component: Blog },
			{ name: 'BlogCalendar', Component: BlogCalendar },
			{ name: 'ByTheWay', Component: ByTheWay },
			{ name: 'Cost', Component: Cost },
			{ name: 'Faqs', Component: Faqs },
			{ name: 'Instagram', Component: Instagram },
			{ name: 'Legal', Component: Legal },
			{ name: 'NerdJokes', Component: NerdJokes },
			{ name: 'Partners', Component: Partners },
			{ name: 'Podcast', Component: Podcast },
			{ name: 'Portfolio', Component: Portfolio },
			{ name: 'Privacy', Component: Privacy },
			{ name: 'Process', Component: Process },
			{ name: 'Samples', Component: Samples },
			{ name: 'Schedule', Component: Schedule },
			{ name: 'Stkr', Component: Stkr },
			{ name: 'StyleGuide', Component: StyleGuide },
			{ name: 'Terms', Component: Terms },
			{ name: 'SamplePage1', Component: SamplePage1 },
			{ name: 'SamplePage2', Component: SamplePage2 },
			{ name: 'SamplePage3', Component: SamplePage3 },
			{ name: 'SamplePage4', Component: SamplePage4 },
			{ name: 'SamplePage5', Component: SamplePage5 },
			{ name: 'SamplePage6', Component: SamplePage6 },
		];

		for (const page of pages) {
			renderWithConfig(React.createElement(page.Component));
			if (page.name === 'StyleGuide') {
				await waitFor(() => expect(screen.getByTestId('styleguide-ui')).not.toBeNull());
			} else {
				await waitFor(() => expect(screen.queryAllByTestId(/mock-/).length).toBeGreaterThan(0));
			}
			cleanup();
		}
	});
});

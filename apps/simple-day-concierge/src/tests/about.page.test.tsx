import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import About from '@/app/(pages)/about/page';

describe('About page', () => {
	it('renders the about page with header, team section, and historical overview', async () => {
		render(<About />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('About Simple Day Concierge');
		const sectionHeaders = screen.getAllByTestId('page-section-header');
		expect(sectionHeaders.map((node) => node.textContent)).toEqual([
			'Our Team',
			'Our History',
		]);
		expect(screen.getAllByTestId('callout')).toHaveLength(2);
	});
});

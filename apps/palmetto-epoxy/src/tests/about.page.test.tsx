import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import AboutPage from '@/app/(pages)/about/page';

describe('Palmetto Epoxy about page', () => {
	it('renders the About Palmetto Epoxy callout', () => {
		render(<AboutPage />);
		const callouts = screen.getAllByTestId('mock-callout');
		expect(callouts.some((element) => element.textContent?.includes('About Palmetto Epoxy'))).toBe(true);
	});
});

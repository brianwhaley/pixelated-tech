import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import HomePage from '@/app/(pages)/(home)/page';

describe('JZ Home Improvement home page', () => {
	it('renders the JZ Home Improvement title', () => {
		render(<HomePage />);
		const pageTitleHeaders = screen.getAllByTestId('mock-pagetitleheader');
		expect(pageTitleHeaders.some((element) => element.textContent?.includes('JZ Home Improvement'))).toBe(true);
	});
});

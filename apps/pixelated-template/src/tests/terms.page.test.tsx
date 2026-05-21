import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import TermsPage from '@/app/(pages)/terms/page';

describe('Terms page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the terms page with privacy and terms sections', () => {
		render(<TermsPage />);
		expect(screen.getByTestId('page-title-header')).toBeTruthy();
		expect(screen.getAllByTestId('mock-pagesectionheader').length).toBeGreaterThanOrEqual(2);
	});
});

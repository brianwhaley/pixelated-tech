import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import TermsPage from '@/app/(pages)/terms/page';

describe('Terms page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
		setPixelatedConfigOverride(undefined);
	});

	afterEach(() => {
		setPixelatedConfigOverride(undefined);
	});

	it('renders the terms page with privacy and terms sections', () => {
		render(<TermsPage />);
		expect(screen.getByTestId('page-title-header')).toBeTruthy();
		expect(screen.getAllByTestId('mock-pagesectionheader').length).toBeGreaterThanOrEqual(2);
	});

	it('renders the terms page fallback values when siteInfo is missing', () => {
		setPixelatedConfigOverride({});
		render(<TermsPage />);
		expect(screen.getByText((text) => text.includes('Address not available'))).toBeInTheDocument();
		expect(screen.getByText((text) => text.includes('State not available'))).toBeInTheDocument();
		expect(screen.getAllByText(/__SITE_NAME__/).length).toBeGreaterThan(0);
	});
});

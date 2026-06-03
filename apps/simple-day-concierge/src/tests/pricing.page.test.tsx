import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import PricingPage from '@/app/(pages)/pricing/page';

describe('Pricing page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the pricing page title', () => {
		render(<PricingPage />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('Simple Day Concierge Pricing');
	});
});

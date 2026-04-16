import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Contact from '@/app/(pages)/contact/page';

describe('Contact page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the contact page schedule and form sections', () => {
		render(<Contact />);
		expect(screen.getByTestId('calendly')).toBeInTheDocument();
		expect(screen.getByTestId('form-engine')).toBeInTheDocument();
		expect(screen.getByText('__EMAIL_ADDRESS__').closest('a')).toHaveAttribute('href', 'mailto:__EMAIL_ADDRESS__');
	});
});

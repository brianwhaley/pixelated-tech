import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Contact from '@/app/(pages)/contact/page';

describe('Contact page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
		setPixelatedConfigOverride(undefined);
	});

	afterEach(() => {
		setPixelatedConfigOverride(undefined);
	});

	it('renders the contact page schedule and form sections', () => {
		render(<Contact />);
		expect(screen.getByTestId('calendly')).toBeInTheDocument();
		expect(screen.getByTestId('form-engine')).toBeInTheDocument();
		expect(screen.getByText('__EMAIL_ADDRESS__').closest('a')).toHaveAttribute('href', 'mailto:__EMAIL_ADDRESS__');
	});

	it('renders the contact page without contact info when siteInfo is missing', () => {
		setPixelatedConfigOverride({});
		render(<Contact />);
		expect(screen.getByTestId('calendly')).toBeInTheDocument();
		expect(screen.getByTestId('form-engine')).toBeInTheDocument();
		expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
	});
});

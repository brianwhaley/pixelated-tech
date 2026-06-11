import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Services from '@/app/(pages)/services/page';

describe('Services page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
		setPixelatedConfigOverride(undefined);
	});

	afterEach(() => {
		setPixelatedConfigOverride(undefined);
	});

	it('renders the services page with callout cards', () => {
		render(<Services />);
		expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0);
	});

	it('renders the services page with fallback site name when siteInfo is missing', () => {
		setPixelatedConfigOverride({});
		render(<Services />);
		expect(screen.getAllByText(/__SITE_NAME__/).length).toBeGreaterThan(0);
	});
});

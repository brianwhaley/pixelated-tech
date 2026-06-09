import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import GlobalError from '@/app/global-error';

describe('Global error page', () => {
	beforeEach(() => {
		resetMockState();
		setPixelatedConfigOverride({});
	});

	it('renders GlobalErrorUI even when site config siteInfo is missing', () => {
		render(<GlobalError error={new Error('fail')} reset={() => undefined} />);
		expect(screen.getByTestId('global-error-ui').textContent).toContain('fail');
	});
});

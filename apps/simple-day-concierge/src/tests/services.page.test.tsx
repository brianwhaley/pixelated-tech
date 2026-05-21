import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Services from '@/app/(pages)/services/page';

describe('Services page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the services page with callout cards', () => {
		render(<Services />);
		expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0);
	});
});

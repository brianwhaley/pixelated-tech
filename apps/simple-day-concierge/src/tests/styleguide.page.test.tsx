import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import StyleGuide from '@/app/(pages)/styleguide/page';

describe('StyleGuide page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the style guide page using the style guide UI', () => {
		render(<StyleGuide />);
		expect(screen.getByTestId('styleguide-ui')).toBeInTheDocument();
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Projects from '@/app/(pages)/projects/page';

describe('Projects page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the projects page with tile groups', () => {
		render(<Projects />);
		expect(screen.getAllByTestId('tiles').length).toBe(3);
	});
});

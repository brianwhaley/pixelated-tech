import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ConsignPage from '@/app/(pages)/consign/page';

describe('Consign page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the consign page and callouts', () => {
		render(<ConsignPage />);
		expect(screen.getByTestId('mock-pagetitleheader')).not.toBeNull();
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});
});

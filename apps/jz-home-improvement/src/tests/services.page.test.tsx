import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServicesPage from '@/app/(pages)/services/page';

describe('JZ Home Improvement services page', () => {
	it('renders the JZ Home Improvement Services title and service callouts', () => {
		render(<ServicesPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('JZ Home Improvement Services');
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});
});

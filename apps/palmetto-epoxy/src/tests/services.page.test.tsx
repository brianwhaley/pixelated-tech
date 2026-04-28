import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServicesPage from '@/app/(pages)/services/page';

describe('Palmetto Epoxy services page', () => {
	it('renders the services page callouts', () => {
		render(<ServicesPage />);
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});
});

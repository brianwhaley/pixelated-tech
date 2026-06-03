import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Home from '@/app/(pages)/(home)/page';

describe('Home page', () => {
	it('renders the page title and welcome text', () => {
		render(<Home />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('Simple Day Concierge');
		expect(screen.getAllByText('Welcome to Simple Day Concierge Service')[0]).toBeInTheDocument();
	});
});

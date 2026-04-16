import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServicesPage from '@/app/(pages)/services/page';

describe('Services page', () => {
	it('renders the page title', () => {
		render(<ServicesPage />);
		expect(screen.getByTestId('mock-pagetitleheader')).toHaveTextContent('Manning Metalworks Services');
	});
});

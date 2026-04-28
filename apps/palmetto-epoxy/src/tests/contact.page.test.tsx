import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ContactPage from '@/app/(pages)/contact/page';

describe('Palmetto Epoxy contact page', () => {
	it('renders the Contact page with the form engine', () => {
		render(<ContactPage />);
		expect(screen.getByTestId('mock-formengine')).toBeTruthy();
	});
});

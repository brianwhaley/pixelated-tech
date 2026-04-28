import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ContactPage from '@/app/(pages)/contact/page';

describe('Oaktree Landscaping contact page', () => {
	it('renders the Contact Oaktree Landscaping title and form engine', () => {
		render(<ContactPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Contact Oaktree Landscaping');
		expect(screen.getByTestId('mock-formengine')).toBeTruthy();
	});
});

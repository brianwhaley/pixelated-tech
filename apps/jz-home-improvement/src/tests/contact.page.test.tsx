import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ContactPage from '@/app/(pages)/contact/page';

describe('JZ Home Improvement contact page', () => {
	it('renders the Contact JZ Home Improvement title and form component', () => {
		render(<ContactPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Contact JZ Home Improvement');
		expect(screen.getByTestId('mock-formengine')).toBeTruthy();
	});
});

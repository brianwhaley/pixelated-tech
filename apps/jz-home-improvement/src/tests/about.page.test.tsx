import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import AboutPage from '@/app/(pages)/about/page';

describe('JZ Home Improvement about page', () => {
	it('renders the About JZ Home Improvement title', () => {
		render(<AboutPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About JZ Home Improvement');
	});
});

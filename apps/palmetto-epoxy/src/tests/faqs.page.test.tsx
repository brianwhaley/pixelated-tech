import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import FaqsPage from '@/app/(pages)/faqs/page';

describe('Palmetto Epoxy FAQ page', () => {
	it('renders the FAQ page and accordion component', () => {
		render(<FaqsPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Frequently Asked Questions');
		expect(screen.getByTestId('mock-faqaccordion')).toBeTruthy();
	});
});

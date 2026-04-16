import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import FaqsPage from '@/app/(pages)/faqs/page';

describe('FAQs page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the FAQ accordion', () => {
		render(<FaqsPage />);
		expect(screen.getByTestId('mock-faqaccordion')).toBeInTheDocument();
	});
});

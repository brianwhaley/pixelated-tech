import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import FAQsPage from '@/app/(pages)/faqs/page';

describe('FAQs page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the FAQ page with content and schema', () => {
		render(<FAQsPage />);
		expect(screen.getByTestId('schema-faq')).toBeInTheDocument();
		expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
	});
});

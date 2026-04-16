import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogcalendarPage from '@/app/(pages)/blogcalendar/page';

describe('Blog Calendar page', () => {
	it('renders the markdown container', () => {
		render(<BlogcalendarPage />);
		expect(screen.getByTestId('mock-pagesection')).toBeInTheDocument();
		expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
	});
});

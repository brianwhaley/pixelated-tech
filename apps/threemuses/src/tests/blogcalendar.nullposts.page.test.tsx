import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';

describe('Blog calendar page', () => {
	it('renders the markdown section for the blog calendar', async () => {
		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).toBeTruthy());
		expect(screen.getByTestId('mock-pagesection')).toBeTruthy();
	});
});

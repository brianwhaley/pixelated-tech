import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getCachedWordPressItems: async () => null,
	ToggleLoading: () => null,
	MicroInteractions: () => null,
}));

import BlogCalendarPage from '@/app/(pages)/blog-calendar/page';

describe('Blog calendar page with null posts', () => {
	it('renders gracefully when getCachedWordPressItems returns null', async () => {
		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Oaktree Landscaping Blog Posts'));
		expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy();
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogCalendar from '@/app/(pages)/blogcalendar/page';

describe('Oaktree Landscaping blog calendar page', () => {
	beforeEach(() => {
		resetFileDataState();
	});

	it('renders the blog calendar markdown content', () => {
		setFileDataState({ data: '## Blog Calendar', loading: false, error: null });
		render(<BlogCalendar />);
		expect(screen.getByTestId('mock-markdown')).toBeTruthy();
	});

	it('renders the loading state while file data is loading', () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<BlogCalendar />);
		expect(screen.getByText('Loading...')).toBeTruthy();
	});

	it('renders an error state when file load fails', () => {
		setFileDataState({ data: null, loading: false, error: 'File missing' });
		render(<BlogCalendar />);
		expect(screen.getByText('Error: File missing')).toBeTruthy();
	});
});
